from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from app.services.clause_library_service import ClauseLibraryService
from fastapi import FastAPI, Request
from pydantic import BaseModel

# Dependency to get the clause library service
async def get_clause_library_service(request: Request) -> ClauseLibraryService:
    return request.app.state.clause_library_service

# Pydantic models for request validation
class ClauseCreate(BaseModel):
    name: str
    description: str
    content: str
    practice_areas: List[str]
    jurisdictions: List[str]
    tags: List[str]

class ClauseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    practice_areas: Optional[List[str]] = None
    jurisdictions: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class ClauseGenerateRequest(BaseModel):
    clause_type: str
    jurisdiction: str
    parameters: Dict[str, Any]

router = APIRouter()

@router.get("/clauses", response_model=List[Dict[str, Any]])
async def get_clauses(
    practice_area: Optional[str] = Query(None, description="Filter by practice area"),
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    search_term: Optional[str] = Query(None, description="Search term for filtering"),
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Get clauses filtered by practice area, jurisdiction, tags, and search term"""
    return await clause_library_service.get_clauses(practice_area, jurisdiction, tags, search_term)

@router.get("/clauses/{clause_id}", response_model=Dict[str, Any])
async def get_clause(
    clause_id: str,
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Get a specific clause by ID"""
    return await clause_library_service.get_clause(clause_id)

@router.post("/clauses", response_model=Dict[str, Any])
async def create_clause(
    clause_data: ClauseCreate = Body(...),
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Create a new clause"""
    return await clause_library_service.create_clause(clause_data.dict())

@router.put("/clauses/{clause_id}", response_model=Dict[str, Any])
async def update_clause(
    clause_id: str,
    clause_data: ClauseUpdate = Body(...),
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Update an existing clause"""
    return await clause_library_service.update_clause(clause_id, clause_data.dict(exclude_unset=True))

@router.delete("/clauses/{clause_id}", response_model=Dict[str, str])
async def delete_clause(
    clause_id: str,
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Delete a clause"""
    return await clause_library_service.delete_clause(clause_id)

@router.get("/clause-categories", response_model=List[Dict[str, Any]])
async def get_clause_categories(
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Get all clause categories"""
    return await clause_library_service.get_clause_categories()

@router.get("/clause-tags", response_model=List[str])
async def get_clause_tags(
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Get all clause tags"""
    return await clause_library_service.get_clause_tags()

@router.post("/generate-clause", response_model=Dict[str, Any])
async def generate_clause(
    request_data: ClauseGenerateRequest = Body(...),
    clause_library_service: ClauseLibraryService = Depends(get_clause_library_service)
):
    """Generate a custom clause using AI"""
    return await clause_library_service.generate_clause(
        request_data.clause_type,
        request_data.jurisdiction,
        request_data.parameters
    )
