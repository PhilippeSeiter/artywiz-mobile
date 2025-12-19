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

  return (
    <VideoBackgroundContext.Provider value={{ isVisible: isAuthScreen }}>
      <View style={styles.container}>
        {/* Persistent video background - only visible on auth screens */}
        {isAuthScreen && (
          <View style={styles.videoContainer} pointerEvents="none">
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

            {/* Web video - HTML5 video element */}
            {Platform.OS === 'web' && !hasError && (
              <video
                src={VIDEO_URL}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                }}
                onError={() => setHasError(true)}
              />
            )}
          </View>
        )}

        {/* Main content */}
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
    position: 'relative',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  fallbackImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default VideoBackgroundProvider;
