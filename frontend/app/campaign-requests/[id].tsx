import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSponsorStore } from '../../stores/sponsorStore';
import { SponsorMockService } from '../../services/sponsorMockService';
import { Request, RequestStatus } from '../../types/sponsor';

type FilterTab = 'all' | 'pending' | 'validated' | 'refused';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'validated', label: 'Validées' },
  { key: 'refused', label: 'Refusées' },
];

export default function CampaignRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCampaignRequests, campaigns } = useSponsorStore();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Get campaign
  const campaign = useMemo(() => {
    const storeCampaign = campaigns.find(c => c.id === id);
    if (storeCampaign) return storeCampaign;
    return SponsorMockService.getCampaignById(id || '');
  }, [id, campaigns]);

  // Get requests
  const allRequests = useMemo(() => {
    const storeRequests = getCampaignRequests(id || '');
    if (storeRequests.length > 0) return storeRequests;
    return SponsorMockService.getRequestsByCampaign(id || '');
  }, [id]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    switch (activeFilter) {
      case 'pending':
        return allRequests.filter(r => 
          r.status === 'PENDING_CLUB' || r.status === 'COUNTERED'
        );
      case 'validated':
        return allRequests.filter(r => r.status === 'ACCEPTED');
      case 'refused':
        return allRequests.filter(r => 
          r.status === 'REFUSED_BY_CLUB' || r.status === 'REFUSED_BY_SPONSOR' || 
          r.status === 'CANCELLED' || r.status === 'EXPIRED'
        );
      default:
        return allRequests;
    }
  }, [allRequests, activeFilter]);

  // Counts for tabs
  const counts = useMemo(() => ({
    all: allRequests.length,
    pending: allRequests.filter(r => r.status === 'PENDING_CLUB' || r.status === 'COUNTERED').length,
    validated: allRequests.filter(r => r.status === 'ACCEPTED').length,
    refused: allRequests.filter(r => 
      r.status === 'REFUSED_BY_CLUB' || r.status === 'REFUSED_BY_SPONSOR' || 
      r.status === 'CANCELLED' || r.status === 'EXPIRED'
    ).length,
  }), [allRequests]);

  const getStatusLabel = (status: RequestStatus): string => {
    return SponsorMockService.getStatusLabel(status);
  };

  const getStatusColor = (status: RequestStatus): string => {
    return SponsorMockService.getStatusColor(status);
  };

  const renderRequest = ({ item }: { item: Request }) => {
    const statusColor = getStatusColor(item.status);
    const lastOffer = item.counterOfferClub?.amount || item.offerSponsor.amount;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push(`/request/${item.id}`)}
      >
        <View style={styles.requestHeader}>
          {item.clubLogo ? (
            <Image source={{ uri: item.clubLogo }} style={styles.clubLogo} />
          ) : (
            <View style={styles.clubLogoPlaceholder}>
              <Ionicons name="shield" size={20} color={Colors.primary} />
            </View>
          )}
          <View style={styles.requestInfo}>
            <Text style={styles.clubName}>{item.clubName}</Text>
            <Text style={styles.docType}>{item.docType}</Text>
          </View>
          <View style={styles.requestRight}>
            <Text style={styles.offerAmount}>{lastOffer}€</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.supportsRow}>
            {item.supports.map((support, index) => (
              <View key={index} style={styles.supportChip}>
                <Text style={styles.supportText}>{support}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.dateText}>
            {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {item.status === 'COUNTERED' && (
          <View style={styles.counterOfferBanner}>
            <Ionicons name="swap-horizontal" size={16} color={Colors.warning} />
            <Text style={styles.counterOfferText}>
              Contre-offre reçue : {item.counterOfferClub?.amount}€
            </Text>
          </View>
        )}

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Demandes</Text>
            {campaign && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {campaign.name}
              </Text>
            )}
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
              {counts[tab.key] > 0 && (
                <View style={[styles.filterBadge, activeFilter === tab.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, activeFilter === tab.key && styles.filterBadgeTextActive]}>
                    {counts[tab.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* List */}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'pending' 
                ? 'Aucune demande en attente pour cette campagne'
                : activeFilter === 'validated'
                ? 'Aucun accord validé pour le moment'
                : activeFilter === 'refused'
                ? 'Aucune demande refusée'
                : 'Aucune demande pour cette campagne'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  headerSubtitle: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.8,
  },
  // Filter tabs
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: Colors.white,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.white,
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterBadgeActive: {
    backgroundColor: Colors.primary + '20',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  filterBadgeTextActive: {
    color: Colors.primary,
  },
  // List
  listContent: {
    padding: Spacing.md,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  clubLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  docType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requestRight: {
    alignItems: 'flex-end',
  },
  offerAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  supportsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  supportChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  supportText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  counterOfferBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  counterOfferText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
  },
  chevronContainer: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    marginTop: -10,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
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
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
});
