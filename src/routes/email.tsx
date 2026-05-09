import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAssessment } from "@/lib/radar-store";
import { Mail, Loader2 } from "lucide-react";

export const Route = createFileRoute("/email")({
  head: () => ({ meta: [{ title: "Send Report — RADAR" }] }),
  component: Email,
});

function Email() {
  const data = useAssessment();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Send Due Diligence Report</h1>
        <p className="mt-3 text-muted-foreground">Run an assessment first to generate a report.</p>
        <Button asChild className="mt-6"><Link to="/assessment">Go to Assessment</Link></Button>
      </main>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company_name: data.company_name,
          compliance_report: data.compliance_report,
          risk_actions: data.risk_actions,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setMsg({ type: "ok", text: j.message || "Report sent." });
      else setMsg({ type: "err", text: j.error || "Failed to send." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-2 text-primary">
        <Mail className="h-5 w-5" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Send Due Diligence Report</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Email the full RADAR report for {data.company_name}.</p>

      <form onSubmit={send} className="mt-8 rounded-2xl border border-border/60 bg-surface/60 p-6">
        <Label className="text-sm font-medium">Recipient Email</Label>
        <Input type="email" required className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@vc.com" />
        <Button type="submit" className="mt-4" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send Report
        </Button>
        {msg && (
          <div className={`mt-4 rounded-lg border p-3 text-sm ${msg.type === "ok" ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}>
            {msg.text}
          </div>
        )}
      </form>
    </main>
  );
}
