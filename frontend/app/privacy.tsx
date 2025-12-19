import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../constants';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
    >
      <Text style={styles.title}>Politique de Confidentialité</Text>
      <Text style={styles.date}>Dernière mise à jour : Décembre 2024</Text>

      <Text style={styles.sectionTitle}>1. Introduction</Text>
      <Text style={styles.text}>
        Artywiz Football ("nous", "notre", "nos") s'engage à protéger la confidentialité 
        de vos informations personnelles. Cette politique de confidentialité explique 
        comment nous collectons, utilisons et protégeons vos données.
      </Text>

      <Text style={styles.sectionTitle}>2. Données collectées</Text>
      <Text style={styles.text}>
        Nous collectons les informations suivantes :{"\n"}
        • Informations de profil (nom, email){"\n"}
        • Données de connexion aux réseaux sociaux (Facebook, LinkedIn){"\n"}
        • Contenu que vous créez dans l'application{"\n"}
        • Données d'utilisation de l'application
      </Text>

      <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
      <Text style={styles.text}>
        Vos données sont utilisées pour :{"\n"}
        • Fournir et améliorer nos services{"\n"}
        • Publier du contenu sur vos réseaux sociaux (avec votre autorisation){"\n"}
        • Vous envoyer des notifications importantes{"\n"}
        • Personnaliser votre expérience
      </Text>

      <Text style={styles.sectionTitle}>4. Partage des données</Text>
      <Text style={styles.text}>
        Nous ne vendons pas vos données personnelles. Nous partageons vos données 
        uniquement avec les plateformes de réseaux sociaux que vous avez connectées 
        (Facebook, Instagram, LinkedIn) pour publier du contenu en votre nom.
      </Text>

      <Text style={styles.sectionTitle}>5. Sécurité</Text>
      <Text style={styles.text}>
        Nous mettons en œuvre des mesures de sécurité appropriées pour protéger 
        vos informations personnelles contre l'accès non autorisé, la modification, 
        la divulgation ou la destruction.
      </Text>

      <Text style={styles.sectionTitle}>6. Vos droits</Text>
      <Text style={styles.text}>
        Conformément au RGPD, vous avez le droit de :{"\n"}
        • Accéder à vos données{"\n"}
        • Rectifier vos données{"\n"}
        • Supprimer vos données{"\n"}
        • Exporter vos données{"\n"}
        • Retirer votre consentement
      </Text>

      <Text style={styles.sectionTitle}>7. Contact</Text>
      <Text style={styles.text}>
        Pour toute question concernant cette politique de confidentialité, 
        contactez-nous à : contact@artywiz.com
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  text: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});
