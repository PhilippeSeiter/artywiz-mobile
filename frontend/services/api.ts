/**
 * Centralized API client for Artywiz
 * Handles all HTTP requests with authentication, error handling, and token refresh
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Types
export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Storage keys
const TOKEN_KEY = '@artywiz_tokens';

// Get base URL from environment
const getBaseUrl = (): string => {
  // Use environment variable or fallback
  const envUrl = Constants.expoConfig?.extra?.backendUrl 
    || process.env.EXPO_PUBLIC_BACKEND_URL;
  
  if (envUrl) return envUrl;
  
  // Default for development
  if (Platform.OS === 'web') {
    return '/api';
  }
  return 'http://localhost:8001/api';
};

const BASE_URL = getBaseUrl();

// Token storage helpers
const storage = {
  async getTokens(): Promise<TokenPair | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(TOKEN_KEY);
        return data ? JSON.parse(data) : null;
      }
      const data = await AsyncStorage.getItem(TOKEN_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setTokens(tokens: TokenPair): Promise<void> {
    try {
      const data = JSON.stringify(tokens);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, data);
        return;
      }
      await AsyncStorage.setItem(TOKEN_KEY, data);
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        return;
      }
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  },
};

// API Client class
class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<TokenPair | null> | null = null;

  /**
   * Make an authenticated request
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const tokens = await storage.getTokens();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (tokens?.access_token) {
      headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }

    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - try to refresh token
      if (response.status === 401 && tokens?.refresh_token) {
        const newTokens = await this.refreshTokens(tokens.refresh_token);
        
        if (newTokens) {
          // Retry request with new token
          headers['Authorization'] = `Bearer ${newTokens.access_token}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request error:', error);
      throw {
        message: 'Erreur de connexion au serveur',
        status: 0,
      } as ApiError;
    }
  }

  /**
   * Handle response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.detail || errorData.message || 'Une erreur est survenue',
        status: response.status,
        detail: errorData.detail,
      } as ApiError;
    }

    // Handle empty response
    const text = await response.text();
    if (!text) return {} as T;
    
    return JSON.parse(text) as T;
  }

  /**
   * Refresh access token
   */
  private async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh(refreshToken);
    
    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(refreshToken: string): Promise<TokenPair | null> {
    try {
      const response = await fetch(`${BASE_URL}/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const tokens: TokenPair = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        };
        await storage.setTokens(tokens);
        return tokens;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Clear tokens on refresh failure
    await storage.clearTokens();
    return null;
  }

  // Convenience methods
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export storage for auth store
export const tokenStorage = storage;
