from typing import List, Optional
import httpx
from .base_publisher import BasePublisher, PublishResult, SocialAccount


class FacebookPublisher(BasePublisher):
    """Publisher for Facebook Pages"""
    
    PLATFORM_NAME = "facebook"
    API_VERSION = "v20.0"
    BASE_URL = f"https://graph.facebook.com/{API_VERSION}"
    
    async def get_managed_accounts(self) -> List[SocialAccount]:
        """Get Facebook Pages the user manages"""
        try:
            url = f"{self.BASE_URL}/me/accounts"
            params = {
                "access_token": self.access_token,
                "fields": "id,name,access_token,picture,category,instagram_business_account{id,username,profile_picture_url}"
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            accounts = []
            for page in data.get("data", []):
                # Facebook Page
                accounts.append(SocialAccount(
                    id=f"fb_page_{page['id']}",
                    platform="facebook",
                    account_type="page",
                    name=page.get("name", ""),
                    picture_url=page.get("picture", {}).get("data", {}).get("url"),
                    access_token=page.get("access_token", self.access_token),
                    platform_account_id=page["id"]
                ))
                
                # Linked Instagram Business Account
                ig_account = page.get("instagram_business_account")
                if ig_account:
                    accounts.append(SocialAccount(
                        id=f"ig_business_{ig_account['id']}",
                        platform="instagram",
                        account_type="business",
                        name=ig_account.get("username", f"Instagram ({page.get('name')})"),
                        username=ig_account.get("username"),
                        picture_url=ig_account.get("profile_picture_url"),
                        access_token=page.get("access_token", self.access_token),
                        platform_account_id=ig_account["id"]
                    ))
            
            return accounts
            
        except Exception as e:
            return []
    
    async def publish_image(self, page_id: str, image_url: str, caption: str) -> PublishResult:
        """Publish an image to a Facebook Page"""
        try:
            url = f"{self.BASE_URL}/{page_id}/photos"
            data = {
                "url": image_url,
                "message": caption,
                "access_token": self.access_token
            }
            
            response = await self.http_client.post(url, data=data)
            response.raise_for_status()
            result = response.json()
            
            post_id = result.get("id") or result.get("post_id")
            post_url = f"https://facebook.com/{post_id}" if post_id else None
            
            return self._create_success_result(post_id, post_url)
            
        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response else {}
            error_msg = error_data.get("error", {}).get("message", str(e))
            return self._create_error_result(f"Facebook API error: {error_msg}")
        except Exception as e:
            return self._create_error_result(str(e))
    
    async def publish_text(self, page_id: str, content: str) -> PublishResult:
        """Publish a text post to a Facebook Page"""
        try:
            url = f"{self.BASE_URL}/{page_id}/feed"
            data = {
                "message": content,
                "access_token": self.access_token
            }
            
            response = await self.http_client.post(url, data=data)
            response.raise_for_status()
            result = response.json()
            
            post_id = result.get("id")
            post_url = f"https://facebook.com/{post_id}" if post_id else None
            
            return self._create_success_result(post_id, post_url)
            
        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response else {}
            error_msg = error_data.get("error", {}).get("message", str(e))
            return self._create_error_result(f"Facebook API error: {error_msg}")
        except Exception as e:
            return self._create_error_result(str(e))
    
    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Exchange short-lived token for long-lived token"""
        # Note: Facebook uses token exchange, not refresh tokens
        # This requires app_id and app_secret from environment
        import os
        app_id = os.getenv("FACEBOOK_APP_ID")
        app_secret = os.getenv("FACEBOOK_APP_SECRET")
        
        url = f"{self.BASE_URL}/oauth/access_token"
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": refresh_token
        }
        
        response = await self.http_client.get(url, params=params)
        response.raise_for_status()
        return response.json()
