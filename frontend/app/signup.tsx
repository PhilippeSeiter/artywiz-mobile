import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  Image,
  Dimensions,
} from 'react-native';
import { VideoBackground } from '../components/VideoBackground';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { CustomInput } from '../components';
import { Colors, Spacing } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ============================================
// ANIMATED LOGO COMPONENT - 3 parties
// Fondu: W (0s) → Artywiz (+0.3s) → Football (+0.6s)
// Animation: décalage 500ms, ±5%, cycles 2s, boucle infinie
// ============================================
const AnimatedSignupLogo = () => {
  const opacityW = useSharedValue(1);      // Démarrer visible
  const opacityArtywiz = useSharedValue(1); // Démarrer visible
  const opacityFootball = useSharedValue(1); // Démarrer visible
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  const scaleFootball = useSharedValue(1);
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Cycle de 2.4 secondes = 1200ms par demi-cycle (20% plus lent)
    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    // W: ±15% amplitude, GRANDIT d'abord
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.15, easeConfig),
        withTiming(0.85, easeConfig)
      ),
      -1,
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

  useEffect(() => {
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 300);
    setTimeout(() => {
      opacityFootball.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 600);
    const timer = setTimeout(() => startAnimation(), 1000);
    return () => clearTimeout(timer);
  }, [startAnimation]);

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
    <View style={styles.animatedLogoContainer}>
      <View style={styles.logoPartsWrapper}>
        <Animated.View style={[styles.logoPart, styles.logoW, animatedStyleW]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={styles.logoImageW}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.logoPart, styles.logoArtywiz, animatedStyleArtywiz]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={styles.logoImageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.logoPart, styles.logoFootball, animatedStyleFootball]}>
          <Image
            source={require('../assets/images/logo_football.png')}
            style={styles.logoImageFootball}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

// Animation du fond
const BG_SCALE_BASE = 1.0;
const BG_SCALE_AMPLITUDE = 0.02;
const BG_TRANSLATE_AMPLITUDE = width * 0.01;

export default function SignupScreen() {
  const router = useRouter();
  const { register, isRegistering } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    name?: string; 
    email?: string; 
    password?: string;
  }>({});

  // Animation du fond
  const bgScale = useSharedValue(BG_SCALE_BASE);
  const bgTranslateX = useSharedValue(0);
  const bgTranslateY = useSharedValue(0);

  // Animation de la carte
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    // Animation du fond
    bgScale.value = withRepeat(
      withSequence(
        withTiming(BG_SCALE_BASE + BG_SCALE_AMPLITUDE, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(BG_SCALE_BASE - BG_SCALE_AMPLITUDE, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    bgTranslateX.value = withRepeat(
      withSequence(
        withTiming(BG_TRANSLATE_AMPLITUDE, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-BG_TRANSLATE_AMPLITUDE, { duration: 10000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    bgTranslateY.value = withRepeat(
      withSequence(
        withTiming(-BG_TRANSLATE_AMPLITUDE * 0.5, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(BG_TRANSLATE_AMPLITUDE * 0.5, { duration: 12000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Animation de la carte
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100, mass: 0.8 }));
  }, []);

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bgScale.value },
      { translateX: bgTranslateX.value },
      { translateY: bgTranslateY.value },
    ],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const validate = () => {
    const newErrors: any = {};
    
    if (!name.trim()) {
      newErrors.name = 'Nom ou pseudo requis';
    }

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email invalide';
    }

    if (!password.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      // Register via real backend API
      await register({ email, password, name });
      // Navigation is handled by useRegister hook (goes to profile-selection)
    } catch (error: any) {
      // Check if it's an "email already exists" error
      const errorMessage = error.message || error.detail || 'Une erreur est survenue';
      
      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('utilisé')) {
        // Show error under the email field
        setErrors({ ...errors, email: 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.' });
      } else {
        // Show generic error alert
        Alert.alert('Erreur', errorMessage);
      }
    }
  };

  // Animation du bouton
  const buttonScale = useSharedValue(1);
  
  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Fond vidéo partagé via VideoBackgroundProvider dans _layout.tsx */}

      {/* Logo animé - zIndex bas pour passer sous la card */}
      <AnimatedSignupLogo />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Carte */}
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {/* Header avec bouton retour et titre */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Rejoignez</Text>
              <Text style={styles.titleLine2}>Artywiz</Text>
            </View>
          </View>

          {/* Formulaire - labels dans les placeholders */}
          <View style={styles.form}>
            <CustomInput
              placeholder="Nom ou pseudo"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
              icon="person"
            />

            <CustomInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              placeholder="Mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              icon="lock-closed"
              isPassword
            />
          </View>

          {/* Bouton Continuer */}
          <TouchableOpacity
            onPress={handleSignup}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            activeOpacity={1}
            disabled={isRegistering}
          >
            <Animated.View style={buttonAnimatedStyle}>
              <LinearGradient
                colors={['#007BFF', '#0066DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>
                  {isRegistering ? 'CRÉATION...' : 'JE CRÉE MON COMPTE'}
                </Text>
                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà inscrit ?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>Je me connecte</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
    overflow: 'hidden',
  },
  bgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    width: width,      // Taille écran
    height: height,    // Taille écran
    top: 0,
    left: 0,
  },
  animatedLogoContainer: {
    position: 'absolute',
    top: 55,  // Descendu de ~15px
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,  // EN DESSOUS du contenu scrollable
    overflow: 'visible',
  },
  logoPartsWrapper: {
    width: 220,  // +10%
    height: 100, // Hauteur pour W + artywiz + FOOTBALL avec marge
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoPart: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoW: {
    top: 0,
    width: '100%',
    alignItems: 'center',
  },
  logoImageW: {
    width: 55,   // +10%
    height: 39,  // +10%
  },
  logoArtywiz: {
    top: 38,     // Sous le W
    width: '100%',
    alignItems: 'center',
  },
  logoImageArtywiz: {
    width: 154,  // +10%
    height: 33,  // +10%
  },
  logoFootball: {
    top: 66,     // Sous Artywiz, repositionné
    width: '100%',
    alignItems: 'center',
  },
  logoImageFootball: {
    width: 110,  // +10%
    height: 22,  // +10%
  },
  scrollView: {
    flex: 1,
    zIndex: 10,  // Au-dessus du logo (zIndex 1)
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    marginTop: 115,  // Réduit pour rapprocher du logo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 100,
    zIndex: 200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: Spacing.md,
    marginTop: 2,
  },
  titleLine1: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  titleLine2: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  form: {
    marginBottom: Spacing.md,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
  },
  continueButtonText: {
    fontSize: 13,        // Augmenté d'un corps
    fontWeight: '300',   // Léger
    color: '#FFFFFF',
    marginRight: Spacing.sm,
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  link: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
