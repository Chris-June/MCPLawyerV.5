from typing import Dict, Any, Optional
from app.services.ai_processor import AIProcessor
from app.config import Settings, ModelTaskConfig, OpenAIModel

class ServiceTemplate:
    """Template for creating new services with consistent model selection"""
    
    def __init__(self, 
                 ai_processor: AIProcessor, 
                 settings: Settings,
                 custom_config: Optional[Dict[str, Any]] = None):
        """
        Initialize the service with proper model selection.
        
        Args:
            ai_processor: Service for processing AI requests
            settings: Application settings for model configuration
            custom_config: Optional custom configuration for the service
            
        Raises:
            ValueError: If required dependencies are missing
        """
        # Validate required dependencies
        if not ai_processor:
            raise ValueError("AI Processor is required")
            
        if not settings:
            raise ValueError("Settings are required")
        
        # Store dependencies
        self.ai_processor = ai_processor
        self.settings = settings
        
        # Select appropriate model based on task category with robust error handling
        # Choose the most appropriate category for your service:
        # - "reasoning": General-purpose reasoning tasks
        # - "legal_analysis": Legal-specific analysis tasks
        # - "complex_reasoning": Complex reasoning requiring more advanced capabilities
        # - "advanced_research": Research-intensive tasks requiring deep analysis
        # - "specialized_tasks": Highly specialized operations requiring the most capable model
        
        try:
            # Select the primary model for this service
            self.model = settings.get_model_for_task("legal_analysis")
            print(f"Primary model selected: {self.model}")
        except Exception as e:
            print(f"Error selecting primary model: {str(e)}")
            # First fallback: Try complex_reasoning model
            try:
                self.model = settings.get_model_for_task("complex_reasoning")
                print(f"First fallback model selected: {self.model}")
            except Exception as e2:
                print(f"Error selecting first fallback model: {str(e2)}")
                # Second fallback: Try reasoning model
                try:
                    self.model = settings.get_model_for_task("reasoning")
                    print(f"Second fallback model selected: {self.model}")
                except Exception as e3:
                    print(f"Error selecting second fallback model: {str(e3)}")
                    # Final fallback: Use default model
                    self.model = "gpt-4.1-nano"  # Basic fallback matching user preference
                    print(f"Final fallback model selected: {self.model}")
        
        # Log initialization
        print(f"--- {self.__class__.__name__} Initialization ---")
        print(f"Selected model: {self.model}")
        
        # Process custom configuration
        self.config = custom_config or {}
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize service-specific resources and configuration"""
        # Override this method in your service implementation
        pass
    
    def _assess_request_complexity(self, request_data: Dict[str, Any]) -> str:
        """Assess the complexity of a request for dynamic model selection
        
        Args:
            request_data: The request data to assess
            
        Returns:
            Complexity level: "low", "medium", or "high"
        """
        # Default to medium complexity
        complexity = "medium"
        
        # Convert request to string for analysis if it's not already a string
        request_str = str(request_data)
        
        # Check request length (longer requests tend to be more complex)
        if len(request_str) > 500:
            complexity = "medium"
            
        if len(request_str) > 1000:
            complexity = "high"
        
        # Check for indicators of complex requests
        complex_indicators = [
            "analyze", "compare", "evaluate", "synthesize", "recommend",
            "legal", "implications", "consequences", "precedent", "jurisdiction",
            "explain in detail", "provide comprehensive", "step by step"
        ]
        
        # Count the number of complex indicators in the request
        indicator_count = sum(1 for indicator in complex_indicators if indicator.lower() in request_str.lower())
        
        if indicator_count >= 2:
            complexity = "medium"
            
        if indicator_count >= 4:
            complexity = "high"
        
        print(f"Request complexity assessed as: {complexity}")
        return complexity
    
    async def process_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a request using the appropriate model with dynamic model selection
        
        Args:
            request_data: The request data to process
            
        Returns:
            The processed response
        """
        # Example implementation
        system_prompt = "You are an AI assistant specializing in legal matters."
        user_prompt = f"Please process the following request: {request_data}"
        
        # Determine request complexity for dynamic model selection
        request_complexity = self._assess_request_complexity(request_data)
        
        # Select appropriate model based on request complexity
        selected_model = self.model  # Default to service's model
        
        try:
            if request_complexity == "high":
                # For complex requests, try to use a more capable model
                print(f"Using complex_reasoning model for high complexity request")
                selected_model = self.settings.get_model_for_task("complex_reasoning")
            elif request_complexity == "low":
                # For simple requests, use a more efficient model
                print(f"Using reasoning model for low complexity request")
                selected_model = self.settings.get_model_for_task("reasoning")
            else:
                # For medium complexity, use the service's default model
                print(f"Using default model for medium complexity request: {self.model}")
                selected_model = self.model
        except Exception as e:
            print(f"Error in dynamic model selection: {str(e)}")
            # Fall back to the service's default model
            selected_model = self.model
            print(f"Falling back to default model: {selected_model}")
        
        # Use the AI processor with the selected model
        response = await self.ai_processor.generate_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=selected_model
        )
        
        return {
            "result": response,
            "model_used": selected_model,
            "request_complexity": request_complexity,
            "request_id": request_data.get("id"),
            "timestamp": "2025-04-04T16:00:00Z",  # Use actual timestamp in real implementation
            "disclaimer": "This response is AI-generated and should be reviewed by a legal professional."
        }
