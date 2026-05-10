import { createServerFn } from "@tanstack/react-start";

export type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export const askRadar = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMsg[]; context: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; reply: string } | { ok: false; message: string }> => {
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      return { ok: false, message: "KIMI_API_KEY is not configured — using demo mode." };
    }

    const baseUrl = (process.env.KIMI_BASE_URL ?? "https://api.moonshot.cn/v1").replace(/\/$/, "");
    const model = process.env.KIMI_MODEL ?? "moonshot-v1-8k";

    const system = `You are RADAR, an EU AI Act compliance assistant. Answer the user's questions strictly based on the provided compliance report and risk actions JSON. Be concise, structured, and cite article numbers when relevant. If the answer is not in the provided report context, say so clearly.

REPORT CONTEXT:
${data.context.slice(0, 16000)}`;

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, message: `Kimi API error ${res.status}: ${t || res.statusText}` };
      }

      const j = await res.json();
      const reply = j?.choices?.[0]?.message?.content ?? "";
      return { ok: true, reply };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Network error contacting Kimi API" };
    }
  });
