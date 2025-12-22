/**
 * VideoBackground component - Full screen looping video background
 * Used on login, signup, and welcome screens
 * Supports forward/backward playback via VideoDirectionProvider
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useVideoDirection } from '../providers/VideoDirectionProvider';

const VIDEO_URL = 'https://customer-assets.emergentagent.com/job_document-editor-5/artifacts/xmcc7jpq_fond%20anime%CC%81%20Artyplanet%20app.webm';

// Fallback image for when video fails to load
const FALLBACK_IMAGE = require('../assets/images/fond_blocs.png');

interface VideoBackgroundProps {
  children?: React.ReactNode;
}

// Web-only video component using DOM API directly
const WebVideo = () => {
  const containerRef = useRef<any>(null);
  const { registerVideo } = useVideoDirection();

  useEffect(() => {
    // Only run on web
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    if (!containerRef.current) return;

    // Create video element via DOM
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
    `;

    containerRef.current.appendChild(video);
    
    // Register video with direction provider
    registerVideo(video);

    // Attempt to play
    const playVideo = () => {
      video.play().catch(() => {
        // Try again on user interaction if autoplay fails
        const tryPlay = () => {
          video.play().then(() => {
            document.removeEventListener('click', tryPlay);
          }).catch(() => {});
        };
        document.addEventListener('click', tryPlay, { once: true });
      });
    };

    video.addEventListener('loadeddata', playVideo);
    playVideo();

    return () => {
      registerVideo(null);
      video.pause();
      video.remove();
    };
  }, [registerVideo]);

  // Return null on native platforms
  if (Platform.OS !== 'web') return null;

  // Use View with ref for web (will be converted to div)
  return (
    <View
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    />
  );
};

export function VideoBackground({ children }: VideoBackgroundProps) {
  const videoRef = useRef<Video>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Auto-play when component mounts (native only)
    if (Platform.OS !== 'web' && videoRef.current) {
      videoRef.current.playAsync().catch(() => {
        setHasError(true);
      });
    }
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoReady(true);
      if (status.didJustFinish && videoRef.current) {
        videoRef.current.replayAsync();
      }
    }
  };

  const handleError = (error: string) => {
    console.warn('Video background error:', error);
    setHasError(true);
  };

  return (
    <View style={styles.container}>
      {/* Fallback image - always rendered as base layer */}
      <Image
        source={FALLBACK_IMAGE}
        style={styles.fallbackImage}
        resizeMode="cover"
      />

      {/* Native video (iOS/Android) */}
      {Platform.OS !== 'web' && !hasError && (
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

      {/* Web video */}
      {Platform.OS === 'web' && !hasError && <WebVideo />}

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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066FF',
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
  },
});

export default VideoBackground;
