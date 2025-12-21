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
  // New props for 4-line document header
  ligne1?: string;
  ligne2?: string;
  ligne3?: string;
  ligne4?: string;
  compactLines?: boolean;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBackPress,
  rightElement,
  ligne1,
  ligne2,
  ligne3,
  ligne4,
  compactLines,
}) => {
  const insets = useSafeAreaInsets();

  // Use 4-line format if ligne props are provided
  const useFourLines = ligne1 || ligne2 || ligne3 || ligne4;

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
          {useFourLines ? (
            // 4-line compact format for document header
            <View style={styles.fourLinesContainer}>
              {ligne1 && <Text style={styles.ligne1} numberOfLines={1}>{ligne1}</Text>}
              {ligne2 && <Text style={styles.ligne2} numberOfLines={1}>{ligne2}</Text>}
              {ligne3 && <Text style={styles.ligne3} numberOfLines={1}>{ligne3}</Text>}
              {ligne4 && <Text style={styles.ligne4} numberOfLines={1}>{ligne4}</Text>}
            </View>
          ) : (
            // Original title/subtitle format
            <>
              {title && (
                <TouchableOpacity onPress={showBack ? onBackPress : undefined} disabled={!showBack} activeOpacity={showBack ? 0.7 : 1}>
                  <Text style={styles.title}>{title}</Text>
                </TouchableOpacity>
              )}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </>
          )}
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
  // 4-line document header styles
  fourLinesContainer: {
    gap: 2,
  },
  ligne1: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.7,
  },
  ligne2: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  ligne3: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
  ligne4: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
  },
});
