import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAssessment } from "@/lib/radar-store";
import { ComplianceChat } from "@/components/ComplianceChat";
import { Bot, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Ask RADAR — AI Compliance Chat" }] }),
  component: Chat,
});

function Chat() {
  const data = useAssessment();

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface/60 border border-border/60 mb-6">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Ask RADAR</h1>
        <p className="mt-3 text-muted-foreground">Run an assessment or try a demo scenario first.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/assessment">Run Assessment</Link></Button>
          <Button asChild variant="outline"><Link to="/">Try Demo</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Ask RADAR</h1>
            <p className="text-xs text-muted-foreground">
              AI Compliance Assistant · {data.company_name}
              {data.isFallback && " · Demo Mode"}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask about compliance gaps, risk classification, EU AI Act articles, remediation priorities, or how to brief investors.
        </p>
      </div>

      <ComplianceChat data={data} />
    </main>
  );
}
