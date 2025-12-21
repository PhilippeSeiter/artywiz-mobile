import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  icon,
  isPassword,
  ...textInputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation values
  const focusProgress = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const iconScale = useSharedValue(1);

  // Handle focus animation
  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    if (isFocused) {
      iconScale.value = withSequence(
        withSpring(1.15, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [isFocused]);

  // Handle error shake animation
  useEffect(() => {
    if (error) {
      errorShake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
    borderColor: error 
      ? '#FF6B6B' 
      : interpolateColor(focusProgress.value, [0, 1], ['#E5E7EB', '#007BFF']),
    borderWidth: error ? 2 : interpolateColor(focusProgress.value, [0, 1], [1, 2]) as unknown as number,
    shadowOpacity: focusProgress.value * 0.15,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: interpolateColor(focusProgress.value, [0, 1], [0.5, 1]) as unknown as number,
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputContainer, containerAnimatedStyle]}>
        {icon && (
          <Animated.View style={iconAnimatedStyle}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={isFocused ? '#007BFF' : (error ? '#FF6B6B' : Colors.textSecondary)} 
              style={styles.icon} 
            />
          </Animated.View>
        )}
        <TextInput
          {...textInputProps}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
        />
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={isFocused ? '#007BFF' : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <Animated.Text style={styles.errorText}>{error}</Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: Spacing.xs / 2,
    marginLeft: Spacing.xs,
  },
});
