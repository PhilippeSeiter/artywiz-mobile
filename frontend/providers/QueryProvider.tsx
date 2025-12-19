/**
 * React Query Provider for Artywiz
 * Provides caching, background updates, and optimistic mutations
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with sensible defaults for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes before data is considered stale
      staleTime: 5 * 60 * 1000,
      // Cache time: 30 minutes before unused data is garbage collected
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for mobile
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Export query client for direct access if needed
export { queryClient };
