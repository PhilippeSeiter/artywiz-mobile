import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoBackground } from '../components/VideoBackground';

const { height } = Dimensions.get('window');

// Logo animé Artywiz (comme sur les autres écrans)
const AnimatedContactLogo = () => {
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
    <View style={logoStyles.container}>
      <Animated.View style={[logoStyles.partW, animatedStyleW]}>
        <Image
          source={require('../assets/images/logo_W.png')}
          style={logoStyles.imageW}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={[logoStyles.partArtywiz, animatedStyleArtywiz]}>
        <Image
          source={require('../assets/images/logo_artywiz.png')}
          style={logoStyles.imageArtywiz}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: Spacing.lg,
  },
  partW: {
    alignItems: 'center',
  },
  imageW: {
    width: 80,
    height: 50,
  },
  partArtywiz: {
    alignItems: 'center',
    marginTop: -5,
  },
  imageArtywiz: {
    width: 160,
    height: 36,
  },
});

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardScale = useSharedValue(0.95);

  // Start animations on mount
  useEffect(() => {
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100, mass: 0.8 }));
    cardScale.value = withDelay(200, withSequence(
      withTiming(1.02, { duration: 150 }),
      withSpring(1, { damping: 10, stiffness: 150 })
    ));
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  const validate = () => {
    const newErrors: any = {};
    
    if (!name.trim()) {
      newErrors.name = 'Nom requis';
    }

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email invalide';
    }

    if (!message.trim()) {
      newErrors.message = 'Message requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const emailBody = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const mailtoUrl = `mailto:philippe.seiter@artyplanet.com?subject=Contact Artywiz Football&body=${encodeURIComponent(emailBody)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
        Alert.alert('Succès', 'Votre client email a été ouvert.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Erreur', "Impossible d'ouvrir le client email");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Fond avec gyroscope comme les autres pages */}
      <VideoBackground />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Artywiz animé centré en haut */}
        <AnimatedContactLogo />

        {/* Carte blanche principale */}
        <Animated.View style={[styles.card, cardAnimatedStyle, { marginBottom: insets.bottom + Spacing.lg }]}>
          {/* Header avec flèche et titre - zone cliquable */}
          <TouchableOpacity 
            style={styles.headerRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Contactez</Text>
              <Text style={styles.titleLine2}>nous</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.description}>
            Besoin d'aide ou d'informations ?{'\n'}Remplissez le formulaire ci-dessous.
          </Text>

          {/* Champ Nom - sans label */}
          <View style={styles.inputWrapper}>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color={errors.name ? '#FF6B6B' : Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Champ Email - sans label */}
          <View style={styles.inputWrapper}>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={errors.email ? '#FF6B6B' : Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Votre email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Champ Message - sans label, agrandi */}
          <View style={styles.inputWrapper}>
            <View style={[styles.textAreaContainer, errors.message && styles.inputError]}>
              <Ionicons name="chatbubble-outline" size={20} color={errors.message ? '#FF6B6B' : Colors.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder="Votre message"
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  if (errors.message) setErrors({ ...errors, message: undefined });
                }}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
            {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
          </View>

          {/* Bouton Envoyer - même style que page d'accueil */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.9}
            style={styles.submitButton}
          >
            <LinearGradient
              colors={['#0077FF', '#0066FF', '#0055EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>ENVOYER</Text>
              <View style={styles.iconCircle}>
                <Ionicons name="send" size={14} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  // Carte principale - 80% opacité pour transparence visible
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderRadius: 24,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // Header avec flèche et titre
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  // Inputs sans labels
  inputWrapper: {
    marginBottom: Spacing.md,
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
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 6,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  // TextArea agrandi
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 180,
  },
  textAreaIcon: {
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  // Bouton style page d'accueil
  submitButton: {
    marginTop: Spacing.lg,
    borderRadius: 50,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
  },
});
