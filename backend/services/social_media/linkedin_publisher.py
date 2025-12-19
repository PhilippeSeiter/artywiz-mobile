from typing import List, Optional
import httpx
import os
from .base_publisher import BasePublisher, PublishResult, SocialAccount


class LinkedInPublisher(BasePublisher):
    """Publisher for LinkedIn Company Pages"""
    
    PLATFORM_NAME = "linkedin"
    API_VERSION = "202408"
    BASE_URL = "https://api.linkedin.com/v2"
    
    def __init__(self, access_token: str):
        super().__init__(access_token)
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "LinkedIn-Version": self.API_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json"
        }
    
    async def get_managed_accounts(self) -> List[SocialAccount]:
        """Get LinkedIn Company Pages the user administers"""
        try:
            # Get organizations the user can post on behalf of
            url = f"{self.BASE_URL}/organizationAcls"
            params = {
                "q": "roleAssignee",
                "role": "ADMINISTRATOR",
                "projection": "(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))"
            }
            
            response = await self.http_client.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            accounts = []
            for element in data.get("elements", []):
                org = element.get("organization~", {})
                org_id = org.get("id", "")
                
                # Get logo URL if available
                logo_url = None
                logo_v2 = org.get("logoV2", {})
                original = logo_v2.get("original~", {})
                streams = original.get("playableStreams", [])
                if streams:
                    logo_url = streams[0].get("url")
                
                accounts.append(SocialAccount(
                    id=f"li_org_{org_id}",
                    platform="linkedin",
                    account_type="company",
                    name=org.get("localizedName", ""),
                    username=org.get("vanityName"),
                    picture_url=logo_url,
                    access_token=self.access_token,
                    platform_account_id=str(org_id),
                    urn=f"urn:li:organization:{org_id}"
                ))
            
            return accounts
            
        except Exception as e:
            return []
    
    async def publish_image(self, organization_urn: str, image_url: str, caption: str) -> PublishResult:
        """Publish an image to a LinkedIn Company Page
        
        LinkedIn requires:
        1. Initialize image upload to get upload URL
        2. Upload image to LinkedIn CDN
        3. Create post with image reference
        """
        try:
            # For URL-based images, we can use the image URL directly in the post
            # LinkedIn will fetch and cache it
            
            # Create post with image
            post_url = f"{self.BASE_URL}/posts"
            post_data = {
                "author": organization_urn,
                "commentary": caption,
                "visibility": "PUBLIC",
                "distribution": {
                    "feedDistribution": "MAIN_FEED",
                    "targetEntities": [],
                    "thirdPartyDistributionChannels": []
                },
                "content": {
                    "article": {
                        "source": image_url,
                        "title": caption[:100] if len(caption) > 100 else caption
                    }
                },
                "lifecycleState": "PUBLISHED"
            }
            
            response = await self.http_client.post(
                post_url,
                headers=self.headers,
                json=post_data
            )
            response.raise_for_status()
            result = response.json()
            
            post_id = result.get("id", "")
            # Extract activity ID for URL
            activity_id = post_id.split(":")[-1] if ":" in post_id else post_id
            post_url_result = f"https://linkedin.com/feed/update/{post_id}"
            
            return self._create_success_result(post_id, post_url_result)
            
        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response else {}
            error_msg = error_data.get("message", str(e))
            return self._create_error_result(f"LinkedIn API error: {error_msg}")
        except Exception as e:
            return self._create_error_result(str(e))
    
    async def publish_text(self, organization_urn: str, content: str) -> PublishResult:
        """Publish a text-only post to LinkedIn Company Page"""
        try:
            post_url = f"{self.BASE_URL}/posts"
            post_data = {
                "author": organization_urn,
                "commentary": content,
                "visibility": "PUBLIC",
                "distribution": {
                    "feedDistribution": "MAIN_FEED",
                    "targetEntities": [],
                    "thirdPartyDistributionChannels": []
                },
                "lifecycleState": "PUBLISHED"
            }
            
            response = await self.http_client.post(
                post_url,
                headers=self.headers,
                json=post_data
            )
            response.raise_for_status()
            result = response.json()
            
            post_id = result.get("id", "")
            post_url_result = f"https://linkedin.com/feed/update/{post_id}"
            
            return self._create_success_result(post_id, post_url_result)
            
        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response else {}
            error_msg = error_data.get("message", str(e))
            return self._create_error_result(f"LinkedIn API error: {error_msg}")
        except Exception as e:
            return self._create_error_result(str(e))
    
    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Refresh LinkedIn access token"""
        client_id = os.getenv("LINKEDIN_CLIENT_ID")
        client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
        
        url = "https://www.linkedin.com/oauth/v2/accessToken"
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret
        }
        
        response = await self.http_client.post(url, data=data)
        response.raise_for_status()
        return response.json()
