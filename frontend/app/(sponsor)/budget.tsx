import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Transaction {
  id: string;
  type: 'recharge' | 'spend';
  amount: number;
  description: string;
  date: string;
  campaignName?: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'spend', amount: -25, description: 'Campagne Hiver 2025', date: '2025-12-13', campaignName: 'Campagne Hiver 2025' },
  { id: '2', type: 'spend', amount: -15, description: 'Match U18', date: '2025-12-12', campaignName: 'Match U18 - Décembre' },
  { id: '3', type: 'recharge', amount: 200, description: 'Recharge carte', date: '2025-12-10' },
  { id: '4', type: 'spend', amount: -30, description: 'Campagne Hiver 2025', date: '2025-12-08', campaignName: 'Campagne Hiver 2025' },
  { id: '5', type: 'spend', amount: -20, description: 'Match U18', date: '2025-12-05', campaignName: 'Match U18 - Décembre' },
  { id: '6', type: 'recharge', amount: 500, description: 'Recharge initiale', date: '2025-12-01' },
];

const { width } = Dimensions.get('window');

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const [showHistory, setShowHistory] = useState(true);

  const totalBudget = 950;
  const totalSpent = 718;
  const available = totalBudget - totalSpent;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <Text style={styles.headerTitle}>Mon budget</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceMain}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>
            <Text style={styles.balanceAmount}>{available}€</Text>
          </View>
          
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-up-circle" size={20} color={Colors.success} />
              <View>
                <Text style={styles.balanceItemLabel}>Total rechargé</Text>
                <Text style={styles.balanceItemValue}>{totalBudget}€</Text>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-down-circle" size={20} color={Colors.error} />
              <View>
                <Text style={styles.balanceItemLabel}>Total dépensé</Text>
                <Text style={styles.balanceItemValue}>{totalSpent}€</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={[Colors.success, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="add-circle" size={24} color={Colors.white} />
              <Text style={styles.actionText}>Recharger</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButtonSecondary}>
            <Ionicons name="card-outline" size={24} color={Colors.primary} />
            <Text style={styles.actionTextSecondary}>Moyens de paiement</Text>
          </TouchableOpacity>
        </View>

        {/* Budget by Campaign */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition par campagne</Text>
          
          <View style={styles.campaignBudgetCard}>
            <View style={styles.campaignBudgetItem}>
              <View style={styles.campaignBudgetInfo}>
                <View style={[styles.campaignDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.campaignBudgetName}>Campagne Hiver 2025</Text>
              </View>
              <Text style={styles.campaignBudgetAmount}>320€ / 500€</Text>
            </View>
            <View style={styles.campaignProgressBar}>
              <View style={[styles.campaignProgressFill, { width: '64%', backgroundColor: Colors.primary }]} />
            </View>

            <View style={styles.campaignBudgetItem}>
              <View style={styles.campaignBudgetInfo}>
                <View style={[styles.campaignDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.campaignBudgetName}>Match U18 - Décembre</Text>
              </View>
              <Text style={styles.campaignBudgetAmount}>98€ / 150€</Text>
            </View>
            <View style={styles.campaignProgressBar}>
              <View style={[styles.campaignProgressFill, { width: '65%', backgroundColor: Colors.success }]} />
            </View>

            <View style={styles.campaignBudgetItem}>
              <View style={styles.campaignBudgetInfo}>
                <View style={[styles.campaignDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.campaignBudgetName}>Tournoi Automne</Text>
              </View>
              <Text style={styles.campaignBudgetAmount}>300€ / 300€</Text>
            </View>
            <View style={styles.campaignProgressBar}>
              <View style={[styles.campaignProgressFill, { width: '100%', backgroundColor: Colors.warning }]} />
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.sectionTitle}>Historique des transactions</Text>
            <Ionicons 
              name={showHistory ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.transactionList}>
              {mockTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === 'recharge' ? Colors.success + '20' : Colors.error + '20' }
                  ]}>
                    <Ionicons 
                      name={transaction.type === 'recharge' ? 'arrow-up' : 'arrow-down'} 
                      size={16} 
                      color={transaction.type === 'recharge' ? Colors.success : Colors.error} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'recharge' ? Colors.success : Colors.error }
                  ]}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}€
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  balanceCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceMain: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  balanceDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  campaignBudgetCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignBudgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  campaignBudgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  campaignDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  campaignBudgetName: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  campaignBudgetAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  campaignProgressBar: {
    height: 4,
    backgroundColor: Colors.background,
    borderRadius: 2,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  campaignProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  transactionList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
