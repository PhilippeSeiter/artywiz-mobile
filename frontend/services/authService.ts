import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const AUTH_KEY = '@artywiz_auth';

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

    // Save to AsyncStorage
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
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

    // Save to AsyncStorage
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(AUTH_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_KEY);
  }

  static async updateProfile(profileId: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (user) {
      user.profileId = profileId;
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
