/**
 * VideoBackgroundProvider - Shared video background across auth screens
 * The video continues seamlessly when navigating between index, login, signup
 */
import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { useSegments } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';
const FALLBACK_IMAGE = require('../assets/images/fond_blocs.png');

// Web-only video component using DOM API
const WebVideoBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (containerRef.current && Platform.OS === 'web') {
      // Create video element manually
      const video = document.createElement('video');
      video.src = VIDEO_URL;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';
      
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(video);
      videoRef.current = video;
      
      // Force play with user interaction workaround
      const playVideo = () => {
        video.play().catch(() => {
          // If autoplay blocked, try again on user interaction
          const tryPlay = () => {
            video.play().then(() => {
              document.removeEventListener('click', tryPlay);
              document.removeEventListener('touchstart', tryPlay);
            }).catch(console.warn);
          };
          document.addEventListener('click', tryPlay, { once: true });
          document.addEventListener('touchstart', tryPlay, { once: true });
        });
      };
      
      // Try playing immediately and on canplay
      video.addEventListener('canplay', playVideo);
      video.addEventListener('loadeddata', playVideo);
      playVideo();
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        backgroundColor: '#0066FF', // Fallback while loading
      }}
    />
  );
};

// Screens that should show the video background
const AUTH_SCREENS = ['index', 'login', 'signup', 'profile-selection', 'theme-selection'];

interface VideoBackgroundContextType {
  isVisible: boolean;
}

const VideoBackgroundContext = createContext<VideoBackgroundContextType>({ isVisible: false });

export function useVideoBackground() {
  return useContext(VideoBackgroundContext);
}

interface VideoBackgroundProviderProps {
  children: React.ReactNode;
}

export function VideoBackgroundProvider({ children }: VideoBackgroundProviderProps) {
  const segments = useSegments();
  const videoRef = useRef<Video>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if current screen should show video background
  const currentSegment = segments[0] || 'index';
  const isAuthScreen = AUTH_SCREENS.includes(currentSegment);

  useEffect(() => {
    // Start playing when entering auth screens
    if (isAuthScreen && videoRef.current) {
      videoRef.current.playAsync().catch(() => setHasError(true));
    }
  }, [isAuthScreen]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoReady(true);
      // Loop the video
      if (status.didJustFinish && videoRef.current) {
        videoRef.current.replayAsync();
      }
    }
  };

  const handleError = (error: string) => {
    console.warn('Video background error:', error);
    setHasError(true);
  };

  const shouldUseNativeVideo = Platform.OS !== 'web' && !hasError;

  // If not on auth screen, just render children
  if (!isAuthScreen) {
    return (
      <VideoBackgroundContext.Provider value={{ isVisible: false }}>
        {children}
      </VideoBackgroundContext.Provider>
    );
  }

  return (
    <VideoBackgroundContext.Provider value={{ isVisible: true }}>
      <View style={styles.container}>
        {/* Video background layer - absolute positioned behind content */}
        <View style={styles.videoContainer}>
          {/* Fallback image */}
          <Image
            source={FALLBACK_IMAGE}
            style={styles.fallbackImage}
            resizeMode="cover"
          />

          {/* Native video */}
          {shouldUseNativeVideo && (
            <Video
              ref={videoRef}
              source={{ uri: VIDEO_URL }}
              style={[styles.video, { opacity: isVideoReady ? 1 : 0 }]}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onError={handleError}
            />
          )}

          {/* Web video - using DOM API */}
          {Platform.OS === 'web' && !hasError && <WebVideoBackground />}
        </View>

        {/* Main content - on top of video */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </VideoBackgroundContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fallbackImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default VideoBackgroundProvider;
