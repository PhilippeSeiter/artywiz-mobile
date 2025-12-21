import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

export default function IntroAnimationScreen() {
  const router = useRouter();
  const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore();
  const hasNavigatedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const goToDashboard = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    // Set default themes
    const defaultThemes = [...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride'];
    setSelectedThemes(defaultThemes);
    completeOnboarding();
    
    // Go to dashboard
    router.replace('/(tabs)');
  };

  useEffect(() => {
    // Web: create video, play once, then go to dashboard
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const video = document.createElement('video');
      video.src = VIDEO_URL;
      video.autoplay = true;
      video.loop = false; // NO LOOP - play once
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
      
      // When video ends, go to dashboard
      video.onended = () => {
        console.log('Video ended, going to dashboard');
        goToDashboard();
      };
      
      // If video fails, go to dashboard after 5 seconds
      video.onerror = () => {
        console.log('Video error, going to dashboard');
        setTimeout(goToDashboard, 2000);
      };
      
      document.body.appendChild(video);
      videoRef.current = video;
      video.play().catch(() => {
        // If autoplay fails, go to dashboard
        setTimeout(goToDashboard, 2000);
      });
    } else {
      // Native: go to dashboard after 3 seconds
      setTimeout(goToDashboard, 3000);
    }

    // Fallback: go to dashboard after 15 seconds no matter what
    const fallback = setTimeout(goToDashboard, 15000);

    return () => {
      clearTimeout(fallback);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Clickable logo to skip */}
      <TouchableOpacity style={styles.logoArea} onPress={goToDashboard} activeOpacity={0.9}>
        <Image source={require('../assets/images/logo_W.png')} style={styles.logoW} resizeMode="contain" />
        <Image source={require('../assets/images/logo_artywiz.png')} style={styles.logoArtywiz} resizeMode="contain" />
        <Text style={styles.skipText}>Touchez pour passer</Text>
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
  logoArea: {
    alignItems: 'center',
    padding: 40,
    zIndex: 100,
  },
  logoW: {
    width: 70,
    height: 50,
    marginBottom: 10,
  },
  logoArtywiz: {
    width: 180,
    height: 40,
    marginBottom: 20,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});
