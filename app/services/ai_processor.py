from openai import AsyncOpenAI
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.settings import settings

class AIProcessor:
    """Service for processing AI requests using OpenAI API"""
    
    def __init__(self, settings: 'Settings'):
        """Initialize the AI processor
        
        Args:
            settings: Application settings for model configuration
        
        Raises:
            ValueError: If settings is None or missing required API key
        """
        if not settings:
            raise ValueError("Settings object is required for AIProcessor initialization")
            
        if not hasattr(settings, 'openai_api_key') or not settings.openai_api_key:
            raise ValueError("OpenAI API key is required in settings")
            
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.settings = settings
        
        # Initialize with default model and log selection
        self.model = settings.get_model_for_task("reasoning")
        
        print("--- AIProcessor Initialization ---")
        print(f"Default model: {self.model}")
        print(f"API client configured: {bool(self.client)}")
        print("--- End of Initialization ---")
    
    async def generate_response(self, system_prompt: str, user_prompt: str, model: str = None, task_category: str = None, **kwargs) -> str:
        """Generate a response using the OpenAI API
        
        Args:
            system_prompt: The system prompt to use
            user_prompt: The user prompt to use
            model: Optional specific model to use
            task_category: Optional task category for model selection
            **kwargs: Additional arguments to pass to the OpenAI client
            
        Returns:
            The generated response
        """
        try:
            # Log the prompts for debugging
            print("\n--- AI Request Debugging ---")
            print("System Prompt:")
            print(system_prompt)
            print("\nUser Prompt:")
            print(user_prompt)
            print("--- End of Prompts ---\n")
            
            # Model selection logic with multiple fallback options
            selected_model = None
            
            # Option 1: Use explicitly provided model parameter
            if model:
                selected_model = model
                print(f"Using explicitly provided model: {selected_model}")
                
            # Option 2: Use task category if provided
            elif task_category:
                try:
                    selected_model = self.settings.get_model_for_task(task_category)
                    print(f"Using model for task category '{task_category}': {selected_model}")
                except Exception as e:
                    print(f"Error selecting model for task '{task_category}': {e}")
                    selected_model = None
            
            # Option 3: Fall back to instance default model
            if not selected_model:
                selected_model = self.model
                print(f"Using default model: {selected_model}")
            
            # Prepare OpenAI client arguments
            client_args = {
                "model": selected_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": kwargs.get('temperature', 0.7),
                "max_tokens": kwargs.get('max_tokens', 1500),
                "top_p": kwargs.get('top_p', 1.0),
                "frequency_penalty": kwargs.get('frequency_penalty', 0.0),
                "presence_penalty": kwargs.get('presence_penalty', 0.0)
            }
            
            # Remove None values to prevent unexpected arguments
            client_args = {k: v for k, v in client_args.items() if v is not None}
            
            response = await self.client.chat.completions.create(**client_args)
            
            # Extract and log the response
            full_response = response.choices[0].message
            generated_text = full_response.content.strip() if full_response.content else ""
            
            print("\n--- AI Response Debugging ---")
            print("Full Response Object:")
            print(repr(full_response))
            print("\nGenerated Text:")
            print(generated_text)
            print("--- End of Response ---\n")
            
            # Validate the response has some content
            if not generated_text:
                raise ValueError("No response generated")
            
            return generated_text
        except Exception as e:
            # Comprehensive error handling and logging
            error_message = f"Error generating response: {str(e)}"
            print("\n--- AI Error Debugging ---")
            print(error_message)
            
            # Log additional context if possible
            import traceback
            traceback.print_exc()
            print("--- End of Error ---\n")
            
            # Return a structured error response
            return f"""Case Summary: Unable to generate analysis
Outcome Prediction:
- Favorable Percentage: 50
- Confidence Level: Low
- Rationale: AI analysis failed due to technical error.

Error Details: {error_message}

Disclaimer: This is a fallback response. Please consult with a legal professional for accurate advice."""
    
    async def create_embedding(self, text: str, model: str = "text-embedding-ada-002") -> List[float]:
        """Create an embedding vector for the given text
        
        Args:
            text: The text to embed
            
        Returns:
            The embedding vector
        """
        try:
            response = await self.client.embeddings.create(
                model=model,
                input=text
            )
            
            return response.data[0].embedding
        except Exception as e:
            # In a production environment, add proper error handling and logging
            print(f"Error creating embedding: {e}")
            return []
    
    async def process_prompt(self, prompt: str, model: str = None, task_category: str = None) -> str:
        """Process a prompt using the OpenAI API
        
        Args:
            prompt: The prompt to process
            
        Returns:
            The generated response
        """
        try:
            # Model selection logic with multiple fallback options
            selected_model = None
            
            # Option 1: Use explicitly provided model parameter
            if model:
                selected_model = model
                print(f"Using explicitly provided model: {selected_model}")
                
            # Option 2: Use task category if provided
            elif task_category:
                try:
                    selected_model = self.settings.get_model_for_task(task_category)
                    print(f"Using model for task category '{task_category}': {selected_model}")
                except Exception as e:
                    print(f"Error selecting model for task '{task_category}': {e}")
                    selected_model = None
            
            # Option 3: Fall back to instance default model
            if not selected_model:
                selected_model = self.model
                print(f"Using default model: {selected_model}")
            
            response = await self.client.chat.completions.create(
                model=selected_model,
                messages=[
                    {"role": "system", "content": "You are a legal assistant that specializes in drafting legal clauses for Canadian jurisdictions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            # In a production environment, add proper error handling and logging
            print(f"Error processing prompt: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing prompt: {str(e)}")
