from fastapi import APIRouter, Depends, HTTPException, Query, Body, Request
from typing import List, Dict, Any, Optional
from fastapi import Request
from pydantic import BaseModel

# Import our new services
from app.services.legal_research_service import LegalResearchService
from app.services.citation_formatter_service import CitationFormatterService
from app.services.document_comparison_service import DocumentComparisonService
from app.services.legal_fee_calculator_service import LegalFeeCalculatorService
from app.services.court_filing_service import CourtFilingService

# Pydantic models for request validation
class CaseCitationRequest(BaseModel):
    case_info: Dict[str, str]
    style: Optional[str] = None

class LegislationCitationRequest(BaseModel):
    legislation_info: Dict[str, str]
    style: Optional[str] = None

class DocumentComparisonRequest(BaseModel):
    original_text: str
    revised_text: str
    format: str = "html"

class HourlyFeeEstimateRequest(BaseModel):
    matter_type: str
    complexity: str
    estimated_hours: Dict[str, float]

class FixedFeeEstimateRequest(BaseModel):
    matter_type: str
    service_type: str
    complexity: Optional[str] = "medium"

class ContingencyFeeEstimateRequest(BaseModel):
    matter_type: str
    estimated_recovery: float

class DocumentValidationRequest(BaseModel):
    document_text: str
    document_type: str
    jurisdiction: str

class PredictiveAnalysisRequest(BaseModel):
    case_facts: str
    legal_issues: List[str]
    jurisdiction: str
    relevant_statutes: Optional[List[str]] = None
    similar_cases: Optional[List[str]] = None
    client_position: str
    opposing_arguments: Optional[str] = None

# Dependencies to get services
async def get_legal_research_service(request: Request) -> LegalResearchService:
    return request.app.state.legal_research_service

async def get_citation_formatter_service(request: Request) -> CitationFormatterService:
    return request.app.state.citation_formatter_service

async def get_document_comparison_service(request: Request) -> DocumentComparisonService:
    return request.app.state.document_comparison_service

async def get_legal_fee_calculator_service(request: Request) -> LegalFeeCalculatorService:
    return request.app.state.legal_fee_calculator_service

async def get_court_filing_service(request: Request) -> CourtFilingService:
    return request.app.state.court_filing_service

async def get_predictive_analysis_service(request: Request) -> 'PredictiveAnalysisService':
    return request.app.state.predictive_analysis_service

# Create router
router = APIRouter(prefix="/legal-tools")

# Legal Research Routes
@router.get("/legal-research/case-law", response_model=Dict[str, Any])
async def search_case_law(
    query: str,
    jurisdiction: Optional[str] = Query(None, description="Optional jurisdiction filter"),
    database: Optional[str] = Query(None, description="Optional database to search"),
    legal_research_service: LegalResearchService = Depends(get_legal_research_service)
):
    """Search for relevant case law based on query"""
    return await legal_research_service.search_case_law(query, jurisdiction, database)

@router.get("/legal-research/legislation", response_model=Dict[str, Any])
async def search_legislation(
    query: str,
    jurisdiction: Optional[str] = Query(None, description="Optional jurisdiction filter"),
    database: Optional[str] = Query(None, description="Optional database to search"),
    legal_research_service: LegalResearchService = Depends(get_legal_research_service)
):
    """Search for relevant legislation based on query"""
    return await legal_research_service.search_legislation(query, jurisdiction, database)

@router.get("/legal-research/case-brief/{case_citation}", response_model=Dict[str, Any])
async def get_case_brief(
    case_citation: str,
    legal_research_service: LegalResearchService = Depends(get_legal_research_service)
):
    """Generate a case brief for a given case citation"""
    return await legal_research_service.get_case_brief(case_citation)

# Citation Formatter Routes
@router.post("/citation-formatter/case", response_model=Dict[str, Any])
async def format_case_citation(
    request: CaseCitationRequest,
    citation_formatter_service: CitationFormatterService = Depends(get_citation_formatter_service)
):
    """Format a case citation according to the specified style"""
    return await citation_formatter_service.format_case_citation(request.case_info, request.style)

@router.post("/citation-formatter/legislation", response_model=Dict[str, Any])
async def format_legislation_citation(
    request: LegislationCitationRequest,
    citation_formatter_service: CitationFormatterService = Depends(get_citation_formatter_service)
):
    """Format a legislation citation according to the specified style"""
    return await citation_formatter_service.format_legislation_citation(request.legislation_info, request.style)

