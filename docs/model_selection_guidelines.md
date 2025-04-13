# Model Selection Guidelines for AI Services

## Overview

This document outlines the standardized approach for model selection across all services in the MCP Lawyer application. Following these guidelines ensures consistent, efficient, and appropriate model usage throughout the application.

## Core Principles

1. **Centralized Model Configuration**
   - All model configurations are defined in `ModelTaskConfig` class
   - Model selection is handled through `settings.get_model_for_task()`
   - Default models are specified for fallback scenarios

2. **Task-Based Model Selection**
   - Models are selected based on the specific task category
   - Each service should use the most appropriate task category for its operations
   - Task categories are clearly defined with specific use cases

3. **Consistent Implementation**
   - All services follow the same pattern for model selection
   - Error handling and logging are standardized
   - A service template is provided as a reference

## Task Categories and Models

| Task Category | Model | Use Case |
|---------------|-------|----------|
| `reasoning` | `gpt-4o-mini` | General-purpose reasoning tasks (default) |
| `legal_analysis` | `gpt-4o-mini` | Legal-specific analysis tasks |
| `complex_reasoning` | `gpt-4o` | Complex reasoning requiring more advanced capabilities |
| `advanced_research` | `gpt-4.5` | Research-intensive tasks requiring deep analysis |
| `specialized_tasks` | `gpt-o1` | Highly specialized operations requiring the most capable model |

## Implementation Guide

### 1. Service Constructor with Robust Error Handling

All services should accept `settings` in their constructor and implement robust model selection with multiple fallback options:

```python
def __init__(self, ai_processor: AIProcessor, settings: Settings):
    self.ai_processor = ai_processor
    self.settings = settings
    
    # Robust model selection with multiple fallbacks
    try:
        # Select the most appropriate model for the service's primary task
        self.model = settings.get_model_for_task("legal_analysis")
        print(f"Service initialized with model: {self.model}")
    except Exception as e:
        print(f"Error selecting primary model: {str(e)}")
        # First fallback
        try:
            self.model = settings.get_model_for_task("complex_reasoning")
            print(f"Using fallback model: {self.model}")
        except Exception as e2:
            print(f"Error selecting fallback model: {str(e2)}")
            # Second fallback
            try:
                self.model = settings.get_model_for_task("reasoning")
                print(f"Using second fallback model: {self.model}")
            except Exception as e3:
                # Final fallback to default model
                self.model = ModelTaskConfig.DEFAULT_MODEL
                print(f"Using final fallback model: {self.model}")
```

### 2. Using the AI Processor

When calling the AI processor, pass the selected model:

```python
response = await self.ai_processor.generate_response(
    system_prompt=system_prompt,
    user_prompt=user_prompt,
    model=self.model  # Pass the selected model
)
```

Alternatively, you can use the task category for dynamic model selection:

```python
response = await self.ai_processor.generate_response(
    system_prompt=system_prompt,
    user_prompt=user_prompt,
    task_category="complex_reasoning"  # For more complex requests
)
```

### 3. Dynamic Model Selection Based on Input Complexity

Implement dynamic model selection based on input complexity:

```python
# Assess input complexity
query_complexity = self._assess_query_complexity(query)

# Select model based on complexity
try:
    if query_complexity == "high":
        # For complex queries, use a more capable model
        model = settings.get_model_for_task("complex_reasoning")
    elif query_complexity == "medium":
        # For medium complexity, use the service's default model
        model = self.model
    else:
        # For simple queries, use a more efficient model
        model = settings.get_model_for_task("reasoning")
except Exception as e:
    print(f"Error in dynamic model selection: {str(e)}")
    # Fall back to the service's default model
    model = self.model
```

### 4. Comprehensive Error Handling

Implement comprehensive error handling for all model selection scenarios:

```python
try:
    # Primary model selection
    model = settings.get_model_for_task(task_category)
    # Use the model
except Exception as primary_error:
    print(f"Primary model selection error: {str(primary_error)}")
    
    try:
        # First fallback
        model = settings.get_model_for_task("complex_reasoning")
    except Exception as fallback_error:
        print(f"Fallback model selection error: {str(fallback_error)}")
        
        try:
            # Second fallback
            model = settings.get_model_for_task("reasoning")
        except Exception as second_fallback_error:
            print(f"Second fallback error: {str(second_fallback_error)}")
            # Final fallback to default model
            model = ModelTaskConfig.DEFAULT_MODEL
```

## Service Template

A template for creating new services with consistent model selection is provided in `app/services/service_template.py`. Use this as a reference when creating new services.

## Best Practices

1. **Choose the Right Task Category**
   - Select the most appropriate task category based on the service's requirements
   - Consider the complexity and specialization of the task

2. **Implement Dynamic Model Selection**
   - Assess input complexity to determine the appropriate model
   - Use more capable models for complex tasks and more efficient models for simpler tasks
   - Define clear criteria for complexity assessment

3. **Log Model Selection**
   - Log the selected model for debugging and monitoring
   - Include the task category and complexity assessment in logs
   - Track fallback scenarios for monitoring system health

4. **Handle Errors Gracefully**
   - Implement comprehensive error handling with multiple fallback options
   - Provide meaningful fallback behavior in a cascading manner
   - Ensure the system can continue operating even if preferred models are unavailable

5. **Optimize for Cost and Performance**
   - Use more capable (and expensive) models only when necessary
   - Implement complexity-based routing to balance cost and performance
   - Monitor model usage patterns to identify optimization opportunities

4. **Consider Dynamic Model Selection**
   - For services that handle varying complexity, consider dynamic model selection
   - Use the `task_category` parameter in `generate_response` for specific requests

## Conclusion

Following these guidelines ensures consistent, efficient, and appropriate model usage throughout the MCP Lawyer application. It provides a standardized approach that is easy to understand, implement, and maintain.
