export enum RiskLevel {
  NO_RISK = "no_risk",
  LOW_RISK = "low_risk",
  MEDIUM_RISK = "medium_risk",
  HIGH_RISK = "high_risk",
  CRITICAL_RISK = "critical_risk"
}

export enum ClauseCategory {
  INDEMNIFICATION = "indemnification",
  LIABILITY = "liability",
  TERMINATION = "termination",
  CONFIDENTIALITY = "confidentiality",
  INTELLECTUAL_PROPERTY = "intellectual_property",
  FORCE_MAJEURE = "force_majeure",
  GOVERNING_LAW = "governing_law",
  PAYMENT_TERMS = "payment_terms",
  REPRESENTATIONS_WARRANTIES = "representations_warranties",
  DISPUTE_RESOLUTION = "dispute_resolution",
  ASSIGNMENT = "assignment",
  AMENDMENT = "amendment",
  NOTICES = "notices",
  DEFINITIONS = "definitions",
  OTHER = "other"
}

export interface ContractClause {
  id: string;
  title: string;
  text: string;
  category: ClauseCategory;
  risk_level: RiskLevel;
  risk_explanation?: string;
  suggested_changes?: string;
  position: {
    start: number;
    end: number;
  };
  metadata?: Record<string, any>;
}

export interface TemplateMatch {
  template_id: string;
  template_name: string;
  similarity_score: number;
  differences?: string;
}

export interface ClauseAnalysis {
  clause: ContractClause;
  template_matches?: TemplateMatch[];
  alternative_wording?: string;
  provincial_differences?: Record<string, string>;
  legal_concerns?: string[];
}

export interface ContractSummary {
  id: string;
  title: string;
  contract_type: string;
  parties: string[];
  effective_date?: string;
  termination_date?: string;
  key_points: string[];
  missing_clauses: string[];
}

export interface ContractAnalysisRequest {
  contract_text: string;
  contract_name?: string;
  contract_type?: string;
  jurisdiction?: string;
  comparison_template_ids?: string[];
  party_names?: string[];
}

export interface ContractAnalysisResult {
  id: string;
  summary: ContractSummary;
  clauses: ClauseAnalysis[];
  overall_risk_level: RiskLevel;
  overall_risk_explanation: string;
  overall_score: number;
  recommendations: string[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ContractComparisonRequest {
  contract_a_text: string;
  contract_b_text: string;
  contract_a_name?: string;
  contract_b_name?: string;
  focus_categories?: ClauseCategory[];
}

export interface ClauseDifference {
  category: ClauseCategory;
  title: string;
  contract_a_text: string;
  contract_b_text: string;
  significance: RiskLevel;
  explanation: string;
}

export interface ContractComparisonResult {
  id: string;
  contract_a_name: string;
  contract_b_name: string;
  common_clauses: ClauseCategory[];
  unique_to_a: ClauseCategory[];
  unique_to_b: ClauseCategory[];
  differences: ClauseDifference[];
  recommendation: string;
  created_at: string;
}

export interface StandardTemplate {
  id: string;
  name: string;
  description: string;
  contract_type: string;
  jurisdiction?: string;
  clauses: Record<ClauseCategory, string>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessmentSettings {
  jurisdiction: string;
  industry?: string;
  risk_weights: Record<ClauseCategory, number>;
  custom_flags: string[];
  threshold_overrides: Record<RiskLevel, number>;
}
