import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/voice-briefing")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "ElevenLabs key required. Voice script is ready." },
            { status: 503 },
          );
        }
        const body = await request.json().catch(() => ({}));
        const text = (body?.text || "").toString();
        if (!text) return Response.json({ error: "Missing text" }, { status: 400 });

        const voiceId = "JBFqnCBsd6RMkjVDRZzb";
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.6, similarity_boost: 0.75, use_speaker_boost: true },
            }),
          },
        );
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return Response.json({ error: `ElevenLabs error ${res.status}: ${t}` }, { status: 502 });
        }
        const buf = await res.arrayBuffer();
        return new Response(buf, { headers: { "Content-Type": "audio/mpeg" } });
      },
    },
  },
});
