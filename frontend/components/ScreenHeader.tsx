import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useRouter } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function ScreenHeader({ title, subtitle, showBackButton = false, onBack }: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <Image
            source={require('../assets/images/W-artywiz.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>
      <View style={styles.titleContainer}>
        {!showBackButton && (
          <Image
            source={require('../assets/images/W-artywiz.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

// Version simplifiée avec logo à gauche et titre à droite
export function ScreenHeaderWithLogo({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.headerRow}>
      <Image
        source={require('../assets/images/W-artywiz.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.titleTextContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  // Style pour la version avec logo à gauche
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  titleTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
});
