/**
 * AnimatedLogo - Logo Artywiz réutilisable avec animation
 * Utilisé sur tous les écrans d'authentification
 * 
 * Props:
 * - showFootball: boolean - Affiche ou non le texte "Football" sous le logo
 */
import React, { useEffect, useCallback, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

interface AnimatedLogoProps {
  showFootball?: boolean;
  size?: 'normal' | 'small';
}

export const AnimatedLogo = ({ showFootball = false, size = 'normal' }: AnimatedLogoProps) => {
  const opacityW = useRef(new Animated.Value(0)).current;
  const opacityArtywiz = useRef(new Animated.Value(0)).current;
  const opacityFootball = useRef(new Animated.Value(0)).current;
  const scaleW = useRef(new Animated.Value(1)).current;
  const scaleArtywiz = useRef(new Animated.Value(1)).current;
  const scaleFootball = useRef(new Animated.Value(1)).current;
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const halfCycleDuration = 1200;

    // W: GRANDIT d'abord
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleW, { toValue: 1.05, duration: halfCycleDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleW, { toValue: 0.95, duration: halfCycleDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Artywiz: décalage 500ms, RÉDUIT d'abord
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleArtywiz, { toValue: 0.95, duration: halfCycleDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scaleArtywiz, { toValue: 1.05, duration: halfCycleDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }, 500);

    // Football: décalage 1000ms, GRANDIT d'abord
    if (showFootball) {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleFootball, { toValue: 1.05, duration: halfCycleDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(scaleFootball, { toValue: 0.95, duration: halfCycleDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ).start();
      }, 1000);
    }
  }, [showFootball]);

  useEffect(() => {
    // Fondu décalé au chargement
    Animated.timing(opacityW, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    
    setTimeout(() => {
      Animated.timing(opacityArtywiz, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }, 300);
    
    if (showFootball) {
      setTimeout(() => {
        Animated.timing(opacityFootball, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      }, 600);
    }
    
    const timer = setTimeout(() => startAnimation(), 1000);
    return () => clearTimeout(timer);
  }, [startAnimation, showFootball]);

  const scale = size === 'small' ? 0.7 : 1;

  return (
    <TouchableOpacity 
      onPress={() => !isAnimatingRef.current && startAnimation()} 
      activeOpacity={0.9}
      style={styles.container}
    >
      <View style={[styles.wrapper, { transform: [{ scale }] }]}>
        {/* W - en haut */}
        <Animated.View style={[styles.part, styles.partW, { opacity: opacityW, transform: [{ scale: scaleW }] }]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={styles.imageW}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Artywiz - au milieu */}
        <Animated.View style={[styles.part, styles.partArtywiz, { opacity: opacityArtywiz, transform: [{ scale: scaleArtywiz }] }]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={styles.imageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Football - en bas (uniquement si showFootball) */}
        {showFootball && (
          <Animated.View style={[styles.part, styles.partFootball, { opacity: opacityFootball, transform: [{ scale: scaleFootball }] }]}>
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
