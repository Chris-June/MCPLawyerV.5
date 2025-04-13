from typing import List, Dict, Any, Optional
from app.services.ai_processor import AIProcessor
from app.services.memory_service import MemoryService
from app.config import Settings, ModelTaskConfig, OpenAIModel
import uuid
from datetime import datetime

class DocumentTemplateService:
    def __init__(self, 
                 memory_service: Optional[MemoryService] = None, 
                 ai_processor: Optional[AIProcessor] = None,
                 settings: Optional[Settings] = None):
        """Initialize the document template service
        
        Args:
            memory_service: Optional service for storing memories
            ai_processor: Optional service for AI processing
            settings: Optional application settings for model configuration
        """
        self.memory_service = memory_service
        self.ai_processor = ai_processor
        
        # Set settings
        self.settings = settings
        
        # Select appropriate model for document template processing
        # Using legal_analysis model as the default for document processing
        if settings:
            try:
                self.model = settings.get_model_for_task("legal_analysis")
                print(f"DocumentTemplateService initialized with model: {self.model}")
            except Exception as e:
                print(f"Error selecting model for DocumentTemplateService: {str(e)}")
                # Fall back to reasoning model if legal_analysis is unavailable
                try:
                    self.model = settings.get_model_for_task("reasoning")
                    print(f"Falling back to model: {self.model}")
                except Exception as e2:
                    print(f"Error selecting fallback model: {str(e2)}")
                    self.model = None
        else:
            self.model = None
            print("DocumentTemplateService initialized without model selection capabilities")
        
        # In-memory store for templates (would be replaced with a database in production)
        self.templates = {}
        # Template categories for organization
        self.categories = [
            "Contract",
            "Litigation",
            "Corporate",
            "Real Estate",
            "Family Law",
            "Estate Planning",
            "Employment",
            "Intellectual Property"
        ]
        # Initialize with some example templates
        self._initialize_example_templates()
    
    def _initialize_example_templates(self):
        """Initialize with some example templates"""
        example_templates = [
            {
                "id": str(uuid.uuid4()),
                "name": "Retainer Agreement",
                "description": "Standard client retainer agreement",
                "category": "Contract",
                "content": "# RETAINER AGREEMENT\n\nTHIS AGREEMENT made on {{agreement_date}}\n\nBETWEEN:\n\n**{{firm_name}}**\n\n(the \"Firm\")\n\nAND:\n\n**{{client_name}}**\n\n(the \"Client\")\n\n## 1. ENGAGEMENT\n\nThe Client hereby retains the Firm to provide legal services in relation to {{matter_description}}.\n\n## 2. FEES AND DISBURSEMENTS\n\nThe Client agrees to pay to the Firm fees for legal services at the rate of {{hourly_rate}} per hour, plus applicable taxes and disbursements.\n\n## 3. RETAINER\n\nThe Client agrees to provide the Firm with a retainer in the amount of {{retainer_amount}} to be held in the Firm's trust account and to be applied to fees, disbursements, and taxes.\n\n## 4. BILLING\n\nThe Firm will bill the Client on a {{billing_frequency}} basis.\n\n## 5. TERMINATION\n\nEither party may terminate this agreement by providing written notice to the other party.\n\n## 6. GOVERNING LAW\n\nThis Agreement shall be governed by the laws of {{jurisdiction}}.\n\nIN WITNESS WHEREOF the parties have executed this Agreement as of the date first above written.\n\n___________________________\n{{firm_name}}\n\n___________________________\n{{client_name}}",
                "variables": [
                    "agreement_date",
                    "firm_name",
                    "client_name",
                    "matter_description",
                    "hourly_rate",
                    "retainer_amount",
                    "billing_frequency",
                    "jurisdiction"
                ],
                "version": 1,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Affidavit",
                "description": "General affidavit template",
                "category": "Litigation",
                "content": "# AFFIDAVIT\n\n**PROVINCE OF {{province}}**\n\n**In the matter of {{matter_description}}**\n\nI, {{deponent_name}}, of the City of {{deponent_city}}, in the Province of {{province}}, {{deponent_occupation}}, MAKE OATH AND SAY:\n\n1. {{affidavit_content}}\n\n2. I make this affidavit in support of {{purpose}} and for no other or improper purpose.\n\nSWORN BEFORE ME at the City of\n{{city}}, in the Province of {{province}},\nthis {{day}} day of {{month}}, {{year}}.\n\n___________________________\nA Commissioner for Oaths in and\nfor the Province of {{province}}\n\n___________________________\n{{deponent_name}}",
                "variables": [
                    "province",
                    "matter_description",
                    "deponent_name",
                    "deponent_city",
                    "deponent_occupation",
                    "affidavit_content",
                    "purpose",
                    "city",
                    "day",
                    "month",
                    "year"
                ],
                "version": 1,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]
        
        for template in example_templates:
            self.templates[template["id"]] = template
    
    async def get_templates(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all templates or filter by category"""
        if category:
            return [t for t in self.templates.values() if t["category"] == category]
        return list(self.templates.values())
    
    async def get_template(self, template_id: str) -> Dict[str, Any]:
        """Get a specific template by ID"""
        if template_id not in self.templates:
            raise ValueError(f"Template with ID {template_id} not found")
        return self.templates[template_id]
    
    async def create_template(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new template"""
        template_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        template = {
            "id": template_id,
            "name": template_data["name"],
            "description": template_data["description"],
            "category": template_data["category"],
            "content": template_data["content"],
            "variables": template_data.get("variables", []),
            "version": 1,
            "created_at": now,
            "updated_at": now
        }
        
        self.templates[template_id] = template
        return template
    
    async def update_template(self, template_id: str, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing template"""
        if template_id not in self.templates:
            raise ValueError(f"Template with ID {template_id} not found")
        
        current_template = self.templates[template_id]
        
        # Create a new version
        updated_template = {
            **current_template,
            "name": template_data.get("name", current_template["name"]),
            "description": template_data.get("description", current_template["description"]),
            "category": template_data.get("category", current_template["category"]),
            "content": template_data.get("content", current_template["content"]),
            "variables": template_data.get("variables", current_template["variables"]),
            "version": current_template["version"] + 1,
            "updated_at": datetime.now().isoformat()
        }
        
        self.templates[template_id] = updated_template
        return updated_template
    
    async def delete_template(self, template_id: str) -> Dict[str, Any]:
        """Delete a template"""
        if template_id not in self.templates:
            raise ValueError(f"Template with ID {template_id} not found")
        
        template = self.templates.pop(template_id)
        return {"success": True, "deleted_template": template}
    
    async def get_categories(self) -> List[str]:
        """Get all template categories"""
        return self.categories
    
    async def generate_document(self, template_id: str, variables: Dict[str, str]) -> Dict[str, Any]:
        """Generate a document from a template with the provided variables"""
        # Log the selected model for document generation
        if self.model:
            print(f"\n--- Document Generation Model: {self.model} ---")
        
        if template_id not in self.templates:
            raise ValueError(f"Template with ID {template_id} not found")
        
        template = self.templates[template_id]
        content = template["content"]
        
        # Simple template variable replacement
        for var_name, var_value in variables.items():
            content = content.replace(f"{{{{{{var_name}}}}}}", var_value)
        
        # If AI processor is available, use it to enhance the document
        enhanced_content = content
        if self.ai_processor and self.model:
            prompt = f"""You are a legal document assistant. Please review and enhance the following document:

{content}

Make sure it maintains proper legal language and formatting, but improve readability and clarity where possible.

Enhanced document:"""
            
            # Determine appropriate model based on document complexity
            document_complexity = "medium"  # Default complexity
            
            # Assess document complexity based on length and structure
            if len(content) > 5000 or content.count("##") > 10:
                document_complexity = "high"
                print(f"Document complexity assessed as: {document_complexity}")
            
            # Select model based on complexity
            selected_model = self.model  # Default model
            
            if document_complexity == "high" and self.settings:
                try:
                    # Use complex_reasoning model for high complexity documents
                    selected_model = self.settings.get_model_for_task("complex_reasoning")
                    print(f"Using complex_reasoning model for high complexity document: {selected_model}")
                except Exception as e:
                    print(f"Error selecting complex_reasoning model: {str(e)}")
                    # Fall back to the default model
                    selected_model = self.model
                    print(f"Falling back to default model: {selected_model}")
            
            response = await self.ai_processor.generate_response(
                system_prompt="You are a legal document assistant specializing in document enhancement.",
                user_prompt=prompt,
                model=selected_model
            )
            
            if response:
                enhanced_content = response
        
        return {
            "template_id": template_id,
            "template_name": template["name"],
            "content": enhanced_content,
            "variables_used": variables,
            "model_used": self.model,
            "generated_at": datetime.now().isoformat()
        }
    
    async def analyze_template(self, template_id: str) -> Dict[str, Any]:
        """Analyze a template for structure, variables, and suggestions"""
        # Log the selected model for template analysis
        if self.model:
            print(f"\n--- Template Analysis Model: {self.model} ---")
        
        if template_id not in self.templates:
            raise ValueError(f"Template with ID {template_id} not found")
        
        template = self.templates[template_id]
        
        # Basic analysis
        analysis = {
            "template_id": template_id,
            "template_name": template["name"],
            "word_count": len(template["content"].split()),
            "section_count": template["content"].count("##"),
            "variable_count": len(template["variables"]),
            "variables": template["variables"]
        }
        
        # Enhanced analysis with AI processor if available
        if self.ai_processor and self.model:
            prompt = f"""You are a legal document analyst. Please analyze this document template:

{template["content"]}

Provide insights on:
1. Structure and organization
2. Clarity and readability
3. Legal completeness
4. Suggestions for improvement
5. Potential risks or issues

Your analysis:"""
            
            # For template analysis, we use the legal_analysis model
            # This is a specialized task that benefits from legal expertise
            response = await self.ai_processor.generate_response(
                system_prompt="You are a legal document analyst specializing in template evaluation.",
                user_prompt=prompt,
                model=self.model
            )
            
            if response:
                analysis["ai_analysis"] = response
                analysis["model_used"] = self.model
        
        return analysis
