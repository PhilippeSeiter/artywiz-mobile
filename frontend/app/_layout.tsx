import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from '../providers/QueryProvider';
import { VideoDirectionProvider } from '../providers/VideoDirectionProvider';
import { VideoBackground } from '../components/VideoBackground';
import { useCurrentUser } from '../hooks/useAuth';
import { useNotificationStore } from '../stores/notificationStore';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { useAuthStore } from '../stores/authStore';

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
      {/* FOND GLOBAL - Ne bouge pas pendant les transitions */}
      <View style={styles.globalBackground}>
        <VideoBackground />
      </View>
      {/* CONTENU - Les écrans s'animent par-dessus le fond fixe */}
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
          animationDuration: 500,
          gestureEnabled: true,
          customAnimationOnGesture: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="profile-selection" />
        <Stack.Screen name="sector-selection" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="manage-profiles" />
        <Stack.Screen name="onboarding-themes" />
        <Stack.Screen name="boulangerie" />
        <Stack.Screen name="coiffure" />
        <Stack.Screen name="restaurants" />
        <Stack.Screen 
          name="promo-video" 
          options={{ 
            animation: 'fade',
            animationDuration: 300,
            gestureEnabled: false,
          }} 
        />
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

const styles = StyleSheet.create({
  globalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
});

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
