import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssessment } from "@/lib/radar-store";
import { askRadar, type ChatMsg } from "@/lib/chat.functions";
import { Send, Bot, User } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Ask RADAR" }] }),
  component: Chat,
});

const SUGGESTIONS = [
  "What is the biggest compliance risk?",
  "What should we fix first?",
  "Which EU AI Act article is most relevant?",
  "What would an investor care about?",
  "Summarize this in simple language.",
];

function Chat() {
  const data = useAssessment();
  const ask = useServerFn(askRadar);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Ask RADAR</h1>
        <p className="mt-3 text-muted-foreground">Run an assessment first so RADAR can answer based on your report.</p>
        <Button asChild className="mt-6"><Link to="/assessment">Go to Assessment</Link></Button>
      </main>
    );
  }

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
      setMessages([...next, { role: "assistant", content: `(report assistant mode — AI gateway unavailable)\n\nBased on the report for ${data.company_name}: review the critical gaps and remediation tickets in the Results page.\n\nError: ${res.message}` }]);
    }
    setLoading(false);
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col px-6 py-12" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ask RADAR</h1>
        <p className="mt-1 text-sm text-muted-foreground">Follow-up questions about the report for <span className="text-foreground">{data.company_name}</span>.</p>
      </div>

      <div className="mt-6 flex-1 rounded-2xl border border-border/60 bg-surface/60 p-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-left text-sm hover:bg-secondary">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Bot className="h-4 w-4" /></div>}
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-background/60 text-foreground"}`}>{m.content}</div>
              {m.role === "user" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary"><User className="h-4 w-4" /></div>}
            </div>
          ))}
          {loading && <div className="text-sm text-muted-foreground">RADAR is thinking…</div>}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-4 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about gaps, risks, articles…" />
        <Button type="submit" disabled={loading}><Send className="h-4 w-4" /></Button>
      </form>
    </main>
  );
}
