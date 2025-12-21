"""User authentication and profile routes"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from datetime import datetime

from models.user import (
    UserCreate, UserLogin, UserUpdate, UserInDB, UserResponse,
    TokenResponse, RefreshTokenRequest, PasswordChangeRequest,
    ProfileUpdateRequest, ThemesUpdateRequest, OnboardingCompleteRequest,
    UserProfile, ProfileType
)
from services.auth_service import (
    get_password_hash, verify_password, create_tokens,
    verify_access_token, verify_refresh_token
)

router = APIRouter(prefix="/users", tags=["Users"])

# Database reference
db = None

def set_db(database):
    global db
    db = database


# Default profiles for new users
DEFAULT_PROFILES = [
    UserProfile(type=ProfileType.EQUIPE, name="Une Équipe", id="base_equipe"),
    UserProfile(type=ProfileType.CLUB, name="Un Club", id="base_club"),
    UserProfile(type=ProfileType.DISTRICT, name="Un District", id="base_district"),
    UserProfile(type=ProfileType.LIGUE, name="Une Ligue", id="base_ligue"),
    UserProfile(type=ProfileType.SPONSOR, name="Un Sponsor", id="base_sponsor"),
]


async def get_current_user(authorization: Optional[str] = Header(None)) -> UserInDB:
    """Dependency to get current authenticated user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token d'authentification requis")
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Format de token invalide")
    
    token = parts[1]
    payload = verify_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    user_id = payload.get("sub")
    user_doc = await db.users.find_one({"id": user_id})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    return UserInDB(**user_doc)


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    import re
    
    # Validate email format and characters
    email = user_data.email.strip().lower()
    if re.search(r'[<>"\'\&;(){}\[\]\\]', email):
        raise HTTPException(status_code=400, detail="Caractères non autorisés dans l'email")
    
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise HTTPException(status_code=400, detail="Format email invalide")
    
    # Validate name
    name = user_data.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Le nom doit contenir au moins 2 caractères")
    
    if re.search(r'[<>"\'\&]', name):
        raise HTTPException(status_code=400, detail="Caractères spéciaux non autorisés dans le nom")
    
    # Validate password
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Create user
    user = UserInDB(
        email=email,
        name=name,
        hashed_password=get_password_hash(user_data.password),
        profiles=[p.model_dump() for p in DEFAULT_PROFILES],
    )
    
    # Save to database
    await db.users.insert_one(user.model_dump())
    
    # Create tokens
    access_token, refresh_token, expires_in = create_tokens(user.id, user.email)
    
    # Update last login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserResponse(**user.model_dump())
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email.lower()})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    user = UserInDB(**user_doc)
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    # Create tokens
    access_token, refresh_token, expires_in = create_tokens(user.id, user.email)
    
    # Update last login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserResponse(**user.model_dump())
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    payload = verify_refresh_token(request.refresh_token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token invalide ou expiré")
    
    user_id = payload.get("sub")
    user_doc = await db.users.find_one({"id": user_id})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    user = UserInDB(**user_doc)
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    # Create new tokens
    access_token, new_refresh_token, expires_in = create_tokens(user.id, user.email)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=expires_in,
        user=UserResponse(**user.model_dump())
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(**current_user.model_dump())


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update current user profile"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_dict}
    )
    
    updated_doc = await db.users.find_one({"id": current_user.id})
    return UserResponse(**updated_doc)


@router.post("/me/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Change user password"""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    new_hash = get_password_hash(request.new_password)
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "hashed_password": new_hash,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Mot de passe modifié avec succès"}


@router.put("/me/profiles", response_model=UserResponse)
async def update_profiles(
    request: ProfileUpdateRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user profiles"""
    profiles_dict = [p.model_dump() for p in request.profiles]
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "profiles": profiles_dict,
            "active_profile_index": request.active_profile_index,
            "updated_at": datetime.utcnow()
        }}
    )
    
    updated_doc = await db.users.find_one({"id": current_user.id})
    return UserResponse(**updated_doc)


@router.put("/me/themes", response_model=UserResponse)
async def update_themes(
    request: ThemesUpdateRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update selected themes"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "selected_themes": request.themes,
            "updated_at": datetime.utcnow()
        }}
    )
    
    updated_doc = await db.users.find_one({"id": current_user.id})
    return UserResponse(**updated_doc)


@router.post("/me/complete-onboarding", response_model=UserResponse)
async def complete_onboarding(
    request: OnboardingCompleteRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Complete onboarding with profiles and themes"""
    profiles_dict = [p.model_dump() for p in request.profiles]
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "profiles": profiles_dict,
            "selected_themes": request.themes,
            "has_completed_onboarding": True,
            "updated_at": datetime.utcnow()
        }}
    )
    
    updated_doc = await db.users.find_one({"id": current_user.id})
    return UserResponse(**updated_doc)


@router.delete("/me")
async def delete_account(current_user: UserInDB = Depends(get_current_user)):
    """Delete user account (soft delete)"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "is_active": False,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Compte supprimé avec succès"}


# OAuth linking endpoints
@router.post("/me/link-oauth")
async def link_oauth_provider(
    provider: str,
    provider_user_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Link an OAuth provider to current user"""
    if provider not in ["meta", "linkedin", "google"]:
        raise HTTPException(status_code=400, detail="Provider non supporté")
    
    # Check if already linked
    if provider in current_user.oauth_providers:
        return {"message": f"{provider} déjà lié"}
    
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$addToSet": {"oauth_providers": provider},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {"message": f"{provider} lié avec succès"}


@router.delete("/me/unlink-oauth/{provider}")
async def unlink_oauth_provider(
    provider: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Unlink an OAuth provider from current user"""
    if provider not in current_user.oauth_providers:
        raise HTTPException(status_code=400, detail="Provider non lié")
    
    # Ensure user has a password before unlinking
    if not current_user.hashed_password and len(current_user.oauth_providers) <= 1:
        raise HTTPException(
            status_code=400, 
            detail="Impossible de supprimer le dernier mode de connexion. Définissez d'abord un mot de passe."
        )
    
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$pull": {"oauth_providers": provider},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {"message": f"{provider} délié avec succès"}
