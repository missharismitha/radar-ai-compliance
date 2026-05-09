import { createServerFn } from "@tanstack/react-start";

export type DifyOk = {
  ok: true;
  company_name: string;
  compliance_report: any;
  risk_actions: any;
  raw: { compliance_report?: string; risk_actions?: string };
  isFallback?: boolean;
};

export type DifyErr = {
  ok: false;
  status: number;
  message: string;
  suggestion?: string;
};

const FALLBACK = {
  company_name: "Demo Company",
  compliance_report: {
    summary:
      "Demo fallback: this report is illustrative only because the Dify workflow could not be reached. The policy provides limited evidence on fundamental EU AI Act obligations including risk management, data governance, transparency, and human oversight.",
    gaps: [
      {
        article: "Art. 9",
        title: "Risk management system",
        status: "Critical gap",
        severity: "critical",
        policy_evidence: "No mention of an AI-specific risk management system.",
        gap: "No documented continuous risk identification, evaluation, mitigation cycle for the AI system.",
        remediation: "Establish a documented AI risk management system per Art. 9 with periodic reviews.",
        owner: "Head of Risk",
        deadline: "30 days",
      },
      {
        article: "Art. 10",
        title: "Data and data governance",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Mentions secure data processing and limited access.",
        gap: "No description of training data quality, bias detection, or representativeness.",
        remediation: "Add training-data governance: source documentation, quality metrics, bias testing.",
        owner: "Head of Data",
        deadline: "45 days",
      },
      {
        article: "Art. 14",
        title: "Human oversight",
        status: "Validated",
        severity: "validated",
        policy_evidence: "Engineering tests model performance; support reviews complaints.",
        gap: "Partial: oversight is informal and not documented as required.",
        remediation: "Formalise human-in-the-loop checkpoints for credit decisions.",
        owner: "Product Lead",
        deadline: "60 days",
      },
    ],
  },
  risk_actions: {
    trust_score: 42,
    critical_gaps: 1,
    warning_gaps: 1,
    validated_controls: 1,
    investor_risk: "High",
    founder_risk: "High",
    investor_memo: {
      investor_risk: "High - missing AI Act risk management raises blocker for EU regulated investors.",
      founder_risk: "High - personal liability exposure under Art. 9 and Art. 10.",
      red_flags: [
        "No formal AI risk management system",
        "No documented bias testing",
        "Human oversight not formalised",
      ],
      conditions: [
        "Implement Art. 9 risk management before next funding round",
        "Engage external AI auditor",
      ],
      recommendation: "Conditional pass — require remediation plan within 60 days.",
    },
    tickets: [
      {
        id: "RAD-001",
        task: "Establish AI risk management system",
        article: "Art. 9",
        owner: "Head of Risk",
        priority: "Critical",
        deadline: "30 days",
        description: "Document a continuous risk management cycle for the credit-scoring AI system.",
      },
      {
        id: "RAD-002",
        task: "Implement training-data governance",
        article: "Art. 10",
        owner: "Head of Data",
        priority: "High",
        deadline: "45 days",
        description: "Define data sourcing, quality metrics and bias testing procedures.",
      },
    ],
    voice_briefing_script:
      "This is RADAR. FinCore AG presents high investor and founder risk under the EU AI Act. The most critical gap is the absence of a documented AI risk management system as required by Article 9. Data governance and human oversight are partially covered but not formalised. Recommendation: conditional pass with a sixty-day remediation plan.",
  },
};

export const runDifyAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: {
    company_name: string;
    industry: string;
    country: string;
    company_stage: string;
    product_description: string;
    policy_text: string;
  }) => data)
  .handler(async ({ data }): Promise<DifyOk | DifyErr> => {
    const apiKey = process.env.DIFY_API_KEY;
    if (!apiKey) {
      return {
        ok: true,
        company_name: data.company_name || FALLBACK.company_name,
        compliance_report: FALLBACK.compliance_report,
        risk_actions: FALLBACK.risk_actions,
        raw: {},
        isFallback: true,
      };
    }

    try {
      const res = await fetch("https://api.dify.ai/v1/workflows/run", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            company_name: data.company_name,
            industry: data.industry,
            country: data.country,
            company_stage: data.company_stage,
            product_description: data.product_description,
            policy_text: data.policy_text,
          },
          response_mode: "blocking",
          user: "radar-demo-user",
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let suggestion: string | undefined;
        if (res.status === 504) {
          suggestion = "Dify workflow timed out. Try reducing policy length or using faster model in Dify.";
        } else if (res.status === 401) {
          suggestion = "Check that DIFY_API_KEY belongs to the correct workflow.";
        }
        return { ok: false, status: res.status, message: errText || res.statusText, suggestion };
      }

      const json = await res.json();
      const outputs = json?.data?.outputs ?? {};
      const rawCR = outputs.compliance_report;
      const rawRA = outputs.risk_actions;

      const parse = (v: any) => {
        if (v == null) return null;
        if (typeof v !== "string") return v;
        try { return JSON.parse(v); } catch { return v; }
      };

      return {
        ok: true,
        company_name: outputs.company_name ?? data.company_name,
        compliance_report: parse(rawCR),
        risk_actions: parse(rawRA),
        raw: {
          compliance_report: typeof rawCR === "string" ? rawCR : undefined,
          risk_actions: typeof rawRA === "string" ? rawRA : undefined,
        },
      };
    } catch (e: any) {
      return {
        ok: false,
        status: 0,
        message: e?.message || "Network error contacting Dify",
        suggestion: "Check network connectivity and the Dify endpoint.",
      };
    }
  });
