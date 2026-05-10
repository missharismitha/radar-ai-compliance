import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAssessment } from "@/lib/radar-store";
import { downloadReport } from "@/services/reportService";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, CheckCircle2, ShieldAlert, Mic2, Download, Mail, MessageSquare,
  FileText, BarChart3, Printer, ChevronRight, ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Compliance Report — RADAR AI" }] }),
  component: Results,
});

// Parse JSON string → object; return as-is if already an object or null.
function safeParse(v: any): any {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
}

function asArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x == null) return [];
  return [x];
}

function severityClass(sev: string) {
  const s = (sev || "").toLowerCase();
  if (s.includes("crit")) return "bg-critical/15 text-critical border-critical/40";
  if (s.includes("warn")) return "bg-warning/15 text-warning border-warning/40";
  if (s.includes("valid") || s.includes("pass")) return "bg-success/15 text-success border-success/40";
  return "bg-muted/50 text-muted-foreground border-border/40";
}

function Results() {
  const data = useAssessment();
  const [showRaw, setShowRaw] = useState(false);

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface/60 border border-border/60 mb-6">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">No report yet</h1>
        <p className="mt-2 text-muted-foreground">
          Run an assessment or try a demo scenario to generate a compliance report.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/assessment">Run Assessment</Link></Button>
          <Button asChild variant="outline"><Link to="/">View Demo Scenarios</Link></Button>
        </div>
      </main>
    );
  }

  // Parse if Dify returned JSON strings
  const cr = safeParse(data.compliance_report);
  const ra = safeParse(data.risk_actions);
  const crObj = cr && typeof cr === "object";
  const raObj = ra && typeof ra === "object";

  // Gaps array from compliance_report
  const gaps: any[] = crObj ? asArray(cr.gaps ?? []) : [];

  // Tickets from risk_actions
  const tickets: any[] = raObj ? asArray(ra.tickets ?? []) : [];

  // Risk memo: new Dify field = risk_memo; old demo field = investor_memo
  const memo: any = raObj ? (ra.risk_memo ?? ra.investor_memo ?? null) : null;

  // Trust score: new Dify puts it in cr; old demo puts it in ra
  const trustScore = (crObj ? cr.trust_score : undefined)
    ?? (raObj ? ra.trust_score : undefined)
    ?? "—";

  // Gap counts: new Dify = cr.critical_count; old demo = ra.critical_gaps; fallback = count from gaps
  const critical = (crObj ? cr.critical_count : undefined)
    ?? (raObj ? ra.critical_gaps : undefined)
    ?? gaps.filter((g) => /crit/i.test(g.severity ?? g.status ?? "")).length;
  const warn = (crObj ? cr.warning_count : undefined)
    ?? (raObj ? ra.warning_gaps : undefined)
    ?? gaps.filter((g) => /warn/i.test(g.severity ?? g.status ?? "")).length;
  const validated = (crObj ? cr.validated_count : undefined)
    ?? (raObj ? ra.validated_controls : undefined)
    ?? gaps.filter((g) => /valid|pass/i.test(g.severity ?? g.status ?? "")).length;

  // Investor / founder risk: prefer memo fields, then top-level ra fields
  const investorRisk = memo?.investor_risk ?? (raObj ? ra.investor_risk : undefined) ?? "—";
  const founderRisk = memo?.founder_risk ?? (raObj ? ra.founder_risk : undefined) ?? "—";

  // Red flags and conditions: new Dify names first, then old demo names
  const redFlags = asArray(memo?.top_red_flags ?? memo?.red_flags);
  const conditions = asArray(memo?.conditions_before_investment ?? memo?.conditions);

  const voiceScript: string = raObj ? (ra.voice_briefing_script ?? "") : "";
  const riskClass: string = crObj ? (cr.risk_class ?? "") : "";

  // Strings for the raw output panel
  const crRawStr = typeof data.compliance_report === "string"
    ? data.compliance_report
    : JSON.stringify(data.compliance_report, null, 2);
  const raRawStr = typeof data.risk_actions === "string"
    ? data.risk_actions
    : JSON.stringify(data.risk_actions, null, 2);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-8 print:space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              EU AI Act Compliance Report
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{data.company_name}</h1>
          {riskClass && (
            <p className="mt-1 text-sm text-muted-foreground">{riskClass}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button onClick={() => downloadReport(data)} variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download HTML
          </Button>
          <Button onClick={() => window.print()} variant="outline" size="sm">
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/chat"><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Ask RADAR</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/email"><Mail className="h-3.5 w-3.5 mr-1.5" /> Email Report</Link>
          </Button>
        </div>
      </div>

      {/* ── 1. Top metric cards ─────────────────────────────────────── */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Trust Score" value={String(trustScore)} accent="primary" large />
        <Stat label="Critical Gaps" value={String(critical)} accent="critical" />
        <Stat label="Warnings" value={String(warn)} accent="warning" />
        <Stat label="Validated" value={String(validated)} accent="success" />
        <Stat label="Investor Risk" value={String(investorRisk).split(" ")[0]} accent="critical" />
        <Stat label="Founder Risk" value={String(founderRisk).split(" ")[0]} />
      </section>

      {/* ── 2. Executive Summary ────────────────────────────────────── */}
      {crObj && cr.summary ? (
        <Section title="Executive Summary" icon={<FileText className="h-5 w-5 text-primary" />}>
          <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-5">
            <p className="text-sm leading-relaxed text-card-foreground/90">{cr.summary}</p>
          </div>
          {cr.eu_ai_act_applicability && (
            <div className="mt-4 rounded-xl bg-background/40 border border-border/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                EU AI Act Applicability
              </p>
              <p className="text-sm text-foreground/80">{cr.eu_ai_act_applicability}</p>
            </div>
          )}
        </Section>
      ) : null}

      {/* ── 3. Compliance Gap Analysis ──────────────────────────────── */}
      <Section title="Compliance Gap Analysis" icon={<ShieldAlert className="h-5 w-5 text-primary" />}>
        {gaps.length > 0 ? (
          <div className="space-y-4">
            {gaps.map((g: any, i: number) => <GapCard key={i} gap={g} />)}
          </div>
        ) : crObj ? (
          <p className="text-sm text-muted-foreground">No gaps listed in the compliance report.</p>
        ) : (
          <UnparsedBlock value={String(data.compliance_report ?? "")} />
        )}
      </Section>

      {/* ── 4. Investor & Founder Risk Memo ────────────────────────── */}
      <Section title="Investor & Founder Risk Memo" icon={<AlertTriangle className="h-5 w-5 text-warning" />}>
        {memo && typeof memo === "object" ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <MemoBlock title="Investor Risk" value={investorRisk} />
              <MemoBlock title="Founder Risk" value={founderRisk} />
              <MemoBlock title="Estimated Compliance Delay" value={memo.estimated_compliance_delay} />
              <MemoBlock title="Estimated Compliance Cost" value={memo.estimated_compliance_cost} />
              <MemoBlock title="Financial Exposure" value={memo.financial_exposure} />
              <MemoBlock title="Fundability Impact" value={memo.fundability_impact} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <MemoList title="Top Red Flags" items={redFlags} dot="text-critical" dotChar="●" />
              <MemoList title="Conditions Before Investment" items={conditions} dot="text-primary" dotChar="→" />
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
                RADAR Recommendation
              </p>
              <p className="text-sm font-medium text-card-foreground">
                {memo.recommendation ?? "Not provided"}
              </p>
            </div>
          </div>
        ) : raObj ? (
          // ra is an object but risk_memo/investor_memo were not found — show what we have
          <div className="grid gap-4 md:grid-cols-2">
            <MemoBlock title="Investor Risk" value={investorRisk} />
            <MemoBlock title="Founder Risk" value={founderRisk} />
          </div>
        ) : (
          <UnparsedBlock value={String(data.risk_actions ?? "")} />
        )}
      </Section>

      {/* ── 5. Remediation Tickets ──────────────────────────────────── */}
      {tickets.length > 0 && (
        <Section title="Remediation Tickets" icon={<CheckCircle2 className="h-5 w-5 text-success" />}>
          <div className="grid gap-4 md:grid-cols-2">
            {tickets.map((t: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-border/40 bg-background/40 p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-primary">
                    {t.ticket_id ?? t.id ?? `RAD-${String(i + 1).padStart(3, "0")}`}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass(t.priority ?? "")}`}>
                    {t.priority ?? "—"}
                  </span>
                </div>
                <h4 className="text-sm font-semibold mb-2">{t.task ?? t.title ?? "—"}</h4>
                {t.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.description}</p>
                )}
                {t.acceptance_criteria && (
                  <p className="text-xs text-foreground/60 italic mb-3">{t.acceptance_criteria}</p>
                )}
                <dl className="grid grid-cols-3 gap-2 text-[11px] bg-secondary/30 rounded-lg p-3">
                  <TicketMeta k="Article" v={t.linked_article ?? t.article} />
                  <TicketMeta k="Owner" v={t.owner} />
                  <TicketMeta k="Deadline" v={t.deadline} />
                </dl>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 6. Voice Briefing Script ────────────────────────────────── */}
      {voiceScript ? (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <Mic2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Executive Voice Briefing Script</h2>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{voiceScript}</p>
          <Button asChild className="mt-5">
            <Link to="/voice">
              <Mic2 className="h-4 w-4 mr-2" />
              Open Voice Agent <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </section>
      ) : null}

      {/* ── 7. Raw Dify output (collapsed) ─────────────────────────── */}
      <div className="rounded-2xl border border-border/40 bg-surface/40 print:hidden">
        <button
          onClick={() => setShowRaw((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>View raw Dify output</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showRaw ? "rotate-180" : ""}`} />
        </button>
        {showRaw && (
          <div className="border-t border-border/30 px-5 pb-5 pt-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                compliance_report
              </p>
              <pre className="whitespace-pre-wrap break-words rounded-xl bg-background/60 p-4 text-xs text-foreground/80 border border-border/30 max-h-96 overflow-y-auto">
                {crRawStr || "—"}
              </pre>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                risk_actions
              </p>
              <pre className="whitespace-pre-wrap break-words rounded-xl bg-background/60 p-4 text-xs text-foreground/80 border border-border/30 max-h-96 overflow-y-auto">
                {raRawStr || "—"}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ── Next Steps ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-surface/60 p-6 print:hidden">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Next Steps</h3>
          <p className="text-xs text-muted-foreground mt-1">Explore the full RADAR workflow</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link to="/chat">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Ask Questions</span>
              <span className="text-xs text-muted-foreground">Chat with your report</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link to="/voice">
              <Mic2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Voice Briefing</span>
              <span className="text-xs text-muted-foreground">Speak to RADAR</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link to="/email">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Email Report</span>
              <span className="text-xs text-muted-foreground">Send to stakeholders</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="h-3 w-3" />
        Generated by RADAR AI Compliance Agent · EU AI Act assessment · Not legal advice
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GapCard({ gap }: { gap: any }) {
  const sev: string = gap.severity ?? gap.status ?? "";
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 overflow-hidden">
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-secondary/30 border-b border-border/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-bold text-primary shrink-0">
            {gap.article ?? "—"}
          </span>
          <span className="text-sm font-semibold truncate">{gap.title ?? "—"}</span>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass(sev)}`}>
          {sev || "—"}
        </span>
      </div>

      <div className="p-5 space-y-3">
        {gap.legal_obligation && (
          <p className="text-xs text-muted-foreground italic">{gap.legal_obligation}</p>
        )}

        {gap.policy_evidence && (
          <GapField label="Policy Evidence" value={gap.policy_evidence} />
        )}
        {gap.gap && (
          <GapField label="Gap Found" value={gap.gap} variant="critical" />
        )}
        {gap.remediation && (
          <GapField label="Remediation" value={gap.remediation} variant="success" />
        )}

        <dl className="grid grid-cols-3 gap-2 text-[11px] bg-secondary/30 rounded-lg p-3 mt-1">
          <TicketMeta k="Owner" v={gap.owner} />
          <TicketMeta k="Deadline" v={gap.deadline} />
          <TicketMeta k="Status" v={gap.status ?? gap.severity} />
        </dl>
      </div>
    </div>
  );
}

function GapField({ label, value, variant }: { label: string; value: string; variant?: "critical" | "success" }) {
  const border =
    variant === "critical" ? "border-critical/20 bg-critical/5" :
    variant === "success" ? "border-success/20 bg-success/5" :
    "border-border/20 bg-background/30";
  return (
    <div className={`rounded-lg border ${border} p-3`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-xs leading-relaxed text-foreground/85">{value}</p>
    </div>
  );
}

function Stat({
  label, value, accent, large,
}: {
  label: string; value: string; accent?: "primary" | "critical" | "warning" | "success"; large?: boolean;
}) {
  const ringMap: Record<string, string> = {
    primary: "border-primary/30", critical: "border-critical/30",
    warning: "border-warning/30", success: "border-success/30",
  };
  const textMap: Record<string, string> = {
    primary: "text-primary", critical: "text-critical",
    warning: "text-warning", success: "text-success",
  };
  return (
    <div className={`rounded-xl border ${accent ? ringMap[accent] : "border-border/50"} bg-surface/60 p-4`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-1 truncate font-bold ${large ? "text-2xl" : "text-lg"} ${accent ? textMap[accent] : "text-foreground"}`}
        title={value}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card text-card-foreground p-6 md:p-8 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MemoBlock({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <p className="text-sm text-card-foreground">{value != null ? String(value) : "Not provided"}</p>
    </div>
  );
}

function MemoList({
  title, items, dot = "text-primary", dotChar = "•",
}: {
  title: string; items: any[]; dot?: string; dotChar?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((it: any, i: number) => (
            <li key={i} className="flex gap-2 text-sm text-card-foreground">
              <span className={`shrink-0 font-bold mt-0.5 ${dot}`}>{dotChar}</span>
              <span>{String(it)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Not provided</p>
      )}
    </div>
  );
}

function TicketMeta({ k, v }: { k: string; v: any }) {
  return (
    <div>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{v ?? "—"}</dd>
    </div>
  );
}

// Shown when the raw value is a non-parseable string (not a code block)
function UnparsedBlock({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!value) return <p className="text-sm text-muted-foreground">No data provided.</p>;
  const limit = 600;
  const truncate = value.length > limit && !expanded;
  return (
    <div className="rounded-xl border border-border/30 bg-background/40 p-4">
      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
        {truncate ? value.slice(0, limit) + "…" : value}
      </p>
      {value.length > limit && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
