
import { API_BASE_URL } from '../../lib/config';

// Define a type that matches the form data structure
export interface PredictiveAnalysisFormData {
  case_type?: string;
  jurisdiction?: string;
  facts_summary?: string;
  legal_issues?: string;
  client_position?: string;
  opposing_position?: string;
  relevant_precedents?: string;
}

// Define the strict API request type
export interface PredictiveAnalysisRequest {
  case_type: string;
  jurisdiction: string;
  facts_summary: string;
  legal_issues: string;
  client_position: string;
  opposing_position: string;
  relevant_precedents: string;
}

export interface PredictiveAnalysisResult {
  case_summary: string;
  outcome_prediction: {
    prediction: string;
    confidence: number;
    prediction_rationale: string;
  };
  key_factors: string[];
  strategy_recommendations: string[];
  risk_assessment: {
    level: 'low' | 'medium' | 'high';
    description: string;
  };
}

/**
 * Analyzes a legal case and predicts potential outcomes
 * @param request The case details for prediction
 * @returns Predicted outcome analysis
 */
export async function predictOutcome(request: PredictiveAnalysisRequest): Promise<PredictiveAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predictive-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze case');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in predictOutcome:', error);
    throw error;
  }
}
