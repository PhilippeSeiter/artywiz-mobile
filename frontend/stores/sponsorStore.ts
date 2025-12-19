import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Campaign, 
  Request, 
  SponsorBudget, 
  SponsorProfile, 
  SponsorNotification,
  BudgetTransaction,
  RequestStatus 
} from '../types/sponsor';

interface SponsorState {
  // Profile
  sponsorProfile: SponsorProfile | null;
  
  // Mode (club ou sponsor)
  isSponsorMode: boolean;
  
  // Campaigns
  campaigns: Campaign[];
  
  // Requests/Deals
  requests: Request[];
  
  // Budget
  budget: SponsorBudget;
  budgetHistory: BudgetTransaction[];
  
  // Notifications
  notifications: SponsorNotification[];
  unreadCount: number;
  
  // Actions - Mode
  setSponsorMode: (isSponsor: boolean) => void;
  
  // Actions - Profile
  setSponsorProfile: (profile: SponsorProfile) => void;
  updateSponsorProfile: (updates: Partial<SponsorProfile>) => void;
  
  // Actions - Campaigns
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  pauseCampaign: (id: string) => void;
  resumeCampaign: (id: string) => void;
  endCampaign: (id: string) => void;
  
  // Actions - Requests
  sendOffer: (request: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'budgetState'>) => Request;
  acceptCounterOffer: (requestId: string) => void;
  refuseCounterOffer: (requestId: string) => void;
  makeNewOffer: (requestId: string, amount: number, message?: string) => void;
  cancelRequest: (requestId: string) => void;
  
  // Actions - Budget
  rechargerBudget: (amount: number) => void;
  
  // Actions - Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<SponsorNotification, 'id' | 'createdAt' | 'read'>) => void;
  
  // Helpers
  getRequestsByStatus: (status: RequestStatus | RequestStatus[]) => Request[];
  getCampaignRequests: (campaignId: string) => Request[];
  getPendingRequestsCount: () => number;
}

