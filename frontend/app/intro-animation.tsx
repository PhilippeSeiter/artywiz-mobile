import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

export default function IntroAnimationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore();
  const hasNavigated = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const goToDashboard = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    
    // Set default themes
    setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
    completeOnboarding();
    
    // Navigate
    router.replace('/(tabs)');
  };

  // Setup video on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const video = document.createElement('video');
        video.src = VIDEO_URL;
        video.autoplay = true;
        video.loop = false;
        video.muted = true;
        video.playsInline = true;
        video.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:0;pointer-events:none;';
        video.onended = goToDashboard;
        document.body.appendChild(video);
        videoRef.current = video;
        video.play().catch(() => {});
      } catch (e) {
        console.warn('Video error:', e);
      }
    }

    // Fallback auto-skip after 20 seconds
    const timer = setTimeout(goToDashboard, 20000);

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.remove();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Big visible button at bottom */}
      <View style={[styles.buttonWrapper, { paddingBottom: insets.bottom + 40 }]}>
        <Pressable
          onPress={goToDashboard}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.buttonText}>Passer l'intro →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#0056CC',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
