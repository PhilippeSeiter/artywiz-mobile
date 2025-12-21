import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

const { width, height } = Dimensions.get('window');
const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

export default function IntroAnimationScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);

  // Navigate to dashboard
  const goToDashboard = useCallback(() => {
    if (hasNavigated) return;
    setHasNavigated(true);
    
    console.log('[Intro] Navigating to dashboard...');
    
    // Set default themes and complete onboarding
    const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore.getState();
    setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
    completeOnboarding();
    
    // Navigate
    router.replace('/(tabs)');
  }, [hasNavigated, router]);

  // Web: Create video element
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const video = document.createElement('video');
    video.src = VIDEO_URL;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    `;

    // When video ends -> go to dashboard
    video.addEventListener('ended', () => {
      console.log('[Intro] Video ended');
      goToDashboard();
    });

    document.body.appendChild(video);
    webVideoRef.current = video;

    video.play().catch(err => {
      console.log('[Intro] Video play error:', err);
      // If video can't play, go to dashboard after 3s
      setTimeout(goToDashboard, 3000);
    });

    return () => {
      video.pause();
      video.remove();
    };
  }, [goToDashboard]);

  // Native: Handle video status
  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      console.log('[Intro] Native video ended');
      goToDashboard();
    }
  };

  // Fallback: if video doesn't end after 15s, navigate anyway
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!hasNavigated) {
        console.log('[Intro] Fallback timeout');
        goToDashboard();
      }
    }, 15000);
    return () => clearTimeout(fallback);
  }, [hasNavigated, goToDashboard]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1}
      onPress={goToDashboard}
    >
      {/* Native Video */}
      {Platform.OS !== 'web' && (
        <Video
          ref={videoRef}
          source={{ uri: VIDEO_URL }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted
          onPlaybackStatusUpdate={handlePlaybackStatus}
        />
      )}
      
      {/* Web: Video is added to document.body directly */}
      {Platform.OS === 'web' && <View style={styles.webPlaceholder} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webPlaceholder: {
    flex: 1,
  },
});
