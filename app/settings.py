from typing import Dict, Any, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class ModelTaskConfig:
    """Configuration for AI model selection across different tasks."""
    
    DEFAULT_MODELS = {
        "reasoning": "gpt-4o-mini",
        "legal_analysis": "gpt-4o-mini",
        "complex_reasoning": "gpt-4o",
        "advanced_research": "gpt-4o",
        "specialized_tasks": "gpt-4o"
    }
    
    @classmethod
    def get_model_for_task(cls, task_category: str = "reasoning") -> str:
        """
        Select the most appropriate AI model for a given task category.
        
        Args:
            task_category (str): The specific task category for model selection.
        
        Returns:
            str: The selected model for the task.
        """
        return cls.DEFAULT_MODELS.get(task_category, cls.DEFAULT_MODELS["reasoning"])

class Settings(BaseSettings):
    """Application-wide settings and configuration."""
    
    # OpenAI API Key - loaded from environment variable OPENAI_API_KEY
    openai_api_key: str

    # Model configuration with environment variable support
    openai_model: str = "gpt-4o-mini"
    
    app_name: str = "MCP Lawyer"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    
    # Pydantic settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    def get_model_for_task(self, task_category: str = "reasoning") -> str:
        """
        Select the appropriate model for a specific task category.
        
        This method centralizes model selection across the application, ensuring
        consistent model usage based on task requirements. It includes error
        handling and logging for robust operation.
        
        Args:
            task_category (str): The specific task category for model selection.
                Valid options: "reasoning", "legal_analysis", "complex_reasoning",
                "advanced_research", "specialized_tasks"
        
        Returns:
            str: The selected model for the task.
            
        Example:
            >>> model = settings.get_model_for_task("legal_analysis")
            >>> print(model)
            'gpt-4o-mini'
        """
        try:
            # Log the model selection request
            print(f"Model selection requested for task category: {task_category}")
            
            # Get the model from ModelTaskConfig
            model = ModelTaskConfig.get_model_for_task(task_category)
            
            # Log the selected model
            print(f"Selected model for {task_category}: {model}")
            
            return model
        except Exception as e:
            # Log the error
            print(f"Error in model selection for {task_category}: {str(e)}")
            print(f"Falling back to default model: {ModelTaskConfig.DEFAULT_MODELS['reasoning']}")
            
            # Return the default model as a fallback
            return ModelTaskConfig.DEFAULT_MODELS["reasoning"]

    def get_environment_config(self) -> Dict[str, Any]:
        """
        Retrieve the current environment configuration.
        
        Returns:
            Dict[str, Any]: A dictionary containing key environment configuration details.
        """
        return {
            "app_name": self.app_name,
            "app_version": self.app_version,
            "api_prefix": self.api_prefix,
            "openai_model": self.openai_model
        }

# Create a singleton settings instance
settings = Settings()
