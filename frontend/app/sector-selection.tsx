import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
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
    emoji: null,
    active: true,
    color: '#34C759',
  },
  { 
    id: 'boulangerie', 
    name: 'Boulangerie', 
    icon: null,
    emoji: '🥖',
    active: false,
    color: '#D4A574',
  },
  { 
    id: 'coiffure', 
    name: 'Coiffure', 
    icon: 'cut',
    emoji: null,
    active: false,
    color: '#FF6B9D',
  },
  { 
    id: 'restauration', 
    name: 'Restauration', 
    icon: 'restaurant',
    emoji: null,
    active: false,
    color: '#FF9500',
  },
];

// ============================================
// ANIMATED LOGO COMPONENT (sans Football)
// ============================================
const AnimatedSectorLogo = () => {
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
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
  }, []);

  useEffect(() => {
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 300);
    setTimeout(() => startAnimation(), 800);
  }, []);

  const wStyle = useAnimatedStyle(() => ({
    opacity: opacityW.value,
    transform: [{ scale: scaleW.value }],
  }));

  const artywizStyle = useAnimatedStyle(() => ({
    opacity: opacityArtywiz.value,
    transform: [{ scale: scaleArtywiz.value }],
  }));

  const BASE_WIDTH = 220 * 1.2;
  const BASE_HEIGHT = 130 * 1.2 * 0.8; // Réduit car pas de Football

  return (
    <View style={logoStyles.container}>
      <View style={[logoStyles.wrapper, { width: BASE_WIDTH, height: BASE_HEIGHT }]}>
        {/* W - en haut */}
        <Animated.View style={[logoStyles.part, logoStyles.partW, wStyle]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={logoStyles.imageW}
            resizeMode="contain"
          />
        </Animated.View>
        {/* Artywiz - en bas */}
        <Animated.View style={[logoStyles.part, logoStyles.partArtywiz, artywizStyle]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={logoStyles.imageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const BASE_WIDTH = 220 * 1.2;
const BASE_HEIGHT = 130 * 1.2 * 0.8;

const logoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  wrapper: {
    position: 'relative',
  },
  part: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    right: 0,
  },
  partW: {
    top: 0,
    height: BASE_HEIGHT * 0.6,
  },
  partArtywiz: {
    top: BASE_HEIGHT * 0.5,
    height: BASE_HEIGHT * 0.4,
  },
  imageW: {
    width: BASE_WIDTH * 0.45,
    height: BASE_HEIGHT * 0.6,
  },
  imageArtywiz: {
    width: BASE_WIDTH * 0.85,
    height: BASE_HEIGHT * 0.35,
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
    const delay = 300 + index * 100;
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
          sector.active && { borderColor: sector.color, borderWidth: 2 },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!sector.active}
        activeOpacity={0.9}
      >
        {/* Icône ou Emoji */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: sector.active ? sector.color : '#E5E7EB' }
        ]}>
          {sector.emoji ? (
            <Text style={styles.emojiIcon}>{sector.emoji}</Text>
          ) : (
            <Ionicons 
              name={sector.icon as any} 
              size={36} 
              color={sector.active ? '#FFFFFF' : '#9CA3AF'} 
            />
          )}
        </View>

        {/* Nom du secteur */}
        <Text style={[
          styles.sectorName,
          !sector.active && styles.sectorNameInactive
        ]}>
          {sector.name}
        </Text>

        {/* Badge "Bientôt" SOUS l'icône pour les inactifs */}
        {!sector.active && (
          <View style={styles.badgeBientot}>
            <Text style={styles.badgeBientotText}>Bientôt</Text>
          </View>
        )}

        {/* Indicateur de sélection pour le secteur actif */}
        {sector.active && (
          <View style={styles.selectIndicator}>
            <Ionicons name="chevron-forward" size={18} color={sector.color} />
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

  // Animation de la carte
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
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

      {/* Logo animé (sans Football) - en arrière plan */}
      <AnimatedSectorLogo />

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte principale */}
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {/* Header avec bouton retour et titre */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Mon</Text>
              <Text style={styles.titleLine2}>profil</Text>
            </View>
          </View>

          {/* Sous-titre */}
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
            <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoNoteText}>
              D'autres secteurs bientôt disponibles
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 160, // Espace pour le logo
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  titleLine1: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  titleLine2: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginTop: -2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  sectorsGrid: {
    marginBottom: Spacing.md,
  },
  sectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardWrapper: {
    width: '48%',
  },
  sectorCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 130,
    justifyContent: 'center',
    position: 'relative',
  },
  sectorCardInactive: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emojiIcon: {
    fontSize: 36,
  },
  sectorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  sectorNameInactive: {
    color: '#9CA3AF',
  },
  badgeBientot: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: Spacing.xs,
  },
  badgeBientotText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.sm,
    gap: 6,
  },
  infoNoteText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