@router.post("/citation-formatter/parse", response_model=Dict[str, Any])
async def parse_citation(
    request: Request,
    citation_text: str = Body(..., embed=True),
    citation_formatter_service: CitationFormatterService = Depends(get_citation_formatter_service)
):
    """
    Parse a legal citation into its structured components.
    
    Args:
        request (Request): The incoming HTTP request
        citation_text (str): The citation text to parse
        citation_formatter_service (CitationFormatterService): Service for citation parsing
    
    Returns:
        Dict[str, Any]: Parsed citation details
    
    Raises:
        HTTPException: For various parsing and validation errors
    """
    try:
        # Log incoming request details for debugging
        print(f"\n--- Citation Parsing Request ---")
        print(f"Received Citation Text: {citation_text}")
        print(f"Request Headers: {dict(request.headers)}")
        
        # Validate input
        if not citation_text or not isinstance(citation_text, str):
            raise ValueError("Citation text must be a non-empty string")
        
        # Attempt to parse citation
        parsed_result = await citation_formatter_service.parse_citation(citation_text)
        
        # Log successful parsing
        print(f"Successfully parsed citation: {parsed_result}")
        
        return parsed_result
    
    except ValueError as ve:
        # Handle specific value-related errors
        print(f"ValueError during citation parsing: {ve}")
        raise HTTPException(
            status_code=400, 
            detail={
                "message": str(ve),
                "error_code": "CITATION_PARSE_VALIDATION_ERROR"
            }
        )
    
    except Exception as e:
        # Comprehensive error logging for unexpected errors
        print(f"\n--- Unexpected Error in Citation Parsing ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500, 
            detail={
                "message": "Unexpected error during citation parsing",
                "error_code": "CITATION_PARSE_UNEXPECTED_ERROR",
                "error_details": str(e),
                "error_type": type(e).__name__
            }
        )

@router.get("/citation-formatter/styles", response_model=List[Dict[str, Any]])
async def get_citation_styles(
    citation_formatter_service: CitationFormatterService = Depends(get_citation_formatter_service)
):
    """Get all available citation styles"""
    return await citation_formatter_service.get_citation_styles()

# Document Comparison Routes
@router.post("/document-comparison/compare", response_model=Dict[str, Any])
async def compare_documents(
    request: DocumentComparisonRequest,
    document_comparison_service: DocumentComparisonService = Depends(get_document_comparison_service)
):
    """Compare two versions of a document and highlight differences"""
    return await document_comparison_service.compare_documents(
        request.original_text, request.revised_text, request.format
    )

@router.post("/document-comparison/summarize", response_model=Dict[str, Any])
async def summarize_changes(
    original_text: str = Body(..., embed=True),
    revised_text: str = Body(..., embed=True),
    document_comparison_service: DocumentComparisonService = Depends(get_document_comparison_service)
):
    """Summarize the changes between two versions of a document"""
    return await document_comparison_service.summarize_changes(original_text, revised_text)

@router.post("/document-comparison/extract-clauses", response_model=Dict[str, Any])
async def extract_clauses(
    document_text: str = Body(..., embed=True),
    document_comparison_service: DocumentComparisonService = Depends(get_document_comparison_service)
):
    """Extract and categorize clauses from a legal document"""
    return await document_comparison_service.extract_clauses(document_text)

# Legal Fee Calculator Routes
@router.post("/fee-calculator/hourly-estimate", response_model=Dict[str, Any])
async def calculate_hourly_fee_estimate(
    request: HourlyFeeEstimateRequest,
    legal_fee_calculator_service: LegalFeeCalculatorService = Depends(get_legal_fee_calculator_service)
):
    """Calculate fee estimate based on hourly rates"""
    return await legal_fee_calculator_service.calculate_hourly_fee_estimate(
        request.matter_type, request.complexity, request.estimated_hours
    )

@router.post("/fee-calculator/fixed-fee-estimate", response_model=Dict[str, Any])
async def calculate_fixed_fee_estimate(
    request: FixedFeeEstimateRequest,
    legal_fee_calculator_service: LegalFeeCalculatorService = Depends(get_legal_fee_calculator_service)
):
    """Calculate fixed fee estimate for standard services"""
    return await legal_fee_calculator_service.calculate_fixed_fee_estimate(
        request.matter_type, request.service_type, request.complexity
    )

