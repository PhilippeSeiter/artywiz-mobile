import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Document status types
export type DocStatus = 'brouillon' | 'en_cours' | 'pret' | 'publie';

// Publication platform types
export type PublishPlatform = 'facebook' | 'instagram' | 'linkedin' | 'download' | 'email';

// Publication record
export interface PublicationEntry {
  platform: PublishPlatform;
  publishedAt: number;
  supportType: string;
  postUrl?: string;
}

interface DocumentState {
  id: string;
  status: DocStatus;
  profileId?: string; // Profile that owns this document
  selectedSupports: string[]; // 'post', 'reel', 'affiche', etc.
  generationStartedAt?: number;
  publishedAt?: number;
  // Publication history
  publications: PublicationEntry[];
}

interface DocumentStore {
  // Document states by ID
  documentStates: Record<string, DocumentState>;
  
  // Documents being generated (for animation)
  generatingDocs: string[];
  
  // Ready docs count for badge
  readyDocsCount: number;
  
  // Viewed docs (to track "new" status)
  viewedDocs: string[];
  
  // Actions
  startGeneration: (docId: string, selectedSupports: string[], profileId?: string) => void;
  completeGeneration: (docId: string) => void;
  publishDocument: (docId: string) => void;
  publishToPlateform: (docId: string, platform: PublishPlatform, supportType: string, postUrl?: string) => void;
  getDocumentStatus: (docId: string) => DocStatus;
  getDocumentState: (docId: string) => DocumentState | undefined;
  getPublicationHistory: (docId: string) => PublicationEntry[];
  isDocumentGenerating: (docId: string) => boolean;
  isDocumentReady: (docId: string) => boolean;
  isDocumentPublished: (docId: string) => boolean;
  
  // Legacy actions (for compatibility)
  addToGeneration: (docId: string) => void;
  removeFromGeneration: (docId: string) => void;
  markAsViewed: (docId: string) => void;
  setReadyDocsCount: (count: number) => void;
  incrementReadyDocs: () => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documentStates: {},
      generatingDocs: [],
      readyDocsCount: 8, // Initial count from generated previews
      viewedDocs: [],

      // Start document generation
      startGeneration: (docId, selectedSupports, profileId) => {
        set((state) => ({
          documentStates: {
            ...state.documentStates,
            [docId]: {
              id: docId,
              status: 'en_cours',
              profileId,
              selectedSupports,
              generationStartedAt: Date.now(),
              publications: [],
            },
          },
          generatingDocs: [...state.generatingDocs, docId],
        }));
        
        // Simulate generation completion after 30 seconds
        setTimeout(() => {
          get().completeGeneration(docId);
        }, 30000);
      },

      // Complete generation
      completeGeneration: (docId) => {
        set((state) => ({
          documentStates: {
            ...state.documentStates,
            [docId]: {
              ...state.documentStates[docId],
              status: 'pret',
              publications: state.documentStates[docId]?.publications || [],
            },
          },
          generatingDocs: state.generatingDocs.filter(id => id !== docId),
          readyDocsCount: state.readyDocsCount + 1,
        }));
      },

      // Publish document (legacy - marks as published without platform details)
      publishDocument: (docId) => {
        set((state) => ({
          documentStates: {
            ...state.documentStates,
            [docId]: {
              ...state.documentStates[docId],
              status: 'publie',
              publishedAt: Date.now(),
              publications: state.documentStates[docId]?.publications || [],
            },
          },
        }));
      },

      // Publish to specific platform with details
      publishToPlateform: (docId, platform, supportType, postUrl) => {
        const newPublication: PublicationEntry = {
          platform,
          publishedAt: Date.now(),
          supportType,
          postUrl,
        };
        
        set((state) => {
          const currentState = state.documentStates[docId];
          const existingPublications = currentState?.publications || [];
          
          return {
            documentStates: {
              ...state.documentStates,
              [docId]: {
                ...currentState,
                id: docId,
                status: 'publie',
                publishedAt: Date.now(),
                selectedSupports: currentState?.selectedSupports || [supportType],
                publications: [...existingPublications, newPublication],
              },
            },
          };
        });
      },

      // Get document status
      getDocumentStatus: (docId) => {
        const state = get().documentStates[docId];
        return state?.status || 'brouillon';
      },

      // Get document state
      getDocumentState: (docId) => {
        return get().documentStates[docId];
      },

      // Get publication history for a document
      getPublicationHistory: (docId) => {
        return get().documentStates[docId]?.publications || [];
      },

      // Check if generating
      isDocumentGenerating: (docId) => {
        return get().generatingDocs.includes(docId);
      },

      // Check if ready
      isDocumentReady: (docId) => {
        const state = get().documentStates[docId];
        return state?.status === 'pret';
      },

      // Check if published
      isDocumentPublished: (docId) => {
        const state = get().documentStates[docId];
        return state?.status === 'publie';
      },

      // Legacy: Add to generation
      addToGeneration: (docId) => {
        get().startGeneration(docId, ['post']); // Default to post
      },

      // Legacy: Remove from generation
      removeFromGeneration: (docId) => {
        set((state) => ({
          generatingDocs: state.generatingDocs.filter(id => id !== docId),
        }));
      },

      markAsViewed: (docId) => {
        set((state) => ({
          viewedDocs: [...state.viewedDocs, docId],
        }));
      },

      setReadyDocsCount: (count) => {
        set({ readyDocsCount: count });
      },

      incrementReadyDocs: () => {
        set((state) => ({
          readyDocsCount: state.readyDocsCount + 1,
        }));
      },
    }),
    {
      name: 'document-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
