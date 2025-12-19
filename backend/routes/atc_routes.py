from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import math
import logging

from models.atc_models import (
    ATCPriceConfig,
    ATCWallet,
    ATCWalletResponse,
    ATCLedgerEntry,
    ATCLedgerResponse,
    ATCPurchaseRequest,
    ATCPurchaseCreateRequest,
    ATCPurchaseCreateResponse,
    ATCPurchaseStatus,
    ATCTransactionType,
    ATCConfigResponse,
    ATCPromoConfig,
    ATCPromoViewRecord,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/atc", tags=["ATC - Artycoins"])

# Database reference (set by server.py)
db: Optional[AsyncIOMotorDatabase] = None

def set_db(database: AsyncIOMotorDatabase):
    global db
    db = database


# ============================================================
# HELPER FUNCTIONS
# ============================================================

async def get_or_create_price_config() -> ATCPriceConfig:
    """Récupère ou crée la configuration de prix ATC"""
    config = await db.atc_price_config.find_one({"is_active": True})
    
    if not config:
        # Créer la config par défaut
        default_config = ATCPriceConfig(
            launch_date=datetime.utcnow()
        )
        await db.atc_price_config.insert_one(default_config.dict())
        return default_config
    
    return ATCPriceConfig(**config)


def calculate_current_price(config: ATCPriceConfig) -> float:
    """Calcule le prix actuel de l'ATC basé sur la date de lancement
    
    Prix de départ: 0.10€
    Augmentation: +0.05€ tous les 30 jours
    Prix max: 1.00€
    """
    now = datetime.utcnow()
    days_since_launch = (now - config.launch_date).days
    periods_passed = days_since_launch // config.increment_period_days
    
    current_price = config.base_price_eur + (periods_passed * config.price_increment_eur)
    
    # Ne pas dépasser le prix max
    return min(current_price, config.max_price_eur)


def calculate_next_price_date(config: ATCPriceConfig) -> datetime:
    """Calcule la date de la prochaine augmentation de prix"""
    now = datetime.utcnow()
    days_since_launch = (now - config.launch_date).days
    current_period = days_since_launch // config.increment_period_days
    next_period_start = (current_period + 1) * config.increment_period_days
    
    return config.launch_date + timedelta(days=next_period_start)


async def get_or_create_wallet(user_id: str) -> ATCWallet:
    """Récupère ou crée le wallet d'un utilisateur"""
    wallet = await db.atc_wallets.find_one({"user_id": user_id})
    
    if not wallet:
        # Créer un nouveau wallet
        config = await get_or_create_price_config()
        
        new_wallet = ATCWallet(
            user_id=user_id,
            unlock_date=config.launch_date + timedelta(days=config.vesting_months * 30)
        )
        await db.atc_wallets.insert_one(new_wallet.dict())
        return new_wallet
    
    return ATCWallet(**wallet)


# ============================================================
# ENDPOINTS - CONFIGURATION
# ============================================================

@router.get("/config", response_model=ATCConfigResponse)
async def get_atc_config():
    """Récupère la configuration ATC actuelle (prix, limites, promo...)"""
    try:
        config = await get_or_create_price_config()
        current_price = calculate_current_price(config)
        next_price = min(current_price + config.price_increment_eur, config.max_price_eur)
        next_price_date = calculate_next_price_date(config)
        vesting_end = config.launch_date + timedelta(days=config.vesting_months * 30)
        
        # Chercher une promo active
        now = datetime.utcnow()
        active_promo = await db.atc_promos.find_one({
            "is_active": True,
            "start_date": {"$lte": now},
            "end_date": {"$gte": now}
        })
        
        return ATCConfigResponse(
            current_price_eur=current_price,
            next_price_eur=next_price,
            next_price_date=next_price_date,
            min_purchase_eur=config.min_purchase_eur,
            max_purchase_eur=config.max_purchase_eur,
            platform_fee_percent=config.platform_fee_percent,
            vesting_months=config.vesting_months,
            vesting_end_date=vesting_end,
            active_promo=ATCPromoConfig(**active_promo) if active_promo else None
        )
    except Exception as e:
        logger.error(f"Error getting ATC config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ENDPOINTS - WALLET
# ============================================================

@router.get("/wallet/{user_id}", response_model=ATCWalletResponse)
async def get_wallet(user_id: str):
    """Récupère le wallet d'un utilisateur"""
    try:
        wallet = await get_or_create_wallet(user_id)
        config = await get_or_create_price_config()
        current_price = calculate_current_price(config)
        
        return ATCWalletResponse(
            id=wallet.id,
            user_id=wallet.user_id,
            balance_total=wallet.balance_total,
            balance_locked=wallet.balance_locked,
            balance_available=wallet.balance_available,
            unlock_date=wallet.unlock_date,
            total_earned=wallet.total_earned,
            total_purchased=wallet.total_purchased,
            total_spent=wallet.total_spent,
            current_price_eur=current_price,
            value_eur=wallet.balance_total * current_price,
            created_at=wallet.created_at,
            updated_at=wallet.updated_at
        )
    except Exception as e:
        logger.error(f"Error getting wallet for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ENDPOINTS - LEDGER (HISTORIQUE)
# ============================================================

@router.get("/ledger/{user_id}", response_model=ATCLedgerResponse)
async def get_ledger(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    transaction_type: Optional[ATCTransactionType] = None
):
    """Récupère l'historique des transactions d'un utilisateur"""
    try:
        # Build query
        query = {"user_id": user_id}
        if transaction_type:
            query["transaction_type"] = transaction_type.value
        
        # Count total
        total_count = await db.atc_ledger.count_documents(query)
        
        # Get entries
        skip = (page - 1) * page_size
        cursor = db.atc_ledger.find(query).sort("created_at", -1).skip(skip).limit(page_size)
        entries = [ATCLedgerEntry(**doc) async for doc in cursor]
        
        return ATCLedgerResponse(
            entries=entries,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_more=(skip + len(entries)) < total_count
        )
    except Exception as e:
        logger.error(f"Error getting ledger for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ENDPOINTS - ACHAT ATC
# ============================================================

@router.post("/purchase", response_model=ATCPurchaseCreateResponse)
async def create_purchase_request(
    user_id: str,
    request: ATCPurchaseCreateRequest
):
    """Crée une demande d'achat d'ATC"""
    try:
        config = await get_or_create_price_config()
        current_price = calculate_current_price(config)
        
        # Validation montant minimum
        if request.amount_eur < config.min_purchase_eur:
            raise HTTPException(
                status_code=400,
                detail=f"Montant minimum: {config.min_purchase_eur}€"
            )
        
        # Validation montant maximum (si défini)
        if config.max_purchase_eur and request.amount_eur > config.max_purchase_eur:
            raise HTTPException(
                status_code=400,
                detail=f"Montant maximum: {config.max_purchase_eur}€"
            )
        
        # Calcul des montants
        platform_fee = request.amount_eur * (config.platform_fee_percent / 100)
        net_amount = request.amount_eur - platform_fee
        amount_atc = net_amount / current_price
        
        # Créer la demande d'achat
        purchase = ATCPurchaseRequest(
            buyer_user_id=user_id,
            amount_eur=request.amount_eur,
            amount_atc=amount_atc,
            atc_price_eur=current_price,
            platform_fee_eur=platform_fee,
            status=ATCPurchaseStatus.PENDING
        )
        
        await db.atc_purchases.insert_one(purchase.dict())
        
        # TODO: Créer session Stripe et retourner l'URL
        # Pour l'instant, on retourne sans Stripe
        
        return ATCPurchaseCreateResponse(
            purchase_request_id=purchase.id,
            amount_eur=request.amount_eur,
            amount_atc=amount_atc,
            atc_price_eur=current_price,
            platform_fee_eur=platform_fee,
            stripe_checkout_url=None,  # TODO: Ajouter Stripe
            status=purchase.status.value
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating purchase request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/purchase/{purchase_id}/confirm")
async def confirm_purchase(purchase_id: str):
    """Confirme un achat après paiement (appelé par webhook Stripe ou manuellement)"""
    try:
        # Récupérer la demande d'achat
        purchase = await db.atc_purchases.find_one({"id": purchase_id})
        
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        purchase = ATCPurchaseRequest(**purchase)
        
        if purchase.status != ATCPurchaseStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Purchase already {purchase.status.value}"
            )
        
        # Mettre à jour le wallet
        wallet = await get_or_create_wallet(purchase.buyer_user_id)
        config = await get_or_create_price_config()
        
        new_balance_total = wallet.balance_total + purchase.amount_atc
        new_balance_locked = wallet.balance_locked + purchase.amount_atc  # Tout est verrouillé au début
        new_total_purchased = wallet.total_purchased + purchase.amount_atc
        
        await db.atc_wallets.update_one(
            {"user_id": purchase.buyer_user_id},
            {
                "$set": {
                    "balance_total": new_balance_total,
                    "balance_locked": new_balance_locked,
                    "total_purchased": new_total_purchased,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Créer l'entrée dans le ledger
        ledger_entry = ATCLedgerEntry(
            user_id=purchase.buyer_user_id,
            transaction_type=ATCTransactionType.PURCHASE,
            amount=purchase.amount_atc,
            balance_after=new_balance_total,
            atc_price_eur=purchase.atc_price_eur,
            value_eur=purchase.amount_eur,
            source_type="purchase",
            source_id=purchase_id,
            description=f"Achat de {purchase.amount_atc:.2f} ATC",
            is_locked=True,
            unlock_date=config.launch_date + timedelta(days=config.vesting_months * 30)
        )
        
        await db.atc_ledger.insert_one(ledger_entry.dict())
        
        # Mettre à jour le statut de l'achat
        await db.atc_purchases.update_one(
            {"id": purchase_id},
            {
                "$set": {
                    "status": ATCPurchaseStatus.COMPLETED.value,
                    "paid_at": datetime.utcnow(),
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "success": True,
            "message": f"{purchase.amount_atc:.2f} ATC crédités",
            "new_balance": new_balance_total
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming purchase {purchase_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ENDPOINTS - PROMO
# ============================================================

@router.get("/promo/current")
async def get_current_promo(user_id: str):
    """Récupère la promo actuelle si l'utilisateur ne l'a pas encore vue cette semaine"""
    try:
        now = datetime.utcnow()
        
        # Chercher une promo active
        promo = await db.atc_promos.find_one({
            "is_active": True,
            "start_date": {"$lte": now},
            "end_date": {"$gte": now}
        })
        
        if not promo:
            return {"has_promo": False, "promo": None}
        
        promo = ATCPromoConfig(**promo)
        
        # Vérifier si l'utilisateur a déjà vu cette promo
        view_record = await db.atc_promo_views.find_one({
            "user_id": user_id,
            "promo_id": promo.id
        })
        
        if view_record:
            return {"has_promo": False, "promo": None, "already_viewed": True}
        
        return {
            "has_promo": True,
            "promo": promo.dict(),
            "skip_delay_seconds": promo.skip_delay_seconds
        }
    except Exception as e:
        logger.error(f"Error getting current promo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/promo/{promo_id}/viewed")
async def mark_promo_viewed(
    promo_id: str,
    user_id: str,
    skipped: bool = False,
    cta_clicked: bool = False
):
    """Marque une promo comme vue par un utilisateur"""
    try:
        promo = await db.atc_promos.find_one({"id": promo_id})
        if not promo:
            raise HTTPException(status_code=404, detail="Promo not found")
        
        promo = ATCPromoConfig(**promo)
        
        view_record = ATCPromoViewRecord(
            user_id=user_id,
            promo_id=promo_id,
            week_number=promo.week_number,
            skipped=skipped,
            cta_clicked=cta_clicked
        )
        
        await db.atc_promo_views.insert_one(view_record.dict())
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking promo viewed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ENDPOINTS - ADMIN (pour tests)
# ============================================================

@router.post("/admin/credit")
async def admin_credit_atc(
    user_id: str,
    amount: float,
    description: str = "Crédit admin"
):
    """Crédite des ATC à un utilisateur (admin only)"""
    try:
        wallet = await get_or_create_wallet(user_id)
        config = await get_or_create_price_config()
        current_price = calculate_current_price(config)
        
        new_balance = wallet.balance_total + amount
        new_earned = wallet.total_earned + amount
        
        await db.atc_wallets.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "balance_total": new_balance,
                    "balance_locked": wallet.balance_locked + amount,
                    "total_earned": new_earned,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Créer l'entrée dans le ledger
        ledger_entry = ATCLedgerEntry(
            user_id=user_id,
            transaction_type=ATCTransactionType.ADMIN_CREDIT,
            amount=amount,
            balance_after=new_balance,
            atc_price_eur=current_price,
            value_eur=amount * current_price,
            description=description,
            is_locked=True,
            unlock_date=config.launch_date + timedelta(days=config.vesting_months * 30)
        )
        
        await db.atc_ledger.insert_one(ledger_entry.dict())
        
        return {
            "success": True,
            "new_balance": new_balance,
            "amount_credited": amount
        }
    except Exception as e:
        logger.error(f"Error crediting ATC: {e}")
        raise HTTPException(status_code=500, detail=str(e))
