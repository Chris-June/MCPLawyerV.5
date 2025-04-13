import type {
  // Legal Research Types
  LegalResearchRequest,
  LegalResearchResponse,
  CaseBriefRequest,
  CaseBriefResponse,
  
  // Citation Formatter Types
  CaseCitationRequest,
  LegislationCitationRequest,
  CitationFormatterResponse,
  ParseCitationRequest,
  ParseCitationResponse,
  CitationStyle,
  
  // Document Comparison Types
  DocumentComparisonRequest,
  DocumentComparisonResponse,
  SummarizeChangesRequest,
  SummarizeChangesResponse,
  ExtractClausesRequest,
  ExtractClausesResponse,
  
  // Legal Fee Calculator Types
  HourlyFeeEstimateRequest,
  HourlyFeeEstimateResponse,
  FixedFeeEstimateRequest,
  FixedFeeEstimateResponse,
  ContingencyFeeEstimateRequest,
  ContingencyFeeEstimateResponse,
  RecommendFeeStructureRequest,
  RecommendFeeStructureResponse,
  
  // Court Filing Types
  CourtRulesRequest,
  CourtRulesResponse,
  FilingRequirementsRequest,
  FilingRequirementsResponse,
  CourtFormsRequest,
  CourtFormsResponse,
  FilingChecklistRequest,
  FilingChecklistResponse,
  DocumentValidationRequest,
  DocumentValidationResponse,
  FilingInstructionsRequest,
  FilingInstructionsResponse,
  
  // Predictive Case Outcome Analysis Types
  PredictiveAnalysisRequest,
  PredictiveAnalysisResponse
} from '@/types'

// Import standardized API configuration
import { buildUrl } from './apiConfig'

// Legal Research API Functions
export async function searchCaseLaw(request: LegalResearchRequest): Promise<LegalResearchResponse> {
  const { query, jurisdiction, database } = request
  
  let url = buildUrl(`legal-tools/legal-research/case-law?query=${encodeURIComponent(query)}`)
  if (jurisdiction) url += `&jurisdiction=${encodeURIComponent(jurisdiction)}`
  if (database) url += `&database=${encodeURIComponent(database)}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to search case law')
  }
  return await response.json()
}

export async function searchLegislation(request: LegalResearchRequest): Promise<LegalResearchResponse> {
  const { query, jurisdiction, database } = request
  
  let url = buildUrl(`legal-tools/legal-research/legislation?query=${encodeURIComponent(query)}`)
  if (jurisdiction) url += `&jurisdiction=${encodeURIComponent(jurisdiction)}`
  if (database) url += `&database=${encodeURIComponent(database)}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to search legislation')
  }
  return await response.json()
}

export async function getCaseBrief(caseCitation: string): Promise<CaseBriefResponse> {
  const response = await fetch(buildUrl(`legal-tools/legal-research/case-brief/${encodeURIComponent(caseCitation)}`))
  if (!response.ok) {
    throw new Error('Failed to get case brief')
  }
  return await response.json()
}

// Citation Formatter API Functions
export async function formatCaseCitation(request: CaseCitationRequest): Promise<CitationFormatterResponse> {
  const response = await fetch(buildUrl('legal-tools/citation-formatter/case'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to format case citation')
  }
  return await response.json()
}

export async function formatLegislationCitation(request: LegislationCitationRequest): Promise<CitationFormatterResponse> {
  const response = await fetch(buildUrl('legal-tools/citation-formatter/legislation'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to format legislation citation')
  }
  return await response.json()
}

export async function parseCitation(citationText: string): Promise<ParseCitationResponse> {
  const response = await fetch(buildUrl('legal-tools/citation-formatter/parse'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ citation_text: citationText }),
  })
  if (!response.ok) {
    throw new Error('Failed to parse citation')
  }
  return await response.json()
}

export async function getCitationStyles(): Promise<CitationStyle[]> {
  const response = await fetch(buildUrl('legal-tools/citation-formatter/styles'))
  if (!response.ok) {
    throw new Error('Failed to get citation styles')
  }
  return await response.json()
}

