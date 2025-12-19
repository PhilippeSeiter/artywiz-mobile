import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientHeader } from '../../components';
import { ContextualHelpSheet } from '../../components/ContextualHelpSheet';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showContextualHelp, setShowContextualHelp] = useState(true);

  // Automatically show contextual help when this tab is opened
  useEffect(() => {
    setShowContextualHelp(true);
  }, []);

  const helpSections = [
    {
      title: 'Démarrage',
      items: [
        { icon: 'play-circle-outline', label: 'Guide de démarrage', action: () => {} },
        { icon: 'videocam-outline', label: 'Tutoriels vidéo', action: () => {} },
      ],
    },
    {
      title: 'Utilisation',
      items: [
        { icon: 'document-text-outline', label: 'Créer des documents', action: () => {} },
        { icon: 'share-social-outline', label: 'Partager sur les réseaux', action: () => {} },
        { icon: 'cash-outline', label: 'Gérer le sponsoring', action: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'chatbubble-ellipses-outline', label: 'Contacter le support', action: () => Linking.openURL('mailto:support@artywiz.com') },
        { icon: 'help-circle-outline', label: 'FAQ', action: () => {} },
        { icon: 'bug-outline', label: 'Signaler un problème', action: () => {} },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <GradientHeader title="Aide" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={32} color={Colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Besoin d'aide ?</Text>
            <Text style={styles.infoText}>
              L'aide s'adapte automatiquement à l'écran sur lequel vous vous trouvez.
            </Text>
          </View>
        </View>

        {/* Help Sections */}
        {helpSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.helpItem}
                onPress={item.action}
              >
                <View style={styles.helpItemIcon}>
                  <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.helpItemText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Go to Dashboard Link */}
        <TouchableOpacity
          style={styles.dashboardLink}
          onPress={() => router.push('/(tabs)')}
        >
          <Ionicons name="home-outline" size={20} color={Colors.primary} />
          <Text style={styles.dashboardLinkText}>Retour à l'accueil</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Artywiz v1.1.0</Text>
      </ScrollView>

      {/* Contextual Help Bottom Sheet */}
      <ContextualHelpSheet
        visible={showContextualHelp}
        onClose={() => setShowContextualHelp(false)}
        screenName="dashboard"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.md,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  helpItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  helpItemText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  dashboardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    gap: Spacing.sm,
  },
  dashboardLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textLight,
    marginTop: Spacing.lg,
  },
});
