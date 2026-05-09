import { createFileRoute, Link } from "@tanstack/react-router";
import { useAssessment } from "@/lib/radar-store";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ShieldAlert, Mic2 } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Results — RADAR" }] }),
  component: Results,
});

function severityBadge(sev: string) {
  const s = (sev || "").toLowerCase();
  if (s.includes("crit")) return "bg-critical/15 text-critical border-critical/40";
  if (s.includes("warn")) return "bg-warning/15 text-warning border-warning/40";
  if (s.includes("valid") || s.includes("pass")) return "bg-success/15 text-success border-success/40";
  return "bg-muted text-muted-foreground border-border";
}

function asArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x == null) return [];
  return [x];
}

function Results() {
  const data = useAssessment();

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">No results yet</h1>
        <p className="mt-2 text-muted-foreground">Run an assessment to see the gap report and risk memo.</p>
        <Button asChild className="mt-6"><Link to="/assessment">Go to Assessment</Link></Button>
      </main>
    );
  }

  const cr = data.compliance_report;
  const ra = data.risk_actions;
  const reportIsObject = cr && typeof cr === "object";
  const actionsIsObject = ra && typeof ra === "object";

  const gaps = asArray(reportIsObject ? (cr.gaps ?? cr.findings ?? cr.items ?? []) : []);
  const tickets = asArray(actionsIsObject ? (ra.tickets ?? ra.remediation_tickets ?? ra.actions ?? []) : []);
  const memo = actionsIsObject ? (ra.investor_memo ?? ra.memo ?? ra) : null;

  const trustScore = actionsIsObject ? (ra.trust_score ?? ra.score ?? "—") : "—";
  const critical = actionsIsObject ? (ra.critical_gaps ?? gaps.filter((g) => /crit/i.test(g.severity || g.status || "")).length) : 0;
  const warn = actionsIsObject ? (ra.warning_gaps ?? gaps.filter((g) => /warn/i.test(g.severity || g.status || "")).length) : 0;
  const validated = actionsIsObject ? (ra.validated_controls ?? gaps.filter((g) => /valid|pass/i.test(g.severity || g.status || "")).length) : 0;
  const investorRisk = actionsIsObject ? (ra.investor_risk ?? memo?.investor_risk ?? "—") : "—";
  const founderRisk = actionsIsObject ? (ra.founder_risk ?? memo?.founder_risk ?? "—") : "—";
  const voiceScript = actionsIsObject ? (ra.voice_briefing_script ?? ra.voice_script ?? "") : "";

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Due Diligence Report</h1>
          <p className="mt-1 text-muted-foreground">{data.company_name}</p>
        </div>
        {data.isFallback && (
          <span className="rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
            Demo fallback — Dify not reached
          </span>
        )}
      </div>

      {/* Top cards */}
      <section className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <Stat label="Company" value={data.company_name} />
        <Stat label="Trust Score" value={String(trustScore)} accent="primary" />
        <Stat label="Critical Gaps" value={String(critical)} accent="critical" />
        <Stat label="Warning Gaps" value={String(warn)} accent="warning" />
        <Stat label="Validated" value={String(validated)} accent="success" />
        <Stat label="Investor Risk" value={String(investorRisk).split(" ")[0]} />
        <Stat label="Founder Risk" value={String(founderRisk).split(" ")[0]} />
      </section>

      {/* Compliance Report */}
      <Section title="Compliance Report" icon={<ShieldAlert className="h-5 w-5 text-primary" />}>
        {reportIsObject ? (
          <>
            {cr.summary && <p className="mb-6 text-sm text-card-foreground/80">{cr.summary}</p>}
            {gaps.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/40 text-left text-muted-foreground">
                    <tr>
                      {["Article","Title","Status","Severity","Evidence","Gap","Remediation","Owner","Deadline"].map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gaps.map((g, i) => (
                      <tr key={i} className="border-t border-border/40 align-top">
                        <td className="px-3 py-2 font-mono text-foreground">{g.article ?? "—"}</td>
                        <td className="px-3 py-2">{g.title ?? "—"}</td>
                        <td className="px-3 py-2">{g.status ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${severityBadge(g.severity || g.status || "")}`}>
                            {g.severity ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 max-w-[200px] text-muted-foreground">{g.policy_evidence ?? g.evidence ?? "—"}</td>
                        <td className="px-3 py-2 max-w-[220px]">{g.gap ?? "—"}</td>
                        <td className="px-3 py-2 max-w-[220px] text-muted-foreground">{g.remediation ?? "—"}</td>
                        <td className="px-3 py-2">{g.owner ?? "—"}</td>
                        <td className="px-3 py-2">{g.deadline ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <RawText value={data.raw?.compliance_report ?? JSON.stringify(cr, null, 2)} />
            )}
          </>
        ) : (
          <RawText value={data.raw?.compliance_report ?? String(cr ?? "")} />
        )}
      </Section>

      {/* Risk Memo */}
      <Section title="Risk Memo" icon={<AlertTriangle className="h-5 w-5 text-warning" />}>
        {memo && typeof memo === "object" ? (
          <div className="grid gap-6 md:grid-cols-2">
            <MemoBlock title="Investor Risk" value={memo.investor_risk ?? investorRisk} />
            <MemoBlock title="Founder Risk" value={memo.founder_risk ?? founderRisk} />
            <MemoList title="Top Red Flags" items={asArray(memo.red_flags ?? memo.top_red_flags)} />
            <MemoList title="Conditions Before Investment" items={asArray(memo.conditions ?? memo.conditions_before_investment)} />
            <div className="md:col-span-2 rounded-lg border border-primary/40 bg-primary/10 p-4">
              <div className="text-xs font-medium uppercase text-primary">Recommendation</div>
              <p className="mt-1 text-sm text-card-foreground">{memo.recommendation ?? "—"}</p>
            </div>
          </div>
        ) : (
          <RawText value={data.raw?.risk_actions ?? JSON.stringify(ra, null, 2)} />
        )}
      </Section>

      {/* Tickets */}
      {tickets.length > 0 && (
        <Section title="Remediation Tickets" icon={<CheckCircle2 className="h-5 w-5 text-success" />}>
          <div className="grid gap-3 md:grid-cols-2">
            {tickets.map((t, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-background/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary">{t.id ?? `RAD-${i + 1}`}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${severityBadge(t.priority || "")}`}>
                    {t.priority ?? "—"}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-semibold">{t.task ?? t.title ?? "—"}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{t.description ?? "—"}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <Meta k="Article" v={t.article ?? t.linked_article} />
                  <Meta k="Owner" v={t.owner} />
                  <Meta k="Deadline" v={t.deadline} />
                </dl>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Voice Briefing */}
      {voiceScript && (
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-8">
          <div className="flex items-center gap-2 text-primary">
            <Mic2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Executive Voice Briefing</h2>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{voiceScript}</p>
          <Button asChild className="mt-6"><Link to="/voice">Continue to Voice Agent</Link></Button>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "primary" | "critical" | "warning" | "success" }) {
  const ring = {
    primary: "border-primary/30",
    critical: "border-critical/30",
    warning: "border-warning/30",
    success: "border-success/30",
  }[accent || "primary"];
  const text = accent ? `text-${accent}` : "text-foreground";
  return (
    <div className={`rounded-xl border ${ring} bg-surface/60 p-4`}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 truncate text-lg font-semibold ${text}`} title={value}>{value || "—"}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card text-card-foreground p-6 md:p-8 shadow-sm">
      <div className="mb-4 flex items-center gap-2">{icon}<h2 className="text-lg font-semibold">{title}</h2></div>
      {children}
    </section>
  );
}

function MemoBlock({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{title}</div>
      <p className="mt-1 text-sm text-card-foreground">{String(value ?? "—")}</p>
    </div>
  );
}

function MemoList({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{title}</div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-card-foreground">
          {items.map((it, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{String(it)}</li>)}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

function Meta({ k, v }: { k: string; v: any }) {
  return (
    <div>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v ?? "—"}</dd>
    </div>
  );
}

function RawText({ value }: { value: string }) {
  return <pre className="whitespace-pre-wrap break-words rounded-lg bg-background/60 p-4 text-xs text-foreground/80">{value}</pre>;
}
