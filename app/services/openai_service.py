import os
import json
import aiohttp
from typing import Dict, Any, List, Optional, Union
from fastapi import HTTPException, Request
from enum import Enum, auto

class AITask(Enum):
    """Enum for defining specific AI tasks"""
    LEGAL_RESEARCH = auto()
    CONTRACT_ANALYSIS = auto()
    CASE_PREDICTION = auto()
    DOCUMENT_SUMMARIZATION = auto()
    CLIENT_COMMUNICATION = auto()
    REASONING = auto()
    COMPLEX_REASONING = auto()
    EFFICIENT_REASONING = auto()  # For o3-mini model
    ADVANCED_REASONING = auto()   # For o1 model
    COMPACT_REASONING = auto()    # For o1-mini model

class OpenAIService:
    """Enhanced service for interacting with the OpenAI API"""
    
    # Model configuration mapping
    MODEL_TASK_MAP = {
        AITask.LEGAL_RESEARCH: "gpt-4o",
        AITask.CONTRACT_ANALYSIS: "gpt-4o-mini",
        AITask.CASE_PREDICTION: "gpt-4o",
        AITask.DOCUMENT_SUMMARIZATION: "gpt-4o-mini",
        AITask.CLIENT_COMMUNICATION: "gpt-4o-mini",
        AITask.REASONING: "gpt-4o-mini",
        AITask.COMPLEX_REASONING: "gpt-4o",
        # Removed invalid model mappings
    }
    
    # Fallback model (always GPT-4o-mini as per requirement)
    FALLBACK_MODEL = "gpt-4o-mini"
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.default_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def select_model(self, task: Optional[AITask] = None) -> str:
        """
        Select the most appropriate model for a given task
        
        :param task: Specific AI task
        :return: Selected model name
        """
        if task and task in self.MODEL_TASK_MAP:
            return self.MODEL_TASK_MAP[task]
        return self.default_model
    
    async def generate_completion(self, 
                                messages_or_prompt: Union[List[Dict[str, str]], str], 
                                task: Optional[AITask] = None,
                                temperature: float = 0.7,
                                max_tokens: Optional[int] = None,
                                stream: bool = False) -> str:
        """Generate a completion from the OpenAI API with task-based model selection
        
        Args:
            messages_or_prompt: Either a list of message objects or a string prompt
            task: Specific AI task for model selection
            temperature: Controls randomness (0-1)
            max_tokens: Maximum tokens to generate (None = model default)
            stream: Whether to stream the response
            
        Returns:
            The generated text response as a string
        """
        # Select model based on task, with fallback to default
        selected_model = self.select_model(task)
        
        url = f"{self.api_base}/chat/completions"
        
        # Convert string prompt to messages format if needed
        if isinstance(messages_or_prompt, str):
            messages = [
                {"role": "user", "content": messages_or_prompt}
            ]
        else:
            messages = messages_or_prompt
        
        payload = {
            "model": selected_model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        # Attempt primary model, fallback to GPT-4o-mini if fails
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=payload) as response:
                    if response.status != 200:
                        # Log the error and attempt fallback
                        print(f"Model {selected_model} failed. Falling back to {self.FALLBACK_MODEL}")
                        payload["model"] = self.FALLBACK_MODEL
                        
                        async with session.post(url, headers=self.headers, json=payload) as fallback_response:
                            if fallback_response.status != 200:
                                error_message = await fallback_response.text()
                                raise HTTPException(
                                    status_code=fallback_response.status,
                                    detail=f"OpenAI API error: {error_message}"
                                )
                            
                            # Handle streaming response if stream=True
                            if stream:
                                return fallback_response
                            else:
                                response_json = await fallback_response.json()
                                return await self.extract_text_from_completion(response_json)
                    
                    # Handle streaming response if stream=True
                    if stream:
                        return response
                    else:
                        response_json = await response.json()
                        return await self.extract_text_from_completion(response_json)
        
        except aiohttp.ClientError as e:
            # Final fallback
            print(f"Connection error. Using {self.FALLBACK_MODEL}")
            payload["model"] = self.FALLBACK_MODEL
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=payload) as fallback_response:
                    if fallback_response.status != 200:
                        raise HTTPException(
                            status_code=fallback_response.status,
                            detail=f"Final fallback to {self.FALLBACK_MODEL} failed"
                        )
                    
                    if stream:
                        return fallback_response
                    else:
                        response_json = await fallback_response.json()
                        return await self.extract_text_from_completion(response_json)
    
    async def extract_text_from_completion(self, completion: Dict[str, Any]) -> str:
        """Extract the generated text from a completion response
        
        Args:
            completion: The completion response from the API
            
        Returns:
            The generated text
        """
        try:
            return completion.get("choices", [{}])[0].get("message", {}).get("content", "")
        except (KeyError, IndexError):
            return ""
    
    def create_system_message(self, content: str) -> Dict[str, str]:
        """Create a system message"""
        return {"role": "system", "content": content}
    
    def create_user_message(self, content: str) -> Dict[str, str]:
        """Create a user message"""
        return {"role": "user", "content": content}
    
    def create_assistant_message(self, content: str) -> Dict[str, str]:
        """Create an assistant message"""
        return {"role": "assistant", "content": content}


async def get_openai_service() -> OpenAIService:
    """Dependency for getting the OpenAI service"""
    return OpenAIService()
