from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, Optional
from fastapi import Request
from pydantic import BaseModel

from app.services.ai_processor import AIProcessor

# Pydantic models for request validation
class GenerateResponseRequest(BaseModel):
    system_prompt: str
    user_prompt: str

class EmbeddingRequest(BaseModel):
    text: str

class ProcessPromptRequest(BaseModel):
    prompt: str

# Dependency to get service
async def get_ai_processor(request: Request) -> AIProcessor:
    return request.app.state.ai_processor

# Create router
router = APIRouter()

@router.post("/ai-processor/generate-response", response_model=Dict[str, Any])
async def generate_response(
    request: GenerateResponseRequest,
    ai_processor: AIProcessor = Depends(get_ai_processor)
):
    """Generate a response using OpenAI API"""
    try:
        response = await ai_processor.generate_response(
            request.system_prompt,
            request.user_prompt
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-processor/create-embedding", response_model=Dict[str, Any])
async def create_embedding(
    request: EmbeddingRequest,
    ai_processor: AIProcessor = Depends(get_ai_processor)
):
    """Create an embedding vector for the given text"""
    try:
        embedding = await ai_processor.create_embedding(request.text)
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai-processor/process-prompt", response_model=Dict[str, Any])
async def process_prompt(
    request: ProcessPromptRequest,
    ai_processor: AIProcessor = Depends(get_ai_processor)
):
    """Process a prompt using OpenAI API"""
    try:
        response = await ai_processor.process_prompt(request.prompt)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
