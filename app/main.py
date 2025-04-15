from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.routes import role_routes, memory_routes, healthcheck, law_practice_routes, clause_library_routes, precedent_routes, legal_tools_routes, document_template_routes, ai_processor_routes, predictive_analysis_routes, client_intake_routes, contract_analysis_routes
from app.services.role_service import RoleService
from app.services.memory_service import MemoryService
from app.services.ai_processor import AIProcessor
from app.services.law_practice_service import LawPracticeService
from app.services.clause_library_service import ClauseLibraryService
from app.services.precedent_service import PrecedentService

# Import new legal tools services
from app.services.legal_research_service import LegalResearchService
from app.services.citation_formatter_service import CitationFormatterService
from app.services.document_comparison_service import DocumentComparisonService
from app.services.legal_fee_calculator_service import LegalFeeCalculatorService
from app.services.court_filing_service import CourtFilingService
from app.services.predictive_analysis_service import PredictiveAnalysisService
from app.services.document_template_service import DocumentTemplateService

import logging
from fastapi import Request

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services and cleanup on shutdown"""
    # Initialize services
    ai_processor = AIProcessor(settings)
    memory_service = MemoryService()
    
    # Initialize all services with settings for consistent model selection
    role_service = RoleService(memory_service, ai_processor, settings)
    law_practice_service = LawPracticeService(memory_service, ai_processor, settings)
    clause_library_service = ClauseLibraryService(memory_service, ai_processor, settings)
    precedent_service = PrecedentService(memory_service, ai_processor, settings)
    
    # Initialize new legal tools services
    legal_research_service = LegalResearchService(ai_processor, settings) 
    citation_formatter_service = CitationFormatterService(ai_processor, settings)
    document_comparison_service = DocumentComparisonService(ai_processor, settings)
    legal_fee_calculator_service = LegalFeeCalculatorService(ai_processor, settings)
    court_filing_service = CourtFilingService(ai_processor, settings)
    predictive_analysis_service = PredictiveAnalysisService(ai_processor, settings)
    document_template_service = DocumentTemplateService(memory_service, ai_processor, settings)
    
    # Add services to app state
    app.state.ai_processor = ai_processor
    app.state.memory_service = memory_service
    app.state.role_service = role_service
    app.state.law_practice_service = law_practice_service
    app.state.clause_library_service = clause_library_service
    app.state.precedent_service = precedent_service
    
    # Add new legal tools services to app state
    app.state.legal_research_service = legal_research_service
    app.state.citation_formatter_service = citation_formatter_service
    app.state.document_comparison_service = document_comparison_service
    app.state.legal_fee_calculator_service = legal_fee_calculator_service
    app.state.court_filing_service = court_filing_service
    app.state.predictive_analysis_service = predictive_analysis_service
    app.state.document_template_service = document_template_service
    
    logging.info("Services initialized and added to app state.")
    
    yield
    
    # Clean up resources
    await memory_service.close()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Role-Specific Context MCP Server for AI orchestration",
    lifespan=lifespan
)

# CORS Configuration with Extensive Logging and Permissive Settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:8000", 
        "http://127.0.0.1:8000",
        "http://localhost:3000",  # Additional common frontend port
        "*"  # Wildcard to allow all origins during debugging
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicit methods
    allow_headers=[
        "Content-Type", 
        "Authorization", 
        "Accept", 
        "X-Requested-With", 
        "Origin", 
        "Access-Control-Request-Method", 
        "Access-Control-Request-Headers"
    ],
    max_age=3600  # Cache preflight response
)

# Detailed Request/Response Logging Middleware
@app.middleware("http")
async def log_requests_and_responses(request: Request, call_next):
    # Log incoming request details
    logger.debug(f"\n--- Incoming Request ---")
    logger.debug(f"Method: {request.method}")
    logger.debug(f"URL: {request.url}")
    logger.debug(f"Headers: {dict(request.headers)}")
    
    # Log request body if possible
    try:
        body = await request.body()
        logger.debug(f"Request Body: {body.decode('utf-8')}")
    except Exception as e:
        logger.debug(f"Could not read request body: {e}")
    
    # Process the request
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise
    
    # Log response details
    logger.debug(f"\n--- Outgoing Response ---")
    logger.debug(f"Status Code: {response.status_code}")
    logger.debug(f"Headers: {dict(response.headers)}")
    
    return response

# Include routers
app.include_router(healthcheck.router, tags=["Health"])
app.include_router(role_routes.router, prefix=settings.api_prefix, tags=["Roles"])
app.include_router(memory_routes.router, prefix=settings.api_prefix, tags=["Memory"])
app.include_router(law_practice_routes.router, prefix=settings.api_prefix, tags=["Law Practice"])
app.include_router(clause_library_routes.router, prefix=settings.api_prefix, tags=["Clause Library"])
app.include_router(precedent_routes.router, prefix=settings.api_prefix, tags=["Precedent Management"])
app.include_router(legal_tools_routes.router, prefix=settings.api_prefix, tags=["Legal Tools"])
app.include_router(document_template_routes.router, prefix=settings.api_prefix, tags=["Document Templates"])
app.include_router(ai_processor_routes.router, prefix=settings.api_prefix, tags=["AI Processor"])
app.include_router(predictive_analysis_routes.router, prefix=settings.api_prefix, tags=["Predictive Analysis"])
app.include_router(client_intake_routes.router, prefix=settings.api_prefix, tags=["Client Intake"])
app.include_router(contract_analysis_routes.router, prefix=settings.api_prefix, tags=["Contract Analysis"])

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Noesis Law Practice Management Server",
        "owner": "IntelliSync Solutions",
        "version": settings.app_version,
        "documentation": "/docs"
    }
