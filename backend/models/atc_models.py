from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum
import uuid


# ============================================================
# ARTYCOINS (ATC) - MODÈLES DE DONNÉES
# ============================================================

class ATCTransactionType(str, Enum):
    """Types de transactions ATC"""
    PURCHASE = "purchase"           # Achat d'ATC
    EARN_SPONSOR = "earn_sponsor"   # Gain par publication sponsorisée
    EARN_ENGAGEMENT = "earn_engagement"  # Bonus engagement (vues, likes...)
    EARN_REFERRAL = "earn_referral"      # Bonus parrainage
    EARN_LOYALTY = "earn_loyalty"        # Bonus fidélité
    TRANSFER_IN = "transfer_in"     # Transfert entrant
    TRANSFER_OUT = "transfer_out"   # Transfert sortant
    UNLOCK = "unlock"               # Déverrouillage de tokens
    ADMIN_CREDIT = "admin_credit"   # Crédit admin
    ADMIN_DEBIT = "admin_debit"     # Débit admin


class ATCPurchaseStatus(str, Enum):
    """Statut d'une demande d'achat ATC"""
    PENDING = "pending"         # En attente de paiement
    PAID = "paid"               # Payé (confirmé par Stripe)
    COMPLETED = "completed"     # ATC crédités
    FAILED = "failed"           # Échec
    CANCELLED = "cancelled"     # Annulé


# ============================================================
# CONFIGURATION PRIX ATC (Dynamique)
# ============================================================

class ATCPriceConfig(BaseModel):
    """Configuration du prix ATC
    
    Prix de départ: 1 ATC = 0.10€
    Augmentation: +0.05€ tous les 30 jours
    Prix final (18 mois): 1 ATC = 1.00€
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Prix de base en EUR
    base_price_eur: float = 0.10  # Prix initial: 1 ATC = 0.10€
    
    # Augmentation par période
    price_increment_eur: float = 0.05  # +0.05€ par période
    increment_period_days: int = 30     # Tous les 30 jours
    
    # Prix maximum
    max_price_eur: float = 1.00  # Prix plafond: 1 ATC = 1.00€
    
    # Date de lancement (pour calculer le prix actuel)
    launch_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Commission plateforme
    platform_fee_percent: float = 15.0  # 15%
    
    # Limites d'achat
    min_purchase_eur: float = 10.0  # Minimum 10€
    max_purchase_eur: Optional[float] = None  # Pas de maximum
    
    # Période de vesting
    vesting_months: int = 18  # 18 mois après lancement
    
    # Métadonnées
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================
# WALLET ATC UTILISATEUR
# ============================================================

class ATCWallet(BaseModel):
    """Portefeuille ATC d'un utilisateur"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # ID utilisateur ArtyWiz
    
    # Soldes
    balance_total: float = 0.0       # Solde total
    balance_locked: float = 0.0      # Solde verrouillé (vesting)
    balance_available: float = 0.0   # Solde disponible = total - locked
    
    # Date de déverrouillage
    unlock_date: Optional[datetime] = None
    
    # Statistiques
    total_earned: float = 0.0        # Total gagné (historique)
    total_purchased: float = 0.0     # Total acheté (historique)
    total_spent: float = 0.0         # Total dépensé (historique)
    
    # Métadonnées
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ATCWalletResponse(BaseModel):
    """Réponse API pour le wallet (avec prix actuel)"""
    id: str
    user_id: str
    balance_total: float
    balance_locked: float
    balance_available: float
    unlock_date: Optional[datetime]
    total_earned: float
    total_purchased: float
    total_spent: float
    
    # Prix actuel ATC
    current_price_eur: float
    value_eur: float  # Valeur du portefeuille en EUR
    
    created_at: datetime
    updated_at: datetime


# ============================================================
# TRANSACTIONS ATC (LEDGER)
# ============================================================

class ATCLedgerEntry(BaseModel):
    """Entrée dans le registre des transactions ATC"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Type de transaction
    transaction_type: ATCTransactionType
    
    # Montant (positif = crédit, négatif = débit)
    amount: float
    
    # Solde après transaction
    balance_after: float
    
    # Prix ATC au moment de la transaction
    atc_price_eur: float
    
    # Valeur en EUR de la transaction
    value_eur: float
    
    # Source de la transaction
    source_type: Optional[str] = None  # document, sponsor, referral, etc.
    source_id: Optional[str] = None    # ID de la source
    
    # Détails supplémentaires
    description: str = ""
    metadata: dict = Field(default_factory=dict)
    
    # Verrouillage
    is_locked: bool = False
    unlock_date: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ATCLedgerResponse(BaseModel):
    """Réponse API pour l'historique des transactions"""
    entries: List[ATCLedgerEntry]
    total_count: int
    page: int
    page_size: int
    has_more: bool


# ============================================================
# DEMANDE D'ACHAT ATC
# ============================================================

class ATCPurchaseRequest(BaseModel):
    """Demande d'achat d'ATC"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Acheteur
    buyer_user_id: str
    buyer_type: str = "user"  # user, sponsor, investor
    
    # Montant
    amount_eur: float          # Montant payé en EUR
    amount_atc: float          # Quantité d'ATC à recevoir
    atc_price_eur: float       # Prix ATC au moment de l'achat
    
    # Frais
    platform_fee_eur: float    # Commission plateforme
    stripe_fee_eur: float = 0  # Frais Stripe
    
    # Stripe
    stripe_session_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    
    # Statut
    status: ATCPurchaseStatus = ATCPurchaseStatus.PENDING
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    paid_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ATCPurchaseCreateRequest(BaseModel):
    """Requête pour créer une demande d'achat"""
    amount_eur: float  # Montant en EUR


class ATCPurchaseCreateResponse(BaseModel):
    """Réponse après création d'une demande d'achat"""
    purchase_request_id: str
    amount_eur: float
    amount_atc: float
    atc_price_eur: float
    platform_fee_eur: float
    stripe_checkout_url: Optional[str] = None
    status: str


# ============================================================
# CONFIGURATION PROMO
# ============================================================

class ATCPromoConfig(BaseModel):
    """Configuration des écrans promotionnels ATC"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Semaine de la promo (1, 2, 3...)
    week_number: int
    
    # Contenu
    title: str
    description: str
    image_url: Optional[str] = None
    cta_text: str = "Découvrir"
    cta_action: str = "wallet"  # wallet, purchase, learn_more
    
    # Timing
    skip_delay_seconds: int = 3  # Délai avant pouvoir skipper
    
    # Période de validité
    start_date: datetime
    end_date: datetime
    
    # Métadonnées
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ATCPromoViewRecord(BaseModel):
    """Enregistrement des vues de promo par utilisateur"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    promo_id: str
    week_number: int
    viewed_at: datetime = Field(default_factory=datetime.utcnow)
    skipped: bool = False
    cta_clicked: bool = False


# ============================================================
# RÉPONSE CONFIGURATION GLOBALE
# ============================================================

class ATCConfigResponse(BaseModel):
    """Configuration ATC complète pour le frontend"""
    # Prix actuel
    current_price_eur: float
    
    # Prochaine augmentation
    next_price_eur: float
    next_price_date: datetime
    
    # Limites d'achat
    min_purchase_eur: float
    max_purchase_eur: Optional[float]
    
    # Commission
    platform_fee_percent: float
    
    # Vesting
    vesting_months: int
    vesting_end_date: datetime
    
    # Promo active
    active_promo: Optional[ATCPromoConfig] = None
