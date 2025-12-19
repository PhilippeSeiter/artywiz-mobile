from abc import ABC, abstractmethod
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import httpx


class PublishResult(BaseModel):
    """Result of a publish operation"""
    success: bool
    platform: str
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    error_message: Optional[str] = None
    published_at: Optional[datetime] = None


class SocialAccount(BaseModel):
    """Connected social media account"""
    id: str
    platform: str  # facebook, instagram, linkedin
    account_type: str  # page, business, company
    name: str
    username: Optional[str] = None
    picture_url: Optional[str] = None
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    platform_account_id: str  # ID on the platform (page_id, etc.)
    urn: Optional[str] = None  # LinkedIn URN
    connected_at: datetime = datetime.utcnow()


class BasePublisher(ABC):
    """Abstract base class for social media publishers"""
    
    PLATFORM_NAME: str = "base"
    API_VERSION: str = "v20.0"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.http_client = httpx.AsyncClient(timeout=60.0)
    
    async def close(self):
        await self.http_client.aclose()
    
    @abstractmethod
    async def publish_image(self, account_id: str, image_url: str, caption: str) -> PublishResult:
        """Publish an image to the platform"""
        pass
    
    @abstractmethod
    async def publish_text(self, account_id: str, content: str) -> PublishResult:
        """Publish a text post to the platform"""
        pass
    
    @abstractmethod
    async def get_managed_accounts(self) -> List[SocialAccount]:
        """Get list of accounts/pages the user can manage"""
        pass
    
    @abstractmethod
    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Refresh an expired access token"""
        pass
    
    def _create_success_result(self, post_id: str, post_url: Optional[str] = None) -> PublishResult:
        return PublishResult(
            success=True,
            platform=self.PLATFORM_NAME,
            post_id=post_id,
            post_url=post_url,
            published_at=datetime.utcnow()
        )
    
    def _create_error_result(self, error_message: str) -> PublishResult:
        return PublishResult(
            success=False,
            platform=self.PLATFORM_NAME,
            error_message=error_message
        )
