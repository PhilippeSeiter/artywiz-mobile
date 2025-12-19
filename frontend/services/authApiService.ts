/**
 * Authentication API service
 * Handles user registration, login, and profile management via real backend
 */
import { api, tokenStorage, ApiError } from './api';

// Types matching backend models
export interface UserProfile {
  id: string;
  type: 'equipe' | 'club' | 'district' | 'ligue' | 'sponsor';
  name: string;
  logo?: string | null;
  club_id?: string | null;
  numero?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'sponsor';
  is_active: boolean;
  is_verified: boolean;
  profiles: UserProfile[];
  active_profile_index: number;
  selected_themes: string[];
  has_completed_onboarding: boolean;
  oauth_providers: string[];
  avatar?: string | null;
  phone?: string | null;
  created_at: string;
  last_login?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Auth API functions
export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users/register', data);
    
    // Save tokens
    await tokenStorage.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      expires_in: response.expires_in,
    });
    
    return response;
  },

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users/login', data);
    
    // Save tokens
    await tokenStorage.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      expires_in: response.expires_in,
    });
    
    return response;
  },

  /**
   * Logout - clear tokens
   */
  async logout(): Promise<void> {
    await tokenStorage.clearTokens();
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/users/me');
  },

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await tokenStorage.getTokens();
    return !!tokens?.access_token;
  },

  /**
   * Update user profile info
   */
  async updateProfile(data: { name?: string; avatar?: string; phone?: string }): Promise<User> {
    return api.put<User>('/users/me', data);
  },

  /**
   * Update user profiles (clubs, teams, etc.)
   */
  async updateProfiles(profiles: UserProfile[], activeIndex: number = 0): Promise<User> {
    return api.put<User>('/users/me/profiles', {
      profiles,
      active_profile_index: activeIndex,
    });
  },

  /**
   * Update selected themes
   */
  async updateThemes(themes: string[]): Promise<User> {
    return api.put<User>('/users/me/themes', { themes });
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(profiles: UserProfile[], themes: string[]): Promise<User> {
    return api.post<User>('/users/me/complete-onboarding', {
      profiles,
      themes,
    });
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/users/me/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Delete account
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
    await tokenStorage.clearTokens();
  },

  /**
   * Link OAuth provider
   */
  async linkOAuth(provider: string, providerUserId: string): Promise<void> {
    await api.post(`/users/me/link-oauth?provider=${provider}&provider_user_id=${providerUserId}`);
  },

  /**
   * Unlink OAuth provider
   */
  async unlinkOAuth(provider: string): Promise<void> {
    await api.delete(`/users/me/unlink-oauth/${provider}`);
  },
};

export type { ApiError };
