"""Authentication service for Artywiz"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
import os
import secrets
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / '.env')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_tokens(user_id: str, email: str) -> Tuple[str, str, int]:
    """Create both access and refresh tokens"""
    token_data = {"sub": user_id, "email": email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return access_token, refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[dict]:
    """Verify an access token and return payload"""
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None


def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify a refresh token and return payload"""
    payload = decode_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None


def generate_verification_token() -> str:
    """Generate a random verification token"""
    return secrets.token_urlsafe(32)
