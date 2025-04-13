from typing import Dict, Any, List, Optional
import difflib
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.config import Settings, ModelTaskConfig, OpenAIModel

class DocumentComparisonService:
    """Service for comparing different versions of legal documents"""
    
    def __init__(self, 
                 ai_processor: AIProcessor, 
                 settings: Settings):
        """Initialize the document comparison service
        
        Args:
            ai_processor: Service for processing AI requests
            settings: Application settings for model configuration
        """
        self.ai_processor = ai_processor
        self.model = settings.get_model_for_task("legal_analysis")  # Use legal analysis model
        self.settings = settings
    
    async def compare_documents(self, original_text: str, revised_text: str, format: str = "html") -> Dict[str, Any]:
        """Compare two versions of a document and highlight differences
        
        Args:
            original_text: Original document text
            revised_text: Revised document text
            format: Output format (html, markdown, text)
            
        Returns:
            Comparison results with differences highlighted
        """
        # Log the selected model for this comparison
        print(f"\n--- Document Comparison Model: {self.model} ---")
        
        # Validate input
        if not original_text or not revised_text:
            raise HTTPException(status_code=400, detail="Both original and revised text must be provided")
        
        # Validate format
        valid_formats = ["html", "markdown", "text"]
        if format not in valid_formats:
            raise HTTPException(status_code=400, detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}")
        
        # Split the texts into lines
        original_lines = original_text.splitlines()
        revised_lines = revised_text.splitlines()
        
        # Generate diff based on format
        diff_result = ""
        
        if format == "html":
            # Generate HTML diff
            diff = difflib.HtmlDiff()
            diff_result = diff.make_file(original_lines, revised_lines, "Original", "Revised")
        elif format == "markdown":
            # For markdown, we'll use a simpler approach and have AI format it nicely
            diff = difflib.unified_diff(original_lines, revised_lines, "Original", "Revised", lineterm="")
            diff_text = "\n".join(diff)
            
            # Use AI to format the diff in markdown
            system_prompt = """You are a document comparison specialist.
            Convert the provided unified diff output into a well-formatted markdown document.
            Use markdown formatting to clearly show additions, deletions, and unchanged sections.
            Use color coding where appropriate (e.g., red for deletions, green for additions).
            """
            
            user_prompt = f"""Please convert this unified diff output into a well-formatted markdown document:
            
            ```
            {diff_text}
            ```
            
            Make sure to clearly indicate:
            - Added lines (with + prefix) in green or with appropriate markdown
            - Removed lines (with - prefix) in red or with appropriate markdown
            - Context lines without any special formatting
            - Section headers to indicate different parts of the document
            
            The result should be easy to read and understand for a legal professional.
            """
            
            diff_result = await self.ai_processor.generate_response(
                system_prompt=system_prompt, 
                user_prompt=user_prompt,
                model=self.model
            )
        else:  # text format
            diff = difflib.unified_diff(original_lines, revised_lines, "Original", "Revised", lineterm="")
            diff_result = "\n".join(diff)
        
        return {
            "format": format,
            "comparison_result": diff_result,
            "model_used": self.model,
            "stats": {
                "original_length": len(original_text),
                "revised_length": len(revised_text),
                "original_lines": len(original_lines),
                "revised_lines": len(revised_lines)
            }
        }
    
    async def summarize_changes(self, original_text: str, revised_text: str) -> Dict[str, Any]:
        """Summarize the changes between two versions of a document
        
        Args:
            original_text: Original document text
            revised_text: Revised document text
            
        Returns:
            Summary of changes
        """
        # Log the selected model for this summary
        print(f"\n--- Document Changes Summary Model: {self.model} ---")
        
        # Validate input
        if not original_text or not revised_text:
            raise HTTPException(status_code=400, detail="Both original and revised text must be provided")
        
        # Create a prompt for the AI to summarize changes
        system_prompt = """You are a legal document comparison specialist.
        Analyze the differences between the original and revised versions of a legal document.
        Provide a clear, concise summary of the substantive changes, focusing on legal implications.
        Organize your summary by document sections or themes of changes.
        Use markdown formatting for clarity.
        """
        
        # To avoid token limits, we'll extract a diff first and only send the diff to the AI
        original_lines = original_text.splitlines()
        revised_lines = revised_text.splitlines()
        diff = difflib.unified_diff(original_lines, revised_lines, lineterm="")
        diff_text = "\n".join(list(diff))
        
        user_prompt = f"""Please analyze the following differences between the original and revised versions of a legal document:
        
        ```
        {diff_text}
        ```
        
        Provide a comprehensive summary of the changes including:
        
        1. Overview of major changes
        2. Section-by-section analysis of substantive modifications
        3. Assessment of any legal implications of the changes
        4. Identification of any potentially problematic or conflicting changes
        5. Summary of formatting or structural changes (if significant)
        
        Focus on the legal significance of the changes rather than minor formatting or wording differences.
        """
        
        # Process the prompt through the AI processor with the selected model
        summary = await self.ai_processor.generate_response(
            system_prompt=system_prompt, 
            user_prompt=user_prompt,
            model=self.model
        )
        
        return {
            "summary": summary,
            "model_used": self.model,
            "stats": {
                "original_length": len(original_text),
                "revised_length": len(revised_text),
                "original_lines": len(original_lines),
                "revised_lines": len(revised_lines)
            }
        }
    
    async def extract_clauses(self, document_text: str) -> Dict[str, Any]:
        """Extract and categorize clauses from a legal document
        
        Args:
            document_text: Text of the legal document
            
        Returns:
            Extracted clauses categorized by type
        """
        # Log the selected model for this clause extraction
        print(f"\n--- Document Clause Extraction Model: {self.model} ---")
        
        # Validate input
        if not document_text:
            raise HTTPException(status_code=400, detail="Document text must be provided")
        
        # Create a prompt for the AI to extract clauses
        system_prompt = """You are a legal document analysis specialist.
        Extract and categorize key clauses from the provided legal document.
        Identify clause types (e.g., indemnification, confidentiality, termination, etc.).
        For each clause, provide the clause text and a brief explanation of its purpose and implications.
        Format your response in markdown with clear headings and sections.
        """
        
        user_prompt = f"""Please extract and categorize key clauses from the following legal document:
        
        ```
        {document_text[:4000]}  # Limit to first 4000 chars to avoid token limits
        ```
        
        For each clause:
        1. Identify the clause type/category
        2. Extract the relevant text
        3. Provide a brief explanation of its purpose and legal implications
        4. Note any unusual or potentially problematic language
        
        Organize the clauses by category and include section references where applicable.
        """
        
        # Process the prompt through the AI processor with the selected model
        extracted_clauses = await self.ai_processor.generate_response(
            system_prompt=system_prompt, 
            user_prompt=user_prompt,
            model=self.model
        )
        
        return {
            "extracted_clauses": extracted_clauses,
            "model_used": self.model,
            "document_length": len(document_text)
        }
