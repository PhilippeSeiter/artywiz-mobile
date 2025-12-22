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

const { width, height } = Dimensions.get('window');

// Secteurs disponibles avec avatars
const SECTORS = [
  { 
    id: 'football', 
    name: 'Football', 
    avatar: require('../assets/images/avatar_football.png'),
    active: true,
    color: '#34C759',
    route: '/profile-selection',
  },
  { 
    id: 'boulangerie', 
    name: 'Boulangerie', 
    avatar: require('../assets/images/avatar_boulangerie.png'),
    active: true,
    color: '#D4A574',
    route: '/boulangerie',
  },
  { 
    id: 'coiffure', 
    name: 'Coiffure', 
    avatar: require('../assets/images/avatar_coiffure.png'),
    active: true,
    color: '#FF6B9D',
    route: '/coiffure',
  },
  { 
    id: 'restauration', 
    name: 'Restaurants', 
    avatar: require('../assets/images/avatar_restaurants.png'),
    active: true,
    color: '#FF9500',
    route: '/restaurants',
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

  return (
    <View style={logoStyles.container}>
      <View style={logoStyles.wrapper}>
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

const logoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  wrapper: {
    width: 220,
    height: 75,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  part: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  partW: {
    top: 0,
  },
  partArtywiz: {
    top: 38,
  },
  imageW: {
    width: 55,
    height: 39,
  },
  imageArtywiz: {
    width: 154,
    height: 33,
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
    pressScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.sectorCard,
          { borderColor: sector.color, borderWidth: 2 },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image 
            source={sector.avatar} 
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>

        {/* Nom du secteur */}
        <Text style={styles.sectorName}>{sector.name}</Text>
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

  const handleSectorPress = (sector: typeof SECTORS[0]) => {
    // Animation de sortie puis navigation
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardTranslateY.value = withTiming(-20, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(navigateToRoute)(sector.route);
      }
    });
  };

  const navigateToRoute = (route: string) => {
    router.push(route as any);
  };

  const handleBack = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Fond global géré par _layout.tsx */}

      {/* Logo animé (sans Football) - en arrière plan */}
      <AnimatedSectorLogo />

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 140 }]}
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
                  onPress={() => handleSectorPress(sector)}
                />
              ))}
            </View>
            <View style={styles.sectorsRow}>
              {SECTORS.slice(2, 4).map((sector, index) => (
                <SectorCard
                  key={sector.id}
                  sector={sector}
                  index={index + 2}
                  onPress={() => handleSectorPress(sector)}
                />
              ))}
            </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
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
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  titleLine1: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  titleLine2: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
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
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  sectorName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.xs,
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
