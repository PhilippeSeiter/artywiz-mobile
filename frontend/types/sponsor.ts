// Types for Sponsor module

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';

export type RequestStatus = 
  | 'PENDING_CLUB'      // Offre sponsor envoyée, attente réponse club
  | 'COUNTERED'         // Contre-offre club envoyée, attente décision sponsor
  | 'ACCEPTED'          // Accord trouvé (prix final fixé)
  | 'REFUSED_BY_CLUB'   // Refusé par le club
  | 'REFUSED_BY_SPONSOR'// Refusé par le sponsor
  | 'EXPIRED'           // Délai dépassé
  | 'CANCELLED';        // Sponsor a annulé

export interface Campaign {
  id: string;
  name: string;
  logo?: string;
  visual?: string;
  thematiques: string[];
  zone: {
    codePostal: string;
    rayonKm: number;
  };
  periode: {
    type: 'weekend' | 'semaine' | 'custom';
    dateDebut?: string;
    dateFin?: string;
  };
  status: CampaignStatus;
  budgetCap?: number;
  stopWhenCapReached?: boolean;
  createdAt: string;
  updatedAt: string;
  // Stats
  stats: {
    ciblés: number;
    validés: number;
    refusés: number;
    enAttente: number;
  };
}

export interface Offer {
  amount: number;
  currency: string;
  createdAt: string;
  message?: string;
}

export interface Request {
  id: string;
  campaignId: string;
  clubId: string;
  clubName: string;
  clubLogo?: string;
  docType: string;
  supports: string[];
  status: RequestStatus;
  offerSponsor: Offer;
  counterOfferClub?: Offer;
  finalPrice?: number;
  budgetState: {
    reservedAmount: number;
    consumedAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SponsorBudget {
  disponible: number;  // Solde réel
  engagé: number;      // Réservé sur demandes en attente / négo
  consommé: number;    // Accords acceptés
  currency: string;
}

export interface SponsorProfile {
  id: string;
  name: string;
  logo?: string;
  email: string;
  preferences?: {
    thematiques: string[];
    docTypes: string[];
  };
  notificationsPush: boolean;
}

export interface BudgetTransaction {
  id: string;
  type: 'recharge' | 'consommation' | 'liberation' | 'reservation';
  amount: number;
  description: string;
  requestId?: string;
  campaignId?: string;
  createdAt: string;
}

export interface SponsorNotification {
  id: string;
  type: 'counter_offer' | 'accepted' | 'refused' | 'expired';
  title: string;
  message: string;
  requestId: string;
  clubName: string;
  read: boolean;
  createdAt: string;
}
