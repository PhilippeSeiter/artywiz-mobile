import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

// This screen is disabled - immediately redirects to dashboard
export default function IntroAnimationScreen() {
  const router = useRouter();

  useEffect(() => {
    // Small delay to allow component to mount first
    const timer = setTimeout(() => {
      // Set default themes and complete onboarding
      const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore.getState();
      setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
      completeOnboarding();
      
      // Redirect to dashboard
      router.replace('/(tabs)');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // Empty black view - user will barely see this
  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
}
