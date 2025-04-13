/**
 * Legal Research API functions
 */

import { API_BASE_URL } from '../config';

/**
 * Interface for legal issue analysis request
 */
export interface AnalyzeLegalIssueRequest {
  issue_description: string;
  jurisdiction: string;
  practice_area: string;
}

/**
 * Interface for legal issue analysis response
 */
export interface AnalyzeLegalIssueResponse {
  issue_description: string;
  jurisdiction: string;
  practice_area: string;
  analysis: string;
  model_used?: string;
  timestamp?: string;
  relevant_cases?: string[];
  relevant_statutes?: string[];
}

/**
 * Fallback response in case of API errors
 */
const fallbackResponse = (request: AnalyzeLegalIssueRequest): AnalyzeLegalIssueResponse => ({
  analysis: `We're experiencing technical difficulties connecting to our AI service. 

Here's a general overview for your issue:

Your legal issue related to ${request.practice_area} in ${request.jurisdiction} would typically involve analyzing relevant statutes, case law, and legal principles. 

Please try again later for a more detailed analysis.`,
  issue_description: request.issue_description,
  jurisdiction: request.jurisdiction,
  practice_area: request.practice_area,
  model_used: 'GPT-4o-mini (fallback)',
  timestamp: new Date().toISOString()
});

/**
 * Analyze a legal issue using the FastAPI backend
 * Includes robust error handling and fallback mechanisms
 */
export async function analyzeLegalIssue(request: AnalyzeLegalIssueRequest): Promise<AnalyzeLegalIssueResponse> {
  try {
    console.log('Sending legal issue analysis request:', request);
    console.log('API URL:', `${API_BASE_URL}/api/v1/analyze-legal-issue`);
    
    // Make a real API call to the FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/v1/analyze-legal-issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    // Log the raw response for debugging
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // If the response is not OK, throw an error
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}
${responseText}`);
    }
    
    // Parse the response as JSON
    let data: AnalyzeLegalIssueResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw response:', responseText);
      throw new Error(`Error parsing API response: ${parseError.message}`);
    }
    
    // Validate the response data
    if (!data.analysis) {
      console.error('Invalid API response - missing analysis:', data);
      throw new Error('Invalid API response: missing analysis field');
    }
    
    return data;
  } catch (error) {
    console.error('Error analyzing legal issue:', error);
    
    // For network errors or timeouts, use the fallback response
    if (error.name === 'AbortError' || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      console.log('Using fallback response due to network error');
      return fallbackResponse(request);
    }
    
    // For other errors, rethrow
    throw error;
  }
}
