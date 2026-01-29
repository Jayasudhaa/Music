import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import (
    user_exists, create_user, get_user_by_email, 
    create_session, get_user_by_token
)
from config import SESSION_EXPIRY_DAYS

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash a password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_token(user_id: int) -> str:
    """Generate a session token for user"""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(days=SESSION_EXPIRY_DAYS)
    create_session(token, user_id, expires_at)
    return token

def signup_user(email: str, password: str, name: str = ""):
    """Register a new user"""
    if user_exists(email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = hash_password(password)
    user_id = create_user(email, password_hash, name)
    token = generate_session_token(user_id)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": name
        }
    }

def login_user(email: str, password: str):
    """Login existing user"""
    user = get_user_by_email(email)
    
    if not user or user[3] != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = generate_session_token(user[0])
    
    return {
        "token": token,
        "user": {
            "id": user[0],
            "email": user[1],
            "name": user[2]
        }
    }

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    user = get_user_by_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {"id": user[0], "email": user[1], "name": user[2]}
