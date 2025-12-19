import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';

interface AnimatedLoaderProps {
  size?: number;
  message?: string;
  showMessage?: boolean;
}

/**
 * AnimatedLoader - Composant de chargement avec WebP animé
 * Utilise expo-image pour supporter les WebP/GIF animés
 */
export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  size = 80,
  message = 'Chargement...',
  showMessage = true,
}) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/animations/loading-sparkle.webp')}
        style={{ width: size, height: size }}
        contentFit="contain"
        autoplay={true}
      />
      {showMessage && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AnimatedLoader;
