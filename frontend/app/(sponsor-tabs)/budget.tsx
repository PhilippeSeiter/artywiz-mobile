import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSponsorStore } from '../../stores/sponsorStore';
import { BudgetTransaction } from '../../types/sponsor';

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { budget, budgetHistory, rechargerBudget } = useSponsorStore();
  
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');

  const presetAmounts = [50, 100, 200, 500];

  const getTransactionIcon = (type: BudgetTransaction['type']) => {
    switch (type) {
      case 'recharge': return 'add-circle';
      case 'consommation': return 'checkmark-circle';
      case 'liberation': return 'arrow-undo-circle';
      case 'reservation': return 'time';
      default: return 'ellipse';
    }
  };

  const getTransactionColor = (type: BudgetTransaction['type']) => {
    switch (type) {
      case 'recharge': return Colors.success;
      case 'consommation': return Colors.primary;
      case 'liberation': return Colors.success;
      case 'reservation': return Colors.warning;
      default: return Colors.textSecondary;
    }
  };

  const getTransactionLabel = (type: BudgetTransaction['type']) => {
    switch (type) {
      case 'recharge': return 'Recharge';
      case 'consommation': return 'Consommation';
      case 'liberation': return 'Libération';
      case 'reservation': return 'Réservation';
      default: return type;
    }
  };

  const handleRecharge = (amount: number) => {
    if (amount <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }
    rechargerBudget(amount);
    setShowRechargeModal(false);
    setRechargeAmount('');
    Alert.alert('Recharge effectuée ! 💰', `${amount} € ont été ajoutés à votre budget.`);
  };

  const handleCustomRecharge = () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }
    handleRecharge(amount);
  };

  const renderTransaction = ({ item }: { item: BudgetTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '15' }]}>
        <Ionicons 
          name={getTransactionIcon(item.type) as any} 
          size={20} 
          color={getTransactionColor(item.type)} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionType}>{getTransactionLabel(item.type)}</Text>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'consommation' || item.type === 'reservation' 
          ? Colors.error 
          : Colors.success 
        }
      ]}>
        {item.type === 'consommation' || item.type === 'reservation' ? '-' : '+'}
        {item.amount}€
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <Text style={styles.headerTitle}>Budget</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        {/* Budget Cards */}
        <View style={styles.budgetCards}>
          {/* Main Card - Disponible */}
          <View style={styles.mainBudgetCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainBudgetGradient}
            >
              <View style={styles.mainBudgetContent}>
                <View style={styles.mainBudgetIcon}>
                  <Ionicons name="wallet" size={28} color={Colors.white} />
                </View>
                <Text style={styles.mainBudgetLabel}>Disponible</Text>
                <View style={styles.mainBudgetValueRow}>
                  <Text style={styles.mainBudgetValue}>{budget.disponible}</Text>
                  <Text style={styles.mainBudgetCurrency}>€</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
          
          {/* Secondary Cards Row */}
          <View style={styles.budgetRow}>
            <View style={styles.budgetCard}>
              <View style={[styles.budgetCardIcon, { backgroundColor: Colors.warning + '15' }]}>
                <Ionicons name="time" size={22} color={Colors.warning} />
              </View>
              <Text style={styles.budgetCardLabel}>Engagé</Text>
              <Text style={[styles.budgetCardValue, { color: Colors.warning }]}>
                {budget.engagé}€
              </Text>
              <Text style={styles.budgetCardHint}>En attente de validation</Text>
            </View>
            
            <View style={styles.budgetCard}>
              <View style={[styles.budgetCardIcon, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              </View>
              <Text style={styles.budgetCardLabel}>Consommé</Text>
              <Text style={[styles.budgetCardValue, { color: Colors.success }]}>
                {budget.consommé}€
              </Text>
              <Text style={styles.budgetCardHint}>Accords validés</Text>
            </View>
          </View>
        </View>

        {/* CTA - Ajouter des fonds */}
        <TouchableOpacity
          style={styles.rechargeButton}
          onPress={() => setShowRechargeModal(true)}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rechargeGradient}
          >
            <Ionicons name="add-circle" size={22} color={Colors.white} />
            <Text style={styles.rechargeText}>Ajouter des fonds</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
          <Text style={styles.infoText}>
            Les euros sont consommés uniquement lorsqu'un accord est validé avec un club.
          </Text>
        </View>

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique des transactions</Text>
          {budgetHistory.length > 0 ? (
            <FlatList
              data={budgetHistory.slice().reverse()}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={56} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
              <Text style={styles.emptyText}>
                Vos recharges, consommations et libérations apparaîtront ici
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Recharge Modal */}
      <Modal
        visible={showRechargeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRechargeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ajouter des fonds</Text>

            {/* Preset Amounts */}
            <Text style={styles.modalLabel}>Montants rapides</Text>
            <View style={styles.presetGrid}>
              {presetAmounts.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.presetButton}
                  onPress={() => handleRecharge(amount)}
                >
                  <Text style={styles.presetText}>{amount}€</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount */}
            <Text style={[styles.modalLabel, { marginTop: Spacing.lg }]}>Montant personnalisé</Text>
            <View style={styles.customAmountRow}>
              <TextInput
                style={styles.customAmountInput}
                value={rechargeAmount}
                onChangeText={setRechargeAmount}
                placeholder="Ex: 150"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
              <Text style={styles.customAmountCurrency}>€</Text>
              <TouchableOpacity
                style={styles.customAmountButton}
                onPress={handleCustomRecharge}
              >
                <Text style={styles.customAmountButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel */}
            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setShowRechargeModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  // Budget Cards
  budgetCards: {
    marginBottom: Spacing.md,
  },
  mainBudgetCard: {
    marginBottom: Spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mainBudgetGradient: {
    padding: Spacing.lg,
  },
  mainBudgetContent: {
    alignItems: 'center',
  },
  mainBudgetIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mainBudgetLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xs,
  },
  mainBudgetValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mainBudgetValue: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 56,
  },
  mainBudgetCurrency: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: Spacing.xs,
    marginBottom: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  budgetCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  budgetCardLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  budgetCardValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  budgetCardHint: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
  },
  // Recharge
  rechargeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  rechargeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  rechargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  // Info
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderRadius: 8,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.success,
  },
  // History
  historySection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  transactionDate: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  presetText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  customAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customAmountInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customAmountCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  customAmountButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  customAmountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalCancel: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
