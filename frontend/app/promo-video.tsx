import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function PromoVideoScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Auto-play when screen mounts
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      // Video finished - go to dashboard
      navigateToDashboard();
    }
  };

  const navigateToDashboard = () => {
    router.replace('/(tabs)');
  };

  const handlePress = () => {
    // User tapped - stop video and go to dashboard
    if (videoRef.current) {
      videoRef.current.stopAsync();
    }
    navigateToDashboard();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={require('../assets/videos/promo_artywiz.mp4')}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            isMuted={false}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    width: width,
    height: height,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
