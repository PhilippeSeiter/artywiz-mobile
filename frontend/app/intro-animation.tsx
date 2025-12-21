import React, { useEffect, useRef } from 'react';
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
  FadeIn,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferencesStore, ARTYWIZ_THEMES, GENERIC_THEMES } from '../stores/userPreferencesStore';

const { width, height } = Dimensions.get('window');

// ============================================
// VIDEO BACKGROUND (Web only)
// ============================================
const VideoBackgroundIntro = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const createVideo = () => {
      const video = document.createElement('video');
      video.src = '/assets/videos/Intro_artywiz_sans son.mp4';
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

  // Button animation
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Button appears after a delay
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    buttonScale.value = withDelay(1000, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
    
    // Subtle pulse animation
    pulseScale.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value * pulseScale.value }],
  }));

  const handleSkipIntro = () => {
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
  };

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <VideoBackgroundIntro />
      
      {/* Gradient overlay at bottom for button visibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.bottomGradient}
      />

      {/* Skip button at bottom */}
      <Animated.View 
        style={[
          styles.skipButtonContainer, 
          buttonAnimatedStyle,
          { paddingBottom: insets.bottom + 30 }
        ]}
      >
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipIntro}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={styles.skipButtonGradient}
          >
            <Text style={styles.skipButtonText}>Passer l'intro</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  skipButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  skipButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  skipButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: Spacing.sm,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
