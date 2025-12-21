import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Check if localStorage is available (client-side only) - called at runtime
const canUseLocalStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

// Hybrid storage that works on both web and native
const hybridStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        // Check if localStorage is available (client-side only)
        if (!canUseLocalStorage()) {
          console.log('[UserPreferences] SSR mode, skipping getItem');
          return null;
        }
        // Use localStorage on web
        const value = window.localStorage.getItem(name);
        console.log('[UserPreferences] Web getItem:', name, value ? 'found' : 'not found');
        return value;
      }
      // Use AsyncStorage on native
      const value = await AsyncStorage.getItem(name);
      console.log('[UserPreferences] Native getItem:', name, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.error('[UserPreferences] getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Check if localStorage is available (client-side only)
        if (!canUseLocalStorage()) {
          console.log('[UserPreferences] SSR mode, skipping setItem');
          return;
        }
        window.localStorage.setItem(name, value);
        console.log('[UserPreferences] Web setItem:', name);
        return;
      }
      await AsyncStorage.setItem(name, value);
      console.log('[UserPreferences] Native setItem:', name);
    } catch (error) {
      console.error('[UserPreferences] setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Check if localStorage is available (client-side only)
        if (!canUseLocalStorage()) {
          return;
        }
        window.localStorage.removeItem(name);
        return;
      }
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('[UserPreferences] removeItem error:', error);
    }
  },
};

export interface UserProfile {
  type: 'ligue' | 'district' | 'club' | 'equipe';
  id: string;
  name: string;
  logo?: string; // Logo du profil
  clubId?: string; // For equipe profiles
  numero?: string; // Profile number
}

// 4 profils conteneurs de base (équipes, clubs, districts, ligues - pas de sponsors)
export const DEFAULT_BASE_PROFILES: UserProfile[] = [
  { type: 'equipe', id: 'base_equipe', name: 'Une Équipe' },
  { type: 'club', id: 'base_club', name: 'Un Club' },
  { type: 'district', id: 'base_district', name: 'Un District' },
  { type: 'ligue', id: 'base_ligue', name: 'Une Ligue' },
];

export interface SponsoringPrefs {
  autoSponsoringEnabled: boolean;
  pricePerDoc: number;
  maxSponsorsPerDoc: number;
}

// Map profileId -> SponsoringPrefs (préférences par profil)
export type ProfileSponsoringPrefs = Record<string, SponsoringPrefs>;

// Social account connection info stored per profile
export interface SocialConnection {
  platform: 'meta' | 'linkedin';
  connected: boolean;
  connectedAt?: string;
  accounts: {
    id: string;
    name: string;
    type: 'facebook' | 'instagram' | 'linkedin_personal' | 'linkedin_company';
    pictureUrl?: string;
    isDefault: boolean;
  }[];
}

// Map of profile ID -> social connections
export type ProfileSocialConnections = Record<string, SocialConnection[]>;

interface UserPreferencesState {
  // Selected profiles during onboarding
  selectedProfiles: UserProfile[];
  activeProfileIndex: number;
  
  // Selected themes
  selectedThemes: string[];
  
  // Sponsoring preferences (global - legacy, kept for compatibility)
  sponsoringPrefs: SponsoringPrefs;
  
  // Sponsoring preferences per profile (new)
  profileSponsoringPrefs: ProfileSponsoringPrefs;
  
  // Social connections per profile
  profileSocialConnections: ProfileSocialConnections;
  
  // First connection flag
  hasCompletedOnboarding: boolean;
  
  // Actions
  setSelectedProfiles: (profiles: UserProfile[]) => void;
  addProfile: (profile: UserProfile) => void;
  removeProfile: (profileId: string) => void;
  setActiveProfile: (index: number) => void;
  setSelectedThemes: (themes: string[]) => void;
  setSponsoringPrefs: (prefs: SponsoringPrefs) => void;
  
  // Profile-specific sponsoring actions (new)
  setProfileSponsoringPrefs: (profileId: string, prefs: SponsoringPrefs) => void;
  getProfileSponsoringPrefs: (profileId: string) => SponsoringPrefs;
  
  // Social connection actions
  setSocialConnection: (profileId: string, connection: SocialConnection) => void;
  removeSocialConnection: (profileId: string, platform: 'meta' | 'linkedin') => void;
  getSocialConnections: (profileId: string) => SocialConnection[];
  
  completeOnboarding: () => void;
  resetPreferences: () => void;
}

