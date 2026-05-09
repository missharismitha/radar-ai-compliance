import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runDifyAssessment } from "@/lib/dify.functions";
import { saveAssessment, FINCORE_DEMO, type AssessmentInputs } from "@/lib/radar-store";
import { AlertCircle, Upload, Loader2 } from "lucide-react";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Run Assessment — RADAR" },
      { name: "description", content: "Run an AI Act compliance assessment against your policy text." },
    ],
  }),
  component: AssessmentPage,
});

const STEPS = [
  "Reading company policy",
  "Retrieving EU AI Act obligations",
  "Comparing policy against regulation",
  "Generating gap report",
  "Creating risk memo and action tickets",
  "Preparing executive briefing",
];

function AssessmentPage() {
  const navigate = useNavigate();
  const runDify = useServerFn(runDifyAssessment);
  const [form, setForm] = useState<AssessmentInputs>({
    company_name: "",
    industry: "",
    country: "",
    company_stage: "",
    product_description: "",
    policy_text: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<{ status: number; message: string; suggestion?: string } | null>(null);

  const update = (k: keyof AssessmentInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadDemo = () => setForm(FINCORE_DEMO);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, policy_text: String(reader.result || "") }));
      reader.readAsText(file);
    } else {
      alert("For demo reliability, paste extracted policy text below.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStep(0);
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1500);
    try {
      const res = await runDify({ data: form });
      if (res.ok) {
        saveAssessment({
          company_name: res.company_name,
          compliance_report: res.compliance_report,
          risk_actions: res.risk_actions,
          raw: res.raw,
          isFallback: res.isFallback,
        });
        navigate({ to: "/results" });
      } else {
        setError({ status: res.status, message: res.message, suggestion: res.suggestion });
      }
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Run AI Compliance Assessment</h1>
      <p className="mt-2 text-muted-foreground">
        Provide company context and paste your AI policy. RADAR will analyse it against EU AI Act obligations.
      </p>

      <form onSubmit={submit} className="mt-8 rounded-xl border border-border/60 bg-surface/60 p-8 backdrop-blur">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Company Name"><Input required value={form.company_name} onChange={update("company_name")} /></Field>
          <Field label="Industry"><Input required value={form.industry} onChange={update("industry")} /></Field>
          <Field label="Country / Market"><Input required value={form.country} onChange={update("country")} /></Field>
          <Field label="Company Stage"><Input required value={form.company_stage} onChange={update("company_stage")} placeholder="Seed, Series A…" /></Field>
        </div>

        <div className="mt-6">
          <Field label="Product Description">
            <Textarea required rows={3} value={form.product_description} onChange={update("product_description")} />
          </Field>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Company Policy Text</Label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary">
              <Upload className="h-3.5 w-3.5" /> Upload PDF / TXT / DOCX
              <input type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={onFile} />
            </label>
          </div>
          <Textarea required rows={10} className="mt-2 font-mono text-xs" value={form.policy_text} onChange={update("policy_text")} placeholder="Paste your AI policy text here…" />
          <p className="mt-1 text-xs text-muted-foreground">For demo reliability, paste extracted policy text below.</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-critical/50 bg-critical/10 p-4 text-sm text-critical-foreground">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-critical" />
              <div>
                <div className="font-semibold text-critical">Dify request failed (HTTP {error.status})</div>
                <div className="mt-1 text-foreground/80">{error.message}</div>
                {error.suggestion && <div className="mt-2 text-muted-foreground">{error.suggestion}</div>}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-lg border border-border bg-background/60 p-4">
            <ol className="space-y-2 text-sm">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  {i < step ? (
                    <span className="h-2 w-2 rounded-full bg-success" />
                  ) : i === step ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted" />
                  )}
                  <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={loadDemo} disabled={loading}>Load FinCore Demo</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Running assessment…" : "Run RADAR Assessment"}
          </Button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
