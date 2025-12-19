import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  clubName: string;
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
    clubName: 'FC Artywiz Strasbourg',
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
    clubName: 'FC Artywiz U18',
  },
  {
    id: '3',
    name: 'Brouillon campagne',
    status: 'draft',
    budget: 200,
    spent: 0,
    impressions: 0,
    clicks: 0,
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    clubName: 'FC Artywiz Senior',
  },
  {
    id: '4',
    name: 'Tournoi Automne',
    status: 'completed',
    budget: 300,
    spent: 300,
    impressions: 12800,
    clicks: 756,
    startDate: '2025-09-01',
    endDate: '2025-11-30',
    clubName: 'FC Artywiz Strasbourg',
  },
];

type FilterType = 'all' | 'active' | 'pending' | 'completed' | 'draft';

export default function CampaignsScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'active', label: 'Actives' },
    { key: 'draft', label: 'Brouillons' },
    { key: 'completed', label: 'Terminées' },
  ];

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.clubName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || campaign.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'pending': return Colors.warning;
      case 'completed': return Colors.textSecondary;
      case 'draft': return Colors.primary;
    }
  };

  const getStatusLabel = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminée';
      case 'draft': return 'Brouillon';
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
        <Text style={styles.headerTitle}>Mes campagnes</Text>
        
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une campagne..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* New Campaign Button */}
        <TouchableOpacity style={styles.newCampaignButton}>
          <LinearGradient
            colors={[Colors.success, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.newCampaignGradient}
          >
            <Ionicons name="add-circle" size={24} color={Colors.white} />
            <Text style={styles.newCampaignText}>Créer une nouvelle campagne</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Campaign List */}
        {filteredCampaigns.map((campaign) => (
          <TouchableOpacity key={campaign.id} style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <Text style={styles.clubName}>{campaign.clubName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(campaign.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>
                  {getStatusLabel(campaign.status)}
                </Text>
              </View>
            </View>

            {campaign.status !== 'draft' && (
              <>
                <View style={styles.campaignStats}>
                  <View style={styles.campaignStat}>
                    <Ionicons name="eye-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.campaignStatValue}>{campaign.impressions.toLocaleString()}</Text>
                  </View>
                  <View style={styles.campaignStat}>
                    <Ionicons name="hand-left-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.campaignStatValue}>{campaign.clicks}</Text>
                  </View>
                  <View style={styles.campaignStat}>
                    <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.campaignStatValue}>{campaign.spent}€/{campaign.budget}€</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(campaign.spent / campaign.budget) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round((campaign.spent / campaign.budget) * 100)}% utilisé
                  </Text>
                </View>
              </>
            )}

            <View style={styles.campaignFooter}>
              <Text style={styles.dateRange}>
                <Ionicons name="calendar-outline" size={12} color={Colors.textLight} />
                {' '}{campaign.startDate} → {campaign.endDate}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}

        {filteredCampaigns.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucune campagne</Text>
            <Text style={styles.emptyText}>Créez votre première campagne pour commencer</Text>
          </View>
        )}
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
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.white,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  filterTextActive: {
    color: '#D97706',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  newCampaignButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  newCampaignGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  newCampaignText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  clubName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
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
    borderColor: Colors.border,
  },
  campaignStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  campaignStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  dateRange: {
    fontSize: 12,
    color: Colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
