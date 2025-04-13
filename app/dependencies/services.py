from fastapi import Depends, Request
from ..services.ai_processor import AIProcessor
from ..services.memory_service import MemoryService
from ..services.role_service import RoleService

# Dependency to get the AI processor from the app state
async def get_ai_processor(request: Request) -> AIProcessor:
    return request.app.state.ai_processor

# Dependency to get the memory service from the app state
async def get_memory_service(request: Request) -> MemoryService:
    return request.app.state.memory_service

# Dependency to get the role service from the app state
async def get_role_service(request: Request) -> RoleService:
    return request.app.state.role_service
