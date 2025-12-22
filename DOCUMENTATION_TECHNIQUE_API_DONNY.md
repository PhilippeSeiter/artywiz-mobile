# 📱 Documentation Technique API - Artywiz Mobile

## Pour : Donny (Développeur Backend API)
## Date : Décembre 2024
## Version : 1.0

---

# Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Architecture actuelle](#2-architecture-actuelle)
3. [Modèles de données existants](#3-modèles-de-données-existants)
4. [APIs à développer](#4-apis-à-développer)
5. [Optimisations Performance](#5-optimisations-performance)
6. [Sécurité](#6-sécurité)
7. [Format de réponse standardisé](#7-format-de-réponse-standardisé)
8. [Checklist de livraison](#8-checklist-de-livraison)

---

# 1. Vue d'ensemble du projet

## 1.1 Contexte

**Artywiz Mobile** est une application mobile destinée aux clubs de football, ligues, districts et sponsors. Elle permet de :
- Générer automatiquement du contenu visuel (posts, affiches, reels)
- Publier sur les réseaux sociaux (Facebook, Instagram, LinkedIn)
- Gérer les relations clubs/sponsors via les ArtyCoins (ATC)
- Gérer les profils multiples (un utilisateur peut gérer plusieurs équipes/clubs)

## 1.2 Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React Native / Expo |
| Backend | FastAPI (Python 3.11+) |
| Base de données | MongoDB |
| Authentification | JWT (access + refresh tokens) |
| Stockage fichiers | À définir (S3, CloudFlare R2, etc.) |

## 1.3 Volumétrie attendue

- **Utilisateurs actifs** : 10 000 - 50 000 utilisateurs simultanés
- **Documents générés** : ~500 000 documents/mois
- **Publications** : ~200 000 publications/mois sur réseaux sociaux
- **Fichiers médias** : Images haute résolution (1080x1920), vidéos courtes

---

# 2. Architecture actuelle

## 2.1 Structure du backend

```
/backend
├── server.py              # Point d'entrée FastAPI
├── models/
│   ├── user.py            # Modèles utilisateur & authentification
│   ├── atc_models.py      # Modèles ArtyCoins (wallet, transactions)
│   └── social_accounts.py # Comptes réseaux sociaux
├── routes/
│   ├── users_routes.py    # Auth & gestion utilisateurs
│   ├── atc_routes.py      # Endpoints ArtyCoins
│   ├── social_routes.py   # Connexion réseaux sociaux
│   └── auth_routes.py     # Routes OAuth
├── services/
│   ├── auth_service.py    # Service authentification JWT
│   └── social_media/      # Services publication
└── requirements.txt
```

## 2.2 Endpoints existants

### Authentification (`/api/users`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/users/register` | Inscription nouvel utilisateur |
| POST | `/api/users/login` | Connexion |
| POST | `/api/users/refresh` | Rafraîchir le token |
| GET | `/api/users/me` | Profil utilisateur courant |
| PUT | `/api/users/me` | Mise à jour profil |
| PUT | `/api/users/me/profiles` | Mise à jour des profils |
| PUT | `/api/users/me/themes` | Mise à jour des thèmes |
| POST | `/api/users/me/complete-onboarding` | Finaliser onboarding |

## 2.3 Base de données MongoDB

Collections existantes :
- `users` - Utilisateurs et leurs profils
- `status_checks` - Health checks
- `atc_wallets` - Portefeuilles ArtyCoins
- `atc_transactions` - Historique transactions ATC

---

# 3. Modèles de données existants

## 3.1 Utilisateur (`UserInDB`)

```python
class UserInDB:
    id: str                         # UUID
    email: EmailStr                 # Email unique
    name: str                       # Nom d'affichage
    hashed_password: str            # Mot de passe hashé (bcrypt)
    role: UserRole                  # "user" | "admin" | "sponsor"
    is_active: bool                 # Compte actif
    is_verified: bool               # Email vérifié
    
    # Profils (un user peut avoir plusieurs profils)
    profiles: List[UserProfile]     # Liste des profils
    active_profile_index: int       # Index du profil actif
    selected_themes: List[str]      # Thèmes sélectionnés
    has_completed_onboarding: bool  # Onboarding terminé
    
    # OAuth
    oauth_providers: List[str]      # ["meta", "linkedin", "google"]
    
    # Metadata
    avatar: Optional[str]           # Base64 ou URL
    phone: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
```

## 3.2 Profil utilisateur (`UserProfile`)

```python
class UserProfile:
    id: str                         # UUID
    type: ProfileType               # "equipe" | "club" | "district" | "ligue" | "sponsor"
    name: str                       # "FC Strasbourg U17"
    logo: Optional[str]             # Base64 ou URL du logo
    club_id: Optional[str]          # Pour les équipes, lien vers le club parent
    numero: Optional[str]           # Numéro de profil
    is_active: bool
    created_at: datetime
```

## 3.3 Wallet ArtyCoins (`ATCWallet`)

```python
class ATCWallet:
    id: str
    user_id: str
    
    balance_total: float            # Solde total
    balance_locked: float           # Solde verrouillé (vesting)
    balance_available: float        # Solde disponible
    
    unlock_date: Optional[datetime] # Date de déverrouillage
    
    total_earned: float             # Historique gains
    total_purchased: float          # Historique achats
    total_spent: float              # Historique dépenses
    
    created_at: datetime
    updated_at: datetime
```

---

# 4. APIs à développer

## 4.1 🎨 Documents / Contenus visuels

### Collection : `documents`

```python
class Document:
    id: str
    profile_id: str                 # Profil propriétaire
    user_id: str                    # Utilisateur créateur
    
    # Type et catégorie
    type: str                       # "match" | "evenement" | "sponsor" | "custom"
    category: str                   # "communication_match" | "animation" | etc.
    
    # Contenu
    title: str
    description: Optional[str]
    
    # Médias générés
    supports: List[DocumentSupport] # post, reel, affiche, story...
    
    # Statut
    status: DocumentStatus          # "brouillon" | "en_cours" | "pret" | "publie"
    generation_started_at: Optional[datetime]
    generation_completed_at: Optional[datetime]
    
    # Publications
    publications: List[PublicationRecord]
    
    # Metadata
    created_at: datetime
    updated_at: datetime
```

```python
class DocumentSupport:
    type: str                       # "post" | "reel" | "affiche" | "story"
    format: str                     # "1080x1080" | "1080x1920" | "1920x1080"
    media_url: str                  # URL du média généré
    thumbnail_url: Optional[str]    # Miniature
    file_size: int                  # Taille en bytes
    generated_at: datetime
```

### Endpoints Documents

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/documents` | Liste paginée des documents |
| GET | `/api/documents/{id}` | Détail d'un document |
| POST | `/api/documents` | Créer un document |
| PUT | `/api/documents/{id}` | Modifier un document |
| DELETE | `/api/documents/{id}` | Supprimer un document |
| POST | `/api/documents/{id}/generate` | Lancer la génération |
| GET | `/api/documents/{id}/status` | Statut de génération |
| GET | `/api/documents/ready` | Documents prêts à publier |
| GET | `/api/documents/stats` | Statistiques documents |

### Paramètres de liste (GET `/api/documents`)

```
?profile_id=xxx          # Filtrer par profil
?status=pret             # Filtrer par statut
?category=match          # Filtrer par catégorie
?page=1                  # Pagination
?limit=20                # Limite par page (max 50)
?sort=-created_at        # Tri (- = décroissant)
```

---

## 4.2 📢 Publications réseaux sociaux

### Collection : `publications`

```python
class Publication:
    id: str
    document_id: str
    profile_id: str
    user_id: str
    
    # Plateforme cible
    platform: str                   # "facebook" | "instagram" | "linkedin"
    account_id: str                 # ID du compte social
    
    # Contenu
    support_type: str               # Type de support utilisé
    caption: str                    # Texte de la publication
    media_urls: List[str]           # URLs des médias
    
    # Statut
    status: str                     # "pending" | "scheduled" | "published" | "failed"
    scheduled_at: Optional[datetime]
    published_at: Optional[datetime]
    
    # Résultat
    post_id: Optional[str]          # ID du post sur la plateforme
    post_url: Optional[str]         # URL du post
    error_message: Optional[str]    # Message d'erreur si échec
    
    # Métriques (remplies par webhook/polling)
    metrics: PublicationMetrics
    
    created_at: datetime
    updated_at: datetime
```

```python
class PublicationMetrics:
    impressions: int = 0
    reach: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    clicks: int = 0
    last_updated: datetime
```

### Endpoints Publications

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/publications` | Publier un document |
| POST | `/api/publications/schedule` | Planifier une publication |
| GET | `/api/publications` | Liste des publications |
| GET | `/api/publications/{id}` | Détail publication |
| DELETE | `/api/publications/{id}` | Annuler publication planifiée |
| GET | `/api/publications/stats` | Statistiques globales |

---

## 4.3 🏆 Matchs et événements

### Collection : `matches`

```python
class Match:
    id: str
    profile_id: str                 # Club/équipe propriétaire
    
    # Équipes
    home_team: TeamInfo
    away_team: TeamInfo
    
    # Date et lieu
    match_date: datetime
    venue: str
    competition: str                # "Championnat", "Coupe", etc.
    
    # Résultat
    status: str                     # "upcoming" | "live" | "finished"
    score_home: Optional[int]
    score_away: Optional[int]
    
    # Documents générés
    document_ids: List[str]         # Liens vers documents générés
    
    created_at: datetime
    updated_at: datetime
```

```python
class TeamInfo:
    name: str
    logo_url: Optional[str]
    club_id: Optional[str]
```

### Endpoints Matchs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/matches` | Liste des matchs |
| GET | `/api/matches/{id}` | Détail match |
| POST | `/api/matches` | Créer un match |
| PUT | `/api/matches/{id}` | Modifier un match |
| PUT | `/api/matches/{id}/score` | Mettre à jour le score |
| DELETE | `/api/matches/{id}` | Supprimer match |
| GET | `/api/matches/upcoming` | Matchs à venir |
| GET | `/api/matches/calendar` | Vue calendrier |

---

## 4.4 💰 Sponsoring et deals

### Collection : `sponsor_campaigns`

```python
class SponsorCampaign:
    id: str
    sponsor_user_id: str
    sponsor_profile_id: str
    
    # Configuration
    name: str
    description: str
    budget_total: float
    budget_per_document: float
    
    # Ciblage
    target_types: List[str]         # ["club", "equipe", "district"]
    target_regions: List[str]       # Régions géographiques
    target_categories: List[str]    # Catégories de documents
    
    # Période
    start_date: datetime
    end_date: datetime
    status: str                     # "draft" | "active" | "paused" | "ended"
    
    # Statistiques
    stats: CampaignStats
    
    created_at: datetime
    updated_at: datetime
```

```python
class SponsorRequest:
    id: str
    campaign_id: str
    sponsor_profile_id: str
    club_profile_id: str
    document_id: Optional[str]
    
    # Offre
    offer_amount: float
    offer_message: Optional[str]
    
    # Contre-offre
    counter_offer_amount: Optional[float]
    counter_offer_message: Optional[str]
    
    # Négociation
    status: str                     # "pending_club" | "countered" | "accepted" | "refused" | "cancelled"
    final_amount: Optional[float]
    
    # Budget tracking
    reserved_amount: float
    consumed_amount: float
    
    created_at: datetime
    updated_at: datetime
```

### Endpoints Sponsoring

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sponsor/campaigns` | Mes campagnes |
| POST | `/api/sponsor/campaigns` | Créer campagne |
| PUT | `/api/sponsor/campaigns/{id}` | Modifier campagne |
| POST | `/api/sponsor/campaigns/{id}/pause` | Mettre en pause |
| POST | `/api/sponsor/campaigns/{id}/resume` | Réactiver |
| GET | `/api/sponsor/requests` | Mes demandes |
| POST | `/api/sponsor/requests` | Envoyer offre |
| POST | `/api/sponsor/requests/{id}/accept` | Accepter contre-offre |
| POST | `/api/sponsor/requests/{id}/refuse` | Refuser |
| POST | `/api/sponsor/requests/{id}/counter` | Faire nouvelle offre |

---

## 4.5 🔔 Notifications push

### Collection : `notifications`

```python
class Notification:
    id: str
    user_id: str
    profile_id: Optional[str]       # Si notification liée à un profil
    
    # Contenu
    type: str                       # "document_ready" | "sponsor_offer" | "publication_success" | etc.
    title: str
    body: str
    data: dict                      # Payload pour deep linking
    
    # Statut
    read: bool = False
    read_at: Optional[datetime]
    
    # Push
    push_sent: bool = False
    push_sent_at: Optional[datetime]
    
    created_at: datetime
```

### Endpoints Notifications

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/notifications` | Liste notifications |
| GET | `/api/notifications/unread/count` | Nombre non lues |
| POST | `/api/notifications/{id}/read` | Marquer comme lue |
| POST | `/api/notifications/read-all` | Tout marquer comme lu |
| DELETE | `/api/notifications/{id}` | Supprimer |
| POST | `/api/notifications/register-device` | Enregistrer token push |

---

## 4.6 📊 Statistiques et insights

### Endpoints Analytics

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard principal |
| GET | `/api/analytics/documents` | Stats documents |
| GET | `/api/analytics/publications` | Stats publications |
| GET | `/api/analytics/engagement` | Métriques engagement |
| GET | `/api/analytics/sponsors` | Stats sponsoring |

### Réponse Dashboard

```json
{
  "period": "last_30_days",
  "documents": {
    "total": 145,
    "generated": 120,
    "published": 98,
    "by_category": {...}
  },
  "publications": {
    "total": 234,
    "by_platform": {
      "facebook": 89,
      "instagram": 102,
      "linkedin": 43
    }
  },
  "engagement": {
    "total_reach": 45000,
    "total_impressions": 120000,
    "total_interactions": 5600
  },
  "sponsors": {
    "revenue_atc": 450,
    "active_deals": 12
  }
}
```

---

# 5. Optimisations Performance

## 5.1 ⚡ Règles d'or pour la fluidité mobile

### A. Pagination obligatoire

**TOUS les endpoints de liste DOIVENT être paginés.**

```python
# Paramètres standard
?page=1           # Page (défaut: 1)
?limit=20         # Items par page (défaut: 20, max: 50)

# Réponse
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1523,
    "total_pages": 77,
    "has_next": true,
    "has_prev": false
  }
}
```

### B. Projection MongoDB

**Ne jamais retourner de documents complets si non nécessaire.**

```python
# ❌ MAUVAIS - Retourne tout
documents = await db.documents.find({}).to_list(100)

# ✅ BON - Projection
documents = await db.documents.find(
    {"profile_id": profile_id},
    {
        "_id": 0,
        "id": 1,
        "title": 1,
        "status": 1,
        "thumbnail_url": 1,
        "created_at": 1
    }
).limit(20).to_list(20)
```

### C. Index MongoDB obligatoires

```javascript
// Collection documents
db.documents.createIndex({ "profile_id": 1, "created_at": -1 })
db.documents.createIndex({ "status": 1 })
db.documents.createIndex({ "user_id": 1 })

// Collection publications
db.publications.createIndex({ "profile_id": 1, "published_at": -1 })
db.publications.createIndex({ "document_id": 1 })
db.publications.createIndex({ "status": 1 })

// Collection notifications
db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 })

// Collection matches
db.matches.createIndex({ "profile_id": 1, "match_date": -1 })
db.matches.createIndex({ "status": 1, "match_date": 1 })
```

### D. Endpoints légers pour les listes

Créer des endpoints spécifiques pour les listes avec données minimales :

```python
# Endpoint léger pour liste documents (card view)
@router.get("/documents/cards")
async def get_document_cards():
    # Retourne uniquement: id, title, thumbnail, status, created_at
    pass

# Endpoint complet pour détail
@router.get("/documents/{id}")
async def get_document_detail():
    # Retourne toutes les données
    pass
```

### E. Compression des réponses

Activer la compression gzip automatique :

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

## 5.2 🖼️ Gestion des médias

### A. URLs signées (recommandé)

Pour les images/vidéos, utiliser des URLs pré-signées avec expiration :

```python
# Génère une URL valide 1 heure
def get_signed_url(file_key: str) -> str:
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET, 'Key': file_key},
        ExpiresIn=3600
    )
```

### B. Variantes d'images

Générer plusieurs tailles pour chaque image :

```python
class ImageVariants:
    original: str      # URL original
    large: str         # 1080px
    medium: str        # 540px  
    thumbnail: str     # 150px
    blur_hash: str     # BlurHash pour placeholder
```

### C. Upload par chunks

Pour les fichiers > 5MB, implémenter l'upload par morceaux :

```python
@router.post("/upload/init")
async def init_upload(filename: str, file_size: int, content_type: str):
    # Retourne upload_id et chunk_size
    pass

@router.post("/upload/{upload_id}/chunk/{chunk_index}")
async def upload_chunk(upload_id: str, chunk_index: int, data: bytes):
    pass

@router.post("/upload/{upload_id}/complete")
async def complete_upload(upload_id: str):
    # Assemble les chunks et retourne l'URL finale
    pass
```

## 5.3 🔄 Cache et temps réel

### A. Headers de cache

```python
from fastapi import Response

@router.get("/documents/{id}")
async def get_document(id: str, response: Response):
    response.headers["Cache-Control"] = "private, max-age=60"
    # ...
```

### B. ETags pour invalidation

```python
@router.get("/documents/{id}")
async def get_document(id: str, if_none_match: Optional[str] = Header(None)):
    doc = await get_doc(id)
    etag = f'"{doc.updated_at.timestamp()}"'
    
    if if_none_match == etag:
        return Response(status_code=304)
    
    response = JSONResponse(content=doc.dict())
    response.headers["ETag"] = etag
    return response
```

### C. WebSocket pour temps réel (optionnel)

Pour les notifications et statuts de génération :

```python
from fastapi import WebSocket

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    # Envoyer les updates en temps réel
```

---

# 6. Sécurité

## 6.1 Authentification JWT

### Tokens

| Token | Durée | Usage |
|-------|-------|-------|
| Access Token | 15 minutes | Requêtes API |
| Refresh Token | 7 jours | Renouveler l'access token |

### Headers requis

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Validation

```python
async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token manquant")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_access_token(token)
    
    if not payload:
        raise HTTPException(401, "Token invalide ou expiré")
    
    user = await db.users.find_one({"id": payload["sub"]})
    if not user or not user.get("is_active"):
        raise HTTPException(401, "Utilisateur non trouvé ou désactivé")
    
    return UserInDB(**user)
```

## 6.2 Validation des profils

**CRITIQUE : Toujours vérifier que l'utilisateur a accès au profil demandé**

```python
async def verify_profile_access(user: UserInDB, profile_id: str):
    """Vérifie que l'utilisateur possède ce profil"""
    profile_ids = [p["id"] for p in user.profiles]
    if profile_id not in profile_ids:
        raise HTTPException(403, "Accès non autorisé à ce profil")
```

## 6.3 Rate limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/documents/generate")
@limiter.limit("10/minute")  # Max 10 générations par minute
async def generate_document():
    pass

@router.get("/documents")
@limiter.limit("100/minute")  # Max 100 requêtes par minute
async def list_documents():
    pass
```

## 6.4 Validation des entrées

```python
from pydantic import BaseModel, Field, validator
import re

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    profile_id: str
    
    @validator('title')
    def sanitize_title(cls, v):
        # Bloquer les caractères dangereux
        if re.search(r'[<>"\'\&;(){}\[\]\\]', v):
            raise ValueError("Caractères non autorisés")
        return v.strip()
```

---

# 7. Format de réponse standardisé

## 7.1 Succès

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-12-22T20:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## 7.2 Succès avec pagination

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "meta": {
    "timestamp": "2024-12-22T20:30:00Z"
  }
}
```

## 7.3 Erreur

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le titre est requis",
    "details": {
      "field": "title",
      "reason": "required"
    }
  },
  "meta": {
    "timestamp": "2024-12-22T20:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## 7.4 Codes d'erreur standard

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Données invalides |
| `UNAUTHORIZED` | 401 | Token manquant/invalide |
| `FORBIDDEN` | 403 | Accès refusé |
| `NOT_FOUND` | 404 | Ressource non trouvée |
| `RATE_LIMITED` | 429 | Trop de requêtes |
| `SERVER_ERROR` | 500 | Erreur serveur |

---

# 8. Checklist de livraison

## Phase 1 : Documents (Semaine 1-2)
- [ ] Collection MongoDB `documents` avec index
- [ ] CRUD complet documents
- [ ] Endpoint `/documents/cards` optimisé
- [ ] Gestion des statuts de génération
- [ ] Upload médias par chunks
- [ ] Tests unitaires

## Phase 2 : Publications (Semaine 3)
- [ ] Collection MongoDB `publications`
- [ ] Intégration API Meta (Facebook/Instagram)
- [ ] Intégration API LinkedIn
- [ ] Planification de publications
- [ ] Webhooks pour métriques

## Phase 3 : Matchs (Semaine 4)
- [ ] Collection MongoDB `matches`
- [ ] CRUD matchs
- [ ] Endpoint calendrier
- [ ] Liaison matchs/documents

## Phase 4 : Sponsoring (Semaine 5)
- [ ] Collection `sponsor_campaigns`
- [ ] Collection `sponsor_requests`
- [ ] Workflow de négociation
- [ ] Intégration ArtyCoins

## Phase 5 : Notifications & Analytics (Semaine 6)
- [ ] Collection `notifications`
- [ ] Push notifications (Firebase/Expo)
- [ ] Endpoints analytics
- [ ] Dashboard stats

## Tests de charge
- [ ] Test 1000 requêtes/minute
- [ ] Test pagination avec 100k documents
- [ ] Test upload fichiers 50MB
- [ ] Temps de réponse < 200ms pour listes

---

# 📞 Contact

Pour toute question technique :
- **Slack** : #artywiz-dev
- **Email** : dev@artywiz.com

---

*Document généré le 22/12/2024*
*Version 1.0*
