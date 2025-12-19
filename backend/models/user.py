"""User model for Artywiz authentication"""
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SPONSOR = "sponsor"


class ProfileType(str, Enum):
    EQUIPE = "equipe"
    CLUB = "club"
    DISTRICT = "district"
    LIGUE = "ligue"
    SPONSOR = "sponsor"


class UserProfile(BaseModel):
    """Embedded profile in user document"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ProfileType
    name: str
    logo: Optional[str] = None  # Base64 encoded
    club_id: Optional[str] = None  # For equipe profiles
    numero: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserBase(BaseModel):
    """Base user fields"""
    email: EmailStr
    name: str
    

class UserCreate(UserBase):
    """User registration request"""
    password: str = Field(..., min_length=6)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit contenir au moins 6 caractères')
        return v


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update request"""
    name: Optional[str] = None
    avatar: Optional[str] = None  # Base64 encoded
    phone: Optional[str] = None


class UserInDB(UserBase):
    """User stored in database"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str
    role: UserRole = UserRole.USER
    is_active: bool = True
    is_verified: bool = False
    
    # Profile data
    profiles: List[UserProfile] = []
    active_profile_index: int = 0
    selected_themes: List[str] = []
    has_completed_onboarding: bool = False
    
    # OAuth connections
    oauth_providers: List[str] = []  # ['meta', 'linkedin', 'google']
    
    # Metadata
    avatar: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response (safe, no password)"""
    id: str
    email: str
    name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    profiles: List[UserProfile]
    active_profile_index: int
    selected_themes: List[str]
    has_completed_onboarding: bool
    oauth_providers: List[str]
    avatar: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str = Field(..., min_length=6)


class ProfileUpdateRequest(BaseModel):
    """Update user profiles"""
    profiles: List[UserProfile]
    active_profile_index: int = 0


class ThemesUpdateRequest(BaseModel):
    """Update selected themes"""
    themes: List[str]


class OnboardingCompleteRequest(BaseModel):
    """Complete onboarding"""
    profiles: List[UserProfile]
    themes: List[str]
