import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAssessment } from "@/lib/radar-store";
import { sendReportByEmail } from "@/services/emailService";
import { Mail, Loader2, CheckCircle2, AlertCircle, Download, ChevronRight } from "lucide-react";
import { downloadReport } from "@/services/reportService";

export const Route = createFileRoute("/email")({
  head: () => ({ meta: [{ title: "Send Report — RADAR AI" }] }),
  component: Email,
});

function Email() {
  const data = useAssessment();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; isDemo?: boolean } | null>(null);

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface/60 border border-border/60 mb-6">
          <Mail className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Send Compliance Report</h1>
        <p className="mt-3 text-muted-foreground">Generate a report first, then email it to stakeholders.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/assessment">Run Assessment</Link></Button>
          <Button asChild variant="outline"><Link to="/">Try Demo</Link></Button>
        </div>
      </main>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await sendReportByEmail(email, data);
    setResult(res);
    setLoading(false);
  };

  const ra = data.risk_actions ?? {};
  const cr = data.compliance_report ?? {};

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Delivery Agent</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Send Compliance Report</h1>
        <p className="mt-1 text-muted-foreground">
          Email the full RADAR compliance report for <span className="text-foreground font-medium">{data.company_name}</span>.
        </p>
      </div>

      {/* Report preview card */}
      <div className="mb-6 rounded-2xl border border-border/60 bg-surface/60 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Report Contents</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          {[
            { label: "Trust Score", value: ra.trust_score ?? "—", color: "text-primary" },
            { label: "Critical Gaps", value: ra.critical_gaps ?? 0, color: "text-critical" },
            { label: "Investor Risk", value: String(ra.investor_risk ?? "—").split(" ")[0], color: "text-warning" },
            { label: "Tickets", value: Array.isArray(ra.tickets) ? ra.tickets.length : 0, color: "text-success" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border/40 bg-background/40 p-3 text-center">
              <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
              <div className="text-[11px] text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["Executive Summary", "Gap Analysis Table", "Risk Memo", "Remediation Tickets", "Voice Briefing Script"].map((item) => (
            <span key={item} className="rounded-full border border-border/40 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Email form */}
      <form onSubmit={handleSend} className="rounded-2xl border border-border/60 bg-surface/60 p-6 space-y-4">
        <div>
          <Label className="text-sm font-medium">Recipient Email Address</Label>
          <Input
            type="email"
            required
            className="mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@vcfirm.com"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The full HTML compliance report will be sent as an attachment.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending Report…
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Compliance Report
            </>
          )}
        </Button>

        {result && (
          <div className={`rounded-xl border p-4 ${
            result.ok
              ? "border-success/40 bg-success/10"
              : "border-critical/40 bg-critical/10"
          }`}>
            <div className="flex items-start gap-3">
              {result.ok ? (
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-critical mt-0.5 shrink-0" />
              )}
              <div>
                <p className={`text-sm font-medium ${result.ok ? "text-success" : "text-critical"}`}>
                  {result.ok ? "Report sent successfully" : "Delivery failed"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                {result.isDemo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    To send real emails, connect <code className="text-primary">EMAIL_API_KEY</code> (Resend API key).
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Download alternative */}
      <div className="mt-4 rounded-xl border border-border/50 bg-surface/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Download Instead</p>
            <p className="text-xs text-muted-foreground mt-0.5">Get the report as a polished HTML file for printing or sharing.</p>
          </div>
          <Button onClick={() => downloadReport(data)} variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download HTML
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="h-3 w-3" />
        Connect Resend API key (<code>EMAIL_API_KEY</code>) to enable real email delivery.
        <Link to="/results" className="ml-auto flex items-center gap-1 text-primary hover:underline">
          View Report <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </main>
  );
}
