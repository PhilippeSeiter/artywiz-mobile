import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Spacing } from '../constants';

interface WatermarkLogoProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: number;
  opacity?: number;
  bottomOffset?: number;
}

export function WatermarkLogo({ 
  position = 'bottom-right',
  size = 36,
  opacity = 0.12,
  bottomOffset = 100,
}: WatermarkLogoProps) {
  const positionStyles = {
    'bottom-right': { bottom: bottomOffset, right: Spacing.md },
    'bottom-left': { bottom: bottomOffset, left: Spacing.md },
    'top-right': { top: Spacing.md, right: Spacing.md },
    'top-left': { top: Spacing.md, left: Spacing.md },
  };

  return (
    <View style={[styles.container, positionStyles[position], { opacity }]}>
      <Image
        source={require('../assets/images/W-artywiz.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
  },
});