// Document Comparison API Functions
export async function compareDocuments(request: DocumentComparisonRequest): Promise<DocumentComparisonResponse> {
  const response = await fetch(buildUrl('legal-tools/document-comparison/compare'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to compare documents')
  }
  return await response.json()
}

export async function summarizeChanges(request: SummarizeChangesRequest): Promise<SummarizeChangesResponse> {
  const response = await fetch(buildUrl('legal-tools/document-comparison/summarize'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to summarize changes')
  }
  return await response.json()
}

export async function extractClauses(documentText: string): Promise<ExtractClausesResponse> {
  const response = await fetch(buildUrl('legal-tools/document-comparison/extract-clauses'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ document_text: documentText }),
  })
  if (!response.ok) {
    throw new Error('Failed to extract clauses')
  }
  return await response.json()
}

// Legal Fee Calculator API Functions
export async function calculateHourlyFeeEstimate(request: HourlyFeeEstimateRequest): Promise<HourlyFeeEstimateResponse> {
  const response = await fetch(buildUrl('legal-tools/fee-calculator/hourly-estimate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to calculate hourly fee estimate')
  }
  return await response.json()
}

export async function calculateFixedFeeEstimate(request: FixedFeeEstimateRequest): Promise<FixedFeeEstimateResponse> {
  const response = await fetch(buildUrl('legal-tools/fee-calculator/fixed-fee-estimate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to calculate fixed fee estimate')
  }
  return await response.json()
}

export async function calculateContingencyFeeEstimate(request: ContingencyFeeEstimateRequest): Promise<ContingencyFeeEstimateResponse> {
  const response = await fetch(buildUrl('legal-tools/fee-calculator/contingency-fee-estimate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to calculate contingency fee estimate')
  }
  return await response.json()
}

export async function recommendFeeStructure(request: RecommendFeeStructureRequest): Promise<RecommendFeeStructureResponse> {
  const response = await fetch(buildUrl('legal-tools/fee-calculator/recommend-structure'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to recommend fee structure')
  }
  return await response.json()
}

// Court Filing API Functions
export async function getCourtRules(jurisdiction: string): Promise<CourtRulesResponse> {
  const response = await fetch(buildUrl(`legal-tools/court-filing/rules/${encodeURIComponent(jurisdiction)}`))
  if (!response.ok) {
    throw new Error('Failed to get court rules')
  }
  return await response.json()
}

export async function getFilingRequirements(documentType: string): Promise<FilingRequirementsResponse> {
  const response = await fetch(buildUrl(`legal-tools/court-filing/requirements/${encodeURIComponent(documentType)}`))
  if (!response.ok) {
    throw new Error('Failed to get filing requirements')
  }
  return await response.json()
}

export async function getCourtForms(jurisdiction: string): Promise<CourtFormsResponse> {
  const response = await fetch(buildUrl(`legal-tools/court-filing/forms/${encodeURIComponent(jurisdiction)}`))
  if (!response.ok) {
    throw new Error('Failed to get court forms')
  }
  return await response.json()
}

export async function generateFilingChecklist(request: FilingChecklistRequest): Promise<FilingChecklistResponse> {
  const { document_type, jurisdiction } = request
  const response = await fetch(buildUrl(`legal-tools/court-filing/checklist?document_type=${encodeURIComponent(document_type)}&jurisdiction=${encodeURIComponent(jurisdiction)}`))
  if (!response.ok) {
    throw new Error('Failed to generate filing checklist')
  }
  return await response.json()
}

export async function validateCourtDocument(request: DocumentValidationRequest): Promise<DocumentValidationResponse> {
  const response = await fetch(buildUrl('legal-tools/court-filing/validate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to validate court document')
  }
  return await response.json()
}

export async function generateFilingInstructions(request: FilingInstructionsRequest): Promise<FilingInstructionsResponse> {
  const { document_type, jurisdiction } = request
  const response = await fetch(buildUrl(`legal-tools/court-filing/instructions?document_type=${encodeURIComponent(document_type)}&jurisdiction=${encodeURIComponent(jurisdiction)}`))
  if (!response.ok) {
    throw new Error('Failed to generate filing instructions')
  }
  return await response.json()
}

// Predictive Case Outcome Analysis API Functions
export async function analyzePredictiveOutcome(request: PredictiveAnalysisRequest): Promise<PredictiveAnalysisResponse> {
  const response = await fetch(buildUrl('legal-tools/predictive-analysis/case-outcome'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to analyze case outcome: ${response.statusText}`)
  }
  return await response.json()
}
