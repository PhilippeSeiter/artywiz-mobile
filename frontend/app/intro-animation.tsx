import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

// This screen is disabled - immediately redirects to dashboard
export default function IntroAnimationScreen() {
  const router = useRouter();
  const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore();

  useEffect(() => {
    // Set default themes and complete onboarding
    setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
    completeOnboarding();
    
    // Immediate redirect to dashboard
    router.replace('/(tabs)');
  }, []);

  // Empty view - user will never see this
  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
}
