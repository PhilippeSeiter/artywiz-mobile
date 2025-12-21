/**
 * Authentication hook using React Query
 * Provides login, logout, register, and user state management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi, User, RegisterRequest, LoginRequest, ApiError } from '../services/authApiService';
import { tokenStorage } from '../services/api';
import { useEffect, useState } from 'react';

// Query keys
const AUTH_KEYS = {
  user: ['auth', 'user'] as const,
  isAuthenticated: ['auth', 'isAuthenticated'] as const,
};

/**
 * Hook to get current authenticated user
 */
export function useCurrentUser() {
  const [isInitialized, setIsInitialized] = useState(false);

  const query = useQuery({
    queryKey: AUTH_KEYS.user,
    queryFn: async () => {
      // First check if we have tokens
      const isAuth = await authApi.isAuthenticated();
      if (!isAuth) return null;
      
      try {
        return await authApi.getCurrentUser();
      } catch (error) {
        // Token might be invalid, clear it
        await tokenStorage.clearTokens();
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });

  useEffect(() => {
    if (!query.isLoading) {
      setIsInitialized(true);
    }
  }, [query.isLoading]);

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isInitialized,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      // Update user in cache
      queryClient.setQueryData(AUTH_KEYS.user, response.user);
      
      // Login always goes directly to dashboard
      router.replace('/(tabs)');
    },
    onError: (error: ApiError) => {
      console.error('Login error:', error.message);
    },
  });
}

/**
 * Hook for registration mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      // Update user in cache
      queryClient.setQueryData(AUTH_KEYS.user, response.user);
      
      // New users go to sector selection first
      router.replace('/sector-selection');
    },
    onError: (error: ApiError) => {
      console.error('Register error:', error.message);
    },
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear user from cache
      queryClient.setQueryData(AUTH_KEYS.user, null);
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.user });
      
      // Navigate to welcome screen
      router.replace('/');
    },
  });
}

/**
 * Hook to update user profiles
 */
export function useUpdateProfiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profiles, activeIndex }: { profiles: any[]; activeIndex?: number }) =>
      authApi.updateProfiles(profiles, activeIndex),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(AUTH_KEYS.user, updatedUser);
    },
  });
}

/**
 * Hook to update themes
 */
export function useUpdateThemes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (themes: string[]) => authApi.updateThemes(themes),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(AUTH_KEYS.user, updatedUser);
    },
  });
}

/**
 * Hook to complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ profiles, themes }: { profiles: any[]; themes: string[] }) =>
      authApi.completeOnboarding(profiles, themes),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(AUTH_KEYS.user, updatedUser);
      router.replace('/(tabs)');
    },
  });
}

/**
 * Combined auth hook for convenience
 */
export function useAuth() {
  const { user, isLoading, isInitialized, error, refetch } = useCurrentUser();
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();

  return {
    // State
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    error,
    
    // Actions
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
    refetch,
    
    // Mutation states
    isLoggingIn: login.isPending,
    isRegistering: register.isPending,
    isLoggingOut: logout.isPending,
    loginError: login.error as ApiError | null,
    registerError: register.error as ApiError | null,
  };
}
