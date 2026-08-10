export type RoleLevel =
  | "leadership"
  | "professional_technical"
  | "assistant"
  | "operator";

export type AppRole =
  | "super_admin"
  | "psychologist"
  | "company_admin"
  | "viewer";

export type RiskKey = "none" | "low" | "medium" | "high" | "very_high";

export type RiskLevel = { key: RiskKey; label: string; max: number };

export type Instrument = {
  id: string;
  form: "A" | "B";
  name: string;
  version: string;
  isDemo: boolean;
  notice: string;
  options: Array<{ value: number; label: string }>;
  domains: Record<string, string>;
  dimensions: Array<{
    key: string;
    label: string;
    domain: string;
    factor: number;
    baremos: RiskLevel[];
  }>;
  questions: Array<{
    id: string;
    dimension: string;
    text: string;
    direction: "risk" | "protective";
  }>;
};

export type ScoreResult = {
  instrumentId: string;
  form: "A" | "B";
  version: string;
  isDemo: boolean;
  answered: number;
  dimensions: Array<{
    key: string;
    label: string;
    domain: string;
    raw: number;
    factor: number;
    score: number;
    risk: { key: RiskKey; label: string };
  }>;
  domains: Array<{
    key: string;
    label: string;
    raw: number;
    factor: number;
    score: number;
    risk: { key: RiskKey; label: string };
  }>;
  total: {
    raw: number;
    factor: number;
    score: number;
    risk: { key: RiskKey; label: string };
  };
  calculatedAt: string;
};
