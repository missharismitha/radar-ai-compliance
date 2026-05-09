import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Radar, ShieldCheck, Workflow, FileSearch, Mic } from "lucide-react";
import { saveAssessment, FINCORE_DEMO } from "@/lib/radar-store";
import { useServerFn } from "@tanstack/react-start";
import { runDifyAssessment } from "@/lib/dify.functions";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "Real EU AI Act Knowledge Base", desc: "Obligations mapped from the official EU AI Act, by article." },
  { icon: Workflow, title: "Multi-Agent Dify Workflow", desc: "Orchestrated agents for retrieval, comparison, and reporting." },
  { icon: FileSearch, title: "Evidence-Based Gap Report", desc: "Every gap cites the policy line and the article it violates." },
  { icon: Mic, title: "Voice and Email Briefing Ready", desc: "Executive briefing as audio or sent to your inbox." },
];

function Index() {
  const navigate = useNavigate();
  const runDify = useServerFn(runDifyAssessment);
  const [demoLoading, setDemoLoading] = useState(false);

  const tryDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await runDify({ data: FINCORE_DEMO });
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
        navigate({ to: "/assessment" });
      }
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <section className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
          <Radar className="h-3.5 w-3.5" /> EU AI Act Due Diligence Engine
        </div>
        <h1 className="mt-6 text-7xl font-bold tracking-tight">
          <span className="text-gradient">RADAR</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl font-medium text-foreground/90">
          AI Regulatory Due Diligence for EU AI Act Compliance
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
          Upload or paste an AI policy. RADAR compares it against EU AI Act obligations using a real
          Dify workflow and generates a gap report, risk memo, remediation tickets, and executive briefing.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="px-6">
            <Link to="/assessment">Start Assessment</Link>
          </Button>
          <Button onClick={tryDemo} disabled={demoLoading} size="lg" variant="outline" className="px-6">
            {demoLoading ? "Running FinCore demo…" : "Try FinCore Demo"}
          </Button>
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border/60 bg-surface/60 p-6 backdrop-blur">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <p className="mt-16 text-center text-xs text-muted-foreground">
        RADAR is a compliance support tool and does not provide legal advice.
      </p>
    </main>
  );
}
