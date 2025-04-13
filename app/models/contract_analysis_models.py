from typing import List, Dict, Optional, Union, Literal
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
import uuid


class RiskLevel(str, Enum):
    """Risk levels for contract clauses and overall contracts"""
    NO_RISK = "no_risk"
    LOW_RISK = "low_risk"
    MEDIUM_RISK = "medium_risk"
    HIGH_RISK = "high_risk"
    CRITICAL_RISK = "critical_risk"


class ClauseCategory(str, Enum):
    """Common legal clause categories"""
    INDEMNIFICATION = "indemnification"
    LIABILITY = "liability"
    TERMINATION = "termination"
    CONFIDENTIALITY = "confidentiality"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    FORCE_MAJEURE = "force_majeure"
    GOVERNING_LAW = "governing_law"
    PAYMENT_TERMS = "payment_terms"
    REPRESENTATIONS_WARRANTIES = "representations_warranties"
    DISPUTE_RESOLUTION = "dispute_resolution"
    NON_COMPETE = "non_compete"
    NON_SOLICITATION = "non_solicitation"
    ASSIGNMENT = "assignment"
    AMENDMENT = "amendment"
    NOTICES = "notices"
    DEFINITIONS = "definitions"
    ENTIRE_AGREEMENT = "entire_agreement"
    SEVERABILITY = "severability"
    PRIVACY_COMPLIANCE = "privacy_compliance"
    OTHER = "other"


class ContractClause(BaseModel):
    """A specific clause extracted from a contract"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    text: str
    category: ClauseCategory
    risk_level: RiskLevel
    risk_explanation: Optional[str] = None
    suggested_changes: Optional[str] = None
    position: Dict[str, int] = Field(
        default_factory=dict, 
        description="Location details of the clause in the original document"
    )
    metadata: Dict[str, Union[str, int, bool]] = Field(default_factory=dict)


class TemplateMatch(BaseModel):
    """Information about matching a clause with a standard template"""
    template_id: str
    template_name: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    differences: Optional[str] = None


class ClauseAnalysis(BaseModel):
    """Analysis of a single contract clause"""
    clause: ContractClause
    template_matches: Optional[List[TemplateMatch]] = None
    alternative_wording: Optional[str] = None
    provincial_differences: Optional[Dict[str, str]] = None
    legal_concerns: Optional[List[str]] = None


class ContractSummary(BaseModel):
    """Summary information about a contract"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    contract_type: str
    parties: List[str]
    effective_date: Optional[datetime] = None
    termination_date: Optional[datetime] = None
    key_points: List[str] = Field(default_factory=list)
    missing_clauses: List[str] = Field(default_factory=list)


class ContractAnalysisRequest(BaseModel):
    """Request to analyze a contract"""
    contract_text: str
    contract_name: Optional[str] = None
    contract_type: Optional[str] = None
    jurisdiction: Optional[str] = None
    comparison_template_ids: Optional[List[str]] = None
    party_names: Optional[List[str]] = None


class ContractAnalysisResult(BaseModel):
    """Complete analysis result for a contract"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    summary: ContractSummary
    clauses: List[ClauseAnalysis]
    overall_risk_level: RiskLevel
    overall_risk_explanation: str
    overall_score: int = Field(..., ge=0, le=100)
    recommendations: List[str]
    metadata: Dict[str, Union[str, int, bool]] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)


class ContractComparisonRequest(BaseModel):
    """Request to compare two contracts"""
    contract_a_text: str
    contract_b_text: str
    contract_a_name: Optional[str] = None
    contract_b_name: Optional[str] = None
    focus_categories: Optional[List[ClauseCategory]] = None


class ClauseDifference(BaseModel):
    """Difference between two clauses in different contracts"""
    category: ClauseCategory
    title: str
    contract_a_text: str
    contract_b_text: str
    significance: RiskLevel
    explanation: str


class ContractComparisonResult(BaseModel):
    """Complete comparison result between two contracts"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contract_a_name: str
    contract_b_name: str
    common_clauses: List[ClauseCategory]
    unique_to_a: List[ClauseCategory]
    unique_to_b: List[ClauseCategory]
    differences: List[ClauseDifference]
    recommendation: str
    created_at: datetime = Field(default_factory=datetime.now)


class StandardTemplate(BaseModel):
    """Standard contract template for comparison"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    contract_type: str
    jurisdiction: Optional[str] = None
    clauses: Dict[ClauseCategory, str]
    metadata: Dict[str, Union[str, int, bool]] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class RiskAssessmentSettings(BaseModel):
    """Configurable settings for risk assessment"""
    jurisdiction: str
    industry: Optional[str] = None
    risk_weights: Dict[ClauseCategory, float] = Field(default_factory=dict)
    custom_flags: List[str] = Field(default_factory=list)
    threshold_overrides: Dict[RiskLevel, float] = Field(default_factory=dict)
