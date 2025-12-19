from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid


class SocialAccountDB(BaseModel):
    """Social account stored in MongoDB"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Artywiz user ID
    platform: str  # facebook, instagram, linkedin
    account_type: str  # page, business, company
    name: str
    username: Optional[str] = None
    picture_url: Optional[str] = None
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    platform_account_id: str
    urn: Optional[str] = None
    is_active: bool = True
    connected_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None


class SocialPostDB(BaseModel):
    """Published post record in MongoDB"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    account_id: str  # Reference to SocialAccountDB
    platform: str
    document_id: str  # Artywiz document ID that was published
    content: str
    image_url: Optional[str] = None
    platform_post_id: Optional[str] = None
    platform_post_url: Optional[str] = None
    status: str = "pending"  # pending, published, failed
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None


class ConnectAccountRequest(BaseModel):
    """Request to connect a social account"""
    platform: str  # facebook, instagram, linkedin
    auth_code: str
    redirect_uri: str


class PublishRequest(BaseModel):
    """Request to publish content to social media"""
    account_ids: List[str]  # List of social account IDs to publish to
    document_id: str  # Artywiz document ID
    caption: str
    image_url: str  # URL of the document mockup to publish


class PublishResponse(BaseModel):
    """Response from publish operation"""
    results: List[dict]  # List of results per platform
    total_success: int
    total_failed: int


class SocialAccountResponse(BaseModel):
    """Public response for social accounts (without tokens)"""
    id: str
    platform: str
    account_type: str
    name: str
    username: Optional[str] = None
    picture_url: Optional[str] = None
    is_active: bool
    connected_at: datetime
