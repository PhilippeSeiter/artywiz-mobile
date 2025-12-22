import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay } from 'react-native-reanimated';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AnimatedLogo = () => {
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);

  useEffect(() => {
    opacityW.value = withTiming(1, { duration: 400 });
    setTimeout(() => { opacityArtywiz.value = withTiming(1, { duration: 400 }); }, 300);
  }, []);

  const animatedStyleW = useAnimatedStyle(() => ({ opacity: opacityW.value }));
  const animatedStyleArtywiz = useAnimatedStyle(() => ({ opacity: opacityArtywiz.value }));

  return (
    <View style={logoStyles.container}>
      <Animated.View style={[logoStyles.partW, animatedStyleW]}>
        <Image source={require('../assets/images/logo_W.png')} style={logoStyles.imageW} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[logoStyles.partArtywiz, animatedStyleArtywiz]}>
        <Image source={require('../assets/images/logo_artywiz.png')} style={logoStyles.imageArtywiz} resizeMode="contain" />
      </Animated.View>
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', height: 100, marginBottom: Spacing.lg },
  partW: { alignItems: 'center' },
  imageW: { width: 80, height: 50 },
  partArtywiz: { alignItems: 'center', marginTop: -5 },
  imageArtywiz: { width: 160, height: 36 },
});

export default function CoiffureScreen() {
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
    Alert.alert('Merci !', 'Vous serez averti(e) du lancement d\'Artywiz Coiffure.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <VideoBackground />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AnimatedLogo />

        <Animated.View style={[styles.card, cardAnimatedStyle, { marginBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity style={styles.headerRow} onPress={() => router.replace('/sector-selection')} activeOpacity={0.7}>
            <View style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Artywiz</Text>
              <Text style={styles.titleLine2}>coiffure</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.description}>
            Artywiz génère votre communication chaque jour, automatiquement, sans y passer la soirée.
          </Text>
          <Text style={styles.description}>
            Offres, tendances, créneaux : du contenu prêt à poster, simple et pro.
          </Text>
          <Text style={styles.descriptionHighlight}>
            Gratuit et potentiellement rémunérateur : laissez votre mail pour être averti(e) du lancement.
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
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

          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.9} style={styles.submitButton}>
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
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 24,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  titleContainer: { flex: 1 },
  titleLine1: { fontSize: 24, fontWeight: '300', color: Colors.textPrimary, lineHeight: 28 },
  titleLine2: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, lineHeight: 28 },
  description: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  descriptionHighlight: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', marginBottom: Spacing.lg, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FA', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 14 },
  submitButton: { borderRadius: 50, overflow: 'hidden' },
  submitButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 50,
  },
  submitButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.5, flex: 1, textAlign: 'center' },
  iconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 16,
  },
});
