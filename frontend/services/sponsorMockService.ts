import { Campaign, Request, SponsorProfile, SponsorNotification, RequestStatus } from '../types/sponsor';

// Demo Sponsor Profile
const demoSponsorProfile: SponsorProfile = {
  id: 'sponsor_1',
  name: 'SportMax France',
  logo: 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=SM',
  email: 'contact@sportmax.fr',
  preferences: {
    thematiques: ['football', 'basket', 'rugby'],
    docTypes: ['post', 'story', 'affiche'],
  },
  notificationsPush: true,
};

// Demo Campaigns
const demoCampaigns: Campaign[] = [
  {
    id: 'camp_1',
    name: 'Équipements Été 2025',
    logo: 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=EE',
    thematiques: ['football', 'basket'],
    zone: {
      codePostal: '75001',
      rayonKm: 50,
    },
    periode: {
      type: 'custom',
      dateDebut: '2025-06-01',
      dateFin: '2025-08-31',
    },
    status: 'active',
    budgetCap: 1000,
    stopWhenCapReached: false,
    createdAt: '2025-05-15T10:00:00Z',
    updatedAt: '2025-06-10T14:30:00Z',
    stats: {
      ciblés: 25,
      validés: 8,
      refusés: 3,
      enAttente: 14,
    },
  },
  {
    id: 'camp_2',
    name: 'Rentrée Sportive',
    logo: 'https://via.placeholder.com/80x80/F59E0B/FFFFFF?text=RS',
    thematiques: ['football', 'handball', 'volley'],
    zone: {
      codePostal: '69001',
      rayonKm: 30,
    },
    periode: {
      type: 'semaine',
    },
    status: 'active',
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: '2025-06-12T11:00:00Z',
    stats: {
      ciblés: 18,
      validés: 5,
      refusés: 2,
      enAttente: 11,
    },
  },
  {
    id: 'camp_3',
    name: 'Tournoi Régional',
    thematiques: ['football'],
    zone: {
      codePostal: '33000',
      rayonKm: 100,
    },
    periode: {
      type: 'weekend',
    },
    status: 'paused',
    createdAt: '2025-04-01T08:00:00Z',
    updatedAt: '2025-05-20T16:00:00Z',
    stats: {
      ciblés: 12,
      validés: 4,
      refusés: 1,
      enAttente: 0,
    },
  },
];

