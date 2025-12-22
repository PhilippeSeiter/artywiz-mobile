/**
 * Reanimated Shim - Provides fallback implementations using native Animated API
 * This is a compatibility layer for Expo Go which has issues with react-native-reanimated
 */
import { Animated, Easing } from 'react-native';
import React, { useRef, useEffect } from 'react';

// Re-export Animated as default (like Reanimated)
export default Animated;

// Shared value implementation using useRef
export function useSharedValue(initialValue: number) {
  const ref = useRef(new Animated.Value(initialValue));
  return {
    value: initialValue,
    _animatedValue: ref.current,
  };
}

// Animated style hook - returns static object for compatibility
export function useAnimatedStyle(styleFactory: () => any) {
  return styleFactory();
}

// Animation functions
export function withTiming(toValue: number, config?: any) {
  return toValue;
}

export function withSpring(toValue: number, config?: any) {
  return toValue;
}

export function withDelay(delayMs: number, animation: any) {
  return animation;
}

export function withSequence(...animations: any[]) {
  return animations[animations.length - 1];
}

export function withRepeat(animation: any, numberOfReps?: number, reverse?: boolean) {
  return animation;
}

// Interpolation
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolation?: any
) {
  const clampedValue = Math.min(Math.max(value, inputRange[0]), inputRange[inputRange.length - 1]);
  const inputIndex = inputRange.findIndex((v, i) => clampedValue >= v && clampedValue <= (inputRange[i + 1] ?? v));
  const t = (clampedValue - inputRange[inputIndex]) / (inputRange[inputIndex + 1] - inputRange[inputIndex]);
  return outputRange[inputIndex] + t * (outputRange[inputIndex + 1] - outputRange[inputIndex]);
}

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

// Layout animations (no-op for compatibility)
export const FadeInDown = {
  delay: () => FadeInDown,
  springify: () => FadeInDown,
  damping: () => FadeInDown,
  stiffness: () => FadeInDown,
};

export const FadeInUp = FadeInDown;
export const SlideInRight = FadeInDown;
export const SlideOutLeft = { duration: () => ({ springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }) }) };
export const FadeOut = FadeInDown;
export const ZoomOut = FadeInDown;
export const Layout = { springify: () => ({ damping: () => ({ stiffness: () => ({ mass: () => ({}) }) }) }) };

export function combineTransition(...args: any[]) {
  return {};
}

// Easing (re-export from RN)
export { Easing };

// runOnJS - just call the function directly
export function runOnJS(fn: Function) {
  return fn;
}

// Scroll handler (no-op)
export function useAnimatedScrollHandler(handlers: any) {
  return () => {};
}
