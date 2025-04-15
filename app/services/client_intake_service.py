from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json
import uuid
import os
import logging
from pathlib import Path
from fastapi import HTTPException
from ..models.client_intake_models import (
    IntakeForm, 
    IntakeFormSubmission, 
    AIInterviewSession,
    AIInterviewQuestion,
    AIInterviewResponse,
    CaseAssessment
)
from ..services.openai_service import OpenAIService
from app.config import Settings, ModelTaskConfig, OpenAIModel
import time

logger = logging.getLogger(__name__)

class ClientIntakeService:
    def __init__(self, 
                 openai_service: Optional[OpenAIService] = None, 
                 settings: Optional[Settings] = None,
                 intake_config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the client intake service with advanced configuration.

        This constructor sets up the service with OpenAI processing, model selection,
        and comprehensive configuration for client intake processes.

        Args:
            openai_service (Optional[OpenAIService]): Service for OpenAI interactions.
            settings (Optional[Settings]): Application settings for model configuration.
            intake_config (Optional[Dict[str, Any]]): Optional custom configuration 
                for intake service initialization.

        Raises:
            ValueError: If required dependencies are missing or misconfigured.
            ConfigurationError: If model selection fails or settings are invalid.

        Example:
            >>> service = ClientIntakeService(
            ...     openai_service=openai_service, 
            ...     settings=app_settings,
            ...     intake_config=custom_config
            ... )
        """
        # Runtime validation of input dependencies
        if openai_service is None:
            raise ValueError("OpenAI Service is required for ClientIntakeService")
        
        if settings is None:
            raise ValueError("Application settings are required for ClientIntakeService")
        
        # Additional runtime type and capability checks
        self._validate_input_types(openai_service, settings)
        
        # Set core dependencies
        self.openai_service = openai_service
        self.settings = settings
        
        # Advanced model selection with fallback and logging
        try:
            self.model = settings.get_model_for_task("reasoning")
            print(f"\n--- Client Intake Service Model Selection ---")
            print(f"Selected Model: {self.model}")
        except Exception as e:
            print(f"Model selection error: {e}")
            # Fallback to default model with logging
            self.model = ModelTaskConfig.DEFAULT_MODEL
            print(f"Fallback Model: {self.model}")
        
        # Validate OpenAI service capabilities
        self._validate_openai_service()
        
        # Configure intake directories
        self._configure_intake_directories(intake_config)
        
        # Initialize forms from local storage with advanced error handling
        try:
            self.forms = self._load_forms()
            print(f"Loaded {len(self.forms)} intake forms")
        except Exception as e:
            print(f"Error loading intake forms: {e}")
            self.forms = {}
        
        # Optional telemetry or monitoring setup
        self._log_service_initialization()

    def _validate_input_types(
        self, 
        openai_service: Any, 
        settings: Any
    ) -> None:
        """
        Perform runtime capability validation for input dependencies.
        
        Uses duck typing to validate service and settings capabilities.
        
        Args:
            openai_service (Any): OpenAI service to validate
            settings (Any): Application settings to validate
        
        Raises:
            TypeError: If inputs lack required capabilities
            ValueError: If critical methods are missing
        """
        # Validate OpenAI Service capabilities
        try:
            # List of required methods to validate
            required_methods = [
                'generate_completion',  
                'create_system_message',
                'create_user_message',
                'select_model'
            ]
            
            # Comprehensive method validation
            for method_name in required_methods:
                if not hasattr(openai_service, method_name):
                    raise TypeError(f"Invalid OpenAI Service: Missing required method: {method_name}")
                
                method = getattr(openai_service, method_name)
                if not callable(method):
                    raise TypeError(f"Invalid OpenAI Service: {method_name} is not a callable method")
        
        except Exception as e:
            raise TypeError(f"Invalid OpenAI Service: {e}")
        
        # Validate Settings capabilities
        try:
            required_settings_methods = [
                'get_model_for_task', 
                'get_environment_config'
            ]
            
            for method_name in required_settings_methods:
                method = getattr(settings, method_name, None)
                
                if method is None:
                    raise ValueError(f"Missing required method: {method_name}")
                
                # Optional: Validate method return types or signatures
                try:
                    import inspect
                    signature = inspect.signature(method)
                    
                    # Example: Ensure get_model_for_task accepts a task parameter
                    if method_name == 'get_model_for_task':
                        params = list(signature.parameters.keys())
                        if 'task' not in params:
                            raise ValueError("get_model_for_task must accept a 'task' parameter")
                
                except Exception as sig_err:
                    print(f"Warning: Could not fully validate {method_name} signature: {sig_err}")
        
        except Exception as e:
            raise TypeError(f"Invalid Settings Configuration: {e}")
        
        # Optional: Log successful validation
        print("\n--- Input Dependencies Validated Successfully ---")
        print(f"OpenAI Service: {type(openai_service).__name__}")
        print(f"Settings: {type(settings).__name__}")

    def _validate_openai_service(self) -> None:
        """
        Validate OpenAI service capabilities for client intake.
        
        Comprehensive validation includes:
        - Service method availability
        - Model compatibility
        - Response generation capabilities
        - Performance characteristics
        
        Raises:
            ValueError: If service lacks critical capabilities
        """
        try:
            # 1. Validate Core Method Availability
            required_methods = [
                'generate_completion', 
                'generate_chat_completion'
            ]
            missing_methods = [
                method for method in required_methods 
                if not hasattr(self.openai_service, method)
            ]
            
            if missing_methods:
                raise ValueError(
                    f"OpenAI Service missing critical methods: {', '.join(missing_methods)}"
                )
            
            # 2. Advanced Model Compatibility Validation
            self._validate_model_compatibility()
            
            # 3. Optional: Service Performance Validation
            self._validate_service_performance()
        
        except Exception as e:
            print(f"OpenAI Service Validation Warning: {e}")
            import traceback
            traceback.print_exc()

    def _validate_model_compatibility(self) -> None:
        """
        Perform comprehensive model compatibility check.
        
        Validates:
        - Model compatibility for reasoning tasks
        - Version and capability alignment
        - Performance characteristics
        """
        try:
            # Retrieve compatible models for reasoning task
            compatible_models = ModelTaskConfig.get_compatible_models("reasoning")
            
            # Validate current model against compatible models
            model_compatibility = any(
                ModelTaskConfig.is_model_compatible(self.model, model) 
                for model in compatible_models
            )
            
            if not model_compatibility:
                # Detailed model incompatibility warning
                print(f"\n--- Model Compatibility Warning ---")
                print(f"Current Model: {self.model}")
                print(f"Compatible Models: {', '.join(compatible_models)}")
                
                # Suggest fallback model
                fallback_model = ModelTaskConfig.get_default_model("reasoning")
                print(f"Recommended Fallback Model: {fallback_model}")
                
                # Optional: Detailed model capability comparison
                current_model_details = ModelTaskConfig.get_model_details(self.model)
                print("\nCurrent Model Capabilities:")
                for key, value in current_model_details.items():
                    print(f"  - {key}: {value}")
            
            # Additional model version check
            model_version = ModelTaskConfig.get_model_version(self.model)
            if model_version < ModelTaskConfig.MINIMUM_SUPPORTED_VERSION:
                print(f"\n--- Outdated Model Version Warning ---")
                print(f"Current Model Version: {model_version}")
                print(f"Minimum Supported Version: {ModelTaskConfig.MINIMUM_SUPPORTED_VERSION}")
        
        except Exception as model_err:
            print(f"Detailed Model Compatibility Check Failed: {model_err}")

    def _validate_service_performance(self) -> None:
        """
        Optional performance validation for OpenAI service.
        
        Checks:
        - Response generation speed
        - Token processing capabilities
        - Error handling robustness
        """
        try:
            # Simulate a quick performance test
            test_prompt = "Validate service performance for client intake."
            
            start_time = time.time()
            response = self.openai_service.generate_completion(
                prompt=test_prompt, 
                model=self.model,
                max_tokens=50,
                timeout=5  # 5-second timeout
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            # Performance thresholds
            max_acceptable_response_time = 3.0  # seconds
            min_token_generation_rate = 10  # tokens per second
            
            # Validate response time
            if response_time > max_acceptable_response_time:
                print(f"\n--- Performance Warning ---")
                print(f"Response Time: {response_time:.2f} seconds")
                print(f"Maximum Acceptable Time: {max_acceptable_response_time} seconds")
            
            # Validate token generation rate
            generated_tokens = len(response.split())
            token_generation_rate = generated_tokens / response_time
            
            if token_generation_rate < min_token_generation_rate:
                print(f"\n--- Token Generation Performance Warning ---")
                print(f"Token Generation Rate: {token_generation_rate:.2f} tokens/second")
                print(f"Minimum Acceptable Rate: {min_token_generation_rate} tokens/second")
        
        except Exception as perf_err:
            print(f"Performance Validation Warning: {perf_err}")

    def _configure_intake_directories(self, intake_config: Optional[Dict[str, Any]] = None) -> None:
        """
        Configure intake service directories with optional custom configuration.
        
        Args:
            intake_config (Optional[Dict[str, Any]]): Optional configuration 
                for directory paths and settings.
        """
        # Default directory configuration
        default_dirs = {
            'forms': Path("data/intake_forms"),
            'submissions': Path("data/form_submissions"),
            'interviews': Path("data/interview_sessions")
        }
        
        # Override with custom configuration if provided
        if intake_config and 'directories' in intake_config:
            custom_dirs = intake_config['directories']
            for key, path in custom_dirs.items():
                if key in default_dirs:
                    default_dirs[key] = Path(path)
        
        # Set directories
        self.forms_directory = default_dirs['forms']
        self.submissions_directory = default_dirs['submissions']
        self.interviews_directory = default_dirs['interviews']
        
        # Create directories if they don't exist
        for directory in [
            self.forms_directory, 
            self.submissions_directory, 
            self.interviews_directory
        ]:
            os.makedirs(directory, exist_ok=True)

    def _log_service_initialization(self) -> None:
        """
        Log detailed service initialization information for monitoring and debugging.

        This method provides comprehensive logging about the service's configuration,
        helping with troubleshooting and understanding the service's current state.

        Logs include:
        - Model information
        - Directory configurations
        - Initialization timestamp
        - Environment details
        """
        try:
            # Detailed model logging
            print(f"\n--- Client Intake Service Telemetry ---")
            print(f"Initialization Timestamp: {datetime.now().isoformat()}")
            print(f"Model Details:")
            print(f"  - Selected Model: {self.model}")
            print(f"  - Task Category: reasoning")
            
            # Directory configuration logging
            print(f"Directory Configurations:")
            print(f"  - Forms Directory: {self.forms_directory}")
            print(f"  - Submissions Directory: {self.submissions_directory}")
            print(f"  - Interviews Directory: {self.interviews_directory}")
            
            # Environment context
            print(f"Environment Context:")
            print(f"  - OpenAI Service: {type(self.openai_service).__name__}")
            print(f"  - Settings Source: {type(self.settings).__name__}")
            print(f"  - Loaded Forms: {len(self.forms)}")
            
        except Exception as e:
            print(f"Error during service initialization logging: {e}")
            import traceback
            traceback.print_exc()

    def _load_forms(self) -> Dict[str, IntakeForm]:
        """Load all intake forms from storage"""
        forms = {}
        if not self.forms_directory.exists():
            return forms
            
        for file_path in self.forms_directory.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    form_data = json.load(f)
                    form = IntakeForm(**form_data)
                    forms[form.id] = form
            except Exception as e:
                print(f"Error loading form {file_path}: {e}")
        
        return forms
    
    def get_forms_by_practice_area(self, practice_area: str) -> List[IntakeForm]:
        """Get all forms for a specific practice area"""
        return [form for form in self.forms.values() if form.practiceArea.lower() == practice_area.lower()]
    
    def get_form_by_id(self, form_id: str) -> IntakeForm:
        """Get a specific form by ID"""
        if form_id not in self.forms:
            raise HTTPException(status_code=404, detail=f"Form with ID {form_id} not found")
        return self.forms[form_id]
    
    def create_form(self, form_data: Dict[str, Any]) -> IntakeForm:
        """Create a new intake form"""
        # Generate a unique ID if not provided
        if 'id' not in form_data:
            form_data['id'] = f"form_{uuid.uuid4().hex}"
        
        # Set timestamps
        now = datetime.now().isoformat()
        form_data['createdAt'] = now
        form_data['updatedAt'] = now
        
        # Create and validate the form
        form = IntakeForm(**form_data)
        
        # Save to storage
        file_path = self.forms_directory / f"{form.id}.json"
        with open(file_path, 'w') as f:
            f.write(form.json())
        
        # Add to in-memory store
        self.forms[form.id] = form
        
        return form
    
    def update_form(self, form_id: str, form_data: Dict[str, Any]) -> IntakeForm:
        """Update an existing form"""
        if form_id not in self.forms:
            raise HTTPException(status_code=404, detail=f"Form with ID {form_id} not found")
        
        # Get existing form and update its fields
        existing_form = self.forms[form_id].dict()
        existing_form.update(form_data)
        
        # Update timestamp
        existing_form['updatedAt'] = datetime.now().isoformat()
        
        # Create and validate the updated form
        updated_form = IntakeForm(**existing_form)
        
        # Save to storage
        file_path = self.forms_directory / f"{updated_form.id}.json"
        with open(file_path, 'w') as f:
            f.write(updated_form.json())
        
        # Update in-memory store
        self.forms[form_id] = updated_form
        
        return updated_form
    
    def delete_form(self, form_id: str) -> Dict[str, Any]:
        """Delete a form"""
        if form_id not in self.forms:
            raise HTTPException(status_code=404, detail=f"Form with ID {form_id} not found")
        
        # Remove from storage
        file_path = self.forms_directory / f"{form_id}.json"
        if file_path.exists():
            os.remove(file_path)
        
        # Remove from in-memory store
        del self.forms[form_id]
        
        return {"status": "success", "message": f"Form {form_id} deleted successfully"}
    
    def submit_form(self, submission_data: Dict[str, Any]) -> IntakeFormSubmission:
        """Submit a completed intake form"""
        form_id = submission_data.get('formId')
        if not form_id or form_id not in self.forms:
            raise HTTPException(status_code=404, detail=f"Form with ID {form_id} not found")
        
        # Create submission ID if not provided
        if 'id' not in submission_data:
            submission_data['id'] = f"submission_{uuid.uuid4().hex}"
        
        # Set submission timestamp
        submission_data['submittedAt'] = datetime.now().isoformat()
        
        # Create and validate submission
        submission = IntakeFormSubmission(**submission_data)
        
        # Save to storage
        file_path = self.submissions_directory / f"{submission.formId}_{submission_data['id']}.json"
        with open(file_path, 'w') as f:
            f.write(submission.json())
        
        return submission
    
    async def generate_case_assessment(self, submission_id: str) -> Dict[str, Any]:
        """Generate a preliminary case assessment based on form submission"""
        # Log the selected model for this analysis
        print(f"\n--- Client Case Assessment Model: {self.model} ---")
        
        # Verify submission path
        submission_path = self.submissions_directory / f"{submission_id}.json"
        if not submission_path.exists():
            raise HTTPException(status_code=404, detail=f"Submission {submission_id} not found")
        
        # Load submission data
        with open(submission_path, 'r') as f:
            submission_data = json.load(f)
            submission = IntakeFormSubmission(**submission_data)
        
        # Prepare prompt for case assessment
        prompt = f"""Analyze the following client intake form submission and provide a comprehensive case assessment:

Form Details:
Practice Area: {submission.practiceArea}
Form Type: {submission.formType}

Submission Data:
{json.dumps(submission.formData, indent=2)}

Please provide a detailed assessment including:
1. Initial legal analysis
2. Potential legal issues
3. Recommended next steps
4. Preliminary risk assessment

Return the response as a structured JSON with the following keys:
{{
  "summary": "Brief summary of the case",
  "legalIssues": ["List of potential legal issues"],
  "recommendedActions": ["List of recommended actions"],
  "riskAssessment": {{
    "overallRisk": "Low/Medium/High",
    "riskFactors": ["List of risk factors"]
  }},
  "nextSteps": ["Detailed next steps for the client"]
}}
"""
        
        try:
            # Generate case assessment using the selected model
            ai_response = await self.openai_service.generate_completion(
                prompt, 
                model=self.model
            )
            
            # Clean markdown formatting if needed
            if ai_response.startswith('```'):
                first_marker_end = ai_response.find('\n', 3)
                if first_marker_end != -1:
                    last_marker = ai_response.rfind('```')
                    if last_marker > first_marker_end:
                        ai_response = ai_response[first_marker_end+1:last_marker].strip()
                    else:
                        ai_response = ai_response[first_marker_end+1:].strip()
            
            # Parse the response
            assessment_data = json.loads(ai_response)
            
            # Create case assessment object
            case_assessment = CaseAssessment(**assessment_data)
            
            # Update submission with case assessment
            submission.caseAssessment = case_assessment
            submission.assessmentGeneratedAt = datetime.now().isoformat()
            
            # Save updated submission
            with open(submission_path, 'w') as f:
                f.write(submission.json())
            
            return {
                "submissionId": submission_id,
                "caseAssessment": assessment_data,
                "model_used": self.model
            }
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate case assessment: {str(e)}")

    async def create_interview_session(self, practice_area: str, case_type: Optional[str] = None) -> AIInterviewSession:
        """Create a new AI interview session with dynamically generated initial questions"""
        # Extensive logging and error handling
        logger.info(f"Attempting to create interview session")
        logger.info(f"Practice Area: {practice_area}")
        logger.info(f"Case Type: {case_type}")
        
        try:
            # Validate input parameters with more robust checks
            if not practice_area or not isinstance(practice_area, str):
                logger.error("Invalid practice area: Must be a non-empty string")
                raise ValueError("Practice area must be a non-empty string")
            
            # Validate case type if provided
            if case_type is not None and not isinstance(case_type, str):
                logger.error("Invalid case type: Must be a string or None")
                raise ValueError("Case type must be a string or None")
            
            # Generate unique session ID with additional entropy
            session_id = f"session_{uuid.uuid4().hex}_{int(datetime.now().timestamp())}"
            logger.info(f"Generated Session ID: {session_id}")
            
            # Create initial interview session with comprehensive validation
            try:
                session = AIInterviewSession(
                    sessionId=session_id,
                    practiceArea=practice_area,
                    caseType=case_type,
                    createdAt=datetime.now().isoformat(),
                    lastUpdatedAt=datetime.now().isoformat(),
                    isComplete=False,
                    questions=[],
                    responses=[]
                )
            except Exception as model_err:
                logger.error(f"Failed to create AIInterviewSession model: {model_err}")
                raise ValueError(f"Could not create interview session model: {model_err}")
            
            # Generate initial questions with error handling
            try:
                initial_questions = await self._get_initial_questions(practice_area, case_type)
                logger.info(f"Generated {len(initial_questions)} initial questions")
            except Exception as question_err:
                logger.error(f"Failed to generate initial questions: {question_err}")
                raise RuntimeError(f"Could not generate initial questions: {question_err}")
            
            # Add initial questions to the session
            session.questions.extend(initial_questions)
            
            # Prepare session directory with error handling
            try:
                os.makedirs(self.interviews_directory, exist_ok=True)
            except OSError as dir_err:
                logger.error(f"Failed to create interviews directory: {dir_err}")
                raise RuntimeError(f"Could not create interviews directory: {dir_err}")
            
            # Save session to file with comprehensive error handling
            try:
                session_path = self.interviews_directory / f"{session_id}.json"
                with open(session_path, 'w') as f:
                    f.write(session.json())
                logger.info(f"Saved session to {session_path}")
            except IOError as file_err:
                logger.error(f"Failed to save interview session file: {file_err}")
                raise RuntimeError(f"Could not save interview session: {file_err}")
            
            return session
        
        except Exception as e:
            # Final comprehensive error logging
            logger.error(f"Unhandled error in create_interview_session: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500, 
                detail=f"Comprehensive failure in creating interview session: {str(e)}"
            )

    async def _get_initial_questions(self, practice_area: str, case_type: Optional[str] = None) -> List[AIInterviewQuestion]:
        """Dynamically generate initial questions based on practice area and case type"""
        # Log the selected model for this analysis
        print(f"\n--- Client Initial Questions Model: {self.model} ---")
        
        # Prepare the prompt for generating initial interview questions
        prompt = f"""Generate a set of initial interview questions for a legal intake in the {practice_area} practice area.
        
        {f'Case Type: {case_type}' if case_type else 'No specific case type provided'}
        
        Requirements for questions:
        1. Be specific to the practice area
        2. Cover essential information for legal assessment
        3. Use clear, professional language
        4. Provide context for each question
        
        Format the response as a JSON array with the following structure:
        [
            {{
                "id": "unique_question_id",
                "question": "Full question text",
                "context": "Brief explanation of why this question is important",
                "type": "open_ended|multiple_choice|numeric",
                "optional": false
            }},
            ...
        ]
        
        Generate 5-7 questions that will help gather comprehensive information.
        """
        
        try:
            # Generate questions using the selected model
            ai_response = await self.openai_service.generate_completion(
                prompt, 
                model=self.model
            )
            
            # Clean markdown formatting if needed
            if ai_response.startswith('```'):
                first_marker_end = ai_response.find('\n', 3)
                if first_marker_end != -1:
                    last_marker = ai_response.rfind('```')
                    if last_marker > first_marker_end:
                        ai_response = ai_response[first_marker_end+1:last_marker].strip()
                    else:
                        ai_response = ai_response[first_marker_end+1:].strip()
            
            # Parse the response
            questions_data = json.loads(ai_response)
            
            # Convert to AIInterviewQuestion objects
            initial_questions = [
                AIInterviewQuestion(
                    id=q.get('id', f"q_{uuid.uuid4().hex}"),
                    question=q['question'],
                    context=q.get('context', ''),
                    type=q.get('type', 'open_ended'),
                    optional=q.get('optional', False)
                ) for q in questions_data
            ]
            
            return initial_questions
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate initial questions: {str(e)}")

    async def process_interview_response(self, session_id: str, question_id: str, response_text: str) -> List[AIInterviewQuestion]:
        """Process a response in an interview session and generate follow-up questions"""
        # Log the selected model for this analysis
        print(f"\n--- Client Interview Response Model: {self.model} ---")
        
        # Verify session path
        session_path = self.interviews_directory / f"{session_id}.json"
        if not session_path.exists():
            raise HTTPException(status_code=404, detail=f"Interview session {session_id} not found")
        
        # Load session data
        with open(session_path, 'r') as f:
            session_data = json.load(f)
            session = AIInterviewSession(**session_data)
        
        # Find the current question
        current_question = next((q for q in session.questions if q.id == question_id), None)
        if not current_question:
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found in session")
        
        # Create a response object
        response = AIInterviewResponse(
            questionId=question_id,
            response=response_text,
            respondedAt=datetime.now().isoformat()
        )
        
        # Add response to session
        session.responses.append(response)
        
        # Prepare prompt for generating follow-up questions
        previous_context = "\n".join([
            f"Q: {q.question}\nA: {next((r.response for r in session.responses if r.questionId == q.id), 'No response')}"
            for q in session.questions[:session.questions.index(current_question) + 1]
        ])
        
        prompt = f"""Generate follow-up interview questions based on the previous conversation in a {session.practiceArea} legal intake.

Previous Context:
{previous_context}

Latest Response:
Q: {current_question.question}
A: {response_text}

Requirements for follow-up questions:
1. Be directly relevant to the previous responses
2. Aim to clarify or expand on the information provided
3. Help build a comprehensive understanding of the case
4. Use clear, professional language
5. Maintain the context of the practice area

Format the response as a JSON array with the following structure:
[
    {{
        "id": "unique_question_id",
        "question": "Full question text",
        "context": "Brief explanation of why this question is important",
        "type": "open_ended|multiple_choice|numeric",
        "optional": false
    }},
    ...
]

Generate 2-4 follow-up questions that will help gather more detailed information.
"""
        
        try:
            # Generate follow-up questions using the selected model
            ai_response = await self.openai_service.generate_completion(
                prompt, 
                model=self.model
            )
            
            # Clean markdown formatting if needed
            if ai_response.startswith('```'):
                first_marker_end = ai_response.find('\n', 3)
                if first_marker_end != -1:
                    last_marker = ai_response.rfind('```')
                    if last_marker > first_marker_end:
                        ai_response = ai_response[first_marker_end+1:last_marker].strip()
                    else:
                        ai_response = ai_response[first_marker_end+1:].strip()
            
            # Parse the response
            questions_data = json.loads(ai_response)
            
            # Convert to AIInterviewQuestion objects
            follow_up_questions = [
                AIInterviewQuestion(
                    id=q.get('id', f"q_{uuid.uuid4().hex}"),
                    question=q['question'],
                    context=q.get('context', ''),
                    type=q.get('type', 'open_ended'),
                    optional=q.get('optional', False)
                ) for q in questions_data
            ]
            
            # Add new questions to the session
            session.questions.extend(follow_up_questions)
            
            # Save updated session
            with open(session_path, 'w') as f:
                f.write(session.json())
            
            return follow_up_questions
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process interview response: {str(e)}")

    async def complete_interview(self, session_id: str) -> Dict[str, Any]:
        """Complete an interview session and generate a case assessment"""
        # Log the selected model for this analysis
        print(f"\n--- Client Interview Completion Model: {self.model} ---")
        
        # Verify session path
        session_path = self.interviews_directory / f"{session_id}.json"
        if not session_path.exists():
            raise HTTPException(status_code=404, detail=f"Interview session {session_id} not found")
        
        # Load session data
        with open(session_path, 'r') as f:
            session_data = json.load(f)
            session = AIInterviewSession(**session_data)
        
        # Prepare comprehensive interview context
        interview_data = []
        for question in session.questions:
            response = next((r for r in session.responses if r.questionId == question.id), None)
            if response:
                interview_data.append({
                    "question": question.question,
                    "response": response.response
                })
        
        # Prepare prompt for generating case summary and assessment
        prompt = f"""As an experienced legal professional, analyze and summarize the following client interview for a {session.practiceArea} legal case.

Interview Transcript:
{json.dumps(interview_data, indent=2)}

Practice Area: {session.practiceArea}
{f'Case Type: {session.caseType}' if session.caseType else ''}

Comprehensive Analysis Requirements:
1. Provide a concise summary of the client's situation
2. Identify key legal issues and potential challenges
3. Assess the strengths and weaknesses of the potential case
4. Recommend initial legal strategies
5. Highlight any immediate actions required

Format the response as a structured JSON object with the following schema:
{{
  "summary": "Concise narrative of the client's legal situation",
  "legalIssues": [
    {{
      "issue": "Specific legal issue",
      "significance": "High/Medium/Low",
      "potentialImpact": "Detailed explanation of potential consequences"
    }}
  ],
  "caseStrengths": [
    "List of case strengths with brief explanations"
  ],
  "caseWeaknesses": [
    "List of potential weaknesses or challenges"
  ],
  "recommendedActions": [
    {{
      "action": "Specific recommended legal action",
      "priority": "High/Medium/Low",
      "rationale": "Why this action is recommended"
    }}
  ],
  "immediateNextSteps": [
    "List of urgent steps the client or lawyer should take"
  ],
  "estimatedComplexity": "Simple/Moderate/Complex",
  "preliminaryRiskAssessment": {{
    "overallRisk": "Low/Medium/High",
    "riskFactors": ["List of key risk factors"]
  }}
}}
"""
        
        try:
            # Generate case summary using the selected model
            ai_response = await self.openai_service.generate_completion(
                prompt, 
                model=self.model
            )
            
            # Clean markdown formatting if needed
            if ai_response.startswith('```'):
                first_marker_end = ai_response.find('\n', 3)
                if first_marker_end != -1:
                    last_marker = ai_response.rfind('```')
                    if last_marker > first_marker_end:
                        ai_response = ai_response[first_marker_end+1:last_marker].strip()
                    else:
                        ai_response = ai_response[first_marker_end+1:].strip()
            
            # Parse the response
            analysis = json.loads(ai_response)
            
            # Create a CaseAssessment object
            case_assessment = CaseAssessment(**analysis)
            
            # Update session with summary and assessment
            session.summary = analysis.get("summary")
            session.caseAssessment = case_assessment
            session.isComplete = True
            session.lastUpdatedAt = datetime.now().isoformat()
            
            # Save updated session
            with open(session_path, 'w') as f:
                f.write(session.json())
            
            return session
        
        except json.JSONDecodeError as json_err:
            # Log detailed JSON parsing error
            print(f"JSON Parsing Error: {json_err}")
            print(f"Problematic AI Response: {ai_response}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI-generated case assessment: {str(json_err)}"
            )
        
        except Exception as e:
            # Comprehensive error logging
            print(f"Error completing interview: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to complete interview and generate case assessment: {str(e)}"
            )

    async def analyze_form_submission(self, submission_id: str) -> Dict[str, Any]:
        """Perform an initial analysis of a form submission using AI"""
        # Log the selected model for this analysis
        print(f"\n--- Client Form Submission Analysis Model: {self.model} ---")
        
        # Verify submission path
        submission_path = self.submissions_directory / f"{submission_id}.json"
        if not submission_path.exists():
            raise HTTPException(status_code=404, detail=f"Submission {submission_id} not found")
        
        # Load submission data
        with open(submission_path, 'r') as f:
            submission_data = json.load(f)
            submission = IntakeFormSubmission(**submission_data)
        
        # Prepare prompt for form submission analysis
        prompt = f"""Analyze the following client intake form submission and provide a comprehensive initial assessment:

Form Details:
Practice Area: {submission.practiceArea}
Form Type: {submission.formType}

Submission Data:
{json.dumps(submission.formData, indent=2)}

Analysis Requirements:
1. Provide an initial interpretation of the submission
2. Identify potential legal issues or concerns
3. Suggest preliminary next steps
4. Assess the urgency or complexity of the case

Format the response as a structured JSON object:
{{
  "initialInterpretation": "Concise summary of the submission",
  "potentialLegalIssues": [
    {{
      "issue": "Specific legal concern",
      "significance": "High/Medium/Low",
      "explanation": "Brief description of the issue"
    }}
  ],
  "preliminaryNextSteps": [
    {{
      "step": "Recommended action",
      "priority": "High/Medium/Low",
      "rationale": "Why this step is suggested"
    }}
  ],
  "caseComplexity": "Simple/Moderate/Complex",
  "urgencyLevel": "Low/Medium/High"
}}
"""
        
        try:
            # Generate form submission analysis using the selected model
            ai_response = await self.openai_service.generate_completion(
                prompt, 
                model=self.model
            )
            
            # Clean markdown formatting if needed
            if ai_response.startswith('```'):
                first_marker_end = ai_response.find('\n', 3)
                if first_marker_end != -1:
                    last_marker = ai_response.rfind('```')
                    if last_marker > first_marker_end:
                        ai_response = ai_response[first_marker_end+1:last_marker].strip()
                    else:
                        ai_response = ai_response[first_marker_end+1:].strip()
            
            # Parse the response
            analysis_data = json.loads(ai_response)
            
            # Update submission with analysis
            submission.initialAnalysis = analysis_data
            submission.analysisGeneratedAt = datetime.now().isoformat()
            
            # Save updated submission
            with open(submission_path, 'w') as f:
                f.write(submission.json())
            
            return {
                "submissionId": submission_id,
                "analysis": analysis_data,
                "model_used": self.model
            }
        
        except json.JSONDecodeError as json_err:
            # Log detailed JSON parsing error
            print(f"JSON Parsing Error: {json_err}")
            print(f"Problematic AI Response: {ai_response}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI-generated form submission analysis: {str(json_err)}"
            )
        
        except Exception as e:
            # Comprehensive error logging
            print(f"Error analyzing form submission: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to analyze form submission: {str(e)}"
            )
