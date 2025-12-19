import { create } from 'zustand';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isLoggingOut: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, profileId: string) => Promise<void>;
  signup: (email: string, password: string, name: string, profileId: string) => Promise<void>;
  logout: () => Promise<boolean>;
  initialize: () => Promise<void>;
  updateProfile: (profileId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  isLoggingOut: false,

  setUser: (user) => set({ user }),

  login: async (email, password, profileId) => {
    set({ isLoading: true });
    try {
      const user = await AuthService.login(email, password, profileId);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (email, password, name, profileId) => {
    set({ isLoading: true });
    try {
      const user = await AuthService.signup(email, password, name, profileId);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    // Prevent double logout
    if (get().isLoggingOut) return false;
    
    set({ isLoggingOut: true });
    try {
      // Clear user state FIRST
      set({ user: null });
      // Then clear storage
      await AuthService.logout();
      set({ isLoggingOut: false });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoggingOut: false });
      return false;
    }
  },

  initialize: async () => {
    try {
      const user = await AuthService.getCurrentUser();
      set({ user, isInitialized: true });
    } catch (error) {
      console.error('Initialize error:', error);
      set({ user: null, isInitialized: true });
    }
  },

  updateProfile: async (profileId) => {
    await AuthService.updateProfile(profileId);
    const user = await AuthService.getCurrentUser();
    set({ user });
  },
}));
