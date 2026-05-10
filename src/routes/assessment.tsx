import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runDifyAssessment } from "@/lib/dify.functions";
import {
  saveAssessment,
  FINCORE_DEMO, MEDTRIAGE_DEMO, INDUSTRIAL_DEMO,
  type AssessmentInputs,
} from "@/lib/radar-store";
import { AgentWorkflow } from "@/components/AgentWorkflow";
import { AlertCircle, Upload, Building2, Stethoscope, Factory, FileText, Zap } from "lucide-react";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Run Assessment — RADAR AI Compliance Agent" },
      { name: "description", content: "Upload a policy document and run an AI Act compliance assessment." },
    ],
  }),
  component: AssessmentPage,
});

const DEMO_SCENARIOS = [
  {
    label: "FinCore AG",
    sublabel: "Credit AI · High Risk",
    icon: Building2,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    data: FINCORE_DEMO,
  },
  {
    label: "MedTriage GmbH",
    sublabel: "Medical AI · High Risk",
    icon: Stethoscope,
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    data: MEDTRIAGE_DEMO,
  },
  {
    label: "AutoVision Systems",
    sublabel: "Industrial AI · Med Risk",
    icon: Factory,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    data: INDUSTRIAL_DEMO,
  },
];

// 5 workflow steps (indexed 0–4)
const STEP_COUNT = 5;

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
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<{ status: number; message: string; suggestion?: string } | null>(null);

  const update =
    (k: keyof AssessmentInputs) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadDemo = (data: AssessmentInputs) => {
    setForm(data);
    setFileName(null);
    setError(null);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, policy_text: String(reader.result || "") }));
      reader.readAsText(file);
    } else {
      // For PDF/DOCX: in production, connect a server-side PDF parser here.
      // For demo, we prompt the user to paste the extracted text.
      alert(
        "PDF/DOCX parsing requires a backend parser. For the demo, paste extracted policy text in the field below — or load one of the demo scenarios.",
      );
      setFileName(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setCurrentStep(0);

    // Advance steps every 1.5 s to simulate agent progress
    const interval = setInterval(() => {
      setCurrentStep((s) => Math.min(s + 1, STEP_COUNT - 1));
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
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Zap className="h-3 w-3" /> Agentic Assessment
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Run AI Compliance Assessment</h1>
        <p className="mt-2 text-muted-foreground">
          Provide your AI system context and policy text. RADAR will analyze it against EU AI Act obligations using a 5-step Dify workflow.
        </p>
      </div>

      {/* Demo scenario quick-load */}
      <div className="mb-8 rounded-2xl border border-border/60 bg-surface/40 p-5">
        <p className="mb-3 text-sm font-medium">Quick Load — Demo Scenarios</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DEMO_SCENARIOS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => loadDemo(s.data)}
                disabled={loading}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all hover:bg-secondary/50 disabled:opacity-50 ${s.bg}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${s.color}`} />
                <div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={submit} className="rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name">
              <Input required value={form.company_name} onChange={update("company_name")} placeholder="Acme AI Ltd" disabled={loading} />
            </Field>
            <Field label="Industry">
              <Input required value={form.industry} onChange={update("industry")} placeholder="Fintech, HealthTech…" disabled={loading} />
            </Field>
            <Field label="Country / Market">
              <Input required value={form.country} onChange={update("country")} placeholder="Germany / EU market" disabled={loading} />
            </Field>
            <Field label="Company Stage">
              <Input required value={form.company_stage} onChange={update("company_stage")} placeholder="Seed, Series A…" disabled={loading} />
            </Field>
          </div>

          <Field label="AI Product Description">
            <Textarea
              required
              rows={2}
              value={form.product_description}
              onChange={update("product_description")}
              placeholder="Describe your AI system and its use case…"
              disabled={loading}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Policy / Documentation Text</Label>
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary ${loading ? "opacity-50 pointer-events-none" : ""}`}>
                <Upload className="h-3.5 w-3.5" />
                {fileName ? (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-primary" />
                    {fileName.length > 20 ? fileName.slice(0, 20) + "…" : fileName}
                  </span>
                ) : (
                  "Upload PDF / TXT"
                )}
                <input type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={onFile} disabled={loading} />
              </label>
            </div>
            <Textarea
              required
              rows={10}
              className="font-mono text-xs"
              value={form.policy_text}
              onChange={update("policy_text")}
              placeholder="Paste your AI policy, governance framework, or system documentation here…"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              For PDFs: paste extracted text. Connect a PDF parser (pdfjs-dist) for production use.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-critical/50 bg-critical/10 p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-critical shrink-0" />
                <div>
                  <div className="font-semibold text-critical">Assessment failed (HTTP {error.status})</div>
                  <div className="mt-1 text-foreground/80">{error.message}</div>
                  {error.suggestion && <div className="mt-2 text-muted-foreground">{error.suggestion}</div>}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Running Assessment…" : "Run Agentic Assessment"}
            </Button>
          </div>
        </form>

        {/* Right panel: workflow or info */}
        <div>
          {loading ? (
            <AgentWorkflow currentStep={currentStep} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur">
                <h3 className="text-sm font-semibold mb-3">Dify workflow steps:</h3>
                <ol className="space-y-3">
                  {[
                    "User Input — reads company and policy details",
                    "Knowledge Retrieval — queries EU AI Act obligations from Dify Knowledge Base",
                    "Gap Analysis Agent — identifies compliance gaps",
                    "Risk and Action Agent — creates risk memo and remediation tickets",
                    "Output — prepares final compliance report",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-foreground/80 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
