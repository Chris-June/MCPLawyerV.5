from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            response = Response(
                status_code=200,
                content=""
            )
            self._set_cors_headers(response)
            return response
            
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to the response
        self._set_cors_headers(response)
        
        return response
    
    def _set_cors_headers(self, response):
        # Allow requests from the client origin
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Requested-With, Origin"
        response.headers["Access-Control-Max-Age"] = "3600"  # Cache preflight request for 1 hour
