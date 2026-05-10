// Simple shared store for demo - persists in sessionStorage
import { useEffect, useState } from "react";

export type AssessmentInputs = {
  company_name: string;
  industry: string;
  country: string;
  company_stage: string;
  product_description: string;
  policy_text: string;
};

export type AssessmentResult = {
  company_name: string;
  compliance_report: any;
  risk_actions: any;
  raw?: { compliance_report?: string; risk_actions?: string };
  isFallback?: boolean;
};

const KEY = "radar_assessment_v1";

export function saveAssessment(result: AssessmentResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(result));
  window.dispatchEvent(new Event("radar-assessment-update"));
}

export function loadAssessment(): AssessmentResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAssessment() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event("radar-assessment-update"));
}

export function useAssessment() {
  const [data, setData] = useState<AssessmentResult | null>(null);
  useEffect(() => {
    setData(loadAssessment());
    const handler = () => setData(loadAssessment());
    window.addEventListener("radar-assessment-update", handler);
    return () => window.removeEventListener("radar-assessment-update", handler);
  }, []);
  return data;
}

export function tryParse(value: any): any {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

// ─── Demo Inputs ──────────────────────────────────────────────────────────────

export const FINCORE_DEMO: AssessmentInputs = {
  company_name: "FinCore AG",
  industry: "Fintech",
  country: "Switzerland / EU market",
  company_stage: "Seed",
  product_description: "AI credit scoring tool for SME loans",
  policy_text:
    "FinCore AG uses artificial intelligence to support loan eligibility decisions for small business customers. Customer data is processed securely and access is limited to authorized employees. The company follows general privacy principles and internal approval processes before deploying new software features. Engineering teams are responsible for testing model performance before release. Customer support teams may review complaints when users contact the company. The company stores business data according to internal retention rules and follows standard cybersecurity procedures.",
};

export const MEDTRIAGE_DEMO: AssessmentInputs = {
  company_name: "MedTriage GmbH",
  industry: "HealthTech / Medical AI",
  country: "Germany / EU market",
  company_stage: "Series A",
  product_description: "AI-powered emergency triage system classifying patient urgency levels in hospital emergency departments",
  policy_text:
    "MedTriage GmbH operates an AI-powered patient triage system deployed in emergency departments across Germany. The system processes patient vital signs, symptoms, and medical history to classify urgency levels from 1 (immediate) to 5 (non-urgent). Clinical staff have access to the system output and may override recommendations. Patient data is stored in compliance with GDPR. The system is updated quarterly based on performance metrics. A clinical advisory board reviews major system changes. The company maintains standard ISO 13485 certification for medical devices.",
};

export const INDUSTRIAL_DEMO: AssessmentInputs = {
  company_name: "AutoVision Systems",
  industry: "Industrial AI / Manufacturing",
  country: "Netherlands / EU market",
  company_stage: "Series B",
  product_description: "AI vision system for automated quality inspection on manufacturing production lines, detecting defects in real-time",
  policy_text:
    "AutoVision Systems provides AI-powered visual inspection solutions to automotive manufacturers. Our systems use computer vision and machine learning to identify product defects on production lines in real-time. The system operates autonomously with alerts sent to quality control teams for review. Training data is sourced from client manufacturing facilities under data sharing agreements. The system is monitored by our engineering team for performance degradation. Clients receive monthly performance reports. The system has been deployed for 18 months with 99.2% uptime.",
};

// ─── Pre-built Demo Results ────────────────────────────────────────────────────

export const FINCORE_RESULT: AssessmentResult = {
  company_name: "FinCore AG",
  isFallback: true,
  compliance_report: {
    summary:
      "FinCore AG's AI credit scoring system presents significant EU AI Act compliance challenges. As a high-risk AI system under Annex III (credit scoring for SME loans), it faces strict obligations across risk management, data governance, transparency, and human oversight. The current policy demonstrates awareness of general data protection but lacks AI-specific compliance infrastructure required before EU market deployment.",
    risk_class: "High-Risk AI System",
    eu_ai_act_applicability:
      "Article 6 + Annex III — Credit scoring and creditworthiness assessment tools are explicitly listed as high-risk AI systems requiring full EU AI Act compliance, including conformity assessment and CE marking before deployment.",
    gaps: [
      {
        article: "Art. 9",
        title: "Risk Management System",
        status: "Critical Gap",
        severity: "critical",
        policy_evidence: "No mention of an AI-specific risk management system.",
        gap: "No documented continuous risk identification, evaluation, and mitigation cycle. No residual risk acceptance criteria defined for the credit scoring model.",
        remediation: "Establish a documented AI risk management system per Art. 9 with periodic reviews, residual risk acceptance, and testing before each deployment.",
        owner: "Head of Risk",
        deadline: "30 days",
      },
      {
        article: "Art. 10",
        title: "Data Governance & Bias Testing",
        status: "Critical Gap",
        severity: "critical",
        policy_evidence: "Mentions secure data processing and limited access.",
        gap: "No description of training data quality criteria, bias detection methodology, or representativeness assessment across protected demographic characteristics for SME loan applicants.",
        remediation: "Document training data sources, implement bias testing across demographic groups, establish data quality metrics and ongoing monitoring procedures.",
        owner: "Head of Data",
        deadline: "45 days",
      },
      {
        article: "Art. 13",
        title: "Transparency & Explainability",
        status: "Critical Gap",
        severity: "critical",
        policy_evidence: "No transparency provisions mentioned in policy.",
        gap: "No mechanism to explain credit decisions to affected SMEs. EU AI Act requires that affected persons can understand the basis for automated decisions impacting them.",
        remediation: "Implement model explainability (SHAP/LIME or rule-based), create customer-facing explanation templates for adverse credit decisions.",
        owner: "Product Lead",
        deadline: "60 days",
      },
      {
        article: "Art. 14",
        title: "Human Oversight",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Engineering tests model performance; support reviews complaints.",
        gap: "Partial: oversight is informal and not documented as required. No designated human oversight role for high-risk credit decisions above defined thresholds.",
        remediation: "Formalise human-in-the-loop checkpoints for credit decisions. Document oversight procedures with named responsible persons.",
        owner: "Head of Operations",
        deadline: "60 days",
      },
      {
        article: "Art. 15",
        title: "Accuracy, Robustness & Cybersecurity",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Standard cybersecurity procedures and engineering testing mentioned.",
        gap: "No AI-specific accuracy benchmarks, no model drift detection, no adversarial robustness testing documented. Uptime is not a proxy for model accuracy.",
        remediation: "Establish accuracy KPIs, implement model monitoring with drift alerts, conduct adversarial testing before each model release.",
        owner: "Engineering Lead",
        deadline: "45 days",
      },
      {
        article: "Art. 72",
        title: "Post-Market Monitoring",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Engineering monitors model performance before release.",
        gap: "Pre-release monitoring only. No structured post-market surveillance plan as required for high-risk systems. Complaint handling is reactive, not proactive.",
        remediation: "Implement structured post-market monitoring plan with KPIs, incident reporting triggers, and annual review cycle.",
        owner: "Head of Risk",
        deadline: "60 days",
      },
      {
        article: "Art. 17",
        title: "Quality Management System",
        status: "Validated",
        severity: "validated",
        policy_evidence: "Internal approval processes and standard procedures referenced.",
        gap: "General QMS exists but is not AI-specific. Partially meets requirements.",
        remediation: "Extend QMS to cover AI-specific requirements: model versioning, validation, deployment approvals, and change management.",
        owner: "CTO",
        deadline: "90 days",
      },
    ],
  },
  risk_actions: {
    trust_score: 38,
    critical_gaps: 3,
    warning_gaps: 3,
    validated_controls: 1,
    investor_risk: "High",
    founder_risk: "High",
    investor_memo: {
      investor_risk: "High — missing AI Act risk management, transparency, and data governance raise blockers for EU regulated investors.",
      founder_risk: "High — personal liability exposure under Art. 9 and Art. 10 if system is deployed without remediation.",
      red_flags: [
        "No formal AI risk management system (Art. 9) — required before EU deployment",
        "No bias testing or data governance documentation (Art. 10) — discrimination liability exposure",
        "No explainability mechanism for credit decisions (Art. 13) — non-negotiable for high-risk systems",
        "Human oversight informal and undocumented (Art. 14)",
        "No model drift detection or accuracy benchmarks (Art. 15)",
      ],
      conditions: [
        "Implement Art. 9 risk management system before next funding round",
        "Complete data governance and bias testing within 45 days",
        "Engage external EU AI Act auditor for conformity assessment",
        "Appoint AI Compliance Officer before EU market launch",
      ],
      recommendation: "Conditional pass — require 90-day remediation plan with milestone verification before EU deployment clearance.",
    },
    tickets: [
      {
        id: "RAD-001",
        task: "Establish AI Risk Management System",
        article: "Art. 9",
        owner: "Head of Risk",
        priority: "Critical",
        deadline: "30 days",
        description: "Document a continuous risk management cycle for the credit-scoring AI system, including risk identification, evaluation, mitigation, and residual risk acceptance criteria.",
      },
      {
        id: "RAD-002",
        task: "Implement Training Data Governance",
        article: "Art. 10",
        owner: "Head of Data",
        priority: "Critical",
        deadline: "45 days",
        description: "Define data sourcing, quality metrics, bias testing procedures, and representativeness assessment across demographic groups including age, gender, and nationality.",
      },
      {
        id: "RAD-003",
        task: "Deploy Model Explainability",
        article: "Art. 13",
        owner: "Product Lead",
        priority: "Critical",
        deadline: "60 days",
        description: "Implement SHAP/LIME or rule-based explanation generation. Create customer-facing explanation templates for automated credit decisions.",
      },
      {
        id: "RAD-004",
        task: "Formalise Human Oversight Procedures",
        article: "Art. 14",
        owner: "Head of Operations",
        priority: "High",
        deadline: "60 days",
        description: "Define human oversight roles, escalation thresholds, and documented checkpoints for credit decisions.",
      },
      {
        id: "RAD-005",
        task: "Establish Model Monitoring & Post-Market Surveillance",
        article: "Art. 15 / Art. 72",
        owner: "Engineering Lead",
        priority: "High",
        deadline: "45 days",
        description: "Set accuracy KPIs, implement real-time drift detection, establish post-market monitoring plan with incident reporting triggers.",
      },
    ],
    voice_briefing_script:
      "This is RADAR. FinCore AG's AI credit scoring system presents high investor and founder risk under the EU AI Act. Three critical gaps require immediate attention: Article 9 risk management system is absent; Article 10 data governance and bias testing are undocumented; and Article 13 transparency mechanisms are missing entirely. Human oversight is informal, post-market monitoring is inadequate, and accuracy benchmarks are not defined. The trust score is 38 out of 100. Recommendation: conditional pass with a 90-day remediation plan. Five remediation tickets have been generated. External EU AI Act auditor engagement is strongly advised before EU market deployment.",
  },
};

export const MEDTRIAGE_RESULT: AssessmentResult = {
  company_name: "MedTriage GmbH",
  isFallback: true,
  compliance_report: {
    summary:
      "MedTriage GmbH operates an AI emergency triage system that falls under EU AI Act Annex III as a medical device AI system. While ISO 13485 certification demonstrates commitment to quality, the assessment reveals critical gaps in AI-specific documentation, serious incident reporting procedures, and clinical validation documentation required under the EU AI Act for high-risk medical AI systems.",
    risk_class: "High-Risk AI System",
    eu_ai_act_applicability:
      "Article 6 + Annex III — AI systems used in medical devices for clinical decision support, particularly those influencing triage urgency classification, are classified as high-risk and subject to full EU AI Act compliance obligations, layered on top of MDR requirements.",
    gaps: [
      {
        article: "Art. 10",
        title: "Clinical Training Data Documentation",
        status: "Critical Gap",
        severity: "critical",
        policy_evidence: "No mention of training data sources or clinical validation methodology.",
        gap: "No documentation of clinical training dataset composition, patient demographic representation, validation against diverse patient populations, or dataset bias assessment across age, gender, and ethnicity.",
        remediation: "Document all training data sources, conduct bias analysis across demographic groups, implement prospective validation study documentation with clinical outcomes.",
        owner: "Chief Medical Officer",
        deadline: "45 days",
      },
      {
        article: "Art. 62",
        title: "Serious Incident Reporting",
        status: "Critical Gap",
        severity: "critical",
        policy_evidence: "No incident reporting procedures mentioned in policy.",
        gap: "No documented procedure for reporting serious AI-related incidents to national authorities. Required under EU AI Act Art. 62 for providers of high-risk AI systems. Creates immediate regulatory liability.",
        remediation: "Establish EU AI Act serious incident reporting procedures, designate responsible person, integrate with existing MDR vigilance reporting.",
        owner: "Regulatory Affairs",
        deadline: "30 days",
      },
      {
        article: "Art. 14",
        title: "Human Override Documentation",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Clinical staff have access to system output and may override recommendations.",
        gap: "Override capabilities exist but are not documented as formal human oversight mechanisms. No audit trail requirements for overrides documented.",
        remediation: "Formalise override procedures, implement override audit logging, train clinical staff on AI oversight responsibilities.",
        owner: "Clinical Operations Lead",
        deadline: "45 days",
      },
      {
        article: "Art. 13",
        title: "Patient-Facing Transparency",
        status: "Warning",
        severity: "warning",
        policy_evidence: "No patient notification mechanisms mentioned.",
        gap: "No documented mechanism to inform patients when AI is used in their triage assessment. EU AI Act requires affected persons to be informed of consequential automated decision-making.",
        remediation: "Implement patient notification at registration, create plain-language AI disclosure, update consent forms.",
        owner: "Patient Experience Lead",
        deadline: "60 days",
      },
      {
        article: "Art. 9",
        title: "AI-Specific Risk Management",
        status: "Warning",
        severity: "warning",
        policy_evidence: "ISO 13485 certification referenced.",
        gap: "ISO 13485 covers general medical device risk management but does not address AI-specific risks such as model drift, distribution shift in patient populations, or algorithmic bias in clinical contexts.",
        remediation: "Extend risk management system to include AI-specific risks: model drift monitoring, distribution shift alerts, clinical outcome monitoring.",
        owner: "Head of Quality",
        deadline: "60 days",
      },
      {
        article: "Art. 17",
        title: "Quality Management System",
        status: "Validated",
        severity: "validated",
        policy_evidence: "ISO 13485 certification covers quality management.",
        gap: "Partially meets requirements. ISO 13485 provides a strong foundation but needs AI-specific extensions per EU AI Act Annex IX.",
        remediation: "Extend QMS with AI-specific procedures: model validation, version control, clinical performance monitoring.",
        owner: "CTO",
        deadline: "90 days",
      },
      {
        article: "Annex I",
        title: "Essential Safety Requirements",
        status: "Validated",
        severity: "validated",
        policy_evidence: "Clinical advisory board reviews major changes. Quarterly system updates based on performance metrics.",
        gap: "Advisory board review process partially addresses safety requirements. Update cycle demonstrates proactive safety management.",
        remediation: "Document advisory board review criteria and connect to EU AI Act conformity assessment process.",
        owner: "Clinical Advisory Board",
        deadline: "60 days",
      },
    ],
  },
  risk_actions: {
    trust_score: 52,
    critical_gaps: 2,
    warning_gaps: 3,
    validated_controls: 2,
    investor_risk: "Medium-High",
    founder_risk: "High",
    investor_memo: {
      investor_risk: "Medium-High — ISO 13485 base and clinical oversight are positive signals, but missing incident reporting and training data documentation create regulatory risk.",
      founder_risk: "High — Art. 62 serious incident reporting gap creates personal liability if AI-related adverse events occur without proper reporting to authorities.",
      red_flags: [
        "No AI-specific training data documentation — creates liability if bias incidents cause patient harm",
        "Missing serious incident reporting procedures (Art. 62) — immediate regulatory exposure",
        "No patient notification of AI use — EU AI Act transparency violation",
      ],
      conditions: [
        "Establish Art. 62 serious incident reporting within 30 days",
        "Complete clinical training data audit and documentation within 45 days",
        "Integrate EU AI Act compliance with existing MDR regulatory affairs process",
      ],
      recommendation: "Conditional pass — lower risk than pure software AI due to ISO 13485 foundation. Priority: incident reporting and training data documentation.",
    },
    tickets: [
      {
        id: "RAD-001",
        task: "Establish EU AI Act Serious Incident Reporting",
        article: "Art. 62",
        owner: "Regulatory Affairs",
        priority: "Critical",
        deadline: "30 days",
        description: "Define reporting triggers, responsible person, national authority contacts, and integration with existing MDR vigilance reporting system.",
      },
      {
        id: "RAD-002",
        task: "Clinical Training Data Documentation",
        article: "Art. 10",
        owner: "Chief Medical Officer",
        priority: "Critical",
        deadline: "45 days",
        description: "Document all training data sources, patient demographics, validation datasets, bias analysis across age/gender/ethnicity, and prospective validation results.",
      },
      {
        id: "RAD-003",
        task: "Formalise Override & Human Oversight",
        article: "Art. 14",
        owner: "Clinical Operations",
        priority: "High",
        deadline: "45 days",
        description: "Implement override audit logging, formal override procedures, and clinical staff AI oversight training program.",
      },
      {
        id: "RAD-004",
        task: "Patient Transparency Disclosure",
        article: "Art. 13",
        owner: "Patient Experience",
        priority: "High",
        deadline: "60 days",
        description: "Create patient notifications at registration, plain-language AI disclosure documents, and updated consent forms.",
      },
    ],
    voice_briefing_script:
      "This is RADAR. MedTriage GmbH's emergency triage AI system presents medium-high investor risk and high founder risk under the EU AI Act. Two critical gaps demand immediate action: Article 62 serious incident reporting procedures are absent, creating immediate regulatory liability; and clinical training data documentation is missing, which is unacceptable for a medical AI system. Human oversight exists but is not formalised, and patient transparency disclosures are absent. The trust score is 52 out of 100, reflecting the positive contribution of ISO 13485 certification. Recommendation: conditional pass with priority action on incident reporting within 30 days and clinical data documentation within 45 days.",
  },
};

export const INDUSTRIAL_RESULT: AssessmentResult = {
  company_name: "AutoVision Systems",
  isFallback: true,
  compliance_report: {
    summary:
      "AutoVision Systems' AI quality inspection system demonstrates strong operational maturity with 18 months of deployment and 99.2% uptime. However, the system lacks AI-specific compliance documentation required under the EU AI Act. Classification review is needed to confirm whether Annex III applies. Even under limited-risk classification, transparency and logging obligations apply immediately.",
    risk_class: "Potentially High-Risk / Limited-Risk AI System",
    eu_ai_act_applicability:
      "Classification review required under Article 6. Industrial AI systems in safety-critical production environments may fall under Annex III. Customer deployments in automotive safety contexts may escalate classification. Minimum: transparency obligations under Art. 13 apply regardless of classification.",
    gaps: [
      {
        article: "Art. 9",
        title: "AI-Specific Risk Documentation",
        status: "Critical Gap",
        severity: "critical",
        policy_evidence: "Performance monitoring and monthly reports referenced.",
        gap: "Monitoring is informal with no documented AI-specific risk management system covering failure modes, out-of-distribution detection, or production environment risk assessment.",
        remediation: "Document AI-specific risk management: failure mode analysis, out-of-distribution detection, production environment risk assessment, residual risk acceptance criteria.",
        owner: "Head of Engineering",
        deadline: "45 days",
      },
      {
        article: "Art. 12",
        title: "Logging & Audit Trail Requirements",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Alerts sent to quality control teams for review. Monthly reports provided.",
        gap: "No documented logging strategy for AI decisions. Monthly reports are aggregated, not decision-level audit trails as required for high-risk systems.",
        remediation: "Implement decision-level logging with timestamps, confidence scores, and human review outcomes. Retain logs per EU AI Act requirements.",
        owner: "Engineering Lead",
        deadline: "30 days",
      },
      {
        article: "Art. 10",
        title: "Training Data Representativeness",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Training data sourced from client manufacturing facilities under data sharing agreements.",
        gap: "No documentation of training data representativeness across different client environments, manufacturing variations, or lighting/environmental conditions. Data sharing agreements do not address EU AI Act data governance.",
        remediation: "Document training data distribution, conduct representativeness analysis, update data sharing agreements to include EU AI Act data governance provisions.",
        owner: "Head of Data Science",
        deadline: "60 days",
      },
      {
        article: "Art. 15",
        title: "Accuracy & Model Drift Monitoring",
        status: "Warning",
        severity: "warning",
        policy_evidence: "Engineering team monitors for performance degradation. 99.2% uptime referenced.",
        gap: "Uptime metric does not address model accuracy drift. No documented accuracy benchmarks, drift detection thresholds, or retraining triggers.",
        remediation: "Establish accuracy KPIs per product line, implement automated drift detection, define retraining triggers and validation procedures.",
        owner: "Head of Engineering",
        deadline: "45 days",
      },
      {
        article: "Art. 17",
        title: "Post-Deployment Monitoring Plan",
        status: "Validated",
        severity: "validated",
        policy_evidence: "18 months deployment with monitoring. Clients receive monthly performance reports.",
        gap: "Monitoring exists but is not formally structured as a post-market surveillance plan. Monthly reporting is a positive practice.",
        remediation: "Formalise monitoring into a post-market surveillance plan with defined KPIs, reporting cadence, and escalation procedures.",
        owner: "Customer Success",
        deadline: "60 days",
      },
      {
        article: "Art. 13",
        title: "Technical Documentation",
        status: "Validated",
        severity: "validated",
        policy_evidence: "Client reporting and data sharing agreements documented.",
        gap: "Client reporting demonstrates transparency practice. Technical documentation needs expansion to cover EU AI Act Annex IV requirements.",
        remediation: "Expand technical documentation to meet Annex IV: intended purpose, architecture, training methodology, performance validation.",
        owner: "Product Lead",
        deadline: "60 days",
      },
      {
        article: "Art. 14",
        title: "Human Oversight Procedures",
        status: "Validated",
        severity: "validated",
        policy_evidence: "System operates autonomously with alerts sent to quality control teams for review.",
        gap: "QC team review partially satisfies human oversight. Review procedures should be formalised with defined response times and escalation.",
        remediation: "Document QC review procedures, response time SLAs, escalation paths, and override logging.",
        owner: "Quality Control Lead",
        deadline: "45 days",
      },
    ],
  },
  risk_actions: {
    trust_score: 65,
    critical_gaps: 1,
    warning_gaps: 3,
    validated_controls: 3,
    investor_risk: "Medium",
    founder_risk: "Medium",
    investor_memo: {
      investor_risk: "Medium — operational maturity and existing monitoring are positive signals. Primary risk is classification ambiguity and missing risk documentation.",
      founder_risk: "Medium — risk is manageable with a focused documentation sprint. No immediate regulatory exposure if system stays in low-risk industrial contexts.",
      red_flags: [
        "No formal AI risk management documentation (Art. 9) — required before high-risk classification confirmed",
        "Missing decision-level audit logging (Art. 12) — immediate compliance gap",
        "Training data representativeness not documented — liability if defect misses cause safety incidents",
      ],
      conditions: [
        "Conduct EU AI Act classification review with legal counsel",
        "Implement AI-specific risk documentation within 45 days",
        "Establish decision-level audit logging within 30 days",
      ],
      recommendation: "Pass with conditions — strongest compliance posture of assessed scenarios. Focus on classification clarity and documentation gaps.",
    },
    tickets: [
      {
        id: "RAD-001",
        task: "Implement Decision-Level Audit Logging",
        article: "Art. 12",
        owner: "Engineering Lead",
        priority: "Critical",
        deadline: "30 days",
        description: "Deploy logging for all AI inspection decisions: confidence scores, timestamps, product identifiers, and QC review outcomes.",
      },
      {
        id: "RAD-002",
        task: "AI Risk Management Documentation",
        article: "Art. 9",
        owner: "Head of Engineering",
        priority: "High",
        deadline: "45 days",
        description: "Document failure mode analysis, out-of-distribution detection approach, production environment risk assessment, and residual risk criteria.",
      },
      {
        id: "RAD-003",
        task: "Accuracy KPIs & Drift Detection",
        article: "Art. 15",
        owner: "Head of Data Science",
        priority: "High",
        deadline: "45 days",
        description: "Define accuracy benchmarks per product line, implement automated drift detection, establish retraining triggers and validation requirements.",
      },
    ],
    voice_briefing_script:
      "This is RADAR. AutoVision Systems' industrial AI inspection system presents medium investor and founder risk — the strongest compliance posture of our three assessed scenarios. The trust score is 65 out of 100. The primary critical gap is the absence of AI-specific risk documentation under Article 9. Warning areas include audit logging, training data representativeness, and accuracy drift monitoring. Notably, three controls are already validated: post-deployment monitoring, technical documentation practices, and human oversight via QC team review. Key recommendation: conduct EU AI Act classification review with legal counsel, then prioritise decision-level audit logging within 30 days.",
  },
};
