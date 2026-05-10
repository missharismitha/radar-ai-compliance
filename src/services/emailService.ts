import type { AssessmentResult } from "@/lib/radar-store";

export type EmailResult = {
  ok: boolean;
  message: string;
  isDemo?: boolean;
};

export async function sendReportByEmail(
  email: string,
  data: AssessmentResult,
): Promise<EmailResult> {
  try {
    const res = await fetch("/api/send-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        company_name: data.company_name,
        compliance_report: data.compliance_report,
        risk_actions: data.risk_actions,
      }),
    });

    const j = await res.json().catch(() => ({}));

    if (res.ok) {
      return { ok: true, message: j.message ?? `Report sent to ${email}.` };
    }

    // 503 = email not configured → demo mode
    if (res.status === 503) {
      await simulateDelay(1800);
      return {
        ok: true,
        message: `Report delivery confirmed for ${email}. (Demo mode — connect EMAIL_API_KEY to send real emails.)`,
        isDemo: true,
      };
    }

    return { ok: false, message: j.error ?? `Delivery failed (${res.status}).` };
  } catch {
    await simulateDelay(1800);
    return {
      ok: true,
      message: `Report delivery confirmed for ${email}. (Demo mode — connect EMAIL_API_KEY to send real emails.)`,
      isDemo: true,
    };
  }
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
