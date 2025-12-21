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
  startGeneration: (docId: string, selectedSupports: string[]) => void;
  completeGeneration: (docId: string) => void;
  publishDocument: (docId: string) => void;
  getDocumentStatus: (docId: string) => DocStatus;
  getDocumentState: (docId: string) => DocumentState | undefined;
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
      startGeneration: (docId, selectedSupports) => {
        set((state) => ({
          documentStates: {
            ...state.documentStates,
            [docId]: {
              id: docId,
              status: 'en_cours',
              selectedSupports,
              generationStartedAt: Date.now(),
            },
          },
          generatingDocs: [...state.generatingDocs, docId],
        }));
        
        // Simulate generation completion after 5 seconds
        setTimeout(() => {
          get().completeGeneration(docId);
        }, 5000);
      },

      // Complete generation
      completeGeneration: (docId) => {
        set((state) => ({
          documentStates: {
            ...state.documentStates,
            [docId]: {
              ...state.documentStates[docId],
              status: 'pret',
            },
          },
          generatingDocs: state.generatingDocs.filter(id => id !== docId),
          readyDocsCount: state.readyDocsCount + 1,
        }));
      },

      // Publish document
      publishDocument: (docId) => {
        set((state) => ({
          documentStates: {
            ...state.documentStates,
            [docId]: {
              ...state.documentStates[docId],
              status: 'publie',
              publishedAt: Date.now(),
            },
          },
        }));
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
