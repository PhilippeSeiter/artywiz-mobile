import React, { useState, useMemo } from 'react';
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
import { useRouter } from 'expo-router';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Campagne Hiver 2025',
    status: 'active',
    budget: 500,
    spent: 320,
    impressions: 15420,
    clicks: 892,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
  },
  {
    id: '2',
    name: 'Match U18 - Décembre',
    status: 'active',
    budget: 150,
    spent: 98,
    impressions: 5230,
    clicks: 312,
    startDate: '2025-12-01',
    endDate: '2025-12-31',
  },
  {
    id: '3',
    name: 'Tournoi Automne',
    status: 'completed',
    budget: 300,
    spent: 300,
    impressions: 12800,
    clicks: 756,
    startDate: '2025-09-01',
    endDate: '2025-11-30',
  },
];

const { width } = Dimensions.get('window');

export default function SponsorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const stats = useMemo(() => {
    const activeCampaigns = mockCampaigns.filter(c => c.status === 'active');
    return {
      totalBudget: mockCampaigns.reduce((sum, c) => sum + c.budget, 0),
      totalSpent: mockCampaigns.reduce((sum, c) => sum + c.spent, 0),
      totalImpressions: mockCampaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalClicks: mockCampaigns.reduce((sum, c) => sum + c.clicks, 0),
      activeCampaigns: activeCampaigns.length,
    };
  }, []);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'pending': return Colors.warning;
      case 'completed': return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminée';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <Ionicons name="business" size={28} color={Colors.white} />
          <Text style={styles.headerTitle}>Espace Sponsor</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodTab,
                selectedPeriod === period && styles.periodTabActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextActive,
              ]}>
                {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="eye-outline" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.totalImpressions.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Impressions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="hand-left-outline" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{stats.totalClicks.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Clics</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={Colors.warning} />
            <Text style={styles.statValue}>{stats.totalSpent}€</Text>
            <Text style={styles.statLabel}>Dépensé</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={24} color={Colors.error} />
            <Text style={styles.statValue}>
              {((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>CTR</Text>
          </View>
        </View>

        {/* Budget Overview */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>Budget Global</Text>
            <Text style={styles.budgetAmount}>{stats.totalBudget}€</Text>
          </View>
          <View style={styles.budgetProgress}>
            <View 
              style={[
                styles.budgetProgressBar, 
                { width: `${(stats.totalSpent / stats.totalBudget) * 100}%` }
              ]} 
            />
          </View>
          <View style={styles.budgetFooter}>
            <Text style={styles.budgetSpent}>{stats.totalSpent}€ utilisés</Text>
            <Text style={styles.budgetRemaining}>{stats.totalBudget - stats.totalSpent}€ restants</Text>
          </View>
        </View>

        {/* Campaigns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes campagnes ({stats.activeCampaigns} actives)</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {mockCampaigns.map((campaign) => (
            <TouchableOpacity key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(campaign.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>
                    {getStatusLabel(campaign.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.campaignStats}>
                <View style={styles.campaignStat}>
                  <Text style={styles.campaignStatValue}>{campaign.impressions.toLocaleString()}</Text>
                  <Text style={styles.campaignStatLabel}>Impressions</Text>
                </View>
                <View style={styles.campaignStat}>
                  <Text style={styles.campaignStatValue}>{campaign.clicks}</Text>
                  <Text style={styles.campaignStatLabel}>Clics</Text>
                </View>
                <View style={styles.campaignStat}>
                  <Text style={styles.campaignStatValue}>{campaign.spent}€</Text>
                  <Text style={styles.campaignStatLabel}>Dépensé</Text>
                </View>
              </View>

              <View style={styles.campaignProgress}>
                <View 
                  style={[
                    styles.campaignProgressBar, 
                    { width: `${(campaign.spent / campaign.budget) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.campaignBudget}>
                {campaign.spent}€ / {campaign.budget}€
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="add-circle" size={24} color={Colors.success} />
              </View>
              <Text style={styles.actionText}>Nouvelle campagne</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="stats-chart" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Rapports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
                <Ionicons name="wallet" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.actionText}>Recharger</Text>
            </TouchableOpacity>
          </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  settingsButton: {
    padding: Spacing.xs,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: Colors.white,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  periodTextActive: {
    color: '#D97706',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: (width - Spacing.md * 3) / 2 - Spacing.sm / 2,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  budgetCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.warning,
  },
  budgetProgress: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgressBar: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  budgetSpent: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  budgetRemaining: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
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
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  campaignCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
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
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  campaignStat: {
    alignItems: 'center',
  },
  campaignStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  campaignStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  campaignProgress: {
    height: 4,
    backgroundColor: Colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  campaignProgressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  campaignBudget: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