const initialSponsoringPrefs: SponsoringPrefs = {
  autoSponsoringEnabled: false, // Désactivé par défaut
  pricePerDoc: 10,
  maxSponsorsPerDoc: 5,
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      // Démarrer avec une liste vide - l'utilisateur ajoutera ses comptes
      selectedProfiles: [],
      activeProfileIndex: 0,
      selectedThemes: [],
      sponsoringPrefs: initialSponsoringPrefs,
      profileSponsoringPrefs: {}, // Préférences par profil
      profileSocialConnections: {},
      hasCompletedOnboarding: false,

      setSelectedProfiles: (profiles) => {
        // S'assurer qu'il y a toujours au minimum les profils de base
        if (profiles.length === 0) {
          set({ selectedProfiles: [...DEFAULT_BASE_PROFILES] });
        } else {
          set({ selectedProfiles: profiles });
        }
      },
      
      addProfile: (profile) => {
        const current = get().selectedProfiles;
        // Limite augmentée à 30 profils
        if (current.length < 30) {
          set({ selectedProfiles: [...current, profile] });
        }
      },
      
      removeProfile: (profileId) => {
        const { profileSocialConnections, profileSponsoringPrefs } = get();
        const newConnections = { ...profileSocialConnections };
        const newSponsoringPrefs = { ...profileSponsoringPrefs };
        delete newConnections[profileId];
        delete newSponsoringPrefs[profileId];
        set((state) => ({
          selectedProfiles: state.selectedProfiles.filter(p => p.id !== profileId),
          profileSocialConnections: newConnections,
          profileSponsoringPrefs: newSponsoringPrefs,
        }));
      },
      
      setActiveProfile: (index) => set({ activeProfileIndex: index }),
      
      setSelectedThemes: (themes) => set({ selectedThemes: themes }),
      
      setSponsoringPrefs: (prefs) => set({ sponsoringPrefs: prefs }),
      
      // Profile-specific sponsoring actions
      setProfileSponsoringPrefs: (profileId, prefs) => {
        set((state) => ({
          profileSponsoringPrefs: {
            ...state.profileSponsoringPrefs,
            [profileId]: prefs,
          },
        }));
      },
      
      getProfileSponsoringPrefs: (profileId) => {
        const prefs = get().profileSponsoringPrefs[profileId];
        // Return profile-specific prefs or default
        return prefs || initialSponsoringPrefs;
      },
      
      // Social connection actions
      setSocialConnection: (profileId, connection) => {
        set((state) => {
          const existing = state.profileSocialConnections[profileId] || [];
          // Remove old connection for same platform, add new one
          const filtered = existing.filter(c => c.platform !== connection.platform);
          return {
            profileSocialConnections: {
              ...state.profileSocialConnections,
              [profileId]: [...filtered, connection],
            },
          };
        });
      },
      
      removeSocialConnection: (profileId, platform) => {
        set((state) => {
          const existing = state.profileSocialConnections[profileId] || [];
          return {
            profileSocialConnections: {
              ...state.profileSocialConnections,
              [profileId]: existing.filter(c => c.platform !== platform),
            },
          };
        });
      },
      
      getSocialConnections: (profileId) => {
        return get().profileSocialConnections[profileId] || [];
      },
      
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      resetPreferences: () => set({
        // Remettre les profils conteneurs de base (jamais vide)
        selectedProfiles: [...DEFAULT_BASE_PROFILES],
        activeProfileIndex: 0,
        selectedThemes: [],
        sponsoringPrefs: initialSponsoringPrefs,
        profileSponsoringPrefs: {},
        profileSocialConnections: {},
        hasCompletedOnboarding: false,
      }),
    }),
    {
      name: 'user-preferences-storage',
      storage: createJSONStorage(() => hybridStorage),
      // Partialize: persist everything except functions
      partialize: (state) => ({
        selectedProfiles: state.selectedProfiles,
        activeProfileIndex: state.activeProfileIndex,
        selectedThemes: state.selectedThemes,
        sponsoringPrefs: state.sponsoringPrefs,
        profileSponsoringPrefs: state.profileSponsoringPrefs,
        profileSocialConnections: state.profileSocialConnections,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      // Log rehydration for debugging
      onRehydrateStorage: () => (state, error) => {
        console.log('[UserPreferences] Rehydrated from storage:', state ? 'Success' : 'Failed');
        if (error) {
          console.error('[UserPreferences] Rehydration error:', error);
        }
        if (state) {
          console.log('[UserPreferences] Profiles:', state.selectedProfiles?.length || 0);
          console.log('[UserPreferences] Themes:', state.selectedThemes?.length || 0);
          console.log('[UserPreferences] Onboarding completed:', state.hasCompletedOnboarding);
          
          // Pour un nouvel utilisateur, les profils restent vides
          // Ils créeront leur premier compte via l'écran "Mes Comptes"
          // Ne PAS restaurer les profils par défaut automatiquement
        }
      },
    }
  )
);

// Available themes
export const ARTYWIZ_THEMES = [
  { id: 'match_com', name: 'Communication de matchs', icon: 'football' },
  { id: 'community', name: 'Animer ma communauté', icon: 'people' },
  { id: 'marketing', name: 'Opérations marketing', icon: 'megaphone' },
  { id: 'events', name: 'Événements', icon: 'calendar' },
  { id: 'sponsors', name: 'Valoriser mes sponsors', icon: 'star' },
];

export const GENERIC_THEMES = [
  { id: 'tips', name: 'Conseils foot & forme', icon: 'fitness' },
  { id: 'ephemeride', name: 'Éphéméride', icon: 'today' },
  { id: 'football_events', name: 'Fête / événement foot', icon: 'trophy' },
  { id: 'recruitment', name: 'Recrutement', icon: 'person-add' },
  { id: 'humor', name: 'Animation & humour', icon: 'happy' },
  { id: 'admin', name: 'Administratif', icon: 'document-text' },
  { id: 'values', name: 'Engagements & valeurs', icon: 'heart' },
  { id: 'club_life', name: 'Vie associative & culture club', icon: 'home' },
];
