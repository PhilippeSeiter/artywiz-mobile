import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

/**
 * Écran d'intro simplifié - redirection directe vers le dashboard
 */
export default function IntroAnimationScreen() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigate after mount
  useEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(() => {
      // Set default themes and complete onboarding
      const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore.getState();
      setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
      completeOnboarding();

      console.log('[Intro] Navigating to dashboard...');
      router.replace('/(tabs)');
    }, 500); // Wait 500ms to ensure everything is ready

    return () => clearTimeout(timer);
  }, [mounted, router]);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
});
