from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional

from ..models.contract_analysis_models import (
    ContractAnalysisRequest,
    ContractAnalysisResult,
    ContractComparisonRequest,
    ContractComparisonResult,
    StandardTemplate
)
from ..services.contract_analysis_service import ContractAnalysisService
from ..services.ai_processor import AIProcessor
from ..dependencies.services import get_ai_processor
from ..dependencies.settings import get_settings
from ..settings import Settings

# Create a router for contract analysis endpoints
router = APIRouter(
    prefix="/contract-analysis",
    tags=["contract-analysis"],
    responses={404: {"description": "Not found"}},
)

# Service dependency
def get_contract_analysis_service(ai_processor: AIProcessor = Depends(get_ai_processor), 
                                 settings: Settings = Depends(get_settings)):
    return ContractAnalysisService(ai_processor, settings)


@router.post("/analyze", response_model=ContractAnalysisResult, status_code=status.HTTP_200_OK)
async def analyze_contract(request: ContractAnalysisRequest, 
                          service: ContractAnalysisService = Depends(get_contract_analysis_service)):
    """Analyze a contract for risks, clauses, and recommendations"""
    try:
        # Validate input request
        if not request.contract_text or len(request.contract_text.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract text is too short. Please provide a more substantial contract text."
            )
        
        # Log the incoming request details for debugging
        print(f"\n--- Contract Analysis Request ---")
        print(f"Contract Type: {request.contract_type}")
        print(f"Jurisdiction: {request.jurisdiction}")
        print(f"Contract Text Length: {len(request.contract_text) if request.contract_text else 0} characters")
        print(f"Comparison Template IDs: {request.comparison_template_ids}")
        
        # Perform contract analysis
        result = await service.analyze_contract(request)
        
        # Additional validation of analysis result
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Contract analysis did not produce a valid result."
            )
        
        return result
    except HTTPException:
        # Re-raise HTTPException to preserve status code and detail
        raise
    except Exception as e:
        # More detailed error logging
        import traceback
        print(f"\n--- Contract Analysis Error ---")
        print(f"Error: {str(e)}")
        print("Full Traceback:")
        traceback.print_exc()
        
        # Determine appropriate error response
        if "JSON" in str(e):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid JSON response from AI: {str(e)}"
            )
        elif "token" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract text exceeds maximum allowed token length."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error analyzing contract: {str(e)}"
            )


@router.post("/compare", response_model=ContractComparisonResult, status_code=status.HTTP_200_OK)
async def compare_contracts(request: ContractComparisonRequest, 
                           service: ContractAnalysisService = Depends(get_contract_analysis_service)):
    """Compare two contracts and identify differences"""
    try:
        result = await service.compare_contracts(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error comparing contracts: {str(e)}"
        )


@router.post("/templates", response_model=str, status_code=status.HTTP_201_CREATED)
async def add_template(template: StandardTemplate, 
                      service: ContractAnalysisService = Depends(get_contract_analysis_service)):
    """Add a standard template for comparison"""
    try:
        template_id = await service.add_template(template)
        return template_id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding template: {str(e)}"
        )


@router.get("/templates/{template_id}", response_model=StandardTemplate, status_code=status.HTTP_200_OK)
async def get_template(template_id: str, 
                      service: ContractAnalysisService = Depends(get_contract_analysis_service)):
    """Retrieve a standard template by ID"""
    try:
        template = await service.get_template(template_id)
        if template is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {template_id} not found"
            )
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving template: {str(e)}"
        )
