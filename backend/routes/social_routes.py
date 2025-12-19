from fastapi import APIRouter, HTTPException, Depends
from typing import List
import os
from datetime import datetime

from models.social_accounts import (
    SocialAccountDB,
    SocialPostDB,
    ConnectAccountRequest,
    PublishRequest,
    PublishResponse,
    SocialAccountResponse
)
from services.social_media import (
    FacebookPublisher,
    InstagramPublisher,
    LinkedInPublisher
)

router = APIRouter(prefix="/social", tags=["Social Media"])

# These will be injected from server.py
db = None

def set_db(database):
    global db
    db = database


@router.get("/accounts", response_model=List[SocialAccountResponse])
async def get_connected_accounts(user_id: str = "default_user"):
    """Get all connected social media accounts for a user"""
    accounts = await db.social_accounts.find({"user_id": user_id, "is_active": True}).to_list(100)
    return [SocialAccountResponse(**acc) for acc in accounts]


@router.post("/connect")
async def connect_social_account(request: ConnectAccountRequest, user_id: str = "default_user"):
    """Connect a new social media account via OAuth"""
    try:
        if request.platform == "facebook":
            # Exchange code for token
            app_id = os.getenv("FACEBOOK_APP_ID")
            app_secret = os.getenv("FACEBOOK_APP_SECRET")
            
            if not app_id or not app_secret:
                raise HTTPException(status_code=500, detail="Facebook credentials not configured")
            
            import httpx
            async with httpx.AsyncClient() as client:
                token_url = f"https://graph.facebook.com/v20.0/oauth/access_token"
                params = {
                    "client_id": app_id,
                    "client_secret": app_secret,
                    "redirect_uri": request.redirect_uri,
                    "code": request.auth_code
                }
                response = await client.get(token_url, params=params)
                response.raise_for_status()
                token_data = response.json()
            
            access_token = token_data.get("access_token")
            
            # Get managed pages
            publisher = FacebookPublisher(access_token)
            accounts = await publisher.get_managed_accounts()
            await publisher.close()
            
            # Store accounts in database
            stored_accounts = []
            for acc in accounts:
                account_db = SocialAccountDB(
                    user_id=user_id,
                    platform=acc.platform,
                    account_type=acc.account_type,
                    name=acc.name,
                    username=acc.username,
                    picture_url=acc.picture_url,
                    access_token=acc.access_token,
                    platform_account_id=acc.platform_account_id
                )
                
                # Upsert account
                await db.social_accounts.update_one(
                    {
                        "user_id": user_id,
                        "platform": acc.platform,
                        "platform_account_id": acc.platform_account_id
                    },
                    {"$set": account_db.dict()},
                    upsert=True
                )
                stored_accounts.append(account_db)
            
            return {
                "success": True,
                "accounts_connected": len(stored_accounts),
                "accounts": [SocialAccountResponse(**a.dict()) for a in stored_accounts]
            }
        
        elif request.platform == "linkedin":
            client_id = os.getenv("LINKEDIN_CLIENT_ID")
            client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
            
            if not client_id or not client_secret:
                raise HTTPException(status_code=500, detail="LinkedIn credentials not configured")
            
            import httpx
            async with httpx.AsyncClient() as client:
                token_url = "https://www.linkedin.com/oauth/v2/accessToken"
                data = {
                    "grant_type": "authorization_code",
                    "code": request.auth_code,
                    "redirect_uri": request.redirect_uri,
                    "client_id": client_id,
                    "client_secret": client_secret
                }
                response = await client.post(token_url, data=data)
                response.raise_for_status()
                token_data = response.json()
            
            access_token = token_data.get("access_token")
            
            # Get managed company pages
            publisher = LinkedInPublisher(access_token)
            accounts = await publisher.get_managed_accounts()
            await publisher.close()
            
            # Store accounts
            stored_accounts = []
            for acc in accounts:
                account_db = SocialAccountDB(
                    user_id=user_id,
                    platform=acc.platform,
                    account_type=acc.account_type,
                    name=acc.name,
                    username=acc.username,
                    picture_url=acc.picture_url,
                    access_token=acc.access_token,
                    platform_account_id=acc.platform_account_id,
                    urn=acc.urn
                )
                
                await db.social_accounts.update_one(
                    {
                        "user_id": user_id,
                        "platform": acc.platform,
                        "platform_account_id": acc.platform_account_id
                    },
                    {"$set": account_db.dict()},
                    upsert=True
                )
                stored_accounts.append(account_db)
            
            return {
                "success": True,
                "accounts_connected": len(stored_accounts),
                "accounts": [SocialAccountResponse(**a.dict()) for a in stored_accounts]
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported platform: {request.platform}")
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/publish", response_model=PublishResponse)
async def publish_to_social_media(request: PublishRequest, user_id: str = "default_user"):
    """Publish content to selected social media accounts"""
    results = []
    success_count = 0
    fail_count = 0
    
    for account_id in request.account_ids:
        # Get account from database
        account = await db.social_accounts.find_one({
            "id": account_id,
            "user_id": user_id,
            "is_active": True
        })
        
        if not account:
            results.append({
                "account_id": account_id,
                "success": False,
                "error": "Account not found"
            })
            fail_count += 1
            continue
        
        # Create post record
        post_record = SocialPostDB(
            user_id=user_id,
            account_id=account_id,
            platform=account["platform"],
            document_id=request.document_id,
            content=request.caption,
            image_url=request.image_url,
            status="pending"
        )
        await db.social_posts.insert_one(post_record.dict())
        
        try:
            # Publish based on platform
            if account["platform"] == "facebook":
                publisher = FacebookPublisher(account["access_token"])
                result = await publisher.publish_image(
                    account["platform_account_id"],
                    request.image_url,
                    request.caption
                )
                await publisher.close()
            
            elif account["platform"] == "instagram":
                publisher = InstagramPublisher(account["access_token"])
                result = await publisher.publish_image(
                    account["platform_account_id"],
                    request.image_url,
                    request.caption
                )
                await publisher.close()
            
            elif account["platform"] == "linkedin":
                publisher = LinkedInPublisher(account["access_token"])
                org_urn = account.get("urn") or f"urn:li:organization:{account['platform_account_id']}"
                result = await publisher.publish_image(
                    org_urn,
                    request.image_url,
                    request.caption
                )
                await publisher.close()
            
            else:
                result = None
            
            if result and result.success:
                # Update post record
                await db.social_posts.update_one(
                    {"id": post_record.id},
                    {
                        "$set": {
                            "status": "published",
                            "platform_post_id": result.post_id,
                            "platform_post_url": result.post_url,
                            "published_at": datetime.utcnow()
                        }
                    }
                )
                
                # Update account last used
                await db.social_accounts.update_one(
                    {"id": account_id},
                    {"$set": {"last_used_at": datetime.utcnow()}}
                )
                
                results.append({
                    "account_id": account_id,
                    "platform": account["platform"],
                    "account_name": account["name"],
                    "success": True,
                    "post_url": result.post_url
                })
                success_count += 1
            else:
                error_msg = result.error_message if result else "Unknown error"
                await db.social_posts.update_one(
                    {"id": post_record.id},
                    {
                        "$set": {
                            "status": "failed",
                            "error_message": error_msg
                        }
                    }
                )
                results.append({
                    "account_id": account_id,
                    "platform": account["platform"],
                    "account_name": account["name"],
                    "success": False,
                    "error": error_msg
                })
                fail_count += 1
        
        except Exception as e:
            await db.social_posts.update_one(
                {"id": post_record.id},
                {
                    "$set": {
                        "status": "failed",
                        "error_message": str(e)
                    }
                }
            )
            results.append({
                "account_id": account_id,
                "platform": account["platform"],
                "success": False,
                "error": str(e)
            })
            fail_count += 1
    
    return PublishResponse(
        results=results,
        total_success=success_count,
        total_failed=fail_count
    )


@router.delete("/accounts/{account_id}")
async def disconnect_account(account_id: str, user_id: str = "default_user"):
    """Disconnect a social media account"""
    result = await db.social_accounts.update_one(
        {"id": account_id, "user_id": user_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {"success": True, "message": "Account disconnected"}


@router.get("/posts")
async def get_publish_history(user_id: str = "default_user", limit: int = 50):
    """Get publishing history for a user"""
    posts = await db.social_posts.find(
        {"user_id": user_id},
        {"_id": 0}  # Exclude MongoDB _id field
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return posts


@router.get("/insights/summary")
async def get_insights_summary(user_id: str = "default_user"):
    """Get summary of all post insights for a user"""
    posts = await db.social_posts.find({
        "user_id": user_id,
        "status": "published",
        "insights": {"$exists": True}
    }).to_list(100)
    
    total_likes = 0
    total_comments = 0
    total_shares = 0
    total_impressions = 0
    total_clicks = 0
    
    for post in posts:
        insights = post.get("insights", {})
        total_likes += insights.get("likes", 0)
        total_comments += insights.get("comments", 0)
        total_shares += insights.get("shares", 0)
        total_impressions += insights.get("impressions", 0)
        total_clicks += insights.get("clicks", 0)
    
    return {
        "total_posts": len(posts),
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_shares": total_shares,
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "engagement_rate": round((total_likes + total_comments + total_shares) / max(total_impressions, 1) * 100, 2)
    }


@router.get("/insights/{post_id}")
async def get_post_insights(post_id: str, user_id: str = "default_user"):
    """Get insights (likes, views, clicks, comments) for a published post"""
    import httpx
    
    # Find the post in database
    post = await db.social_posts.find_one({
        "id": post_id,
        "user_id": user_id,
        "status": "published"
    })
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    platform_post_id = post.get("platform_post_id")
    platform = post.get("platform")
    
    if not platform_post_id:
        return {"error": "No platform post ID available", "insights": None}
    
    # Get the account for access token
    account = await db.social_accounts.find_one({
        "id": post.get("account_id"),
        "user_id": user_id,
        "is_active": True
    })
    
    if not account:
        return {"error": "Account not found or disconnected", "insights": None}
    
    access_token = account.get("access_token")
    insights = {"platform": platform, "post_id": platform_post_id}
    
    try:
        async with httpx.AsyncClient() as client:
            if platform == "facebook":
                # Get Facebook post insights
                url = f"https://graph.facebook.com/v20.0/{platform_post_id}"
                params = {
                    "fields": "likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_clicks,post_reactions_by_type_total)",
                    "access_token": access_token
                }
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    likes_count = data.get("likes", {}).get("summary", {}).get("total_count", 0)
                    comments_count = data.get("comments", {}).get("summary", {}).get("total_count", 0)
                    shares_count = data.get("shares", {}).get("count", 0) if data.get("shares") else 0
                    
                    # Parse insights metrics
                    impressions = 0
                    clicks = 0
                    reactions = {}
                    
                    for insight in data.get("insights", {}).get("data", []):
                        if insight.get("name") == "post_impressions":
                            impressions = insight.get("values", [{}])[0].get("value", 0)
                        elif insight.get("name") == "post_clicks":
                            clicks = insight.get("values", [{}])[0].get("value", 0)
                        elif insight.get("name") == "post_reactions_by_type_total":
                            reactions = insight.get("values", [{}])[0].get("value", {})
                    
                    insights["data"] = {
                        "likes": likes_count,
                        "comments": comments_count,
                        "shares": shares_count,
                        "impressions": impressions,
                        "clicks": clicks,
                        "reactions": reactions
                    }
                else:
                    insights["error"] = f"Facebook API error: {response.status_code}"
            
            elif platform == "instagram":
                # Get Instagram media insights
                url = f"https://graph.facebook.com/v20.0/{platform_post_id}/insights"
                params = {
                    "metric": "impressions,reach,likes,comments,saved,shares",
                    "access_token": access_token
                }
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    metrics = {}
                    for metric in data.get("data", []):
                        name = metric.get("name")
                        value = metric.get("values", [{}])[0].get("value", 0)
                        metrics[name] = value
                    
                    insights["data"] = {
                        "likes": metrics.get("likes", 0),
                        "comments": metrics.get("comments", 0),
                        "shares": metrics.get("shares", 0),
                        "saves": metrics.get("saved", 0),
                        "impressions": metrics.get("impressions", 0),
                        "reach": metrics.get("reach", 0)
                    }
                else:
                    # Try basic endpoint for like/comment counts
                    basic_url = f"https://graph.facebook.com/v20.0/{platform_post_id}"
                    basic_params = {
                        "fields": "like_count,comments_count",
                        "access_token": access_token
                    }
                    basic_response = await client.get(basic_url, params=basic_params)
                    
                    if basic_response.status_code == 200:
                        basic_data = basic_response.json()
                        insights["data"] = {
                            "likes": basic_data.get("like_count", 0),
                            "comments": basic_data.get("comments_count", 0)
                        }
                    else:
                        insights["error"] = f"Instagram API error: {response.status_code}"
            
            elif platform == "linkedin":
                # Get LinkedIn post analytics
                # Note: LinkedIn API requires specific permissions and URN format
                urn = f"urn:li:share:{platform_post_id}"
                
                url = f"https://api.linkedin.com/v2/socialActions/{urn}"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0"
                }
                
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    insights["data"] = {
                        "likes": data.get("likesSummary", {}).get("totalLikes", 0),
                        "comments": data.get("commentsSummary", {}).get("totalFirstLevelComments", 0)
                    }
                else:
                    insights["error"] = f"LinkedIn API error: {response.status_code}"
            
            else:
                insights["error"] = f"Unsupported platform: {platform}"
        
        # Cache insights in database
        if "data" in insights:
            await db.social_posts.update_one(
                {"id": post_id},
                {"$set": {
                    "insights": insights["data"],
                    "insights_updated_at": datetime.utcnow()
                }}
            )
        
        return insights
        
    except Exception as e:
        return {"error": str(e), "insights": None}
