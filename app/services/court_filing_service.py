from typing import Dict, Any, List, Optional
import datetime
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.config import Settings, ModelTaskConfig, OpenAIModel

class CourtFilingService:
    """Service for assisting with court filings and procedural requirements"""
    
    def __init__(self, 
                 ai_processor: Optional[AIProcessor] = None, 
                 settings: Optional[Settings] = None,
                 filing_config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the court filing service with advanced configuration.

        This constructor sets up the service with AI processing, model selection,
        and comprehensive configuration for court filing processes.

        Args:
            ai_processor (Optional[AIProcessor]): Service for processing AI requests.
            settings (Optional[Settings]): Application settings for model configuration.
            filing_config (Optional[Dict[str, Any]]): Optional custom configuration 
                for court filing service initialization.

        Raises:
            ValueError: If required dependencies are missing or misconfigured.
            ConfigurationError: If model selection fails or settings are invalid.

        Example:
            >>> service = CourtFilingService(
            ...     ai_processor=ai_processor, 
            ...     settings=app_settings,
            ...     filing_config=custom_config
            ... )
        """
        # Runtime validation of input dependencies
        if ai_processor is None:
            raise ValueError("AI Processor is required for CourtFilingService")
        
        if settings is None:
            raise ValueError("Application settings are required for CourtFilingService")
        
        # Additional runtime type and capability checks
        self._validate_input_types(ai_processor, settings)
        
        # Set core dependencies
        self.ai_processor = ai_processor
        self.settings = settings
        
        # Advanced model selection with fallback and logging
        try:
            # Court filing requires legal expertise, so use legal_analysis model
            self.model = settings.get_model_for_task("legal_analysis")
            print(f"\n--- Court Filing Service Model Selection ---")
            print(f"Selected Model: {self.model}")
        except Exception as e:
            print(f"Model selection error: {e}")
            # First fallback: Try complex_reasoning model
            try:
                self.model = settings.get_model_for_task("complex_reasoning")
                print(f"First fallback model: {self.model}")
            except Exception as e2:
                print(f"First fallback model selection error: {e2}")
                # Second fallback: Try reasoning model
                try:
                    self.model = settings.get_model_for_task("reasoning")
                    print(f"Second fallback model: {self.model}")
                except Exception as e3:
                    print(f"Second fallback model selection error: {e3}")
                    # Final fallback: Use DEFAULT_MODEL
                    self.model = ModelTaskConfig.DEFAULT_MODEL
                    print(f"Final fallback model: {self.model}")
        
        # Validate AI processor capabilities
        self._validate_ai_processor_capabilities()
        
        # Configure court filing data
        self._configure_court_filing_data(filing_config)
        
        # Optional telemetry or monitoring setup
        self._log_service_initialization()

    def _validate_input_types(
        self, 
        ai_processor: Any, 
        settings: Any
    ) -> None:
        """
        Perform runtime capability validation for input dependencies.
        
        Uses duck typing to validate service and settings capabilities.
        
        Args:
            ai_processor (Any): AI processor to validate
            settings (Any): Application settings to validate
        
        Raises:
            TypeError: If inputs lack required capabilities
            ValueError: If critical methods are missing
        """
        try:
            # Validate AI Processor capabilities
            required_ai_methods = [
                'generate_response' # Only check for methods that exist in AIProcessor
            ]
            
            for method_name in required_ai_methods:
                method = getattr(ai_processor, method_name, None)
                
                if method is None:
                    raise ValueError(f"Missing required method: {method_name}")
                
                # Optional: Validate method signature
                try:
                    import inspect
                    signature = inspect.signature(method)
                    
                    # Basic signature validation
                    expected_params = {
                        'generate_response': ['system_prompt', 'user_prompt', 'model']
                    }
                    
                    method_params = list(signature.parameters.keys())
                    expected = expected_params.get(method_name, [])
                    
                    # Check if critical parameters exist
                    missing_params = [
                        param for param in expected 
                        if param not in method_params
                    ]
                    
                    if missing_params:
                        raise ValueError(
                            f"Method {method_name} missing critical parameters: {missing_params}"
                        )
                
                except Exception as sig_err:
                    print(f"Warning: Could not fully validate {method_name} signature: {sig_err}")
        
        except Exception as e:
            raise TypeError(f"Invalid AI Processor: {e}")
        
        # Validate Settings capabilities
        try:
            required_settings_methods = [
                'get_model_for_task' # Only check for methods defined in Settings
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
        print(f"AI Processor: {type(ai_processor).__name__}")
        print(f"Settings: {type(settings).__name__}")

    def _validate_ai_processor_capabilities(self) -> None:
        """
        Validate AI processor capabilities for court filing service.
        
        Checks include:
        - Verifying service method availability
        - Checking model compatibility
        - Ensuring response generation capabilities
        
        Raises:
            ValueError: If service lacks required capabilities
        """
        try:
            # Retrieve compatible models for legal analysis task
            compatible_models = ModelTaskConfig.get_compatible_models("legal_analysis")
            
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
                fallback_model = ModelTaskConfig.get_default_model("legal_analysis")
                print(f"Recommended Fallback Model: {fallback_model}")
        
        except Exception as e:
            print(f"AI Processor Capability Check Warning: {e}")

    def _configure_court_filing_data(self, filing_config: Optional[Dict[str, Any]] = None) -> None:
        """
        Configure court filing data with optional custom configuration.
        
        Args:
            filing_config (Optional[Dict[str, Any]]): Optional configuration 
                for court filing data initialization.
        """
        # Initialize court data with optional custom configuration
        try:
            # Default court data initialization
            self.court_rules = self._initialize_court_rules()
            self.filing_requirements = self._initialize_filing_requirements()
            self.court_forms = self._initialize_court_forms()
            
            # Optional: Override or extend with custom configuration
            if filing_config:
                # Example: Allow custom rules or requirements
                if 'custom_rules' in filing_config:
                    self.court_rules.update(filing_config['custom_rules'])
                
                if 'custom_requirements' in filing_config:
                    self.filing_requirements.update(filing_config['custom_requirements'])
        
        except Exception as e:
            print(f"Court Filing Data Configuration Warning: {e}")

    def _log_service_initialization(self) -> None:
        """
        Log detailed service initialization information for monitoring and debugging.

        This method provides comprehensive logging about the service's configuration,
        helping with troubleshooting and understanding the service's current state.

        Logs include:
        - Model information
        - Initialization timestamp
        - Environment details
        """
        try:
            # Detailed model logging
            print("-" * 50)
            print(f"{self.__class__.__name__} Initialized")
            print(f"Model Selected: {self.model}")
            print(f"Initialization Timestamp: {datetime.datetime.now().isoformat()}")
            print("-" * 50)
            
            # Court data logging
            print(f"Court Data Configuration:")
            print(f"  - Jurisdictions: {len(self.court_rules)}")
            print(f"  - Filing Requirements: {len(self.filing_requirements)}")
            print(f"  - Court Forms: {len(self.court_forms)}")
            
            # Environment context
            print(f"Environment Context:")
            print(f"  - AI Processor: {type(self.ai_processor).__name__}")
            print(f"  - Settings Source: {type(self.settings).__name__}")
            
        except Exception as e:
            print(f"Error during service initialization logging: {e}")
            import traceback
            traceback.print_exc()

    def _initialize_court_rules(self) -> Dict[str, Dict[str, Any]]:
        """Initialize court rules for different jurisdictions
        
        Returns:
            Dictionary of court rules
        """
        return {
            "ontario_superior": {
                "name": "Ontario Superior Court of Justice",
                "rules_name": "Rules of Civil Procedure",
                "rules_url": "https://www.ontario.ca/laws/regulation/900194",
                "practice_directions_url": "https://www.ontariocourts.ca/scj/practice/practice-directions/"
            },
            "ontario_court": {
                "name": "Ontario Court of Justice",
                "rules_name": "Rules of the Ontario Court of Justice in Criminal Proceedings",
                "rules_url": "https://www.ontariocourts.ca/ocj/legal-professionals/practice-directions/"
            },
            "federal_court": {
                "name": "Federal Court of Canada",
                "rules_name": "Federal Courts Rules",
                "rules_url": "https://laws-lois.justice.gc.ca/eng/regulations/SOR-98-106/",
                "practice_directions_url": "https://www.fct-cf.gc.ca/en/pages/law-and-practice/notices"
            },
            "bc_supreme": {
                "name": "Supreme Court of British Columbia",
                "rules_name": "Supreme Court Civil Rules",
                "rules_url": "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/168_2009_00",
                "practice_directions_url": "https://www.bccourts.ca/supreme_court/practice_and_procedure/practice_directions.aspx"
            },
            "alberta_court_kings_bench": {
                "name": "Court of King's Bench of Alberta",
                "rules_name": "Alberta Rules of Court",
                "rules_url": "https://kings-printer.alberta.ca/documents/rules/rules_vol_1.pdf",
                "practice_directions_url": "https://albertacourts.ca/kb/resources/practice-notes"
            },
            "manitoba_court": {
                "name": "Court of King's Bench of Manitoba",
                "rules_name": "Rules of Court",
                "rules_url": "https://web2.gov.mb.ca/laws/rules/forms.php",
                "practice_directions_url": "https://www.manitobacourts.mb.ca/court-of-kings-bench/practice-directions/"
            },
            "new_brunswick_court": {
                "name": "Court of King's Bench of New Brunswick",
                "rules_name": "Rules of Court",
                "rules_url": "https://www.gnb.ca/0062/regs/Rule-e.asp",
                "practice_directions_url": "https://www.courtsnb-coursnb.ca/content/cour/en/rules-practice-directions.html"
            },
            "newfoundland_court": {
                "name": "Supreme Court of Newfoundland and Labrador",
                "rules_name": "Rules of the Supreme Court",
                "rules_url": "https://www.court.nl.ca/supreme/rules/index.html",
                "practice_directions_url": "https://www.court.nl.ca/supreme/practice-directions/index.html"
            },
            "nova_scotia_court": {
                "name": "Supreme Court of Nova Scotia",
                "rules_name": "Civil Procedure Rules",
                "rules_url": "https://www.courts.ns.ca/supreme_court/rules",
                "practice_directions_url": "https://www.courts.ns.ca/supreme_court/practice_directives"
            },
            "pei_court": {
                "name": "Supreme Court of Prince Edward Island",
                "rules_name": "Rules of Civil Procedure",
                "rules_url": "https://www.princeedwardisland.ca/en/publication/supreme-court-civil-rules",
                "practice_directions_url": "https://www.courts.pe.ca/en/supreme-court"
            },
            "quebec_superior": {
                "name": "Superior Court of Quebec",
                "rules_name": "Code of Civil Procedure",
                "rules_url": "https://www.legisquebec.gouv.qc.ca/en/document/cs/C-25.01",
                "practice_directions_url": "https://www.tribunaux.qc.ca/c-superieure/anglais/index.html"
            },
            "saskatchewan_court": {
                "name": "Court of King's Bench for Saskatchewan",
                "rules_name": "King's Bench Rules",
                "rules_url": "https://sasklawcourts.ca/kings-bench/rules/",
                "practice_directions_url": "https://sasklawcourts.ca/kings-bench/practice-directives/"
            },
            "northwest_territories_court": {
                "name": "Supreme Court of the Northwest Territories",
                "rules_name": "Rules of Court",
                "rules_url": "https://www.justice.gov.nt.ca/en/rules-of-court/",
                "practice_directions_url": "https://www.nwtcourts.ca/en/supreme-court/"
            },
            "nunavut_court": {
                "name": "Nunavut Court of Justice",
                "rules_name": "Rules of Court",
                "rules_url": "https://www.nunavutcourts.ca/index.php/rules",
                "practice_directions_url": "https://www.nunavutcourts.ca/index.php/practice-directions"
            },
            "yukon_court": {
                "name": "Supreme Court of Yukon",
                "rules_name": "Rules of Court",
                "rules_url": "https://yukoncourts.ca/rules/",
                "practice_directions_url": "https://yukoncourts.ca/supreme-court/practice-directions/"
            }
        }
    
    def _initialize_filing_requirements(self) -> Dict[str, Dict[str, Any]]:
        """Initialize filing requirements for different document types
        
        Returns:
            Dictionary of filing requirements
        """
        return {
            "ontario_statement_of_claim": {
                "court": "ontario_superior",
                "document_type": "Statement of Claim",
                "rule_reference": "Rule 14",
                "filing_fee": 229.00,
                "required_copies": 3,
                "format_requirements": [
                    "White paper, 8.5 x 11 inches",
                    "Text on one side only",
                    "Margins of at least 3 cm",
                    "Consecutively numbered paragraphs",
                    "12-point or larger font",
                    "Double-spaced text (except for quotations)"
                ],
                "content_requirements": [
                    "Court name and address",
                    "Title of proceeding",
                    "Full names of all parties",
                    "Concise statement of material facts",
                    "Relief sought",
                    "Plaintiff's address for service"
                ],
                "time_limits": {
                    "service": "6 months after issuance",
                    "filing_proof_of_service": "Within 30 days after service"
                }
            },
            "ontario_statement_of_defence": {
                "court": "ontario_superior",
                "document_type": "Statement of Defence",
                "rule_reference": "Rule 18",
                "filing_fee": 183.00,
                "required_copies": 3,
                "format_requirements": [
                    "White paper, 8.5 x 11 inches",
                    "Text on one side only",
                    "Margins of at least 3 cm",
                    "Consecutively numbered paragraphs",
                    "12-point or larger font",
                    "Double-spaced text (except for quotations)"
                ],
                "content_requirements": [
                    "Court name and address",
                    "Title of proceeding",
                    "Full names of all parties",
                    "Admissions and denials of allegations in statement of claim",
                    "Defendant's version of facts",
                    "Defendant's address for service"
                ],
                "time_limits": {
                    "filing": "Within 20 days after service of statement of claim (if served in Ontario)",
                    "filing_outside_ontario": "Within 40 days after service of statement of claim (if served elsewhere in Canada or USA)",
                    "filing_outside_canada_usa": "Within 60 days after service of statement of claim (if served outside Canada and USA)"
                }
            },
            "federal_notice_of_application": {
                "court": "federal_court",
                "document_type": "Notice of Application",
                "rule_reference": "Rule 301",
                "filing_fee": 50.00,
                "required_copies": 2,
                "format_requirements": [
                    "White paper, letter size",
                    "Margins of at least 2.5 cm",
                    "Consecutively numbered paragraphs",
                    "12-point or larger font",
                    "Double-spaced text (except for quotations)"
                ],
                "content_requirements": [
                    "Court name and registry",
                    "Names of parties",
                    "Relief sought",
                    "Grounds for application",
                    "List of documentary evidence to be used",
                    "Reference to statutory provision or rule",
                    "Applicant's address for service"
                ],
                "time_limits": {
                    "service": "Within 10 days after issuance",
                    "filing_proof_of_service": "Before day of hearing"
                }
            }
        }
    
    def _initialize_court_forms(self) -> Dict[str, Dict[str, Any]]:
        """Initialize court forms for different jurisdictions
        
        Returns:
            Dictionary of court forms
        """
        return {
            "ontario": {
                "name": "Ontario Court Forms",
                "url": "https://www.ontariocourtforms.on.ca/",
                "forms": [
                    {"code": "Form 14A", "name": "Statement of Claim (General)", "url": "https://www.ontariocourtforms.on.ca/forms/civil/14a/RCP_E_14A_1105.pdf"},
                    {"code": "Form 14C", "name": "Statement of Claim (Mortgage Action)", "url": "https://www.ontariocourtforms.on.ca/forms/civil/14c/RCP_E_14C_1105.pdf"},
                    {"code": "Form 14D", "name": "Statement of Claim (Divorce)", "url": "https://www.ontariocourtforms.on.ca/forms/civil/14d/RCP_E_14D_1105.pdf"},
                    {"code": "Form 18A", "name": "Statement of Defence", "url": "https://www.ontariocourtforms.on.ca/forms/civil/18a/RCP_E_18A_1105.pdf"},
                    {"code": "Form 27A", "name": "Notice of Appeal to an Appellate Court", "url": "https://www.ontariocourtforms.on.ca/forms/civil/27a/RCP_E_27A_1105.pdf"},
                    {"code": "Form 29A", "name": "Notice of Application", "url": "https://www.ontariocourtforms.on.ca/forms/civil/29a/RCP_E_29A_1105.pdf"},
                    {"code": "Form 29B", "name": "Notice of Application (Divorce)", "url": "https://www.ontariocourtforms.on.ca/forms/civil/29b/RCP_E_29B_1105.pdf"},
                    {"code": "Form 33A", "name": "Notice of Motion", "url": "https://www.ontariocourtforms.on.ca/forms/civil/33a/RCP_E_33A_1105.pdf"}
                ]
            },
            "federal": {
                "name": "Federal Court Forms",
                "url": "https://www.fct-cf.gc.ca/en/pages/law-and-practice/forms",
                "forms": [
                    {"code": "Form 16", "name": "Notice of Application", "url": "https://www.fct-cf.gc.ca/content/dam/fct-cf/forms/16_e.pdf"},
                    {"code": "Form 171", "name": "Notice of Action", "url": "https://www.fct-cf.gc.ca/content/dam/fct-cf/forms/171_e.pdf"},
                    {"code": "Form 171A", "name": "Statement of Claim", "url": "https://www.fct-cf.gc.ca/content/dam/fct-cf/forms/171a_e.pdf"},
                    {"code": "Form 171B", "name": "Statement of Defence", "url": "https://www.fct-cf.gc.ca/content/dam/fct-cf/forms/171b_e.pdf"},
                    {"code": "Form 301", "name": "Notice of Application for Judicial Review", "url": "https://www.fct-cf.gc.ca/content/dam/fct-cf/forms/301_e.pdf"},
                    {"code": "Form 359", "name": "Notice of Appeal", "url": "https://www.fct-cf.gc.ca/content/dam/fct-cf/forms/359_e.pdf"}
                ]
            },
            "bc": {
                "name": "British Columbia Court Forms",
                "url": "https://www.bccourts.ca/supreme_court/act_rules_forms/",
                "forms": [
                    {"code": "Form 1", "name": "Notice of Civil Claim", "url": "https://www.bccourts.ca/supreme_court/act_rules_forms/civil_forms/Form1.pdf"},
                    {"code": "Form 2", "name": "Response to Civil Claim", "url": "https://www.bccourts.ca/supreme_court/act_rules_forms/civil_forms/Form2.pdf"},
                    {"code": "Form 3", "name": "Counterclaim", "url": "https://www.bccourts.ca/supreme_court/act_rules_forms/civil_forms/Form3.pdf"},
                    {"code": "Form 32", "name": "Notice of Application", "url": "https://www.bccourts.ca/supreme_court/act_rules_forms/civil_forms/Form32.pdf"},
                    {"code": "Form 80", "name": "Notice of Appeal", "url": "https://www.bccourts.ca/supreme_court/act_rules_forms/civil_forms/Form80.pdf"}
                ]
            }
        }
    
    async def get_court_rules(self, jurisdiction: str) -> Dict[str, Any]:
        """Get court rules for a specific jurisdiction
        
        Args:
            jurisdiction: Court jurisdiction
            
        Returns:
            Court rules information
        """
        if jurisdiction not in self.court_rules:
            raise HTTPException(status_code=404, detail=f"Court rules for jurisdiction '{jurisdiction}' not found")
        
        return {
            "jurisdiction": jurisdiction,
            **self.court_rules[jurisdiction]
        }
    
    async def get_filing_requirements(self, document_type: str) -> Dict[str, Any]:
        """Get filing requirements for a specific document type
        
        Args:
            document_type: Type of court document
            
        Returns:
            Filing requirements
        """
        if document_type not in self.filing_requirements:
            raise HTTPException(status_code=404, detail=f"Filing requirements for document type '{document_type}' not found")
        
        return {
            "document_type": document_type,
            **self.filing_requirements[document_type]
        }
    
    async def get_court_forms(self, jurisdiction: str) -> Dict[str, Any]:
        """Get court forms for a specific jurisdiction
        
        Args:
            jurisdiction: Court jurisdiction
            
        Returns:
            Court forms information
        """
        if jurisdiction not in self.court_forms:
            raise HTTPException(status_code=404, detail=f"Court forms for jurisdiction '{jurisdiction}' not found")
        
        return {
            "jurisdiction": jurisdiction,
            **self.court_forms[jurisdiction]
        }
    
    async def generate_filing_checklist(self, document_type: str, jurisdiction: str) -> Dict[str, Any]:
        """Generate a filing checklist for a specific document type and jurisdiction
        
        Args:
            document_type: Type of court document
            jurisdiction: Court jurisdiction
            
        Returns:
            Filing checklist
        """
        # Create a prompt for the AI to generate a filing checklist
        system_prompt = """You are a legal filing specialist with expertise in Canadian court procedures.
        Create a comprehensive filing checklist for the specified court document and jurisdiction.
        Include all required steps, documents, fees, and deadlines.
        Format your response in markdown with clear sections and checkboxes.
        """
        
        user_prompt = f"""Please create a detailed filing checklist for the following:
        
        Document Type: {document_type}
        Jurisdiction: {jurisdiction}
        
        Include the following sections in your checklist:
        1. Document Preparation (formatting, content requirements, etc.)
        2. Required Supporting Documents
        3. Filing Fees and Payment Methods
        4. Number of Copies Required
        5. Where and How to File (including electronic filing options if available)
        6. Service Requirements
        7. Deadlines and Time Limits
        8. Post-Filing Steps
        9. Common Mistakes to Avoid
        
        Format the checklist with checkboxes (- [ ]) for each item that needs to be completed.
        """
        
        # Process the prompt through the AI processor
        checklist = await self.ai_processor.generate_response(system_prompt, user_prompt)
        
        return {
            "document_type": document_type,
            "jurisdiction": jurisdiction,
            "checklist": checklist,
            "generated_date": datetime.datetime.now().isoformat()
        }
    
    async def validate_court_document(self, document_text: str, document_type: str, jurisdiction: str) -> Dict[str, Any]:
        """Validate a court document against filing requirements
        
        Args:
            document_text: Text of the court document
            document_type: Type of court document
            jurisdiction: Court jurisdiction
            
        Returns:
            Validation results
        """
        # Log the selected model for this validation
        print(f"\n--- Court Document Validation Model: {self.model} ---")
        
        # Get specific requirements if available
        requirements_key = f"{jurisdiction.lower()}_{document_type.lower().replace(' ', '_')}"
        specific_requirements = "Unknown"
        
        if requirements_key in self.filing_requirements:
            req = self.filing_requirements[requirements_key]
            format_reqs = "\n- ".join(req["format_requirements"])
            content_reqs = "\n- ".join(req["content_requirements"])
            specific_requirements = f"Format Requirements:\n- {format_reqs}\n\nContent Requirements:\n- {content_reqs}"
        
        user_prompt = f"""Please validate the following court document against filing requirements:
        
        Document Type: {document_type}
        Jurisdiction: {jurisdiction}
        
        Known Filing Requirements:
        {specific_requirements}
        
        Document Text:
        ```
        {document_text[:4000]}  # Limit to first 4000 chars to avoid token limits
        ```
        
        Please provide a comprehensive validation report including:
        1. Overall Assessment (Pass/Fail/Needs Improvement)
        2. Format Issues (if any)
        3. Content Issues (if any)
        4. Missing Elements (if any)
        5. Specific Recommendations for Improvement
        6. Any Other Concerns
        
        Format your response in markdown with clear sections.
        """
        
        # Process the prompt through the AI processor with the selected model
        validation_report = await self.ai_processor.generate_response(
            system_prompt="You are a legal filing specialist with expertise in Canadian court procedures.", 
            user_prompt=user_prompt,
            model=self.model
        )
        
        return {
            "document_type": document_type,
            "jurisdiction": jurisdiction,
            "validation_report": validation_report,
            "validation_date": datetime.datetime.now().isoformat(),
            "model_used": self.model,
            "disclaimer": "This validation is AI-generated and should be reviewed by a legal professional before filing."
        }
    
    async def generate_filing_instructions(self, document_type: str, jurisdiction: str) -> Dict[str, Any]:
        """Generate step-by-step filing instructions for a specific document type and jurisdiction
        
        Args:
            document_type: Type of court document
            jurisdiction: Court jurisdiction
            
        Returns:
            Filing instructions
        """
        # Log the selected model for these instructions
        print(f"\n--- Court Filing Instructions Model: {self.model} ---")
        
        # Create a prompt for the AI to generate filing instructions
        system_prompt = """You are a legal filing specialist with expertise in Canadian court procedures.
        Create detailed step-by-step filing instructions for the specified court document and jurisdiction.
        Include practical guidance, tips, and best practices.
        Format your response in markdown with clear sections and numbered steps.
        """
        
        user_prompt = f"""Please create detailed filing instructions for the following:
        
        Document Type: {document_type}
        Jurisdiction: {jurisdiction}
        
        Include the following in your instructions:
        1. Pre-Filing Preparation
        2. Document Assembly and Organization
        3. Step-by-Step Filing Process
        4. Service Requirements and Process
        5. Post-Filing Steps and Follow-up
        6. Practical Tips and Best Practices
        7. Common Pitfalls to Avoid
        8. Resources and References
        
        Format your instructions with clear headings, numbered steps, and practical guidance.
        Include information about both physical and electronic filing options where available.
        """
        
        # Process the prompt through the AI processor with the selected model
        instructions = await self.ai_processor.generate_response(
            system_prompt=system_prompt, 
            user_prompt=user_prompt,
            model=self.model
        )
        
        return {
            "document_type": document_type,
            "jurisdiction": jurisdiction,
            "instructions": instructions,
            "generated_date": datetime.datetime.now().isoformat(),
            "model_used": self.model,
            "disclaimer": "These instructions are AI-generated and should be reviewed by a legal professional before use."
        }
