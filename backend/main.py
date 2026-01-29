import uvicorn
import os
from fastapi import FastAPI, UploadFile, Form, Depends
from fastapi.middleware.cors import CORSMiddleware

from models import SignupRequest, LoginRequest
from advanced_analysis import analyze_pitch_detailed
from ai_teacher import generate_shruti_feedback
from auth import signup_user, login_user, get_current_user
from database import init_db, save_analysis, get_user_history
from raga_data import RAGA_DATABASE

app = FastAPI(title="Shruti Analyzer API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Shruti Analyzer API is running",
        "version": "1.0.0"
    }

@app.post("/signup")
async def signup(request: SignupRequest):
    """Register new user"""
    return signup_user(request.email, request.password, request.name)

@app.post("/login")
async def login(request: LoginRequest):
    """Login existing user"""
    return login_user(request.email, request.password)

@app.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info"""
    return user

@app.get("/ragas")
async def get_ragas():
    """Get list of all Carnatic ragas with details"""
    ragas = []
    for name, data in RAGA_DATABASE.items():
        ragas.append({
            "name": name,
            "description": data["description"],
            "swaras": list(data["swaras"].keys())
        })
    return ragas

@app.get("/history")
async def get_practice_history(user: dict = Depends(get_current_user)):
    """Get user's practice history"""
    return get_user_history(user['id'])

@app.post("/analyze")
async def analyze_shruti(
    audio: UploadFile, 
    tonic: float = Form(261.63),
    user: dict = Depends(get_current_user)
):
    """
    Analyze singing and return pitch graph data
    Returns: pitch contour for live visualization + AI feedback
    """
    temp_path = "temp_recording.wav"
    
    # Save uploaded audio
    with open(temp_path, "wb") as f:
        f.write(await audio.read())
    
    try:
        # Analyze pitch
        result = analyze_pitch_detailed(temp_path, tonic)
        if not result:
            return {"error": "No voice detected"}
        
        # Generate AI feedback with graph analysis
        feedback = generate_shruti_feedback(
            swara=result['swara'],
            deviation=result['deviation'],
            stability=result['overall_stability'],
            detailed_analysis=result
        )
        
        # Save to database
        save_analysis(
            user_id=user['id'],
            analysis_type="single_note",
            swara=result['swara'],
            deviation=result['deviation'],
            stability=result['overall_stability'],
            feedback=feedback
        )
        
        # Return complete result with graph data
        return {
            **result,
            "feedback": feedback
        }
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    print("🚀 Initializing database...")
    init_db()
    print("🎵 Starting Shruti Analyzer Server...")
    print("📊 Live pitch graph visualization enabled!")
    print("🌐 Server running on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
