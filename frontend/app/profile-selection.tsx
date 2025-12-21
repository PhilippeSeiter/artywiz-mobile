import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  UIManager,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  ImageBackground,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferencesStore, UserProfile, DEFAULT_BASE_PROFILES } from '../stores/userPreferencesStore';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

// ============================================
// ANIMATED LOGO COMPONENT - 3 parties
// ============================================
const AnimatedProfileLogo = () => {
  const opacityW = useSharedValue(0);
  const opacityArtywiz = useSharedValue(0);
  const opacityFootball = useSharedValue(0);
  const scaleW = useSharedValue(1);
  const scaleArtywiz = useSharedValue(1);
  const scaleFootball = useSharedValue(1);
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Cycle de 2.4 secondes = 1200ms par demi-cycle (20% plus lent)
    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    // W: ±15% amplitude, GRANDIT d'abord
    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.15, easeConfig),
        withTiming(0.85, easeConfig)
      ),
      -1,
      true
    );

    // Artywiz: décalage 500ms, ±15%, RÉDUIT d'abord
    setTimeout(() => {
      scaleArtywiz.value = withRepeat(
        withSequence(
          withTiming(0.85, easeConfig),
          withTiming(1.15, easeConfig)
        ),
        -1,
        true
      );
    }, 500);

    // Football: décalage 1000ms, ±15%, GRANDIT d'abord
    setTimeout(() => {
      scaleFootball.value = withRepeat(
        withSequence(
          withTiming(1.15, easeConfig),
          withTiming(0.85, easeConfig)
        ),
        -1,
        true
      );
    }, 1000);
  }, []);

  useEffect(() => {
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    setTimeout(() => {
      opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 300);
    setTimeout(() => {
      opacityFootball.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    }, 600);
    const timer = setTimeout(() => startAnimation(), 1000);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  const animatedStyleW = useAnimatedStyle(() => ({
    opacity: opacityW.value,
    transform: [{ scale: scaleW.value }],
  }));

  const animatedStyleArtywiz = useAnimatedStyle(() => ({
    opacity: opacityArtywiz.value,
    transform: [{ scale: scaleArtywiz.value }],
  }));

  const animatedStyleFootball = useAnimatedStyle(() => ({
    opacity: opacityFootball.value,
    transform: [{ scale: scaleFootball.value }],
  }));

  return (
    <View style={logoStyles.container}>
      <View style={logoStyles.wrapper}>
        <Animated.View style={[logoStyles.part, logoStyles.partW, animatedStyleW]}>
          <Image source={require('../assets/images/logo_W.png')} style={logoStyles.imageW} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={[logoStyles.part, logoStyles.partArtywiz, animatedStyleArtywiz]}>
          <Image source={require('../assets/images/logo_artywiz.png')} style={logoStyles.imageArtywiz} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={[logoStyles.part, logoStyles.partFootball, animatedStyleFootball]}>
          <Image source={require('../assets/images/logo_football.png')} style={logoStyles.imageFootball} resizeMode="contain" />
        </Animated.View>
      </View>
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: { position: 'absolute', top: 55, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },  // zIndex bas pour passer sous le contenu
  wrapper: { width: 220, height: 100, alignItems: 'center', justifyContent: 'flex-start' },  // +10%
  part: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  partW: { top: 0, width: '100%', alignItems: 'center' },
  imageW: { width: 55, height: 39 },  // +10%
  partArtywiz: { top: 36, width: '100%', alignItems: 'center' },
  imageArtywiz: { width: 154, height: 33 },  // +10%
  partFootball: { top: 68, width: '100%', alignItems: 'center' },
  imageFootball: { width: 110, height: 22 },  // +10%
});

// Animation du fond
const BG_SCALE_BASE = 1.0;
const BG_SCALE_AMPLITUDE = 0.02;
const BG_TRANSLATE_AMPLITUDE = width * 0.01;

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Animation constants
const ANIMATION_DURATION = 300;
const CONTENT_MAX_HEIGHT = 250;

type AccordionType = 'ligue' | 'district' | 'club' | 'equipe' | 'sponsor' | null;

// Types de profils pour le modal
const PROFILE_TYPES = [
  { id: 'equipe', label: 'Équipe', icon: 'people-outline', color: '#6366F1' },
  { id: 'club', label: 'Club', icon: 'shield-outline', color: '#0EA5E9' },
  { id: 'district', label: 'District', icon: 'map-outline', color: '#10B981' },
  { id: 'ligue', label: 'Ligue', icon: 'globe-outline', color: '#8B5CF6' },
  { id: 'sponsor', label: 'Sponsor', icon: 'business-outline', color: '#F59E0B' },
];

// Mapping des logos pour les profils
const PROFILE_LOGOS: { [key: string]: any } = {
  // Clubs
  'club_1': require('../assets/images/logo AS Strasbourg.png'),
  // Ligues
  'ligue_1': require('../assets/images/logo LGEF ligue grand est.png'),
  'ligue_2': require('../assets/images/logo ligue normandie.png'),
  // Districts
  'district_1': require('../assets/images/logo district alsace.png'),
};

// Mock data for each type
const MOCK_DATA = {
  ligue: [
    { id: 'ligue_1', name: 'Ligue Grand Est de Football', numero: 'LGEF' },
    { id: 'ligue_2', name: 'Ligue de Normandie de Football', numero: 'LNF' },
    { id: 'ligue_3', name: "Ligue d'Île-de-France de Football", numero: 'LIDF' },
    { id: 'ligue_4', name: 'Ligue Auvergne-Rhône-Alpes de Football', numero: 'LAURAF' },
    { id: 'ligue_5', name: 'Ligue de Nouvelle-Aquitaine de Football', numero: 'LNAF' },
    { id: 'ligue_6', name: 'Ligue Occitanie de Football', numero: 'LOF' },
  ],
  district: [
    { id: 'district_1', name: "District d'Alsace", numero: '67' },
    { id: 'district_2', name: 'District des Ardennes', numero: '08' },
    { id: 'district_3', name: "District de l'Aube", numero: '10' },
    { id: 'district_4', name: 'District de la Marne', numero: '51' },
    { id: 'district_5', name: 'District de la Haute-Marne', numero: '52' },
    { id: 'district_6', name: 'District de Meurthe-et-Moselle', numero: '54' },
    { id: 'district_7', name: 'District de la Meuse', numero: '55' },
    { id: 'district_8', name: 'District de Moselle', numero: '57' },
    { id: 'district_9', name: 'District des Vosges', numero: '88' },
    { id: 'district_10', name: 'District du Calvados', numero: '14' },
    { id: 'district_11', name: "District de l'Eure", numero: '27' },
    { id: 'district_12', name: 'District de la Manche', numero: '50' },
    { id: 'district_13', name: "District de l'Orne", numero: '61' },
    { id: 'district_14', name: 'District de Seine-Maritime', numero: '76' },
  ],
  club: [
    { id: 'club_1', name: 'AS Strasbourg', numero: '500001' },
    { id: 'club_2', name: 'ASL Robertsau', numero: '500002' },
    { id: 'club_3', name: 'Club sportif Orne Amnéville', numero: '570001' },
    { id: 'club_4', name: 'ASPTT Metz', numero: '570002' },
    { id: 'club_5', name: 'Association sportive de Talange', numero: '570003' },
    { id: 'club_6', name: 'Association sportive Giraumont', numero: '540001' },
    { id: 'club_7', name: 'Jeunesse sportive audunoise', numero: '540002' },
    { id: 'club_8', name: 'FC Kogenheim', numero: '670001' },
    { id: 'club_9', name: 'RCS La Chapelle', numero: '670002' },
    { id: 'club_10', name: 'Club sportif Le Thillot', numero: '880001' },
    { id: 'club_11', name: 'Union sportive du bassin de Longwy', numero: '540003' },
    { id: 'club_12', name: 'Stade olympique de Merlebach', numero: '570004' },
    { id: 'club_13', name: 'Football Club de Metz', numero: '570005' },
    { id: 'club_14', name: 'Association sportive mulhousienne', numero: '680001' },
    { id: 'club_15', name: 'Football Club Red Star Mulhouse', numero: '680002' },
    { id: 'club_16', name: 'Association sportive de Mutzig', numero: '670003' },
    { id: 'club_17', name: 'Football Club de Neufchâteau-Liffol', numero: '880002' },
    { id: 'club_18', name: 'Olympique Charleville', numero: '080001' },
    { id: 'club_19', name: 'Football Club du Bassin Piennois', numero: '540004' },
    { id: 'club_20', name: 'Union sportive raonnaise', numero: '880003' },
  ],
  equipe: [
    { id: 'equipe_1', name: 'U11', numero: 'M' },
    { id: 'equipe_2', name: 'U12', numero: 'M' },
    { id: 'equipe_3', name: 'U15', numero: 'M' },
    { id: 'equipe_4', name: 'U17', numero: 'M' },
    { id: 'equipe_5', name: 'U19', numero: 'M' },
    { id: 'equipe_6', name: 'Séniors', numero: 'M' },
    { id: 'equipe_7', name: 'Vétérans', numero: 'M' },
    { id: 'equipe_8', name: 'U11F', numero: 'F' },
    { id: 'equipe_9', name: 'U12F', numero: 'F' },
    { id: 'equipe_10', name: 'U15F', numero: 'F' },
    { id: 'equipe_11', name: 'U17F', numero: 'F' },
    { id: 'equipe_12', name: 'U19F', numero: 'F' },
    { id: 'equipe_13', name: 'SéniorsF', numero: 'F' },
    { id: 'equipe_14', name: 'VétéransF', numero: 'F' },
  ],
};

export default function ProfileSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedProfiles: existingProfiles, setSelectedProfiles, hasCompletedOnboarding } = useUserPreferencesStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [openAccordion, setOpenAccordion] = useState<AccordionType>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({
    ligue: '',
    district: '',
    club: '',
    equipe: '',
    sponsor: '',
  });
  
  // Fonction pour vérifier si un profil est un conteneur de base (non supprimable)
  const isBaseProfile = (profileId: string) => {
    return profileId.startsWith('base_');
  };
  
  // Filtrer les profils réels (pas les conteneurs de base) pour l'affichage
  const getRealProfiles = (profiles: UserProfile[]) => {
    return profiles.filter(p => !isBaseProfile(p.id));
  };
  
  // Initialize with existing profiles from the store (excluant les profils de base)
  const [selectedProfiles, setLocalSelectedProfiles] = useState<UserProfile[]>(
    getRealProfiles(existingProfiles)
  );
  
  // Synchroniser avec le store quand l'hydratation est terminée
  useEffect(() => {
    const realProfiles = getRealProfiles(existingProfiles);
    setLocalSelectedProfiles(realProfiles);
  }, [existingProfiles]);
  
  // For sponsor editing - find existing sponsor to pre-fill
  const existingSponsor = existingProfiles.find(p => p.type === 'sponsor');
  const [sponsorName, setSponsorName] = useState(existingSponsor?.name || '');
  const [sponsorLogo, setSponsorLogo] = useState<string | null>(existingSponsor?.logo || null);
  
  // Synchroniser le sponsor quand existingProfiles change
  useEffect(() => {
    const sponsor = existingProfiles.find(p => p.type === 'sponsor');
    if (sponsor) {
      setSponsorName(sponsor.name || '');
      setSponsorLogo(sponsor.logo || null);
    }
  }, [existingProfiles]);

  const isEditing = hasCompletedOnboarding;
  const hasClubSelected = selectedProfiles.some(p => p.type === 'club');
  
  // État pour l'accordéon Équipe - club sélectionné temporairement
  const [equipeClubSelected, setEquipeClubSelected] = useState<string | null>(null);
  // Récupérer le club déjà sélectionné dans les profils
  const selectedClubFromProfiles = selectedProfiles.find(p => p.type === 'club');
  
  // État pour le modal "Ajouter un profil"
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  
  // État pour le modal de confirmation après création de profil équipe
  const [showEquipeCreatedModal, setShowEquipeCreatedModal] = useState(false);
  const [lastCreatedEquipeName, setLastCreatedEquipeName] = useState('');

  // Animation du fond
  const bgScale = useSharedValue(BG_SCALE_BASE);
  const bgTranslateX = useSharedValue(0);
  const bgTranslateY = useSharedValue(0);

  // Animation de la carte
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  // Animation values for each accordion
  const accordionAnimations = {
    ligue: useSharedValue(0),
    district: useSharedValue(0),
    club: useSharedValue(0),
    equipe: useSharedValue(0),
    sponsor: useSharedValue(0),
  };

  // Start animations on mount
  useEffect(() => {
    // Animation du fond
    bgScale.value = withRepeat(
      withSequence(
        withTiming(BG_SCALE_BASE + BG_SCALE_AMPLITUDE, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(BG_SCALE_BASE - BG_SCALE_AMPLITUDE, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    bgTranslateX.value = withRepeat(
      withSequence(
        withTiming(BG_TRANSLATE_AMPLITUDE, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-BG_TRANSLATE_AMPLITUDE, { duration: 10000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    bgTranslateY.value = withRepeat(
      withSequence(
        withTiming(-BG_TRANSLATE_AMPLITUDE * 0.5, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(BG_TRANSLATE_AMPLITUDE * 0.5, { duration: 12000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Card animation
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100, mass: 0.8 }));
  }, []);

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bgScale.value },
      { translateX: bgTranslateX.value },
      { translateY: bgTranslateY.value },
    ],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const toggleAccordion = (type: AccordionType) => {
    Keyboard.dismiss();
    
    // Animation gaming: fermeture fluide de l'accordéon précédent
    if (openAccordion && openAccordion !== type) {
      accordionAnimations[openAccordion].value = withSpring(0, {
        damping: 15,
        stiffness: 200,
        mass: 0.6,
      });
    }
    
    // Toggle avec effet gaming
    if (openAccordion === type) {
      // Fermeture avec léger rebond
      accordionAnimations[type].value = withSpring(0, {
        damping: 18,
        stiffness: 250,
        mass: 0.5,
      });
      setOpenAccordion(null);
    } else {
      if (type) {
        // Ouverture gaming: overshoot puis settle
        accordionAnimations[type].value = withSequence(
          withSpring(1.05, { damping: 8, stiffness: 300, mass: 0.5 }),
          withSpring(1, { damping: 12, stiffness: 150, mass: 0.6 })
        );
      }
      setOpenAccordion(type);
    }
  };

  const getFilteredItems = (type: 'ligue' | 'district' | 'club' | 'equipe') => {
    const query = searchQueries[type].toLowerCase().trim();
    const items = MOCK_DATA[type];
    if (!query) return items;
    return items.filter(
      item => item.name.toLowerCase().includes(query) || item.numero.toLowerCase().includes(query)
    );
  };

  const handleSelectItem = (type: AccordionType, id: string, name: string) => {
    if (!type || type === 'sponsor') return;
    
    const isAlreadySelected = selectedProfiles.some(p => p.id === id);
    
    if (isAlreadySelected) {
      // Désélectionner si déjà sélectionné
      setLocalSelectedProfiles(prev => prev.filter(p => p.id !== id));
    } else {
      // Vérifier la limite de 30 profils
      if (selectedProfiles.length >= 30) {
        Alert.alert('Limite atteinte', 'Vous ne pouvez pas avoir plus de 30 profils.');
        return;
      }
      
      // ACCUMULER les profils (pas de remplacement)
      const newProfile: UserProfile = { type, id, name };
      setLocalSelectedProfiles(prev => [...prev, newProfile]);
    }

    // Close accordion with animation
    if (type) {
      accordionAnimations[type].value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }
    setOpenAccordion(null);
  };

  const getSelectedForType = (type: AccordionType) => {
    return selectedProfiles.filter(p => p.type === type);
  };

  const handleContinue = () => {
    console.log('[ProfileSelection] handleContinue called, profiles:', selectedProfiles.length, 'isEditing:', isEditing);
    
    // Les profils sélectionnés peuvent être vides si l'utilisateur utilise les conteneurs de base
    // On autorise maintenant la sauvegarde même sans profils "réels" sélectionnés
    
    // Build final profiles list - commencer avec les profils de base
    let finalProfiles: UserProfile[] = [...DEFAULT_BASE_PROFILES];
    
    // Ajouter les profils réels sélectionnés (pas les profils de base)
    const realSelectedProfiles = selectedProfiles.filter(p => !isBaseProfile(p.id) && p.type !== 'sponsor');
    finalProfiles = [...finalProfiles, ...realSelectedProfiles];
    
    // Add/update sponsor if entered (remplacer le sponsor de base)
    if (sponsorName.trim()) {
      // Retirer le sponsor de base
      finalProfiles = finalProfiles.filter(p => p.id !== 'base_sponsor');
      finalProfiles.push({
        type: 'sponsor',
        id: existingSponsor?.id || `sponsor_${Date.now()}`,
        name: sponsorName.trim(),
        logo: sponsorLogo || undefined,
      });
    }

    // Save to store
    console.log('[ProfileSelection] Saving profiles to store:', finalProfiles.length, finalProfiles);
    setSelectedProfiles(finalProfiles);
    
    if (isEditing) {
      // Go to Mon Compte (or back if possible)
      console.log('[ProfileSelection] Editing mode, navigating to compte');
      try {
        router.back();
      } catch (e) {
        // Fallback to explicit navigation
        router.replace('/(tabs)/compte');
      }
    } else {
      // First time: navigate to themes selection
      console.log('[ProfileSelection] First time, going to onboarding-themes');
      router.push('/onboarding-themes');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Sélection d'un type de profil depuis le modal
  const handleSelectProfileType = (type: AccordionType) => {
    setShowAddProfileModal(false);
    
    // Petit délai pour laisser le modal se fermer avant d'ouvrir l'accordéon
    setTimeout(() => {
      if (type) {
        // Fermer l'accordéon actuellement ouvert
        if (openAccordion && openAccordion !== type) {
          accordionAnimations[openAccordion].value = withSpring(0, {
            damping: 15,
            stiffness: 200,
            mass: 0.6,
          });
        }
        
        // Ouvrir le nouvel accordéon avec animation gaming
        accordionAnimations[type].value = withSequence(
          withSpring(1.05, { damping: 8, stiffness: 300, mass: 0.5 }),
          withSpring(1, { damping: 12, stiffness: 150, mass: 0.6 })
        );
        setOpenAccordion(type);
        
        // Scroll vers l'accordéon
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 200, animated: true });
        }, 100);
      }
    }, 200);
  };

  const renderAccordion = (
    type: 'ligue' | 'district' | 'club' | 'equipe',
    label: string,
    icon: string,
    disabled: boolean = false
  ) => {
    const isOpen = openAccordion === type;
    const selectedItems = getSelectedForType(type);
    const hasSelection = selectedItems.length > 0;
    const filteredItems = getFilteredItems(type);
    
    // Animated styles for content - effet gaming avec scale et bounce
    const animatedContentStyle = useAnimatedStyle(() => {
      const progress = accordionAnimations[type].value;
      // Clamp progress pour éviter overshoot négatif
      const clampedProgress = Math.min(Math.max(progress, 0), 1.1);
      return {
        height: interpolate(clampedProgress, [0, 1, 1.1], [0, CONTENT_MAX_HEIGHT, CONTENT_MAX_HEIGHT * 1.02]),
        opacity: interpolate(clampedProgress, [0, 0.2, 1], [0, 0.7, 1]),
        transform: [
          { translateY: interpolate(clampedProgress, [0, 1], [-20, 0]) },
          { scale: interpolate(clampedProgress, [0, 0.8, 1, 1.05], [0.95, 0.98, 1, 1.01]) },
        ],
      };
    });
    
    // Animated chevron rotation
    const animatedChevronStyle = useAnimatedStyle(() => {
      const progress = accordionAnimations[type].value;
      return {
        transform: [
          { rotate: `${interpolate(progress, [0, 1], [0, 180])}deg` },
        ],
      };
    });

    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={[
            styles.accordionHeader,
            isOpen && styles.accordionHeaderOpen,
            hasSelection && styles.accordionHeaderSelected,
            disabled && styles.accordionHeaderDisabled,
          ]}
          onPress={() => !disabled && toggleAccordion(type)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <View style={[styles.accordionIcon, hasSelection && styles.accordionIconSelected]}>
            {hasSelection && selectedItems[0] && PROFILE_LOGOS[selectedItems[0].id] ? (
              <Image 
                source={PROFILE_LOGOS[selectedItems[0].id]} 
                style={styles.accordionLogoImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name={icon as any}
                size={22}
                color={hasSelection ? Colors.white : Colors.primary}
              />
            )}
          </View>
          <Text style={[
            styles.accordionLabel,
            hasSelection && styles.accordionLabelSelected,
            disabled && styles.accordionLabelDisabled,
          ]}>
            {hasSelection ? selectedItems.map(p => p.name).join(', ') : label}
          </Text>
          {hasSelection && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selectedItems.length}</Text>
            </View>
          )}
          <Animated.View style={animatedChevronStyle}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={disabled ? Colors.textLight : Colors.textSecondary}
            />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View style={[styles.accordionContentAnimated, animatedContentStyle]}>
          <View style={styles.accordionContentInner}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par nom ou numéro"
                placeholderTextColor={Colors.textLight}
                value={searchQueries[type]}
                onChangeText={(text) =>
                  setSearchQueries(prev => ({ ...prev, [type]: text }))
                }
              />
              {searchQueries[type].length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQueries(prev => ({ ...prev, [type]: '' }))}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.resultsList} nestedScrollEnabled>
              {filteredItems.length === 0 ? (
                <Text style={styles.noResults}>Aucun résultat</Text>
              ) : (
                filteredItems.map(item => {
                  const isSelected = selectedProfiles.some(p => p.id === item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.resultItem,
                        isSelected && styles.resultItemSelected,
                      ]}
                      onPress={() => handleSelectItem(type, item.id, item.name)}
                    >
                      <Text style={[
                        styles.resultText,
                        isSelected && styles.resultTextSelected,
                      ]}>
                        {item.name}
                      </Text>
                      {item.numero && (
                        <Text style={styles.resultNumero}>{item.numero}</Text>
                      )}
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Fonction spéciale pour l'accordéon Équipe avec logique club → équipe (sélection unique)
  const renderEquipeAccordion = () => {
    const isOpen = openAccordion === 'equipe';
    const selectedEquipes = getSelectedForType('equipe');
    const hasEquipeSelection = selectedEquipes.length > 0;
    
    // Club sélectionné dans l'accordéon Équipe
    const activeClub = equipeClubSelected ? MOCK_DATA.club.find(c => c.id === equipeClubSelected) : null;
    
    // Liste à afficher : clubs si pas de club actif, sinon équipes
    const showClubs = !activeClub;
    const displayItems = showClubs ? MOCK_DATA.club : MOCK_DATA.equipe;
    const searchQuery = searchQueries.equipe.toLowerCase();
    const filteredItems = displayItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery) ||
      item.numero.toLowerCase().includes(searchQuery)
    );

    const animatedContentStyle = useAnimatedStyle(() => {
      const progress = accordionAnimations.equipe.value;
      return {
        height: interpolate(progress, [0, 1], [0, CONTENT_MAX_HEIGHT + 40]),
        opacity: interpolate(progress, [0, 0.3, 1], [0, 0.5, 1]),
        transform: [{ translateY: interpolate(progress, [0, 1], [-15, 0]) }],
      };
    });

    const animatedChevronStyle = useAnimatedStyle(() => {
      const progress = accordionAnimations.equipe.value;
      return {
        transform: [{ rotate: `${interpolate(progress, [0, 1], [0, 180])}deg` }],
      };
    });

    // Sélection d'un club → affiche le club dans le titre et passe aux équipes
    const handleSelectClubForEquipe = (club: typeof MOCK_DATA.club[0]) => {
      setEquipeClubSelected(club.id);
      setSearchQueries(prev => ({ ...prev, equipe: '' }));
    };

    // Retour à la liste des clubs
    const handleBackToClubs = () => {
      setEquipeClubSelected(null);
      setSearchQueries(prev => ({ ...prev, equipe: '' }));
    };

    // Sélection d'une équipe → "équipe - club" dans le titre, ferme l'accordéon
    const handleSelectEquipe = (equipe: typeof MOCK_DATA.equipe[0]) => {
      // Vérifier la limite de 30 profils
      if (selectedProfiles.length >= 30) {
        Alert.alert('Limite atteinte', 'Vous ne pouvez pas avoir plus de 30 profils.');
        return;
      }
      
      const profileName = `${equipe.name} - ${activeClub?.name}`;
      const equipeProfile: UserProfile = {
        id: `${equipeClubSelected}_${equipe.id}_${Date.now()}`, // ID unique avec timestamp
        name: profileName,  // Format: "équipe - club"
        type: 'equipe',
        numero: equipe.numero,
        clubId: equipeClubSelected || undefined,
      };
      
      // ACCUMULER les équipes (pas de remplacement)
      setLocalSelectedProfiles(prev => [...prev, equipeProfile]);
      
      // Fermer l'accordéon
      toggleAccordion('equipe');
      
      // Réinitialiser la sélection du club
      setEquipeClubSelected(null);
      
      // Afficher le popup de confirmation
      setLastCreatedEquipeName(profileName);
      setTimeout(() => {
        setShowEquipeCreatedModal(true);
      }, 300);
    };

    // Titre dynamique : "équipe - club" si sélectionné, sinon "club" si actif, sinon "Une Équipe"
    const getAccordionTitle = () => {
      if (hasEquipeSelection) {
        return selectedEquipes[0].name;  // "équipe - club"
      }
      if (activeClub) {
        return activeClub.name;  // Affiche le club sélectionné
      }
      return 'Une Équipe';
    };

    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={[
            styles.accordionHeader,
            isOpen && styles.accordionHeaderOpen,
            hasEquipeSelection && styles.accordionHeaderSelected,
          ]}
          onPress={() => toggleAccordion('equipe')}
          activeOpacity={0.7}
        >
          <View style={[styles.accordionIcon, hasEquipeSelection && styles.accordionIconSelected]}>
            {/* Pour équipe: afficher le logo du club si une équipe est sélectionnée */}
            {hasEquipeSelection && selectedEquipes[0]?.clubId && PROFILE_LOGOS[selectedEquipes[0].clubId] ? (
              <Image 
                source={PROFILE_LOGOS[selectedEquipes[0].clubId]} 
                style={styles.accordionLogoImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="people-outline" size={22} color={hasEquipeSelection ? Colors.white : Colors.primary} />
            )}
          </View>
          <Text style={[styles.accordionLabel, hasEquipeSelection && styles.accordionLabelSelected]} numberOfLines={1}>
            {getAccordionTitle()}
          </Text>
          <Animated.View style={animatedChevronStyle}>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View style={[styles.accordionContentAnimated, animatedContentStyle]}>
          <View style={styles.accordionContentInner}>
            {/* Indicateur d'étape - bandeau bleu avec le club sélectionné */}
            {activeClub && (
              <TouchableOpacity style={styles.equipeClubBadge} onPress={handleBackToClubs}>
                <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                <Text style={styles.equipeClubBadgeText}>{activeClub.name}</Text>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
            
            {!activeClub && (
              <Text style={styles.equipeStepHint}>Choisissez d'abord un club</Text>
            )}

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={showClubs ? "Rechercher un club" : "Rechercher une équipe"}
                placeholderTextColor={Colors.textLight}
                value={searchQueries.equipe}
                onChangeText={(text) => setSearchQueries(prev => ({ ...prev, equipe: text }))}
              />
              {searchQueries.equipe.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQueries(prev => ({ ...prev, equipe: '' }))}>
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.resultsList} nestedScrollEnabled>
              {filteredItems.length === 0 ? (
                <Text style={styles.noResults}>Aucun résultat</Text>
              ) : (
                filteredItems.map(item => {
                  if (showClubs) {
                    // Afficher les clubs (sans celui déjà sélectionné dans le titre)
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => handleSelectClubForEquipe(item)}
                      >
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultNumero}>N° {item.numero}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
                      </TouchableOpacity>
                    );
                  } else {
                    // Afficher les équipes
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => handleSelectEquipe(item)}
                      >
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultNumero}>{item.numero === 'M' ? 'Masculin' : 'Féminin'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                })
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    );
  };

  const handlePickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour importer un logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSponsorLogo(result.assets[0].uri);
      
      // Fermer l'accordéon après import si le nom est renseigné
      if (sponsorName.trim().length > 0) {
        setTimeout(() => {
          accordionAnimations.sponsor.value = withTiming(0, {
            duration: ANIMATION_DURATION,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          setOpenAccordion(null);
        }, 300);
      }
    }
  };

  const handleRemoveLogo = () => {
    setSponsorLogo(null);
  };

  const renderSponsorAccordion = () => {
    const isOpen = openAccordion === 'sponsor';
    const hasSponsor = sponsorName.trim().length > 0;
    
    // Animated styles for content - increased height for full content
    const animatedContentStyle = useAnimatedStyle(() => {
      const progress = accordionAnimations.sponsor.value;
      return {
        height: interpolate(progress, [0, 1], [0, 320]),
        opacity: interpolate(progress, [0, 0.3, 1], [0, 0.5, 1]),
        transform: [
          { translateY: interpolate(progress, [0, 1], [-15, 0]) },
        ],
      };
    });
    
    // Animated chevron rotation
    const animatedChevronStyle = useAnimatedStyle(() => {
      const progress = accordionAnimations.sponsor.value;
      return {
        transform: [
          { rotate: `${interpolate(progress, [0, 1], [0, 180])}deg` },
        ],
      };
    });

    return (
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={[
            styles.accordionHeader,
            isOpen && styles.accordionHeaderOpen,
            hasSponsor && styles.accordionHeaderSelected,
          ]}
          onPress={() => {
            toggleAccordion('sponsor');
            // Scroll to bottom when opening sponsor accordion
            if (!isOpen) {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 400);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.accordionIcon, hasSponsor && styles.accordionIconSelected, { backgroundColor: hasSponsor ? '#FFFFFF' : Colors.warning + '15' }]}>
            {hasSponsor && sponsorLogo ? (
              <Image 
                source={{ uri: sponsorLogo }} 
                style={styles.accordionLogoImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name="business"
                size={22}
                color={hasSponsor ? Colors.white : Colors.warning}
              />
            )}
          </View>
          <Text style={[
            styles.accordionLabel,
            hasSponsor && styles.accordionLabelSelected,
          ]}>
            {hasSponsor ? sponsorName : 'Un Sponsor'}
          </Text>
          <Animated.View style={animatedChevronStyle}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={Colors.textSecondary}
            />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View style={[styles.accordionContentAnimated, animatedContentStyle]}>
          <View style={styles.sponsorContentInner}>
            {/* Nom du sponsor */}
            <Text style={styles.sponsorHintTitle}>
              Entrez le nom de votre marque ou structure
            </Text>
            <View style={styles.searchContainer}>
              <Ionicons name="business-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Nom de la marque / structure"
                placeholderTextColor={Colors.textLight}
                value={sponsorName}
                onChangeText={setSponsorName}
                onFocus={() => {
                  // Scroll to show input - scroll a bit less to keep title visible
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 400, animated: true });
                  }, 100);
                }}
              />
            </View>

            {/* Import Logo */}
            <Text style={styles.sponsorHintTitle}>
              Importez le logo de votre organisation
            </Text>
            
            {sponsorLogo ? (
              <View style={styles.logoPreviewWrapper}>
                <View style={styles.logoPreviewContainer}>
                  <Image 
                    source={{ uri: sponsorLogo }} 
                    style={styles.logoPreview}
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity 
                  style={styles.removeLogo}
                  onPress={handleRemoveLogo}
                >
                  <Ionicons name="close-circle" size={28} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.importLogoBtn}
                onPress={handlePickLogo}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={Colors.primary} />
                <Text style={styles.importLogoText}>Importer (PNG ou JPG)</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/* Fond statique */}
      <View style={styles.bgWrapper}>
        <ImageBackground
          source={require('../assets/images/fond_blocs.png')}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </View>

      {/* Logo animé - zIndex bas pour passer sous la card */}
      <AnimatedProfileLogo />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {/* Header avec bouton retour et titre */}
          <View style={styles.cardHeader}>
            <TouchableOpacity 
              style={styles.backButtonCircle}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Mes</Text>
              <Text style={styles.titleLine2}>Comptes</Text>
            </View>
          </View>
            {selectedProfiles.length > 0 && (
              <View style={styles.selectedCount}>
                <Text style={styles.selectedCountText}>
                  {selectedProfiles.length} profil{selectedProfiles.length > 1 ? 's' : ''} sélectionné{selectedProfiles.length > 1 ? 's' : ''} (max 25 personnalisés)
                </Text>
              </View>
            )}

            {/* Liste des profils sélectionnés avec suppression (tous supprimables) */}
            {selectedProfiles.length > 0 && (
              <View style={styles.selectedProfilesList}>
                {selectedProfiles.map((profile) => (
                  <View key={profile.id} style={styles.selectedProfileItem}>
                    <View style={styles.selectedProfileInfo}>
                      <Ionicons 
                        name={
                          profile.type === 'equipe' ? 'people-outline' :
                          profile.type === 'club' ? 'shield-outline' :
                          profile.type === 'district' ? 'map-outline' :
                          profile.type === 'ligue' ? 'globe-outline' :
                          'business-outline'
                        } 
                        size={16} 
                        color={Colors.primary} 
                      />
                      <Text style={styles.selectedProfileName} numberOfLines={1}>{profile.name}</Text>
                    </View>
                    {/* Tous les profils sont supprimables */}
                    <TouchableOpacity 
                      style={styles.deleteProfileBtn}
                      onPress={() => {
                        setLocalSelectedProfiles(prev => prev.filter(p => p.id !== profile.id));
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionLabel}>Je suis...</Text>

            {/* Ordre: Équipe, Club, District, Ligue */}
            {renderEquipeAccordion()}
            {renderAccordion('club', 'Un Club', 'shield-outline')}
            {renderAccordion('district', 'Un District', 'map-outline')}
            {renderAccordion('ligue', 'Une Ligue', 'globe-outline')}

            {/* Espace supplémentaire avant Sponsor (+5px) */}
            <View style={{ height: 5 }} />

            {/* Sponsor */}
            {renderSponsorAccordion()}

            {/* Bouton "Ajouter un profil" intégré dans le bloc */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity 
                style={styles.addProfileInlineBtn}
                onPress={() => setShowAddProfileModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addProfileInlineGradient}
                >
                  <Ionicons name="add-circle" size={22} color={Colors.white} />
                  <Text style={styles.addProfileInlineText}>Ajouter un profil</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Bouton Enregistrer/Continuer - toujours visible */}
            <TouchableOpacity 
              style={styles.saveButtonFull}
              onPress={handleContinue}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Enregistrer' : 'Continuer'}
              </Text>
              <Ionicons 
                name={isEditing ? 'checkmark' : 'arrow-forward'} 
                size={18} 
                color={Colors.white} 
              />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Padding pour le clavier */}
          <View style={{ height: 40 }} />
        </ScrollView>
        
        {/* Modal de sélection du type de profil */}
        <Modal
          visible={showAddProfileModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddProfileModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddProfileModal(false)}
          >
            <Animated.View style={styles.addProfileModalContent}>
              <Text style={styles.addProfileModalTitle}>Quel type de profil ?</Text>
              <Text style={styles.addProfileModalSubtitle}>Choisissez le type à ajouter</Text>
              
              <View style={styles.profileTypeGrid}>
                {PROFILE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.profileTypeCard, { borderColor: type.color + '40' }]}
                    onPress={() => handleSelectProfileType(type.id as AccordionType)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.profileTypeIcon, { backgroundColor: type.color + '15' }]}>
                      <Ionicons name={type.icon as any} size={28} color={type.color} />
                    </View>
                    <Text style={styles.profileTypeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.cancelModalBtn}
                onPress={() => setShowAddProfileModal(false)}
              >
                <Text style={styles.cancelModalText}>Annuler</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
        
        {/* Modal de confirmation après création de profil équipe */}
        <Modal
          visible={showEquipeCreatedModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEquipeCreatedModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.equipeCreatedModal}>
              <View style={styles.equipeCreatedIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.equipeCreatedTitle}>Profil créé !</Text>
              <Text style={styles.equipeCreatedName}>"{lastCreatedEquipeName}"</Text>
              <Text style={styles.equipeCreatedQuestion}>
                Voulez-vous créer un autre profil d'équipe ?
              </Text>
              
              <View style={styles.equipeCreatedButtons}>
                <TouchableOpacity 
                  style={styles.equipeCreatedBtnNo}
                  onPress={() => setShowEquipeCreatedModal(false)}
                >
                  <Text style={styles.equipeCreatedBtnNoText}>Non</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.equipeCreatedBtnYes}
                  onPress={() => {
                    setShowEquipeCreatedModal(false);
                    // Ouvrir l'accordéon équipe
                    setTimeout(() => {
                      if (openAccordion !== 'equipe') {
                        toggleAccordion('equipe');
                      }
                    }, 200);
                  }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.equipeCreatedBtnYesGradient}
                  >
                    <Text style={styles.equipeCreatedBtnYesText}>Oui</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
    overflow: 'hidden',
  },
  bgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    width: width,      // Taille écran
    height: height,    // Taille écran
    top: 0,
    left: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,  // Au-dessus du logo (zIndex 1)
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,  // Limité à 10px
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    marginTop: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 100,
    zIndex: 200,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: Spacing.md,
    marginTop: 2,
  },
  titleLine1: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  titleLine2: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  selectedCount: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  selectedCountText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '400',   // Normal, pas gras
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  sectionSeparator: {
    height: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  accordionContainer: {
    marginBottom: Spacing.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accordionHeaderOpen: {
    borderColor: Colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  accordionHeaderSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  accordionHeaderDisabled: {
    opacity: 0.5,
  },
  accordionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accordionIconSelected: {
    backgroundColor: Colors.primary,
  },
  accordionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  accordionLabelSelected: {
    color: Colors.primary,
  },
  accordionLabelDisabled: {
    color: Colors.textLight,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  accordionContent: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: Colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: Spacing.md,
  },
  accordionContentAnimated: {
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: Colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  accordionContentInner: {
    padding: Spacing.md,
  },
  sponsorContentInner: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  resultsList: {
    maxHeight: 180,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginBottom: 2,
  },
  resultItemSelected: {
    backgroundColor: Colors.primary + '10',
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  resultTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  resultNumero: {
    fontSize: 12,
    color: Colors.textLight,
    marginRight: Spacing.sm,
  },
  noResults: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  disabledHint: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: Spacing.md,
  },
  sponsorHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  sponsorHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  importLogoBtn: {
    flexDirection: 'column',  // Vertical pour carré
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    width: 120,       // Taille fixe
    height: 120,      // Taille fixe
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  importLogoText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  logoPreviewWrapper: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  logoPreviewContainer: {
    width: 120,       // Même taille que importLogoBtn
    height: 120,      // Même taille que importLogoBtn
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
  },
  removeLogo: {
    position: 'absolute',
    top: -10,
    right: '20%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmSponsorBtn: {
    backgroundColor: Colors.warning,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  confirmSponsorText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  continueButton: {
    marginTop: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    gap: Spacing.xs,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: Spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: Spacing.xs,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  singleContinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  singleContinueButtonText: {
    fontSize: 13,         // Augmenté d'un corps
    fontWeight: '300',    // Léger
    color: Colors.white,
    letterSpacing: 0.5,
  },
  // Styles pour l'accordéon Équipe
  accordionLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',  // Fond blanc
  },
  equipeClubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',  // Bleu foncé
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  equipeClubBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',  // Texte blanc sur fond bleu
    fontWeight: '500',
    flex: 1,
  },
  equipeStepHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Bouton sticky "Ajouter un profil"
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
  addProfileStickyBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  addProfileStickyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  // Bouton Enregistrer pleine largeur
  saveButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  // Modal Ajouter un profil
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  addProfileModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  addProfileModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  addProfileModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  profileTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  profileTypeCard: {
    width: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
  },
  profileTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profileTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cancelModalBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // Bouton "Ajouter un profil" inline (dans le bloc principal)
  addProfileInlineBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addProfileInlineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  addProfileInlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  // Modal confirmation équipe créée
  equipeCreatedModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  equipeCreatedIcon: {
    marginBottom: Spacing.md,
  },
  equipeCreatedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  equipeCreatedName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  equipeCreatedQuestion: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  equipeCreatedButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  equipeCreatedBtnNo: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipeCreatedBtnNoText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  equipeCreatedBtnYes: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  equipeCreatedBtnYesGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipeCreatedBtnYesText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  // Liste des profils sélectionnés
  selectedProfilesList: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.sm,
  },
  selectedProfileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  selectedProfileName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  deleteProfileBtn: {
    padding: 6,
    marginLeft: 8,
  },
});
