import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSponsorStore } from '../../stores/sponsorStore';
import { SponsorMockService } from '../../services/sponsorMockService';
import { RequestStatus } from '../../types/sponsor';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    requests, 
    campaigns,
    budget,
    acceptCounterOffer, 
    refuseCounterOffer, 
    makeNewOffer,
    cancelRequest 
  } = useSponsorStore();

  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [newOfferAmount, setNewOfferAmount] = useState('');
  const [newOfferMessage, setNewOfferMessage] = useState('');

  // Get request from store first, fallback to mock service
  const request = useMemo(() => {
    const storeRequest = requests.find(r => r.id === id);
    if (storeRequest) return storeRequest;
    return SponsorMockService.getRequestById(id || '');
  }, [id, requests]);

  // Get campaign
  const campaign = useMemo(() => {
    if (!request) return null;
    const storeCampaign = campaigns.find(c => c.id === request.campaignId);
    if (storeCampaign) return storeCampaign;
    return SponsorMockService.getCampaignById(request.campaignId);
  }, [request, campaigns]);

  if (!request) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Demande non trouvée</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusLabel = (status: RequestStatus): string => {
    return SponsorMockService.getStatusLabel(status);
  };

  const getStatusColor = (status: RequestStatus): string => {
    return SponsorMockService.getStatusColor(status);
  };

  const handleAcceptCounterOffer = () => {
    if (!request.counterOfferClub) return;
    
    const difference = request.counterOfferClub.amount - request.budgetState.reservedAmount;
    if (difference > budget.disponible) {
      Alert.alert(
        'Budget insuffisant',
        `Il vous manque ${difference - budget.disponible}€ pour accepter cette contre-offre.`
      );
      return;
    }

    Alert.alert(
      'Accepter la contre-offre',
      `Accepter l'offre de ${request.counterOfferClub.amount}€ ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () => {
            acceptCounterOffer(request.id);
            Alert.alert('Accord validé ! ✅', 'Le montant a été consommé de votre budget.');
          },
        },
      ]
    );
  };

  const handleRefuseCounterOffer = () => {
    Alert.alert(
      'Refuser la contre-offre',
      'Voulez-vous refuser cette contre-offre ? Le budget engagé sera libéré.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            refuseCounterOffer(request.id);
            Alert.alert('Contre-offre refusée', 'Le budget engagé a été libéré.');
          },
        },
      ]
    );
  };

  const handleSendNewOffer = () => {
    const amount = parseFloat(newOfferAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }

    const difference = amount - request.budgetState.reservedAmount;
    if (difference > budget.disponible) {
      Alert.alert(
        'Budget insuffisant',
        `Il vous manque ${difference - budget.disponible}€ pour envoyer cette offre.`
      );
      return;
    }

    makeNewOffer(request.id, amount, newOfferMessage || undefined);
    setShowNewOfferModal(false);
    setNewOfferAmount('');
    setNewOfferMessage('');
    Alert.alert('Nouvelle offre envoyée', 'Le club va recevoir votre proposition.');
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Annuler la demande',
      'Voulez-vous annuler cette demande ? Le budget engagé sera libéré.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            cancelRequest(request.id);
            Alert.alert('Demande annulée', 'Le budget engagé a été libéré.');
            router.back();
          },
        },
      ]
    );
  };

  // Build timeline
  const timeline = useMemo(() => {
    const items = [];
    
    // Initial offer
    items.push({
      type: 'offer_sponsor',
      date: request.offerSponsor.createdAt,
      amount: request.offerSponsor.amount,
      message: request.offerSponsor.message,
    });
    
    // Counter offer if exists
    if (request.counterOfferClub) {
      items.push({
        type: 'counter_offer_club',
        date: request.counterOfferClub.createdAt,
        amount: request.counterOfferClub.amount,
        message: request.counterOfferClub.message,
      });
    }
    
    // Final decision
    if (request.status === 'ACCEPTED') {
      items.push({
        type: 'accepted',
        date: request.updatedAt,
        amount: request.finalPrice,
      });
    } else if (request.status === 'REFUSED_BY_CLUB' || request.status === 'REFUSED_BY_SPONSOR') {
      items.push({
        type: 'refused',
        date: request.updatedAt,
      });
    } else if (request.status === 'CANCELLED') {
      items.push({
        type: 'cancelled',
        date: request.updatedAt,
      });
    }
    
    return items;
  }, [request]);

  const statusColor = getStatusColor(request.status);

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
          <Text style={styles.headerTitle}>Détail demande</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}>
        {/* Club & Campaign Info */}
        <View style={styles.card}>
          <View style={styles.clubRow}>
            {request.clubLogo ? (
              <Image source={{ uri: request.clubLogo }} style={styles.clubLogo} />
            ) : (
              <View style={styles.clubLogoPlaceholder}>
                <Ionicons name="shield" size={24} color={Colors.primary} />
              </View>
            )}
            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{request.clubName}</Text>
              {campaign && (
                <Text style={styles.campaignName}>Campagne : {campaign.name}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(request.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Document</Text>
          <View style={styles.docInfo}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Type</Text>
              <Text style={styles.docValue}>{request.docType}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Supports</Text>
              <View style={styles.supportsRow}>
                {request.supports.map((support, index) => (
                  <View key={index} style={styles.supportChip}>
                    <Text style={styles.supportText}>{support}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Negotiation Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historique de négociation</Text>
          
          <View style={styles.timeline}>
            {timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <View style={[
                    styles.timelineDot,
                    item.type === 'accepted' && styles.timelineDotSuccess,
                    (item.type === 'refused' || item.type === 'cancelled') && styles.timelineDotError,
                    item.type === 'counter_offer_club' && styles.timelineDotWarning,
                  ]} />
                  {index < timeline.length - 1 && <View style={styles.timelineConnector} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    {item.type === 'offer_sponsor' && 'Votre offre'}
                    {item.type === 'counter_offer_club' && 'Contre-offre du club'}
                    {item.type === 'accepted' && 'Accord validé ✅'}
                    {item.type === 'refused' && 'Refusé'}
                    {item.type === 'cancelled' && 'Annulé'}
                  </Text>
                  {item.amount && (
                    <Text style={[
                      styles.timelineAmount,
                      item.type === 'accepted' && { color: Colors.success }
                    ]}>
                      {item.amount}€
                    </Text>
                  )}
                  {item.message && (
                    <Text style={styles.timelineMessage}>"{item.message}"</Text>
                  )}
                  <Text style={styles.timelineDate}>
                    {new Date(item.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Budget State */}
        {(request.budgetState.reservedAmount > 0 || request.budgetState.consumedAmount > 0) && (
          <View style={styles.budgetCard}>
            {request.budgetState.reservedAmount > 0 && (
              <View style={styles.budgetItem}>
                <Ionicons name="time" size={20} color={Colors.warning} />
                <Text style={styles.budgetLabel}>Engagé</Text>
                <Text style={[styles.budgetValue, { color: Colors.warning }]}>
                  {request.budgetState.reservedAmount}€
                </Text>
              </View>
            )}
            {request.budgetState.consumedAmount > 0 && (
              <View style={styles.budgetItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.budgetLabel}>Consommé</Text>
                <Text style={[styles.budgetValue, { color: Colors.success }]}>
                  {request.budgetState.consumedAmount}€
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Result Message for completed requests */}
        {request.status === 'ACCEPTED' && (
          <View style={[styles.resultBanner, { backgroundColor: Colors.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={[styles.resultText, { color: Colors.success }]}>
              Accord validé — Consommé : {request.finalPrice}€
            </Text>
          </View>
        )}

        {(request.status === 'REFUSED_BY_CLUB' || request.status === 'REFUSED_BY_SPONSOR' || request.status === 'CANCELLED') && (
          <View style={[styles.resultBanner, { backgroundColor: Colors.textSecondary + '15' }]}>
            <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
            <Text style={[styles.resultText, { color: Colors.textSecondary }]}>
              Demande close — Budget engagé libéré
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {request.status === 'PENDING_CLUB' && (
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={handleCancelRequest}
          >
            <Text style={styles.actionBtnSecondaryText}>Annuler la demande</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'COUNTERED' && (
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.counterOfferBox}>
            <Text style={styles.counterOfferLabel}>Contre-offre reçue</Text>
            <Text style={styles.counterOfferAmount}>{request.counterOfferClub?.amount}€</Text>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={handleRefuseCounterOffer}
            >
              <Text style={styles.actionBtnDangerText}>Refuser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={() => setShowNewOfferModal(true)}
            >
              <Text style={styles.actionBtnOutlineText}>Nouvelle offre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnSuccess]}
              onPress={handleAcceptCounterOffer}
            >
              <Text style={styles.actionBtnSuccessText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* New Offer Modal */}
      <Modal
        visible={showNewOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewOfferModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNewOfferModal(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Faire une nouvelle offre</Text>
            
            <View style={styles.modalBudgetInfo}>
              <Text style={styles.modalBudgetLabel}>Votre budget disponible</Text>
              <Text style={styles.modalBudgetValue}>{budget.disponible}€</Text>
            </View>

            <Text style={styles.inputLabel}>Montant proposé</Text>
            <View style={styles.amountInputRow}>
              <TextInput
                style={styles.amountInput}
                value={newOfferAmount}
                onChangeText={setNewOfferAmount}
                placeholder="Ex: 65"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
              <Text style={styles.amountCurrency}>€</Text>
            </View>

            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Message (optionnel)</Text>
            <TextInput
              style={styles.messageInput}
              value={newOfferMessage}
              onChangeText={setNewOfferMessage}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.sendOfferBtn}
              onPress={handleSendNewOffer}
            >
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendOfferGradient}
              >
                <Ionicons name="send" size={18} color={Colors.white} />
                <Text style={styles.sendOfferText}>Envoyer l'offre</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
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
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Club info
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  clubLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  campaignName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Doc info
  docInfo: {
    gap: Spacing.sm,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  docValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  supportsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  supportChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  supportText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  // Timeline
  timeline: {
    paddingLeft: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  timelineDotSuccess: {
    backgroundColor: Colors.success,
  },
  timelineDotError: {
    backgroundColor: Colors.error,
  },
  timelineDotWarning: {
    backgroundColor: Colors.warning,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timelineAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  timelineMessage: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  // Budget
  budgetCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    justifyContent: 'space-around',
  },
  budgetItem: {
    alignItems: 'center',
    gap: 4,
  },
  budgetLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Result banner
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  // Bottom actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  counterOfferBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  counterOfferLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.warning,
  },
  counterOfferAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.warning,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: Colors.border,
  },
  actionBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionBtnDanger: {
    backgroundColor: Colors.error + '15',
  },
  actionBtnDangerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  actionBtnOutline: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  actionBtnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionBtnSuccess: {
    backgroundColor: Colors.success,
  },
  actionBtnSuccessText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  modalBudgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  modalBudgetLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalBudgetValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountCurrency: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  messageInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendOfferBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  sendOfferGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sendOfferText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
