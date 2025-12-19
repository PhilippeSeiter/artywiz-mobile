import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../constants';
import { useAuthStore } from '../stores/authStore';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { VideoBackground } from '../components/VideoBackground';

const { width, height } = Dimensions.get('window');

// ============================================
// ANIMATED WELCOME LOGO - 3 parties (même animation que signup)
// Animation: décalage 500ms, ±15%, cycles 2.4s (20% plus lent), boucle infinie
// W et Football: GRANDIT d'abord | Artywiz: RÉDUIT d'abord
// ============================================
const AnimatedWelcomeLogo = () => {
  // Opacités pour le fondu décalé
  const opacityW = useSharedValue(1);  // Visible dès le départ
  const opacityArtywiz = useSharedValue(1);
  const opacityFootball = useSharedValue(1);
  
  // Scales pour l'animation
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  const scaleFootball = useSharedValue(1);
  
  const isAnimatingRef = React.useRef(false);

  const startAnimation = React.useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Cycle de 2.4 secondes = 1200ms par demi-cycle (20% plus lent, comme signup)
    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    // W: décalage 0ms, ±15%, GRANDIT d'abord
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.15, easeConfig),
        withTiming(0.85, easeConfig)
      ),
      -1, // Boucle infinie
      true
    );

    // Artywiz: décalage 500ms, ±15%, RÉDUIT d'abord
    setTimeout(() => {
      scaleArtywiz.value = withRepeat(
        withSequence(
          withTiming(0.85, easeConfig),
          withTiming(1.15, easeConfig)
        ),
        -1,
        true
      );
    }, 500);

    // Football: décalage 1000ms, ±15%, GRANDIT d'abord
    setTimeout(() => {
      scaleFootball.value = withRepeat(
        withSequence(
          withTiming(1.15, easeConfig),
          withTiming(0.85, easeConfig)
        ),
        -1,
        true
      );
    }, 1000);
  }, []);

  // Fondu décalé au chargement: W → +0.3s → Artywiz → +0.3s → Football
  React.useEffect(() => {
    // W apparaît en premier
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    
    // Artywiz apparaît après 300ms
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 300);
    
    // Football apparaît après 600ms
    setTimeout(() => {
      opacityFootball.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 600);
    
    // Démarrer l'animation de scale après le fondu complet
    const timer = setTimeout(() => startAnimation(), 1000);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  // Styles animés avec opacité + scale
  const animatedStyleW = useAnimatedStyle(() => ({
    opacity: opacityW.value,
    transform: [{ scale: scaleW.value }],
  }));

  const animatedStyleArtywiz = useAnimatedStyle(() => ({
    opacity: opacityArtywiz.value,
    transform: [{ scale: scaleArtywiz.value }],
  }));

  const animatedStyleFootball = useAnimatedStyle(() => ({
    opacity: opacityFootball.value,
    transform: [{ scale: scaleFootball.value }],
  }));

  return (
    <TouchableOpacity 
      onPress={() => !isAnimatingRef.current && startAnimation()} 
      activeOpacity={0.9}
      style={welcomeLogoStyles.container}
    >
      <View style={welcomeLogoStyles.wrapper}>
        {/* W - en haut */}
        <Animated.View style={[welcomeLogoStyles.part, welcomeLogoStyles.partW, animatedStyleW]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={welcomeLogoStyles.imageW}
            resizeMode="contain"
          />
        </Animated.View>
        {/* Artywiz - au milieu */}
        <Animated.View style={[welcomeLogoStyles.part, welcomeLogoStyles.partArtywiz, animatedStyleArtywiz]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={welcomeLogoStyles.imageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
        {/* Football - en bas */}
        <Animated.View style={[welcomeLogoStyles.part, welcomeLogoStyles.partFootball, animatedStyleFootball]}>
          <Image
            source={require('../assets/images/logo_football.png')}
            style={welcomeLogoStyles.imageFootball}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// Styles pour le logo animé de bienvenue
// Positionnement basé sur le logo original (220x130) - AGRANDI +20%
// Point de fuite: étoile rouge au centre-bas du W
const welcomeLogoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: 264,    // 220 * 1.2 = 264
    height: 156,   // 130 * 1.2 = 156
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  part: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  // W - positionné en haut (+20%)
  partW: {
    top: 0,
  },
  imageW: {
    width: 108,    // 90 * 1.2 = 108
    height: 66,    // 55 * 1.2 = 66
  },
  // Artywiz - positionné sous le W (+20%)
  partArtywiz: {
    top: 62,       // 52 * 1.2 = 62
  },
  imageArtywiz: {
    width: 216,    // 180 * 1.2 = 216
    height: 48,    // 40 * 1.2 = 48
  },
  // Football - positionné en bas (+20%)
  partFootball: {
    top: 114,      // 95 * 1.2 = 114
  },
  imageFootball: {
    width: 156,    // 130 * 1.2 = 156
    height: 34,    // 28 * 1.2 = 34
  },
});

// Animated button component with press effect
interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary';
  style?: any;
}

function AnimatedButton({ title, onPress, icon, variant = 'primary', style }: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const brightness = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    brightness.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    brightness.value = withTiming(0, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: brightness.value * 0.2,
  }));

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
        {isPrimary ? (
          <LinearGradient
            colors={['#0077FF', '#0066FF', '#0055EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonPrimary}
          >
            <Text style={styles.buttonTextPrimary}>{title}</Text>
            {icon && (
              <View style={styles.iconCircle}>
                <Ionicons name={icon as any} size={14} color="#FFFFFF" />
              </View>
            )}
            <Animated.View style={[styles.buttonOverlay, overlayStyle]} />
          </LinearGradient>
        ) : (
          <View style={styles.buttonSecondary}>
            <Text style={styles.buttonTextSecondary}>{title}</Text>
            {icon && (
              <View style={styles.iconCircleSecondary}>
                <Ionicons name={icon as any} size={14} color="#64748B" />
              </View>
            )}
            <Animated.View style={[styles.buttonOverlaySecondary, overlayStyle]} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, initialize, isInitialized } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  
  // Animation values for sequenced appearance
  const cardTranslateY = useSharedValue(100);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  
  // Logo opacity (pas de scale/bounce - géré par AnimatedWelcomeLogo)
  const logoOpacity = useSharedValue(0);
  
  // Baseline - fondu simple (3 lignes)
  const baseline1Opacity = useSharedValue(0);
  const baseline2Opacity = useSharedValue(0);
  const baseline3Opacity = useSharedValue(0);
  
  // Animation du mot "buzz" - vibration
  const buzzShake = useSharedValue(0);
  
  // Animation du dégradé - rotation continue
  const gradientRotation = useSharedValue(0);

  // Initialize auth and check user status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isInitialized) {
          await initialize();
        }
      } catch (error) {
        console.log('Auth init error:', error);
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // Handle navigation based on auth state and profile setup
  useEffect(() => {
    if (!isCheckingAuth && isInitialized) {
      if (user && !shouldRedirect) {
        setShouldRedirect(true);
        // Check if user has profiles, redirect accordingly
        const { selectedProfiles, hasCompletedOnboarding } = useUserPreferencesStore.getState();
        
        console.log('[Welcome] User logged in, checking profiles:', selectedProfiles?.length || 0, 'onboarding:', hasCompletedOnboarding);
        
        if (!selectedProfiles || selectedProfiles.length === 0) {
          // No profiles -> go to profile selection first
          console.log('[Welcome] No profiles, redirecting to profile-selection');
          router.replace('/profile-selection');
        } else {
          // Has profiles -> go to main dashboard
          router.replace('/(tabs)');
        }
      }
    }
  }, [isCheckingAuth, isInitialized, user]);

  // Animation du mot "buzz" - vibre toutes les 2 secondes pendant 0.5s
  useEffect(() => {
    if (!animationStarted) return;
    
    // Vibration du mot buzz : rapide gauche-droite pendant 0.5s
    const triggerBuzzShake = () => {
      buzzShake.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(2, { duration: 50 }),
        withTiming(-1, { duration: 50 }),
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 50 }),
        withTiming(0, { duration: 50 }) // Total ~500ms
      );
    };
    
    // Premier shake après 1s, puis toutes les 2s
    const initialTimeout = setTimeout(triggerBuzzShake, 1000);
    const interval = setInterval(triggerBuzzShake, 2000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [animationStarted]);
  
  // Animation du dégradé - rotation 360° continue
  useEffect(() => {
    // Rotation continue (5 secondes pour un tour complet - 2x plus rapide)
    gradientRotation.value = withRepeat(
      withTiming(360, { duration: 5000, easing: Easing.linear }),
      -1, // Répéter infiniment
      false // Ne pas inverser
    );
  }, []);

  // Start sequenced animations when ready
  useEffect(() => {
    if (!isCheckingAuth && !user && !animationStarted) {
      setAnimationStarted(true);
      
      // Logo apparaît en fondu (l'animation 3 parties est gérée par AnimatedWelcomeLogo)
      logoOpacity.value = withTiming(1, { duration: 400 });
      
      // Baseline appears (3 lignes)
      baseline1Opacity.value = withDelay(300, withTiming(1, { duration: 500 }));
      baseline2Opacity.value = withDelay(450, withTiming(1, { duration: 500 }));
      baseline3Opacity.value = withDelay(600, withTiming(1, { duration: 500 }));
      
      // Card slides up smoothly
      cardOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
      cardTranslateY.value = withDelay(500, withSpring(0, { damping: 18, stiffness: 90, mass: 0.8 }));
      cardScale.value = withDelay(500, withSequence(
        withTiming(1.01, { duration: 200 }),
        withSpring(1, { damping: 12, stiffness: 120 })
      ));
    }
  }, [isCheckingAuth, user, animationStarted]);

  // Card animation style
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  // Logo animation style (juste le fondu, pas de scale)
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  // Baseline styles
  const baseline1Style = useAnimatedStyle(() => ({
    opacity: baseline1Opacity.value,
  }));

  const baseline2Style = useAnimatedStyle(() => ({
    opacity: baseline2Opacity.value,
  }));

  const baseline3Style = useAnimatedStyle(() => ({
    opacity: baseline3Opacity.value,
  }));
  
  // Style pour le mot "buzz" qui vibre
  const buzzAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: buzzShake.value }],
  }));
  
  // Style pour la rotation du dégradé
  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotation.value}deg` }],
  }));

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0066FF', '#00AAFF', '#00DDCC']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Image
            source={require('../assets/images/logo_artywiz_blanc.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.loadingSpinner} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fond vidéo partagé via VideoBackgroundProvider dans _layout.tsx */}
      
      <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        {/* Logo Section - 3 parties animées */}
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <AnimatedWelcomeLogo />
          </Animated.View>
        </View>
        
        {/* Slogan - Centré entre logo et carte (3 lignes) */}
        <View style={styles.baselineSection}>
          <View style={styles.baselineContainer}>
            <Animated.Text style={[styles.baselineLine1, baseline1Style]}>
              Votre communication
            </Animated.Text>
            <Animated.Text style={[styles.baselineLine2, baseline2Style]}>
              Zéro effort
            </Animated.Text>
            <Animated.Text style={[styles.baselineLine3, baseline3Style]}>
              100% bénéfices
            </Animated.Text>
          </View>
        </View>

        {/* Carte blanche principale */}
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.card}>
            {/* Titre principal en 2 lignes avec "buzz" animé */}
            <View>
              <Text style={styles.cardHeadlineSmall}>Prêt·e à</Text>
              <View style={styles.buzzLine}>
                <Text style={styles.cardHeadlineBig}>faire le </Text>
                <Animated.Text style={[styles.cardHeadlineBig, styles.buzzWord, buzzAnimatedStyle]}>
                  buzz
                </Animated.Text>
                <Text style={styles.cardHeadlineBig}> ?</Text>
              </View>
            </View>
            
            {/* Description en 3 lignes */}
            <Text style={styles.cardDescription}>
              Recevez chaque jour de nouveaux{'\n'}visuels prêts à l'emploi :{'\n'}Editez, partagez, profitez !
            </Text>
            
            {/* Bouton primaire - JE ME CONNECTE */}
            <AnimatedButton
              title="JE ME CONNECTE"
              onPress={() => router.push('/login')}
              icon="arrow-forward"
              variant="primary"
            />
            
            {/* Bouton secondaire - JE CRÉE MON COMPTE */}
            <AnimatedButton
              title="JE CRÉE MON COMPTE"
              onPress={() => router.push('/signup')}
              icon="add"
              variant="secondary"
              style={styles.secondaryButtonMargin}
            />

            {/* Lien de contact */}
            <TouchableOpacity onPress={() => router.push('/contact')} style={styles.contactButton}>
              <Text style={styles.contactText}>
                Un souci ? <Text style={styles.contactTextLink}>Contactez-nous!</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
    overflow: 'hidden',
  },
  // Gradient rotatif - agrandi à 130% pour éviter les bords visibles lors de la rotation
  gradientContainer: {
    position: 'absolute',
    width: width * 2.6,
    height: height * 2.6,
    top: -height * 0.8,
    left: -width * 0.8,
  },
  rotatingGradient: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  // Logo section - centré en haut
  logoSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  mainLogo: {
    width: 220,
    height: 130,
  },
  // Baseline - centré verticalement entre logo et carte
  baselineSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  baselineContainer: {
    alignItems: 'center',
  },
  // Ligne 1: "Votre communication" (normal, +1pt = 15pt)
  baselineLine1: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Ligne 2: "Zéro effort" (bold, +2pt = 16pt)
  baselineLine2: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  // Ligne 3: "100% bénéfices" (bold, +3pt = 17pt)
  baselineLine3: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  // Carte blanche
  cardContainer: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },
  cardHeadlineSmall: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 30,
  },
  cardHeadlineBig: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 30,
  },
  buzzLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  buzzWord: {
    color: '#0066FF',
  },
  cardDescription: {
    fontSize: 11,   // Même taille que "un souci..." (contactText)
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 16,
  },
  // Boutons
  buttonWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    position: 'relative',
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#E8F4FD',
    borderRadius: 50,
    position: 'relative',
  },
  buttonTextPrimary: {
    fontSize: 13,         // Augmenté d'un corps
    fontWeight: '300',    // Léger
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  buttonTextSecondary: {
    fontSize: 13,         // Augmenté d'un corps
    fontWeight: '300',    // Léger
    color: '#334155',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 14,
  },
  iconCircleSecondary: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 14,
  },
  buttonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    pointerEvents: 'none',
  },
  buttonOverlaySecondary: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    borderRadius: 50,
    pointerEvents: 'none',
  },
  secondaryButtonMargin: {
    marginTop: 10,
  },
  contactButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  contactTextLink: {
    color: '#0066FF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 200,
    height: 150,
  },
  loadingSpinner: {
    marginTop: Spacing.xl,
  },
});
