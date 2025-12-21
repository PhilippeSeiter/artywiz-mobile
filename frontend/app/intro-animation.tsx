import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

const { width, height } = Dimensions.get('window');

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

// Auto-skip delay in milliseconds (10 seconds)
const AUTO_SKIP_DELAY = 10000;

// ============================================
// VIDEO BACKGROUND (Web only)
// ============================================
const VideoBackgroundIntro = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const createVideo = () => {
      const video = document.createElement('video');
      video.src = VIDEO_URL;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        z-index: 0;
      `;
      document.body.appendChild(video);
      videoRef.current = video;
      video.play().catch(console.warn);
    };

    createVideo();

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, []);

  return null;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function IntroAnimationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore();
  const hasNavigatedRef = useRef(false);

  // Button animation
  const buttonOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const handleSkipIntro = useCallback(() => {
    // Prevent double navigation
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    // Set default themes:
    // - All ARTYWIZ_THEMES (thématiques spécifiques)
    // - Only 'ephemeride' from GENERIC_THEMES
    const defaultThemes = [
      ...ARTYWIZ_THEMES.map(t => t.id),
      'ephemeride',
    ];
    
    setSelectedThemes(defaultThemes);
    completeOnboarding();
    
    // Navigate to main app
    router.replace('/(tabs)');
  }, [setSelectedThemes, completeOnboarding, router]);

  useEffect(() => {
    // Button appears immediately
    buttonOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    
    // Subtle pulse animation
    pulseScale.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    // Auto-skip after 10 seconds
    const autoSkipTimer = setTimeout(() => {
      handleSkipIntro();
    }, AUTO_SKIP_DELAY);

    return () => {
      clearTimeout(autoSkipTimer);
    };
  }, [handleSkipIntro]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <VideoBackgroundIntro />
      
      {/* Dark overlay for better button visibility */}
      <View style={styles.overlay} />
      
      {/* Gradient at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
      />

      {/* Skip button at bottom - ALWAYS VISIBLE */}
      <View style={[styles.skipButtonWrapper, { paddingBottom: Math.max(insets.bottom, 20) + 30 }]}>
        <Animated.View style={[styles.skipButtonAnimated, buttonAnimatedStyle]}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipIntro}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Passer l'intro</Text>
            <View style={styles.skipButtonArrow}>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 2,
  },
  skipButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  skipButtonAnimated: {
    // Container for animation
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
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
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
});
