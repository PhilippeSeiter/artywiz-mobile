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
  TextInput,
  Dimensions,
  ImageBackground,
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
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// ============================================
// ANIMATED LOGO COMPONENT - 3 parties avec animation
// Fondu: W (0s) → Artywiz (+0.3s) → Football (+0.6s)
// Animation: décalage 500ms, ±5%, cycles 2s, boucle infinie
// W et Football: GRANDIT d'abord | Artywiz: RÉDUIT d'abord
// ============================================
const AnimatedLoginLogo = () => {
  // Opacités pour le fondu décalé
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);
  const opacityFootball = useSharedValue(0);
  
  // Scales pour l'animation
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
  useEffect(() => {
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
    <View style={styles.animatedLogoContainer}>
      {/* Container pour positionner les 3 parties */}
      <View style={styles.logoPartsWrapper}>
        {/* W - en haut */}
        <Animated.View style={[styles.logoPart, styles.logoW, animatedStyleW]}>
          <Image
            source={require('../assets/images/logo_W.png')}
            style={styles.logoImageW}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Artywiz - au milieu */}
        <Animated.View style={[styles.logoPart, styles.logoArtywiz, animatedStyleArtywiz]}>
          <Image
            source={require('../assets/images/logo_artywiz.png')}
            style={styles.logoImageArtywiz}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Football - en bas */}
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

// L'image fait déjà 120% de l'écran (dans les styles)
// Animation: pas de scale (déjà agrandi), seulement du déplacement subtil
const BG_SCALE_BASE = 1.0;  // Pas de scale supplémentaire
const BG_SCALE_AMPLITUDE = 0.02;  // Très léger zoom (2%)
// Amplitude du déplacement - très subtil pour ne pas montrer les bords
const BG_TRANSLATE_AMPLITUDE = width * 0.01;  // 1% de déplacement max

// Composant Input personnalisé
const PillInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(0);

  useEffect(() => {
    focusAnimation.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(focusAnimation.value, [0, 1], [0, 2]),
    borderColor: error ? '#FF6B6B' : '#007BFF',
  }));

  return (
    <View style={styles.inputWrapper}>
      <Animated.View style={[styles.pillInputContainer, containerStyle]}>
        <TextInput
          style={styles.pillInput}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Bouton social
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

  if (type === 'facebook') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[styles.socialButton, styles.facebookButton, animatedStyle]}>
          <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.socialButton, styles.googleButton, animatedStyle]}>
        <Text style={styles.googleLogo}>G</Text>
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
    if (provider === 'google') {
      Alert.alert(
        'Connexion Google',
        'La connexion via Google sera bientôt disponible.'
      );
      return;
    }
    
    // Facebook login via Meta OAuth
    setLoading(true);
    try {
      const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const callbackUrl = `${BACKEND_URL}/api/auth/meta/callback`;
      
      const response = await fetch(
        `${BACKEND_URL}/api/auth/meta/start?user_id=facebook_user&redirect_uri=${encodeURIComponent(callbackUrl)}`
      );
      
      if (!response.ok) {
        throw new Error('Impossible de démarrer la connexion Facebook');
      }
      
      const { auth_url } = await response.json();
      
      if (Platform.OS === 'web') {
        const popup = window.open(auth_url, 'facebook_login', 'width=600,height=700');
        
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'META_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            const profiles = MockDataService.getAllProfiles();
            const defaultProfile = profiles[0];
            await login('facebook@user.com', 'facebook', defaultProfile.id);
            router.replace('/(tabs)');
          }
        };
        window.addEventListener('message', handleMessage);
        
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            setLoading(false);
          }
        }, 500);
      } else {
        const WebBrowser = await import('expo-web-browser');
        const result = await WebBrowser.openAuthSessionAsync(auth_url, callbackUrl);
        
        if (result.type === 'success') {
          const profiles = MockDataService.getAllProfiles();
          const defaultProfile = profiles[0];
          await login('facebook@user.com', 'facebook', defaultProfile.id);
          router.replace('/(tabs)');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      Alert.alert('Erreur', 'Impossible de se connecter avec Facebook');
      setLoading(false);
    }
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
      {/* Fond statique avec blocs - COUCHE 0 */}
      <View style={styles.bgWrapper}>
        <ImageBackground
          source={require('../assets/images/fond_blocs.png')}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </View>

      {/* Logo Artywiz - COUCHE 2 (3 parties animées) */}
      <AnimatedLoginLogo />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Carte de connexion */}
        <Animated.View style={[styles.loginCard, cardAnimatedStyle]}>
          {/* Bouton retour avec titre à droite */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Déjà</Text>
              <Text style={styles.titleLine2}>Inscrit.e?</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.cardDescription}>
            Connectez-vous à votre{'\n'}compte ARTYWIZ...
          </Text>

          {/* Formulaire */}
          <View style={styles.form}>
            <PillInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <PillInput
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity
            onPress={handleLogin}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            activeOpacity={1}
            disabled={loading}
          >
            <Animated.View style={buttonAnimatedStyle}>
              <LinearGradient
                colors={['#007BFF', '#0066DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'CONNEXION...' : 'JE ME CONNECTE'}
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

          {/* Mot de passe oublié */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
          </TouchableOpacity>
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
    width: 220,  // +10% (était 200)
    height: 105, // Ajusté pour contenir les 3 parties
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
    width: 55,   // +10% (était 50)
    height: 39,  // +10% (était 35)
  },
  // Artywiz - au milieu (le texte "artywiz")
  logoArtywiz: {
    top: 36,     // Ajusté pour +10%
    width: '100%',
    alignItems: 'center',
  },
  logoImageArtywiz: {
    width: 154,  // +10% (était 140)
    height: 33,  // +10% (était 30)
  },
  // Football - en bas (le texte "FOOTBALL")
  logoFootball: {
    top: 68,     // Ajusté pour être visible dans le wrapper
    width: '100%',
    alignItems: 'center',
  },
  logoImageFootball: {
    width: 110,  // +10% (était 100)
    height: 22,  // +10% (était 20)
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
  // Carte de connexion
  loginCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    marginTop: 115, // Réduit de 140 à 115 pour rapprocher du logo
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
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    marginBottom: 4,
  },
  pillInputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    overflow: 'hidden',
  },
  pillInput: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: Spacing.md,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleLogo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4285F4',
  },
  // Forgot password
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});
