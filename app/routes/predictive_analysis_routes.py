from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Dict, Any, Optional
from fastapi import Request
from pydantic import BaseModel

from app.services.predictive_analysis_service import PredictiveAnalysisService

# Pydantic models for request validation
class PredictiveAnalysisRequest(BaseModel):
    case_facts: str
    legal_issues: List[str]
    jurisdiction: str
    relevant_statutes: Optional[List[str]] = None
    similar_cases: Optional[List[str]] = None
    client_position: str
    opposing_arguments: Optional[str] = None

# Dependency to get service
async def get_predictive_analysis_service(request: Request) -> PredictiveAnalysisService:
    return request.app.state.predictive_analysis_service

# Create router
router = APIRouter(prefix="/legal-tools")

@router.post("/predictive-analysis/case-outcome", response_model=Dict[str, Any])
async def analyze_case_outcome(
    request: PredictiveAnalysisRequest,
    predictive_analysis_service: PredictiveAnalysisService = Depends(get_predictive_analysis_service)
):
    """Analyze a case and predict potential outcomes based on similar precedents"""
    try:
        analysis = await predictive_analysis_service.analyze_case_outcome(
            case_facts=request.case_facts,
            legal_issues=request.legal_issues,
            jurisdiction=request.jurisdiction,
            relevant_statutes=request.relevant_statutes,
            similar_cases=request.similar_cases,
            client_position=request.client_position,
            opposing_arguments=request.opposing_arguments
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
