import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

/**
 * Écran d'intro simplifié au maximum
 * - Redirige directement vers le dashboard après 100ms
 * - Pas de vidéo, pas de logo, pas de bouton
 */
export default function IntroAnimationScreen() {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    // Set default themes and complete onboarding
    const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore.getState();
    setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
    completeOnboarding();

    // Navigate immediately to dashboard
    console.log('[Intro] Direct navigation to dashboard');
    router.replace('/(tabs)');
  }, [router]);

  // Just a dark screen while redirecting
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
});
