from typing import List, Dict, Any, Optional, Union
import datetime
import json
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.services.memory_service import MemoryService

class ClauseLibraryService:
    """Service for managing a library of legal clauses for document assembly"""
    
    def __init__(self, memory_service: MemoryService, ai_processor: AIProcessor, settings):
        """Initialize the clause library service
        
        Args:
            memory_service: Service for managing memories
            ai_processor: Service for processing AI requests
            settings: Application settings for model configuration
        """
        self.memory_service = memory_service
        self.ai_processor = ai_processor
        self.settings = settings
        
        # Select appropriate model for legal clause generation
        # Using legal_analysis model as clause generation requires legal expertise
        try:
            self.model = settings.get_model_for_task("legal_analysis")
            print(f"ClauseLibraryService initialized with model: {self.model}")
        except Exception as e:
            print(f"Error selecting model for ClauseLibraryService: {str(e)}")
            # First fallback: Try complex_reasoning model
            try:
                self.model = settings.get_model_for_task("complex_reasoning")
                print(f"First fallback model for ClauseLibraryService: {self.model}")
            except Exception as e2:
                print(f"First fallback model selection error: {str(e2)}")
                # Second fallback: Try reasoning model
                try:
                    self.model = settings.get_model_for_task("reasoning")
                    print(f"Second fallback model for ClauseLibraryService: {self.model}")
                except Exception as e3:
                    print(f"Second fallback model selection error: {str(e3)}")
                    # Final fallback: Use default model
                    self.model = "gpt-4.1-nano"  # Basic fallback
                    print(f"Final fallback model for ClauseLibraryService: {self.model}")
        
        # Initialize clause library
        # In production, these would be stored in a database
        self.clauses = self._initialize_clauses()
        self.clause_categories = self._initialize_clause_categories()
        self.clause_tags = self._initialize_clause_tags()
    
    def _initialize_clauses(self) -> Dict[str, Dict[str, Any]]:
        """Initialize the clause library with common legal clauses
        
        Returns:
            Dictionary of clauses
        """
        return {
    "arbitration_clause_canadian": {
        "name": "Canadian Arbitration Clause",
        "description": "Standard arbitration clause for Canadian disputes",
        "content": """Any dispute arising out of or in connection with this Agreement, including any question regarding its existence, validity or termination, shall be referred to and finally resolved by arbitration under the rules of the ADR Institute of Canada, which rules are deemed to be incorporated by reference into this clause. The seat of the arbitration shall be [City, Province]. The Tribunal shall consist of [one/three] arbitrator(s). The language of the arbitration shall be English.""",
        "practice_areas": ["litigation", "corporate", "commercial", "alternative_dispute_resolution"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
        "tags": ["arbitration", "dispute resolution", "ADR"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "assignment_clause": {
        "name": "Assignment Clause",
        "description": "Standard clause restricting assignment of the agreement",
        "content": """Neither party may assign this Agreement or any rights or obligations hereunder without the prior written consent of the other party, which consent shall not be unreasonably withheld. Any attempted assignment in violation of this provision shall be null and void. Notwithstanding the foregoing, either party may assign this Agreement to a successor in interest in connection with a merger, reorganization, or sale of all or substantially all of its assets or business to which this Agreement relates.""",
        "practice_areas": ["corporate", "commercial"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
        "tags": ["assignment", "transfer", "succession"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "confidentiality_basic": {
        "name": "Basic Confidentiality Clause",
        "description": "Standard confidentiality clause for general agreements",
        "content": """The Receiving Party agrees to maintain the confidentiality of the Confidential Information and to not disclose, reproduce, summarize, or distribute the Confidential Information except as expressly permitted under this Agreement.""",
        "practice_areas": ["general", "corporate", "commercial", "employment"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
        "tags": ["confidentiality", "nda", "privacy"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "entire_agreement": {
        "name": "Entire Agreement Clause",
        "description": "Standard entire agreement/integration clause",
        "content": """This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written, relating to such subject matter.""",
        "practice_areas": ["general", "corporate", "commercial", "real_estate"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
        "tags": ["entire agreement", "integration", "merger"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "force_majeure_canadian": {
        "name": "Canadian Force Majeure Clause",
        "description": "Force majeure clause adapted for Canadian law",
        "content": """Neither party shall be liable for any failure or delay in performance under this Agreement to the extent such failure or delay is caused by circumstances beyond that party's reasonable control, including but not limited to acts of God, natural disasters, pandemic, epidemic, government restrictions, wars, terrorism, labor disputes, or civil unrest, provided that the affected party gives prompt written notice to the other party and makes all reasonable efforts to mitigate the effects of the force majeure event.""",
        "practice_areas": ["corporate", "commercial", "real_estate"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
        "tags": ["force majeure", "act of god", "impossibility"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "governing_law_ontario": {
        "name": "Ontario Governing Law Clause",
        "description": "Governing law clause for Ontario jurisdiction",
        "content": """This Agreement shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein.""",
        "practice_areas": ["general", "corporate", "commercial", "real_estate"],
        "jurisdictions": ["ontario"],
        "tags": ["governing law", "jurisdiction", "choice of law"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "limitation_of_liability_standard": {
        "name": "Standard Limitation of Liability",
        "description": "Standard limitation of liability clause for commercial agreements",
        "content": """IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES, INCLUDING BUT NOT LIMITED TO, LOSS OF USE, DATA, OR PROFITS, OR BUSINESS INTERRUPTION, HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS AGREEMENT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.""",
        "practice_areas": ["corporate", "commercial", "technology"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "federal"],
        "tags": ["limitation of liability", "damages", "risk allocation"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "privacy_compliance_pipeda": {
        "name": "PIPEDA Compliance Clause",
        "description": "Privacy clause ensuring compliance with PIPEDA",
        "content": """Each party shall comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) and any applicable provincial privacy legislation with respect to any personal information collected, used, or disclosed pursuant to this Agreement. Each party shall implement appropriate technical and organizational measures to protect personal information against unauthorized or unlawful processing and against accidental loss, destruction, damage, alteration, or disclosure.""",
        "practice_areas": ["privacy", "data_protection", "corporate", "technology"],
        "jurisdictions": ["federal", "ontario", "british_columbia", "alberta"],
        "tags": ["privacy", "PIPEDA", "data protection", "personal information"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "severability": {
        "name": "Severability Clause",
        "description": "Standard severability clause",
        "content": """If any provision of this Agreement is held to be invalid, illegal, or unenforceable in any jurisdiction, such invalidity, illegality, or unenforceability shall not affect any other provision of this Agreement or invalidate or render unenforceable such provision in any other jurisdiction. Upon a determination that any provision is invalid, illegal, or unenforceable, the parties shall negotiate in good faith to modify this Agreement to effect the original intent of the parties as closely as possible.""",
        "practice_areas": ["general", "corporate", "commercial"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
        "tags": ["severability", "enforceability", "partial invalidity"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    },
    "termination_for_convenience": {
        "name": "Termination for Convenience",
        "description": "Clause allowing termination without cause with notice",
        "content": """Either party may terminate this Agreement for convenience upon providing [30/60/90] days' prior written notice to the other party.""",
        "practice_areas": ["corporate", "commercial", "employment"],
        "jurisdictions": ["ontario", "british_columbia", "alberta", "quebec", "federal"],
        "tags": ["termination", "convenience", "notice period"],
        "version": "1.0",
        "last_updated": "2025-03-29",
        "author": "system"
    }
}
    
    def _initialize_clause_categories(self) -> List[Dict[str, Any]]:
        """Initialize categories for organizing clauses
        
        Returns:
            List of clause categories
        """
        return [
            {
                "id": "general",
                "name": "General Provisions",
                "description": "Common clauses used in most agreements"
            },
            {
                "id": "confidentiality",
                "name": "Confidentiality & Privacy",
                "description": "Clauses related to confidential information and privacy"
            },
            {
                "id": "liability",
                "name": "Liability & Risk Allocation",
                "description": "Clauses addressing liability, indemnification, and risk"
            },
            {
                "id": "dispute_resolution",
                "name": "Dispute Resolution",
                "description": "Clauses for resolving disputes, including arbitration and mediation"
            },
            {
                "id": "termination",
                "name": "Termination & Renewal",
                "description": "Clauses related to ending or extending agreements"
            },
            {
                "id": "compliance",
                "name": "Regulatory Compliance",
                "description": "Clauses ensuring compliance with laws and regulations"
            },
            {
                "id": "intellectual_property",
                "name": "Intellectual Property",
                "description": "Clauses addressing IP rights, licenses, and ownership"
            },
            {
                "id": "payment",
                "name": "Payment & Financial Terms",
                "description": "Clauses related to payment, fees, and financial matters"
            }
        ]
    
    def _initialize_clause_tags(self) -> List[str]:
        """Initialize tags for categorizing and searching clauses
        
        Returns:
            List of clause tags
        """
        return [
            "confidentiality", "nda", "privacy", "governing law", "jurisdiction", 
            "choice of law", "limitation of liability", "damages", "risk allocation",
            "arbitration", "dispute resolution", "ADR", "force majeure", "act of god",
            "impossibility", "privacy", "PIPEDA", "data protection", "personal information",
            "termination", "convenience", "notice period", "entire agreement", "integration",
            "merger", "assignment", "transfer", "succession", "severability", "enforceability",
            "partial invalidity", "warranties", "representations", "indemnification", "insurance",
            "intellectual property", "IP", "copyright", "trademark", "patent", "license",
            "payment terms", "fees", "expenses", "taxes", "interest", "late payment"
        ]
    
    async def get_clauses(self, 
                          practice_area: Optional[str] = None, 
                          jurisdiction: Optional[str] = None,
                          tags: Optional[List[str]] = None,
                          search_term: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get clauses filtered by practice area, jurisdiction, tags, and search term
        
        Args:
            practice_area: Optional filter by practice area
            jurisdiction: Optional filter by jurisdiction
            tags: Optional list of tags to filter by
            search_term: Optional search term to filter by name, description, or content
            
        Returns:
            List of clauses matching the filters
        """
        filtered_clauses = []
        
        for clause_id, clause in self.clauses.items():
            # Apply practice area filter if specified
            if practice_area and practice_area not in clause.get("practice_areas", []):
                continue
                
            # Apply jurisdiction filter if specified
            if jurisdiction and jurisdiction not in clause.get("jurisdictions", []):
                continue
                
            # Apply tags filter if specified
            if tags:
                if not all(tag in clause.get("tags", []) for tag in tags):
                    continue
                    
            # Apply search term filter if specified
            if search_term:
                search_term = search_term.lower()
                name = clause.get("name", "").lower()
                description = clause.get("description", "").lower()
                content = clause.get("content", "").lower()
                
                if (search_term not in name and 
                    search_term not in description and 
                    search_term not in content):
                    continue
            
            # Add clause ID to the clause dictionary
            clause_with_id = clause.copy()
            clause_with_id["id"] = clause_id
            
            filtered_clauses.append(clause_with_id)
            
        return filtered_clauses
    
    async def get_clause(self, clause_id: str) -> Dict[str, Any]:
        """Get a specific clause by ID
        
        Args:
            clause_id: ID of the clause to retrieve
            
        Returns:
            Clause dictionary
            
        Raises:
            HTTPException: If clause not found
        """
        if clause_id not in self.clauses:
            raise HTTPException(status_code=404, detail=f"Clause with ID '{clause_id}' not found")
            
        clause = self.clauses[clause_id].copy()
        clause["id"] = clause_id
        
        return clause
    
    async def create_clause(self, clause_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new clause
        
        Args:
            clause_data: Dictionary containing clause data
            
        Returns:
            Created clause with ID
            
        Raises:
            HTTPException: If required fields are missing or clause ID already exists
        """
        required_fields = ["name", "description", "content", "practice_areas", "jurisdictions", "tags"]
        
        for field in required_fields:
            if field not in clause_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Generate a unique ID based on the name
        clause_id = clause_data["name"].lower().replace(" ", "_")
        
        # Check if ID already exists
        if clause_id in self.clauses:
            raise HTTPException(status_code=400, detail=f"Clause with ID '{clause_id}' already exists")
        
        # Add metadata
        clause_data["version"] = "1.0"
        clause_data["last_updated"] = datetime.datetime.now().strftime("%Y-%m-%d")
        clause_data["author"] = "user"  # In a real system, this would be the authenticated user
        
        # Store the clause
        self.clauses[clause_id] = clause_data
        
        # Return the clause with its ID
        result = clause_data.copy()
        result["id"] = clause_id
        
        return result
    
    async def update_clause(self, clause_id: str, clause_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing clause
        
        Args:
            clause_id: ID of the clause to update
            clause_data: Dictionary containing updated clause data
            
        Returns:
            Updated clause with ID
            
        Raises:
            HTTPException: If clause not found
        """
        if clause_id not in self.clauses:
            raise HTTPException(status_code=404, detail=f"Clause with ID '{clause_id}' not found")
        
        # Get the existing clause
        existing_clause = self.clauses[clause_id]
        
        # Update the clause with new data
        for key, value in clause_data.items():
            existing_clause[key] = value
        
        # Update metadata
        existing_clause["version"] = str(float(existing_clause.get("version", "1.0")) + 0.1)
        existing_clause["last_updated"] = datetime.datetime.now().strftime("%Y-%m-%d")
        
        # Store the updated clause
        self.clauses[clause_id] = existing_clause
        
        # Return the updated clause with its ID
        result = existing_clause.copy()
        result["id"] = clause_id
        
        return result
    
    async def delete_clause(self, clause_id: str) -> Dict[str, str]:
        """Delete a clause
        
        Args:
            clause_id: ID of the clause to delete
            
        Returns:
            Success message
            
        Raises:
            HTTPException: If clause not found
        """
        if clause_id not in self.clauses:
            raise HTTPException(status_code=404, detail=f"Clause with ID '{clause_id}' not found")
        
        # Delete the clause
        del self.clauses[clause_id]
        
        return {"message": f"Clause with ID '{clause_id}' deleted successfully"}
    
    async def get_clause_categories(self) -> List[Dict[str, Any]]:
        """Get all clause categories
        
        Returns:
            List of clause categories
        """
        return self.clause_categories
    
    async def get_clause_tags(self) -> List[str]:
        """Get all clause tags
        
        Returns:
            List of clause tags
        """
        return self.clause_tags
    
    async def generate_clause(self, 
                             clause_type: str, 
                             jurisdiction: str, 
                             parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a custom clause using AI
        
        Args:
            clause_type: Type of clause to generate (e.g., confidentiality, limitation of liability)
            jurisdiction: Jurisdiction for the clause
            parameters: Additional parameters for customizing the clause
            
        Returns:
            Generated clause
        """
        # Construct the prompt for the AI
        prompt = f"""Generate a {clause_type} clause for a legal document in {jurisdiction}, Canada.
        
        Parameters:
        {json.dumps(parameters, indent=2)}
        
        Please provide a well-drafted clause that is compliant with {jurisdiction} law and includes all necessary legal elements.
        IMPORTANT: You MUST incorporate all the provided parameters into the clause content. For example, if a client name is provided, use that specific name in the clause.
        
        Format the response as a JSON object with the following structure:
        {{"name": "Name of the clause", "content": "The full text of the clause", "explanation": "Brief explanation of the key elements of the clause"}}
        """
        
        # Determine appropriate model based on clause complexity and jurisdiction
        selected_model = self.model  # Default to the service's model
        
        # For specialized jurisdictions or complex clause types, try to use a more advanced model
        complex_jurisdictions = ["quebec", "federal"]
        complex_clause_types = ["indemnification", "limitation of liability", "intellectual property"]
        
        is_complex = (
            jurisdiction.lower() in complex_jurisdictions or
            clause_type.lower() in complex_clause_types or
            len(parameters) > 5  # Complex if many parameters
        )
        
        if is_complex and self.settings:
            try:
                # Use complex_reasoning model for complex clauses
                selected_model = self.settings.get_model_for_task("complex_reasoning")
                print(f"Using complex_reasoning model for complex clause: {selected_model}")
            except Exception as e:
                print(f"Error selecting complex_reasoning model: {str(e)}")
                # Fall back to the default model
                selected_model = self.model
                print(f"Falling back to default model: {selected_model}")
        
        # Process the prompt with the selected AI model
        # This ensures accurate legal clause generation
        ai_response = await self.ai_processor.process_prompt(
            prompt=prompt,
            model=selected_model
        )
        print(f"Generated {clause_type} clause for {jurisdiction} using model: {selected_model}")
        
        try:
            # Parse the JSON response
            result = json.loads(ai_response)
            
            # Validate the response structure
            required_fields = ["name", "content", "explanation"]
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing required field in AI response: {field}")
            
            return result
        except json.JSONDecodeError:
            # If the AI response is not valid JSON, try to extract the content
            # This is a fallback in case the AI doesn't format the response correctly
            return {
                "name": f"Generated {clause_type.capitalize()} Clause",
                "content": ai_response,
                "explanation": "AI-generated clause. Please review for accuracy and completeness."
            }
