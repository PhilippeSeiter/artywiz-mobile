import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

const { width, height } = Dimensions.get('window');

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

// Auto-skip delay in milliseconds (10 seconds)
const AUTO_SKIP_DELAY = 10000;

export default function IntroAnimationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore();
  const hasNavigatedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleSkipIntro = () => {
    // Prevent double navigation
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    console.log('Skipping intro...');

    // Set default themes
    const defaultThemes = [
      ...ARTYWIZ_THEMES.map(t => t.id),
      'ephemeride',
    ];
    
    setSelectedThemes(defaultThemes);
    completeOnboarding();
    
    // Navigate to main app
    router.replace('/(tabs)');
  };

  // Setup video and auto-skip
  useEffect(() => {
    console.log('IntroAnimationScreen mounted');

    // Create video for web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const video = document.createElement('video');
      video.src = VIDEO_URL;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        z-index: -1;
      `;
      document.body.appendChild(video);
      videoRef.current = video;
      video.play().catch(console.warn);
    }

    // Auto-skip after 10 seconds
    const autoSkipTimer = setTimeout(() => {
      console.log('Auto-skip triggered');
      handleSkipIntro();
    }, AUTO_SKIP_DELAY);

    return () => {
      clearTimeout(autoSkipTimer);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, []);

  return (
    <Pressable 
      style={styles.container} 
      onPress={handleSkipIntro}
    >
      {/* Overlay */}
      <View style={styles.overlay} />
      
      {/* Button at bottom */}
      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}>
        <View style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Passer l'intro</Text>
          <View style={styles.skipButtonArrow}>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </View>
        </View>
        <Text style={styles.hintText}>Touchez n'importe où pour continuer</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingLeft: 28,
    paddingRight: 20,
    borderRadius: 30,
    gap: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  skipButtonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
