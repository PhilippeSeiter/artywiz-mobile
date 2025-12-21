import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';
import { useVideoDirection } from '../providers/VideoDirectionProvider';

const { width, height } = Dimensions.get('window');
const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';
const MAX_LOOPS = 4;
const MAX_TIME_SECONDS = 10;

// ============================================
// ANIMATED LOGO - 2 parties (W + Artywiz)
// ============================================
const AnimatedIntroLogo = () => {
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    // W: ±5%, GRANDIT d'abord
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.05, easeConfig),
        withTiming(0.95, easeConfig)
      ),
      -1,
      true
    );

    // Artywiz: décalage 500ms, ±5%, RÉDUIT d'abord
    setTimeout(() => {
      scaleArtywiz.value = withRepeat(
        withSequence(
          withTiming(0.95, easeConfig),
          withTiming(1.05, easeConfig)
        ),
        -1,
        true
      );
    }, 500);
  }, []);

  useEffect(() => {
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 300);
    const timer = setTimeout(() => startAnimation(), 800);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  const animatedStyleW = useAnimatedStyle(() => ({
    opacity: opacityW.value,
    transform: [{ scale: scaleW.value }],
  }));

  const animatedStyleArtywiz = useAnimatedStyle(() => ({
    opacity: opacityArtywiz.value,
    transform: [{ scale: scaleArtywiz.value }],
  }));

  return (
    <View style={logoStyles.container}>
      <View style={logoStyles.wrapper}>
        {/* W - en haut */}
        <Animated.View style={[logoStyles.part, logoStyles.partW, animatedStyleW]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={logoStyles.imageW}
            resizeMode="contain"
          />
        </Animated.View>
        {/* Artywiz - en bas */}
        <Animated.View style={[logoStyles.part, logoStyles.partArtywiz, animatedStyleArtywiz]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={logoStyles.imageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.15,
  },
  wrapper: {
    width: 264,
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  part: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  partW: {
    top: 0,
  },
  imageW: {
    width: 108,
    height: 66,
  },
  partArtywiz: {
    top: 62,
  },
  imageArtywiz: {
    width: 216,
    height: 48,
  },
});

// ============================================
// WEB VIDEO COMPONENT
// ============================================
const WebVideoIntro = ({ onLoop }: { onLoop: () => void }) => {
  const containerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    if (!containerRef.current) return;

    const video = document.createElement('video');
    video.src = VIDEO_URL;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    `;

    // Track loops
    video.addEventListener('ended', () => {
      onLoop();
    });
    
    // For looping video, use timeupdate to detect loop
    let lastTime = 0;
    video.addEventListener('timeupdate', () => {
      if (video.currentTime < lastTime) {
        // Video looped
        onLoop();
      }
      lastTime = video.currentTime;
    });

    containerRef.current.appendChild(video);
    videoRef.current = video;

    video.play().catch(() => {});

    return () => {
      video.pause();
      video.remove();
    };
  }, [onLoop]);

  if (Platform.OS !== 'web') return null;

  return (
    <View
      ref={containerRef}
      style={styles.videoContainer}
      pointerEvents="none"
    />
  );
};

// ============================================
// MAIN INTRO SCREEN
// ============================================
export default function IntroAnimationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  
  const [loopCount, setLoopCount] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // Animation values
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);

  // Navigate to dashboard
  const navigateToDashboard = useCallback(() => {
    console.log('[IntroAnimation] navigateToDashboard called, hasNavigated:', hasNavigated);
    if (hasNavigated) return;
    setHasNavigated(true);
    
    // Set default themes and complete onboarding
    const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore.getState();
    setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
    completeOnboarding();
    
    console.log('[IntroAnimation] Navigating to dashboard...');
    // Navigate to dashboard
    router.replace('/(tabs)');
  }, [hasNavigated, router]);

  // Handle video loop
  const handleVideoLoop = useCallback(() => {
    setLoopCount(prev => {
      const newCount = prev + 1;
      console.log('[IntroAnimation] Video loop:', newCount);
      if (newCount >= MAX_LOOPS && !hasNavigated) {
        navigateToDashboard();
      }
      return newCount;
    });
  }, [hasNavigated, navigateToDashboard]);

  // Timer: auto-navigate after MAX_TIME_SECONDS
  useEffect(() => {
    console.log('[IntroAnimation] Setting up auto-navigate timer for', MAX_TIME_SECONDS, 'seconds');
    const timer = setTimeout(() => {
      console.log('[IntroAnimation] Timer expired, navigating...');
      if (!hasNavigated) {
        navigateToDashboard();
      }
    }, MAX_TIME_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [hasNavigated, navigateToDashboard]);

  // Button appear animation
  useEffect(() => {
    buttonOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    buttonScale.value = withDelay(500, withSpring(1, { damping: 12, stiffness: 100 }));
    
    // Pulse animation for button
    pulseScale.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { scale: buttonScale.value * pulseScale.value },
    ],
  }));

  // Handle native video status
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      handleVideoLoop();
      videoRef.current?.replayAsync();
    }
  };

  // Handle screen tap - Simplified for better touch handling
  const handleScreenTap = useCallback(() => {
    console.log('[IntroAnimation] Screen tapped!');
    navigateToDashboard();
  }, [navigateToDashboard]);

  // Handle button press
  const handleButtonPress = useCallback(() => {
    console.log('[IntroAnimation] Button pressed!');
    navigateToDashboard();
  }, [navigateToDashboard]);

  return (
    <View style={styles.container}>
      {/* Video Background - avec pointerEvents none pour laisser passer les touches */}
      <View style={styles.videoWrapper} pointerEvents="none">
        {/* Native Video (iOS/Android) */}
        {Platform.OS !== 'web' && (
          <Video
            ref={videoRef}
            source={{ uri: VIDEO_URL }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        )}

        {/* Web Video */}
        {Platform.OS === 'web' && (
          <WebVideoIntro onLoop={handleVideoLoop} />
        )}
      </View>

      {/* Zone tactile principale - couvre tout l'écran */}
      <TouchableOpacity 
        style={styles.touchableArea} 
        onPress={handleScreenTap}
        activeOpacity={1}
      >
        {/* Logo animé */}
        <AnimatedIntroLogo />

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Bouton "Passer l'intro" */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle, { paddingBottom: insets.bottom + 30 }]}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleButtonPress}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Passer l'intro</Text>
            <View style={styles.skipButtonIcon}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          {/* Indicateur subtil */}
          <Text style={styles.hintText}>
            Touchez n'importe où pour continuer
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  videoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  touchableArea: {
    flex: 1,
    zIndex: 1,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 10,
  },
  skipButtonIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 14,
    fontWeight: '400',
  },
});
