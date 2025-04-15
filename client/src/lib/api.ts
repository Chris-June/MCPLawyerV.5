import type { 
  Role, 
  Memory, 
  ProcessQueryRequest, 
  ProcessQueryResponse,
  DocumentTemplate,
  LimitationPeriod,
  CourtDeadline,
  ClientIntakeForm,
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  AnalyzeLegalIssueRequest,
  AnalyzeLegalIssueResponse,
  CalculateDeadlineRequest,
  CalculateDeadlineResponse,
  PracticeArea,
  IntakeForm,
  AIInterviewSession,
  AIInterviewResponse,
  CaseAssessment,
  ContractAnalysisRequest,
  ContractAnalysisResult,
  ContractComparisonRequest,
  ContractComparisonResult,
  StandardTemplate,
  AIInterviewQuestion
} from '@/types'

export interface CreateMemoryRequest {
  role_id: string
  content: string
  type: string
  importance: string
}

// Import standardized API configuration
import { API_BASE, buildUrl } from './apiConfig'

// Generic API request function for reuse across different API modules
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', data, headers = {} } = options;
  
  const requestHeaders: Record<string, string> = {
    ...headers,
  };
  
  if (data) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  
  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(buildUrl(endpoint), config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  
  // Check if response has content before parsing as JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json() as T;
  }
  
  return {} as T;
}

export async function fetchRoles(): Promise<Role[]> {
  const response = await fetch(buildUrl('roles'))
  if (!response.ok) {
    throw new Error('Failed to fetch roles')
  }
  const data = await response.json()
  return data.roles
}

export async function fetchRole(roleId: string): Promise<Role> {
  const response = await fetch(buildUrl(`roles/${roleId}`))
  if (!response.ok) {
    throw new Error(`Failed to fetch role: ${roleId}`)
  }
  const data = await response.json()
  return data.role
}

export async function createRole(role: Omit<Role, 'is_default'>): Promise<Role> {
  const response = await fetch(buildUrl('roles'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(role),
  })
  if (!response.ok) {
    throw new Error('Failed to create role')
  }
  const data = await response.json()
  return data.role
}

export async function updateRole(roleId: string, role: Partial<Role>): Promise<Role> {
  const response = await fetch(buildUrl(`roles/${roleId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(role),
  })
  if (!response.ok) {
    throw new Error(`Failed to update role: ${roleId}`)
  }
  const data = await response.json()
  return data.role
}

export async function deleteRole(roleId: string): Promise<void> {
  const response = await fetch(buildUrl(`roles/${roleId}`), {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete role: ${roleId}`)
  }
}

export async function processQuery(request: ProcessQueryRequest): Promise<ProcessQueryResponse> {
  const response = await fetch(buildUrl('roles/process'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to process query')
  }
  return await response.json()
}

export async function fetchMemories(roleId: string): Promise<Memory[]> {
  const response = await fetch(buildUrl(`memories/${roleId}`))
  if (!response.ok) {
    throw new Error(`Failed to fetch memories for role: ${roleId}`)
  }
  const data = await response.json()
  return data.memories
}

export async function createMemory(memory: CreateMemoryRequest): Promise<Memory> {
  const response = await fetch(buildUrl('memories'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memory),
  })
  if (!response.ok) {
    throw new Error('Failed to create memory')
  }
  const data = await response.json()
  return data.memory
}

export async function clearMemories(roleId: string): Promise<void> {
  const response = await fetch(buildUrl(`memories/${roleId}`), {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to clear memories for role: ${roleId}`)
  }
}

// Law Practice Management API Functions

export async function fetchDocumentTemplates(practiceArea?: string, jurisdiction?: string): Promise<DocumentTemplate[]> {
  const params = new URLSearchParams()
  if (practiceArea) params.append('practice_area', practiceArea)
  if (jurisdiction) params.append('jurisdiction', jurisdiction)
  
  const response = await fetch(buildUrl(`document-templates?${params.toString()}`))
  if (!response.ok) {
    throw new Error('Failed to fetch document templates')
  }
  return await response.json()
}

export async function fetchLimitationPeriods(jurisdiction?: string): Promise<LimitationPeriod> {
  const params = new URLSearchParams()
  if (jurisdiction) params.append('jurisdiction', jurisdiction)
  
  const response = await fetch(buildUrl(`limitation-periods?${params.toString()}`))
  if (!response.ok) {
    throw new Error('Failed to fetch limitation periods')
  }
  return await response.json()
}

export async function fetchCourtDeadlines(jurisdiction?: string): Promise<CourtDeadline> {
  const params = new URLSearchParams()
  if (jurisdiction) params.append('jurisdiction', jurisdiction)
  
  const response = await fetch(buildUrl(`court-deadlines?${params.toString()}`))
  if (!response.ok) {
    throw new Error('Failed to fetch court deadlines')
  }
  return await response.json()
}

export async function fetchClientIntakeForm(practiceArea: string): Promise<ClientIntakeForm> {
  const response = await fetch(buildUrl(`client-intake-form/${practiceArea}`))
  if (!response.ok) {
    throw new Error(`Failed to fetch client intake form for practice area: ${practiceArea}`)
  }
  return await response.json()
}

export async function generateDocument(request: GenerateDocumentRequest): Promise<GenerateDocumentResponse> {
  const response = await fetch(buildUrl(`generate-document/${request.template_id}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request.field_values),
  })
  if (!response.ok) {
    throw new Error('Failed to generate document')
  }
  return await response.json()
}

