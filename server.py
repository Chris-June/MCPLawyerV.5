import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Verify OpenAI API key is loaded
if not os.getenv("OPENAI_API_KEY"):
    print("WARNING: OPENAI_API_KEY not found in environment variables")
    print("Please ensure your .env file contains a valid OPENAI_API_KEY")

from app.config import settings
from app.main import app

if __name__ == "__main__":
    # Run the server using Uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
