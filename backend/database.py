import sqlite3
from datetime import datetime
from config import DATABASE_NAME

def init_db():
    """Initialize database tables"""
    conn = sqlite3.connect(DATABASE_NAME)
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER,
            expires_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            analysis_type TEXT,
            swara TEXT,
            deviation REAL,
            stability REAL,
            feedback TEXT,
            swara_sequence TEXT,
            detected_raga TEXT,
            audio_filename TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def create_user(email: str, password_hash: str, name: str = ""):
    """Create a new user"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.execute(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        (email, password_hash, name)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return user_id

def get_user_by_email(email: str):
    """Get user by email"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.execute(
        'SELECT id, email, name, password_hash FROM users WHERE email = ?',
        (email,)
    )
    user = cursor.fetchone()
    conn.close()
    return user

def user_exists(email: str) -> bool:
    """Check if user exists"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.execute('SELECT id FROM users WHERE email = ?', (email,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

def create_session(token: str, user_id: int, expires_at: datetime):
    """Create a new session"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.execute(
        'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
        (token, user_id, expires_at)
    )
    conn.commit()
    conn.close()

def get_user_by_token(token: str):
    """Get user by session token"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.execute('''
        SELECT users.id, users.email, users.name 
        FROM sessions 
        JOIN users ON sessions.user_id = users.id
        WHERE sessions.token = ? AND sessions.expires_at > ?
    ''', (token, datetime.now()))
    user = cursor.fetchone()
    conn.close()
    return user

def save_analysis(user_id: int, analysis_type: str, **kwargs):
    """Save analysis result"""
    conn = sqlite3.connect(DATABASE_NAME)
    
    fields = ['user_id', 'analysis_type']
    values = [user_id, analysis_type]
    
    for key, value in kwargs.items():
        if value is not None:
            fields.append(key)
            values.append(value)
    
    placeholders = ', '.join(['?' for _ in values])
    field_names = ', '.join(fields)
    
    conn.execute(
        f'INSERT INTO analyses ({field_names}) VALUES ({placeholders})',
        values
    )
    conn.commit()
    conn.close()

def get_user_history(user_id: int, limit: int = 50):
    """Get user's analysis history"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.execute('''
        SELECT id, analysis_type, swara, deviation, stability, 
               swara_sequence, detected_raga, feedback, created_at
        FROM analyses
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    ''', (user_id, limit))
    
    analyses = []
    for row in cursor.fetchall():
        analyses.append({
            "id": row[0],
            "analysis_type": row[1],
            "swara": row[2],
            "deviation": row[3],
            "stability": row[4],
            "swara_sequence": row[5],
            "detected_raga": row[6],
            "feedback": row[7],
            "created_at": row[8]
        })
    
    conn.close()
    return analyses