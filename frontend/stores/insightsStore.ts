import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for social media insights
export interface SocialInsights {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  engagement: number; // Calculated: (likes + comments + shares) / impressions
  lastUpdated: number; // Timestamp
}

// Publication record with insights
export interface PublicationRecord {
  id: string;
  documentId: string;
  profileId: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'download' | 'email';
  supportType: 'post' | 'reel' | 'story' | 'affiche' | 'flyer' | 'video' | 'banniere';
  publishedAt: number;
  status: 'published' | 'scheduled' | 'failed';
  externalPostId?: string; // ID from the platform (for fetching insights)
  insights?: SocialInsights;
}

// Document history with all publications
export interface DocumentHistory {
  documentId: string;
  profileId: string;
  createdAt: number;
  preparedAt?: number;
  publications: PublicationRecord[];
  totalReach: number;
  totalEngagement: number;
}

interface InsightsStore {
  // Publication history by document ID
  documentHistories: Record<string, DocumentHistory>;
  
  // All publications (flat list for easy querying)
  allPublications: PublicationRecord[];
  
  // Actions
  recordPublication: (publication: Omit<PublicationRecord, 'id'>) => void;
  updatePublicationInsights: (publicationId: string, insights: SocialInsights) => void;
  getDocumentHistory: (documentId: string) => DocumentHistory | undefined;
  getProfilePublications: (profileId: string) => PublicationRecord[];
  getRecentPublications: (limit?: number) => PublicationRecord[];
  getTotalStats: (profileId?: string) => {
    totalPublications: number;
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagement: number;
  };
  
  // Mark document as prepared
  markDocumentPrepared: (documentId: string, profileId: string) => void;
  
  // Clear history (for testing)
  clearHistory: () => void;
}

export const useInsightsStore = create<InsightsStore>()(
  persist(
    (set, get) => ({
      documentHistories: {},
      allPublications: [],

      recordPublication: (publication) => {
        const id = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPublication: PublicationRecord = {
          ...publication,
          id,
        };

        set((state) => {
          // Update allPublications
          const newPublications = [...state.allPublications, newPublication];
          
          // Update documentHistories
          const existingHistory = state.documentHistories[publication.documentId];
          const updatedHistory: DocumentHistory = existingHistory
            ? {
                ...existingHistory,
                publications: [...existingHistory.publications, newPublication],
              }
            : {
                documentId: publication.documentId,
                profileId: publication.profileId,
                createdAt: Date.now(),
                publications: [newPublication],
                totalReach: 0,
                totalEngagement: 0,
              };

          return {
            allPublications: newPublications,
            documentHistories: {
              ...state.documentHistories,
              [publication.documentId]: updatedHistory,
            },
          };
        });
      },

      updatePublicationInsights: (publicationId, insights) => {
        set((state) => {
          // Update in allPublications
          const updatedPublications = state.allPublications.map((pub) =>
            pub.id === publicationId ? { ...pub, insights } : pub
          );

          // Find the publication to get documentId
          const publication = state.allPublications.find((p) => p.id === publicationId);
          if (!publication) return state;

          // Update in documentHistories
          const history = state.documentHistories[publication.documentId];
          if (!history) return { allPublications: updatedPublications };

          const updatedHistoryPublications = history.publications.map((pub) =>
            pub.id === publicationId ? { ...pub, insights } : pub
          );

          // Recalculate totals
          const totalReach = updatedHistoryPublications.reduce(
            (sum, pub) => sum + (pub.insights?.reach || 0),
            0
          );
          const totalEngagement = updatedHistoryPublications.reduce(
            (sum, pub) => sum + (pub.insights?.engagement || 0),
            0
          );

          return {
            allPublications: updatedPublications,
            documentHistories: {
              ...state.documentHistories,
              [publication.documentId]: {
                ...history,
                publications: updatedHistoryPublications,
                totalReach,
                totalEngagement: totalEngagement / updatedHistoryPublications.length,
              },
            },
          };
        });
      },

      getDocumentHistory: (documentId) => {
        return get().documentHistories[documentId];
      },

      getProfilePublications: (profileId) => {
        return get().allPublications.filter((pub) => pub.profileId === profileId);
      },

      getRecentPublications: (limit = 10) => {
        return get()
          .allPublications
          .sort((a, b) => b.publishedAt - a.publishedAt)
          .slice(0, limit);
      },

      getTotalStats: (profileId) => {
        const publications = profileId
          ? get().allPublications.filter((pub) => pub.profileId === profileId)
          : get().allPublications;

        const withInsights = publications.filter((pub) => pub.insights);
        
        const totalReach = withInsights.reduce((sum, pub) => sum + (pub.insights?.reach || 0), 0);
        const totalLikes = withInsights.reduce((sum, pub) => sum + (pub.insights?.likes || 0), 0);
        const totalComments = withInsights.reduce((sum, pub) => sum + (pub.insights?.comments || 0), 0);
        const totalShares = withInsights.reduce((sum, pub) => sum + (pub.insights?.shares || 0), 0);
        const avgEngagement = withInsights.length > 0
          ? withInsights.reduce((sum, pub) => sum + (pub.insights?.engagement || 0), 0) / withInsights.length
          : 0;

        return {
          totalPublications: publications.length,
          totalReach,
          totalLikes,
          totalComments,
          totalShares,
          avgEngagement,
        };
      },

      markDocumentPrepared: (documentId, profileId) => {
        set((state) => {
          const existingHistory = state.documentHistories[documentId];
          
          if (existingHistory) {
            return {
              documentHistories: {
                ...state.documentHistories,
                [documentId]: {
                  ...existingHistory,
                  preparedAt: Date.now(),
                },
              },
            };
          }

          // Create new history if doesn't exist
          return {
            documentHistories: {
              ...state.documentHistories,
              [documentId]: {
                documentId,
                profileId,
                createdAt: Date.now(),
                preparedAt: Date.now(),
                publications: [],
                totalReach: 0,
                totalEngagement: 0,
              },
            },
          };
        });
      },

      clearHistory: () => {
        set({
          documentHistories: {},
          allPublications: [],
        });
      },
    }),
    {
      name: 'insights-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
