import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HelpContent {
  title: string;
  description: string;
  howItWorks: string[];
  tip?: string;
}

interface ContextualHelpSheetProps {
  visible: boolean;
  onClose: () => void;
  screenName: string;
  profileType?: 'community' | 'sponsor' | 'admin';
}

const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: 'Tableau de bord',
    description: 'Visualisez et gérez tous vos documents de communication.',
    howItWorks: [
      'Basculez entre "À générer" et "Générés"',
      'Utilisez la recherche pour trouver un document',
      'Cliquez sur un document pour le télécharger ou partager',
    ],
    tip: 'Activez les notifications pour être alerté quand vos documents sont prêts !',
  },
  document: {
    title: 'Détail du document',
    description: 'Consultez et partagez votre document de communication.',
    howItWorks: [
      'Téléchargez en HD pour la meilleure qualité',
      'Partagez directement sur vos réseaux sociaux',
      'Swipez pour naviguer entre les documents',
    ],
    tip: 'Les documents sponsorisés génèrent des revenus pour votre club.',
  },
  account: {
    title: 'Mon compte',
    description: 'Gérez votre profil et vos paramètres personnels.',
    howItWorks: [
      'Modifiez vos informations personnelles',
      'Gérez vos différents profils (Club, Équipe...)',
      'Consultez et gérez votre abonnement',
    ],
    tip: 'Ajoutez plusieurs profils pour gérer différentes équipes facilement.',
  },
  alerts: {
    title: 'Alertes',
    description: 'Restez informé des nouveaux documents disponibles.',
    howItWorks: [
      'Les alertes non lues apparaissent en surbrillance',
      'Cliquez sur une alerte pour voir le document',
      'Activez les notifications push dans les paramètres',
    ],
    tip: 'Vérifiez régulièrement vos alertes pour ne manquer aucun document !',
  },
};

export const ContextualHelpSheet: React.FC<ContextualHelpSheetProps> = ({
  visible,
  onClose,
  screenName,
  profileType = 'community',
}) => {
  const insets = useSafeAreaInsets();
  const content = helpContent[screenName] || helpContent.dashboard;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="help-circle" size={32} color={Colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{content.title}</Text>
                <Text style={styles.description}>{content.description}</Text>
              </View>
            </View>

            {/* How it works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
              {content.howItWorks.map((item, index) => (
                <View key={index} style={styles.bulletItem}>
                  <View style={styles.bulletDot}>
                    <Text style={styles.bulletNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Tip */}
            {content.tip && (
              <View style={styles.tipCard}>
                <Ionicons name="bulb" size={20} color={Colors.warning} />
                <Text style={styles.tipText}>{content.tip}</Text>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity style={styles.gotItButton} onPress={onClose}>
              <Text style={styles.gotItText}>J'ai compris</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bulletDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  bulletNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    paddingTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '15',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  gotItButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  gotItText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
