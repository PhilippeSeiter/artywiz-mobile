import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';

export default function DataDeletionScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Demande envoyée</Text>
          <Text style={styles.successText}>
            Votre demande de suppression de données a été enregistrée.{"\n\n"}
            Nous traiterons votre demande dans un délai de 30 jours conformément 
            au RGPD. Vous recevrez une confirmation par email à : {email}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
    >
      <Text style={styles.title}>Suppression des données</Text>
      <Text style={styles.subtitle}>Instructions de suppression de vos données personnelles</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Que se passe-t-il lors de la suppression ?</Text>
        <Text style={styles.cardText}>
          Lorsque vous demandez la suppression de vos données, nous supprimerons :{"\n\n"}
          • Votre compte et profil{"\n"}
          • Vos connexions aux réseaux sociaux{"\n"}
          • Tout le contenu créé dans l'application{"\n"}
          • Vos préférences et paramètres{"\n"}
          • Votre historique d'utilisation
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Demander la suppression</Text>
        <Text style={styles.cardText}>
          Entrez l'adresse email associée à votre compte Artywiz :
        </Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          placeholderTextColor={Colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Demander la suppression</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Autres options</Text>
        <Text style={styles.cardText}>
          Vous pouvez également nous contacter directement :{"\n\n"}
          📧 Email : contact@artywiz.com{"\n"}
          📬 Courrier : Artywiz, [Adresse]
        </Text>
      </View>

      <Text style={styles.notice}>
        Conformément au RGPD, votre demande sera traitée dans un délai maximum de 30 jours.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  cardText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  notice: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
