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

export const FINCORE_DEMO: AssessmentInputs = {
  company_name: "FinCore AG",
  industry: "Fintech",
  country: "Switzerland / EU market",
  company_stage: "Seed",
  product_description: "AI credit scoring tool for SME loans",
  policy_text:
    "FinCore AG uses artificial intelligence to support loan eligibility decisions for small business customers. Customer data is processed securely and access is limited to authorized employees. The company follows general privacy principles and internal approval processes before deploying new software features. Engineering teams are responsible for testing model performance before release. Customer support teams may review complaints when users contact the company. The company stores business data according to internal retention rules and follows standard cybersecurity procedures.",
};

export function tryParse(value: any): any {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}
