from typing import List, Dict, Any, Optional, Union
import datetime
import json
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.services.memory_service import MemoryService
from app.config import Settings, ModelTaskConfig, OpenAIModel

class LawPracticeService:
    """Service for managing Canadian law practice automation tasks"""
    
    def __init__(self, 
                 memory_service: MemoryService, 
                 ai_processor: AIProcessor,
                 settings: Optional[Settings] = None):
        """Initialize the law practice service
        
        Args:
            memory_service: Service for managing memories
            ai_processor: Service for processing AI requests
            settings: Optional application settings for model configuration
        """
        self.memory_service = memory_service
        self.ai_processor = ai_processor
        
        # Set model for legal practice tasks
        if settings:
            self.model = settings.get_model_for_task("legal_analysis")  # Use legal analysis model
            self.settings = settings
        else:
            self.model = None
            self.settings = None
        
        # Initialize document templates and other resources
        # In production, these would be stored in a database
        self.document_templates = self._initialize_document_templates()
        self.legal_calendars = self._initialize_legal_calendars()
        self.client_intake_forms = self._initialize_client_intake_forms()
        self.legal_research_databases = self._initialize_legal_research_databases()
    
    def _initialize_document_templates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize document templates for Canadian legal practice
        
        Returns:
            Dictionary of document templates
        """
        return {
            "retainer_agreement": {
                "name": "Retainer Agreement",
                "description": "Standard retainer agreement for new clients",
                "practice_areas": ["general", "family", "real_estate", "corporate", "litigation"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec"],
                "template_fields": [
                    "client_name", "client_address", "matter_description", 
                    "fee_structure", "retainer_amount", "lawyer_name"
                ]
            },
            "affidavit": {
                "name": "Affidavit",
                "description": "General affidavit template",
                "practice_areas": ["litigation", "family", "estates"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
                "template_fields": [
                    "deponent_name", "deponent_address", "sworn_date", 
                    "statement_content", "notary_name"
                ]
            },
            "statement_of_claim": {
                "name": "Statement of Claim",
                "description": "Template for initiating litigation",
                "practice_areas": ["litigation", "civil"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "federal"],
                "template_fields": [
                    "plaintiff_name", "defendant_name", "court_details", 
                    "claim_details", "relief_sought", "lawyer_name"
                ]
            },
            "will": {
                "name": "Last Will and Testament",
                "description": "Standard will template",
                "practice_areas": ["estates", "estate-probate"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec"],
                "template_fields": [
                    "testator_name", "testator_address", "executor_name", 
                    "beneficiaries", "specific_bequests", "residue_clause"
                ]
            },
            "power_of_attorney": {
                "name": "Power of Attorney",
                "description": "General power of attorney document",
                "practice_areas": ["estates", "estate-probate"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec"],
                "template_fields": [
                    "grantor_name", "grantor_address", "attorney_name", 
                    "attorney_address", "powers_granted", "effective_date"
                ]
            },
            "shareholder_agreement": {
                "name": "Shareholder Agreement",
                "description": "Defines rights and obligations of shareholders.",
                "practice_areas": ["corporate-commercial", "corporate"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
                "template_fields": ["Company Name", "Shareholder Names", "Effective Date", "Initial Capital Contributions"]
            },
            "nda": {
                "name": "Non-Disclosure Agreement (NDA)",
                "description": "Protects confidential information shared between parties.",
                "practice_areas": ["ip-tech", "corporate-commercial", "general"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
                "template_fields": ["Disclosing Party Name", "Receiving Party Name", "Effective Date", "Confidential Information Description", "Term of Agreement"]
            },
            "simple_construction_contract": {
                "name": "Simple Construction Contract",
                "description": "Basic agreement for construction services.",
                "practice_areas": ["real-estate-construction", "real_estate"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec"],
                "template_fields": ["Owner Name", "Contractor Name", "Project Address", "Scope of Work", "Total Contract Price", "Payment Schedule", "Completion Date"]
            },
            "employment_offer_letter": {
                "name": "Employment Offer Letter",
                "description": "Formal offer of employment to a candidate.",
                "practice_areas": ["employment-labor"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec"],
                "template_fields": ["Company Name", "Candidate Name", "Job Title", "Start Date", "Salary/Wage", "Reporting Manager"]
            },
            "basic_will": {
                "name": "Basic Will",
                "description": "Simple last will and testament document.",
                "practice_areas": ["estate-probate", "estates"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec"],
                "template_fields": ["Testator Name", "Executor Name", "Beneficiary Names", "Specific Bequests", "Residuary Clause Details"]
            },
            "mediation_agreement": {
                "name": "Mediation Agreement",
                "description": "Agreement to enter into mediation to resolve a dispute.",
                "practice_areas": ["alternative-dispute-resolution", "litigation", "family"],
                "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
                "template_fields": ["Party A Name", "Party B Name", "Mediator Name", "Date of Agreement", "Description of Dispute", "Confidentiality Clause Acknowledgement"]
            }
        }
    
    def _initialize_legal_calendars(self) -> Dict[str, Dict[str, Any]]:
        """Initialize legal calendars with Canadian court deadlines and limitation periods
        
        Returns:
            Dictionary of legal calendars
        """
        return {
            "limitation_periods": {
                "name": "Limitation Periods",
                "description": "Standard limitation periods by province",
                "entries": {
                    "ontario": {
                        "general": "2 years from discovery",
                        "real_property": "10 years",
                        "against_government": "Notice within 10 days, claim within 2 years"
                    },
                    "british_columbia": {
                        "general": "2 years from discovery",
                        "real_property": "10 years",
                        "against_government": "Notice within 2 months, claim within 2 years"
                    },
                    "alberta": {
                        "general": "2 years from discovery",
                        "real_property": "10 years",
                        "against_government": "Notice within 2 months, claim within 2 years"
                    },
                    "quebec": {
                        "general": "3 years from discovery",
                        "real_property": "10 years",
                        "against_government": "6 months notice, claim within 3 years"
                    }
                }
            },
            "court_deadlines": {
                "name": "Court Deadlines",
                "description": "Standard court deadlines by province and court level",
                "entries": {
                    "ontario": {
                        "statement_of_defence": "20 days after statement of claim if served in Ontario",
                        "appeal_period": "30 days from judgment"
                    },
                    "british_columbia": {
                        "statement_of_defence": "21 days after statement of claim if served in BC",
                        "appeal_period": "30 days from judgment"
                    },
                    "federal": {
                        "statement_of_defence": "30 days after statement of claim",
                        "appeal_period": "30 days from judgment"
                    }
                }
            }
        }
    
    def _initialize_client_intake_forms(self) -> Dict[str, Dict[str, Any]]:
        """Initialize client intake forms for different practice areas
        
        Returns:
            Dictionary of client intake forms
        """
        return {
            "general": {
                "name": "General Client Intake",
                "description": "Standard client intake form for general matters",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "matter_description", "how_referred", "conflicts_check"
                ]
            },
            "family": {
                "name": "Family Law Intake",
                "description": "Intake form for family law matters",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "spouse_name", "marriage_date", "separation_date", "children",
                    "assets", "liabilities", "income_information"
                ]
            },
            "real_estate": {
                "name": "Real Estate Intake",
                "description": "Intake form for real estate transactions",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "property_address", "transaction_type", "closing_date",
                    "purchase_price", "mortgage_details", "other_parties"
                ]
            },
            "corporate": {
                "name": "Corporate Intake",
                "description": "Intake form for corporate matters",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "company_name", "corporation_number", "directors", "shareholders",
                    "business_description", "transaction_details"
                ]
            },
            "litigation": {
                "name": "Litigation Client Intake",
                "description": "Intake form for potential litigation matters",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "opposing_party_name", "opposing_party_address",
                    "dispute_summary", "key_dates", "desired_outcome",
                    "witness_names", 
                    # Enhanced fields:
                    "claim_amount", "type_of_damages_sought", "attempts_to_resolve_prior",
                    "conflicts_check"
                ]
            },
            "ip-tech": {
                "name": "Intellectual Property & Technology Intake",
                "description": "Intake form for IP and technology law matters",
                "fields": [
                    "client_name", "client_company_name", "client_address", "client_phone", "client_email",
                    "technology_or_ip_description", "relevant_parties", "jurisdiction_of_interest",
                    "protection_sought", "commercialization_goals", "conflicts_check"
                ]
            },
            "employment-labor": {
                "name": "Employment & Labor Law Intake",
                "description": "Intake form for employment or labor law issues",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "employer_name", "job_title", "employment_dates",
                    "issue_description", "relevant_documents_list", "desired_resolution",
                    "union_involvement", "conflicts_check"
                ]
            },
            "estate-probate": {
                "name": "Estate Planning & Probate Intake",
                "description": "Intake form for wills, estates, and probate matters",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email", "client_dob",
                    "marital_status", "children_names_ages",
                    "primary_assets_list", "primary_liabilities_list",
                    "desired_executor_name", "desired_beneficiaries", "existing_will_location",
                    # Enhanced fields:
                    "has_existing_will", "power_of_attorney_exists", "approximate_estate_value",
                    "conflicts_check" 
                ]
            },
            "alternative-dispute-resolution": {
                "name": "Alternative Dispute Resolution (ADR) Intake",
                "description": "Intake form for mediation or arbitration matters",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "other_party_name", "other_party_contact",
                    "dispute_nature", "previous_attempts_at_resolution",
                    "preferred_adr_method", "desired_outcome", "conflicts_check"
                ]
            },
            "corporate-commercial": {
                "name": "Corporate & Commercial Law Intake",
                "description": "Intake form for corporate structures, contracts, and commercial transactions",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "company_name_if_applicable", "client_type", # e.g., Individual, Startup, Established Corp
                    "transaction_or_matter_type", # e.g., Incorporation, Contract Review, M&A, Compliance
                    "key_parties_involved", "summary_of_needs", "desired_timeline",
                    "conflicts_check"
                ]
            },
            "real-estate-construction": {
                "name": "Real Estate & Construction Law Intake",
                "description": "Intake form for property transactions and construction projects",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "property_type", # e.g., Residential, Commercial, Industrial, Land
                    "transaction_type", # e.g., Purchase, Sale, Lease, Financing, Construction Contract
                    "property_address_civic", "property_legal_description",
                    "involved_parties_names", "financing_status", "construction_scope_summary",
                    "conflicts_check"
                ]
            },
            "civil": {
                "name": "Civil Litigation Intake",
                "description": "Intake form for general civil disputes (non-family)",
                "fields": [
                    "client_name", "client_address", "client_phone", "client_email",
                    "opposing_party_name", "opposing_party_address",
                    "claim_type", # e.g., Contract Breach, Negligence/Tort, Property Dispute, Debt Collection
                    "incident_date_or_period", "summary_of_facts", "evidence_summary",
                    "damages_or_relief_sought", "court_preference_if_any",
                    "conflicts_check"
                ]
            }
        }
    
    def _initialize_legal_research_databases(self) -> Dict[str, Dict[str, Any]]:
        """Initialize legal research database references for Canadian law
        
        Returns:
            Dictionary of legal research databases
        """
        return {
            "canlii": {
                "name": "CanLII",
                "description": "Canadian Legal Information Institute",
                "url": "https://www.canlii.org/",
                "jurisdictions": ["federal", "all_provinces"],
                "content_types": ["cases", "legislation", "commentary"]
            },
            "westlaw": {
                "name": "Westlaw Canada",
                "description": "Comprehensive legal research database",
                "url": "https://www.westlaw.com/",
                "jurisdictions": ["federal", "all_provinces"],
                "content_types": ["cases", "legislation", "commentary", "forms", "precedents"]
            },
            "lexisnexis": {
                "name": "LexisNexis Quicklaw",
                "description": "Comprehensive legal research database",
                "url": "https://www.lexisnexis.ca/",
                "jurisdictions": ["federal", "all_provinces"],
                "content_types": ["cases", "legislation", "commentary", "forms", "precedents"]
            }
        }
    
    async def get_document_templates(self, practice_area: Optional[str] = None, jurisdiction: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get document templates filtered by practice area and jurisdiction
        
        Args:
            practice_area: Optional practice area filter
            jurisdiction: Optional jurisdiction filter
            
        Returns:
            List of matching document templates
        """
        templates = []
        
        for template_id, template in self.document_templates.items():
            # Apply filters if provided
            if practice_area and practice_area not in template["practice_areas"]:
                continue
            
            if jurisdiction and jurisdiction not in template["jurisdictions"]:
                continue
            
            # Add template to results
            templates.append({
                "id": template_id,
                **template
            })
        
        return templates
    
    async def get_limitation_periods(self, jurisdiction: Optional[str] = None) -> Dict[str, Any]:
        """Get limitation periods for a specific jurisdiction or all jurisdictions
        
        Args:
            jurisdiction: Optional jurisdiction filter
            
        Returns:
            Dictionary of limitation periods
        """
        limitation_periods = self.legal_calendars["limitation_periods"]
        
        if jurisdiction:
            # Return only the specified jurisdiction
            if jurisdiction not in limitation_periods["entries"]:
                raise HTTPException(status_code=404, detail=f"Jurisdiction '{jurisdiction}' not found")
            
            return {
                "name": limitation_periods["name"],
                "description": limitation_periods["description"],
                "jurisdiction": jurisdiction,
                "entries": limitation_periods["entries"][jurisdiction]
            }
        
        # Return all jurisdictions
        return limitation_periods
    
    async def get_court_deadlines(self, jurisdiction: Optional[str] = None) -> Dict[str, Any]:
        """Get court deadlines for a specific jurisdiction or all jurisdictions
        
        Args:
            jurisdiction: Optional jurisdiction filter
            
        Returns:
            Dictionary of court deadlines
        """
        court_deadlines = self.legal_calendars["court_deadlines"]
        
        if jurisdiction:
            # Return only the specified jurisdiction
            if jurisdiction not in court_deadlines["entries"]:
                raise HTTPException(status_code=404, detail=f"Jurisdiction '{jurisdiction}' not found")
            
            return {
                "name": court_deadlines["name"],
                "description": court_deadlines["description"],
                "jurisdiction": jurisdiction,
                "entries": court_deadlines["entries"][jurisdiction]
            }
        
        # Return all jurisdictions
        return court_deadlines
    
    async def get_client_intake_form(self, practice_area: str) -> Dict[str, Any]:
        """Get client intake form for a specific practice area
        
        Args:
            practice_area: Practice area to get form for
            
        Returns:
            Client intake form
        """
        if practice_area not in self.client_intake_forms:
            raise HTTPException(status_code=404, detail=f"Client intake form for practice area '{practice_area}' not found")
        
        return {
            "id": practice_area,
            **self.client_intake_forms[practice_area]
        }
    
    async def generate_document(self, template_id: str, field_values: Dict[str, str]) -> str:
        """Generate a document from a template using AI
        
        Args:
            template_id: ID of the template to use
            field_values: Values for template fields
            
        Returns:
            Generated document content
        """
        if template_id not in self.document_templates:
            raise HTTPException(status_code=404, detail=f"Document template '{template_id}' not found")
        
        template = self.document_templates[template_id]
        
        # Check that all required fields are provided
        missing_fields = []
        for field in template["template_fields"]:
            if field not in field_values:
                missing_fields.append(field)
        
        if missing_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Generate document using AI
        system_prompt = f"""You are a legal document generator for a Canadian law firm. 
        Generate a complete {template['name']} document based on the provided information.
        The document should be properly formatted and include all standard clauses for this type of document in Canada.
        Ensure the document complies with legal standards in {', '.join(template['jurisdictions'])}.
        Format the document in markdown with appropriate headings, sections, and formatting.
        """
        
        user_prompt = f"""Please generate a {template['name']} with the following information:
        
        {json.dumps(field_values, indent=2)}
        
        Include all standard clauses and formatting for this type of legal document in Canada.
        """
        
        document_content = await self.ai_processor.generate_response(system_prompt, user_prompt)
        
        return document_content
    
    async def analyze_legal_issue(self, issue_description: str, jurisdiction: str, practice_area: str) -> Dict[str, Any]:
        """Analyze a legal issue and provide guidance
        
        Args:
            issue_description: Description of the legal issue
            jurisdiction: Relevant jurisdiction (province or federal)
            practice_area: Relevant practice area
            
        Returns:
            Analysis and guidance
        """
        # Log the selected model for legal issue analysis
        if self.model:
            print(f"\n--- Legal Issue Analysis Model: {self.model} ---")
        
        # Validate inputs
        if not issue_description or not jurisdiction or not practice_area:
            raise HTTPException(status_code=400, detail="Issue description, jurisdiction, and practice area must be provided")
        
        # Create a prompt for the AI to analyze the legal issue
        system_prompt = f"""You are a legal analysis assistant specializing in {practice_area.replace('_', ' ')} law in {jurisdiction.replace('_', ' ')}.
        Provide a comprehensive and nuanced analysis of the legal issue.
        Use clear, professional language and structure your response for clarity.
        Include practical insights and potential legal strategies.
        """
        
        user_prompt = f"""Please analyze the following legal issue:

Issue Description: {issue_description}
Jurisdiction: {jurisdiction}
Practice Area: {practice_area}

Provide a comprehensive analysis including:
1. Legal context and relevant legal principles
2. Potential legal strategies and approaches
3. Key risks and considerations
4. Recommended next steps
5. Potential precedents or case law that might be relevant
6. Any jurisdictional nuances that may impact the issue

Your analysis should be thorough, balanced, and actionable.
"""
        
        # Process the prompt through the AI processor with the selected model
        analysis = await self.ai_processor.generate_response(
            system_prompt=system_prompt, 
            user_prompt=user_prompt,
            model=self.model
        )
        
        from datetime import datetime
        return {
            "issue_description": issue_description,
            "jurisdiction": jurisdiction,
            "practice_area": practice_area,
            "analysis": analysis,
            "model_used": str(self.model),
            "timestamp": datetime.now().isoformat()
        }
    
    async def analyze_client_intake(self, practice_area: str, form_data: Dict[str, str]) -> Dict[str, Any]:
        """Analyze a completed client intake form and provide insights
        
        Args:
            practice_area: Practice area of the intake form
            form_data: Completed form data from the client
            
        Returns:
            Analysis and insights about the client matter
        """
        # Log the selected model for client intake analysis
        if self.model:
            print(f"\n--- Client Intake Analysis Model: {self.model} ---")
        
        # Validate inputs
        if not practice_area or not form_data:
            raise HTTPException(status_code=400, detail="Practice area and form data must be provided")
        
        # Get the form definition for the practice area
        form_definition = self.client_intake_forms.get(practice_area)
        if not form_definition:
            raise HTTPException(status_code=404, detail=f"No intake form found for practice area: {practice_area}")
        
        # Format the form data for analysis
        formatted_data = ""
        for field in form_definition["fields"]:
            if field in form_data and form_data[field].strip():
                field_label = field.replace("_", " ").title()
                formatted_data += f"{field_label}: {form_data[field]}\n"
        
        # Create a prompt for the AI to analyze the intake form
        system_prompt = f"""You are a legal intake analysis assistant for a Canadian law firm.
        Analyze the client intake information for a {practice_area.replace('_', ' ')} legal matter.
        Provide insights, identify key legal issues, and suggest next steps.
        Format your response in markdown with clear headings and sections.
        """
        
        user_prompt = f"""Please analyze the following client intake information:
        
        {formatted_data}
        
        Please provide a comprehensive analysis including:
        1. Summary of the client's situation and key legal issues
        2. Potential legal strategies and approaches
        3. Additional information that may be needed from the client
        4. Preliminary assessment of case complexity and timeline
        5. Potential conflicts of interest to investigate (based on names provided)
        6. Recommended next steps
        """
        
        # Process the prompt through the AI processor with the selected model
        analysis = await self.ai_processor.generate_response(
            system_prompt=system_prompt, 
            user_prompt=user_prompt,
            model=self.model
        )
        
        return {
            "practice_area": practice_area,
            "form_name": form_definition["name"],
            "client_name": form_data.get("client_name", "Unknown Client"),
            "analysis": analysis,
            "model_used": self.model,
            "timestamp": datetime.datetime.now().isoformat()
        }
    
    async def calculate_deadline(self, start_date: str, deadline_type: str, jurisdiction: str) -> Dict[str, Any]:
        """Calculate a legal deadline based on start date, deadline type, and jurisdiction
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            deadline_type: Type of deadline (e.g., statement_of_defence, appeal_period)
            jurisdiction: Relevant jurisdiction (province or federal)
            
        Returns:
            Deadline information
        """
        # Validate jurisdiction
        court_deadlines = self.legal_calendars["court_deadlines"]
        if jurisdiction not in court_deadlines["entries"]:
            raise HTTPException(status_code=404, detail=f"Jurisdiction '{jurisdiction}' not found")
        
        # Validate deadline type
        if deadline_type not in court_deadlines["entries"][jurisdiction]:
            raise HTTPException(
                status_code=404, 
                detail=f"Deadline type '{deadline_type}' not found for jurisdiction '{jurisdiction}'"
            )
        
        # Parse start date
        try:
            start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Get deadline description
        deadline_description = court_deadlines["entries"][jurisdiction][deadline_type]
        
        # Calculate deadline date (simplified for demonstration)
        # In a real implementation, this would parse the deadline description and calculate the actual date
        days_to_add = 0
        if "20 days" in deadline_description:
            days_to_add = 20
        elif "21 days" in deadline_description:
            days_to_add = 21
        elif "30 days" in deadline_description:
            days_to_add = 30
        
        deadline_date = start_date_obj + datetime.timedelta(days=days_to_add)
        
        return {
            "start_date": start_date,
            "deadline_type": deadline_type,
            "jurisdiction": jurisdiction,
            "deadline_description": deadline_description,
            "deadline_date": deadline_date.strftime("%Y-%m-%d"),
            "days_remaining": (deadline_date - datetime.datetime.now().date()).days
        }
