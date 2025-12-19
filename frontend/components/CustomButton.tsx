import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient-green';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGradientGreen = variant === 'gradient-green';

  // Primary and gradient-green variants use LinearGradient
  if (isPrimary || isGradientGreen) {
    const gradientColors = isGradientGreen 
      ? ['#22C55E', '#3B82F6'] // Green to Blue
      : [Colors.gradientStart, Colors.gradientEnd]; // Default blue gradient
    
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.container, style]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, disabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              {icon && <Ionicons name={icon} size={20} color={Colors.white} style={styles.icon} />}
              <Text style={styles.primaryText}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.container,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? Colors.primary : Colors.textPrimary} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={isOutline ? Colors.primary : Colors.textPrimary}
              style={styles.icon}
            />
          )}
          <Text style={[isSecondary && styles.secondaryText, isOutline && styles.outlineText]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  secondary: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: Spacing.xs,
  },
});
