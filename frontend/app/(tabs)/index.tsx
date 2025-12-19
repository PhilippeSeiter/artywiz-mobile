import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useSponsorStore } from '../../stores/sponsorStore';
import { MockDataService } from '../../services/mockDataService';
import { CalendarModal, RotatingStar, DocShowcase } from '../../components';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';

// Pop-up text for auto-sponsoring activation
const AUTO_SPONSORING_EXPLANATION = "Vous choisissez quels documents peuvent être sponsorisés et vous fixez votre tarif par document. Quand une marque veut sponsoriser un de vos contenus, vous recevez une demande dans l'app : vous pouvez accepter, refuser ou proposer un autre montant.";

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65;

// Mapping des logos pour les profils
const PROFILE_LOGOS: { [key: string]: any } = {
  'club_1': require('../../assets/images/logo AS Strasbourg.png'),
  'ligue_1': require('../../assets/images/logo LGEF ligue grand est.png'),
  'ligue_2': require('../../assets/images/logo ligue normandie.png'),
  'district_1': require('../../assets/images/logo district alsace.png'),
};

// Fonction pour obtenir le logo d'un profil
const getProfileLogo = (profileId: string, clubId?: string) => {
  if (clubId && PROFILE_LOGOS[clubId]) {
    return PROFILE_LOGOS[clubId];
  }
  return PROFILE_LOGOS[profileId] || null;
};

// ============================================
// ANIMATED LOGO COMPONENT - 3 parties ASYNCHRONE
// W: 0ms ±10% | Artywiz: 300ms ±20% | Football: 600ms ±10%
// Utilise setTimeout pour garantir le décalage asynchrone
// ============================================
const ANIM_STEP_DURATION = 400; // Durée par étape

const AnimatedHeaderLogo = () => {
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  const scaleFootball = useSharedValue(1);
  const isAnimating = useRef(false);

  const startAnimation = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    scaleW.value = 1;
    scaleArtywiz.value = 1;
    scaleFootball.value = 1;

    const easeConfig = { duration: ANIM_STEP_DURATION, easing: Easing.inOut(Easing.ease) };

    // W: démarre à 0ms, ±10% (0.90 → 1.10)
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.10, easeConfig),
        withTiming(0.90, easeConfig)
      ),
      3,
      true
    );

    // Artywiz: démarre à 300ms (ASYNCHRONE), ±20% (0.80 → 1.20)
    setTimeout(() => {
      scaleArtywiz.value = withRepeat(
        withSequence(
          withTiming(1.20, easeConfig),
          withTiming(0.80, easeConfig)
        ),
        3,
        true
      );
    }, 300);

    // Football: démarre à 600ms (ASYNCHRONE), ±10% (0.90 → 1.10)
    setTimeout(() => {
      scaleFootball.value = withRepeat(
        withSequence(
          withTiming(1.10, easeConfig),
          withTiming(0.90, easeConfig)
        ),
        3,
        true
      );
    }, 600);

    // Reset après animation
    setTimeout(() => {
      scaleW.value = withTiming(1, { duration: 300 });
      scaleArtywiz.value = withTiming(1, { duration: 300 });
      scaleFootball.value = withTiming(1, { duration: 300 });
      isAnimating.current = false;
    }, 3500);
  }, []);

  const handlePress = useCallback(() => {
    if (!isAnimating.current) {
      startAnimation();
    }
  }, [startAnimation]);

  useEffect(() => {
    const timer = setTimeout(() => startAnimation(), 500);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  const animatedStyleW = useAnimatedStyle(() => ({
    transform: [{ scale: scaleW.value }],
  }));

  const animatedStyleArtywiz = useAnimatedStyle(() => ({
    transform: [{ scale: scaleArtywiz.value }],
  }));

  const animatedStyleFootball = useAnimatedStyle(() => ({
    transform: [{ scale: scaleFootball.value }],
  }));

  return (
    <Pressable onPress={handlePress} style={animatedLogoStyles.container}>
      <View style={animatedLogoStyles.wrapper}>
        <ReAnimated.View style={[animatedLogoStyles.part, animatedLogoStyles.partW, animatedStyleW]}>
          <Image
            source={require('../../assets/images/logo_W.png')}
            style={animatedLogoStyles.imageW}
            resizeMode="contain"
          />
        </ReAnimated.View>
        <ReAnimated.View style={[animatedLogoStyles.part, animatedLogoStyles.partArtywiz, animatedStyleArtywiz]}>
          <Image
            source={require('../../assets/images/logo_artywiz.png')}
            style={animatedLogoStyles.imageArtywiz}
            resizeMode="contain"
          />
        </ReAnimated.View>
        <ReAnimated.View style={[animatedLogoStyles.part, animatedLogoStyles.partFootball, animatedStyleFootball]}>
          <Image
            source={require('../../assets/images/logo_football.png')}
            style={animatedLogoStyles.imageFootball}
            resizeMode="contain"
          />
        </ReAnimated.View>
      </View>
    </Pressable>
  );
};

const animatedLogoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: 120,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  part: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partW: {
    top: 0,
    width: '100%',
  },
  imageW: {
    width: 30,
    height: 22,
  },
  partArtywiz: {
    top: 18,
    width: '100%',
  },
  imageArtywiz: {
    width: 85,
    height: 18,
  },
  partFootball: {
    top: 38,
    width: '100%',
  },
  imageFootball: {
    width: 60,
    height: 12,
  },
});