// Demo Requests
const demoRequests: Request[] = [
  {
    id: 'req_1',
    campaignId: 'camp_1',
    clubId: 'club_1',
    clubName: 'FC Lyon Métropole',
    clubLogo: 'https://via.placeholder.com/60x60/EF4444/FFFFFF?text=FCL',
    docType: 'Match jour',
    supports: ['post', 'story'],
    status: 'COUNTERED',
    offerSponsor: {
      amount: 50,
      currency: '€',
      createdAt: '2025-06-10T10:00:00Z',
    },
    counterOfferClub: {
      amount: 75,
      currency: '€',
      createdAt: '2025-06-11T14:00:00Z',
      message: 'Nous proposons 75€ car le match est un derby important.',
    },
    budgetState: {
      reservedAmount: 50,
      consumedAmount: 0,
    },
    createdAt: '2025-06-10T10:00:00Z',
    updatedAt: '2025-06-11T14:00:00Z',
  },
  {
    id: 'req_2',
    campaignId: 'camp_1',
    clubId: 'club_2',
    clubName: 'AS Villeurbanne',
    clubLogo: 'https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=ASV',
    docType: 'Entraînement',
    supports: ['post'],
    status: 'PENDING_CLUB',
    offerSponsor: {
      amount: 30,
      currency: '€',
      createdAt: '2025-06-12T09:00:00Z',
    },
    budgetState: {
      reservedAmount: 30,
      consumedAmount: 0,
    },
    createdAt: '2025-06-12T09:00:00Z',
    updatedAt: '2025-06-12T09:00:00Z',
  },
  {
    id: 'req_3',
    campaignId: 'camp_1',
    clubId: 'club_3',
    clubName: 'Olympique Décines',
    clubLogo: 'https://via.placeholder.com/60x60/06B6D4/FFFFFF?text=OD',
    docType: 'Match jour',
    supports: ['post', 'affiche'],
    status: 'ACCEPTED',
    offerSponsor: {
      amount: 60,
      currency: '€',
      createdAt: '2025-06-08T11:00:00Z',
    },
    finalPrice: 60,
    budgetState: {
      reservedAmount: 0,
      consumedAmount: 60,
    },
    createdAt: '2025-06-08T11:00:00Z',
    updatedAt: '2025-06-09T15:00:00Z',
  },
  {
    id: 'req_4',
    campaignId: 'camp_2',
    clubId: 'club_4',
    clubName: 'RC Bron',
    clubLogo: 'https://via.placeholder.com/60x60/EC4899/FFFFFF?text=RCB',
    docType: 'Recrutement',
    supports: ['post', 'story', 'newsletter'],
    status: 'REFUSED_BY_CLUB',
    offerSponsor: {
      amount: 40,
      currency: '€',
      createdAt: '2025-06-05T10:00:00Z',
    },
    budgetState: {
      reservedAmount: 0,
      consumedAmount: 0,
    },
    createdAt: '2025-06-05T10:00:00Z',
    updatedAt: '2025-06-06T09:00:00Z',
  },
  {
    id: 'req_5',
    campaignId: 'camp_2',
    clubId: 'club_5',
    clubName: 'ES Vénissieux',
    docType: 'Match jour',
    supports: ['post'],
    status: 'COUNTERED',
    offerSponsor: {
      amount: 45,
      currency: '€',
      createdAt: '2025-06-11T08:00:00Z',
    },
    counterOfferClub: {
      amount: 55,
      currency: '€',
      createdAt: '2025-06-12T10:00:00Z',
    },
    budgetState: {
      reservedAmount: 45,
      consumedAmount: 0,
    },
    createdAt: '2025-06-11T08:00:00Z',
    updatedAt: '2025-06-12T10:00:00Z',
  },
];

// Demo Notifications
const demoNotifications: SponsorNotification[] = [
  {
    id: 'notif_1',
    type: 'counter_offer',
    title: 'Contre-offre reçue',
    message: 'FC Lyon Métropole propose 75€ au lieu de 50€',
    requestId: 'req_1',
    clubName: 'FC Lyon Métropole',
    read: false,
    createdAt: '2025-06-11T14:00:00Z',
  },
  {
    id: 'notif_2',
    type: 'counter_offer',
    title: 'Contre-offre reçue',
    message: 'ES Vénissieux propose 55€ au lieu de 45€',
    requestId: 'req_5',
    clubName: 'ES Vénissieux',
    read: false,
    createdAt: '2025-06-12T10:00:00Z',
  },
  {
    id: 'notif_3',
    type: 'accepted',
    title: 'Offre acceptée !',
    message: 'Olympique Décines a accepté votre offre de 60€',
    requestId: 'req_3',
    clubName: 'Olympique Décines',
    read: true,
    createdAt: '2025-06-09T15:00:00Z',
  },
  {
    id: 'notif_4',
    type: 'refused',
    title: 'Offre refusée',
    message: 'RC Bron a refusé votre offre',
    requestId: 'req_4',
    clubName: 'RC Bron',
    read: true,
    createdAt: '2025-06-06T09:00:00Z',
  },
];

