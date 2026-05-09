import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAssessment } from "@/lib/radar-store";
import { Mic2, Play, Loader2 } from "lucide-react";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [{ title: "Voice Briefing — RADAR" }] }),
  component: Voice,
});

function Voice() {
  const data = useAssessment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const script: string = data?.risk_actions?.voice_briefing_script ?? data?.risk_actions?.voice_script ?? "";

  const play = async () => {
    if (!script) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/voice-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `Request failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play(), 50);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Voice Briefing</h1>
        <p className="mt-3 text-muted-foreground">Run an assessment first to generate a briefing script.</p>
        <Button asChild className="mt-6"><Link to="/assessment">Go to Assessment</Link></Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-2 text-primary">
        <Mic2 className="h-5 w-5" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">RADAR Voice Briefing Agent</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Executive briefing audio for {data.company_name}.</p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-surface/60 p-6">
        <div className="text-xs font-medium uppercase text-muted-foreground">Briefing script</div>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{script || "No briefing script available in this report."}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={play} disabled={loading || !script}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Play Voice Briefing
        </Button>
        {audioUrl && <audio ref={audioRef} controls src={audioUrl} className="max-w-full" />}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          {error}
        </div>
      )}
    </main>
  );
}