export const useSponsorStore = create<SponsorState>()(
  persist(
    (set, get) => ({
      // Initial state
      sponsorProfile: null,
      isSponsorMode: false,
      campaigns: [],
      requests: [],
      budget: {
        disponible: 500, // Initial demo balance
        engagé: 0,
        consommé: 0,
        currency: '€',
      },
      budgetHistory: [],
      notifications: [],
      unreadCount: 0,
      
      // Mode
      setSponsorMode: (isSponsor) => set({ isSponsorMode: isSponsor }),
      
      // Profile
      setSponsorProfile: (profile) => set({ sponsorProfile: profile }),
      updateSponsorProfile: (updates) => set((state) => ({
        sponsorProfile: state.sponsorProfile 
          ? { ...state.sponsorProfile, ...updates }
          : null
      })),
      
      // Campaigns
      createCampaign: (campaignData) => {
        const campaign: Campaign = {
          ...campaignData,
          id: `camp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            ciblés: 0,
            validés: 0,
            refusés: 0,
            enAttente: 0,
          },
        };
        set((state) => ({ campaigns: [...state.campaigns, campaign] }));
        return campaign;
      },
      
      updateCampaign: (id, updates) => set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      })),
      
      pauseCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, status: 'paused', updatedAt: new Date().toISOString() } : c
        ),
      })),
      
      resumeCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, status: 'active', updatedAt: new Date().toISOString() } : c
        ),
      })),
      
      endCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, status: 'ended', updatedAt: new Date().toISOString() } : c
        ),
      })),
      
      // Requests
      sendOffer: (requestData) => {
        const { budget } = get();
        const amount = requestData.offerSponsor.amount;
        
        // Check budget
        if (amount > budget.disponible) {
          throw new Error('Budget insuffisant');
        }
        
        const request: Request = {
          ...requestData,
          id: `req_${Date.now()}`,
          status: 'PENDING_CLUB',
          budgetState: {
            reservedAmount: amount,
            consumedAmount: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Reserve budget
        set((state) => ({
          requests: [...state.requests, request],
          budget: {
            ...state.budget,
            disponible: state.budget.disponible - amount,
            engagé: state.budget.engagé + amount,
          },
          budgetHistory: [
            ...state.budgetHistory,
            {
              id: `tx_${Date.now()}`,
              type: 'reservation',
              amount: amount,
              description: `Offre envoyée à ${requestData.clubName}`,
              requestId: request.id,
              campaignId: requestData.campaignId,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        
        return request;
      },
      
      acceptCounterOffer: (requestId) => {
        const request = get().requests.find((r) => r.id === requestId);
        if (!request || !request.counterOfferClub) return;
        
        const finalAmount = request.counterOfferClub.amount;
        const previousReserved = request.budgetState.reservedAmount;
        const difference = finalAmount - previousReserved;
        
        // Check if we need more budget
        if (difference > get().budget.disponible) {
          throw new Error('Budget insuffisant pour accepter cette contre-offre');
        }
        
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'ACCEPTED',
                  finalPrice: finalAmount,
                  budgetState: {
                    reservedAmount: 0,
                    consumedAmount: finalAmount,
                  },
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
          budget: {
            ...state.budget,
            disponible: state.budget.disponible - difference,
            engagé: state.budget.engagé - previousReserved,
            consommé: state.budget.consommé + finalAmount,
          },
          budgetHistory: [
            ...state.budgetHistory,
            {
              id: `tx_${Date.now()}`,
              type: 'consommation',
              amount: finalAmount,
              description: `Accord validé avec ${request.clubName}`,
              requestId,
              campaignId: request.campaignId,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        
        // Update campaign stats
        const { campaigns } = get();
        const campaign = campaigns.find((c) => c.id === request.campaignId);
        if (campaign) {
          get().updateCampaign(campaign.id, {
            stats: {
              ...campaign.stats,
              validés: campaign.stats.validés + 1,
              enAttente: campaign.stats.enAttente - 1,
            },
          });
        }
      },
      
      refuseCounterOffer: (requestId) => {
        const request = get().requests.find((r) => r.id === requestId);
        if (!request) return;
        
        const reservedAmount = request.budgetState.reservedAmount;
        
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'REFUSED_BY_SPONSOR',
                  budgetState: { reservedAmount: 0, consumedAmount: 0 },
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
          budget: {
            ...state.budget,
            disponible: state.budget.disponible + reservedAmount,
            engagé: state.budget.engagé - reservedAmount,
          },
          budgetHistory: [
            ...state.budgetHistory,
            {
              id: `tx_${Date.now()}`,
              type: 'liberation',
              amount: reservedAmount,
              description: `Contre-offre refusée - ${request.clubName}`,
              requestId,
              campaignId: request.campaignId,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },
      
      makeNewOffer: (requestId, amount, message) => {
        const request = get().requests.find((r) => r.id === requestId);
        if (!request) return;
        
        const previousReserved = request.budgetState.reservedAmount;
        const difference = amount - previousReserved;
        
        if (difference > get().budget.disponible) {
          throw new Error('Budget insuffisant');
        }
        
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'PENDING_CLUB',
                  offerSponsor: {
                    amount,
                    currency: '€',
                    createdAt: new Date().toISOString(),
                    message,
                  },
                  budgetState: {
                    ...r.budgetState,
                    reservedAmount: amount,
                  },
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
          budget: {
            ...state.budget,
            disponible: state.budget.disponible - difference,
            engagé: state.budget.engagé + difference,
          },
        }));
      },
      
      cancelRequest: (requestId) => {
        const request = get().requests.find((r) => r.id === requestId);
        if (!request) return;
        
        const reservedAmount = request.budgetState.reservedAmount;
        
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'CANCELLED',
                  budgetState: { reservedAmount: 0, consumedAmount: 0 },
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
          budget: {
            ...state.budget,
            disponible: state.budget.disponible + reservedAmount,
            engagé: state.budget.engagé - reservedAmount,
          },
          budgetHistory: [
            ...state.budgetHistory,
            {
              id: `tx_${Date.now()}`,
              type: 'liberation',
              amount: reservedAmount,
              description: `Demande annulée - ${request.clubName}`,
              requestId,
              campaignId: request.campaignId,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },
      
      // Budget
      rechargerBudget: (amount) => set((state) => ({
        budget: {
          ...state.budget,
          disponible: state.budget.disponible + amount,
        },
        budgetHistory: [
          ...state.budgetHistory,
          {
            id: `tx_${Date.now()}`,
            type: 'recharge',
            amount,
            description: 'Recharge de budget',
            createdAt: new Date().toISOString(),
          },
        ],
      })),
      
      // Notifications
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
      })),
      
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      })),
      
      addNotification: (notificationData) => set((state) => ({
        notifications: [
          {
            ...notificationData,
            id: `notif_${Date.now()}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ],
        unreadCount: state.unreadCount + 1,
      })),
      
      // Helpers
      getRequestsByStatus: (status) => {
        const statuses = Array.isArray(status) ? status : [status];
        return get().requests.filter((r) => statuses.includes(r.status));
      },
      
      getCampaignRequests: (campaignId) => {
        return get().requests.filter((r) => r.campaignId === campaignId);
      },
      
      getPendingRequestsCount: () => {
        return get().requests.filter(
          (r) => r.status === 'PENDING_CLUB' || r.status === 'COUNTERED'
        ).length;
      },
    }),
    {
      name: 'sponsor-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
