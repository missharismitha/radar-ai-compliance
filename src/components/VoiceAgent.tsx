import { useState, useRef, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, VolumeX, Play, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { askRadar, type ChatMsg } from "@/lib/chat.functions";
import type { AssessmentResult } from "@/lib/radar-store";

type VoiceMode = "idle" | "listening" | "processing" | "speaking";

// Fixed field names: cr.trust_score, ra.risk_memo
function buildBriefingText(data: AssessmentResult): string {
  const ra = data.risk_actions ?? {};
  const cr = data.compliance_report ?? {};
  if (ra.voice_briefing_script) return ra.voice_briefing_script;
  const gaps: any[] = Array.isArray(cr.gaps) ? cr.gaps : [];
  const criticals = gaps.filter((g) => /crit/i.test(g.severity ?? g.status ?? ""));
  const score = cr.trust_score ?? "unknown";
  const riskClass = cr.risk_class ?? "High-Risk AI System";
  const memo = ra.risk_memo ?? {};
  return `This is RADAR. ${data.company_name} has been assessed under the EU AI Act.
The system is classified as a ${riskClass} with a trust score of ${score} out of 100.
${criticals.length} critical compliance gaps were identified.
${criticals.length > 0 ? `The most critical issue is ${criticals[0].title} under Article ${criticals[0].article?.replace("Art.", "")}.` : ""}
Investor risk is rated ${memo.investor_risk ?? "High"}.
${memo.recommendation ?? "Immediate remediation is recommended before EU deployment."}
End of RADAR briefing.`;
}

// Stop listening after 10 s of total time, or 1.8 s of silence after speech.
const MAX_LISTEN_MS = 10_000;
const SILENCE_AFTER_SPEECH_MS = 1_800;

type Props = { data: AssessmentResult };

export function VoiceAgent({ data }: Props) {
  const callRadar = useServerFn(askRadar);

  const [mode, setMode] = useState<VoiceMode>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasSTT, setHasSTT] = useState(false);
  const [hasTTS, setHasTTS] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Fixed: parentheses so both checks are guarded by typeof window
    setHasSTT(
      !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition,
    );
    setHasTTS("speechSynthesis" in window);
    if ("speechSynthesis" in window) {
      const load = () => setVoices(window.speechSynthesis.getVoices());
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    maxTimerRef.current = null;
    silenceTimerRef.current = null;
  }, []);

  // Browser TTS — used as fallback when ElevenLabs is unavailable
  const browserSpeak = useCallback(
    (text: string) => {
      if (!hasTTS) { setMode("idle"); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      const preferred = voices.find(
        (v) =>
          v.name.includes("Google UK English Male") ||
          v.name.includes("Daniel") ||
          v.name.includes("Alex") ||
          (v.lang.startsWith("en") && !v.name.includes("Compact")),
      );
      if (preferred) utterance.voice = preferred;
      utterance.onend = () => setMode("idle");
      utterance.onerror = () => setMode("idle");
      window.speechSynthesis.speak(utterance);
    },
    [hasTTS, voices],
  );

  // Try ElevenLabs via /api/voice-briefing, fall back to browser TTS
  const speakText = useCallback(
    async (text: string) => {
      setAudioUrl(null);
      try {
        const res = await fetch("/api/voice-briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setMode("speaking");
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = url;
              audioRef.current.play().catch(() => {});
              audioRef.current.onended = () => setMode("idle");
            }
          }, 50);
          return;
        }
      } catch {
        // fall through to browser TTS
      }
      setMode("speaking");
      browserSpeak(text);
    },
    [browserSpeak],
  );

  const stopSpeaking = useCallback(() => {
    if (hasTTS) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setMode("idle");
  }, [hasTTS]);

  // Calls real Kimi API — no fake answers
  const handleQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      setMode("processing");
      setResponse("");
      setError(null);

      const context = JSON.stringify({
        company_name: data.company_name,
        compliance_report: data.compliance_report,
        risk_actions: data.risk_actions,
      }).slice(0, 16000);

      const messages: ChatMsg[] = [{ role: "user", content: question }];
      const res = await callRadar({ data: { messages, context } });

      if (!res.ok) {
        setError(res.message);
        setMode("idle");
        return;
      }

      setResponse(res.reply);
      await speakText(res.reply);
    },
    [data, callRadar, speakText],
  );

  const startListening = useCallback(() => {
    if (!hasSTT) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or type your question in Ask RADAR.",
      );
      return;
    }
    setError(null);
    setTranscript("");
    setResponse("");
    stoppedRef.current = false;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    // continuous: true prevents the browser from auto-stopping after the first pause,
    // giving the user the full MAX_LISTEN_MS window.
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = "";
    let lastInterim = "";

    const doStop = () => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;
      clearTimers();
      try { recognition.stop(); } catch { /* already stopped */ }
    };

    recognition.onresult = (event: any) => {
      // Reset the hard max timer whenever speech arrives
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      maxTimerRef.current = setTimeout(doStop, MAX_LISTEN_MS);

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      lastInterim = interim;
      setTranscript((finalTranscript + interim).trim());

      // Auto-stop after SILENCE_AFTER_SPEECH_MS of silence following a final result
      if (event.results[event.results.length - 1].isFinal) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(doStop, SILENCE_AFTER_SPEECH_MS);
      }
    };

    recognition.onend = () => {
      clearTimers();
      const q = (finalTranscript + lastInterim).trim();
      if (q) {
        handleQuestion(q);
      } else {
        setMode("idle");
        setError("No speech detected. Tap the mic and speak clearly into your microphone.");
      }
    };

    recognition.onerror = (event: any) => {
      // aborted = we called stop() ourselves, ignore
      if (event.error === "aborted") return;
      // no-speech fires when Chrome hears nothing; onend will handle it via the timer
      if (event.error === "no-speech") return;
      doStop();
      setMode("idle");
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setError("Microphone permission denied. Please allow microphone access in your browser.");
      } else if (event.error === "audio-capture") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else {
        setError(`Speech error: ${event.error}. Please try again.`);
      }
    };

    recognition.start();
    setMode("listening");
    maxTimerRef.current = setTimeout(doStop, MAX_LISTEN_MS);
  }, [hasSTT, clearTimers, handleQuestion]);

  const stopListening = useCallback(() => {
    stoppedRef.current = true;
    clearTimers();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setMode("idle");
  }, [clearTimers]);

  const playBriefing = useCallback(async () => {
    setError(null);
    const script = buildBriefingText(data);
    setResponse(script);
    setMode("processing");
    await speakText(script);
  }, [data, speakText]);

  const briefingText = buildBriefingText(data);

  return (
    <div className="space-y-6">
      {/* Main voice control */}
      <div className="rounded-2xl border border-border/60 bg-surface/60 p-8 text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full ${
              mode === "listening"
                ? "animate-ping bg-red-500/20"
                : mode === "speaking"
                  ? "animate-ping bg-primary/20"
                  : mode === "processing"
                    ? "animate-pulse bg-yellow-500/10"
                    : ""
            }`}
          />
          <button
            onClick={
              mode === "listening"
                ? stopListening
                : mode === "speaking"
                  ? stopSpeaking
                  : mode === "idle"
                    ? startListening
                    : undefined
            }
            disabled={mode === "processing"}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
              mode === "listening"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110"
                : mode === "speaking"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                  : mode === "processing"
                    ? "bg-yellow-500/20 text-yellow-500 cursor-wait"
                    : "bg-primary/15 text-primary hover:bg-primary/25 hover:scale-105"
            }`}
          >
            {mode === "processing" ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : mode === "listening" ? (
              <MicOff className="h-8 w-8" />
            ) : mode === "speaking" ? (
              <VolumeX className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>
        </div>

        <h3 className="text-lg font-semibold">
          {mode === "idle" && "Tap to speak"}
          {mode === "listening" && "Listening…"}
          {mode === "processing" && "RADAR is thinking…"}
          {mode === "speaking" && "RADAR is speaking…"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "idle" &&
            (hasSTT ? "Ask a compliance question by voice" : "Voice input unavailable — use text chat")}
          {mode === "listening" && "Speak your question clearly · tap to stop"}
          {mode === "processing" && "Generating compliance response"}
          {mode === "speaking" && "Tap to stop"}
        </p>

        {!hasSTT && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-warning">
            Speech recognition unavailable — try Chrome or Edge
          </div>
        )}
      </div>

      {/* Transcript & response */}
      {(transcript || response) && (
        <div className="grid gap-4 md:grid-cols-2">
          {transcript && (
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Mic className="h-3 w-3" /> You said
              </div>
              <p className="text-sm">{transcript}</p>
            </div>
          )}
          {response && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium uppercase text-primary">
                  <Sparkles className="h-3 w-3" /> RADAR
                </div>
                {mode === "idle" && (
                  <button
                    onClick={() => { setMode("processing"); speakText(response); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    <RotateCcw className="h-3 w-3" /> Replay
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed">{response}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          {error}
        </div>
      )}

      {/* Sample questions */}
      <div className="rounded-xl border border-border/50 bg-surface/40 p-4">
        <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Try asking:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Why is this system high risk?",
            "What should we fix first?",
            "What evidence is missing?",
            "Give me a board summary.",
          ].map((q) => (
            <button
              key={q}
              onClick={() => {
                setTranscript(q);
                handleQuestion(q);
              }}
              disabled={mode !== "idle"}
              className="rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Briefing script + play button */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Executive Briefing Script</p>
            <p className="mt-1 text-sm font-semibold">Auto-generated from report</p>
          </div>
          <Button onClick={playBriefing} disabled={mode !== "idle"} variant="outline" size="sm">
            {mode === "processing" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Play Briefing
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{briefingText}</p>
        {audioUrl && <audio ref={audioRef} src={audioUrl} className="mt-4 w-full" controls />}
      </div>
    </div>
  );
}
