/**
 * VideoBackground component - Animated background with 4-direction gyroscope movement
 * Used on login, signup, welcome, contact and profile selection screens
 * 
 * Features:
 * - Larger image that moves based on device orientation (gyroscope) in 4 directions
 * - Fallback to automatic panoramic animation if gyroscope unavailable
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated, Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

// New larger background image for 4-direction movement
const BACKGROUND_IMAGE_URL = 'https://customer-assets.emergentagent.com/job_document-editor-5/artifacts/xekx9h9s_Fond%20Ecran%20app%20Artywiz%20B.png';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Image is larger than screen in both directions
const IMAGE_SCALE = 1.4; // 40% larger in both dimensions
const IMAGE_WIDTH = SCREEN_WIDTH * IMAGE_SCALE;
const IMAGE_HEIGHT = SCREEN_HEIGHT * IMAGE_SCALE;
const MAX_OFFSET_X = (IMAGE_WIDTH - SCREEN_WIDTH) / 2;
const MAX_OFFSET_Y = (IMAGE_HEIGHT - SCREEN_HEIGHT) / 2;

// Sensitivity for gyroscope movement (higher = more responsive)
const GYRO_SENSITIVITY_X = 80;
const GYRO_SENSITIVITY_Y = 60; // Slightly less for vertical to feel natural

// Auto-pan animation duration (fallback)
const AUTO_PAN_DURATION = 8000;

interface VideoBackgroundProps {
  children?: React.ReactNode;
}

export function VideoBackground({ children }: VideoBackgroundProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [hasGyroscope, setHasGyroscope] = useState(false);
  const gyroOffsetX = useRef(0);
  const gyroOffsetY = useRef(0);
  const autoPanAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let subscription: any = null;

    const setupGyroscope = async () => {
      try {
        const isAvailable = await DeviceMotion.isAvailableAsync();
        
        if (isAvailable) {
          setHasGyroscope(true);
          DeviceMotion.setUpdateInterval(16); // 60fps
          
          subscription = DeviceMotion.addListener((data) => {
            if (data.rotation) {
              const { gamma, beta } = data.rotation;
              
              // Horizontal movement (left/right tilt)
              const targetOffsetX = gamma * GYRO_SENSITIVITY_X * -1;
              gyroOffsetX.current = gyroOffsetX.current * 0.85 + targetOffsetX * 0.15;
              const clampedOffsetX = Math.max(-MAX_OFFSET_X, Math.min(MAX_OFFSET_X, gyroOffsetX.current));
              translateX.setValue(clampedOffsetX);
              
              // Vertical movement (forward/backward tilt)
              const targetOffsetY = beta * GYRO_SENSITIVITY_Y * -1;
              gyroOffsetY.current = gyroOffsetY.current * 0.85 + targetOffsetY * 0.15;
              const clampedOffsetY = Math.max(-MAX_OFFSET_Y, Math.min(MAX_OFFSET_Y, gyroOffsetY.current));
              translateY.setValue(clampedOffsetY);
            }
          });
        } else {
          startAutoPan();
        }
      } catch (error) {
        console.log('Gyroscope not available, using auto-pan');
        startAutoPan();
      }
    };

    const startAutoPan = () => {
      // Create figure-8 looping animation for both axes
      const panSequence = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateX, { toValue: MAX_OFFSET_X, duration: AUTO_PAN_DURATION, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: MAX_OFFSET_Y / 2, duration: AUTO_PAN_DURATION, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(translateX, { toValue: -MAX_OFFSET_X, duration: AUTO_PAN_DURATION, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -MAX_OFFSET_Y / 2, duration: AUTO_PAN_DURATION, useNativeDriver: true }),
          ]),
        ])
      );
      autoPanAnimation.current = panSequence;
      autoPanAnimation.current.start();
    };

    setupGyroscope();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (autoPanAnimation.current) {
        autoPanAnimation.current.stop();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        <Image
          source={{ uri: BACKGROUND_IMAGE_URL }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </Animated.View>

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
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    top: -MAX_OFFSET_Y,
    left: -MAX_OFFSET_X,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
});

export default VideoBackground;
