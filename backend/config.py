import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

print(f"DEBUG: API Key loaded: {ANTHROPIC_API_KEY[:20]}..." if ANTHROPIC_API_KEY else "DEBUG: No API key found!")
# Database
DATABASE_NAME = "shruti.db"

# Audio Settings
DEFAULT_TONIC = 261.63  # C4 as Sa
PITCH_CONFIDENCE_THRESHOLD = 0.5
SWARA_TOLERANCE_CENTS = 30
NOTE_SEGMENTATION_THRESHOLD = 50  # cents
MIN_NOTE_DURATION_FRAMES = 5

# Session Settings
SESSION_EXPIRY_DAYS = 7

# Audio Processing
MAX_AUDIO_DURATION = 30  # seconds