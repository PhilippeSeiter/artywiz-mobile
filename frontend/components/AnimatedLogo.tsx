/**
 * AnimatedLogo - Logo Artywiz réutilisable avec animation
 * Utilisé sur tous les écrans d'authentification
 * 
 * Props:
 * - showFootball: boolean - Affiche ou non le texte "Football" sous le logo
 */
import React, { useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

interface AnimatedLogoProps {
  showFootball?: boolean;
  size?: 'normal' | 'small';
}

export const AnimatedLogo = ({ showFootball = false, size = 'normal' }: AnimatedLogoProps) => {
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);
  const opacityFootball = useSharedValue(0);
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  const scaleFootball = useSharedValue(1);
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Animation subtile ±5%
    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    // W: GRANDIT d'abord
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.05, easeConfig),
        withTiming(0.95, easeConfig)
      ),
      -1,
      true
    );

    // Artywiz: décalage 500ms, RÉDUIT d'abord
    setTimeout(() => {
      scaleArtywiz.value = withRepeat(
        withSequence(
          withTiming(0.95, easeConfig),
          withTiming(1.05, easeConfig)
        ),
        -1,
        true
      );
    }, 500);

    // Football: décalage 1000ms, GRANDIT d'abord
    if (showFootball) {
      setTimeout(() => {
        scaleFootball.value = withRepeat(
          withSequence(
            withTiming(1.05, easeConfig),
            withTiming(0.95, easeConfig)
          ),
          -1,
          true
        );
      }, 1000);
    }
  }, [showFootball]);

  useEffect(() => {
    // Fondu décalé au chargement
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 300);
    
    if (showFootball) {
      setTimeout(() => {
        opacityFootball.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
      }, 600);
    }
    
    const timer = setTimeout(() => startAnimation(), 1000);
    return () => clearTimeout(timer);
  }, [startAnimation, showFootball]);

  const animatedStyleW = useAnimatedStyle(() => ({
    opacity: opacityW.value,
    transform: [{ scale: scaleW.value }],
  }));

  const animatedStyleArtywiz = useAnimatedStyle(() => ({
    opacity: opacityArtywiz.value,
    transform: [{ scale: scaleArtywiz.value }],
  }));

  const animatedStyleFootball = useAnimatedStyle(() => ({
    opacity: opacityFootball.value,
    transform: [{ scale: scaleFootball.value }],
  }));

  const scale = size === 'small' ? 0.7 : 1;

  return (
    <TouchableOpacity 
      onPress={() => !isAnimatingRef.current && startAnimation()} 
      activeOpacity={0.9}
      style={styles.container}
    >
      <View style={[styles.wrapper, { transform: [{ scale }] }]}>
        {/* W - en haut */}
        <Animated.View style={[styles.part, styles.partW, animatedStyleW]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={styles.imageW}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Artywiz - au milieu */}
        <Animated.View style={[styles.part, styles.partArtywiz, animatedStyleArtywiz]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={styles.imageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Football - en bas (uniquement si showFootball) */}
        {showFootball && (
          <Animated.View style={[styles.part, styles.partFootball, animatedStyleFootball]}>
            <Image
              source={require('../assets/images/logo_football.png')}
              style={styles.imageFootball}
              resizeMode="contain"
            />
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Positionnement basé sur le logo original (220x130)
const BASE_WIDTH = 220 * 1.2; // +20%
const BASE_HEIGHT = 130 * 1.2;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    position: 'relative',
  },
  part: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partW: {
    top: 0,
    left: 0,
    right: 0,
    height: BASE_HEIGHT * 0.55,
  },
  partArtywiz: {
    top: BASE_HEIGHT * 0.45,
    left: 0,
    right: 0,
    height: BASE_HEIGHT * 0.35,
  },
  partFootball: {
    top: BASE_HEIGHT * 0.75,
    left: 0,
    right: 0,
    height: BASE_HEIGHT * 0.25,
  },
  imageW: {
    width: BASE_WIDTH * 0.45,
    height: BASE_HEIGHT * 0.55,
  },
  imageArtywiz: {
    width: BASE_WIDTH * 0.85,
    height: BASE_HEIGHT * 0.3,
  },
  imageFootball: {
    width: BASE_WIDTH * 0.55,
    height: BASE_HEIGHT * 0.18,
  },
});

export default AnimatedLogo;
