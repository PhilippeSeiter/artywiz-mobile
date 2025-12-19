import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSponsorStore } from '../../stores/sponsorStore';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { SponsorMockService } from '../../services/sponsorMockService';
import { MockDataService } from '../../services/mockDataService';
import { RotatingStar } from '../../components';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7475; // +15% (65% * 1.15)
const AUTO_SCROLL_INTERVAL = 12; // Vitesse x2 (25ms / 2)
const INACTIVITY_DELAY = 3000;

export default function SponsorAccueilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { budget, setSponsorMode } = useSponsorStore();
  const { selectedProfiles, activeProfileIndex, setActiveProfile } = useUserPreferencesStore();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Auto-scroll refs for carousel
  const carouselRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const maxScrollX = useRef(0);
  
  // Get mock stats
  const stats = SponsorMockService.getDashboardStats();
  const pendingRequests = SponsorMockService.getPendingRequests();
  
  // Get sponsored documents for the carousel
  const sponsoredDocuments = MockDataService.getAllDocuments()
    .filter(doc => doc.isSponsored)
    .slice(0, 6);
  
  // Get active profile (sponsor)
  const activeProfile = selectedProfiles[activeProfileIndex];

  // Format today's date in French
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    const formatted = date.toLocaleDateString('fr-FR', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const todayDate = formatDate(new Date());

  // Auto-scroll functions
  const startAutoScroll = () => {
    if (autoScrollTimer.current) return;
    
    autoScrollTimer.current = setInterval(() => {
      if (carouselRef.current && !isUserScrolling) {
        scrollX.current += 1;
        
        if (scrollX.current >= maxScrollX.current) {
          scrollX.current = 0;
        }
        
        carouselRef.current.scrollTo({ x: scrollX.current, animated: false });
      }
    }, AUTO_SCROLL_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    inactivityTimer.current = setTimeout(() => {
      setIsUserScrolling(false);
      startAutoScroll();
    }, INACTIVITY_DELAY);
  };

  // Start auto-scroll when component mounts
  useEffect(() => {
    if (sponsoredDocuments.length > 0) {
      maxScrollX.current = (CARD_WIDTH + Spacing.md) * sponsoredDocuments.length - width + Spacing.md * 2;
      startAutoScroll();
    }
    
    return () => {
      stopAutoScroll();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [sponsoredDocuments.length]);

  const handleScrollBeginDrag = () => {
    setIsUserScrolling(true);
    stopAutoScroll();
  };

  const handleScrollEndDrag = () => {
    resetInactivityTimer();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.current = event.nativeEvent.contentOffset.x;
  };

  const handleSwitchProfile = (index: number) => {
    const profile = selectedProfiles[index];
    setActiveProfile(index);
    setShowProfileModal(false);
    
    // Si ce n'est PAS un profil sponsor, naviguer vers le dashboard Club
    if (profile && profile.type !== 'sponsor') {
      setSponsorMode(false);
      router.replace('/(tabs)');
    }
  };

  const getProfileIcon = (type: string) => {
    switch (type) {
      case 'ligue': return 'globe';
      case 'district': return 'map';
      case 'club': return 'shield';
      case 'equipe': return 'people';
      case 'sponsor': return 'briefcase';
      default: return 'person';
    }
  };

  const getProfileTypeLabel = (type: string) => {
    switch (type) {
      case 'ligue': return 'Ligue';
      case 'district': return 'District';
      case 'club': return 'Club';
      case 'equipe': return 'Équipe';
      case 'sponsor': return 'Sponsor';
      default: return type;
    }
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
        <TouchableOpacity
          style={styles.profileSwitch}
          onPress={() => setShowProfileModal(true)}
        >
          <View style={styles.headerBadge}>
            <Ionicons name="briefcase" size={16} color={Colors.white} />
          </View>
          <Text style={styles.profileName} numberOfLines={1}>
            {activeProfile?.name || 'Mon profil'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Date Section */}
        <View style={styles.dateSection}>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          <Text style={styles.dateText}>{todayDate}</Text>
        </View>

        {/* Documents Sponsorisés Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents sponsorisés</Text>
          <ScrollView 
            ref={carouselRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {sponsoredDocuments.map((doc) => {
              const sponsoringPrice = MockDataService.getSponsoringPrice(doc.id);
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.docCard}
                  onPress={() => {}}
                >
                  <Image
                    source={MockDataService.getDocMockup(doc.id)}
                    style={styles.docImage}
                    resizeMode="contain"
                  />
                  <View style={styles.sponsorBadge}>
                    <RotatingStar size={10} color={Colors.white} />
                    <Text style={styles.sponsorBadgeText}>{sponsoringPrice}€</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Budget Card */}
        <TouchableOpacity 
          style={styles.budgetCard}
          onPress={() => router.push('/(sponsor-tabs)/budget')}
        >
          <View style={styles.budgetHeader}>
            <Ionicons name="wallet" size={24} color={Colors.primary} />
            <Text style={styles.budgetTitle}>Budget disponible</Text>
          </View>
          <Text style={styles.budgetAmount}>{budget.disponible}</Text>
          <Text style={styles.budgetCurrency}>€</Text>
          <View style={styles.budgetDetails}>
            <View style={styles.budgetDetail}>
              <Text style={styles.budgetDetailLabel}>Engagé</Text>
              <Text style={styles.budgetDetailValue}>{budget.engagé} €</Text>
            </View>
            <View style={styles.budgetDetail}>
              <Text style={styles.budgetDetailLabel}>Consommé</Text>
              <Text style={styles.budgetDetailValue}>{budget.consommé} €</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/(sponsor-tabs)/campagnes')}
          >
            <Ionicons name="megaphone" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.campaignesEnCours}</Text>
            <Text style={styles.statLabel}>Campagnes actives</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, pendingRequests.length > 0 && styles.statCardHighlight]}
            onPress={() => router.push('/(sponsor-tabs)/campagnes')}
          >
            <View style={styles.statIconContainer}>
              <RotatingStar size={28} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.demandesEnAttente}</Text>
            <Text style={styles.statLabel}>Demandes en attente</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Section */}
        <View style={styles.kpiSection}>
          <Text style={styles.sectionTitle}>Performance (7 jours)</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              <Text style={styles.kpiValue}>{stats.validées7j}</Text>
              <Text style={styles.kpiLabel}>Validées</Text>
            </View>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: Colors.error + '20' }]}>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </View>
              <Text style={styles.kpiValue}>{stats.refusées7j}</Text>
              <Text style={styles.kpiLabel}>Refusées</Text>
            </View>
          </View>
        </View>

        {/* Pending Requests Alert */}
        {pendingRequests.length > 0 && (
          <TouchableOpacity 
            style={styles.alertCard}
            onPress={() => router.push('/(sponsor-tabs)/campagnes')}
          >
            <View style={styles.alertIcon}>
              <RotatingStar size={24} color={Colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {pendingRequests.filter(r => r.status === 'COUNTERED').length} contre-offres en attente
              </Text>
              <Text style={styles.alertSubtitle}>Répondez pour valider les accords</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/create-campaign')}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="add-circle" size={24} color={Colors.white} />
            <Text style={styles.ctaText}>Créer une campagne</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Les euros sont consommés uniquement lorsqu'un accord est validé.
          </Text>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={[styles.modalContent, { marginTop: insets.top + 60 }]}>
            <Text style={styles.modalTitle}>Mes profils</Text>
            <ScrollView style={styles.profilesList}>
              {selectedProfiles.map((profile, index) => (
                <TouchableOpacity
                  key={profile.id || index}
                  style={[
                    styles.profileItem,
                    index === activeProfileIndex && styles.profileItemActive
                  ]}
                  onPress={() => handleSwitchProfile(index)}
                >
                  <View style={[
                    styles.profileItemIcon,
                    index === activeProfileIndex && styles.profileItemIconActive
                  ]}>
                    <Ionicons 
                      name={getProfileIcon(profile.type)} 
                      size={20} 
                      color={index === activeProfileIndex ? Colors.white : Colors.primary} 
                    />
                  </View>
                  <View style={styles.profileItemInfo}>
                    <Text style={styles.profileItemName}>{profile.name}</Text>
                    <Text style={styles.profileItemType}>
                      {getProfileTypeLabel(profile.type)}
                    </Text>
                  </View>
                  {index === activeProfileIndex && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  profileSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  // Date Section
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    gap: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Section
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Carousel styles
  carousel: {
    marginHorizontal: 0,
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  docCard: {
    width: CARD_WIDTH,
    marginRight: Spacing.md,
  },
  docImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
  sponsorBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  sponsorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  docInfo: {
    padding: Spacing.sm,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  docType: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  // Budget Card
  budgetCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  budgetTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  budgetAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
  },
  budgetCurrency: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  budgetDetail: {
    alignItems: 'center',
  },
  budgetDetailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  budgetDetailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
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
  statCardHighlight: {
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  statIconContainer: {
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // KPI
  kpiSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // Alert
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  alertIcon: {
    marginRight: Spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  alertSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // CTA
  ctaButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: 16,
    padding: Spacing.md,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  profilesList: {
    maxHeight: 300,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  profileItemActive: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  profileItemIconActive: {
    backgroundColor: Colors.primary,
  },
  profileItemInfo: {
    flex: 1,
  },
  profileItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profileItemType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
