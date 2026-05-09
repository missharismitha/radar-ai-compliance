import { createServerFn } from "@tanstack/react-start";

export type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export const askRadar = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMsg[]; context: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; reply: string } | { ok: false; message: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { ok: false, message: "LOVABLE_API_KEY is not configured." };
    }

    const system = `You are RADAR, an EU AI Act compliance assistant. Answer the user's questions strictly based on the provided compliance report and risk actions JSON. Be concise, structured, and cite article numbers when relevant. If the answer is not in the report, say so.

REPORT CONTEXT:
${data.context.slice(0, 16000)}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, message: `AI gateway error ${res.status}: ${t || res.statusText}` };
      }
      const j = await res.json();
      const reply = j?.choices?.[0]?.message?.content ?? "";
      return { ok: true, reply };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Network error" };
    }
  });
