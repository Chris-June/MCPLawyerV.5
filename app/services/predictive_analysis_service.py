from typing import List, Dict, Any, Optional
import json
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.config import Settings, ModelTaskConfig, OpenAIModel

class PredictiveAnalysisService:
    """Service for predictive case outcome analysis"""
    
    def __init__(self, 
                 ai_processor: AIProcessor, 
                 settings: Settings):
        """Initialize the predictive analysis service
        
        Args:
            ai_processor: Service for processing AI requests
            settings: Application settings for model configuration
        """
        self.ai_processor = ai_processor
        self.settings = settings
        
        # Select appropriate model for predictive case outcome analysis
        # Using legal_analysis model as the default for predictive analysis
        try:
            self.model = settings.get_model_for_task("legal_analysis")
            print(f"PredictiveAnalysisService initialized with model: {self.model}")
        except Exception as e:
            print(f"Error selecting model for PredictiveAnalysisService: {str(e)}")
            # Fall back to reasoning model if legal_analysis is unavailable
            self.model = settings.get_model_for_task("reasoning")
            print(f"Falling back to model: {self.model}")
    
    async def analyze_case_outcome(self, 
                                 case_facts: str, 
                                 legal_issues: List[str], 
                                 jurisdiction: str,
                                 relevant_statutes: Optional[List[str]] = None,
                                 similar_cases: Optional[List[str]] = None,
                                 client_position: str = "",
                                 opposing_arguments: Optional[str] = None) -> Dict[str, Any]:
        """Analyze a case and predict potential outcomes
        
        Args:
            case_facts: Facts of the case
            legal_issues: List of legal issues involved
            jurisdiction: Jurisdiction for the case
            relevant_statutes: Optional list of relevant statutes
            similar_cases: Optional list of similar case citations
            client_position: Client's position or argument
            opposing_arguments: Optional opposing party's arguments
            
        Returns:
            Predictive analysis with outcome probabilities and recommendations
        """
        # Validate input data
        if not case_facts or not legal_issues or not jurisdiction:
            print("\n--- Predictive Analysis Input Validation Error ---")
            print(f"Case Facts: {bool(case_facts)}")
            print(f"Legal Issues: {bool(legal_issues)}")
            print(f"Jurisdiction: {bool(jurisdiction)}")
            print("--- End of Input Validation ---\n")
            raise ValueError("Missing required input parameters for predictive analysis")
        
        # Log the selected model for this analysis
        print(f"\n--- Predictive Analysis Model: {self.model} ---")
        
        # Create a prompt for the AI to generate predictive analysis
        system_prompt = f"""You are a legal expert specializing in Canadian case outcome prediction.
        Based on the provided case details, predict the likely outcome using similar precedents.
        Analyze the strengths and weaknesses of the case from a legal perspective.
        Consider the jurisdiction, relevant statutes, and similar cases in your analysis.
        Provide a balanced assessment with probability estimates and confidence levels.
        Use a SWOT framework (Strengths, Weaknesses, Opportunities, Threats) for part of your analysis.
        Your analysis should be data-driven, citing relevant precedents and their outcomes.
        
        CRITICAL INSTRUCTIONS:
        1. ALWAYS include ALL sections in your response
        2. Use the EXACT section headers:
           - Case Summary
           - Outcome Prediction
           - Similar Precedents
           - SWOT Analysis
           - Recommended Legal Strategies
           - Alternative Outcomes
        3. Provide detailed, substantive content for EACH section
        4. If any section lacks information, explain why
        """
        
        # Format the legal issues as a string
        legal_issues_str = "\n".join([f"- {issue}" for issue in legal_issues])
        
        # Format relevant statutes if provided
        statutes_str = ""
        if relevant_statutes and len(relevant_statutes) > 0:
            statutes_str = "\nRelevant Statutes:\n" + "\n".join([f"- {statute}" for statute in relevant_statutes])
        
        # Format similar cases if provided
        cases_str = ""
        if similar_cases and len(similar_cases) > 0:
            cases_str = "\nSimilar Cases:\n" + "\n".join([f"- {case}" for case in similar_cases])
        
        # Format opposing arguments if provided
        opposing_str = ""
        if opposing_arguments:
            opposing_str = f"\nOpposing Arguments:\n{opposing_arguments}"
        
        user_prompt = f"""Provide a comprehensive legal analysis for the following case:

Case Summary:
{case_facts}

Legal Issues:
{legal_issues_str}

Jurisdiction: {jurisdiction}{statutes_str}{cases_str}

Client Position:
{client_position}{opposing_str}

DETAILED ANALYSIS REQUIREMENTS:

Outcome Prediction:
- Clearly state the predicted case outcome
- Provide a precise percentage of favorable outcome
- Specify a confidence level (Low/Medium/High)
- Explain the rationale behind the prediction in depth

Similar Precedents:
- List at least 3 relevant past cases
- Explain how each precedent influences the current case
- Highlight key similarities and differences

SWOT Analysis:
- Strengths: Legal advantages in the case
- Weaknesses: Potential legal challenges
- Opportunities: Strategic legal approaches
- Threats: Risks and potential negative outcomes

Recommended Legal Strategies:
- Provide 3-5 specific legal strategies
- Prioritize strategies based on case strengths
- Explain the potential impact of each strategy

Alternative Outcomes:
- Describe at least 2 alternative case scenarios
- Estimate probabilities for each alternative outcome
- Discuss potential implications

IMPORTANT: Ensure your response is comprehensive, well-structured, and provides actionable insights.
"""
        
        # Determine the appropriate model based on case complexity
        try:
            # Assess case complexity to determine the appropriate model
            case_complexity = self._assess_case_complexity(
                case_facts, legal_issues, relevant_statutes, similar_cases
            )
            print(f"Case complexity assessment: {case_complexity}")
            
            # Select model based on complexity
            selected_model = self.model  # Default model
            
            if case_complexity == "high":
                try:
                    # Use complex_reasoning model for high complexity cases
                    selected_model = self.settings.get_model_for_task("complex_reasoning")
                    print(f"Using complex_reasoning model for high complexity case: {selected_model}")
                except Exception as e:
                    print(f"Error selecting complex_reasoning model: {str(e)}")
                    # Fall back to the default model
                    selected_model = self.model
                    print(f"Falling back to default model: {selected_model}")
            
            # Process the prompt through the AI processor with the selected model
            analysis_text = await self.ai_processor.generate_response(
                system_prompt=system_prompt, 
                user_prompt=user_prompt,
                model=selected_model
            )
            
            print("\n--- Predictive Analysis Raw Response ---")
            print(analysis_text)
            print("--- End of Raw Response ---\n")
            
            # Parse the AI response to extract structured data
            # Extract outcome prediction
            favorable_outcome_percentage = self._extract_percentage(analysis_text)
            confidence_level = self._extract_confidence_level(analysis_text)
            prediction_rationale = self._extract_section(analysis_text, "Outcome Prediction", "Similar Precedents")
            
            # Extract similar precedents
            similar_precedents = self._extract_section(analysis_text, "Similar Precedents", "SWOT Analysis")
            
            # Extract SWOT analysis
            swot_analysis = self._extract_section(analysis_text, "SWOT Analysis", "Recommended Legal Strategies")
            
            # Extract recommended strategies
            recommended_strategies = self._extract_section(analysis_text, "Recommended Legal Strategies", "Alternative Outcomes")
            
            # Extract alternative outcomes
            alternative_outcomes = self._extract_section(analysis_text, "Alternative Outcomes")
            
            # Extract case summary
            case_summary = self._extract_section(analysis_text, "Case Summary", "Legal Issues")
            
            # Debugging output for extracted sections
            print("\n--- Extracted Sections Debugging ---")
            print(f"Case Summary: {bool(case_summary)}")
            print(f"Outcome Prediction Rationale: {bool(prediction_rationale)}")
            print(f"Similar Precedents: {bool(similar_precedents)}")
            print(f"SWOT Analysis: {bool(swot_analysis)}")
            print(f"Recommended Strategies: {bool(recommended_strategies)}")
            print(f"Alternative Outcomes: {bool(alternative_outcomes)}")
            print("--- End of Sections Debugging ---\n")
            
            # Create structured response
            return {
                "case_summary": case_summary.strip(),
                "outcome_prediction": {
                    "favorable_percentage": favorable_outcome_percentage,
                    "confidence_level": confidence_level,
                    "rationale": prediction_rationale.strip()
                },
                "similar_precedents": similar_precedents.strip(),
                "swot_analysis": swot_analysis.strip(),
                "recommended_strategies": recommended_strategies.strip(),
                "alternative_outcomes": alternative_outcomes.strip(),
                "disclaimer": "This predictive analysis is AI-generated and should not be considered legal advice. Consult with a qualified legal professional for specific legal guidance."
            }
        except Exception as e:
            # Comprehensive error handling
            print("\n--- Predictive Analysis Parsing Error ---")
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()
            print("--- End of Error ---\n")
            
            # Return a structured error response
            return {
                "raw_analysis": analysis_text,
                "error": str(e),
                "case_summary": "",
                "outcome_prediction": {
                    "favorable_percentage": 50,
                    "confidence_level": "Low",
                    "rationale": f"Analysis parsing failed: {str(e)}"
                },
                "similar_precedents": "",
                "swot_analysis": "",
                "recommended_strategies": "",
                "alternative_outcomes": "",
                "disclaimer": "Analysis generation encountered an error. Please try again or consult a legal professional."
            }
    
    def _extract_percentage(self, text: str) -> float:
        """Extract favorable outcome percentage from text"""
        import re
        match = re.search(r'(\d+(?:\.\d+)?)\s*%\s*favorable\s*outcome', text, re.IGNORECASE)
        return float(match.group(1)) if match else 50.0
    
    def _extract_confidence_level(self, text: str) -> str:
        """Extract confidence level from text"""
        import re
        match = re.search(r'Confidence\s*Level:\s*(\w+)', text, re.IGNORECASE)
        return match.group(1) if match else 'Medium'
    
    def _assess_case_complexity(self, case_facts: str, legal_issues: List[str], relevant_statutes: Optional[List[str]] = None, similar_cases: Optional[List[str]] = None) -> str:
        """Assess the complexity of a case to determine the appropriate model
        
        Args:
            case_facts: Facts of the case
            legal_issues: List of legal issues involved
            relevant_statutes: Optional list of relevant statutes
            similar_cases: Optional list of similar case citations
            
        Returns:
            Complexity level: "low", "medium", or "high"
        """
        # Initialize complexity score
        complexity_score = 0
        
        # Factor 1: Length of case facts
        if len(case_facts) > 2000:
            complexity_score += 3
        elif len(case_facts) > 1000:
            complexity_score += 2
        elif len(case_facts) > 500:
            complexity_score += 1
            
        # Factor 2: Number of legal issues
        if len(legal_issues) > 5:
            complexity_score += 3
        elif len(legal_issues) > 3:
            complexity_score += 2
        elif len(legal_issues) > 1:
            complexity_score += 1
            
        # Factor 3: Number of relevant statutes
        if relevant_statutes and len(relevant_statutes) > 5:
            complexity_score += 3
        elif relevant_statutes and len(relevant_statutes) > 3:
            complexity_score += 2
        elif relevant_statutes and len(relevant_statutes) > 1:
            complexity_score += 1
            
        # Factor 4: Number of similar cases
        if similar_cases and len(similar_cases) > 5:
            complexity_score += 3
        elif similar_cases and len(similar_cases) > 3:
            complexity_score += 2
        elif similar_cases and len(similar_cases) > 1:
            complexity_score += 1
            
        # Determine complexity level based on score
        if complexity_score >= 8:
            return "high"
        elif complexity_score >= 4:
            return "medium"
        else:
            return "low"
    
    def _extract_section(self, text: str, start_section: str, end_section: Optional[str] = None) -> str:
        """Extract a specific section from text with more flexible parsing"""
        import re
        
        # Log the full text for debugging
        print(f"\nExtracting section: {start_section}")
        print("Full Text:")
        print(text)
        
        # Create case-insensitive, flexible patterns
        start_patterns = [
            rf'{start_section}:\s*(.*)',
            rf'(?:^|\n)\s*{start_section}\s*\n(.*)',
            rf'(?:^|\n)\s*{start_section.lower()}\s*\n(.*)',
            rf'(?:^|\n)\s*{start_section.replace(" ", "")}\s*\n(.*)'
        ]
        
        # Try each start pattern
        for pattern_str in start_patterns:
            start_pattern = re.compile(pattern_str, re.DOTALL | re.IGNORECASE)
            start_match = start_pattern.search(text)
            
            if start_match:
                start_index = start_match.end()
                section_text = start_match.group(1).strip()
                
                # If end section is provided, try to find its start
                if end_section:
                    end_patterns = [
                        rf'{end_section}:\s*',
                        rf'(?:^|\n)\s*{end_section}\s*\n',
                        rf'(?:^|\n)\s*{end_section.lower()}\s*\n',
                        rf'(?:^|\n)\s*{end_section.replace(" ", "")}\s*\n'
                    ]
                    
                    for end_pattern_str in end_patterns:
                        end_pattern = re.compile(end_pattern_str, re.DOTALL | re.IGNORECASE)
                        end_match = end_pattern.search(text, start_index)
                        
                        if end_match:
                            section_text = text[start_index:end_match.start()].strip()
                            break
                
                # If section is still empty, try to extract a paragraph
                if not section_text:
                    paragraph_match = re.search(r'(.*?)\n\n', text[start_index:], re.DOTALL)
                    if paragraph_match:
                        section_text = paragraph_match.group(1).strip()
                
                # Log extracted section
                print(f"\nExtracted Section ({start_section}):")
                print(section_text)
                
                return section_text
        
        # Log if no section found
        print(f"\nNo section found for: {start_section}")
        return ""
