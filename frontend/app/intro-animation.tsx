import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useUserPreferencesStore, ARTYWIZ_THEMES } from '../stores/userPreferencesStore';

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

export default function IntroAnimationScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const hasNavigatedRef = useRef(false);

  // Navigate to dashboard - using ref to avoid stale closure
  const goToDashboard = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    
    console.log('[Intro] >>> Going to dashboard');
    
    // Set default themes and complete onboarding
    const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore.getState();
    setSelectedThemes([...ARTYWIZ_THEMES.map(t => t.id), 'ephemeride']);
    completeOnboarding();
    
    // Navigate
    router.replace('/(tabs)');
  }, [router]);

  // WEB: Setup video directly in DOM with click handler
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    console.log('[Intro] Setting up web video...');

    // Create container for video
    const container = document.createElement('div');
    container.id = 'intro-video-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      background-color: #0A1628;
      cursor: pointer;
    `;

    // Create video
    const video = document.createElement('video');
    video.src = VIDEO_URL;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    `;

    container.appendChild(video);
    document.body.appendChild(container);

    // Click handler on container
    const handleClick = () => {
      console.log('[Intro] Container clicked!');
      goToDashboard();
    };
    container.addEventListener('click', handleClick);
    container.addEventListener('touchstart', handleClick);

    // Video ended handler
    video.addEventListener('ended', () => {
      console.log('[Intro] Video ended');
      goToDashboard();
    });

    // Try to play
    video.play().catch(err => {
      console.log('[Intro] Video play error:', err);
      // If video fails, wait 2s then go
      setTimeout(goToDashboard, 2000);
    });

    // Cleanup
    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('touchstart', handleClick);
      video.pause();
      container.remove();
    };
  }, [goToDashboard]);

  // NATIVE: Handle video status
  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      console.log('[Intro] Native video ended');
      goToDashboard();
    }
  };

  // Fallback: 10 seconds max
  useEffect(() => {
    const fallback = setTimeout(() => {
      console.log('[Intro] Fallback timeout (10s)');
      goToDashboard();
    }, 10000);
    return () => clearTimeout(fallback);
  }, [goToDashboard]);

  // Native render
  if (Platform.OS !== 'web') {
    return (
      <Pressable style={styles.container} onPress={goToDashboard}>
        <Video
          ref={videoRef}
          source={{ uri: VIDEO_URL }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted
          onPlaybackStatusUpdate={handlePlaybackStatus}
        />
      </Pressable>
    );
  }

  // Web: just render placeholder, actual video is in DOM
  return <View style={styles.container} />;
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
});