export async function analyzeLegalIssue(request: AnalyzeLegalIssueRequest): Promise<AnalyzeLegalIssueResponse> {
  const response = await fetch(buildUrl('analyze-legal-issue'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Failed to analyze legal issue')
  }
  return await response.json()
}

// Fetch available practice areas for client intake forms
export async function fetchPracticeAreas(): Promise<PracticeArea[]> {
  const response = await fetch(buildUrl('practice-areas'))
  if (!response.ok) {
    throw new Error('Failed to fetch practice areas')
  }
  return await response.json()
}

// Submit a client intake form
export async function submitClientIntakeForm(practiceArea: string, formData: Record<string, string>): Promise<any> {
  const response = await fetch(buildUrl(`client-intake-form/${practiceArea}/submit`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
  if (!response.ok) {
    throw new Error(`Failed to submit client intake form for practice area: ${practiceArea}`)
  }
  return await response.json()
}

// Analyze a client intake form using AI
export async function analyzeClientIntakeForm(practiceArea: string, formData: Record<string, string>): Promise<any> {
  const response = await fetch(buildUrl(`client-intake-form/${practiceArea}/analyze`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
  if (!response.ok) {
    throw new Error(`Failed to analyze client intake form for practice area: ${practiceArea}`)
  }
  return await response.json()
}

export async function calculateDeadline(request: CalculateDeadlineRequest): Promise<CalculateDeadlineResponse> {
  const params = new URLSearchParams()
  params.append('start_date', request.start_date)
  params.append('deadline_type', request.deadline_type)
  params.append('jurisdiction', request.jurisdiction)
  
  const response = await fetch(buildUrl(`calculate-deadline?${params.toString()}`))
  if (!response.ok) {
    throw new Error('Failed to calculate deadline')
  }
  return await response.json()
}

// Client Intake Interview API Functions

// Create a new AI-driven interview session
export async function createInterviewSession(practiceArea: string): Promise<AIInterviewSession> {
  console.log(`DEBUG: Attempting to create interview session for practice area: ${practiceArea}`);
  
  try {
    const response = await fetch(buildUrl('interview/start'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        practice_area: practiceArea, 
        case_type: null 
      })
    });
    
    console.log(`DEBUG: Received response status: ${response.status}`);
    
    // Log response headers
    for (const [key, value] of response.headers.entries()) {
      console.log(`Response Header - ${key}: ${value}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DEBUG: Error response text: ${errorText}`);
      
      // More detailed error handling
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const sessionData = await response.json();
    console.log('DEBUG: Received interview session data:', sessionData);
    return sessionData;
  } catch (error) {
    console.error('DEBUG: Comprehensive error in createInterviewSession:', error);
    
    // More granular error handling
    if (error instanceof TypeError) {
      console.error('Network error or fetch failed');
    }
    
    throw error;
  }
}

// Process a user's response in an interview session
export async function processInterviewResponse(
  sessionId: string,
  questionId: string,
  responseText: string
): Promise<AIInterviewResponse> {
  // Debug logging for request
  const requestBody = { session_id: sessionId, question_id: questionId, user_response: responseText };
  console.log('DEBUG: Sending interview process request:', requestBody);
  
  const apiResponse = await fetch(buildUrl('interview/process'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  // Debug logging for response
  console.log('DEBUG: Interview process response status:', apiResponse.status);
  
  if (!apiResponse.ok) {
    // Get detailed error information
    try {
      const errorData = await apiResponse.json();
      console.error('DEBUG: Interview process error details:', errorData);
      throw new Error(`Failed to process interview response: ${JSON.stringify(errorData)}`);
    } catch (parseError) {
      // If we can't parse the error as JSON, just use the status text
      console.error('DEBUG: Interview process error (unparseable):', apiResponse.statusText);
      throw new Error(`Failed to process interview response: ${apiResponse.statusText}`);
    }
  }
  
  const responseData = await apiResponse.json();
  console.log('DEBUG: Interview process response data:', responseData);
  return responseData
}

// Complete an interview session and get case assessment
export async function completeInterviewSession(sessionId: string): Promise<CaseAssessment> {
  const response = await fetch(buildUrl('interview/complete'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ session_id: sessionId })
  })
  
  if (!response.ok) {
    throw new Error('Failed to complete interview session')
  }
  return await response.json()
}

// Generate context-aware follow-up questions
export async function generateFollowUpQuestions(
  sessionId: string, 
  previousQuestions: AIInterviewQuestion[], 
  previousResponses: string[]
): Promise<AIInterviewQuestion[]> {
  const response = await fetch(buildUrl('interview/follow-up'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      session_id: sessionId, 
      previous_questions: previousQuestions, 
      previous_responses: previousResponses 
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate follow-up questions')
  }
  return await response.json()
}

// Contract Analysis API Functions

// Analyze a contract for risks and recommendations
export async function analyzeContract(request: ContractAnalysisRequest): Promise<ContractAnalysisResult> {
  const response = await fetch(buildUrl('contract-analysis/analyze'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    throw new Error('Failed to analyze contract')
  }
  return await response.json()
}

// Compare two contracts and identify differences
export async function compareContracts(request: ContractComparisonRequest): Promise<ContractComparisonResult> {
  const response = await fetch(buildUrl('contract-analysis/compare'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    throw new Error('Failed to compare contracts')
  }
  return await response.json()
}

// Add a standard template for contract comparison
export async function addContractTemplate(template: StandardTemplate): Promise<string> {
  const response = await fetch(buildUrl('contract-analysis/templates'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(template)
  })
  
  if (!response.ok) {
    throw new Error('Failed to add contract template')
  }
  return await response.json()
}

// Get a specific contract template by ID
export async function getContractTemplate(templateId: string): Promise<StandardTemplate> {
  const response = await fetch(buildUrl(`contract-analysis/templates/${templateId}`))
  
  if (!response.ok) {
    throw new Error(`Failed to get contract template with ID: ${templateId}`)
  }
  return await response.json()
}
