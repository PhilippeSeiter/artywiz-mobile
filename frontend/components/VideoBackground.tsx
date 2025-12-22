/**
 * VideoBackground component - Full screen background image
 * Used on login, signup, and welcome screens
 * Simplified version using static image instead of video for better Expo Go compatibility
 */
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

const BACKGROUND_IMAGE_URL = 'https://customer-assets.emergentagent.com/job_document-editor-5/artifacts/yk8rf3jn_fond%20ecran%20Artywiz%20mobile.png';

interface VideoBackgroundProps {
  children?: React.ReactNode;
}

export function VideoBackground({ children }: VideoBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Background image */}
      <Image
        source={{ uri: BACKGROUND_IMAGE_URL }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

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
  backgroundImage: {
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
