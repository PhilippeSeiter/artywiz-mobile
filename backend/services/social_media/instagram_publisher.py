from typing import List, Optional
import httpx
import asyncio
from .base_publisher import BasePublisher, PublishResult, SocialAccount


class InstagramPublisher(BasePublisher):
    """Publisher for Instagram Business Accounts"""
    
    PLATFORM_NAME = "instagram"
    API_VERSION = "v20.0"
    BASE_URL = f"https://graph.facebook.com/{API_VERSION}"
    
    async def get_managed_accounts(self) -> List[SocialAccount]:
        """Get Instagram Business accounts via Facebook Pages"""
        # Instagram Business accounts are accessed via FacebookPublisher.get_managed_accounts()
        # They are returned as part of the Facebook Pages query
        return []
    
    async def publish_image(self, ig_user_id: str, image_url: str, caption: str) -> PublishResult:
        """Publish an image to Instagram Business Account
        
        Instagram Content Publishing API requires:
        1. Create a media container
        2. Wait for processing
        3. Publish the container
        """
        try:
            # Step 1: Create media container
            container_url = f"{self.BASE_URL}/{ig_user_id}/media"
            container_data = {
                "image_url": image_url,
                "caption": caption,
                "access_token": self.access_token
            }
            
            response = await self.http_client.post(container_url, data=container_data)
            response.raise_for_status()
            container = response.json()
            container_id = container.get("id")
            
            if not container_id:
                return self._create_error_result("Failed to create media container")
            
            # Step 2: Wait for container to be ready (poll status)
            await self._wait_for_container_ready(container_id)
            
            # Step 3: Publish the container
            publish_url = f"{self.BASE_URL}/{ig_user_id}/media_publish"
            publish_data = {
                "creation_id": container_id,
                "access_token": self.access_token
            }
            
            response = await self.http_client.post(publish_url, data=publish_data)
            response.raise_for_status()
            result = response.json()
            
            post_id = result.get("id")
            # Instagram post URLs follow this pattern
            post_url = f"https://instagram.com/p/{post_id}" if post_id else None
            
            return self._create_success_result(post_id, post_url)
            
        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response else {}
            error_msg = error_data.get("error", {}).get("message", str(e))
            return self._create_error_result(f"Instagram API error: {error_msg}")
        except Exception as e:
            return self._create_error_result(str(e))
    
    async def _wait_for_container_ready(self, container_id: str, max_retries: int = 10):
        """Poll until media container is ready for publishing"""
        for _ in range(max_retries):
            url = f"{self.BASE_URL}/{container_id}"
            params = {
                "fields": "status_code",
                "access_token": self.access_token
            }
            
            response = await self.http_client.get(url, params=params)
            data = response.json()
            status = data.get("status_code")
            
            if status == "FINISHED":
                return True
            elif status == "ERROR":
                raise Exception("Media container processing failed")
            
            await asyncio.sleep(2)  # Wait 2 seconds before retry
        
        raise Exception("Media container processing timeout")
    
    async def publish_text(self, ig_user_id: str, content: str) -> PublishResult:
        """Instagram doesn't support text-only posts"""
        return self._create_error_result("Instagram does not support text-only posts")
    
    async def publish_reel(self, ig_user_id: str, video_url: str, caption: str, 
                          cover_url: Optional[str] = None) -> PublishResult:
        """Publish a Reel to Instagram"""
        try:
            # Create Reel container
            container_url = f"{self.BASE_URL}/{ig_user_id}/media"
            container_data = {
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption,
                "access_token": self.access_token
            }
            
            if cover_url:
                container_data["cover_url"] = cover_url
            
            response = await self.http_client.post(container_url, data=container_data)
            response.raise_for_status()
            container = response.json()
            container_id = container.get("id")
            
            # Wait for processing
            await self._wait_for_container_ready(container_id, max_retries=30)  # Videos take longer
            
            # Publish
            publish_url = f"{self.BASE_URL}/{ig_user_id}/media_publish"
            publish_data = {
                "creation_id": container_id,
                "access_token": self.access_token
            }
            
            response = await self.http_client.post(publish_url, data=publish_data)
            response.raise_for_status()
            result = response.json()
            
            return self._create_success_result(result.get("id"))
            
        except Exception as e:
            return self._create_error_result(str(e))
    
    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Instagram uses Facebook's token system"""
        # Handled by FacebookPublisher
        pass
