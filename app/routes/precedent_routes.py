from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from app.services.precedent_service import PrecedentService
from fastapi import FastAPI, Request
from pydantic import BaseModel

# Dependency to get the precedent service
async def get_precedent_service(request: Request) -> PrecedentService:
    return request.app.state.precedent_service

# Pydantic models for request validation
class PrecedentCreate(BaseModel):
    title: str
    citation: str
    court: Optional[str] = ""
    date: str
    summary: str
    key_points: List[str]
    practice_areas: List[str]
    jurisdictions: List[str]
    tags: List[str]
    url: Optional[str] = ""
    document_type: str

class PrecedentUpdate(BaseModel):
    title: Optional[str] = None
    citation: Optional[str] = None
    court: Optional[str] = None
    date: Optional[str] = None
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    practice_areas: Optional[List[str]] = None
    jurisdictions: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    url: Optional[str] = None
    document_type: Optional[str] = None

router = APIRouter()

@router.get("/precedents", response_model=List[Dict[str, Any]])
async def get_precedents(
    practice_area: Optional[str] = Query(None, description="Filter by practice area"),
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    search_term: Optional[str] = Query(None, description="Search term for filtering"),
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Get precedents filtered by practice area, jurisdiction, document type, tags, and search term"""
    return await precedent_service.get_precedents(practice_area, jurisdiction, document_type, tags, search_term)

@router.get("/precedents/{precedent_id}", response_model=Dict[str, Any])
async def get_precedent(
    precedent_id: str,
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Get a specific precedent by ID"""
    return await precedent_service.get_precedent(precedent_id)

@router.post("/precedents", response_model=Dict[str, Any])
async def create_precedent(
    precedent_data: PrecedentCreate = Body(...),
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Create a new precedent"""
    return await precedent_service.create_precedent(precedent_data.dict())

@router.put("/precedents/{precedent_id}", response_model=Dict[str, Any])
async def update_precedent(
    precedent_id: str,
    precedent_data: PrecedentUpdate = Body(...),
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Update an existing precedent"""
    return await precedent_service.update_precedent(precedent_id, precedent_data.dict(exclude_unset=True))

@router.delete("/precedents/{precedent_id}", response_model=Dict[str, str])
async def delete_precedent(
    precedent_id: str,
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Delete a precedent"""
    return await precedent_service.delete_precedent(precedent_id)

@router.get("/precedent-categories", response_model=List[Dict[str, str]])
async def get_precedent_categories(
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Get all precedent categories"""
    return await precedent_service.get_precedent_categories()

@router.get("/precedent-tags", response_model=List[str])
async def get_precedent_tags(
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Get all precedent tags"""
    return await precedent_service.get_precedent_tags()

@router.post("/precedents/{precedent_id}/analyze", response_model=Dict[str, Any])
async def analyze_precedent(
    precedent_id: str,
    precedent_service: PrecedentService = Depends(get_precedent_service)
):
    """Analyze a precedent using AI"""
    return await precedent_service.analyze_precedent(precedent_id)