export default function AccueilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { 
    selectedProfiles, 
    activeProfileIndex, 
    setActiveProfile, 
    hasCompletedOnboarding,
    sponsoringPrefs,
    setSponsoringPrefs 
  } = useUserPreferencesStore();
  const { setSponsorMode } = useSponsorStore();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [showSponsoringModal, setShowSponsoringModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Animations d'entrée TETRIS pour les blocs (tombent du haut)
  const sponsoringBlockY = useSharedValue(-200);
  const sponsoringBlockOpacity = useSharedValue(0);
  const sponsoringBlockScale = useSharedValue(0.95);
  const statsBlockY = useSharedValue(-200);
  const statsBlockOpacity = useSharedValue(0);
  const statsBlockScale = useSharedValue(0.95);
  const [showCounterAnimation, setShowCounterAnimation] = useState(false);
  
  // Auto-sponsoring state
  const isAutoSponsoringEnabled = sponsoringPrefs?.autoSponsoringEnabled ?? false;

  // Check if user has sponsor profile
  const hasSponsorProfile = selectedProfiles.some(p => p.type === 'sponsor');

  // Get active profile
  const activeProfile = selectedProfiles[activeProfileIndex] || selectedProfiles[0];

  // Get documents for the carousel
  // Utilise les données du nouveau système basé sur l'Excel
  // Priorité: données Excel > données mock legacy
  const documentsFromExcel = MockDataService.getDocsForDashboard(6);
  const documentsLegacy = MockDataService.getAllDocuments().slice(0, 6);
  const documents = documentsFromExcel.length > 0 ? documentsFromExcel : documentsLegacy;

  // Notifications dynamiques - basées sur les documents prêts
  const [dynamicNotifications, setDynamicNotifications] = useState<Array<{
    id: number;
    type: string;
    text: string;
    icon: 'star' | 'document-text' | 'sparkles' | 'flash';
    color: string;
    route: string;
    timestamp: Date;
  }>>([]);
  
  // Ajouter une notification quand un document est prêt
  const addDocReadyNotification = (docTitle: string) => {
    const newNotif = {
      id: Date.now(),
      type: 'doc_ready',
      text: `"${docTitle}" est prêt à buzzer !`,
      icon: 'flash' as const,
      color: Colors.success,
      route: '/(tabs)/creer',
      timestamp: new Date(),
    };
    setDynamicNotifications(prev => [newNotif, ...prev].slice(0, 5));
  };
  
  const totalNotifications = dynamicNotifications.length;

  // Déclencher les animations TETRIS des blocs après l'apparition du dashboard
  useEffect(() => {
    if (hasCompletedOnboarding) {
      // Attendre que le DocShowcase ait fini son chargement (4s) puis déclencher les animations Tetris
      const timer = setTimeout(() => {
        // Animation bloc Sponsoring - effet TETRIS tombant avec rebond
        sponsoringBlockOpacity.value = withTiming(1, { duration: 200 });
        sponsoringBlockY.value = withSpring(0, { 
          damping: 8, 
          stiffness: 120,
          mass: 0.8,
        });
        sponsoringBlockScale.value = withSequence(
          withTiming(1.05, { duration: 150 }),
          withSpring(1, { damping: 10, stiffness: 100 })
        );
        
        // Animation bloc Stats avec délai - effet TETRIS
        setTimeout(() => {
          statsBlockOpacity.value = withTiming(1, { duration: 200 });
          statsBlockY.value = withSpring(0, { 
            damping: 8, 
            stiffness: 120,
            mass: 0.8,
          });
          statsBlockScale.value = withSequence(
            withTiming(1.05, { duration: 150 }),
            withSpring(1, { damping: 10, stiffness: 100 })
          );
          
          // Déclencher les compteurs après mise en place
          setTimeout(() => {
            setShowCounterAnimation(true);
          }, 400);
        }, 250);
      }, 4300); // 4.3s = après le chargement du DocShowcase (4s + marge)
      
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding]);
  
  // Styles animés TETRIS pour les blocs
  const sponsoringBlockStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sponsoringBlockY.value },
      { scale: sponsoringBlockScale.value },
    ],
    opacity: sponsoringBlockOpacity.value,
  }));
  
  const statsBlockStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: statsBlockY.value },
      { scale: statsBlockScale.value },
    ],
    opacity: statsBlockOpacity.value,
  }));

  // Handle document press from showcase
  const handleDocPress = (docId: string) => {
    router.push(`/document/${docId}`);
  };

  // Format date in French
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

  // Format period display
  const formatPeriodDisplay = () => {
    if (periodStart && periodEnd) {
      const startStr = periodStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const endStr = periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    return formatDate(selectedDate);
  };

  // Sponsoring data avec animation des compteurs
  const [sponsoringCounter, setSponsoringCounter] = useState({ active: 0, possible: 0 });
  
  // Animation des compteurs de sponsoring (de 0 à valeurs cibles) - déclenché par showCounterAnimation
  useEffect(() => {
    if (isAutoSponsoringEnabled && showCounterAnimation) {
      const targetActive = 120;
      const targetPossible = 30;
      const duration = 1500; // 1.5 secondes
      const steps = 25;
      const interval = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        // Easing out (effet pompe à essence)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setSponsoringCounter({
          active: Math.round(targetActive * easeOut),
          possible: Math.round(targetPossible * easeOut),
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, interval);
      
      return () => clearInterval(timer);
    } else if (!showCounterAnimation) {
      setSponsoringCounter({ active: 0, possible: 0 });
    }
  }, [isAutoSponsoringEnabled, showCounterAnimation]);
  
  const sponsoringData = {
    euroActive: sponsoringCounter.active,
    euroPossible: sponsoringCounter.possible,
    demandesSponsoring: 2,
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setPeriodStart(null);
    setPeriodEnd(null);
  };

  const handlePeriodSelect = (start: Date, end: Date) => {
    setPeriodStart(start);
    setPeriodEnd(end);
    setSelectedDate(start);
  };

  const handleSwitchProfile = (index: number) => {
    const profile = selectedProfiles[index];
    setActiveProfile(index);
    setShowProfileModal(false);
    
    // Si c'est un profil sponsor, naviguer vers le dashboard sponsor
    if (profile && profile.type === 'sponsor') {
      setSponsorMode(true);
      router.replace('/(sponsor-tabs)');
    }
  };

  // Handle auto-sponsoring toggle
  const handleToggleAutoSponsoring = () => {
    if (!isAutoSponsoringEnabled) {
      // Show explanation modal before enabling
      setShowSponsoringModal(true);
    } else {
      // Disable directly
      setSponsoringPrefs({
        ...sponsoringPrefs,
        autoSponsoringEnabled: false,
      });
    }
  };

  const handleConfirmActivateSponsoring = () => {
    setSponsoringPrefs({
      ...sponsoringPrefs,
      autoSponsoringEnabled: true,
      pricePerDoc: sponsoringPrefs?.pricePerDoc || 10,
    });
    setShowSponsoringModal(false);
  };

  // If first connection and onboarding not completed, show onboarding prompt
  if (!hasCompletedOnboarding) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
        >
          <View style={styles.headerCentered}>
            <AnimatedHeaderLogo />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.onboardingContent}>
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingIcon}>
              <Ionicons name="sparkles" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.onboardingTitle}>Mes préférences</Text>
            <Text style={styles.onboardingText}>
              Choisissez les thématiques et le sponsoring à activer
            </Text>
            <TouchableOpacity
              style={styles.onboardingButton}
              onPress={() => router.push('/onboarding-themes')}
            >
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.onboardingButtonGradient}
              >
                <Text style={styles.onboardingButtonText}>Configurer</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Watermark logo */}
        <View style={styles.watermarkContainer}>
          <Image
            source={require('../../assets/images/W-artywiz.png')}
            style={styles.watermarkLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Profile Switch */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <View style={styles.headerRow}>
          {/* Logo W à gauche */}
          <View style={styles.logoWContainer}>
            <Image
              source={require('../../assets/images/logo_W.png')}
              style={styles.logoW}
              resizeMode="contain"
            />
          </View>
          
          {/* Nom du profil actif au centre (cliquable) */}
          <TouchableOpacity
            style={styles.profileSwitchCompact}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.profileName} numberOfLines={1}>
              {activeProfile?.name || 'Mon profil'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.white} />
          </TouchableOpacity>
          
          {/* Bouton Filtrer à droite */}
          {totalNotifications > 0 && (
            <TouchableOpacity 
              style={styles.notificationBell}
              onPress={() => setShowNotificationsModal(true)}
            >
              <Ionicons name="notifications" size={22} color={Colors.white} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{totalNotifications}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Date Selector - Plus petite et cliquable */}
        <TouchableOpacity 
          style={styles.dateSectionSmall}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateTextSmall}>{formatPeriodDisplay()}</Text>
          <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Petite marge avant le titre */}
        <View style={{ height: Spacing.md }} />

        {/* Mes docs du jour */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes docs du jour</Text>
            {documents.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/preparer')}>
                <Text style={styles.seeAllLink}>Tout voir</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* DocShowcase gère son propre état de chargement avec le cadre final */}
          <DocShowcase
            documents={documents}
            getMockup={MockDataService.getDocMockup}
            getSponsoringPrice={MockDataService.getSponsoringPrice}
            isAutoSponsoringEnabled={isAutoSponsoringEnabled}
            onDocPress={handleDocPress}
          />
        </View>

        {/* Sponsoring du jour Section - avec animation d'entrée */}
        <ReAnimated.View style={[styles.section, sponsoringBlockStyle]}>
          <Text style={styles.sectionTitle}>
            {isAutoSponsoringEnabled ? 'Sponsoring du jour' : 'Auto-sponsoring'}
          </Text>
          
          <View style={styles.sectionTitleMargin} />
          
          {isAutoSponsoringEnabled ? (
            // Sponsoring enabled - show stats avec ATC
            <>
              <View style={styles.sponsoringGrid}>
                <View style={styles.sponsoringCardVertical}>
                  <View style={styles.sponsoringCardHeader}>
                    <Ionicons name="flag" size={20} color={Colors.primary} />
                    <Text style={styles.sponsoringValue}>{sponsoringData.euroActive} ATC</Text>
                  </View>
                  <Text style={styles.sponsoringLabel}>objectif</Text>
                </View>
                <View style={styles.sponsoringCardVertical}>
                  <View style={styles.sponsoringCardHeader}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.sponsoringValue}>{sponsoringData.euroPossible} ATC</Text>
                  </View>
                  <Text style={styles.sponsoringLabel}>atteint</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.demandesCard}
                onPress={() => router.push('/(tabs)/alertes')}
              >
                <View style={styles.demandesIcon}>
                  <RotatingStar size={24} color={Colors.warning} />
                </View>
                <Text style={styles.demandesText}>
                  {sponsoringData.demandesSponsoring} demandes de sponsoring
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </>
          ) : (
            // Sponsoring disabled - show activation toggle
            <TouchableOpacity 
              style={styles.activateSponsoringCard}
              onPress={handleToggleAutoSponsoring}
            >
              <View style={styles.activateSponsoringIcon}>
                <Ionicons name="star-outline" size={32} color={Colors.primary} />
              </View>
              <View style={styles.activateSponsoringInfo}>
                <Text style={styles.activateSponsoringTitle}>Activer l'auto-sponsoring</Text>
                <Text style={styles.activateSponsoringDesc}>
                  Monétisez vos contenus en acceptant des sponsors
                </Text>
              </View>
              <View style={styles.activateSponsoringToggle}>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}
        </ReAnimated.View>

        {/* Stats du jour Section - sans le titre "Mes Statistiques" */}
        <ReAnimated.View style={[styles.section, statsBlockStyle]}>
          <Text style={styles.sectionTitle}>Stats du jour</Text>
          
          <View style={styles.sectionTitleMargin} />
          
          <TouchableOpacity 
            style={styles.statsCardLight}
            onPress={() => router.push('/statistics')}
            activeOpacity={0.8}
          >
            <View style={styles.statsCardLightIcon}>
              <Ionicons name="bar-chart" size={28} color={Colors.primary} />
            </View>
            <View style={styles.statsCardContent}>
              <Text style={styles.statsCardLightSubtitle}>
                Consultez vos performances et tendances
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </ReAnimated.View>
      </ScrollView>

      {/* Custom Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        onSelectPeriod={handlePeriodSelect}
        allowPeriodSelection={true}
      />

      {/* Profile Switch Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mes profils</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.profileList}>
              {selectedProfiles.length === 0 ? (
                <Text style={styles.noProfilesText}>Aucun profil sélectionné</Text>
              ) : (
                selectedProfiles.map((profile, index) => (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.profileItem,
                      index === activeProfileIndex && styles.profileItemActive,
                    ]}
                    onPress={() => handleSwitchProfile(index)}
                  >
                    <View style={[
                      styles.profileItemIcon,
                      index === activeProfileIndex && styles.profileItemIconActive,
                      (profile.logo || getProfileLogo(profile.id, profile.clubId)) && { backgroundColor: '#FFFFFF' },
                    ]}>
                      {profile.logo ? (
                        <Image source={{ uri: profile.logo }} style={styles.profileLogoImage} resizeMode="contain" />
                      ) : getProfileLogo(profile.id, profile.clubId) ? (
                        <Image source={getProfileLogo(profile.id, profile.clubId)} style={styles.profileLogoImage} resizeMode="contain" />
                      ) : (
                        <Ionicons
                          name={
                            profile.type === 'ligue' ? 'globe' :
                            profile.type === 'district' ? 'map' :
                            profile.type === 'club' ? 'shield' :
                            profile.type === 'equipe' ? 'people' :
                            'business'
                          }
                          size={20}
                          color={index === activeProfileIndex ? Colors.white : Colors.primary}
                        />
                      )}
                    </View>
                    <View style={styles.profileItemInfo}>
                      <Text style={styles.profileItemName}>{profile.name}</Text>
                      <Text style={styles.profileItemType}>
                        {profile.type === 'ligue' ? 'Ligue' :
                         profile.type === 'district' ? 'District' :
                         profile.type === 'club' ? 'Club' :
                         profile.type === 'equipe' ? 'Équipe' :
                         'Sponsor'}
                      </Text>
                    </View>
                    {index === activeProfileIndex && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Auto-Sponsoring Explanation Modal */}
      <Modal
        visible={showSponsoringModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSponsoringModal(false)}
      >
        <View style={styles.sponsoringModalOverlay}>
          <View style={styles.sponsoringModalContent}>
            <View style={styles.sponsoringModalIconContainer}>
              <LinearGradient
                colors={[Colors.warning, '#FFA726']}
                style={styles.sponsoringModalIconBg}
              >
                <Ionicons name="star" size={40} color={Colors.white} />
              </LinearGradient>
            </View>
            
            <Text style={styles.sponsoringModalTitle}>Activer l'auto-sponsoring</Text>
            <Text style={styles.sponsoringModalText}>{AUTO_SPONSORING_EXPLANATION}</Text>
            
            <View style={styles.sponsoringModalActions}>
              <TouchableOpacity 
                style={styles.sponsoringModalCancelBtn}
                onPress={() => setShowSponsoringModal(false)}
              >
                <Text style={styles.sponsoringModalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sponsoringModalConfirmBtn}
                onPress={handleConfirmActivateSponsoring}
              >
                <LinearGradient
                  colors={[Colors.gradientStart, Colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sponsoringModalConfirmGradient}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                  <Text style={styles.sponsoringModalConfirmText}>Activer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <TouchableOpacity 
          style={styles.notificationsModalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotificationsModal(false)}
        >
          <View style={[styles.notificationsModalContent, { marginTop: insets.top + 60 }]}>
            <Text style={styles.notificationsModalTitle}>Notifications</Text>
            {dynamicNotifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={32} color="#D1D5DB" />
                <Text style={styles.emptyNotificationsText}>Aucune notification</Text>
              </View>
            ) : (
              dynamicNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationItem}
                  onPress={() => {
                    setShowNotificationsModal(false);
                    router.push(notification.route as any);
                  }}
                >
                  <View style={[styles.notificationItemIcon, { backgroundColor: notification.color + '20' }]}>
                    <Ionicons name={notification.icon} size={20} color={notification.color} />
                  </View>
                  <View style={styles.notificationItemContent}>
                    <Text style={styles.notificationItemText}>{notification.text}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileSwitchCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  profileLogo: {
    width: 36,
    height: 36,
    marginRight: Spacing.sm,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginRight: 4,
    maxWidth: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  logoWContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoW: {
    width: 28,
    height: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: Spacing.sm,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  rightElements: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  sponsorModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerIcon: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: 100, // Assurer que le contenu ne soit pas coupé par la tab bar
  },
  // Header centered styles
  headerCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  headerLogoSmall: {
    width: 32,
    height: 32,
  },
  headerTitleCentered: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  // Watermark logo
  watermarkContainer: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.md,
    opacity: 0.15,
  },
  watermarkLogo: {
    width: 40,
    height: 40,
  },
  // Onboarding styles
  onboardingContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  onboardingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  onboardingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  onboardingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  onboardingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  onboardingButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  onboardingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  onboardingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  // Date Section - MARGES RÉDUITES
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 10,
    gap: Spacing.xs,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dateSectionSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: 4,
  },
  dateTextSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Insights card
  insightsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  insightsCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  insightsCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsCardContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  insightsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  insightsCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // Section styles - MARGES RÉDUITES
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitleMargin: {
    height: 10,
  },
  seeAllLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Loading message
  loadingMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  // Skeleton styles
  skeletonCard: {
    width: width * 0.65,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
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
    marginRight: 2,
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
  // Sponsoring styles
  sponsoringGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sponsoringCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  sponsoringCardCompact: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  sponsoringCardVertical: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  sponsoringCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sponsoringValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sponsoringLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  demandesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.md,
  },
  demandesIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  demandesText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Modal styles
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileList: {
    // No maxHeight - allow all profiles to display
  },
  noProfilesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  profileItemActive: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileItemIconActive: {
    backgroundColor: Colors.primary,
  },
  profileLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 4,
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
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Auto-sponsoring activation card
  activateSponsoringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '08',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '20',
    borderStyle: 'dashed',
  },
  activateSponsoringIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activateSponsoringInfo: {
    flex: 1,
  },
  activateSponsoringTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  activateSponsoringDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  activateSponsoringToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsoringToggleBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  sponsoringToggleBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  // Sponsoring explanation modal
  sponsoringModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sponsoringModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  sponsoringModalIconContainer: {
    marginBottom: Spacing.lg,
  },
  sponsoringModalIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsoringModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  sponsoringModalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  sponsoringModalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  sponsoringModalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  sponsoringModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sponsoringModalConfirmBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sponsoringModalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  sponsoringModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  // Notifications modal
  notificationsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  notificationsModalContent: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationsModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notificationItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  notificationItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationItemCount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notificationItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: Spacing.sm,
  },
  // Stats Card styles
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  statsCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  statsCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCardContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  statsCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Stats Card Light (style clair comme Sponsoring)
  statsCardLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsCardLightIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCardLightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsCardLightSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
