import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from '../providers/QueryProvider';
import { VideoDirectionProvider } from '../providers/VideoDirectionProvider';
import { useCurrentUser } from '../hooks/useAuth';
import { useNotificationStore } from '../stores/notificationStore';

// Auth listener component - handles all auth-based navigation
function AuthNavigationHandler() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isInitialized } = useCurrentUser();
  const previousUser = useRef(user);

  useEffect(() => {
    if (!isInitialized) return;

    // Detect logout: user was logged in, now is null
    if (previousUser.current && !user) {
      console.log('[Auth] User logged out, navigating to welcome screen');
      // Small delay to ensure state is fully updated before navigation
      setTimeout(() => {
        router.replace('/');
      }, 50);
    }

    // Update previous user reference
    previousUser.current = user;
  }, [user, isInitialized]);

  return null;
}

function RootLayoutContent() {
  const initializeNotifications = useNotificationStore((state) => state.initialize);

  useEffect(() => {
    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthNavigationHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="document/[id]" />
        <Stack.Screen name="generated-doc/[id]" />
        <Stack.Screen 
          name="filter-modal" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <VideoDirectionProvider>
          <RootLayoutContent />
        </VideoDirectionProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
