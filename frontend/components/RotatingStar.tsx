import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';

interface RotatingStarProps {
  size?: number;
  color?: string;
}

export function RotatingStar({ size = 10, color = Colors.white }: RotatingStarProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotation simple et continue sur elle-même
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000, // 2 secondes par tour
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotationAnimation.start();

    return () => {
      rotationAnimation.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="star" size={size} color={color} />
    </Animated.View>
  );
}

export default RotatingStar;
