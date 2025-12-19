import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSponsorStore } from '../../stores/sponsorStore';
import { SponsorMockService } from '../../services/sponsorMockService';
import { Campaign } from '../../types/sponsor';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    campaigns, 
    pauseCampaign, 
    resumeCampaign, 
    endCampaign,
    getCampaignRequests 
  } = useSponsorStore();

  const [showActionsModal, setShowActionsModal] = useState(false);

  // Get campaign from store first, fallback to mock service
  const campaign = useMemo(() => {
    const storeCampaign = campaigns.find(c => c.id === id);
    if (storeCampaign) return storeCampaign;
    return SponsorMockService.getCampaignById(id || '');
  }, [id, campaigns]);

  // Get requests for this campaign
  const campaignRequests = useMemo(() => {
    const storeRequests = getCampaignRequests(id || '');
    if (storeRequests.length > 0) return storeRequests;
    return SponsorMockService.getRequestsByCampaign(id || '');
  }, [id]);

  // Calculate budget for this campaign
  const campaignBudget = useMemo(() => {
    let engagé = 0;
    let consommé = 0;
    campaignRequests.forEach(req => {
      engagé += req.budgetState.reservedAmount;
      consommé += req.budgetState.consumedAmount;
    });
    return { engagé, consommé };
  }, [campaignRequests]);

  if (!campaign) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Campagne non trouvée</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'paused': return Colors.warning;
      case 'ended': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'En pause';
      case 'ended': return 'Terminée';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  const getPeriodeLabel = () => {
    if (campaign.periode.type === 'weekend') return 'Week-end';
    if (campaign.periode.type === 'semaine') return 'Semaine';
    if (campaign.periode.dateDebut && campaign.periode.dateFin) {
      const debut = new Date(campaign.periode.dateDebut).toLocaleDateString('fr-FR');
      const fin = new Date(campaign.periode.dateFin).toLocaleDateString('fr-FR');
      return `${debut} → ${fin}`;
    }
    return 'Personnalisé';
  };

  const handlePauseResume = () => {
    setShowActionsModal(false);
    if (campaign.status === 'active') {
      pauseCampaign(campaign.id);
      Alert.alert('Campagne mise en pause', 'Vous pouvez la reprendre à tout moment.');
    } else if (campaign.status === 'paused') {
      resumeCampaign(campaign.id);
      Alert.alert('Campagne reprise', 'Votre campagne est de nouveau active.');
    }
  };

  const handleEndCampaign = () => {
    Alert.alert(
      'Terminer la campagne',
      'Êtes-vous sûr de vouloir terminer cette campagne ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: () => {
            setShowActionsModal(false);
            endCampaign(campaign.id);
            Alert.alert('Campagne terminée', 'Votre campagne a été clôturée.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{campaign.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) + '30' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(campaign.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>
                {getStatusLabel(campaign.status)}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowActionsModal(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="location" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Zone</Text>
              <Text style={styles.infoValue}>
                {campaign.zone.codePostal} • {campaign.zone.rayonKm} km
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Période</Text>
              <Text style={styles.infoValue}>{getPeriodeLabel()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="pricetags" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thématiques</Text>
              <View style={styles.themesContainer}>
                {campaign.thematiques.map((theme, index) => (
                  <View key={index} style={styles.themeChip}>
                    <Text style={styles.themeText}>{theme}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statistiques</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{campaign.stats.ciblés}</Text>
              <Text style={styles.statLabel}>Ciblés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {campaign.stats.validés}
              </Text>
              <Text style={styles.statLabel}>Validés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                {campaign.stats.refusés}
              </Text>
              <Text style={styles.statLabel}>Refusés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.warning }]}>
                {campaign.stats.enAttente}
              </Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
          </View>
        </View>

        {/* Budget Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget campagne</Text>
          
          <View style={styles.budgetRow}>
            <View style={styles.budgetItem}>
              <View style={[styles.budgetIcon, { backgroundColor: Colors.warning + '15' }]}>
                <Ionicons name="time" size={20} color={Colors.warning} />
              </View>
              <Text style={styles.budgetValue}>{campaignBudget.engagé}€</Text>
              <Text style={styles.budgetLabel}>Engagé</Text>
            </View>
            <View style={styles.budgetItem}>
              <View style={[styles.budgetIcon, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              <Text style={styles.budgetValue}>{campaignBudget.consommé}€</Text>
              <Text style={styles.budgetLabel}>Consommé</Text>
            </View>
          </View>

          {campaign.budgetCap && (
            <View style={styles.budgetCapInfo}>
              <Ionicons name="information-circle" size={18} color={Colors.primary} />
              <Text style={styles.budgetCapText}>
                Plafond : {campaign.budgetCap}€
                {campaign.stopWhenCapReached && ' • Arrêt auto'}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity 
          style={styles.mainAction}
          onPress={() => router.push(`/campaign-requests/${campaign.id}`)}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainActionGradient}
          >
            <Ionicons name="list" size={20} color={Colors.white} />
            <Text style={styles.mainActionText}>Voir les demandes</Text>
            <View style={styles.mainActionBadge}>
              <Text style={styles.mainActionBadgeText}>{campaign.stats.enAttente}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Info */}
        <View style={styles.secondaryInfo}>
          <Text style={styles.secondaryText}>
            Créée le {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
          </Text>
          <Text style={styles.secondaryText}>
            Dernière mise à jour : {new Date(campaign.updatedAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </ScrollView>

      {/* Actions Modal */}
      <Modal
        visible={showActionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsModal(false)}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Actions</Text>

            {campaign.status !== 'ended' && (
              <>
                <TouchableOpacity style={styles.modalAction} onPress={handlePauseResume}>
                  <View style={[styles.modalActionIcon, { backgroundColor: Colors.warning + '15' }]}>
                    <Ionicons 
                      name={campaign.status === 'active' ? 'pause' : 'play'} 
                      size={20} 
                      color={Colors.warning} 
                    />
                  </View>
                  <View style={styles.modalActionContent}>
                    <Text style={styles.modalActionTitle}>
                      {campaign.status === 'active' ? 'Mettre en pause' : 'Reprendre la campagne'}
                    </Text>
                    <Text style={styles.modalActionDesc}>
                      {campaign.status === 'active' 
                        ? 'Suspendre temporairement les nouvelles demandes'
                        : 'Réactiver la campagne'
                      }
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalAction} onPress={handleEndCampaign}>
                  <View style={[styles.modalActionIcon, { backgroundColor: Colors.error + '15' }]}>
                    <Ionicons name="stop-circle" size={20} color={Colors.error} />
                  </View>
                  <View style={styles.modalActionContent}>
                    <Text style={[styles.modalActionTitle, { color: Colors.error }]}>
                      Terminer la campagne
                    </Text>
                    <Text style={styles.modalActionDesc}>
                      Clôturer définitivement cette campagne
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => setShowActionsModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  backLink: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  backLinkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Header
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Content
  scrollContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  themeChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Budget
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  budgetLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  budgetCapInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  budgetCapText: {
    fontSize: 13,
    color: Colors.primary,
  },
  // Main Action
  mainAction: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  mainActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  mainActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  mainActionBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: Spacing.xs,
  },
  mainActionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  // Secondary info
  secondaryInfo: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  secondaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  modalActionContent: {
    flex: 1,
  },
  modalActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalActionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
