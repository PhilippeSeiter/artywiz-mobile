/**
 * VideoBackground component - Full screen looping video background
 * Used on login, signup, and welcome screens
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_artywiz-transfer/artifacts/8qc6s5v8_bg-login%20%282%29.mp4';

// Fallback image for web or when video fails
const FALLBACK_IMAGE = require('../assets/images/fond_blocs.png');

interface VideoBackgroundProps {
  children?: React.ReactNode;
}

export function VideoBackground({ children }: VideoBackgroundProps) {
  const videoRef = useRef<Video>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Auto-play when component mounts
    if (videoRef.current) {
      videoRef.current.playAsync().catch(() => {
        setHasError(true);
      });
    }
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoReady(true);
      // Ensure video loops
      if (status.didJustFinish && videoRef.current) {
        videoRef.current.replayAsync();
      }
    }
  };

  const handleError = (error: string) => {
    console.warn('Video background error:', error);
    setHasError(true);
  };

  // On web, video playback can be problematic, use fallback
  const shouldUseVideo = Platform.OS !== 'web' && !hasError;

  return (
    <View style={styles.container}>
      {/* Fallback image - always rendered behind */}
      <Image
        source={FALLBACK_IMAGE}
        style={styles.fallbackImage}
        resizeMode="cover"
      />

      {/* Video layer - only on native platforms */}
      {shouldUseVideo && (
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

      {/* Web: Use video element directly for better support */}
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

      {/* Children content overlay */}
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});

export default VideoBackground;
