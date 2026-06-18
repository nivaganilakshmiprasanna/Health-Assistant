import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./healthpilot.db")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkeychangeinproduction")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", GEMINI_API_KEY)
PORT = int(os.getenv("PORT", "8000"))

# Path settings
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
