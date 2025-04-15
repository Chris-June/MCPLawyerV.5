from typing import List, Dict, Optional, Union, Any, Tuple
from datetime import datetime
import re
import uuid
import json
from fastapi import HTTPException
from enum import Enum

from ..models.contract_analysis_models import (
    ContractClause,
    ClauseCategory,
    RiskLevel,
    ClauseAnalysis,
    ContractSummary,
    ContractAnalysisRequest,
    ContractAnalysisResult,
    ContractComparisonRequest,
    ClauseDifference,
    ContractComparisonResult,
    StandardTemplate,
    TemplateMatch,
    RiskAssessmentSettings
)

from .ai_processor import AIProcessor
from ..config import OpenAIModel
from ..settings import Settings, ModelTaskConfig

class ClauseCategory(Enum):
    TERM = "Term"
    RENT = "Rent"
    SECURITY_DEPOSIT = "Security Deposit"
    MAINTENANCE = "Maintenance"
    ENTRY = "Entry"
    TERMINATION = "Termination"
    GOVERNING_LAW = "Governing Law"
    CONFIDENTIALITY = "Confidentiality"
    INDEMNIFICATION = "Indemnification"
    OTHER = "Other"

class ContractAnalysisService:
    """Service for analyzing legal contracts, extracting clauses, and assessing risks"""
    
    def __init__(self, 
                 ai_processor: AIProcessor, 
                 settings: Settings,
                 risk_settings: Optional[RiskAssessmentSettings] = None
    ):
        """
        Initialize the contract analysis service with advanced configuration.

        This constructor sets up the service with AI processing, model selection,
        and risk assessment configuration. It provides flexibility in model 
        selection and risk assessment parameters.

        Args:
            ai_processor (AIProcessor): Service for processing AI requests.
            settings (Settings): Application settings for model configuration.
            risk_settings (Optional[RiskAssessmentSettings]): Custom risk assessment 
                settings. If not provided, default settings will be used.

        Raises:
            ValueError: If required dependencies are missing or misconfigured.
            ConfigurationError: If model selection fails or settings are invalid.

        Example:
            >>> service = ContractAnalysisService(
            ...     ai_processor=ai_processor, 
            ...     settings=app_settings,
            ...     risk_settings=custom_risk_settings
            ... )
        """
        # Set core dependencies
        self.ai_processor = ai_processor
        self.settings = settings
        
        # Advanced model selection with fallback and logging
        try:
            # Contract analysis requires legal expertise, so use legal_analysis model
            self.model = settings.get_model_for_task("legal_analysis")
            print(f"\n--- Contract Analysis Service Model Selection ---")
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
                    self.model = ModelTaskConfig.DEFAULT_MODELS["reasoning"]
                    print(f"Final fallback model: {self.model}")
        
        # Configure risk assessment settings
        self.default_risk_settings = risk_settings or RiskAssessmentSettings(
            jurisdiction="Canada",
            risk_weights={
                ClauseCategory.TERM: 1.5,
                ClauseCategory.RENT: 1.5,
                ClauseCategory.SECURITY_DEPOSIT: 1.2,
                ClauseCategory.MAINTENANCE: 1.0,
                ClauseCategory.ENTRY: 1.3,
                ClauseCategory.TERMINATION: 1.0,
                ClauseCategory.GOVERNING_LAW: 1.0,
                ClauseCategory.CONFIDENTIALITY: 1.2,
                ClauseCategory.INDEMNIFICATION: 1.3,
                ClauseCategory.OTHER: 1.0,
            }
        )
        
        # Initialize template storage with advanced configuration
        self.standard_templates: Dict[str, StandardTemplate] = {}
        
        # Logging configuration details
        print(f"\n--- Contract Analysis Service Configuration ---")
        print(f"Jurisdiction: {self.default_risk_settings.jurisdiction}")
        print(f"Total Risk Categories: {len(self.default_risk_settings.risk_weights)}")
        
        # Optional telemetry or monitoring setup
        self._log_service_initialization()
    
    async def analyze_contract(self, request: ContractAnalysisRequest) -> ContractAnalysisResult:
        """Analyze a contract and return a detailed analysis result"""
        # Log the selected model for this analysis
        print(f"\n--- Contract Analysis Model: {self.model} ---")
        
        # Extract clauses from the contract text
        clauses = await self._extract_clauses(request.contract_text)
        
        # Analyze each clause for risks and other insights
        clause_analyses = []
        for clause in clauses:
            analysis = await self._analyze_clause(clause, request.jurisdiction)
            clause_analyses.append(analysis)
            
            # If template comparison is requested, add that information
            if request.comparison_template_ids:
                template_matches = await self._compare_to_templates(
                    clause, request.comparison_template_ids
                )
                analysis.template_matches = template_matches
        
        # Generate an overall summary and risk assessment
        summary = await self._generate_summary(request, clauses)
        overall_risk, explanation, score = await self._assess_overall_risk(clause_analyses)
        recommendations = await self._generate_recommendations(clause_analyses, summary)
        
        # Assemble the final result
        result = ContractAnalysisResult(
            summary=summary,
            clauses=clause_analyses,
            overall_risk_level=overall_risk,
            overall_risk_explanation=explanation,
            overall_score=score,
            recommendations=recommendations,
            metadata={
                "contract_type": request.contract_type or "Unknown",
                "jurisdiction": request.jurisdiction or "Unknown",
                "analysis_version": "1.0",
                "model_used": self.model
            }
        )
        
        return result
    
    async def compare_contracts(self, request: ContractComparisonRequest) -> ContractComparisonResult:
        """Compare two contracts and identify significant differences"""
        # Log the selected model for this analysis
        print(f"\n--- Contract Comparison Model: {self.model} ---")
        
        # Extract clauses from both contracts
        clauses_a = await self._extract_clauses(request.contract_a_text)
        clauses_b = await self._extract_clauses(request.contract_b_text)
        
        # Group clauses by category for easier comparison
        grouped_a = self._group_clauses_by_category(clauses_a)
        grouped_b = self._group_clauses_by_category(clauses_b)
        
        # Identify unique categories
        unique_to_a = [cat for cat in grouped_a.keys() if cat not in grouped_b]
        unique_to_b = [cat for cat in grouped_b.keys() if cat not in grouped_a]
        
        # Compare clauses
        differences = []
        for category, clause_a in grouped_a.items():
            if category in grouped_b:
                clause_b = grouped_b[category]
                difference = await self._analyze_difference(clause_a, clause_b)
                differences.append(difference)
        
        # Generate overall recommendation
        recommendation = await self._generate_comparison_recommendation(
            differences, unique_to_a, unique_to_b
        )
        
        # Assemble the final comparison result
        result = ContractComparisonResult(
            differences=differences,
            unique_to_a=[cat.value for cat in unique_to_a],
            unique_to_b=[cat.value for cat in unique_to_b],
            recommendation=recommendation,
            metadata={
                "comparison_version": "1.0",
                "model_used": self.model
            }
        )
        
        return result
        
    async def _extract_clauses(self, contract_text: str) -> List[ContractClause]:
        """
        Extract significant clauses from the contract text.
        
        Utilize AI to break down the contract into meaningful, structured clauses.
        Ensure comprehensive coverage of all significant clauses in the contract.
        """
        # Validate input
        if not contract_text or len(contract_text.strip()) < 50:
            print("Warning: Contract text is too short for meaningful analysis")
            return []
        
        # Prepare the system and user prompts for clause extraction
        system_prompt = """
        You are a legal AI assistant specializing in contract analysis. 
        Your task is to extract and categorize significant clauses from a legal contract.
        
        Requirements for Clause Extraction:
        1. Identify and categorize each significant clause
        2. Provide a clear, concise title for each clause
        3. Include the full text of the clause
        4. Offer a brief explanation of the clause's purpose and implications
        
        Output Format (Strict JSON):
        [
            {
                "category": "string", // e.g., "Indemnification", "Termination", "Confidentiality"
                "title": "string", // Short, descriptive title
                "text": "string", // Full text of the clause
                "explanation": "string" // Brief explanation of the clause
            },
            ...
        ]
        
        Be precise, comprehensive, and ensure the JSON is valid.
        If no significant clauses are found, return an empty array.
        """
        
        user_prompt = f"""
        Please extract and categorize the clauses from the following contract text:

        ```
        {contract_text}
        ```

        Ensure you cover all significant clauses and provide a comprehensive analysis.
        If the text is too short or not a valid contract, return an empty JSON array.
        """
        
        try:
            # Extract clauses using the selected model
            ai_response = await self.ai_processor.generate_response(
                system_prompt, 
                user_prompt, 
                model=self.model,
                task_category="legal_analysis",
                max_tokens=2000  # Increase token limit for complex contracts
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
            
            # Validate JSON response
            try:
                clauses_data = json.loads(ai_response)
            except json.JSONDecodeError:
                print(f"Invalid JSON response: {ai_response}")
                # Attempt to fix common JSON formatting issues
                try:
                    # Remove any leading/trailing whitespace
                    ai_response = ai_response.strip()
                    # Add missing brackets if needed
                    if not ai_response.startswith('['):
                        ai_response = f'[{ai_response}]'
                    if not ai_response.endswith(']'):
                        ai_response = f'{ai_response}]'
                    clauses_data = json.loads(ai_response)
                except Exception as fix_err:
                    print(f"Failed to fix JSON: {fix_err}")
                    # Return an empty list if JSON cannot be parsed
                    return []
            
            # Validate clause data structure
            if not isinstance(clauses_data, list):
                print(f"Invalid clause data type: {type(clauses_data)}")
                return []
            
            # Convert to ContractClause objects
            extracted_clauses = []
            for q in clauses_data:
                try:
                    # Validate each clause has required fields
                    if not all(key in q for key in ['category', 'title', 'text']):
                        print(f"Skipping invalid clause: {q}")
                        continue
                    
                    # Map category to ClauseCategory, defaulting to OTHER if not found
                    try:
                        category = ClauseCategory(q['category'])
                    except ValueError:
                        print(f"Unmapped category: {q['category']}, using OTHER")
                        category = ClauseCategory.OTHER
                    
                    extracted_clauses.append(
                        ContractClause(
                            category=category,
                            title=q['title'],
                            text=q['text'],
                            explanation=q.get('explanation', '')
                        )
                    )
                except Exception as clause_err:
                    print(f"Error processing clause: {clause_err}")
            
            # Log extraction results
            print(f"\n--- Clause Extraction Results ---")
            print(f"Total clauses extracted: {len(extracted_clauses)}")
            
            return extracted_clauses
        
        except json.JSONDecodeError as json_err:
            # Log detailed JSON parsing error
            print(f"JSON Parsing Error in Clause Extraction: {json_err}")
            print(f"Problematic AI Response: {ai_response}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI-generated clause extraction: {str(json_err)}"
            )
        
        except Exception as e:
            # Comprehensive error logging
            print(f"Error extracting contract clauses: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to extract contract clauses: {str(e)}"
            )

    async def _analyze_clause(self, clause: ContractClause, jurisdiction: Optional[str] = None) -> ClauseAnalysis:
        """Analyze a specific contract clause for risks and alternative wording"""
        # Log the selected model for this analysis
        print(f"\n--- Contract Clause Analysis Model: {self.model} ---")
        
        # Prepare prompt for clause analysis
        prompt = f"""Analyze the following {clause.category.value} contract clause:

Clause Text:
{clause.text}

{f'Jurisdiction: {jurisdiction}' if jurisdiction else 'No specific jurisdiction provided'}

Analysis Requirements:
1. Identify potential legal risks
2. Assess the clause's standard compliance
3. Suggest alternative wording to mitigate risks
4. Provide a risk assessment

Format the response as a structured JSON object:
{{
    "risk_level": "NO_RISK|LOW_RISK|MEDIUM_RISK|HIGH_RISK|CRITICAL_RISK",
    "risk_explanation": "Detailed explanation of identified risks",
    "compliance_assessment": {{
        "is_standard_compliant": true/false,
        "non_compliance_details": "Explanation of non-standard elements"
    }},
    "suggested_alternatives": [
        {{
            "alternative_text": "Proposed alternative clause wording",
            "rationale": "Why this alternative is recommended"
        }}
    ],
    "key_recommendations": [
        "Specific actionable recommendations for the clause"
    ]
}}
"""
        
        try:
            # Analyze clause using the selected model
            ai_response = await self.ai_processor.process_text(
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
            
            # Convert to ClauseAnalysis object
            clause_analysis = ClauseAnalysis(
                clause=clause,
                risk_level=RiskLevel(analysis_data['risk_level']),
                risk_explanation=analysis_data['risk_explanation'],
                compliance_assessment=analysis_data['compliance_assessment'],
                suggested_alternatives=[
                    SuggestedAlternative(**alt) for alt in analysis_data['suggested_alternatives']
                ],
                key_recommendations=analysis_data['key_recommendations']
            )
            
            return clause_analysis
        
        except json.JSONDecodeError as json_err:
            # Log detailed JSON parsing error
            print(f"JSON Parsing Error in Clause Analysis: {json_err}")
            print(f"Problematic AI Response: {ai_response}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI-generated clause analysis: {str(json_err)}"
            )
        
        except Exception as e:
            # Comprehensive error logging
            print(f"Error analyzing contract clause: {e}")
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to analyze contract clause: {str(e)}"
            )
    
    async def _compare_to_templates(self, clause: ContractClause, template_ids: List[str]) -> List[TemplateMatch]:
        """Compare a clause to standard templates"""
        matches = []
        
        for template_id in template_ids:
            if template_id not in self.standard_templates:
                continue
                
            template = self.standard_templates[template_id]
            
            # Only compare if the template has a clause of the same category
            if clause.category not in template.clauses:
                continue
                
            template_clause_text = template.clauses[clause.category]
            
            # Use AI to compare the clauses and generate a similarity score
            prompt = f"""
            Compare these two {clause.category.value} clauses and determine their similarity on a scale of 0.0 to 1.0:
            
            Clause 1:
            {clause.text}
            
            Standard Template Clause:
            {template_clause_text}
            
            Provide:
            1. A similarity score between 0.0 and 1.0 (where 1.0 is identical)
            2. A brief explanation of key differences
            """
            
            result = await self.ai_processor.process_text(prompt, model=self.model)
            
            # Parse the similarity score - in a production environment, would use more robust parsing
            similarity_score = 0.5  # Default if parsing fails
            differences = "Unknown differences"
            
            # Attempt to extract the similarity score using regex
            score_match = re.search(r'similarity score[:\s]*([0-9]\.[0-9])', result, re.IGNORECASE)
            if score_match:
                try:
                    similarity_score = float(score_match.group(1))
                except ValueError:
                    pass
            
            # Extract differences explanation
            explanation_parts = result.split("\n\n")
            for part in explanation_parts:
                if "differences" in part.lower():
                    differences = part
                    break
            
            matches.append(TemplateMatch(
                template_id=template_id,
                template_name=template.name,
                similarity_score=similarity_score,
                differences=differences
            ))
        
        return matches
    
    async def _generate_summary(self, request: ContractAnalysisRequest, clauses: List[ContractClause]) -> ContractSummary:
        """Generate a summary of the contract"""
        contract_text = request.contract_text
        
        # Use AI to extract summary information
        prompt = f"""
        As a legal expert, provide a summary of this contract:
        
        {contract_text[:5000]}...  # Truncated for API limits
        
        Extract:
        1. Contract title/type
        2. All parties involved
        3. Effective date (if available)
        4. Termination date (if available)
        5. 3-5 key points of the agreement
        6. Any important clauses that appear to be missing
        """
        
        result = await self.ai_processor.process_text(prompt, model=self.model)
        
        # Parse the summary information - in a production environment, would use more structured parsing
        title = request.contract_name or "Unnamed Contract"
        contract_type = request.contract_type or "General Contract"
        parties = []
        effective_date = None
        termination_date = None
        key_points = []
        missing_clauses = []
        
        # Simple parsing of the AI response
        if "Contract title" in result or "Title" in result:
            parts = result.split("\n\n")
            for part in parts:
                if "Contract title" in part or "Title" in part:
                    title_line = next((line for line in part.split("\n") if ":" in line), None)
                    if title_line:
                        title = title_line.split(":", 1)[1].strip()
                
                if "Contract type" in part or "Type" in part:
                    type_line = next((line for line in part.split("\n") if ":" in line), None)
                    if type_line:
                        contract_type = type_line.split(":", 1)[1].strip()
                
                if "Parties" in part:
                    parties_text = part.split("Parties:", 1)[1].strip() if "Parties:" in part else ""
                    parties = [p.strip() for p in parties_text.split("\n") if p.strip()]
                
                if "Key points" in part:
                    key_points_text = part.split("Key points:", 1)[1].strip() if "Key points:" in part else ""
                    key_points = [p.strip().strip('-').strip() for p in key_points_text.split("\n") if p.strip()]
                
                if "Missing clauses" in part:
                    missing_text = part.split("Missing clauses:", 1)[1].strip() if "Missing clauses:" in part else ""
                    missing_clauses = [p.strip().strip('-').strip() for p in missing_text.split("\n") if p.strip()]
        
        # Attempt to parse dates
        date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\w+ \d{1,2},? \d{4})\b'
        if "Effective date" in result:
            effective_dates = re.findall(date_pattern, result.split("Effective date", 1)[1].split("\n", 1)[0])
            if effective_dates:
                try:
                    # In a real implementation, would use a proper date parser
                    effective_date = datetime.now()  # Placeholder
                except:
                    pass
        
        if "Termination date" in result:
            termination_dates = re.findall(date_pattern, result.split("Termination date", 1)[1].split("\n", 1)[0])
            if termination_dates:
                try:
                    # In a real implementation, would use a proper date parser
                    termination_date = datetime.now()  # Placeholder
                except:
                    pass
        
        return ContractSummary(
            title=title,
            contract_type=contract_type,
            parties=parties if parties else ["Unknown"],
            effective_date=effective_date,
            termination_date=termination_date,
            key_points=key_points,
            missing_clauses=missing_clauses
        )
        
    async def _assess_overall_risk(self, clause_analyses: List[ClauseAnalysis]) -> Tuple[RiskLevel, str, int]:
        """Assess the overall risk level of a contract based on its clauses"""
        # Log the selected model for this analysis
        print(f"\n--- Contract Overall Risk Assessment Model: {self.model} ---")
        
        # Count the occurrences of each risk level
        risk_counts = {
            RiskLevel.NO_RISK: 0,
            RiskLevel.LOW_RISK: 0,
            RiskLevel.MEDIUM_RISK: 0,
            RiskLevel.HIGH_RISK: 0,
            RiskLevel.CRITICAL_RISK: 0
        }
        
        # Weighted risk factors for different categories
        category_weights = self.default_risk_settings.risk_weights
        
        # Calculate weighted risk scores
        total_weighted_risk = 0
        total_weight = 0
        
        for analysis in clause_analyses:
            clause = analysis.clause
            weight = category_weights.get(clause.category, 1.0)
            
            # Increment risk level count
            risk_counts[analysis.risk_level] += 1
            
            # Calculate weighted risk score
            risk_multiplier = {
                RiskLevel.NO_RISK: 0,
                RiskLevel.LOW_RISK: 1,
                RiskLevel.MEDIUM_RISK: 2,
                RiskLevel.HIGH_RISK: 3,
                RiskLevel.CRITICAL_RISK: 4
            }[analysis.risk_level]
            
            total_weighted_risk += risk_multiplier * weight
            total_weight += weight
        
        # Calculate overall risk score
        if total_weight > 0:
            risk_score = int((total_weighted_risk / total_weight) * 25)  # Scale to 0-100
        else:
            risk_score = 0
        
        # Prepare prompt for AI-enhanced risk assessment
        prompt = f"""Provide a comprehensive risk assessment for a contract based on the following analysis:

Risk Level Distribution:
- No Risk Clauses: {risk_counts[RiskLevel.NO_RISK]}
- Low Risk Clauses: {risk_counts[RiskLevel.LOW_RISK]}
- Medium Risk Clauses: {risk_counts[RiskLevel.MEDIUM_RISK]}
- High Risk Clauses: {risk_counts[RiskLevel.HIGH_RISK]}
- Critical Risk Clauses: {risk_counts[RiskLevel.CRITICAL_RISK]}

Calculated Risk Score: {risk_score}/100

Requirements for risk assessment:
1. Provide an overall risk level interpretation
2. Explain the key factors contributing to the risk assessment
3. Suggest high-level mitigation strategies
4. Highlight any immediate concerns

Format the response as a structured JSON object:
{{
    "overall_risk_level": "NO_RISK|LOW_RISK|MEDIUM_RISK|HIGH_RISK|CRITICAL_RISK",
    "risk_explanation": "Detailed explanation of the risk assessment",
    "key_risk_factors": [
        {{
            "category": "Clause category",
            "risk_contribution": "How this category impacts overall risk"
        }}
    ],
    "mitigation_strategies": [
        "High-level recommendations to reduce contract risk"
    ],
    "immediate_concerns": [
        "Critical issues that require immediate attention"
    ]
}}
"""
        
        try:
            # Use AI to provide enhanced risk assessment
            ai_response = await self.ai_processor.process_text(
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
            
            # Parse the AI-enhanced risk assessment
            risk_assessment = json.loads(ai_response)
            
            # Determine overall risk level
            overall_risk_level = RiskLevel(risk_assessment.get('overall_risk_level', 'MEDIUM_RISK'))
            risk_explanation = risk_assessment.get('risk_explanation', 
                f"Contract risk assessment based on {len(clause_analyses)} clauses. "
                f"Risk score: {risk_score}/100"
            )
            
            return overall_risk_level, risk_explanation, risk_score
        
        except json.JSONDecodeError as json_err:
            # Fallback to calculated risk if AI processing fails
            print(f"JSON Parsing Error in Risk Assessment: {json_err}")
            print(f"Problematic AI Response: {ai_response}")
            
            # Determine risk level based on calculated score
            if risk_score <= 20:
                overall_risk_level = RiskLevel.NO_RISK
                risk_explanation = "Low overall risk. Most clauses appear standard and well-structured."
            elif risk_score <= 40:
                overall_risk_level = RiskLevel.LOW_RISK
                risk_explanation = "Minor risks identified. Recommended to review specific clauses."
            elif risk_score <= 60:
                overall_risk_level = RiskLevel.MEDIUM_RISK
                risk_explanation = "Moderate risks present. Careful review and potential negotiation advised."
            elif risk_score <= 80:
                overall_risk_level = RiskLevel.HIGH_RISK
                risk_explanation = "Significant risks identified. Substantial revisions or legal consultation recommended."
            else:
                overall_risk_level = RiskLevel.CRITICAL_RISK
                risk_explanation = "Severe risks detected. Strongly advise comprehensive legal review before proceeding."
            
            return overall_risk_level, risk_explanation, risk_score
        
        except Exception as e:
            # Comprehensive error logging
            print(f"Error assessing contract risk: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback to calculated risk
            if risk_score <= 20:
                overall_risk_level = RiskLevel.NO_RISK
                risk_explanation = "Low overall risk. Most clauses appear standard and well-structured."
            elif risk_score <= 40:
                overall_risk_level = RiskLevel.LOW_RISK
                risk_explanation = "Minor risks identified. Recommended to review specific clauses."
            elif risk_score <= 60:
                overall_risk_level = RiskLevel.MEDIUM_RISK
                risk_explanation = "Moderate risks present. Careful review and potential negotiation advised."
            elif risk_score <= 80:
                overall_risk_level = RiskLevel.HIGH_RISK
                risk_explanation = "Significant risks identified. Substantial revisions or legal consultation recommended."
            else:
                overall_risk_level = RiskLevel.CRITICAL_RISK
                risk_explanation = "Severe risks detected. Strongly advise comprehensive legal review before proceeding."
            
            return overall_risk_level, risk_explanation, risk_score
    
    async def _generate_recommendations(self, clause_analyses: List[ClauseAnalysis], summary: ContractSummary) -> List[str]:
        """Generate recommendations for improving the contract"""
        recommendations = []
        
        # Add recommendations for high-risk clauses
        for analysis in clause_analyses:
            if analysis.clause.risk_level in [RiskLevel.HIGH_RISK, RiskLevel.CRITICAL_RISK]:
                if analysis.alternative_wording:
                    recommendations.append(f"Revise the {analysis.clause.title} clause with more favorable language.")
                else:
                    recommendations.append(f"Review and potentially renegotiate the {analysis.clause.title} clause.")
        
        # Add recommendations for missing clauses
        for missing in summary.missing_clauses:
            recommendations.append(f"Add a missing {missing} clause to the contract.")
        
        # If there are no specific recommendations, add a general one
        if not recommendations:
            recommendations.append("This contract appears to have reasonable terms, but a thorough review by qualified legal counsel is always recommended.")
        
        return recommendations
    
    def _group_clauses_by_category(self, clauses: List[ContractClause]) -> Dict[ClauseCategory, ContractClause]:
        """Group clauses by their category for easier comparison"""
        result = {}
        for clause in clauses:
            # If multiple clauses have the same category, keep the last one for simplicity
            # In a real implementation, might want to merge them or handle differently
            result[clause.category] = clause
        return result
    
    async def _analyze_difference(self, clause_a: ContractClause, clause_b: ContractClause) -> ClauseDifference:
        """Analyze the difference between two clauses"""
        # Log the selected model for this analysis
        print(f"\n--- Clause Difference Analysis Model: {self.model} ---")
        
        # Prepare prompt for comprehensive clause difference analysis
        prompt = f"""Compare these two {clause_a.category.value} clauses and provide a detailed analysis:
        
Clause A:
{clause_a.text}

Clause B:
{clause_b.text}

Analysis Requirements:
1. Determine the significance level of differences
2. Provide detailed legal implications
3. Suggest potential impact on contract interpretation
4. Recommend mitigation strategies

Format the response as a structured JSON object:
{{
    "significance_level": "NO_RISK|LOW_RISK|MEDIUM_RISK|HIGH_RISK|CRITICAL_RISK",
    "legal_implications": "Detailed explanation of how differences affect legal rights and obligations",
    "key_differences": [
        {{
            "aspect": "Specific legal aspect",
            "clause_a_interpretation": "How Clause A interprets this aspect",
            "clause_b_interpretation": "How Clause B interprets this aspect",
            "potential_impact": "Potential legal consequences of the difference"
        }}
    ],
    "mitigation_strategies": [
        "Recommendations to address or reconcile the differences"
    ]
}}
"""
        
        try:
            # Analyze clause differences using the selected model
            ai_response = await self.ai_processor.process_text(
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
            
            # Parse the AI-generated difference analysis
            difference_analysis = json.loads(ai_response)
            
            # Determine significance level
            significance = RiskLevel(difference_analysis.get(
                'significance_level', 
                RiskLevel.MEDIUM_RISK.value
            ))
            
            # Prepare explanation
            explanation = difference_analysis.get(
                'legal_implications', 
                "There are notable differences between these clauses that may affect legal rights and obligations."
            )
            
            # Extract key differences with robust parsing
            key_differences = []
            raw_differences = difference_analysis.get('key_differences', [])
            for diff in raw_differences:
                try:
                    key_differences.append({
                        'aspect': diff.get('aspect', 'Unspecified Aspect'),
                        'clause_a_interpretation': diff.get('clause_a_interpretation', 'No specific interpretation'),
                        'clause_b_interpretation': diff.get('clause_b_interpretation', 'No specific interpretation'),
                        'potential_impact': diff.get('potential_impact', 'Impact not clearly defined')
                    })
                except Exception as parse_err:
                    print(f"Error parsing key difference: {parse_err}")
            
            # Prepare mitigation strategies
            mitigation_strategies = difference_analysis.get('mitigation_strategies', [])
            
            # Create and return ClauseDifference object
            return ClauseDifference(
                clause_a=clause_a,
                clause_b=clause_b,
                significance=significance,
                explanation=explanation,
                key_differences=key_differences,
                mitigation_strategies=mitigation_strategies
            )
        
        except json.JSONDecodeError as json_err:
            # Fallback parsing if AI response is not JSON
            print(f"JSON Parsing Error in Clause Difference Analysis: {json_err}")
            print(f"Problematic AI Response: {ai_response}")
            
            # Attempt to extract significance level from text
            significance = RiskLevel.MEDIUM_RISK
            for risk_level in RiskLevel:
                if risk_level.value in ai_response.lower():
                    significance = risk_level
                    break
            
            # Basic explanation extraction
            explanation = "There are notable differences between these clauses that may affect legal rights and obligations."
            
            # Try to find explanation in the response
            try:
                explanation_match = re.search(r'(legal implications?:?\s*)(.*)', ai_response, re.IGNORECASE | re.DOTALL)
                if explanation_match:
                    explanation = explanation_match.group(2).strip()
            except Exception:
                pass
            
            return ClauseDifference(
                clause_a=clause_a,
                clause_b=clause_b,
                significance=significance,
                explanation=explanation,
                key_differences=[],
                mitigation_strategies=[]
            )
        
        except Exception as e:
            # Comprehensive error logging
            print(f"Error analyzing clause differences: {e}")
            import traceback
            traceback.print_exc()
            
            # Attempt to extract some meaningful information
            try:
                # Try to extract partial information from the response
                significance = next(
                    (risk_level for risk_level in RiskLevel 
                     if risk_level.value in str(e).lower()), 
                    RiskLevel.MEDIUM_RISK
                )
                
                # Try to extract a meaningful explanation
                explanation_match = re.search(
                    r'(legal implications?:?\s*)(.*)', 
                    str(e), 
                    re.IGNORECASE | re.DOTALL
                )
                explanation = (
                    explanation_match.group(2).strip() 
                    if explanation_match 
                    else "Unable to fully analyze clause differences."
                )
            except Exception:
                # Absolute fallback
                significance = RiskLevel.MEDIUM_RISK
                explanation = "Unable to fully analyze clause differences. Manual review recommended."
            
            # Default fallback
            return ClauseDifference(
                clause_a=clause_a,
                clause_b=clause_b,
                significance=significance,
                explanation=explanation,
                key_differences=[],
                mitigation_strategies=[]
            )
    
    async def _generate_comparison_recommendation(self, differences: List[ClauseDifference], 
                                               unique_to_a: List[ClauseCategory], 
                                               unique_to_b: List[ClauseCategory]) -> str:
        """Generate comprehensive recommendations for contract comparison"""
        # Log the selected model for this analysis
        print(f"\n--- Contract Comparison Recommendation Model: {self.model} ---")
        
        # Prepare prompt for AI-enhanced recommendation generation
        prompt = f"""Analyze the following contract comparison details and generate a comprehensive recommendation:

Clause Differences:
{json.dumps([{
    'category': d.clause_a.category.value,
    'significance': d.significance.value,
    'explanation': d.explanation
} for d in differences], indent=2)}

Unique Clauses:
- Unique to Contract A: {[c.value for c in unique_to_a]}
- Unique to Contract B: {[c.value for c in unique_to_b]}

Analysis Requirements:
1. Identify and prioritize significant differences
2. Provide context for unique clauses
3. Suggest overall comparison insights
4. Recommend next steps for legal review

Format the response as a structured JSON object:
{{
    "overall_comparison_summary": "Brief summary of contract comparison",
    "high_risk_differences": [
        {{
            "category": "Clause category",
            "significance": "Risk level",
            "recommendation": "Specific advice for this difference"
        }}
    ],
    "unique_clause_insights": [
        {{
            "contract": "A or B",
            "category": "Clause category",
            "potential_impact": "Explanation of the unique clause's significance"
        }}
    ],
    "recommended_actions": [
        "Specific steps for legal review and potential negotiation"
    ],
    "overall_recommendation": "Concise recommendation for contract comparison"
}}
"""
        
        try:
            # Generate AI-powered recommendation
            ai_response = await self.ai_processor.process_text(
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
            
            # Parse the AI-generated recommendation
            recommendation_analysis = json.loads(ai_response)
            
            # Prepare recommendation parts
            recommendation_parts = []
            
            # Overall comparison summary
            overall_summary = recommendation_analysis.get(
                'overall_comparison_summary', 
                "Comprehensive contract comparison analysis."
            )
            recommendation_parts.append(overall_summary)
            
            # High-risk differences
            high_risk_differences = recommendation_analysis.get('high_risk_differences', [])
            if high_risk_differences:
                high_risk_msg = "Critical differences identified: " + "; ".join([
                    f"{diff.get('category')} ({diff.get('significance')}) - {diff.get('recommendation')}" 
                    for diff in high_risk_differences
                ])
                recommendation_parts.append(high_risk_msg)
            
            # Unique clause insights
            unique_clause_insights = recommendation_analysis.get('unique_clause_insights', [])
            if unique_clause_insights:
                unique_clauses_msg = "Unique clause insights: " + "; ".join([
                    f"{insight.get('contract')} contract - {insight.get('category')}: {insight.get('potential_impact')}"
                    for insight in unique_clause_insights
                ])
                recommendation_parts.append(unique_clauses_msg)
            
            # Recommended actions
            recommended_actions = recommendation_analysis.get('recommended_actions', [])
            if recommended_actions:
                actions_msg = "Recommended actions: " + "; ".join(recommended_actions)
                recommendation_parts.append(actions_msg)
            
            # Fallback to traditional analysis if AI insights are insufficient
            if len(recommendation_parts) < 2:
                # Traditional analysis as fallback
                high_risk_differences = [d for d in differences if d.significance in [RiskLevel.HIGH_RISK, RiskLevel.CRITICAL_RISK]]
                
                if high_risk_differences:
                    high_risk_categories = [d.clause_a.category.value for d in high_risk_differences]
                    recommendation_parts.append(f"Pay close attention to significant differences in the following clauses: {', '.join(high_risk_categories)}.")
                
                if unique_to_a:
                    unique_a_values = [c.value for c in unique_to_a]
                    recommendation_parts.append(f"Contract A contains these clauses not found in Contract B: {', '.join(unique_a_values)}.")
                    
                if unique_to_b:
                    unique_b_values = [c.value for c in unique_to_b]
                    recommendation_parts.append(f"Contract B contains these clauses not found in Contract A: {', '.join(unique_b_values)}.")
            
            # Overall recommendation
            overall_recommendation = recommendation_analysis.get(
                'overall_recommendation', 
                "For a complete legal assessment, consult with qualified legal counsel in the relevant jurisdiction."
            )
            recommendation_parts.append(overall_recommendation)
            
            return " ".join(recommendation_parts)
        
        except json.JSONDecodeError as json_err:
            # Fallback to traditional analysis
            print(f"JSON Parsing Error in Comparison Recommendation: {json_err}")
            print(f"Problematic AI Response: {ai_response}")
            
            recommendation_parts = []
            
            high_risk_differences = [d for d in differences if d.significance in [RiskLevel.HIGH_RISK, RiskLevel.CRITICAL_RISK]]
            
            if high_risk_differences:
                high_risk_categories = [d.clause_a.category.value for d in high_risk_differences]
                recommendation_parts.append(f"Pay close attention to significant differences in the following clauses: {', '.join(high_risk_categories)}.")
            
            if unique_to_a:
                unique_a_values = [c.value for c in unique_to_a]
                recommendation_parts.append(f"Contract A contains these clauses not found in Contract B: {', '.join(unique_a_values)}.")
                
            if unique_to_b:
                unique_b_values = [c.value for c in unique_to_b]
                recommendation_parts.append(f"Contract B contains these clauses not found in Contract A: {', '.join(unique_b_values)}.")
            
            if not recommendation_parts:
                recommendation_parts.append("Both contracts are substantially similar in their legal provisions.")
                
            recommendation_parts.append("For a complete legal assessment, consult with qualified legal counsel in the relevant jurisdiction.")
            
            return " ".join(recommendation_parts)
        
        except Exception as e:
            # Comprehensive error logging
            print(f"Error generating comparison recommendation: {e}")
            import traceback
            traceback.print_exc()
            
            # Absolute fallback
            recommendation_parts = [
                "Unable to generate comprehensive contract comparison.",
                "For a complete legal assessment, consult with qualified legal counsel in the relevant jurisdiction."
            ]
            
            return " ".join(recommendation_parts)
    
    def _log_service_initialization(self) -> None:
        """
        Log detailed service initialization information for monitoring and debugging.

        This method provides comprehensive logging about the service's configuration,
        helping with troubleshooting and understanding the service's current state.

        Logs include:
        - Model information
        - Risk assessment configuration
        - Initialization timestamp
        - Environment details
        """
        try:
            # Detailed model logging
            print(f"\n--- Contract Analysis Service Telemetry ---")
            print(f"Initialization Timestamp: {datetime.now().isoformat()}")
            print(f"Model Details:")
            print(f"  - Selected Model: {self.model}")
            print(f"  - Task Category: legal_analysis")
            
            # Risk assessment logging
            print(f"Risk Assessment Configuration:")
            print(f"  - Jurisdiction: {self.default_risk_settings.jurisdiction}")
            print(f"  - Risk Categories: {len(self.default_risk_settings.risk_weights)}")
            
            # High-risk categories identification
            high_risk_categories = [
                category for category in self.default_risk_settings.high_risk_categories
            ]
            print(f"  - High-Risk Categories: {', '.join(high_risk_categories)}")
            
            # Environment context
            print(f"Environment Context:")
            print(f"  - AI Processor: {type(self.ai_processor).__name__}")
            print(f"  - Settings Source: {type(self.settings).__name__}")
            
        except Exception as e:
            print(f"Error during service initialization logging: {e}")
            import traceback
            traceback.print_exc()
    
    async def add_template(self, template: StandardTemplate) -> str:
        """
        Add a standard template for contract comparison
        
        Args:
            template (StandardTemplate): The template to be added
        
        Returns:
            str: The ID of the added template
        
        Raises:
            ValueError: If the template is invalid or missing critical information
        """
        # Validate template before adding
        if not template:
            raise ValueError("Cannot add empty template")
        
        if not template.id:
            # Generate a unique ID if not provided
            template.id = str(uuid.uuid4())
        
        # Validate template contents
        if not template.name:
            raise ValueError(f"Template {template.id} must have a name")
        
        if not template.clauses or len(template.clauses) == 0:
            raise ValueError(f"Template {template.id} must contain at least one clause")
        
        # Optional: AI-powered template enhancement
        try:
            # Prepare prompt for template validation and enhancement
            def safe_serialize_clause(clause):
                """Safely serialize a clause for JSON encoding"""
                try:
                    return {
                        'category': clause.category.value,
                        'title': clause.title or 'Untitled Clause',
                        'text': (clause.text[:200] + '...' if len(clause.text) > 200 else clause.text) 
                               if clause.text else 'Empty Clause',
                        'risk_level': getattr(clause, 'risk_level', 'UNASSESSED').value if hasattr(clause, 'risk_level') else 'UNASSESSED'
                    }
                except Exception as e:
                    print(f"Error serializing clause: {e}")
                    return {
                        'category': 'UNKNOWN',
                        'title': 'Serialization Error',
                        'text': 'Could not serialize clause',
                        'risk_level': 'ERROR'
                    }

            # Safely serialize clauses
            serialized_clauses = []
            for clause in template.clauses:
                try:
                    serialized_clause = safe_serialize_clause(clause)
                    serialized_clauses.append(serialized_clause)
                except Exception as e:
                    print(f"Clause serialization error: {e}")
            
            # Prepare prompt with safely serialized clauses
            prompt = f"""Analyze and validate the following contract template:

Template Metadata:
- Name: {template.name}
- ID: {template.id}
- Total Clauses: {len(template.clauses)}

Clauses:
{json.dumps(serialized_clauses, indent=2)}

Jurisdiction Context:
- Applicable Jurisdictions: {getattr(template, 'jurisdictions', ['Not Specified'])}
- Contract Type: {getattr(template, 'contract_type', 'Unspecified')}

Analysis Requirements:
1. Validate template structure and completeness
2. Identify potential gaps or missing standard clauses
3. Suggest improvements or standardization
4. Assess overall template quality
5. Check for jurisdiction-specific compliance

Format the response as a structured JSON object:
{{
    "is_valid": true/false,
    "validity_score": 0-100,
    "validation_issues": [
        {{
            "category": "Clause category or template-level",
            "severity": "LOW|MEDIUM|HIGH",
            "description": "Specific validation concern"
        }}
    ],
    "suggested_improvements": [
        {{
            "type": "structural|content|compliance",
            "recommendation": "Detailed improvement suggestion"
        }}
    ],
    "recommended_clauses": [
        {{
            "category": "Suggested clause category",
            "rationale": "Why this clause should be added",
            "suggested_content": "Optional draft clause text"
        }}
    ],
    "jurisdiction_compliance": {{
        "compliant_jurisdictions": ["List of jurisdictions"],
        "non_compliant_jurisdictions": ["List of jurisdictions"],
        "compliance_notes": "Additional compliance insights"
    }},
    "quality_assessment": {{
        "strengths": ["Template strengths"],
        "weaknesses": ["Template weaknesses"],
        "overall_quality_score": 0-100
    }}
}}
"""
            
            # Use AI to validate and enhance the template
            ai_response = await self.ai_processor.generate_response(
                system_prompt="",
                user_prompt=prompt,
                model=self.model,
                task_category="legal_analysis"
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
            
            # Parse the AI-generated template analysis
            template_analysis = json.loads(ai_response)
            
            # Log template analysis
            print(f"\n--- Template Validation Analysis ---")
            print(f"Validity: {'Valid' if template_analysis.get('is_valid', False) else 'Invalid'}")
            print(f"Validity Score: {template_analysis.get('validity_score', 'N/A')}")
            
            # Handle validation issues
            validation_issues = template_analysis.get('validation_issues', [])
            if validation_issues:
                print("Validation Issues:")
                for issue in validation_issues:
                    print(f"- {issue.get('category')} ({issue.get('severity')}): {issue.get('description')}")
            
            # Suggested improvements
            suggested_improvements = template_analysis.get('suggested_improvements', [])
            if suggested_improvements:
                print("Suggested Improvements:")
                for improvement in suggested_improvements:
                    print(f"- {improvement.get('type')}: {improvement.get('recommendation')}")
            
            # Recommended additional clauses
            recommended_clauses = template_analysis.get('recommended_clauses', [])
            if recommended_clauses:
                print("Recommended Additional Clauses:")
                for clause in recommended_clauses:
                    print(f"- {clause.get('category')}: {clause.get('rationale')}")
            
            # Jurisdiction compliance
            jurisdiction_compliance = template_analysis.get('jurisdiction_compliance', {})
            if jurisdiction_compliance:
                print("Jurisdiction Compliance:")
                print(f"Compliant: {jurisdiction_compliance.get('compliant_jurisdictions', 'N/A')}")
                print(f"Non-Compliant: {jurisdiction_compliance.get('non_compliant_jurisdictions', 'N/A')}")
        
        except Exception as e:
            # Log AI processing error
            print(f"Error in template AI validation: {e}")
            import traceback
            traceback.print_exc()
            # Continue with template addition despite AI validation failure
        
        # Log template addition
        print(f"\n--- Adding Contract Template: {template.name} (ID: {template.id}) ---")
        print(f"Template Clauses: {len(template.clauses)} clauses")
        
        # Add template to the collection
        self.standard_templates[template.id] = template
        
        # Optional: Log template categories
        template_categories = set(clause.category for clause in template.clauses)
        print(f"Template Categories: {', '.join(c.value for c in template_categories)}")
        
        return template.id

    async def get_template(self, template_id: str) -> Optional[StandardTemplate]:
        """
        Retrieve a standard template by its ID
        
        Args:
            template_id (str): The unique identifier of the template
        
        Returns:
            Optional[StandardTemplate]: The retrieved template or None if not found
        
        Raises:
            ValueError: If the template_id is invalid
        """
        # Validate input
        if not template_id:
            raise ValueError("Template ID cannot be empty")
        
        # Retrieve template
        template = self.standard_templates.get(template_id)
        
        if template:
            # Log template retrieval
            print(f"\n--- Retrieved Contract Template: {template.name} (ID: {template_id}) ---")
            print(f"Template Clauses: {len(template.clauses)} clauses")
        else:
            # Log template not found
            print(f"\n--- No Template Found for ID: {template_id} ---")
        
        return template

    async def list_templates(self) -> List[StandardTemplate]:
        """
        List all available contract templates
        
        Returns:
            List[StandardTemplate]: A list of all stored templates
        """
        # Log template listing
        print(f"\n--- Listing Contract Templates ---")
        print(f"Total Templates: {len(self.standard_templates)}")
        
        # List template names and IDs
        template_info = [
            f"{template.name} (ID: {template_id})" 
            for template_id, template in self.standard_templates.items()
        ]
        print("Templates: " + ", ".join(template_info) if template_info else "No templates available")
        
        return list(self.standard_templates.values())

    async def remove_template(self, template_id: str) -> bool:
        """
        Remove a template from the collection
        
        Args:
            template_id (str): The unique identifier of the template to remove
        
        Returns:
            bool: True if template was removed, False if not found
        
        Raises:
            ValueError: If the template_id is invalid
        """
        # Validate input
        if not template_id:
            raise ValueError("Template ID cannot be empty")
        
        # Check if template exists
        if template_id in self.standard_templates:
            # Log template removal
            template = self.standard_templates[template_id]
            print(f"\n--- Removing Contract Template: {template.name} (ID: {template_id}) ---")
            
            # Remove template
            del self.standard_templates[template_id]
            return True
        
        # Log template not found
        print(f"\n--- No Template Found for Removal: {template_id} ---")
        return False

    def _validate_dependencies(self) -> None:
        """
        Perform comprehensive validation of service dependencies.
        
        Checks include:
        - Verifying AI processor type
        - Ensuring settings meet minimum requirements
        - Checking for required method implementations
        
        Raises:
            ValueError: If any critical dependency is invalid
            TypeError: If dependencies do not meet expected interfaces
        """
        # Validate AI Processor
        if not hasattr(self.ai_processor, 'generate_response'):
            raise TypeError("AI Processor must implement 'generate_response' method")
        
        # Check AI Processor type
        from .ai_processor import AIProcessor
        expected_processor_types = [AIProcessor]
        if not isinstance(self.ai_processor, tuple(expected_processor_types)):
            raise TypeError(f"Invalid AI Processor. Expected types: {', '.join(t.__name__ for t in expected_processor_types)}")
        
        # Validate Settings
        required_settings_methods = [
            'get_model_for_task', 
        ]
        
        optional_settings_methods = [
            'get_environment_config'
        ]
        
        for method in required_settings_methods:
            if not hasattr(self.settings, method):
                raise TypeError(f"Settings must implement '{method}' method")
        
        for method in optional_settings_methods:
            if not hasattr(self.settings, method):
                print(f"Warning: Settings does not implement optional method '{method}'")

    def _validate_ai_processor_capabilities(self) -> None:
        """
        Validate AI processor capabilities specific to contract analysis.
        
        Performs checks to ensure the AI processor can handle:
        - Legal text processing
        - Clause extraction
        - Risk assessment
        
        Raises:
            ValueError: If processor lacks required capabilities
        """
        try:
            # Check model compatibility
            compatible_models = [
                'gpt-4.1-nano', 
                'gpt-4o', 
                'gpt-4-turbo'
            ]
            current_model = str(self.model).lower()
            
            if not any(model in current_model for model in compatible_models):
                print(f"\n--- Warning: Potentially Incompatible Model ---")
                print(f"Current Model: {self.model}")
                print("Recommended Models: " + ", ".join(compatible_models))
        
        except Exception as e:
            print(f"AI Processor Capability Check Warning: {e}")

    def _validate_settings_configuration(self) -> None:
        """
        Validate application settings configuration for contract analysis.
        
        Checks include:
        - Verifying environment configuration
        - Checking model selection parameters
        - Ensuring compliance with legal analysis requirements
        
        Raises:
            ConfigurationError: If settings are misconfigured
        """
        try:
            # Retrieve environment configuration
            env_config = self.settings.get_environment_config()
            
            # Validate key configuration parameters
            required_env_keys = [
                'app_name', 
                'app_version',
                'api_prefix',
                'openai_model'
            ]
            
            missing_keys = [
                key for key in required_env_keys 
                if key not in env_config
            ]
            
            if missing_keys:
                print(f"\n--- Settings Configuration Warning ---")
                print(f"Missing Configuration Keys: {', '.join(missing_keys)}")
                print("Using default configurations")
            
            # Optional: Log configuration details
            print("\n--- Contract Analysis Settings ---")
            print(f"App Name: {env_config.get('app_name', 'MCP Lawyer')}")
            print(f"App Version: {env_config.get('app_version', '1.0.0')}")
            print(f"API Prefix: {env_config.get('api_prefix', '/api/v1')}")
            print(f"OpenAI Model: {env_config.get('openai_model', 'gpt-4.1-nano')}")
        
        except Exception as e:
            print(f"Settings Configuration Validation Warning: {e}")
            import traceback
            traceback.print_exc()
