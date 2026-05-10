import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Radar, ShieldCheck, Workflow, FileSearch, Mic, FileText, ShieldAlert, BookOpen,
  AlertTriangle, Search, FileCheck, Mail, ArrowRight, ChevronRight, Zap, BarChart3,
  CheckCircle2, XCircle, Users, Building2, Stethoscope, Factory,
} from "lucide-react";
import { saveAssessment, FINCORE_RESULT, MEDTRIAGE_RESULT, INDUSTRIAL_RESULT } from "@/lib/radar-store";

export const Route = createFileRoute("/")({
  component: Index,
});

const AGENTS = [
  {
    id: 1,
    name: "Document Intake",
    role: "Parses and structures policy text, extracts key AI system descriptors.",
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    id: 2,
    name: "Risk Classification",
    role: "Applies EU AI Act Annex III taxonomy to determine risk category.",
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  {
    id: 3,
    name: "EU AI Act Mapping",
    role: "Maps policy coverage against 47 applicable EU AI Act articles.",
    icon: BookOpen,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    id: 4,
    name: "Gap Analysis",
    role: "Identifies specific compliance gaps with article-level citations.",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    id: 5,
    name: "Evidence Retrieval",
    role: "Traces each gap finding to exact language in the source document.",
    icon: Search,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    id: 6,
    name: "Report Generation",
    role: "Produces structured report with risk score, tickets, and risk memo.",
    icon: FileCheck,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    id: 7,
    name: "Briefing & Delivery",
    role: "Delivers findings via conversational chat, voice briefing, and email.",
    icon: Mail,
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const DEMOS = [
  {
    id: "fincore",
    name: "FinCore AG",
    type: "AI Credit Scoring",
    industry: "Fintech",
    icon: Building2,
    riskLabel: "High Risk",
    riskColor: "text-red-400",
    riskBg: "bg-red-400/10 border-red-400/20",
    score: 38,
    criticals: 3,
    desc: "SME loan eligibility AI system with missing risk management, transparency, and data governance.",
    result: FINCORE_RESULT,
  },
  {
    id: "medtriage",
    name: "MedTriage GmbH",
    type: "Medical AI Triage",
    industry: "HealthTech",
    icon: Stethoscope,
    riskLabel: "High Risk",
    riskColor: "text-red-400",
    riskBg: "bg-red-400/10 border-red-400/20",
    score: 52,
    criticals: 2,
    desc: "Emergency patient triage AI at hospital level. Missing incident reporting and clinical data governance.",
    result: MEDTRIAGE_RESULT,
  },
  {
    id: "industrial",
    name: "AutoVision Systems",
    type: "Industrial Vision AI",
    industry: "Manufacturing",
    icon: Factory,
    riskLabel: "Medium Risk",
    riskColor: "text-amber-400",
    riskBg: "bg-amber-400/10 border-amber-400/20",
    score: 65,
    criticals: 1,
    desc: "Automated defect detection on automotive production lines. Strongest posture of the three scenarios.",
    result: INDUSTRIAL_RESULT,
  },
];

const RAG_VS_AGENTIC = [
  { rag: "Retrieves relevant context chunks", radar: "Document Intake Agent structures the full policy" },
  { rag: "Passes context to a single LLM call", radar: "Risk Classification Agent applies Annex III taxonomy" },
  { rag: "Produces a general summary", radar: "EU AI Act Mapping Agent scores 47 article obligations" },
  { rag: "No structured compliance output", radar: "Gap Analysis Agent identifies specific violations" },
  { rag: "Cannot trace findings to source", radar: "Evidence Agent cites exact policy language" },
  { rag: "No actionable deliverables", radar: "Report Agent generates risk score, tickets, and memo" },
  { rag: "Single response, no follow-up", radar: "Briefing Agent enables chat, voice, and email delivery" },
];

function DemoCard({ demo, onTry }: { demo: typeof DEMOS[0]; onTry: () => void }) {
  const Icon = demo.icon;
  return (
    <div className="group relative rounded-2xl border border-border/60 bg-surface/60 p-6 transition-all hover:border-primary/40 hover:bg-surface/80 backdrop-blur">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${demo.riskBg} border`}>
          <Icon className={`h-5 w-5 ${demo.riskColor}`} />
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${demo.riskBg} ${demo.riskColor}`}>
          {demo.riskLabel}
        </span>
      </div>

      <h3 className="font-semibold">{demo.name}</h3>
      <p className="text-xs text-primary">{demo.type} · {demo.industry}</p>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{demo.desc}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-background/40 p-3">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{demo.score}</div>
          <div className="text-[10px] text-muted-foreground">Trust Score</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">{demo.criticals}</div>
          <div className="text-[10px] text-muted-foreground">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">√</div>
          <div className="text-[10px] text-muted-foreground">Report</div>
        </div>
      </div>

      <Button onClick={onTry} className="mt-4 w-full" variant="outline" size="sm">
        View Demo Report <ArrowRight className="ml-2 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function Index() {
  const navigate = useNavigate();

  const tryDemo = (result: typeof FINCORE_RESULT) => {
    saveAssessment(result);
    navigate({ to: "/results" });
  };

  return (
    <main className="mx-auto max-w-7xl px-6 pb-24">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Radar className="h-3.5 w-3.5" />
          EU AI Act Compliance Agent · 7 Specialized Agents · Hackathon Demo
        </div>

        <h1 className="text-6xl font-bold tracking-tight sm:text-7xl">
          <span className="text-gradient">RADAR</span>
        </h1>
        <p className="mt-2 text-xl font-semibold text-foreground/90">AI Compliance Agent</p>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
          Upload an AI policy document. Seven specialized agents analyze it against EU AI Act obligations,
          identify compliance gaps, generate evidence-based reports, and deliver via chat, voice, and email.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="px-8">
            <Link to="/assessment">
              Start Assessment <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            onClick={() => tryDemo(FINCORE_RESULT)}
            size="lg"
            variant="outline"
            className="px-8"
          >
            Try Live Demo
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {["High-Risk Classification", "Gap Analysis", "Evidence Tracing", "Risk Scoring", "Voice Briefing", "Email Delivery"].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-primary" /> {f}
            </span>
          ))}
        </div>
      </section>

      {/* ── Metrics Strip ─────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Risk Level", value: "HIGH", accent: "text-red-400", sublabel: "FinCore AG demo" },
          { label: "Compliance Gaps", value: "6", accent: "text-amber-400", sublabel: "Articles violated" },
          { label: "Articles Mapped", value: "47", accent: "text-primary", sublabel: "EU AI Act coverage" },
          { label: "Report Status", value: "READY", accent: "text-green-400", sublabel: "All sections generated" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-border/60 bg-surface/60 p-5 text-center backdrop-blur">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
            <div className={`mt-1 text-3xl font-bold ${m.accent}`}>{m.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{m.sublabel}</div>
          </div>
        ))}
      </section>

      {/* ── Agent Pipeline ────────────────────────────────────── */}
      <section className="mt-24">
        <div className="mb-3 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" /> Agentic Architecture
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight">
          7 Specialized Agents.<br className="sm:hidden" /> Not a Single Prompt.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Each agent has a defined role and responsibility. Together they coordinate to produce
          audit-grade compliance reports that no single LLM call can match.
        </p>

        <div className="mt-12 relative">
          {/* Pipeline connector line */}
          <div className="absolute top-8 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" style={{ top: "32px" }} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} className="relative group">
                  <div className="rounded-2xl border border-border/60 bg-surface/80 p-4 text-center transition-all hover:border-primary/40 hover:bg-surface backdrop-blur h-full">
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${agent.bg} mb-3`}>
                      <Icon className={`h-6 w-6 ${agent.color}`} />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Agent {agent.id}
                    </div>
                    <h3 className="text-xs font-semibold leading-tight">{agent.name}</h3>
                    <p className="mt-2 text-[11px] text-muted-foreground leading-snug">{agent.role}</p>
                  </div>
                  {i < AGENTS.length - 1 && (
                    <div className="absolute -right-2 top-8 z-10 hidden lg:flex">
                      <ArrowRight className="h-4 w-4 text-primary/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Demo Scenarios ────────────────────────────────────── */}
      <section className="mt-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">Try a Demo Scenario</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Three realistic AI systems. Instant pre-built compliance reports. No API key required.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {DEMOS.map((demo) => (
            <DemoCard key={demo.id} demo={demo} onTry={() => tryDemo(demo.result)} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/assessment">Upload Your Own Policy Document <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ── Why Agentic ───────────────────────────────────────── */}
      <section className="mt-24">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface/80 to-surface/80 p-8 md:p-12 backdrop-blur">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Workflow className="h-3 w-3" /> Design Philosophy
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">Why Agentic, Not Just RAG?</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            RAG retrieves context. RADAR coordinates specialized agents to classify risk, map regulations,
            trace evidence, generate recommendations, and deliver structured, actionable compliance reports.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-border/50">
            <div className="grid grid-cols-2 bg-surface/60">
              <div className="flex items-center gap-2 border-r border-border/50 px-5 py-3">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Standard RAG</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">RADAR Agentic Workflow</span>
              </div>
            </div>
            {RAG_VS_AGENTIC.map((row, i) => (
              <div key={i} className={`grid grid-cols-2 border-t border-border/30 ${i % 2 === 0 ? "bg-background/20" : ""}`}>
                <div className="flex items-start gap-2.5 border-r border-border/30 px-5 py-3">
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">{row.rag}</span>
                </div>
                <div className="flex items-start gap-2.5 px-5 py-3">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-foreground/80">{row.radar}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ────────────────────────────────── */}
      <section className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: ShieldCheck,
            title: "EU AI Act Knowledge Base",
            desc: "All 113 articles mapped. Annex III risk categories. Conformity assessment requirements.",
          },
          {
            icon: BarChart3,
            title: "Trust Score & Risk Memo",
            desc: "Quantified compliance score, investor memo, founder risk assessment, and conditions.",
          },
          {
            icon: FileSearch,
            title: "Evidence-Traced Reports",
            desc: "Every gap cites the policy line and the EU AI Act article it violates. No hallucinations.",
          },
          {
            icon: Mic,
            title: "Voice & Email Briefing",
            desc: "Executive briefing via browser speech, ElevenLabs TTS, and email delivery.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur transition-all hover:border-primary/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="mt-20 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 to-purple-500/10 p-10 text-center">
        <h2 className="text-2xl font-bold">Ready to assess your AI system?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Upload a policy document or paste policy text. RADAR's 7 agents will generate your compliance report in seconds.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="px-8">
            <Link to="/assessment">Start Free Assessment</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/results">View Sample Report</Link>
          </Button>
        </div>
      </section>

      <p className="mt-16 text-center text-xs text-muted-foreground">
        RADAR is a compliance support tool and does not constitute legal advice. Consult qualified legal counsel for regulatory matters.
      </p>
    </main>
  );
}
