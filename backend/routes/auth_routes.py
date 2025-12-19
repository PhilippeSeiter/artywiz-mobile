"""OAuth routes for Meta (Facebook/Instagram) authentication"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse, HTMLResponse
import os
import httpx
from datetime import datetime, timedelta
from urllib.parse import urlencode
import secrets
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Database reference (will be set from server.py)
db = None

def set_db(database):
    global db
    db = database

# Meta App Config - read at runtime
def get_meta_config():
    return {
        "app_id": os.getenv("FACEBOOK_APP_ID"),
        "app_secret": os.getenv("FACEBOOK_APP_SECRET"),
    }

GRAPH_API_VERSION = "v20.0"

# Scopes needed for publishing (including WhatsApp Business)
META_SCOPES = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
    "whatsapp_business_management",
    "whatsapp_business_messaging"
]


@router.get("/meta/start")
async def start_meta_auth(
    user_id: str = "default_user",
    redirect_uri: str = Query(..., description="Backend callback URL for Meta to redirect to")
):
    """Start Meta OAuth flow - returns the authorization URL"""
    config = get_meta_config()
    if not config["app_id"]:
        raise HTTPException(status_code=500, detail="Meta App ID not configured")
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store state in database for verification
    # redirect_uri should be the backend callback URL (e.g., /api/auth/meta/callback)
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": user_id,
        "redirect_uri": redirect_uri,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    })
    
    # Build authorization URL
    auth_params = {
        "client_id": config["app_id"],
        "redirect_uri": redirect_uri,
        "scope": ",".join(META_SCOPES),
        "response_type": "code",
        "state": state
    }
    
    auth_url = f"https://www.facebook.com/{GRAPH_API_VERSION}/dialog/oauth?{urlencode(auth_params)}"
    
    return {
        "auth_url": auth_url,
        "state": state
    }


@router.get("/meta/callback")
async def meta_oauth_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None)
):
    """Handle Meta OAuth callback"""
    if error:
        return HTMLResponse(
            content=f"<html><body><h2>Erreur de connexion</h2><p>{error_description}</p><script>window.close();</script></body></html>",
            status_code=400
        )
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    
    # Verify state
    stored_state = await db.oauth_states.find_one({
        "state": state,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid or expired state")
    
    user_id = stored_state["user_id"]
    redirect_uri = stored_state["redirect_uri"]
    
    # Clean up used state
    await db.oauth_states.delete_one({"state": state})
    
    # Exchange code for access token
    config = get_meta_config()
    async with httpx.AsyncClient() as client:
        token_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token"
        token_params = {
            "client_id": config["app_id"],
            "client_secret": config["app_secret"],
            "redirect_uri": redirect_uri,
            "code": code
        }
        
        response = await client.get(token_url, params=token_params)
        
        if response.status_code != 200:
            error_data = response.json()
            error_msg = error_data.get("error", {}).get("message", "Token exchange failed")
            return HTMLResponse(
                content=f"<html><body><h2>Erreur</h2><p>{error_msg}</p></body></html>",
                status_code=400
            )
        
        token_data = response.json()
        short_lived_token = token_data.get("access_token")
        
        # Exchange for long-lived token
        long_token_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token"
        long_token_params = {
            "grant_type": "fb_exchange_token",
            "client_id": config["app_id"],
            "client_secret": config["app_secret"],
            "fb_exchange_token": short_lived_token
        }
        
        long_response = await client.get(long_token_url, params=long_token_params)
        if long_response.status_code == 200:
            long_token_data = long_response.json()
            access_token = long_token_data.get("access_token", short_lived_token)
            expires_in = long_token_data.get("expires_in", 3600)
        else:
            access_token = short_lived_token
            expires_in = 3600
        
        # Get user's Pages and Instagram accounts
        pages_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/me/accounts"
        pages_params = {
            "access_token": access_token,
            "fields": "id,name,access_token,picture,category,instagram_business_account{id,username,profile_picture_url,name}"
        }
        
        pages_response = await client.get(pages_url, params=pages_params)
        pages_data = pages_response.json() if pages_response.status_code == 200 else {"data": []}
        
        accounts_saved = []
        
        for page in pages_data.get("data", []):
            # Save Facebook Page
            fb_account = {
                "id": f"fb_page_{page['id']}",
                "user_id": user_id,
                "platform": "facebook",
                "account_type": "page",
                "name": page.get("name", "Page Facebook"),
                "username": None,
                "picture_url": page.get("picture", {}).get("data", {}).get("url"),
                "access_token": page.get("access_token", access_token),
                "platform_account_id": page["id"],
                "is_active": True,
                "is_default": True,
                "connected_at": datetime.utcnow(),
                "token_expires_at": datetime.utcnow() + timedelta(seconds=expires_in)
            }
            
            await db.social_accounts.update_one(
                {"user_id": user_id, "platform": "facebook", "platform_account_id": page["id"]},
                {"$set": fb_account},
                upsert=True
            )
            accounts_saved.append(fb_account["name"])
            
            # Save linked Instagram Business Account
            ig_account = page.get("instagram_business_account")
            if ig_account:
                ig_data = {
                    "id": f"ig_business_{ig_account['id']}",
                    "user_id": user_id,
                    "platform": "instagram",
                    "account_type": "business",
                    "name": ig_account.get("name") or ig_account.get("username") or f"Instagram ({page.get('name')})",
                    "username": ig_account.get("username"),
                    "picture_url": ig_account.get("profile_picture_url"),
                    "access_token": page.get("access_token", access_token),
                    "platform_account_id": ig_account["id"],
                    "linked_facebook_page_id": page["id"],
                    "is_active": True,
                    "is_default": True,
                    "connected_at": datetime.utcnow(),
                    "token_expires_at": datetime.utcnow() + timedelta(seconds=expires_in)
                }
                
                await db.social_accounts.update_one(
                    {"user_id": user_id, "platform": "instagram", "platform_account_id": ig_account["id"]},
                    {"$set": ig_data},
                    upsert=True
                )
                accounts_saved.append(ig_data["name"])
        
        # Try to get WhatsApp Business accounts
        try:
            # Get user's businesses
            businesses_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/me/businesses"
            businesses_params = {
                "access_token": access_token,
                "fields": "id,name"
            }
            businesses_response = await client.get(businesses_url, params=businesses_params)
            
            if businesses_response.status_code == 200:
                businesses_data = businesses_response.json()
                
                for business in businesses_data.get("data", []):
                    # Get WhatsApp Business Account for each business
                    waba_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{business['id']}/owned_whatsapp_business_accounts"
                    waba_params = {
                        "access_token": access_token,
                        "fields": "id,name,currency,timezone_id"
                    }
                    waba_response = await client.get(waba_url, params=waba_params)
                    
                    if waba_response.status_code == 200:
                        waba_data = waba_response.json()
                        
                        for waba in waba_data.get("data", []):
                            # Get phone numbers for this WABA
                            phones_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{waba['id']}/phone_numbers"
                            phones_params = {
                                "access_token": access_token,
                                "fields": "id,display_phone_number,verified_name,quality_rating"
                            }
                            phones_response = await client.get(phones_url, params=phones_params)
                            
                            if phones_response.status_code == 200:
                                phones_data = phones_response.json()
                                
                                for phone in phones_data.get("data", []):
                                    wa_account = {
                                        "id": f"wa_business_{phone['id']}",
                                        "user_id": user_id,
                                        "platform": "whatsapp",
                                        "account_type": "business",
                                        "name": phone.get("verified_name", f"WhatsApp ({phone.get('display_phone_number', 'N/A')})"),
                                        "username": phone.get("display_phone_number"),
                                        "picture_url": None,
                                        "access_token": access_token,
                                        "platform_account_id": phone["id"],
                                        "waba_id": waba["id"],
                                        "business_id": business["id"],
                                        "quality_rating": phone.get("quality_rating"),
                                        "is_active": True,
                                        "is_default": True,
                                        "connected_at": datetime.utcnow(),
                                        "token_expires_at": datetime.utcnow() + timedelta(seconds=expires_in)
                                    }
                                    
                                    await db.social_accounts.update_one(
                                        {"user_id": user_id, "platform": "whatsapp", "platform_account_id": phone["id"]},
                                        {"$set": wa_account},
                                        upsert=True
                                    )
                                    accounts_saved.append(f"WhatsApp: {phone.get('display_phone_number', 'N/A')}")
        except Exception as e:
            # WhatsApp access might not be available, that's okay
            print(f"WhatsApp access not available: {e}")
    
    # Return success page that will close and notify parent
    accounts_list = ", ".join(accounts_saved) if accounts_saved else "Aucun compte trouvé"
    success_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   display: flex; justify-content: center; align-items: center; height: 100vh; 
                   margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
            .card {{ background: white; padding: 40px; border-radius: 16px; text-align: center; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px; }}
            h2 {{ color: #22c55e; margin-bottom: 16px; }}
            p {{ color: #666; line-height: 1.6; }}
            .accounts {{ background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 16px 0; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>✅ Connexion réussie !</h2>
            <p>Vos comptes ont été connectés :</p>
            <div class="accounts">{accounts_list}</div>
            <p>Vous pouvez fermer cette fenêtre.</p>
            <script>
                setTimeout(function() {{
                    if (window.opener) {{
                        window.opener.postMessage({{ type: 'META_AUTH_SUCCESS', accounts: {len(accounts_saved)} }}, '*');
                    }}
                    window.close();
                }}, 2000);
            </script>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=success_html)


@router.get("/meta/status")
async def get_meta_connection_status(user_id: str = "default_user"):
    """Check if user has connected Meta accounts (Facebook, Instagram, WhatsApp)"""
    # Optimized query with projection
    accounts = await db.social_accounts.find(
        {
            "user_id": user_id,
            "platform": {"$in": ["facebook", "instagram", "whatsapp"]},
            "is_active": True
        },
        {"_id": 0, "id": 1, "name": 1, "platform": 1, "picture_url": 1, "is_default": 1}
    ).limit(100).to_list(100)
    
    facebook_accounts = [a for a in accounts if a["platform"] == "facebook"]
    instagram_accounts = [a for a in accounts if a["platform"] == "instagram"]
    whatsapp_accounts = [a for a in accounts if a["platform"] == "whatsapp"]
    
    return {
        "connected": len(accounts) > 0,
        "facebook": {
            "connected": len(facebook_accounts) > 0,
            "accounts": [{
                "id": a["id"],
                "name": a["name"],
                "picture_url": a.get("picture_url"),
                "is_default": a.get("is_default", False)
            } for a in facebook_accounts]
        },
        "instagram": {
            "connected": len(instagram_accounts) > 0,
            "accounts": [{
                "id": a["id"],
                "name": a["name"],
                "username": a.get("username"),
                "picture_url": a.get("picture_url"),
                "is_default": a.get("is_default", False)
            } for a in instagram_accounts]
        },
        "whatsapp": {
            "connected": len(whatsapp_accounts) > 0,
            "accounts": [{
                "id": a["id"],
                "name": a["name"],
                "phone": a.get("username"),
                "quality_rating": a.get("quality_rating"),
                "is_default": a.get("is_default", False)
            } for a in whatsapp_accounts]
        }
    }


@router.post("/meta/disconnect")
async def disconnect_meta(user_id: str = "default_user"):
    """Disconnect all Meta accounts for a user"""
    result = await db.social_accounts.update_many(
        {"user_id": user_id, "platform": {"$in": ["facebook", "instagram"]}},
        {"$set": {"is_active": False}}
    )
    
    return {
        "success": True,
        "disconnected_count": result.modified_count
    }


@router.post("/meta/set-default")
async def set_default_accounts(
    user_id: str = "default_user",
    facebook_account_id: str = None,
    instagram_account_id: str = None
):
    """Set default accounts for publishing"""
    # Reset all defaults first
    await db.social_accounts.update_many(
        {"user_id": user_id, "platform": {"$in": ["facebook", "instagram"]}},
        {"$set": {"is_default": False}}
    )
    
    # Set new defaults
    if facebook_account_id:
        await db.social_accounts.update_one(
            {"user_id": user_id, "id": facebook_account_id},
            {"$set": {"is_default": True}}
        )
    
    if instagram_account_id:
        await db.social_accounts.update_one(
            {"user_id": user_id, "id": instagram_account_id},
            {"$set": {"is_default": True}}
        )
    
    return {"success": True}


# ============================================
# LINKEDIN OAuth Routes
# ============================================

def get_linkedin_config():
    return {
        "client_id": os.getenv("LINKEDIN_CLIENT_ID"),
        "client_secret": os.getenv("LINKEDIN_CLIENT_SECRET"),
    }

# LinkedIn scopes for company page posting
LINKEDIN_SCOPES = [
    "openid",
    "profile",
    "w_member_social",
    "r_organization_social",
    "w_organization_social",
    "rw_organization_admin"
]


@router.get("/linkedin/start")
async def start_linkedin_auth(
    user_id: str = "default_user",
    redirect_uri: str = Query(..., description="Frontend callback URL")
):
    """Start LinkedIn OAuth flow"""
    config = get_linkedin_config()
    if not config["client_id"]:
        raise HTTPException(status_code=500, detail="LinkedIn Client ID not configured")
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store state in database
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": user_id,
        "redirect_uri": redirect_uri,
        "provider": "linkedin",
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    })
    
    # Build authorization URL
    auth_params = {
        "response_type": "code",
        "client_id": config["client_id"],
        "redirect_uri": redirect_uri,
        "scope": " ".join(LINKEDIN_SCOPES),
        "state": state
    }
    
    auth_url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(auth_params)}"
    
    return {
        "auth_url": auth_url,
        "state": state
    }


@router.get("/linkedin/callback")
async def linkedin_oauth_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None)
):
    """Handle LinkedIn OAuth callback"""
    if error:
        return HTMLResponse(
            content=f"<html><body><h2>Erreur de connexion</h2><p>{error_description}</p><script>window.close();</script></body></html>",
            status_code=400
        )
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    
    # Verify state
    stored_state = await db.oauth_states.find_one({
        "state": state,
        "provider": "linkedin",
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid or expired state")
    
    user_id = stored_state["user_id"]
    redirect_uri = stored_state["redirect_uri"]
    
    # Clean up used state
    await db.oauth_states.delete_one({"state": state})
    
    config = get_linkedin_config()
    
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": config["client_id"],
            "client_secret": config["client_secret"]
        }
        
        response = await client.post(token_url, data=token_data, headers={
            "Content-Type": "application/x-www-form-urlencoded"
        })
        
        if response.status_code != 200:
            error_data = response.json()
            error_msg = error_data.get("error_description", "Token exchange failed")
            return HTMLResponse(
                content=f"<html><body><h2>Erreur</h2><p>{error_msg}</p></body></html>",
                status_code=400
            )
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 3600)
        
        # Get user profile
        profile_url = "https://api.linkedin.com/v2/userinfo"
        profile_response = await client.get(profile_url, headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        profile_data = {}
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
        
        # Get user's organization admin pages
        orgs_url = "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))"
        orgs_response = await client.get(orgs_url, headers={
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0"
        })
        
        accounts_saved = []
        
        # Save personal profile
        user_sub = profile_data.get("sub", "")
        user_name = profile_data.get("name", "Profil LinkedIn")
        
        personal_account = {
            "id": f"li_personal_{user_sub}",
            "user_id": user_id,
            "platform": "linkedin",
            "account_type": "personal",
            "name": user_name,
            "username": profile_data.get("email"),
            "picture_url": profile_data.get("picture"),
            "access_token": access_token,
            "platform_account_id": user_sub,
            "urn": f"urn:li:person:{user_sub}",
            "is_active": True,
            "is_default": True,
            "connected_at": datetime.utcnow(),
            "token_expires_at": datetime.utcnow() + timedelta(seconds=expires_in)
        }
        
        await db.social_accounts.update_one(
            {"user_id": user_id, "platform": "linkedin", "platform_account_id": user_sub},
            {"$set": personal_account},
            upsert=True
        )
        accounts_saved.append(user_name)
        
        # Save organization pages if available
        if orgs_response.status_code == 200:
            orgs_data = orgs_response.json()
            for element in orgs_data.get("elements", []):
                org = element.get("organization~", {})
                org_id = org.get("id", "")
                org_name = org.get("localizedName", "Page LinkedIn")
                
                # Get logo URL if available
                logo_url = None
                logo_v2 = org.get("logoV2", {})
                original = logo_v2.get("original~", {})
                streams = original.get("playableStreams", [])
                if streams:
                    logo_url = streams[0].get("url")
                
                org_account = {
                    "id": f"li_org_{org_id}",
                    "user_id": user_id,
                    "platform": "linkedin",
                    "account_type": "company",
                    "name": org_name,
                    "picture_url": logo_url,
                    "access_token": access_token,
                    "platform_account_id": str(org_id),
                    "urn": f"urn:li:organization:{org_id}",
                    "is_active": True,
                    "is_default": False,
                    "connected_at": datetime.utcnow(),
                    "token_expires_at": datetime.utcnow() + timedelta(seconds=expires_in)
                }
                
                await db.social_accounts.update_one(
                    {"user_id": user_id, "platform": "linkedin", "platform_account_id": str(org_id)},
                    {"$set": org_account},
                    upsert=True
                )
                accounts_saved.append(org_name)
    
    # Return success page
    accounts_list = ", ".join(accounts_saved) if accounts_saved else "Aucun compte trouvé"
    success_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   display: flex; justify-content: center; align-items: center; height: 100vh; 
                   margin: 0; background: linear-gradient(135deg, #0A66C2 0%, #004182 100%); }}
            .card {{ background: white; padding: 40px; border-radius: 16px; text-align: center; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px; }}
            h2 {{ color: #22c55e; margin-bottom: 16px; }}
            p {{ color: #666; line-height: 1.6; }}
            .accounts {{ background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 16px 0; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>✅ Connexion LinkedIn réussie !</h2>
            <p>Vos comptes ont été connectés :</p>
            <div class="accounts">{accounts_list}</div>
            <p>Vous pouvez fermer cette fenêtre.</p>
            <script>
                setTimeout(function() {{
                    if (window.opener) {{
                        window.opener.postMessage({{ type: 'LINKEDIN_AUTH_SUCCESS', accounts: {len(accounts_saved)} }}, '*');
                    }}
                    window.close();
                }}, 2000);
            </script>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=success_html)


@router.get("/linkedin/status")
async def get_linkedin_connection_status(user_id: str = "default_user"):
    """Check if user has connected LinkedIn accounts"""
    accounts = await db.social_accounts.find({
        "user_id": user_id,
        "platform": "linkedin",
        "is_active": True
    }).to_list(100)
    
    personal_accounts = [a for a in accounts if a.get("account_type") == "personal"]
    company_accounts = [a for a in accounts if a.get("account_type") == "company"]
    
    return {
        "connected": len(accounts) > 0,
        "personal": {
            "connected": len(personal_accounts) > 0,
            "accounts": [{
                "id": a["id"],
                "name": a["name"],
                "picture_url": a.get("picture_url"),
                "is_default": a.get("is_default", False)
            } for a in personal_accounts]
        },
        "company": {
            "connected": len(company_accounts) > 0,
            "accounts": [{
                "id": a["id"],
                "name": a["name"],
                "picture_url": a.get("picture_url"),
                "is_default": a.get("is_default", False)
            } for a in company_accounts]
        }
    }


@router.post("/linkedin/disconnect")
async def disconnect_linkedin(user_id: str = "default_user"):
    """Disconnect all LinkedIn accounts for a user"""
    result = await db.social_accounts.update_many(
        {"user_id": user_id, "platform": "linkedin"},
        {"$set": {"is_active": False}}
    )
    
    return {
        "success": True,
        "disconnected_count": result.modified_count
    }


@router.post("/linkedin/set-default")
async def set_linkedin_default_account(
    user_id: str = "default_user",
    account_id: str = None
):
    """Set default LinkedIn account for publishing"""
    # Reset all LinkedIn defaults
    await db.social_accounts.update_many(
        {"user_id": user_id, "platform": "linkedin"},
        {"$set": {"is_default": False}}
    )
    
    # Set new default
    if account_id:
        await db.social_accounts.update_one(
            {"user_id": user_id, "id": account_id},
            {"$set": {"is_default": True}}
        )
    
    return {"success": True}

