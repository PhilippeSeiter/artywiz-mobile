import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing } from '../constants';

interface AnimatedAccordionProps {
  isOpen: boolean;
  header: React.ReactNode;
  children: React.ReactNode;
  onToggle: () => void;
  maxHeight?: number;
  disabled?: boolean;
}

const ANIMATION_DURATION = 300;

export function AnimatedAccordion({
  isOpen,
  header,
  children,
  onToggle,
  maxHeight = 300,
  disabled = false,
}: AnimatedAccordionProps) {
  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const heightValue = useRef(new Animated.Value(isOpen ? maxHeight : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: isOpen ? 1 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.spring(heightValue, {
        toValue: isOpen ? maxHeight : 0,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isOpen, maxHeight]);

  const contentStyle = {
    height: heightValue,
    opacity: progress,
    transform: [{
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-10, 0],
      }),
    }],
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        disabled={disabled}
      >
        {header}
      </TouchableOpacity>
      
      <Animated.View style={[styles.content, contentStyle]}>
        <View style={styles.contentInner}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

// Export chevron animation hook for external use
export function useChevronAnimation(isOpen: boolean) {
  const rotation = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isOpen ? 1 : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const animatedStyle = {
    transform: [{
      rotate: rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };

  return animatedStyle;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  content: {
    overflow: 'hidden',
  },
  contentInner: {
    paddingTop: 0,
  },
});
