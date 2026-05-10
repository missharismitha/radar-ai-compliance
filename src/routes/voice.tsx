import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAssessment } from "@/lib/radar-store";
import { VoiceAgent } from "@/components/VoiceAgent";
import { Mic2 } from "lucide-react";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [{ title: "Voice Briefing Agent — RADAR AI" }] }),
  component: Voice,
});

function Voice() {
  const data = useAssessment();

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface/60 border border-border/60 mb-6">
          <Mic2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Voice Briefing Agent</h1>
        <p className="mt-3 text-muted-foreground">Run an assessment first to generate a briefing script.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/assessment">Run Assessment</Link></Button>
          <Button asChild variant="outline"><Link to="/">Try Demo</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Mic2 className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Voice Briefing Agent</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">RADAR Voice Agent</h1>
        <p className="mt-1 text-muted-foreground">
          Ask compliance questions by voice · {data.company_name}
          {data.isFallback && " · Demo Mode"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Uses browser Web Speech API for voice input and text-to-speech output.
          Connect ElevenLabs (<code className="text-primary">ELEVENLABS_API_KEY</code>) for premium audio.
        </p>
      </div>

      <VoiceAgent data={data} />
    </main>
  );
}
