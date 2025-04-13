import json
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.models.role import Role, RoleCreate, RoleUpdate
from app.models.memory import Memory, MemoryCreate
from app.services.memory_service import MemoryService
from app.services.ai_processor import AIProcessor
from app.config import DEFAULT_ROLES, TONE_PROFILES

class RoleService:
    """Service for managing roles and processing queries"""
    
    def __init__(self, memory_service: MemoryService, ai_processor: AIProcessor, settings):
        """Initialize the role service
        
        Args:
            memory_service: Service for managing memories
            ai_processor: Service for processing AI requests
            settings: Application settings for model configuration
        """
        self.memory_service = memory_service
        self.ai_processor = ai_processor
        self.settings = settings
        
        # Select appropriate model for role-based interactions
        # Using reasoning model as roles primarily involve conversational tasks
        try:
            self.model = settings.get_model_for_task("reasoning")
            print(f"RoleService initialized with model: {self.model}")
        except Exception as e:
            print(f"Error selecting model for RoleService: {str(e)}")
            # First fallback: Try legal_analysis model
            try:
                self.model = settings.get_model_for_task("legal_analysis")
                print(f"First fallback model for RoleService: {self.model}")
            except Exception as e2:
                print(f"First fallback model selection error: {str(e2)}")
                # Second fallback: Use default model
                self.model = "gpt-4o-mini"  # Basic fallback matching user preference
                print(f"Final fallback model for RoleService: {self.model}")
        
        # In-memory storage for roles
        # For production, this would be replaced with a proper database
        self.roles: Dict[str, Role] = {}
        
        # Initialize default roles
        for role_data in DEFAULT_ROLES:
            role = Role(**role_data)
            self.roles[role.id] = role
    
    async def get_roles(self) -> List[Role]:
        """Get all available roles
        
        Returns:
            List of roles
        """
        return list(self.roles.values())
    
    async def get_role(self, role_id: str) -> Role:
        """Get a specific role by ID
        
        Args:
            role_id: The ID of the role to retrieve
            
        Returns:
            The role
            
        Raises:
            HTTPException: If the role doesn't exist
        """
        if role_id not in self.roles:
            raise HTTPException(status_code=404, detail="Role not found")
        
        return self.roles[role_id]
    
    async def create_role(self, role_create: RoleCreate) -> Role:
        """Create a new custom role
        
        Args:
            role_create: Data for creating the role
            
        Returns:
            The created role
            
        Raises:
            HTTPException: If a role with the ID already exists
        """
        if role_create.id in self.roles:
            raise HTTPException(status_code=409, detail="Role with this ID already exists")
        
        # Validate tone
        if role_create.tone and role_create.tone not in TONE_PROFILES:
            raise HTTPException(status_code=400, detail=f"Invalid tone. Valid options: {list(TONE_PROFILES.keys())}")
        
        # Create the role
        role = Role(**role_create.dict(), is_default=False)
        self.roles[role.id] = role
        
        return role
    
    async def update_role(self, role_id: str, role_update: RoleUpdate) -> Role:
        """Update an existing role
        
        Args:
            role_id: The ID of the role to update
            role_update: Data for updating the role
            
        Returns:
            The updated role
            
        Raises:
            HTTPException: If the role doesn't exist or is a default role
        """
        if role_id not in self.roles:
            raise HTTPException(status_code=404, detail="Role not found")
        
        role = self.roles[role_id]
        
        # Prevent updating default roles
        if role.is_default:
            raise HTTPException(status_code=403, detail="Cannot update default roles")
        
        # Validate tone if provided
        if role_update.tone and role_update.tone not in TONE_PROFILES:
            raise HTTPException(status_code=400, detail=f"Invalid tone. Valid options: {list(TONE_PROFILES.keys())}")
        
        # Update the role
        update_data = role_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(role, key, value)
        
        self.roles[role_id] = role
        
        return role
    
    def _assess_query_complexity(self, query: str, system_prompt: str) -> str:
        """Assess the complexity of a query for model selection
        
        Args:
            query: The user query
            system_prompt: The system prompt
            
        Returns:
            Complexity level: "low", "medium", or "high"
        """
        # Default to low complexity
        complexity = "low"
        
        # Check query length (longer queries tend to be more complex)
        if len(query) > 200:
            complexity = "medium"
        
        if len(query) > 500:
            complexity = "high"
        
        # Check system prompt length (longer prompts indicate more context)
        if len(system_prompt) > 1500:
            complexity = "medium"
            
        if len(system_prompt) > 3000:
            complexity = "high"
        
        # Check for indicators of complex requests
        complex_indicators = [
            "analyze", "compare", "evaluate", "synthesize", "recommend",
            "legal", "implications", "consequences", "precedent", "jurisdiction",
            "explain in detail", "provide comprehensive", "step by step", "pros and cons"
        ]
        
        # Count the number of complex indicators in the query
        indicator_count = sum(1 for indicator in complex_indicators if indicator.lower() in query.lower())
        
        if indicator_count >= 2:
            complexity = "medium"
            
        if indicator_count >= 4:
            complexity = "high"
        
        print(f"Query complexity assessed as: {complexity}")
        return complexity
    
    async def delete_role(self, role_id: str) -> bool:
        """Delete a custom role
        
        Args:
            role_id: The ID of the role to delete
            
        Returns:
            True if successful
            
        Raises:
            HTTPException: If the role doesn't exist or is a default role
        """
        if role_id not in self.roles:
            raise HTTPException(status_code=404, detail="Role not found")
        
        role = self.roles[role_id]
        
        # Prevent deleting default roles
        if role.is_default:
            raise HTTPException(status_code=403, detail="Cannot delete default roles")
        
        # Delete the role
        del self.roles[role_id]
        
        # Clear memories for the role
        await self.memory_service.clear_memories_by_role_id(role_id)
        
        return True
    
    async def generate_complete_prompt(self, role_id: str, custom_instructions: Optional[str] = None) -> str:
        """Generate a complete system prompt for a role
        
        Args:
            role_id: The ID of the role to generate prompt for
            custom_instructions: Optional custom instructions to include
            
        Returns:
            The complete system prompt
        """
        role = await self.get_role(role_id)
        
        # Get tone profile
        tone_profile = TONE_PROFILES.get(role.tone, TONE_PROFILES["professional"])
        
        # Get relevant memories
        memories = await self.memory_service.get_memories_by_role_id(role_id)
        memory_text = "\n\n".join([f"Memory: {memory.content}" for memory in memories[:10]]) if memories else ""
        
        # Build the complete prompt
        prompt_parts = [
            role.system_prompt,
            f"\n\nTone: {role.tone} - {tone_profile['description']}\nTone Guidance: {tone_profile['modifiers']}",
            f"\n\nDomains of expertise: {', '.join(role.domains)}",
            f"\n\nInstructions: {role.instructions}"
        ]
        
        # Add custom instructions if provided
        if custom_instructions:
            prompt_parts.append(f"\n\nAdditional Instructions: {custom_instructions}")
        
        # Add memories if available
        if memory_text:
            prompt_parts.append(f"\n\nRelevant context from previous interactions:\n{memory_text}")
        
        return "\n".join(prompt_parts)
    
    async def process_query(self, role_id: str, query: str, custom_instructions: Optional[str] = None) -> str:
        """Process a query using a specific role
        
        Args:
            role_id: The ID of the role to use
            query: The query to process
            custom_instructions: Optional custom instructions
            
        Returns:
            The processed response
        """
        # Generate query embedding for memory retrieval
        embedding = await self.ai_processor.create_embedding(query)
        
        # Get relevant memories
        relevant_memories = await self.memory_service.get_relevant_memories(
            role_id, query, embedding, limit=5
        )
        
        # Generate the system prompt
        system_prompt = await self.generate_complete_prompt(role_id, custom_instructions)
        
        # Add relevant memories to the prompt
        if relevant_memories:
            memory_text = "\n\n".join([f"Memory: {memory.content}" for memory in relevant_memories])
            system_prompt += f"\n\nRelevant memories for this query:\n{memory_text}"
        
        # Determine query complexity for model selection
        query_complexity = self._assess_query_complexity(query, system_prompt)
        
        # Select appropriate model based on query complexity
        try:
            if query_complexity == "high":
                # For complex queries, use a more capable model
                print(f"Using complex_reasoning model for complex query in RoleService")
                response = await self.ai_processor.generate_response(
                    system_prompt=system_prompt, 
                    user_prompt=query,
                    task_category="complex_reasoning"
                )
            elif query_complexity == "medium" and "legal" in query.lower():
                # For medium complexity legal queries, use legal_analysis model
                print(f"Using legal_analysis model for legal query in RoleService")
                response = await self.ai_processor.generate_response(
                    system_prompt=system_prompt, 
                    user_prompt=query,
                    task_category="legal_analysis"
                )
            else:
                # For standard queries, use the default model
                print(f"Using default model for standard query in RoleService: {self.model}")
                response = await self.ai_processor.generate_response(
                    system_prompt=system_prompt, 
                    user_prompt=query,
                    model=self.model
                )
        except Exception as e:
            print(f"Error in model selection for query processing: {str(e)}")
            # Fallback to default model if any errors occur
            print(f"Falling back to default model: {self.model}")
            response = await self.ai_processor.generate_response(
                system_prompt=system_prompt, 
                user_prompt=query,
                model=self.model
            )
        
        # Store the query and response as session memories
        await self.memory_service.store_memory(
            MemoryCreate(
                role_id=role_id,
                content=f"User asked: {query}\nAssistant responded: {response}",
                type="session",
                importance="medium"
            ),
            embedding=embedding
        )
        
        return response
