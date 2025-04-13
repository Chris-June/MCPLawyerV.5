from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from app.services.law_practice_service import LawPracticeService
from fastapi import FastAPI, Request
from pydantic import BaseModel
import time

# Dependency to get the law practice service
async def get_law_practice_service(request: Request) -> LawPracticeService:
    return request.app.state.law_practice_service

# Pydantic model for the request body
class AnalyzeLegalIssueRequest(BaseModel):
    issue_description: str
    jurisdiction: str
    practice_area: str

router = APIRouter()

@router.get("/document-templates", response_model=List[Dict[str, Any]])
async def get_document_templates(
    practice_area: Optional[str] = Query(None, description="Filter by practice area"),
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction"),
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Get document templates filtered by practice area and jurisdiction"""
    return await law_practice_service.get_document_templates(practice_area, jurisdiction)

@router.get("/limitation-periods", response_model=Dict[str, Any])
async def get_limitation_periods(
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction"),
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Get limitation periods for a specific jurisdiction or all jurisdictions"""
    return await law_practice_service.get_limitation_periods(jurisdiction)

@router.get("/court-deadlines", response_model=Dict[str, Any])
async def get_court_deadlines(
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction"),
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Get court deadlines for a specific jurisdiction or all jurisdictions"""
    return await law_practice_service.get_court_deadlines(jurisdiction)

@router.get("/client-intake-form/{practice_area}", response_model=Dict[str, Any])
async def get_client_intake_form(
    practice_area: str,
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Get client intake form for a specific practice area"""
    return await law_practice_service.get_client_intake_form(practice_area)

@router.get("/practice-areas", response_model=List[Dict[str, Any]])
async def get_practice_areas(
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Get all available practice areas for client intake forms"""
    # Get all practice areas from the client intake forms
    practice_areas = []
    for area_id, form in law_practice_service.client_intake_forms.items():
        practice_areas.append({
            "id": area_id,
            "name": form.get("name", area_id.capitalize()),
            "description": form.get("description", "")
        })
    return practice_areas

@router.post("/client-intake-form/{practice_area}/submit", response_model=Dict[str, Any])
async def submit_client_intake_form(
    practice_area: str,
    form_data: Dict[str, str] = Body(...),
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Submit a client intake form for processing"""
    # First verify the practice area exists
    if practice_area not in law_practice_service.client_intake_forms:
        raise HTTPException(status_code=404, detail=f"Client intake form for practice area '{practice_area}' not found")
    
    # In a real application, this would save the form data to a database
    # and potentially trigger additional workflows
    
    # For now, we'll just return a success response with the received data
    return {
        "status": "success",
        "message": f"Successfully submitted intake form for {practice_area}",
        "practice_area": practice_area,
        "submission_id": f"sub_{int(time.time())}",  # Generate a simple submission ID
        "received_data": form_data
    }

@router.post("/client-intake-form/{practice_area}/analyze", response_model=Dict[str, Any])
async def analyze_client_intake_form(
    practice_area: str,
    form_data: Dict[str, str] = Body(...),
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Analyze a client intake form using AI"""
    # Process the intake form and generate AI analysis
    analysis_result = await law_practice_service.analyze_client_intake(practice_area, form_data)
    return analysis_result

@router.post("/generate-document/{template_id}", response_model=Dict[str, str])
async def generate_document(
    template_id: str,
    field_values: Dict[str, str],
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Generate a document from a template using AI"""
    document_content = await law_practice_service.generate_document(template_id, field_values)
    return {"content": document_content}

@router.post("/analyze-legal-issue", response_model=Dict[str, Any])
async def analyze_legal_issue(
    request_data: AnalyzeLegalIssueRequest = Body(...),
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Analyze a legal issue and provide guidance"""
    analysis = await law_practice_service.analyze_legal_issue(
        request_data.issue_description, 
        request_data.jurisdiction, 
        request_data.practice_area
    )
    return analysis  # Return the entire response object directly

@router.get("/calculate-deadline", response_model=Dict[str, Any])
async def calculate_deadline(
    start_date: str,
    deadline_type: str,
    jurisdiction: str,
    law_practice_service: LawPracticeService = Depends(get_law_practice_service)
):
    """Calculate a legal deadline based on start date, deadline type, and jurisdiction"""
    return await law_practice_service.calculate_deadline(start_date, deadline_type, jurisdiction)
