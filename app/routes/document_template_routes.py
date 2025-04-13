from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Dict, Any, Optional
from fastapi import Request
from pydantic import BaseModel

from app.services.document_template_service import DocumentTemplateService

# Pydantic models for request validation
class TemplateCreateRequest(BaseModel):
    name: str
    description: str
    category: str
    content: str
    variables: Optional[List[str]] = []

class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[List[str]] = None

class DocumentGenerationRequest(BaseModel):
    variables: Dict[str, str]

# Dependencies to get services
async def get_document_template_service(request: Request) -> DocumentTemplateService:
    return request.app.state.document_template_service

# Create router
router = APIRouter()

# Template Management Routes
@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_templates(
    category: Optional[str] = Query(None, description="Filter templates by category"),
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Get all templates or filter by category"""
    return await document_template_service.get_templates(category)

@router.get("/templates/{template_id}", response_model=Dict[str, Any])
async def get_template(
    template_id: str,
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Get a specific template by ID"""
    try:
        return await document_template_service.get_template(template_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/templates", response_model=Dict[str, Any])
async def create_template(
    request: TemplateCreateRequest,
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Create a new template"""
    return await document_template_service.create_template(request.dict())

@router.put("/templates/{template_id}", response_model=Dict[str, Any])
async def update_template(
    template_id: str,
    request: TemplateUpdateRequest,
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Update an existing template"""
    try:
        # Filter out None values from the update request
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        return await document_template_service.update_template(template_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/templates/{template_id}", response_model=Dict[str, Any])
async def delete_template(
    template_id: str,
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Delete a template"""
    try:
        return await document_template_service.delete_template(template_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/template-categories", response_model=List[str])
async def get_template_categories(
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Get all template categories"""
    return await document_template_service.get_categories()

# Document Generation Routes
@router.post("/templates/{template_id}/generate", response_model=Dict[str, Any])
async def generate_document(
    template_id: str,
    request: DocumentGenerationRequest,
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Generate a document from a template with the provided variables"""
    try:
        return await document_template_service.generate_document(template_id, request.variables)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/templates/{template_id}/analyze", response_model=Dict[str, Any])
async def analyze_template(
    template_id: str,
    document_template_service: DocumentTemplateService = Depends(get_document_template_service)
):
    """Analyze a template for structure, variables, and suggestions"""
    try:
        return await document_template_service.analyze_template(template_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