@router.post("/fee-calculator/contingency-fee-estimate", response_model=Dict[str, Any])
async def calculate_contingency_fee_estimate(
    request: ContingencyFeeEstimateRequest,
    legal_fee_calculator_service: LegalFeeCalculatorService = Depends(get_legal_fee_calculator_service)
):
    """Calculate contingency fee estimate based on estimated recovery"""
    return await legal_fee_calculator_service.calculate_contingency_fee_estimate(
        request.matter_type, request.estimated_recovery
    )

@router.post("/fee-calculator/recommend-structure", response_model=Dict[str, Any])
async def recommend_fee_structure(
    matter_type: str = Body(..., embed=True),
    matter_details: Dict[str, Any] = Body(..., embed=True),
    legal_fee_calculator_service: LegalFeeCalculatorService = Depends(get_legal_fee_calculator_service)
):
    """Recommend appropriate fee structure based on matter details"""
    return await legal_fee_calculator_service.recommend_fee_structure(matter_type, matter_details)

# Court Filing Routes
@router.get("/court-filing/rules/{jurisdiction}", response_model=Dict[str, Any])
async def get_court_rules(
    jurisdiction: str,
    court_filing_service: CourtFilingService = Depends(get_court_filing_service)
):
    """Get court rules for a specific jurisdiction"""
    return await court_filing_service.get_court_rules(jurisdiction)

@router.get("/court-filing/requirements/{document_type}", response_model=Dict[str, Any])
async def get_filing_requirements(
    document_type: str,
    court_filing_service: CourtFilingService = Depends(get_court_filing_service)
):
    """Get filing requirements for a specific document type"""
    return await court_filing_service.get_filing_requirements(document_type)

@router.get("/court-filing/forms/{jurisdiction}", response_model=Dict[str, Any])
async def get_court_forms(
    jurisdiction: str,
    court_filing_service: CourtFilingService = Depends(get_court_filing_service)
):
    """Get court forms for a specific jurisdiction"""
    return await court_filing_service.get_court_forms(jurisdiction)

@router.get("/court-filing/checklist", response_model=Dict[str, Any])
async def generate_filing_checklist(
    document_type: str = Query(..., description="Type of court document"),
    jurisdiction: str = Query(..., description="Court jurisdiction"),
    court_filing_service: CourtFilingService = Depends(get_court_filing_service)
):
    """Generate a filing checklist for a specific document type and jurisdiction"""
    return await court_filing_service.generate_filing_checklist(document_type, jurisdiction)

@router.post("/court-filing/validate", response_model=Dict[str, Any])
async def validate_court_document(
    request: DocumentValidationRequest,
    court_filing_service: CourtFilingService = Depends(get_court_filing_service)
):
    """Validate a court document against filing requirements"""
    return await court_filing_service.validate_court_document(
        request.document_text, request.document_type, request.jurisdiction
    )

@router.get("/court-filing/instructions", response_model=Dict[str, Any])
async def generate_filing_instructions(
    document_type: str = Query(..., description="Type of court document"),
    jurisdiction: str = Query(..., description="Court jurisdiction"),
    court_filing_service: CourtFilingService = Depends(get_court_filing_service)
):
    """Generate step-by-step filing instructions for a specific document type and jurisdiction"""
    return await court_filing_service.generate_filing_instructions(document_type, jurisdiction)

# Predictive Case Outcome Analysis Routes
@router.post("/predictive-analysis", response_model=Dict[str, Any])
async def analyze_predictive_outcome(
    request: PredictiveAnalysisRequest,
    predictive_analysis_service: 'PredictiveAnalysisService' = Depends(get_predictive_analysis_service)
):
    """Analyze a case and predict potential outcomes based on similar precedents"""
    return await predictive_analysis_service.analyze_case_outcome(
        case_facts=request.case_facts,
        legal_issues=request.legal_issues,
        jurisdiction=request.jurisdiction,
        relevant_statutes=request.relevant_statutes,
        similar_cases=request.similar_cases,
        client_position=request.client_position,
        opposing_arguments=request.opposing_arguments
    )
