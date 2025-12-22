import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Logo animé Artywiz + Restaurant
const AnimatedLogo = () => {
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);
  const opacityCategory = useSharedValue(0);
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  const scaleCategory = useSharedValue(1);
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

    setTimeout(() => {
      scaleCategory.value = withRepeat(
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
    opacityW.value = withTiming(1, { duration: 400 });
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400 });
    }, 300);
    setTimeout(() => {
      opacityCategory.value = withTiming(1, { duration: 400 });
    }, 600);
    
    const timer = setTimeout(() => startAnimation(), 900);
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

  const animatedStyleCategory = useAnimatedStyle(() => ({
    opacity: opacityCategory.value,
    transform: [{ scale: scaleCategory.value }],
  }));

  return (
    <View style={logoStyles.container}>
      <Animated.View style={[logoStyles.partW, animatedStyleW]}>
        <Image source={require('../assets/images/logo_W.png')} style={logoStyles.imageW} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[logoStyles.partArtywiz, animatedStyleArtywiz]}>
        <Image source={require('../assets/images/logo_artywiz.png')} style={logoStyles.imageArtywiz} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[logoStyles.partCategory, animatedStyleCategory]}>
        <Text style={logoStyles.categoryText}>restaurant</Text>
      </Animated.View>
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', height: 110, marginBottom: Spacing.md },
  partW: { alignItems: 'center' },
  imageW: { width: 55, height: 39 },
  partArtywiz: { alignItems: 'center', marginTop: 2 },
  imageArtywiz: { width: 154, height: 33 },
  partCategory: { alignItems: 'center', marginTop: 4 },
  categoryText: { 
    fontSize: 13, 
    fontWeight: '300', 
    color: '#FFFFFF', 
    letterSpacing: 3, 
    textTransform: 'uppercase',
  },
});

export default function RestaurantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100 }));
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }
    Alert.alert('Merci !', 'Vous serez averti(e) du lancement d\'Artywiz Restaurants.', [
      { text: 'OK', onPress: () => router.replace('/sector-selection') }
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AnimatedLogo />

        <Animated.View style={[styles.card, cardAnimatedStyle, { marginBottom: insets.bottom + Spacing.lg }]}>
          {/* Header avec flèche + avatar */}
          <TouchableOpacity style={styles.headerRow} onPress={() => router.replace('/sector-selection')} activeOpacity={0.7}>
            <View style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </View>
            <View style={styles.avatarContainer}>
              <Image 
                source={require('../assets/images/avatar_restaurants.png')} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.description}>
            Artywiz automatise votre communication, tous les jours, sans temps à y passer.
          </Text>
          <Text style={styles.description}>
            Des contenus prêts à publier selon votre carte, saisons et temps forts.
          </Text>
          <Text style={styles.descriptionHighlight}>
            Gratuit et potentiellement rémunérateur : laissez votre mail pour être averti(e) du lancement.
          </Text>

          {/* Email input + bouton envoyer sur une ligne */}
          <View style={styles.emailRow}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Votre email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} style={styles.sendButton}>
              <LinearGradient
                colors={['#FF9500', '#FF8500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 24,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center', alignItems: 'center', 
    marginRight: Spacing.md,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FF9500',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  description: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  descriptionHighlight: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', marginBottom: Spacing.lg, lineHeight: 20 },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
