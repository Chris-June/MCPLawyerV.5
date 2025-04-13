from typing import Dict, Any, List, Optional
import re
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.settings import Settings
import json
from datetime import datetime
import copy

class CitationFormatterService:
    """Service for formatting legal citations according to Canadian standards"""
    
    def __init__(self, 
                 ai_processor: AIProcessor, 
                 settings: Settings):
        """Initialize the citation formatter service
        
        Args:
            ai_processor: Service for processing AI requests
            settings: Application settings for model selection
        """
        self.ai_processor = ai_processor
        
        # Model selection for citation tasks
        self.model = settings.get_model_for_task("legal_analysis")
        
        # Log model selection for transparency
        print(f"\n--- Citation Formatter Service Initialization ---")
        print(f"Selected AI Model: {self.model}")
        
        # Initialize citation styles
        self.citation_styles = self._initialize_citation_styles()
        
        # Log available citation styles
        print("Available Citation Styles:")
        for style_id, style_info in self.citation_styles.items():
            print(f"- {style_info['name']} (ID: {style_id})")
    
    def _initialize_citation_styles(self) -> Dict[str, Dict[str, Any]]:
        """Initialize citation styles with enhanced metadata
        
        Returns:
            Dictionary of citation styles with comprehensive information
        """
        return {
            "mcgill": {
                "name": "McGill Guide",
                "description": "Canadian Guide to Uniform Legal Citation (McGill Guide)",
                "version": "9th Edition",
                "is_default": True,
                "jurisdiction": ["Canada"],
                "primary_use": ["Academic", "Legal Research"],
                "complexity_level": "Advanced"
            },
            "bluebook": {
                "name": "Bluebook",
                "description": "The Bluebook: A Uniform System of Citation",
                "version": "21st Edition",
                "is_default": False,
                "jurisdiction": ["United States"],
                "primary_use": ["Legal Academia", "Court Submissions"],
                "complexity_level": "Expert"
            },
            "apa": {
                "name": "APA",
                "description": "American Psychological Association Style",
                "version": "7th Edition",
                "is_default": False,
                "jurisdiction": ["Interdisciplinary"],
                "primary_use": ["Academic Writing", "Research Papers"],
                "complexity_level": "Intermediate"
            }
        }
    
    async def format_case_citation(
        self, 
        case_info: Dict[str, str], 
        style: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Format a legal case citation with advanced AI-powered processing and validation.

        This method takes case information and generates a standardized legal citation 
        using the specified or default citation style. It leverages AI to ensure 
        precise formatting and handles various citation complexities.

        Args:
            case_info (Dict[str, str]): Comprehensive case information dictionary.
                Required keys:
                - 'case_name': Full name of the legal case (e.g., "Smith v. Jones")
                - 'year': Year of the case decision
                - 'volume': Volume number of the legal reporter
                - 'reporter': Name of the legal reporter
                - 'page': Starting page of the case in the reporter

                Optional keys:
                - 'court': Court that issued the decision
                - 'jurisdiction': Legal jurisdiction of the case
                - 'additional_info': Any supplementary case information

            style (Optional[str], optional): 
                Citation style identifier. Defaults to "mcgill" (Canadian legal citation).
                Supported styles:
                - "mcgill": Canadian Guide to Uniform Legal Citation
                - "bluebook": United States legal citation standard
                - "apa": Academic/research citation style

        Returns:
            Dict[str, Any]: A comprehensive citation result containing:
                - 'case_info': Original case information
                - 'style': Detailed information about the citation style
                - 'formatted_citation': The generated legal citation
                - 'metadata': Additional validation and context information

        Raises:
            HTTPException: 
                - 404: If an invalid citation style is requested
                - 400: If required case information is missing
                - 500: If citation generation fails

        Examples:
            >>> service.format_case_citation({
            ...     'case_name': 'Smith v. Jones',
            ...     'year': '2023',
            ...     'volume': '45',
            ...     'reporter': 'SCC',
            ...     'page': '123'
            ... })
            {
                'case_info': {...},
                'style': {...},
                'formatted_citation': 'Smith v Jones, 2023 SCC 45 at 123',
                'metadata': {...}
            }
        """
        # Validate citation style
        if style and style not in self.citation_styles:
            print(f"\n--- Citation Style Error ---")
            print(f"Invalid citation style requested: {style}")
            raise HTTPException(status_code=404, detail=f"Citation style '{style}' not found")
        
        # Use default style if not specified
        style_to_use = style if style else "mcgill"
        style_info = self.citation_styles[style_to_use]
        
        # Validate required case information
        required_fields = ["case_name", "year", "volume", "reporter", "page"]
        missing_fields = [field for field in required_fields if field not in case_info or not case_info[field]]
        
        if missing_fields:
            print(f"\n--- Case Citation Validation Error ---")
            print(f"Missing required case information: {', '.join(missing_fields)}")
            
            # Detailed error context
            error_details = {
                "missing_fields": missing_fields,
                "provided_fields": list(case_info.keys()),
                "style": style_to_use
            }
            
            raise HTTPException(
                status_code=400, 
                detail={
                    "message": f"Missing required case information: {', '.join(missing_fields)}",
                    "error_code": "CITATION_INCOMPLETE",
                    "context": error_details
                },
                headers={
                    "X-Validation-Error": json.dumps(error_details)
                }
            )
        
        # Advanced input validation functions
        def validate_year(year: str) -> bool:
            """Validate year format and range"""
            try:
                year_int = int(year)
                return 1800 <= year_int <= datetime.now().year
            except ValueError:
                return False
        
        def validate_volume(volume: str) -> bool:
            """Validate volume number format"""
            try:
                volume_int = int(volume)
                return volume_int > 0
            except ValueError:
                return False
        
        def validate_page(page: str) -> bool:
            """Validate page number format"""
            try:
                page_int = int(page)
                return page_int > 0
            except ValueError:
                return False
        
        # Perform additional validations
        validation_errors = []
        
        if not validate_year(case_info['year']):
            validation_errors.append({
                "field": "year",
                "value": case_info['year'],
                "message": "Invalid year format or out of acceptable range"
            })
        
        if not validate_volume(case_info['volume']):
            validation_errors.append({
                "field": "volume",
                "value": case_info['volume'],
                "message": "Invalid volume number"
            })
        
        if not validate_page(case_info['page']):
            validation_errors.append({
                "field": "page",
                "value": case_info['page'],
                "message": "Invalid page number"
            })
        
        # Handle validation errors
        if validation_errors:
            print(f"\n--- Advanced Case Citation Validation Errors ---")
            for error in validation_errors:
                print(f"Validation Error: {error['field']} - {error['message']}")
            
            raise HTTPException(
                status_code=422,  # Unprocessable Entity
                detail={
                    "message": "Invalid case citation details",
                    "error_code": "CITATION_VALIDATION_FAILED",
                    "validation_errors": validation_errors
                },
                headers={
                    "X-Validation-Errors": json.dumps(validation_errors)
                }
            )
        
        # Optional fields validation and enrichment
        optional_fields = ["court", "jurisdiction", "additional_info"]
        for field in optional_fields:
            if field not in case_info:
                case_info[field] = "N/A"
        
        # Normalize case information
        case_info['case_name'] = case_info['case_name'].strip()
        case_info['year'] = case_info['year'].strip()
        case_info['volume'] = case_info['volume'].strip()
        case_info['reporter'] = case_info['reporter'].strip()
        case_info['page'] = case_info['page'].strip()
        
        # Prepare logging context
        print(f"\n--- Case Citation Formatting ---")
        print(f"Style: {style_info['name']} (Version: {style_info['version']})")
        print(f"Case: {case_info['case_name']} ({case_info['year']})")
        print(f"Complexity Level: {style_info.get('complexity_level', 'Unknown')}")
        
        # Validate case name format
        def validate_case_name(case_name: str) -> bool:
            """Validate case name format"""
            # Basic validation: check for party names separated by 'v.' or 'vs.'
            case_name_pattern = r'^[A-Z][a-z]+\s+(?:v\.|vs\.)\s+[A-Z][a-z]+'
            return re.match(case_name_pattern, case_name) is not None
        
        if not validate_case_name(case_info['case_name']):
            print(f"\n--- Case Name Validation Warning ---")
            print(f"Unusual case name format: {case_info['case_name']}")
            # Log but do not block processing
        
        # Create a comprehensive prompt for the AI to format the citation
        system_prompt = f"""You are an expert legal citation formatter specializing in the {style_info['name']} ({style_info['version']}).

Citation Formatting Guidelines:
1. Follow {style_info['name']} citation style precisely
2. Ensure accurate formatting of case name, year, volume, reporter, and page
3. Handle variations in case citation formats
4. Provide a clean, standardized citation

Complexity Level: {style_info.get('complexity_level', 'Standard')}
Jurisdiction: {', '.join(style_info.get('jurisdiction', ['Not Specified']))}
"""
        
        user_prompt = f"""Format the following case citation according to {style_info['name']} citation style:

Case Details:
- Case Name: {case_info['case_name']}
- Year: {case_info['year']}
- Volume: {case_info['volume']}
- Reporter: {case_info['reporter']}
- Page: {case_info['page']}
- Court: {case_info.get('court', 'N/A')}
- Jurisdiction: {case_info.get('jurisdiction', 'N/A')}

Additional Context:
- Ensure the citation is precise and follows all {style_info['name']} formatting rules
- If any information seems incomplete, use standard legal citation conventions to fill gaps
- Provide ONLY the formatted citation, without any additional explanation

Example Format Hint: [Party Names] [Year] [Volume] [Reporter] [Page]
"""
        
        try:
            # Process the prompt through the AI processor with selected model
            formatted_citation = await self.ai_processor.generate_response(
                system_prompt, 
                user_prompt, 
                model=self.model,
                max_tokens=200,  # Limit citation length
                temperature=0.2  # Ensure precise formatting
            )
            
            # Clean up the formatted citation
            formatted_citation = formatted_citation.strip()
            if formatted_citation.startswith('"') and formatted_citation.endswith('"'):
                formatted_citation = formatted_citation[1:-1]
            
            # Additional validation of formatted citation
            if not formatted_citation or len(formatted_citation) < 10:
                raise ValueError("Generated citation is too short or empty")
            
            print(f"Formatted Citation: {formatted_citation}")
            
            return {
                "case_info": case_info,
                "style": {
                    "id": style_to_use,
                    "name": style_info["name"],
                    "version": style_info["version"],
                    "complexity": style_info.get("complexity_level", "Unknown")
                },
                "formatted_citation": formatted_citation,
                "metadata": {
                    "validation_status": "Successful",
                    "style_jurisdictions": style_info.get("jurisdiction", [])
                }
            }
        
        except Exception as e:
            print(f"\n--- Citation Formatting Error ---")
            print(f"Error details: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500, 
                detail="Failed to generate citation. Please verify case information and try again.",
                headers={
                    "X-Error-Context": json.dumps({
                        "case_name": case_info.get('case_name', 'Unknown'),
                        "year": case_info.get('year', 'Unknown'),
                        "style": style_to_use
                    })
                }
            )
    
    async def format_legislation_citation(
        self, 
        legislation_info: Dict[str, str], 
        style: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Format a legal legislation citation with advanced AI-powered processing and validation.

        This method generates a standardized legal citation for legislation using 
        AI-powered formatting and comprehensive validation.

        Args:
            legislation_info (Dict[str, str]): Comprehensive legislation information.
                Required keys:
                - 'title': Full title of the legislation
                - 'jurisdiction': Legal jurisdiction of the legislation
                - 'year': Year of legislation enactment or amendment
                - 'chapter': Chapter or statute number

                Optional keys:
                - 'statute_volume': Volume of the statute collection
                - 'sections': Specific sections being cited
                - 'additional_info': Supplementary legislative information

            style (Optional[str], optional): 
                Citation style identifier. Defaults to "mcgill" (Canadian legal citation).
                Supported styles:
                - "mcgill": Canadian Guide to Uniform Legal Citation
                - "bluebook": United States legal citation standard
                - "apa": Academic/research citation style

        Returns:
            Dict[str, Any]: A comprehensive citation result containing:
                - 'legislation_info': Original legislation information
                - 'style': Detailed information about the citation style
                - 'formatted_citation': The generated legal citation
                - 'metadata': Additional validation and context information

        Raises:
            HTTPException: 
                - 404: If an invalid citation style is requested
                - 400: If required legislation information is missing
                - 422: If legislation details fail validation
                - 500: If citation generation fails

        Examples:
            >>> service.format_legislation_citation({
            ...     'title': 'Criminal Code',
            ...     'jurisdiction': 'Canada',
            ...     'year': '1985',
            ...     'chapter': 'C-46'
            ... })
            {
                'legislation_info': {...},
                'style': {...},
                'formatted_citation': 'Criminal Code, RSC 1985, c C-46',
                'metadata': {...}
            }
        """
        # Validate citation style
        if style and style not in self.citation_styles:
            print(f"\n--- Citation Style Error ---")
            print(f"Invalid citation style requested: {style}")
            raise HTTPException(
                status_code=404, 
                detail={
                    "message": f"Citation style '{style}' not found",
                    "error_code": "CITATION_STYLE_INVALID",
                    "available_styles": list(self.citation_styles.keys())
                }
            )
        
        # Use default style if not specified
        style_to_use = style if style else "mcgill"
        style_info = self.citation_styles[style_to_use]
        
        # Validate required legislation information
        required_fields = ["title", "jurisdiction", "year", "chapter"]
        missing_fields = [field for field in required_fields if field not in legislation_info or not legislation_info[field]]
        
        if missing_fields:
            print(f"\n--- Legislation Citation Validation Error ---")
            print(f"Missing required legislation information: {', '.join(missing_fields)}")
            
            # Detailed error context
            error_details = {
                "missing_fields": missing_fields,
                "provided_fields": list(legislation_info.keys()),
                "style": style_to_use
            }
            
            raise HTTPException(
                status_code=400, 
                detail={
                    "message": f"Missing required legislation information: {', '.join(missing_fields)}",
                    "error_code": "LEGISLATION_CITATION_INCOMPLETE",
                    "context": error_details,
                    "required_fields": required_fields,
                    "suggestions": [
                        f"Please provide the missing field(s): {', '.join(missing_fields)}",
                        "Ensure all required information is complete and accurate",
                        "Check the input data for any typos or omissions"
                    ]
                },
                headers={
                    "X-Validation-Error": json.dumps(error_details),
                    "X-Missing-Fields": json.dumps(missing_fields),
                    "X-Required-Fields": json.dumps(required_fields)
                }
            )
        
        # Advanced input validation functions
        def validate_year(year: str) -> bool:
            """Validate legislation year format and range"""
            try:
                year_int = int(year)
                return 1800 <= year_int <= datetime.now().year
            except ValueError:
                return False
        
        def validate_chapter(chapter: str) -> bool:
            """Validate chapter/statute number format"""
            # Allow alphanumeric characters with optional hyphen
            return bool(re.match(r'^[A-Za-z0-9-]+$', chapter))
        
        def validate_jurisdiction(jurisdiction: str) -> bool:
            """Validate jurisdiction format"""
            # Ensure jurisdiction is not empty and contains only letters and spaces
            return bool(re.match(r'^[A-Za-z\s]+$', jurisdiction)) and len(jurisdiction) > 1
        
        def validate_title(title: str) -> bool:
            """Validate legislation title format"""
            # Ensure title is not too short or too long
            return 5 <= len(title) <= 200
        
        # Perform additional validations
        validation_errors = []
        
        # Validate each required field with specific rules
        validation_checks = [
            ("year", validate_year, "Invalid year format or out of acceptable range"),
            ("chapter", validate_chapter, "Invalid chapter/statute number format"),
            ("jurisdiction", validate_jurisdiction, "Invalid jurisdiction format"),
            ("title", validate_title, "Invalid legislation title length")
        ]
        
        for field, validator, error_message in validation_checks:
            if not validator(legislation_info[field]):
                validation_errors.append({
                    "field": field,
                    "value": legislation_info[field],
                    "message": error_message
                })
        
        # Handle validation errors
        if validation_errors:
            print(f"\n--- Advanced Legislation Citation Validation Errors ---")
            for error in validation_errors:
                print(f"Validation Error: {error['field']} - {error['message']}")
            
            raise HTTPException(
                status_code=422,  # Unprocessable Entity
                detail={
                    "message": "Invalid legislation citation details",
                    "error_code": "LEGISLATION_CITATION_VALIDATION_FAILED",
                    "validation_errors": validation_errors,
                    "suggestions": [
                        "Review and correct the highlighted fields",
                        "Ensure data meets the specified validation criteria",
                        "Check for formatting or content issues in the problematic fields"
                    ]
                },
                headers={
                    "X-Validation-Errors": json.dumps(validation_errors),
                    "X-Error-Fields": json.dumps([error['field'] for error in validation_errors])
                }
            )
        
        # Optional fields validation and enrichment
        optional_fields = ["statute_volume", "sections", "additional_info"]
        for field in optional_fields:
            if field not in legislation_info:
                legislation_info[field] = "N/A"
        
        # Normalize legislation information
        legislation_info['title'] = legislation_info['title'].strip()
        legislation_info['jurisdiction'] = legislation_info['jurisdiction'].strip()
        legislation_info['year'] = legislation_info['year'].strip()
        legislation_info['chapter'] = legislation_info['chapter'].strip()
        
        # Prepare logging context
        print(f"\n--- Legislation Citation Formatting ---")
        print(f"Style: {style_info['name']} (Version: {style_info['version']})")
        print(f"Legislation: {legislation_info['title']} ({legislation_info['year']})")
        
        # Create a comprehensive prompt for the AI to format the citation
        system_prompt = f"""You are an expert legal citation formatter specializing in the {style_info['name']} ({style_info['version']}).

Legislation Citation Formatting Guidelines:
1. Follow {style_info['name']} citation style precisely
2. Ensure accurate formatting of legislation title, jurisdiction, year, and chapter
3. Handle variations in legislation citation formats
4. Provide a clean, standardized citation

Complexity Level: {style_info.get('complexity_level', 'Standard')}
Jurisdiction: {', '.join(style_info.get('jurisdiction', ['Not Specified']))}
"""
        
        user_prompt = f"""Format the following legislation citation according to {style_info['name']} citation style:

Legislation Details:
- Title: {legislation_info['title']}
- Jurisdiction: {legislation_info['jurisdiction']}
- Year: {legislation_info['year']}
- Chapter: {legislation_info['chapter']}
{f'- Statute Volume: {legislation_info["statute_volume"]}' if legislation_info["statute_volume"] != "N/A" else ''}
{f'- Sections: {legislation_info["sections"]}' if legislation_info["sections"] != "N/A" else ''}

Additional Context:
- Ensure the citation is precise and follows all {style_info['name']} formatting rules
- If any information seems incomplete, use standard legal citation conventions to fill gaps
- Provide ONLY the formatted citation, without any additional explanation

Example Format Hint: [Title], [Jurisdiction Abbreviation] [Year], c [Chapter]
"""
        
        try:
            # Process the prompt through the AI processor with selected model
            formatted_citation = await self.ai_processor.generate_response(
                system_prompt, 
                user_prompt, 
                model=self.model,
                max_tokens=200,  # Limit citation length
                temperature=0.2  # Ensure precise formatting
            )
            
            # Clean up the formatted citation
            formatted_citation = formatted_citation.strip()
            if formatted_citation.startswith('"') and formatted_citation.endswith('"'):
                formatted_citation = formatted_citation[1:-1]
            
            # Additional validation of formatted citation
            if not formatted_citation or len(formatted_citation) < 10:
                raise ValueError("Generated citation is too short or empty")
            
            print(f"Formatted Citation: {formatted_citation}")
            
            return {
                "legislation_info": legislation_info,
                "style": {
                    "id": style_to_use,
                    "name": style_info["name"],
                    "version": style_info["version"],
                    "complexity": style_info.get("complexity_level", "Unknown")
                },
                "formatted_citation": formatted_citation,
                "metadata": {
                    "validation_status": "Successful",
                    "style_jurisdictions": style_info.get("jurisdiction", [])
                }
            }
        
        except Exception as e:
            print(f"\n--- Legislation Citation Formatting Error ---")
            print(f"Error details: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500, 
                detail="Failed to generate legislation citation. Please verify information and try again.",
                headers={
                    "X-Error-Context": json.dumps({
                        "title": legislation_info.get('title', 'Unknown'),
                        "year": legislation_info.get('year', 'Unknown'),
                        "style": style_to_use
                    })
                }
            )
    
    def _generate_citation_parsing_prompt(self, citation_text: str) -> Dict[str, str]:
        """
        Dynamically generate a prompt for citation parsing.
        
        Args:
            citation_text (str): The citation text to be parsed.
        
        Returns:
            Dict[str, str]: A dictionary containing system and user prompts.
        """
        # Retrieve available citation styles from the instance
        available_styles = list(self.citation_styles.keys()) if self.citation_styles else ["mcgill", "bluebook", "apa"]
        style_options = "|".join(available_styles)
        
        system_prompt = """You are an expert legal citation parsing assistant.
Your task is to:
1. Identify the citation style from the available options
2. Break down the citation into structured components
3. Determine the type of citation (case law, legislation, journal article)
4. Provide precise, standardized parsing

Parsing Guidelines:
- Be extremely precise in component extraction
- Handle variations in citation formats
- Provide comprehensive metadata
"""
        
        user_prompt = """Parse the following legal citation and provide a comprehensive breakdown:

Citation Text: "{citation_text}"

Required Output Format (JSON):
{{
    "citation_type": "case|legislation|article",
    "parsed_components": {{
        "case_name": "Extracted case or document name",
        "year": "Extracted year",
        "court": "Extracted court or jurisdiction",
        "volume": "Extracted volume number",
        "additional_details": "Any additional relevant information"
    }},
    "style_detected": "{style_options}"
}}

Additional Context:
- If any component is uncertain, mark as "Unknown"
- Provide the most likely interpretation
- Be explicit about parsing confidence
- Use the most appropriate citation style from the available options
""".format(
    citation_text=citation_text.replace('"', '\\"'),
    style_options=style_options
)
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt
        }

    async def parse_citation(self, citation_text: str) -> Dict[str, Any]:
        """
        Parse a legal citation into its structured components with advanced AI-powered analysis.

        Args:
            citation_text (str): The full text of the legal citation to parse.

        Returns:
            Dict[str, Any]: A comprehensive parsed citation result
        """
        # Validate input citation text
        if not citation_text or not isinstance(citation_text, str):
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Invalid or empty citation text",
                    "error_code": "CITATION_PARSE_INVALID_INPUT",
                    "suggestions": [
                        "Provide a non-empty string citation",
                        "Ensure citation is a valid text format"
                    ]
                }
            )
        
        # Normalize citation text
        citation_text = citation_text.strip()
        
        # Length validation
        if len(citation_text) < 5 or len(citation_text) > 500:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Citation text length is invalid",
                    "error_code": "CITATION_PARSE_LENGTH_ERROR",
                    "context": {
                        "current_length": len(citation_text),
                        "min_length": 5,
                        "max_length": 500
                    }
                }
            )
        
        # Generate dynamic prompts
        prompts = self._generate_citation_parsing_prompt(citation_text)
        
        try:
            # Validate AI processor and model
            if not self.ai_processor:
                raise ValueError("AI Processor not initialized")
            
            if not self.model:
                raise ValueError("No AI model selected for citation parsing")
            
            # Process citation through AI with selected model
            parsed_result = await self.ai_processor.generate_response(
                prompts["system_prompt"], 
                prompts["user_prompt"], 
                model=self.model,
                max_tokens=300,
                temperature=0.3  # Balance between creativity and precision
            )
            
            # Validate AI response
            if not parsed_result:
                raise ValueError("Empty response from AI parsing")
            
            # Parse JSON response
            try:
                parsed_data = json.loads(parsed_result)
            except json.JSONDecodeError as json_err:
                raise ValueError(f"Invalid JSON response: {json_err}")
            
            # Validate parsed data structure
            required_keys = ["citation_type", "parsed_components", "style_detected"]
            for key in required_keys:
                if key not in parsed_data:
                    raise ValueError(f"Missing required key: {key}")
            
            return {
                "original_citation": citation_text,
                **parsed_data,
                "metadata": {
                    "parsing_confidence": "high",
                    "timestamp": datetime.now().isoformat(),
                    "model_used": str(self.model)
                }
            }
        
        except Exception as e:
            # Comprehensive error logging
            print(f"\n--- Citation Parsing Error ---")
            print(f"Citation Text: {citation_text}")
            print(f"Error Type: {type(e).__name__}")
            print(f"Error Details: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Failed to parse citation",
                    "error_code": "CITATION_PARSE_FAILED",
                    "original_text": citation_text,
                    "error_details": str(e),
                    "error_type": type(e).__name__
                }
            )
    
    def get_citation_styles(self) -> List[Dict[str, Any]]:
        """
        Retrieve comprehensive information about available citation styles.

        This method provides detailed metadata about each supported citation style,
        offering insights into their usage, complexity, and jurisdictional applicability.

        Returns:
            List[Dict[str, Any]]: A list of citation styles with comprehensive metadata
        
        Raises:
            HTTPException: If there's an issue retrieving citation styles
        """
        try:
            # Verify citation styles are not empty
            if not self.citation_styles:
                print("Warning: Citation styles dictionary is empty")
                raise ValueError("No citation styles available")

            # Convert dictionary to list of styles with their IDs
            styles_list = [
                {**style_info, "style_id": style_id} 
                for style_id, style_info in self.citation_styles.items()
            ]
            
            # Additional validation
            for style in styles_list:
                if not all(key in style for key in ['name', 'description', 'version', 'style_id']):
                    print(f"Warning: Incomplete metadata for citation style: {style.get('style_id', 'Unknown')}")
            
            return styles_list
        
        except Exception as e:
            print(f"Error retrieving citation styles: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500, 
                detail={
                    "message": "Unable to retrieve citation styles",
                    "error_code": "CITATION_STYLES_RETRIEVAL_FAILED",
                    "error_details": str(e)
                }
            )
