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
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomInput } from '../components';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// ============================================
// ANIMATED LOGO COMPONENT - 3 parties avec animation
// Fondu: W (0s) → Artywiz (+0.3s) → Football (+0.6s)
// Animation: décalage 500ms, ±5%, cycles 2s, boucle infinie
// W et Football: GRANDIT d'abord | Artywiz: RÉDUIT d'abord
// ============================================
const AnimatedLoginLogo = ({ onPress }: { onPress?: () => void }) => {
  // Opacités pour le fondu décalé
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);
  
  // Scales pour l'animation
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    // W: ±5%, GRANDIT d'abord
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.05, easeConfig),
        withTiming(0.95, easeConfig)
      ),
      -1,
      true
    );

    // Artywiz: décalage 500ms, ±5%, RÉDUIT d'abord
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
    
    const timer = setTimeout(() => startAnimation(), 800);
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

  return (
    <TouchableOpacity style={styles.animatedLogoContainer} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.logoPartsWrapper}>
        {/* W - en haut */}
        <Animated.View style={[styles.logoPart, styles.logoW, animatedStyleW]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={styles.logoImageW}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Artywiz - en bas */}
        <Animated.View style={[styles.logoPart, styles.logoArtywiz, animatedStyleArtywiz]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={styles.logoImageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// L'image fait déjà 120% de l'écran (dans les styles)
// Animation: pas de scale (déjà agrandi), seulement du déplacement subtil
const BG_SCALE_BASE = 1.0;  // Pas de scale supplémentaire
const BG_SCALE_AMPLITUDE = 0.02;  // Très léger zoom (2%)
// Amplitude du déplacement - très subtil pour ne pas montrer les bords
const BG_TRANSLATE_AMPLITUDE = width * 0.01;  // 1% de déplacement max

// Bouton social avec images locales (sans cercle)
const SocialButton = ({ 
  type, 
  onPress 
}: { 
  type: 'facebook' | 'google'; 
  onPress: () => void 
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.socialButton, animatedStyle]}>
        <Image 
          source={type === 'facebook' 
            ? require('../assets/images/logo_facebook.png')
            : require('../assets/images/logo_google.png')
          }
          style={styles.socialLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn, loginError } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Background breathing animation (scale + translate)
  const bgScale = useSharedValue(BG_SCALE_BASE);
  const bgTranslateX = useSharedValue(0);
  const bgTranslateY = useSharedValue(0);
  
  // Card animations
  const cardTranslateY = useSharedValue(100);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);

  useEffect(() => {
    // Animation de respiration du fond - très lente et fluide
    // Scale: 110% -> 115% -> 110% (cycle de 8 secondes)
    bgScale.value = withRepeat(
      withTiming(BG_SCALE_BASE + BG_SCALE_AMPLITUDE, { 
        duration: 4000, 
        easing: Easing.inOut(Easing.ease) 
      }),
      -1,
      true // reverse
    );

    // Déplacement X: léger mouvement horizontal (cycle de 10 secondes, décalé)
    bgTranslateX.value = withDelay(
      500,
      withRepeat(
        withTiming(BG_TRANSLATE_AMPLITUDE, { 
          duration: 5000, 
          easing: Easing.inOut(Easing.ease) 
        }),
        -1,
        true
      )
    );

    // Déplacement Y: léger mouvement vertical (cycle de 12 secondes, décalé)
    bgTranslateY.value = withDelay(
      1000,
      withRepeat(
        withTiming(BG_TRANSLATE_AMPLITUDE * 0.8, { 
          duration: 6000, 
          easing: Easing.inOut(Easing.ease) 
        }),
        -1,
        true
      )
    );

    // Card slide up animation
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 16, stiffness: 90 }));
    cardScale.value = withDelay(200, withTiming(1, { duration: 300 }));
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
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email invalide';
    }

    if (!password.trim()) {
      newErrors.password = 'Mot de passe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      // Login via real backend API
      await login({ email, password });
      // Navigation is handled by useLogin hook based on onboarding status
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  const handleSocialLogin = async (provider: 'facebook' | 'google') => {
    // TODO: OAuth integration will be connected after JWT auth is fully working
    Alert.alert(
      `Connexion ${provider === 'facebook' ? 'Facebook' : 'Google'}`,
      'La connexion via les réseaux sociaux sera bientôt disponible.'
    );
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Mot de passe oublié',
      'Un email de réinitialisation vous sera envoyé à l\'adresse indiquée.'
    );
  };

  // Button animation
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
      {/* Fond global géré par _layout.tsx */}

      {/* Logo Artywiz - COUCHE 2 (3 parties animées) - cliquable pour retour accueil */}
      <AnimatedLoginLogo onPress={() => router.replace('/')} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Carte de connexion */}
        <Animated.View style={[styles.loginCard, cardAnimatedStyle]}>
          {/* Bouton retour avec titre - zone cliquable */}
          <TouchableOpacity 
            style={styles.headerRow}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <View style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Déjà</Text>
              <Text style={styles.titleLine2}>inscrit.e?</Text>
            </View>
          </TouchableOpacity>

          {/* Description */}
          <Text style={styles.cardDescription}>
            Connectez-vous à votre{'\n'}compte ARTYWIZ...
          </Text>

          {/* Formulaire */}
          <View style={styles.form}>
            <CustomInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon="mail"
            />

            <CustomInput
              placeholder="Mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              isPassword
              error={errors.password}
              icon="lock-closed"
            />
            {/* Mot de passe oublié - sous le champ */}
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
            </TouchableOpacity>
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity
            onPress={handleLogin}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            activeOpacity={1}
            disabled={isLoggingIn}
          >
            <Animated.View style={buttonAnimatedStyle}>
              <LinearGradient
                colors={['#007BFF', '#0066DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>
                  {isLoggingIn ? 'CONNEXION...' : 'JE ME CONNECTE'}
                </Text>
                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Séparateur */}
          <Text style={styles.separatorText}>ou connectez-vous avec :</Text>

          {/* Boutons sociaux */}
          <View style={styles.socialButtonsContainer}>
            <SocialButton type="facebook" onPress={() => handleSocialLogin('facebook')} />
            <SocialButton type="google" onPress={() => handleSocialLogin('google')} />
          </View>

          {/* Pas encore inscrit - 2 lignes */}
          <View style={styles.signupLinkContainer}>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLinkText}>Pas encore inscrit.e?</Text>
              <Text style={styles.signupLinkAction}>Créez votre compte</Text>
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
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  // Wrapper pour le fond - couvre tout l'écran et cache le débordement
  bgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  // Image de fond - statique, taille écran
  bgImage: {
    position: 'absolute',
    width: width,      // Taille écran
    height: height,    // Taille écran
    top: 0,
    left: 0,
  },
  // Logo Artywiz Animé - EN DESSOUS du contenu (zIndex 1)
  animatedLogoContainer: {
    position: 'absolute',
    top: 55,  // Descendu de ~15px (0.5cm)
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,  // EN DESSOUS du scrollView (zIndex 10)
  },
  logoPartsWrapper: {
    width: 220,
    height: 75, // Réduit car pas de Football
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPart: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // W - en haut (le symbole W blanc)
  logoW: {
    top: 0,
    width: '100%',
    alignItems: 'center',
  },
  logoImageW: {
    width: 55,
    height: 39,
  },
  // Artywiz - en bas (le texte "artywiz")
  logoArtywiz: {
    top: 36,
    width: '100%',
    alignItems: 'center',
  },
  logoImageArtywiz: {
    width: 154,
    height: 33,
  },
  // Ancien style (conservé pour compatibilité)
  logoContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  logo: {
    width: 180,
    height: 70,
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
  // Carte de connexion - 90% opacité pour transparence visible
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 24,
    padding: Spacing.xl,
    marginTop: 115,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 100,
    zIndex: 100,
    position: 'relative',
  },
  // Header avec bouton retour et titre
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
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  titleLine2: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  cardDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  // Form
  form: {
    marginBottom: Spacing.md,
  },
  // Login button
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    gap: Spacing.sm,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 13,         // Augmenté d'un corps
    fontWeight: '300',    // Léger
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
  // Separator
  separatorText: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  // Social buttons
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  facebookButton: {
    backgroundColor: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  // Forgot password
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  signupLinkContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  signupLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  signupLinkAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
