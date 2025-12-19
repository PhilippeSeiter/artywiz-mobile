import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSponsorStore } from '../../stores/sponsorStore';
import { SponsorMockService } from '../../services/sponsorMockService';
import { Campaign } from '../../types/sponsor';

export default function SponsorCampagnesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { campaigns } = useSponsorStore();

  // Combine store campaigns with mock campaigns
  const allCampaigns = useMemo(() => {
    const mockCampaigns = SponsorMockService.getAllCampaigns();
    // Add store campaigns that aren't already in mock
    const combined = [...mockCampaigns];
    campaigns.forEach(c => {
      if (!combined.find(m => m.id === c.id)) {
        combined.push(c);
      }
    });
    // Sort by date
    return combined.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [campaigns]);

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

  const renderCampaign = ({ item }: { item: Campaign }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        style={styles.campaignCard}
        onPress={() => router.push(`/campaign/${item.id}`)}
      >
        <View style={styles.campaignHeader}>
          {item.visual ? (
            <Image source={{ uri: item.visual }} style={styles.campaignVisual} />
          ) : (
            <View style={styles.campaignVisualPlaceholder}>
              <Ionicons name="megaphone" size={24} color={Colors.primary} />
            </View>
          )}
          <View style={styles.campaignInfo}>
            <Text style={styles.campaignName}>{item.name}</Text>
            <Text style={styles.campaignZone}>
              {item.zone.codePostal} • {item.zone.rayonKm}km
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.campaignStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.stats.ciblés}</Text>
            <Text style={styles.statLabel}>Ciblés</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{item.stats.validés}</Text>
            <Text style={styles.statLabel}>Validés</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{item.stats.enAttente}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        <View style={styles.campaignFooter}>
          <View style={styles.themesRow}>
            {item.thematiques.slice(0, 3).map((theme, index) => (
              <View key={index} style={styles.themeChip}>
                <Text style={styles.themeText}>{theme}</Text>
              </View>
            ))}
            {item.thematiques.length > 3 && (
              <Text style={styles.moreThemes}>+{item.thematiques.length - 3}</Text>
            )}
          </View>
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
        <Text style={styles.headerTitle}>Mes campagnes</Text>
      </LinearGradient>

      {/* Create Campaign Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/create-campaign')}
      >
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createButtonGradient}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.createButtonText}>Créer une campagne</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={allCampaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune campagne</Text>
            <Text style={styles.emptyText}>
              Créez votre première campagne pour commencer à sponsoriser des clubs
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  createButton: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
  },
  campaignCard: {
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
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  campaignVisual: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  campaignVisualPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  campaignZone: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    fontWeight: '500',
  },
  campaignStats: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    flex: 1,
  },
  themeChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  themeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  moreThemes: {
    fontSize: 11,
    color: Colors.textSecondary,
    alignSelf: 'center',
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
    paddingHorizontal: Spacing.lg,
  },
});
