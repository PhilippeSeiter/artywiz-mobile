import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';

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
  
  // Animation values - utiliser uniquement useNativeDriver: false pour éviter les conflits
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Handle error shake animation
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
      ]).start();
    }
  }, [error]);

  // Couleurs dynamiques basées sur l'état
  const borderColor = error ? '#FF6B6B' : (isFocused ? '#007BFF' : '#E5E7EB');
  const borderWidth = error ? 2 : (isFocused ? 2 : 1);
  const iconColor = isFocused ? '#007BFF' : (error ? '#FF6B6B' : Colors.textSecondary);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View 
        style={[
          styles.inputContainer, 
          { 
            transform: [{ translateX: shakeAnim }],
            borderColor,
            borderWidth,
          }
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={iconColor} 
              style={styles.icon} 
            />
          </View>
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
        <Text style={styles.errorText}>{error}</Text>
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
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: Spacing.md,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  icon: {
    // Style de base pour l'icône
  },
  eyeIcon: {
    padding: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 6,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
});
