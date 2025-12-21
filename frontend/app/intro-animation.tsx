import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

const { width, height } = Dimensions.get('window');

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

// Number of video loops before auto-skip
const MAX_VIDEO_LOOPS = 3;

export default function IntroAnimationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore();
  const hasNavigatedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loopCount, setLoopCount] = useState(0);

  const handleSkipIntro = () => {
    // Prevent double navigation
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    console.log('Navigating to dashboard...');

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

  // Setup video
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
      
      // Count video loops
      video.addEventListener('ended', () => {
        // Note: with loop=true, 'ended' doesn't fire, so we use 'timeupdate'
      });
      
      let lastTime = 0;
      video.addEventListener('timeupdate', () => {
        // Detect when video loops (time jumps back to start)
        if (video.currentTime < lastTime - 1) {
          console.log('Video looped, count:', loopCount + 1);
          setLoopCount(prev => {
            const newCount = prev + 1;
            if (newCount >= MAX_VIDEO_LOOPS) {
              console.log('Max loops reached, auto-skipping...');
              handleSkipIntro();
            }
            return newCount;
          });
        }
        lastTime = video.currentTime;
      });
      
      document.body.appendChild(video);
      videoRef.current = video;
      video.play().catch(console.warn);
    }

    // Fallback: auto-skip after 30 seconds if video doesn't work
    const fallbackTimer = setTimeout(() => {
      console.log('Fallback timer triggered');
      handleSkipIntro();
    }, 30000);

    return () => {
      clearTimeout(fallbackTimer);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <View style={styles.overlay} />
      
      {/* Clickable Logo in center */}
      <TouchableOpacity 
        style={styles.logoContainer}
        onPress={handleSkipIntro}
        activeOpacity={0.8}
      >
        <Image 
          source={require('../assets/images/logo_W.png')} 
          style={styles.logoW}
          resizeMode="contain"
        />
        <Image 
          source={require('../assets/images/logo_artywiz.png')} 
          style={styles.logoArtywiz}
          resizeMode="contain"
        />
        <Image 
          source={require('../assets/images/logo_football.png')} 
          style={styles.logoFootball}
          resizeMode="contain"
        />
        <Text style={styles.tapText}>Touchez pour continuer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    zIndex: 10,
  },
  logoW: {
    width: 80,
    height: 56,
    marginBottom: 8,
  },
  logoArtywiz: {
    width: 200,
    height: 44,
    marginBottom: 8,
  },
  logoFootball: {
    width: 140,
    height: 28,
    marginBottom: 24,
  },
  tapText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 20,
  },
});