// Demo Clubs for targeting
const demoClubs = [
  { id: 'club_1', name: 'FC Lyon Métropole', codePostal: '69003', thematiques: ['football'] },
  { id: 'club_2', name: 'AS Villeurbanne', codePostal: '69100', thematiques: ['football', 'basket'] },
  { id: 'club_3', name: 'Olympique Décines', codePostal: '69150', thematiques: ['football'] },
  { id: 'club_4', name: 'RC Bron', codePostal: '69500', thematiques: ['rugby'] },
  { id: 'club_5', name: 'ES Vénissieux', codePostal: '69200', thematiques: ['football', 'handball'] },
  { id: 'club_6', name: 'Lyon Basket Club', codePostal: '69001', thematiques: ['basket'] },
  { id: 'club_7', name: 'Caluire SC', codePostal: '69300', thematiques: ['football'] },
  { id: 'club_8', name: 'Tassin FC', codePostal: '69160', thematiques: ['football'] },
];

// Service
export const SponsorMockService = {
  // Profile
  getSponsorProfile: (): SponsorProfile => demoSponsorProfile,
  
  // Campaigns
  getAllCampaigns: (): Campaign[] => [...demoCampaigns],
  getCampaignById: (id: string): Campaign | undefined => 
    demoCampaigns.find(c => c.id === id),
  getActiveCampaigns: (): Campaign[] => 
    demoCampaigns.filter(c => c.status === 'active'),
  
  // Requests
  getAllRequests: (): Request[] => [...demoRequests],
  getRequestById: (id: string): Request | undefined => 
    demoRequests.find(r => r.id === id),
  getRequestsByCampaign: (campaignId: string): Request[] => 
    demoRequests.filter(r => r.campaignId === campaignId),
  getRequestsByStatus: (status: RequestStatus | RequestStatus[]): Request[] => {
    const statuses = Array.isArray(status) ? status : [status];
    return demoRequests.filter(r => statuses.includes(r.status));
  },
  getPendingRequests: (): Request[] => 
    demoRequests.filter(r => r.status === 'PENDING_CLUB' || r.status === 'COUNTERED'),
  
  // Notifications
  getAllNotifications: (): SponsorNotification[] => [...demoNotifications],
  getUnreadNotifications: (): SponsorNotification[] => 
    demoNotifications.filter(n => !n.read),
  
  // Clubs (for campaign targeting)
  getAllClubs: () => [...demoClubs],
  getClubsByZone: (codePostal: string, rayonKm: number) => {
    // Simplified: return all clubs for demo
    return demoClubs;
  },
  getClubsByThematiques: (thematiques: string[]) => {
    return demoClubs.filter(c => 
      c.thematiques.some(t => thematiques.includes(t))
    );
  },
  
  // Stats
  getDashboardStats: () => ({
    campaignesEnCours: demoCampaigns.filter(c => c.status === 'active').length,
    demandesEnAttente: demoRequests.filter(
      r => r.status === 'PENDING_CLUB' || r.status === 'COUNTERED'
    ).length,
    validées7j: 3,
    refusées7j: 1,
  }),
  
  // Status labels
  getStatusLabel: (status: RequestStatus): string => {
    const labels: Record<RequestStatus, string> = {
      'PENDING_CLUB': 'Attente club',
      'COUNTERED': 'Contre-offre reçue',
      'ACCEPTED': 'Accord validé',
      'REFUSED_BY_CLUB': 'Refusé par le club',
      'REFUSED_BY_SPONSOR': 'Refusé',
      'EXPIRED': 'Expirée',
      'CANCELLED': 'Annulée',
    };
    return labels[status] || status;
  },
  
  getStatusColor: (status: RequestStatus): string => {
    const colors: Record<RequestStatus, string> = {
      'PENDING_CLUB': '#F59E0B', // warning
      'COUNTERED': '#8B5CF6', // purple
      'ACCEPTED': '#10B981', // success
      'REFUSED_BY_CLUB': '#EF4444', // error
      'REFUSED_BY_SPONSOR': '#EF4444',
      'EXPIRED': '#6B7280', // gray
      'CANCELLED': '#6B7280',
    };
    return colors[status] || '#6B7280';
  },
};
