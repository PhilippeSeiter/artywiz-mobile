import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoBackground } from '../components/VideoBackground';

const { width, height } = Dimensions.get('window');

// Secteurs disponibles
const SECTORS = [
  { 
    id: 'football', 
    name: 'Football', 
    icon: 'football', 
    active: true,
    color: '#34C759',
  },
  { 
    id: 'boulangerie', 
    name: 'Boulangerie', 
    icon: 'cafe', // closest to bread
    active: false,
    color: '#D4A574',
  },
  { 
    id: 'coiffure', 
    name: 'Coiffure', 
    icon: 'cut', 
    active: false,
    color: '#FF6B9D',
  },
  { 
    id: 'restauration', 
    name: 'Restauration', 
    icon: 'restaurant', 
    active: false,
    color: '#FF9500',
  },
];

// ============================================
// ANIMATED LOGO COMPONENT
// ============================================
const AnimatedSectorLogo = () => {
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

    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    // Animation subtile ±5%
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.05, easeConfig),
        withTiming(0.95, easeConfig)
      ),
      -1,
      true
    );

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
  }, []);

  useEffect(() => {
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 300);
    setTimeout(() => {
      opacityFootball.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
      startAnimation();
    }, 600);
  }, []);

  const wStyle = useAnimatedStyle(() => ({
    opacity: opacityW.value,
    transform: [{ scale: scaleW.value }],
  }));

  const artywizStyle = useAnimatedStyle(() => ({
    opacity: opacityArtywiz.value,
    transform: [{ scale: scaleArtywiz.value }],
  }));

  const footballStyle = useAnimatedStyle(() => ({
    opacity: opacityFootball.value,
    transform: [{ scale: scaleFootball.value }],
  }));

  return (
    <View style={logoStyles.container}>
      <View style={logoStyles.textRow}>
        <Animated.Text style={[logoStyles.wLetter, wStyle]}>W</Animated.Text>
        <Animated.Text style={[logoStyles.artywizText, artywizStyle]}>Artywiz</Animated.Text>
      </View>
      <Animated.Text style={[logoStyles.footballText, footballStyle]}>Football</Animated.Text>
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  wLetter: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  artywizText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  footballText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});

// ============================================
// SECTOR CARD COMPONENT
// ============================================
interface SectorCardProps {
  sector: typeof SECTORS[0];
  index: number;
  onPress: () => void;
}

const SectorCard = ({ sector, index, onPress }: SectorCardProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Stagger animation for each card
    const delay = 200 + index * 100;
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 100 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pressScale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (sector.active) {
      pressScale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.sectorCard,
          !sector.active && styles.sectorCardInactive,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!sector.active}
        activeOpacity={0.9}
      >
        {/* Badge "Bientôt" pour les secteurs inactifs */}
        {!sector.active && (
          <View style={styles.badgeBientot}>
            <Text style={styles.badgeBientotText}>Bientôt</Text>
          </View>
        )}

        {/* Icône */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: sector.active ? sector.color : '#E5E7EB' }
        ]}>
          <Ionicons 
            name={sector.icon as any} 
            size={40} 
            color={sector.active ? '#FFFFFF' : '#9CA3AF'} 
          />
        </View>

        {/* Nom du secteur */}
        <Text style={[
          styles.sectorName,
          !sector.active && styles.sectorNameInactive
        ]}>
          {sector.name}
        </Text>

        {/* Indicateur de sélection pour le secteur actif */}
        {sector.active && (
          <View style={styles.selectIndicator}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function SectorSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation de la carte principale
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    cardOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleSectorPress = (sectorId: string) => {
    if (sectorId === 'football') {
      // Animation de sortie puis navigation
      cardOpacity.value = withTiming(0, { duration: 200 });
      cardTranslateY.value = withTiming(-20, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(navigateToProfiles)();
        }
      });
    }
  };

  const navigateToProfiles = () => {
    router.push('/profile-selection');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Fond vidéo */}
      <VideoBackground />

      {/* Contenu */}
      <View style={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Logo animé */}
        <View style={styles.logoContainer}>
          <AnimatedSectorLogo />
        </View>

        {/* Carte principale */}
        <Animated.View style={[styles.mainCard, cardAnimatedStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
            style={styles.cardGradient}
          >
            {/* Titre */}
            <Text style={styles.title}>Mon profil</Text>
            <Text style={styles.subtitle}>
              Sélectionnez votre secteur d'activité
            </Text>

            {/* Grille des secteurs (2x2) */}
            <View style={styles.sectorsGrid}>
              <View style={styles.sectorsRow}>
                {SECTORS.slice(0, 2).map((sector, index) => (
                  <SectorCard
                    key={sector.id}
                    sector={sector}
                    index={index}
                    onPress={() => handleSectorPress(sector.id)}
                  />
                ))}
              </View>
              <View style={styles.sectorsRow}>
                {SECTORS.slice(2, 4).map((sector, index) => (
                  <SectorCard
                    key={sector.id}
                    sector={sector}
                    index={index + 2}
                    onPress={() => handleSectorPress(sector.id)}
                  />
                ))}
              </View>
            </View>

            {/* Note d'information */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoNoteText}>
                D'autres secteurs seront bientôt disponibles
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  mainCard: {
    flex: 1,
    maxHeight: height * 0.65,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    flex: 1,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  sectorsGrid: {
    flex: 1,
    justifyContent: 'center',
  },
  sectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardWrapper: {
    width: '48%',
  },
  sectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 140,
    justifyContent: 'center',
    position: 'relative',
  },
  sectorCardInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  badgeBientot: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeBientotText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  sectorNameInactive: {
    color: '#9CA3AF',
  },
  selectIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
    gap: 6,
  },
  infoNoteText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
