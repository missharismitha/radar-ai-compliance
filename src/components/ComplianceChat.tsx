import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askRadar, type ChatMsg } from "@/lib/chat.functions";
import type { AssessmentResult } from "@/lib/radar-store";
import { Send, Bot, User, Sparkles, Shield, FileSearch, AlertTriangle, BarChart3, Briefcase } from "lucide-react";

const SUGGESTIONS = [
  { label: "Why is this system high risk?", icon: ShieldIcon },
  { label: "What evidence is missing?", icon: SearchIcon },
  { label: "What should we fix first?", icon: AlertIcon },
  { label: "Generate a board-level summary.", icon: ChartIcon },
  { label: "What would an investor care about?", icon: BriefcaseIcon },
];

function ShieldIcon() { return <Shield className="h-3.5 w-3.5" />; }
function SearchIcon() { return <FileSearch className="h-3.5 w-3.5" />; }
function AlertIcon() { return <AlertTriangle className="h-3.5 w-3.5" />; }
function ChartIcon() { return <BarChart3 className="h-3.5 w-3.5" />; }
function BriefcaseIcon() { return <Briefcase className="h-3.5 w-3.5" />; }

function matchesAny(q: string, terms: string[]): boolean {
  return terms.some((t) => q.includes(t));
}

function generateDemoResponse(question: string, data: AssessmentResult): string {
  const q = question.toLowerCase();
  const cr = data.compliance_report ?? {};
  const ra = data.risk_actions ?? {};
  const gaps: any[] = Array.isArray(cr.gaps) ? cr.gaps : [];
  const criticals = gaps.filter((g) => /crit/i.test(g.severity ?? g.status ?? ""));
  const warnings = gaps.filter((g) => /warn/i.test(g.severity ?? g.status ?? ""));
  const validated = gaps.filter((g) => /valid|pass/i.test(g.severity ?? g.status ?? ""));
  const score = ra.trust_score ?? 42;
  const company = data.company_name ?? "the company";
  const memo = ra.investor_memo ?? {};
  const tickets: any[] = Array.isArray(ra.tickets) ? ra.tickets : [];
  const redFlags: string[] = Array.isArray(memo.red_flags) ? memo.red_flags : [];
  const conditions: string[] = Array.isArray(memo.conditions) ? memo.conditions : [];

  if (matchesAny(q, ["fix first", "priority", "urgent", "most important", "start", "immediate", "biggest", "worst"])) {
    const first = criticals[0];
    if (first) {
      return `**Top Priority: ${first.title} (${first.article})**

${first.gap}

**Recommended action:** ${first.remediation}
**Owner:** ${first.owner} | **Deadline:** ${first.deadline}

This is the highest priority item because it represents a fundamental EU AI Act obligation with no compensating controls present in the current policy.${criticals.length > 1 ? `\n\nAfter this, address **${criticals[1].title}** (${criticals[1].article}) within ${criticals[1].deadline}.` : ""}`;
    }
    return `Address the compliance gaps listed in the Results page starting with Critical severity items. Each gap includes an owner and deadline recommendation.`;
  }

  if (matchesAny(q, ["high risk", "why high", "classified", "risk level", "risk class", "why is", "how is", "reason"])) {
    const riskClass = cr.risk_class ?? "High-Risk AI System";
    return `**Risk Classification: ${riskClass}**

**Trust Score: ${score}/100** | **Investor Risk: ${ra.investor_risk ?? "High"}**

${company}'s system is classified as **${riskClass}** based on the following factors:

${criticals.map((g) => `• **${g.article} — ${g.title}:** ${g.gap}`).join("\n\n")}

${cr.eu_ai_act_applicability ? `\n**EU AI Act Applicability:**\n${cr.eu_ai_act_applicability}` : ""}

Under the EU AI Act, systems in this category face mandatory conformity assessment, CE marking, and registration in the EU database before deployment.`;
  }

  if (matchesAny(q, ["evidence", "missing", "document", "proof", "absent", "lack", "not found", "gap"])) {
    const evidenceGaps = gaps.filter((g) => g.policy_evidence || g.evidence);
    if (evidenceGaps.length === 0) {
      return `No specific evidence was extracted from the uploaded document. This may indicate that the policy text does not address key EU AI Act requirements.`;
    }
    return `**Evidence Analysis — What Was Found vs. What's Missing**

${evidenceGaps.slice(0, 5).map((g) => `**${g.article} — ${g.title}**
Found in policy: *"${g.policy_evidence ?? g.evidence ?? "Not mentioned"}"*
Gap: ${g.gap}`).join("\n\n")}

These documentation gaps will be the primary findings in any EU AI Act conformity assessment or regulatory audit.`;
  }

  if (matchesAny(q, ["board", "executive", "simple", "summary", "brief", "explain to", "non-technical", "overview"])) {
    return `**Board-Level Executive Summary — ${company}**

**Headline:** EU AI Act compliance readiness is **${score < 50 ? "insufficient for EU deployment" : score < 70 ? "partially adequate with significant gaps" : "reasonably mature with focused gaps"}**.

**Trust Score:** ${score}/100 | **Risk Level:** ${ra.investor_risk ?? "High"}

**Situation:**
${company} operates an AI system that falls within the EU AI Act's regulatory scope. The compliance assessment identified ${criticals.length} critical gaps and ${warnings.length} warnings requiring management attention.

**Key Risks:**
${(redFlags.length > 0 ? redFlags : criticals.map((g) => g.title)).slice(0, 4).map((r: string) => `• ${r}`).join("\n")}

**What This Means:**
Without remediation, the company cannot legally deploy this AI system in the EU market. Legal, financial, and reputational exposure is ${score < 50 ? "high" : "moderate"}.

**Recommended Board Action:**
${memo.recommendation ?? "Approve an immediate remediation programme with dedicated resources and executive accountability."}

**Timeline:** ${tickets.length > 0 ? `${tickets.length} remediation tickets spanning 30–90 days.` : "60–90 day remediation programme recommended."}`;
  }

  if (matchesAny(q, ["article", "art.", "eu ai act", "regulation", "law", "legal", "annex", "obligation"])) {
    const articles = [...new Set(gaps.map((g) => g.article).filter(Boolean))];
    return `**Relevant EU AI Act Articles for ${company}**

${gaps.map((g) => `**${g.article} — ${g.title}** *(${g.severity ?? g.status})*
${g.gap}`).join("\n\n")}

**Key focus areas:**
Articles 9 (Risk Management), 10 (Data Governance), 13 (Transparency), and 14 (Human Oversight) are the most scrutinised during conformity assessments for high-risk systems.

All ${articles.length} identified articles must be addressed before CE marking can be obtained.`;
  }

  if (matchesAny(q, ["investor", "vc", "fund", "investment", "due diligence", "raise", "round", "blocker"])) {
    return `**Investor Due Diligence Assessment — ${company}**

**Investor Risk: ${memo.investor_risk ?? ra.investor_risk ?? "High"}**
**Founder Risk: ${memo.founder_risk ?? ra.founder_risk ?? "High"}**

**Investor Red Flags:**
${redFlags.map((f: string) => `• ${f}`).join("\n")}

**Conditions Before Investment / Deployment:**
${conditions.map((c: string) => `→ ${c}`).join("\n")}

**RADAR Recommendation:**
${memo.recommendation ?? "Conditional pass — require remediation plan with milestone verification."}

**Practical Impact:**
EU regulated investors (pension funds, insurance companies) cannot invest in AI companies with unresolved Art. 9 risk management gaps. Fix these before the next funding round.`;
  }

  if (matchesAny(q, ["remediation", "fix", "resolve", "action", "recommend", "steps", "plan", "next"])) {
    if (tickets.length > 0) {
      return `**Remediation Plan — ${company}**

${tickets.map((t) => `**${t.id} — ${t.task}** *(${t.priority})*
Article: ${t.article} | Owner: ${t.owner} | Deadline: ${t.deadline}
${t.description}`).join("\n\n")}

**Recommended approach:** Address Critical items in parallel if resources allow. Engage an external EU AI Act auditor to validate the remediation plan and provide independent certification support.`;
    }
    return `Review the Remediation Tickets in the Results page for a complete action plan with owners and deadlines.`;
  }

  if (matchesAny(q, ["score", "trust score", "rating", "percentage"])) {
    return `**Trust Score: ${score}/100**

This score reflects ${company}'s EU AI Act compliance readiness:

• ${criticals.length} Critical gaps (high impact on score)
• ${warnings.length} Warnings (moderate impact)
• ${validated.length} Validated controls (positive contribution)

**Score interpretation:**
- 80–100: Strong compliance posture — minor gaps only
- 60–79: Adequate foundation with significant work required
- 40–59: Material gaps — EU deployment not recommended
- Below 40: Critical non-compliance — immediate remediation required

${score < 40 ? `⚠️ At ${score}/100, ${company} should not deploy in the EU market without completing the remediation programme.` : score < 60 ? `At ${score}/100, ${company} needs to complete the remediation programme before EU market launch.` : `At ${score}/100, ${company} has a reasonable foundation but must close the identified gaps.`}`;
  }

  return `**RADAR Analysis — ${company}**

Trust Score: **${score}/100** | Risk Level: **${ra.investor_risk ?? "High"}**

I found **${criticals.length} critical gaps**, **${warnings.length} warnings**, and **${validated.length} validated controls** in the assessment.

${criticals.length > 0 ? `**Most pressing issues:**\n${criticals.slice(0, 3).map((g) => `• ${g.article}: ${g.title}`).join("\n")}` : ""}

You can ask me about:
• Why this system is classified high-risk
• What evidence is missing from the policy
• What to fix first and in what order
• How to present this to the board or investors
• Specific EU AI Act articles and their requirements
• The remediation plan and ticket priorities`;
}

type Props = {
  data: AssessmentResult;
};

export function ComplianceChat({ data }: Props) {
  const ask = useServerFn(askRadar);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const context = JSON.stringify({
      company_name: data.company_name,
      compliance_report: data.compliance_report,
      risk_actions: data.risk_actions,
    });

    const res = await ask({ data: { messages: next, context } });

    if (res.ok) {
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } else {
      // Fall back to demo response
      setIsDemoMode(true);
      const demoReply = generateDemoResponse(text, data);
      setMessages([...next, { role: "assistant", content: demoReply }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
      {isDemoMode && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <Sparkles className="h-3 w-3" />
          Demo mode — responses generated from your compliance report
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-surface/40 p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Ask RADAR about your compliance report:</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.label)}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-left text-sm text-foreground/80 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  <span className="text-primary"><s.icon /></span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 mt-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground shadow-sm"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-card px-4 py-3 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about gaps, risk classification, articles, remediation…"
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
