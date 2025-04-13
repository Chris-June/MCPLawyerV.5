// Type definitions for Pathways Law Practice Management Client

export interface Role {
  id: string
  name: string
  description: string
  instructions: string
  domains: string[]
  tone: string
  system_prompt: string
  is_default: boolean
}

export interface Memory {
  id: string
  role_id: string
  content: string
  type: string
  importance: string
  embedding?: number[]
  created_at: string
  expires_at: string
}

export interface ProcessQueryRequest {
  role_id: string
  query: string
  custom_instructions?: string
}

export interface ProcessQueryResponse {
  role_id: string
  query: string
  response: string
}

// Law Practice Management Types
export * from './precedentManagement';
export * from './legalTools';
export * from './clientIntake';
export * from './contractAnalysis';

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  practice_areas: string[]
  jurisdictions: string[]
  template_fields: string[]
}

export interface LimitationPeriod {
  name: string
  description: string
  entries: Record<string, Record<string, string>>
}

export interface CourtDeadline {
  name: string
  description: string
  entries: Record<string, Record<string, string>>
}

export interface ClientIntakeForm {
  id: string
  name: string
  description: string
  fields: string[]
}

export interface GenerateDocumentRequest {
  template_id: string
  field_values: Record<string, string>
}

export interface GenerateDocumentResponse {
  content: string
}

export interface AnalyzeLegalIssueRequest {
  issue_description: string
  jurisdiction: string
  practice_area: string
}

export interface AnalyzeLegalIssueResponse {
  analysis: string
}

export interface CalculateDeadlineRequest {
  start_date: string
  deadline_type: string
  jurisdiction: string
}

export interface CalculateDeadlineResponse {
  start_date: string
  deadline_type: string
  jurisdiction: string
  deadline_description: string
  deadline_date: string
  days_remaining: number
}

// Practice Area type for client intake forms
export interface PracticeArea {
  id: string
  name: string
  description?: string
}

export interface AIInterviewQuestion {
  id: string
  text: string
  type: 'open_ended' | 'multiple_choice'
  options?: string[]
  question?: string
  intent?: string
}

export interface AIInterviewResponse {
  questionId: string
  response: string
  confidence?: number
  nextQuestions?: AIInterviewQuestion[]
}

export interface AIInterviewSession {
  sessionId: string
  practiceArea: string
  caseType?: string
  questions: AIInterviewQuestion[]
  caseSummary?: string
  caseAssessment?: CaseAssessment
}

export interface CaseAssessment {
  strengths: string[]
  weaknesses: string[]
  risks: string[]
  recommendations: string[]
  legalIssues?: string[]
  recommendedActions?: string[]
  riskAssessment?: string
  estimatedTimeframe?: string
  estimatedCosts?: {
    legal_fees: number
    court_fees: number
    expert_witness_fees: number
    total_estimated_cost: number
    range?: {
      min: number
      max: number
    }
    factors?: string[]
  }
  additionalNotes?: string
  summary?: string
}
