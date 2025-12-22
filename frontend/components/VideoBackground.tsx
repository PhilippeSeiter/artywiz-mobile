/**
 * VideoBackground component - Animated background with gyroscope movement
 * Used on login, signup, welcome, and profile selection screens
 * 
 * Features:
 * - Wider image that moves based on device orientation (gyroscope)
 * - Fallback to automatic panoramic animation if gyroscope unavailable
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated, Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

const BACKGROUND_IMAGE_URL = 'https://customer-assets.emergentagent.com/job_document-editor-5/artifacts/jeu59hen_Fond%20Ecran%20app%20Artywiz.png';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Image is wider than screen - define how much it can move
const IMAGE_WIDTH = SCREEN_WIDTH * 1.4; // 40% wider than screen
const MAX_OFFSET = (IMAGE_WIDTH - SCREEN_WIDTH) / 2;

// Sensitivity for gyroscope movement
const GYRO_SENSITIVITY = 25;

// Auto-pan animation duration (fallback)
const AUTO_PAN_DURATION = 8000; // 8 seconds per direction

interface VideoBackgroundProps {
  children?: React.ReactNode;
}

export function VideoBackground({ children }: VideoBackgroundProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [hasGyroscope, setHasGyroscope] = useState(false);
  const gyroOffset = useRef(0);
  const autoPanAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let subscription: any = null;

    const setupGyroscope = async () => {
      try {
        // Check if device motion is available
        const isAvailable = await DeviceMotion.isAvailableAsync();
        
        if (isAvailable) {
          setHasGyroscope(true);
          
          // Set update interval (60fps)
          DeviceMotion.setUpdateInterval(16);
          
          // Subscribe to device motion
          subscription = DeviceMotion.addListener((data) => {
            if (data.rotation) {
              // Use gamma (left/right tilt) for horizontal movement
              const { gamma } = data.rotation;
              
              // Calculate new offset based on tilt
              // gamma is in radians, typically -PI to PI
              const targetOffset = gamma * GYRO_SENSITIVITY * -1;
              
              // Smooth the movement
              gyroOffset.current = gyroOffset.current * 0.85 + targetOffset * 0.15;
              
              // Clamp to max offset
              const clampedOffset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, gyroOffset.current));
              
              translateX.setValue(clampedOffset);
            }
          });
        } else {
          // Fallback to auto-pan animation
          startAutoPan();
        }
      } catch (error) {
        console.log('Gyroscope not available, using auto-pan');
        startAutoPan();
      }
    };

    const startAutoPan = () => {
      // Create looping pan animation
      const panRight = Animated.timing(translateX, {
        toValue: MAX_OFFSET,
        duration: AUTO_PAN_DURATION,
        useNativeDriver: true,
      });

      const panLeft = Animated.timing(translateX, {
        toValue: -MAX_OFFSET,
        duration: AUTO_PAN_DURATION,
        useNativeDriver: true,
      });

      // Start from center, go right, then loop left-right
      autoPanAnimation.current = Animated.loop(
        Animated.sequence([panRight, panLeft])
      );
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
      {/* Animated background image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Image
          source={{ uri: BACKGROUND_IMAGE_URL }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </Animated.View>

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
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: -MAX_OFFSET, // Center the wider image
    width: IMAGE_WIDTH,
    height: SCREEN_HEIGHT,
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
