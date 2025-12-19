import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
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
  const progress = useSharedValue(isOpen ? 1 : 0);
  const heightValue = useSharedValue(isOpen ? maxHeight : 0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    
    heightValue.value = withSpring(isOpen ? maxHeight : 0, {
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    });
  }, [isOpen, maxHeight]);

  const contentStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value,
      opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]),
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [-10, 0]),
        },
      ],
    };
  });

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg`,
        },
      ],
    };
  });

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
  const rotation = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg`,
        },
      ],
    };
  });

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
