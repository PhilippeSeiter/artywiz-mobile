import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Image } from 'react-native';
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
import { CustomButton, CustomInput } from '../components';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardScale = useSharedValue(0.95);

  // Start animations on mount
  useEffect(() => {
    // Header animation
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    headerTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }));

    // Card animation (bounce from bottom)
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100, mass: 0.8 }));
    cardScale.value = withDelay(200, withSequence(
      withTiming(1.02, { duration: 150 }),
      withSpring(1, { damping: 10, stiffness: 150 })
    ));
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

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
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Image
              source={require('../assets/images/W-artywiz.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Contactez-nous</Text>
          </Animated.View>

          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <Text style={styles.description}>
              Besoin d'aide ou d'informations ? Remplissez le formulaire ci-dessous.
            </Text>

            <CustomInput
              label="Nom"
              placeholder="Votre nom"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
              icon="person"
            />

            <CustomInput
              label="Email"
              placeholder="Votre email"
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

            <View style={styles.inputContainer}>
              {message && <Text style={styles.label}>Message</Text>}
              <View style={[styles.textAreaContainer, errors.message && styles.inputError]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Votre message"
                  placeholderTextColor={Colors.textLight}
                  value={message}
                  onChangeText={(text) => {
                    setMessage(text);
                    if (errors.message) setErrors({ ...errors, message: undefined });
                  }}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
              {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
            </View>

            <CustomButton
              title="ENVOYER"
              onPress={handleSubmit}
              icon="send"
              style={styles.submitButton}
            />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
    marginTop: 2,
  },
  headerLogo: {
    width: 36,
    height: 36,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 34,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  textAreaContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: Spacing.xs / 2,
    marginLeft: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
