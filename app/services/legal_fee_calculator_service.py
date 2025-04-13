from typing import Dict, Any, List, Optional
import datetime
from fastapi import HTTPException
from app.services.ai_processor import AIProcessor
from app.config import Settings, ModelTaskConfig, OpenAIModel

class LegalFeeCalculatorService:
    """Service for calculating legal fees based on matter type and complexity"""
    
    def __init__(self, 
                 ai_processor: AIProcessor, 
                 settings: Optional[Settings] = None):
        """Initialize the legal fee calculator service
        
        Args:
            ai_processor: Service for processing AI requests
            settings: Optional application settings for model configuration
        """
        self.ai_processor = ai_processor
        
        # Set model for fee calculation and recommendation
        if settings:
            self.model = settings.get_model_for_task("reasoning")  # Use reasoning model for fee calculations
            self.settings = settings
        else:
            self.model = None
            self.settings = None
        
        self.fee_structures = self._initialize_fee_structures()
        self.hourly_rates = self._initialize_hourly_rates()
        self.matter_complexity = self._initialize_matter_complexity()
    
    def _initialize_fee_structures(self) -> Dict[str, Dict[str, Any]]:
        """Initialize fee structures for different matter types
        
        Returns:
            Dictionary of fee structures
        """
        return {
            "hourly": {
                "name": "Hourly Rate",
                "description": "Fees calculated based on time spent at hourly rates",
                "applicable_matters": ["litigation", "corporate", "real_estate", "family", "estate", "general"]
            },
            "fixed": {
                "name": "Fixed Fee",
                "description": "Predetermined fee for specific services",
                "applicable_matters": ["real_estate", "corporate", "estate", "immigration"]
            },
            "contingency": {
                "name": "Contingency Fee",
                "description": "Percentage of recovery or settlement",
                "applicable_matters": ["personal_injury", "class_action", "employment"]
            },
            "retainer": {
                "name": "Retainer",
                "description": "Advance payment for future services",
                "applicable_matters": ["litigation", "corporate", "family", "general"]
            },
            "subscription": {
                "name": "Subscription",
                "description": "Regular payment for ongoing legal services",
                "applicable_matters": ["corporate", "startup", "small_business"]
            }
        }
    
    def _initialize_hourly_rates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize hourly rates for different lawyer experience levels
        
        Returns:
            Dictionary of hourly rates
        """
        return {
            "partner": {
                "name": "Partner",
                "description": "Senior lawyer with partnership stake",
                "min_rate": 350,
                "max_rate": 850,
                "avg_rate": 550,
                "currency": "CAD"
            },
            "associate": {
                "name": "Associate",
                "description": "Lawyer employed by the firm",
                "min_rate": 200,
                "max_rate": 450,
                "avg_rate": 325,
                "currency": "CAD"
            },
            "junior_associate": {
                "name": "Junior Associate",
                "description": "Lawyer with less than 3 years experience",
                "min_rate": 150,
                "max_rate": 300,
                "avg_rate": 225,
                "currency": "CAD"
            },
            "articling_student": {
                "name": "Articling Student",
                "description": "Law graduate completing articling requirement",
                "min_rate": 100,
                "max_rate": 200,
                "avg_rate": 150,
                "currency": "CAD"
            },
            "paralegal": {
                "name": "Paralegal",
                "description": "Licensed paralegal",
                "min_rate": 90,
                "max_rate": 180,
                "avg_rate": 135,
                "currency": "CAD"
            },
            "law_clerk": {
                "name": "Law Clerk",
                "description": "Legal support professional",
                "min_rate": 75,
                "max_rate": 150,
                "avg_rate": 110,
                "currency": "CAD"
            }
        }
    
    def _initialize_matter_complexity(self) -> Dict[str, Dict[str, Any]]:
        """Initialize complexity factors for different matter types
        
        Returns:
            Dictionary of complexity factors
        """
        return {
            "litigation": {
                "factors": [
                    "case_value",
                    "num_parties",
                    "num_witnesses",
                    "num_experts",
                    "document_volume",
                    "legal_complexity",
                    "court_level"
                ],
                "complexity_multipliers": {
                    "low": 0.8,
                    "medium": 1.0,
                    "high": 1.3,
                    "very_high": 1.6
                }
            },
            "corporate": {
                "factors": [
                    "transaction_value",
                    "num_entities",
                    "jurisdictions",
                    "regulatory_requirements",
                    "document_complexity",
                    "timeline"
                ],
                "complexity_multipliers": {
                    "low": 0.8,
                    "medium": 1.0,
                    "high": 1.3,
                    "very_high": 1.5
                }
            },
            "real_estate": {
                "factors": [
                    "property_value",
                    "transaction_type",
                    "property_type",
                    "financing_complexity",
                    "environmental_issues",
                    "zoning_issues"
                ],
                "complexity_multipliers": {
                    "low": 0.8,
                    "medium": 1.0,
                    "high": 1.2,
                    "very_high": 1.4
                }
            },
            "family": {
                "factors": [
                    "asset_value",
                    "child_custody",
                    "spousal_support",
                    "business_interests",
                    "international_aspects",
                    "contested_level"
                ],
                "complexity_multipliers": {
                    "low": 0.8,
                    "medium": 1.0,
                    "high": 1.3,
                    "very_high": 1.5
                }
            },
            "estate": {
                "factors": [
                    "estate_value",
                    "num_beneficiaries",
                    "asset_complexity",
                    "international_aspects",
                    "contested_issues",
                    "tax_complexity"
                ],
                "complexity_multipliers": {
                    "low": 0.8,
                    "medium": 1.0,
                    "high": 1.2,
                    "very_high": 1.4
                }
            }
        }
    
    async def calculate_hourly_fee_estimate(self, 
                                         matter_type: str, 
                                         complexity: str, 
                                         estimated_hours: Dict[str, float]) -> Dict[str, Any]:
        """Calculate fee estimate based on hourly rates
        
        Args:
            matter_type: Type of legal matter
            complexity: Complexity level (low, medium, high, very_high)
            estimated_hours: Dictionary of estimated hours by role
            
        Returns:
            Fee estimate details
        """
        # Validate matter type
        if matter_type not in self.matter_complexity:
            raise HTTPException(status_code=400, detail=f"Matter type '{matter_type}' not supported for complexity-based estimates")
        
        # Validate complexity
        valid_complexity = list(self.matter_complexity[matter_type]["complexity_multipliers"].keys())
        if complexity not in valid_complexity:
            raise HTTPException(status_code=400, detail=f"Invalid complexity level. Must be one of: {', '.join(valid_complexity)}")
        
        # Validate estimated hours
        for role in estimated_hours:
            if role not in self.hourly_rates:
                raise HTTPException(status_code=400, detail=f"Invalid role '{role}'. Must be one of: {', '.join(self.hourly_rates.keys())}")
        
        # Get complexity multiplier
        multiplier = self.matter_complexity[matter_type]["complexity_multipliers"][complexity]
        
        # Calculate fee estimate
        line_items = []
        total_fees = 0
        total_hours = 0
        
        for role, hours in estimated_hours.items():
            rate = self.hourly_rates[role]["avg_rate"] * multiplier
            fee = rate * hours
            
            line_items.append({
                "role": role,
                "role_name": self.hourly_rates[role]["name"],
                "hours": hours,
                "rate": rate,
                "fee": fee,
                "currency": self.hourly_rates[role]["currency"]
            })
            
            total_fees += fee
            total_hours += hours
        
        # Calculate disbursements (estimated at 10% of fees)
        disbursements = total_fees * 0.1
        
        # Calculate taxes (13% HST in Ontario)
        taxes = (total_fees + disbursements) * 0.13
        
        # Calculate total
        total = total_fees + disbursements + taxes
        
        return {
            "matter_type": matter_type,
            "complexity": complexity,
            "complexity_multiplier": multiplier,
            "fee_structure": "hourly",
            "currency": "CAD",
            "line_items": line_items,
            "summary": {
                "total_hours": total_hours,
                "total_fees": total_fees,
                "disbursements": disbursements,
                "taxes": taxes,
                "total": total
            },
            "disclaimer": "This is an estimate only and actual fees may vary based on the specific circumstances of your matter."
        }
    
    async def calculate_fixed_fee_estimate(self, matter_type: str, service_type: str, complexity: str = "medium") -> Dict[str, Any]:
        """Calculate fixed fee estimate for standard services
        
        Args:
            matter_type: Type of legal matter
            service_type: Specific service within the matter type
            complexity: Complexity level (low, medium, high, very_high)
            
        Returns:
            Fixed fee estimate
        """
        # Validate matter type for fixed fee
        if "fixed" not in self.fee_structures or matter_type not in self.fee_structures["fixed"]["applicable_matters"]:
            raise HTTPException(status_code=400, detail=f"Matter type '{matter_type}' not supported for fixed fee estimates")
        
        # Create a prompt for the AI to generate a fixed fee estimate
        system_prompt = """You are a legal fee estimation specialist.
        Provide a detailed fixed fee estimate for the specified legal service.
        Base your estimate on standard market rates for Canadian legal services.
        Include a fee range (minimum to maximum) and a recommended fixed fee.
        Explain the factors that influence the fee and what is included/excluded.
        """
        
        user_prompt = f"""Please provide a fixed fee estimate for the following legal service:
        
        Matter Type: {matter_type}
        Service Type: {service_type}
        Complexity: {complexity}
        
        Include in your response:
        1. A recommended fixed fee amount in CAD
        2. A fee range (minimum to maximum)
        3. What is typically included in this fixed fee
        4. What is typically excluded and may cost extra
        5. Factors that might increase or decrease the fee
        6. Any disbursements that are typically added to the fixed fee
        7. Applicable taxes (assume 13% HST in Ontario)
        
        Format your response in a clear, structured way suitable for client presentation.
        """
        
        # Process the prompt through the AI processor
        fee_estimate = await self.ai_processor.generate_response(system_prompt, user_prompt)
        
        return {
            "matter_type": matter_type,
            "service_type": service_type,
            "complexity": complexity,
            "fee_structure": "fixed",
            "currency": "CAD",
            "fee_estimate": fee_estimate,
            "disclaimer": "This is an estimate only and actual fees may vary based on the specific circumstances of your matter."
        }
    
    async def calculate_contingency_fee_estimate(self, matter_type: str, estimated_recovery: float) -> Dict[str, Any]:
        """Calculate contingency fee estimate based on estimated recovery
        
        Args:
            matter_type: Type of legal matter
            estimated_recovery: Estimated recovery amount in CAD
            
        Returns:
            Contingency fee estimate
        """
        # Validate matter type for contingency fee
        if "contingency" not in self.fee_structures or matter_type not in self.fee_structures["contingency"]["applicable_matters"]:
            raise HTTPException(status_code=400, detail=f"Matter type '{matter_type}' not supported for contingency fee estimates")
        
        # Validate estimated recovery
        if estimated_recovery <= 0:
            raise HTTPException(status_code=400, detail="Estimated recovery must be greater than zero")
        
        # Determine contingency percentage based on matter type and recovery amount
        percentage = 0
        if matter_type == "personal_injury":
            if estimated_recovery < 100000:
                percentage = 0.33  # 33%
            elif estimated_recovery < 500000:
                percentage = 0.30  # 30%
            else:
                percentage = 0.25  # 25%
        elif matter_type == "class_action":
            percentage = 0.25  # 25%
        elif matter_type == "employment":
            percentage = 0.30  # 30%
        else:
            percentage = 0.33  # 33% default
        
        # Calculate fee
        fee = estimated_recovery * percentage
        
        # Calculate disbursements (estimated at 5% of recovery for contingency cases)
        disbursements = estimated_recovery * 0.05
        
        # Calculate taxes (13% HST in Ontario, only on the fee portion)
        taxes = fee * 0.13
        
        # Calculate total
        total = fee + disbursements + taxes
        
        # Calculate net recovery
        net_recovery = estimated_recovery - total
        
        return {
            "matter_type": matter_type,
            "fee_structure": "contingency",
            "currency": "CAD",
            "estimated_recovery": estimated_recovery,
            "contingency_percentage": percentage * 100,  # Convert to percentage
            "summary": {
                "contingency_fee": fee,
                "disbursements": disbursements,
                "taxes": taxes,
                "total_costs": total,
                "net_recovery": net_recovery
            },
            "disclaimer": "This is an estimate only. Actual contingency fees are subject to a written agreement and may vary based on the specific circumstances of your case."
        }
    
    async def recommend_fee_structure(self, matter_type: str, matter_details: Dict[str, Any]) -> Dict[str, Any]:
        """Recommend appropriate fee structure based on matter details
        
        Args:
            matter_type: Type of legal matter
            matter_details: Details about the matter
            
        Returns:
            Recommended fee structure with explanation
        """
        # Log the selected model for fee structure recommendation
        if self.model:
            print(f"\n--- Fee Structure Recommendation Model: {self.model} ---")
        
        # Validate input
        if not matter_type or not matter_details:
            raise HTTPException(status_code=400, detail="Matter type and details must be provided")
        
        # Create a prompt for the AI to recommend a fee structure
        system_prompt = """You are a legal fee structure specialist.
        Analyze the provided matter details and recommend the most appropriate fee structure.
        Consider the client's interests, the law firm's interests, and the nature of the matter.
        Provide a clear explanation of your recommendation and alternatives.
        """
        
        user_prompt = f"""Please recommend the most appropriate fee structure for the following legal matter:
        
        Matter Type: {matter_type}
        Matter Details: {matter_details}
        
        Consider the following fee structures:
        1. Hourly Rate - Fees calculated based on time spent at hourly rates
        2. Fixed Fee - Predetermined fee for specific services
        3. Contingency Fee - Percentage of recovery or settlement
        4. Retainer - Advance payment for future services
        5. Subscription - Regular payment for ongoing legal services
        
        In your response, please include:
        1. Your recommended primary fee structure with detailed explanation
        2. Alternative fee structures that could also work
        3. Pros and cons of each recommended structure for this specific matter
        4. Any hybrid approaches that might be appropriate
        5. Considerations for implementing the recommended structure
        
        Format your response in a clear, structured way suitable for client presentation.
        """
        
        # Process the prompt through the AI processor with the selected model
        recommendation = await self.ai_processor.generate_response(
            system_prompt=system_prompt, 
            user_prompt=user_prompt,
            model=self.model
        )
        
        return {
            "matter_type": matter_type,
            "recommendation": recommendation,
            "model_used": self.model
        }
