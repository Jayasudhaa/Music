from pydantic import BaseModel
from typing import Optional, List

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str

class ShrutiAnalysisResult(BaseModel):
    swara: str
    deviation_cents: float
    stability: float
    feedback: str
    
    # Enhanced metrics
    accuracy_percentage: Optional[float] = None
    is_drifting: Optional[bool] = None
    drift_rate: Optional[float] = None
    attack_quality: Optional[float] = None
    release_quality: Optional[float] = None
    has_vibrato: Optional[bool] = None
    vibrato_extent: Optional[float] = None
    harmonic_clarity: Optional[float] = None
    
    # Visualization data
    pitch_contour: Optional[List[float]] = None
    time_points: Optional[List[float]] = None
    target_line: Optional[List[float]] = None
    target_cents: Optional[float] = None
    deviation_colors: Optional[List[str]] = None
    
    # Detailed analysis
    phases: Optional[dict] = None
    problem_zones: Optional[List[dict]] = None

class RagaAnalysisResult(BaseModel):
    swara_sequence: List[str]
    feedback: str
    detected_ragas: Optional[List[dict]] = None
    raga: Optional[str] = None
    is_valid: Optional[bool] = None
    message: Optional[str] = None