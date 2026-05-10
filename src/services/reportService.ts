import type { AssessmentResult } from "@/lib/radar-store";

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
}

function severityColor(sev: string): string {
  const s = (sev || "").toLowerCase();
  if (s.includes("crit")) return "#dc2626";
  if (s.includes("warn")) return "#d97706";
  if (s.includes("valid") || s.includes("pass")) return "#16a34a";
  return "#6b7280";
}

function severityBg(sev: string): string {
  const s = (sev || "").toLowerCase();
  if (s.includes("crit")) return "#fef2f2";
  if (s.includes("warn")) return "#fffbeb";
  if (s.includes("valid") || s.includes("pass")) return "#f0fdf4";
  return "#f9fafb";
}

export function generateHTMLReport(data: AssessmentResult): string {
  const cr = data.compliance_report ?? {};
  const ra = data.risk_actions ?? {};
  const gaps: any[] = Array.isArray(cr.gaps) ? cr.gaps : [];
  const tickets: any[] = Array.isArray(ra.tickets) ? ra.tickets : [];
  const memo = ra.investor_memo ?? {};
  const redFlags: string[] = Array.isArray(memo.red_flags) ? memo.red_flags : [];
  const conditions: string[] = Array.isArray(memo.conditions) ? memo.conditions : [];
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const gapsRows = gaps.map((g: any) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 12px;font-weight:600;white-space:nowrap;color:#1e3a5f;">${escapeHtml(g.article ?? "—")}</td>
      <td style="padding:10px 12px;font-weight:500;">${escapeHtml(g.title ?? "—")}</td>
      <td style="padding:10px 12px;">
        <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;background:${severityBg(g.severity ?? "")};color:${severityColor(g.severity ?? "")};">
          ${escapeHtml(g.severity ?? g.status ?? "—")}
        </span>
      </td>
      <td style="padding:10px 12px;font-size:13px;color:#374151;">${escapeHtml(g.gap ?? "—")}</td>
      <td style="padding:10px 12px;font-size:13px;color:#6b7280;">${escapeHtml(g.remediation ?? "—")}</td>
      <td style="padding:10px 12px;font-size:13px;white-space:nowrap;">${escapeHtml(g.owner ?? "—")}</td>
      <td style="padding:10px 12px;font-size:13px;white-space:nowrap;color:#d97706;">${escapeHtml(g.deadline ?? "—")}</td>
    </tr>`).join("");

  const ticketsHtml = tickets.map((t: any) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-family:monospace;font-size:13px;font-weight:700;color:#1e3a5f;">${escapeHtml(t.id ?? "")}</span>
        <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;background:${severityBg(t.priority ?? "")};color:${severityColor(t.priority ?? "")};">
          ${escapeHtml(t.priority ?? "—")}
        </span>
      </div>
      <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(t.task ?? "")}</div>
      <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">${escapeHtml(t.description ?? "")}</div>
      <div style="display:flex;gap:24px;font-size:12px;">
        <span><strong>Article:</strong> ${escapeHtml(t.article ?? "—")}</span>
        <span><strong>Owner:</strong> ${escapeHtml(t.owner ?? "—")}</span>
        <span><strong>Deadline:</strong> ${escapeHtml(t.deadline ?? "—")}</span>
      </div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RADAR AI Compliance Report — ${escapeHtml(data.company_name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #111827; line-height: 1.6; }
    .page { max-width: 960px; margin: 0 auto; padding: 40px 24px; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #fff; padding: 40px; border-radius: 12px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header .subtitle { color: rgba(255,255,255,0.7); margin-top: 4px; font-size: 15px; }
    .header .meta { display: flex; gap: 32px; margin-top: 24px; }
    .header .meta-item { }
    .header .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5); }
    .header .meta-value { font-size: 22px; font-weight: 700; margin-top: 2px; }
    .header .meta-value.critical { color: #fca5a5; }
    .header .meta-value.warning { color: #fde68a; }
    .header .meta-value.success { color: #86efac; }
    .header .meta-value.primary { color: #93c5fd; }
    .section { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; margin-bottom: 24px; }
    .section-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .badge-critical { background: #fef2f2; color: #dc2626; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-warning { background: #fffbeb; color: #d97706; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-success { background: #f0fdf4; color: #16a34a; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .summary-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-size: 14px; color: #374151; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .memo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .memo-item { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .memo-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px; }
    .memo-value { font-size: 14px; font-weight: 500; }
    .flag-item { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; font-size: 13px; }
    .flag-dot { color: #dc2626; font-size: 16px; line-height: 1.4; flex-shrink: 0; }
    .recommendation { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .recommendation-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #3b82f6; margin-bottom: 6px; font-weight: 600; }
    .voice-script { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; font-size: 14px; line-height: 1.8; color: #0c4a6e; font-style: italic; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #9ca3af; }
    @media print { body { background: #fff; } .page { padding: 20px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px;">RADAR AI Compliance Agent · Confidential</div>
    <h1>EU AI Act Compliance Report</h1>
    <div class="subtitle">${escapeHtml(data.company_name)} · Generated ${date}</div>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Trust Score</div>
        <div class="meta-value primary">${ra.trust_score ?? "—"}<span style="font-size:14px;font-weight:400;">/100</span></div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Critical Gaps</div>
        <div class="meta-value critical">${ra.critical_gaps ?? 0}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Warnings</div>
        <div class="meta-value warning">${ra.warning_gaps ?? 0}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Validated</div>
        <div class="meta-value success">${ra.validated_controls ?? 0}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Investor Risk</div>
        <div class="meta-value critical">${escapeHtml(String(ra.investor_risk ?? "—"))}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Risk Class</div>
        <div class="meta-value" style="font-size:14px;color:#fde68a;">${escapeHtml(String(cr.risk_class ?? "—"))}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="summary-box">${escapeHtml(cr.summary ?? "No summary available.")}</div>
    ${cr.eu_ai_act_applicability ? `<div style="font-size:13px;color:#6b7280;"><strong>EU AI Act Applicability:</strong> ${escapeHtml(cr.eu_ai_act_applicability)}</div>` : ""}
  </div>

  ${gaps.length > 0 ? `
  <div class="section">
    <div class="section-title">Compliance Gap Analysis</div>
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Article</th><th>Requirement</th><th>Severity</th><th>Gap Found</th><th>Remediation</th><th>Owner</th><th>Deadline</th>
          </tr>
        </thead>
        <tbody>${gapsRows}</tbody>
      </table>
    </div>
  </div>` : ""}

  ${(redFlags.length > 0 || conditions.length > 0) ? `
  <div class="section">
    <div class="section-title">Investor & Founder Risk Memo</div>
    <div class="memo-grid">
      <div class="memo-item">
        <div class="memo-label">Investor Risk</div>
        <div class="memo-value">${escapeHtml(String(memo.investor_risk ?? ra.investor_risk ?? "—"))}</div>
      </div>
      <div class="memo-item">
        <div class="memo-label">Founder Risk</div>
        <div class="memo-value">${escapeHtml(String(memo.founder_risk ?? ra.founder_risk ?? "—"))}</div>
      </div>
      ${redFlags.length > 0 ? `
      <div class="memo-item" style="grid-column:1/-1;">
        <div class="memo-label">Red Flags</div>
        <div style="margin-top:8px;">${redFlags.map(f => `<div class="flag-item"><span class="flag-dot">•</span><span>${escapeHtml(String(f))}</span></div>`).join("")}</div>
      </div>` : ""}
      ${conditions.length > 0 ? `
      <div class="memo-item" style="grid-column:1/-1;">
        <div class="memo-label">Conditions Before Investment / Deployment</div>
        <div style="margin-top:8px;">${conditions.map(c => `<div class="flag-item"><span style="color:#3b82f6;font-size:16px;line-height:1.4;">→</span><span>${escapeHtml(String(c))}</span></div>`).join("")}</div>
      </div>` : ""}
    </div>
    ${memo.recommendation ? `
    <div class="recommendation">
      <div class="recommendation-label">RADAR Recommendation</div>
      <div style="font-size:14px;font-weight:500;">${escapeHtml(String(memo.recommendation))}</div>
    </div>` : ""}
  </div>` : ""}

  ${tickets.length > 0 ? `
  <div class="section">
    <div class="section-title">Remediation Tickets</div>
    ${ticketsHtml}
  </div>` : ""}

  ${ra.voice_briefing_script ? `
  <div class="section">
    <div class="section-title">Executive Voice Briefing Script</div>
    <div class="voice-script">${escapeHtml(ra.voice_briefing_script)}</div>
  </div>` : ""}

  <div class="footer">
    <div>Generated by RADAR AI Compliance Agent · ${date}</div>
    <div style="margin-top:4px;">This report is a compliance support tool and does not constitute legal advice. Consult qualified legal counsel for regulatory matters.</div>
  </div>
</div>
</body>
</html>`;
}

export function downloadReport(data: AssessmentResult): void {
  const html = generateHTMLReport(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `RADAR-Compliance-Report-${data.company_name.replace(/[^a-zA-Z0-9]/g, "-")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printReport(): void {
  window.print();
}
