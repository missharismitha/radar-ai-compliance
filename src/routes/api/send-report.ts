import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/send-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.EMAIL_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Email delivery is not configured yet." },
            { status: 503 },
          );
        }
        const body = await request.json().catch(() => ({}));
        const { email, company_name, compliance_report, risk_actions } = body || {};
        if (!email) return Response.json({ error: "Missing email" }, { status: 400 });

        // Resend-compatible call (placeholder; works if EMAIL_API_KEY is a Resend key)
        const html = `
          <h1>RADAR Due Diligence Report — ${company_name}</h1>
          <h2>Compliance Report</h2>
          <pre style="white-space:pre-wrap;font-family:monospace">${escapeHtml(JSON.stringify(compliance_report, null, 2))}</pre>
          <h2>Risk Actions</h2>
          <pre style="white-space:pre-wrap;font-family:monospace">${escapeHtml(JSON.stringify(risk_actions, null, 2))}</pre>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RADAR <onboarding@resend.dev>",
            to: [email],
            subject: `RADAR Due Diligence — ${company_name}`,
            html,
          }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return Response.json({ error: `Email provider error ${res.status}: ${t}` }, { status: 502 });
        }
        return Response.json({ message: `Report sent to ${email}.` });
      },
    },
  },
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
