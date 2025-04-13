// Type definitions for Legal Tools

// Legal Research Types
export interface LegalResearchRequest {
  query: string
  jurisdiction?: string
  database?: string
}

export interface LegalResearchResponse {
  query: string
  jurisdiction?: string
  database: {
    id: string
    name: string
    description: string
    url: string
    search_url: string
  }
  results: string
  disclaimer: string
}

export interface CaseBriefRequest {
  case_citation: string
}

export interface CaseBriefResponse {
  citation: string
  brief: string
  disclaimer: string
}

// Citation Formatter Types
export interface CaseCitationRequest {
  case_info: {
    case_name: string
    year: string
    volume: string
    reporter: string
    page: string
    court?: string
    jurisdiction?: string
  }
  style?: string
}

export interface LegislationCitationRequest {
  legislation_info: {
    title: string
    jurisdiction: string
    year: string
    chapter: string
    statute_volume?: string
    sections?: string
  }
  style?: string
}

export interface CitationFormatterResponse {
  case_info?: Record<string, string>
  legislation_info?: Record<string, string>
  style: {
    id: string
    name: string
    version: string
  }
  formatted_citation: string
}

export interface ParseCitationRequest {
  citation_text: string
}

export interface ParseCitationResponse {
  original_citation: string
  parsed_result: string
}

export interface CitationStyle {
  id: string
  name: string
  description: string
  version: string
  is_default: boolean
}

// Document Comparison Types
export interface DocumentComparisonRequest {
  original_text: string
  revised_text: string
  format: 'html' | 'markdown' | 'text'
}

export interface DocumentComparisonResponse {
  format: string
  comparison_result: string
  stats: {
    original_length: number
    revised_length: number
    original_lines: number
    revised_lines: number
  }
}

export interface SummarizeChangesRequest {
  original_text: string
  revised_text: string
}

export interface SummarizeChangesResponse {
  summary: string
  stats: {
    original_length: number
    revised_length: number
    original_lines: number
    revised_lines: number
  }
}

export interface ExtractClausesRequest {
  document_text: string
}

export interface ExtractClausesResponse {
  extracted_clauses: string
  document_length: number
}

// Legal Fee Calculator Types
export interface HourlyFeeEstimateRequest {
  matter_type: string
  complexity: string
  estimated_hours: Record<string, number>
}

export interface HourlyFeeEstimateResponse {
  matter_type: string
  complexity: string
  complexity_multiplier: number
  fee_structure: string
  currency: string
  line_items: Array<{
    role: string
    role_name: string
    hours: number
    rate: number
    fee: number
    currency: string
  }>
  summary: {
    total_hours: number
    total_fees: number
    disbursements: number
    taxes: number
    total: number
  }
  disclaimer: string
}

export interface FixedFeeEstimateRequest {
  matter_type: string
  service_type: string
  complexity?: string
}

export interface FixedFeeEstimateResponse {
  matter_type: string
  service_type: string
  complexity: string
  fee_structure: string
  currency: string
  fee_estimate: string
  disclaimer: string
}

export interface ContingencyFeeEstimateRequest {
  matter_type: string
  estimated_recovery: number
}

export interface ContingencyFeeEstimateResponse {
  matter_type: string
  fee_structure: string
  currency: string
  estimated_recovery: number
  contingency_percentage: number
  summary: {
    contingency_fee: number
    disbursements: number
    taxes: number
    total_costs: number
    net_recovery: number
  }
  disclaimer: string
}

export interface RecommendFeeStructureRequest {
  matter_type: string
  matter_details: Record<string, any>
}

export interface RecommendFeeStructureResponse {
  matter_type: string
  recommendation: string
}

// Court Filing Types
export interface CourtRulesRequest {
  jurisdiction: string
}

export interface CourtRulesResponse {
  jurisdiction: string
  name: string
  rules_name: string
  rules_url: string
  practice_directions_url: string
}

export interface FilingRequirementsRequest {
  document_type: string
}

export interface FilingRequirementsResponse {
  document_type: string
  court: string
  rule_reference: string
  filing_fee: number
  required_copies: number
  format_requirements: string[]
  content_requirements: string[]
  time_limits: Record<string, string>
}

export interface CourtFormsRequest {
  jurisdiction: string
}

export interface CourtFormsResponse {
  jurisdiction: string
  name: string
  url: string
  forms: Array<{
    code: string
    name: string
    url: string
  }>
}

export interface FilingChecklistRequest {
  document_type: string
  jurisdiction: string
}

export interface FilingChecklistResponse {
  document_type: string
  jurisdiction: string
  checklist: string
  generated_date: string
}

export interface DocumentValidationRequest {
  document_text: string
  document_type: string
  jurisdiction: string
}

export interface DocumentValidationResponse {
  document_type: string
  jurisdiction: string
  validation_report: string
  validation_date: string
  disclaimer: string
}

export interface FilingInstructionsRequest {
  document_type: string
  jurisdiction: string
}

export interface FilingInstructionsResponse {
  document_type: string
  jurisdiction: string
  instructions: string
  generated_date: string
  disclaimer: string
}

// Predictive Case Outcome Analysis Types
export interface PredictiveAnalysisRequest {
  case_facts: string
  legal_issues: string[]
  jurisdiction: string
  relevant_statutes?: string[]
  similar_cases?: string[]
  client_position: string
  opposing_arguments?: string
}

export interface PredictiveAnalysisResponse {
  case_summary: string
  outcome_prediction: {
    favorable_outcome_percentage: number
    confidence_level: 'high' | 'medium' | 'low'
    prediction_rationale: string
  }
  similar_precedents: Array<{
    case_citation: string
    relevance_score: number
    outcome: string
    key_factors: string[]
  }>
  strength_weakness_analysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  recommended_strategies: string[]
  alternative_outcomes: Array<{
    scenario: string
    probability: number
    impact: string
  }>
  disclaimer: string
}
