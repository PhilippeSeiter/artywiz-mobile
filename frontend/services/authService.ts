import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User } from '../types';

const AUTH_KEY = '@artywiz_auth';

// Hybrid storage that works on both web and native
const hybridAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
          const value = window.localStorage.getItem(key);
          console.log('[AuthService] Web getItem:', key, value ? 'found' : 'not found');
          return value;
        }
        return null;
      }
      const value = await AsyncStorage.getItem(key);
      console.log('[AuthService] Native getItem:', key, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.error('[AuthService] getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
          window.localStorage.setItem(key, value);
          console.log('[AuthService] Web setItem:', key);
          return;
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
      console.log('[AuthService] Native setItem:', key);
    } catch (error) {
      console.error('[AuthService] setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
          window.localStorage.removeItem(key);
          console.log('[AuthService] Web removeItem:', key);
          return;
        }
        return;
      }
      await AsyncStorage.removeItem(key);
      console.log('[AuthService] Native removeItem:', key);
    } catch (error) {
      console.error('[AuthService] removeItem error:', error);
    }
  },
};

export class AuthService {
  static async login(email: string, password: string, profileId: string): Promise<User> {
    // Mock validation
    if (!email || !password) {
      throw new Error('Email et mot de passe requis');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Format email invalide');
    }

    // Create mock user
    const user: User = {
      email,
      name: email.split('@')[0],
      profileId,
    };

    // Save to storage
    await hybridAuthStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }

  static async signup(email: string, password: string, name: string, profileId: string): Promise<User> {
    // Mock validation
    if (!email || !password || !name) {
      throw new Error('Tous les champs sont requis');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Format email invalide');
    }

    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    // Create mock user
    const user: User = {
      email,
      name,
      profileId,
    };

    // Save to storage
    await hybridAuthStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await hybridAuthStorage.getItem(AUTH_KEY);
      if (userJson) {
        console.log('[AuthService] Current user found');
        return JSON.parse(userJson);
      }
      console.log('[AuthService] No current user');
      return null;
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    await hybridAuthStorage.removeItem(AUTH_KEY);
  }

  static async updateProfile(profileId: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (user) {
      user.profileId = profileId;
      await hybridAuthStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
