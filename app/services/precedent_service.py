from typing import List, Dict, Any, Optional, Union
import datetime
import json
import uuid
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.services.memory_service import MemoryService
from app.config import Settings, ModelTaskConfig, OpenAIModel

class PrecedentService:
    """Service for managing legal precedents with metadata tagging"""
    
    def __init__(self, 
                 memory_service: MemoryService, 
                 ai_processor: AIProcessor,
                 settings: Settings):
        """Initialize the precedent service
        
        Args:
            memory_service: Service for managing memories
            ai_processor: Service for processing AI requests
            settings: Application settings for model configuration
        """
        self.memory_service = memory_service
        self.ai_processor = ai_processor
        self.model = settings.get_model_for_task("legal_analysis")  # Use legal analysis model
        self.settings = settings
        
        # Initialize precedent library
        # In production, these would be stored in a database
        self.precedents = self._initialize_precedents()
        self.precedent_categories = self._initialize_precedent_categories()
        self.precedent_tags = self._initialize_precedent_tags()
    
    def _initialize_precedents(self) -> Dict[str, Dict[str, Any]]:
        """Initialize the precedent library with common legal precedents
        
        Returns:
            Dictionary of precedents
        """
        return {
            "smith_v_jones_2023": {
                "id": "smith_v_jones_2023",
                "title": "Smith v. Jones (2023)",
                "citation": "2023 ONSC 123",
                "court": "Ontario Superior Court of Justice",
                "date": "2023-05-15",
                "summary": "The court held that the confidentiality clause in the employment contract was enforceable despite its broad scope, as it was necessary to protect the employer's legitimate business interests.",
                "key_points": [
                    "Confidentiality clauses in employment contracts are enforceable if they protect legitimate business interests",
                    "The scope of protection must be reasonable",
                    "Duration of confidentiality obligations may extend beyond employment"
                ],
                "practice_areas": ["employment", "commercial", "litigation"],
                "jurisdictions": ["ontario"],
                "tags": ["confidentiality", "employment contract", "trade secrets"],
                "url": "https://canlii.ca/example/smith-v-jones",
                "document_type": "case",
                "added_date": "2025-03-29",
                "added_by": "system"
            },
            "abc_corp_v_xyz_inc_2024": {
                "id": "abc_corp_v_xyz_inc_2024",
                "title": "ABC Corp. v. XYZ Inc. (2024)",
                "citation": "2024 BCCA 45",
                "court": "British Columbia Court of Appeal",
                "date": "2024-02-10",
                "summary": "The court ruled that the limitation of liability clause was unenforceable as it attempted to exclude liability for gross negligence, which is contrary to public policy.",
                "key_points": [
                    "Limitation of liability clauses cannot exclude liability for gross negligence",
                    "Public policy considerations may override contractual provisions",
                    "Clear and unambiguous language is required for limitation clauses"
                ],
                "practice_areas": ["commercial", "corporate", "litigation"],
                "jurisdictions": ["british_columbia"],
                "tags": ["limitation of liability", "gross negligence", "public policy"],
                "url": "https://canlii.ca/example/abc-corp-v-xyz-inc",
                "document_type": "case",
                "added_date": "2025-03-29",
                "added_by": "system"
            },
            "standard_commercial_lease_2025": {
                "id": "standard_commercial_lease_2025",
                "title": "Standard Commercial Lease Template (2025)",
                "citation": "",
                "court": "",
                "date": "2025-01-01",
                "summary": "A comprehensive commercial lease template updated for 2025, incorporating recent legal developments and best practices for commercial property leasing in Canada.",
                "key_points": [
                    "Updated force majeure provisions post-pandemic",
                    "Enhanced environmental compliance clauses",
                    "Modernized dispute resolution mechanisms",
                    "Digital signature and notice provisions"
                ],
                "practice_areas": ["real_estate", "commercial"],
                "jurisdictions": ["ontario", "british_columbia", "alberta"],
                "tags": ["commercial lease", "real estate", "template"],
                "url": "",
                "document_type": "template",
                "added_date": "2025-03-29",
                "added_by": "system"
            }
        }
    
    def _initialize_precedent_categories(self) -> List[Dict[str, str]]:
        """Initialize precedent categories
        
        Returns:
            List of precedent categories
        """
        return [
            {"id": "case", "name": "Case Law", "description": "Court decisions and judgments"},
            {"id": "statute", "name": "Statutes", "description": "Legislative acts and regulations"},
            {"id": "template", "name": "Templates", "description": "Document templates and forms"},
            {"id": "article", "name": "Articles", "description": "Legal articles and commentary"},
            {"id": "policy", "name": "Policies", "description": "Internal policies and procedures"}
        ]
    
    def _initialize_precedent_tags(self) -> List[str]:
        """Initialize precedent tags
        
        Returns:
            List of precedent tags
        """
        return [
            "confidentiality", "limitation of liability", "indemnification", "termination",
            "governing law", "dispute resolution", "force majeure", "intellectual property",
            "employment contract", "commercial lease", "real estate", "trade secrets",
            "gross negligence", "public policy", "template", "damages", "injunction",
            "specific performance", "contract interpretation", "statutory interpretation"
        ]
    
    async def get_precedents(self, practice_area: Optional[str] = None, 
                          jurisdiction: Optional[str] = None,
                          document_type: Optional[str] = None,
                          tags: Optional[List[str]] = None,
                          search_term: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get precedents with optional filtering
        
        Args:
            practice_area: Optional practice area to filter by
            jurisdiction: Optional jurisdiction to filter by
            document_type: Optional document type to filter by
            tags: Optional list of tags to filter by
            search_term: Optional search term to filter by
            
        Returns:
            List of precedents matching the filters
        """
        precedents = list(self.precedents.values())
        
        # Apply filters
        if practice_area:
            precedents = [p for p in precedents if practice_area in p["practice_areas"]]
            
        if jurisdiction:
            precedents = [p for p in precedents if jurisdiction in p["jurisdictions"]]
            
        if document_type:
            precedents = [p for p in precedents if p["document_type"] == document_type]
            
        if tags:
            precedents = [p for p in precedents if any(tag in p["tags"] for tag in tags)]
            
        if search_term:
            search_term = search_term.lower()
            precedents = [p for p in precedents if 
                         search_term in p["title"].lower() or
                         search_term in p["summary"].lower() or
                         search_term in p["citation"].lower() or
                         any(search_term in point.lower() for point in p["key_points"])]
            
        return precedents
    
    async def get_precedent(self, precedent_id: str) -> Dict[str, Any]:
        """Get a specific precedent by ID
        
        Args:
            precedent_id: ID of the precedent to retrieve
            
        Returns:
            Precedent data
            
        Raises:
            HTTPException: If precedent not found
        """
        if precedent_id not in self.precedents:
            raise HTTPException(status_code=404, detail=f"Precedent with ID {precedent_id} not found")
            
        return self.precedents[precedent_id]
    
    async def create_precedent(self, precedent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new precedent
        
        Args:
            precedent_data: Data for the new precedent
            
        Returns:
            Created precedent data
        """
        # Generate a unique ID if not provided
        if "id" not in precedent_data:
            # Create a slug from the title
            base_id = precedent_data["title"].lower().replace(" ", "_").replace(".", "")
            # Add a unique identifier
            precedent_id = f"{base_id}_{str(uuid.uuid4())[:8]}"
            precedent_data["id"] = precedent_id
        else:
            precedent_id = precedent_data["id"]
            
        # Add metadata
        precedent_data["added_date"] = datetime.datetime.now().strftime("%Y-%m-%d")
        precedent_data["added_by"] = "user"  # In a real app, this would be the authenticated user
        
        # Store the precedent
        self.precedents[precedent_id] = precedent_data
        
        # Update tags if new ones are provided
        if "tags" in precedent_data:
            for tag in precedent_data["tags"]:
                if tag not in self.precedent_tags:
                    self.precedent_tags.append(tag)
                    
        return precedent_data
    
    async def update_precedent(self, precedent_id: str, precedent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing precedent
        
        Args:
            precedent_id: ID of the precedent to update
            precedent_data: Updated data for the precedent
            
        Returns:
            Updated precedent data
            
        Raises:
            HTTPException: If precedent not found
        """
        if precedent_id not in self.precedents:
            raise HTTPException(status_code=404, detail=f"Precedent with ID {precedent_id} not found")
            
        # Update the precedent
        for key, value in precedent_data.items():
            if key != "id":  # Don't allow changing the ID
                self.precedents[precedent_id][key] = value
                
        # Update tags if new ones are provided
        if "tags" in precedent_data:
            for tag in precedent_data["tags"]:
                if tag not in self.precedent_tags:
                    self.precedent_tags.append(tag)
                    
        return self.precedents[precedent_id]
    
    async def delete_precedent(self, precedent_id: str) -> Dict[str, str]:
        """Delete a precedent
        
        Args:
            precedent_id: ID of the precedent to delete
            
        Returns:
            Success message
            
        Raises:
            HTTPException: If precedent not found
        """
        if precedent_id not in self.precedents:
            raise HTTPException(status_code=404, detail=f"Precedent with ID {precedent_id} not found")
            
        # Delete the precedent
        del self.precedents[precedent_id]
        
        return {"message": f"Precedent with ID {precedent_id} deleted successfully"}
    
    async def get_precedent_categories(self) -> List[Dict[str, str]]:
        """Get all precedent categories
        
        Returns:
            List of precedent categories
        """
        return self.precedent_categories
    
    async def get_precedent_tags(self) -> List[str]:
        """Get all precedent tags
        
        Returns:
            List of precedent tags
        """
        return self.precedent_tags
    
    async def analyze_precedent(self, precedent_id: str) -> Dict[str, Any]:
        """Analyze a precedent using AI
        
        Args:
            precedent_id: ID of the precedent to analyze
            
        Returns:
            Analysis results
            
        Raises:
            HTTPException: If precedent not found
        """
        if precedent_id not in self.precedents:
            raise HTTPException(status_code=404, detail=f"Precedent with ID {precedent_id} not found")
            
        precedent = self.precedents[precedent_id]
        
        # Construct a prompt for the AI
        prompt = f"""Analyze the following legal precedent and provide insights:
        
        Title: {precedent['title']}
        Citation: {precedent['citation']}
        Court: {precedent['court']}
        Date: {precedent['date']}
        Summary: {precedent['summary']}
        Key Points: {', '.join(precedent['key_points'])}
        Practice Areas: {', '.join(precedent['practice_areas'])}
        Jurisdictions: {', '.join(precedent['jurisdictions'])}
        
        Please provide:
        1. A detailed analysis of the legal principles established
        2. The significance and impact of this precedent
        3. How this precedent might be applied in similar cases
        4. Any limitations or potential challenges to this precedent
        5. Related precedents or statutes that should be considered alongside this one
        """
        
        # Process with AI
        analysis_result = await self.ai_processor.process_prompt(prompt, model=self.model)
        
        # Return the analysis
        return {
            "precedent_id": precedent_id,
            "precedent_title": precedent["title"],
            "analysis": analysis_result,
            "timestamp": datetime.datetime.now().isoformat()
        }
    
    async def analyze_precedent_relevance(self, 
                                    current_case_details: Dict[str, Any], 
                                    precedent_id: str) -> Dict[str, Any]:
        """Analyze the relevance of a specific precedent to the current case
        
        Args:
            current_case_details: Details of the current case
            precedent_id: ID of the precedent to analyze
            
        Returns:
            Analysis of precedent relevance with comparison details
        """
        # Retrieve the specific precedent
        precedent = self.precedents.get(precedent_id)
        if not precedent:
            raise HTTPException(status_code=404, detail="Precedent not found")
        
        # Prepare the prompt for relevance analysis
        prompt = f"""Analyze the relevance of the following legal precedent to the current case:

Current Case Details:
{json.dumps(current_case_details, indent=2)}

Precedent Details:
{json.dumps(precedent, indent=2)}

Analysis Requirements:
1. Compare key legal aspects
2. Identify similarities and differences
3. Assess potential impact on current case
4. Provide a relevance score (0-100%)
5. Explain reasoning behind the score
"""
        
        # Log the selected model for this analysis
        print(f"\n--- Precedent Relevance Analysis Model: {self.model} ---")
        
        # Process with AI using the selected model
        analysis_result = await self.ai_processor.process_prompt(prompt, model=self.model)
        
        # Return the analysis
        return {
            "precedent_id": precedent_id,
            "analysis": analysis_result,
            "model_used": self.model
        }
