import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GradientHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBackPress,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}
    >
      <View style={styles.content}>
        {showBack && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Ionicons name="arrow-back" size={28} color={Colors.white} />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          {title && (
            <TouchableOpacity onPress={showBack ? onBackPress : undefined} disabled={!showBack} activeOpacity={showBack ? 0.7 : 1}>
              <Text style={styles.title}>{title}</Text>
            </TouchableOpacity>
          )}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.white,
    marginTop: Spacing.xs / 2,
    opacity: 0.9,
  },
  rightElement: {
    marginLeft: Spacing.md,
  },
});
