import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  ImageBackground,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  interpolateColor,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  useUserPreferencesStore, 
  ARTYWIZ_THEMES, 
  GENERIC_THEMES,
} from '../stores/userPreferencesStore';

const { width, height } = Dimensions.get('window');

// ============================================
// ANIMATED LOGO COMPONENT - 3 parties
// ============================================
const AnimatedThemesLogo = () => {
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
    const halfCycleDuration = 1000;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };
    scaleW.value = withRepeat(withSequence(withTiming(1.05, easeConfig), withTiming(0.95, easeConfig)), -1, true);
    setTimeout(() => {
      scaleArtywiz.value = withRepeat(withSequence(withTiming(0.95, easeConfig), withTiming(1.05, easeConfig)), -1, true);
    }, 500);
    setTimeout(() => {
      scaleFootball.value = withRepeat(withSequence(withTiming(1.05, easeConfig), withTiming(0.95, easeConfig)), -1, true);
    }, 1000);
  }, []);

  useEffect(() => {
    opacityW.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    setTimeout(() => { opacityArtywiz.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }); }, 300);
    setTimeout(() => { opacityFootball.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }); }, 600);
    const timer = setTimeout(() => startAnimation(), 1000);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  const animatedStyleW = useAnimatedStyle(() => ({ opacity: opacityW.value, transform: [{ scale: scaleW.value }] }));
  const animatedStyleArtywiz = useAnimatedStyle(() => ({ opacity: opacityArtywiz.value, transform: [{ scale: scaleArtywiz.value }] }));
  const animatedStyleFootball = useAnimatedStyle(() => ({ opacity: opacityFootball.value, transform: [{ scale: scaleFootball.value }] }));

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
  container: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  wrapper: { width: 200, height: 90, alignItems: 'center', justifyContent: 'center' },
  part: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  partW: { top: 0, width: '100%', alignItems: 'center' },
  imageW: { width: 50, height: 35 },
  partArtywiz: { top: 32, width: '100%', alignItems: 'center' },
  imageArtywiz: { width: 140, height: 30 },
  partFootball: { top: 62, width: '100%', alignItems: 'center' },
  imageFootball: { width: 100, height: 20 },
});

// Animation du fond
const BG_SCALE_BASE = 1.0;
const BG_SCALE_AMPLITUDE = 0.02;
const BG_TRANSLATE_AMPLITUDE = width * 0.01;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ALL_THEMES = [...ARTYWIZ_THEMES, ...GENERIC_THEMES];

// Accordion animation config
const accordionAnimation = {
  duration: 350,
  create: { type: 'easeInEaseOut', property: 'opacity' },
  update: { type: 'easeInEaseOut' },
  delete: { type: 'easeInEaseOut', property: 'opacity' },
};

export default function OnboardingThemesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    selectedThemes: existingThemes,
    sponsoringPrefs: existingPrefs,
    hasCompletedOnboarding,
    selectedProfiles,
    activeProfileIndex,
    setSelectedThemes, 
    setSponsoringPrefs, 
    completeOnboarding 
  } = useUserPreferencesStore();

  // Profile selector state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(activeProfileIndex);
  
  // Get current profile
  const currentProfile = selectedProfiles[currentProfileIndex] || selectedProfiles[0];
  const isSponsorProfile = currentProfile?.type === 'sponsor';

  // Accordion state - null means both closed
  const [openAccordion, setOpenAccordion] = useState<'specific' | 'generic' | null>(null);

  // Preferences per profile
  const [preferencesPerProfile, setPreferencesPerProfile] = useState(() => {
    const initial = {};
    selectedProfiles.forEach(profile => {
      if (existingThemes && existingThemes.length > 0) {
        initial[profile.id || profile.name] = existingThemes;
      } else {
        if (profile.type === 'sponsor') {
          initial[profile.id || profile.name] = ['ephemeride'];
        } else {
          initial[profile.id || profile.name] = ARTYWIZ_THEMES.map(t => t.id);
        }
      }
    });
    return initial;
  });

  // Current profile's selected themes
  const currentProfileKey = currentProfile?.id || currentProfile?.name || 'default';
  const selectedThemeIds = preferencesPerProfile[currentProfileKey] || [];

  // Auto sponsoring
  const [autoSponsoring, setAutoSponsoring] = useState(existingPrefs?.autoSponsoringEnabled || false);
  const [pricePerDoc, setPricePerDoc] = useState(existingPrefs?.pricePerDoc || 10);

  // Animation du fond
  const bgScale = useSharedValue(BG_SCALE_BASE);
  const bgTranslateX = useSharedValue(0);
  const bgTranslateY = useSharedValue(0);
  
  // Animation de la carte
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  
  // Animation values
  const toggleProgress = useSharedValue(autoSponsoring ? 1 : 0);
  const toggleScale = useSharedValue(1);
  const contentHeight = useSharedValue(autoSponsoring ? 1 : 0);

  // Accordion animations
  const specificAccordionHeight = useSharedValue(0);
  const genericAccordionHeight = useSharedValue(0);
  const specificRotation = useSharedValue(0);
  const genericRotation = useSharedValue(0);
  
  // Start entry animations
  useEffect(() => {
    // Animation du fond
    bgScale.value = withRepeat(
      withSequence(
        withTiming(BG_SCALE_BASE + BG_SCALE_AMPLITUDE, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(BG_SCALE_BASE - BG_SCALE_AMPLITUDE, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    bgTranslateX.value = withRepeat(
      withSequence(
        withTiming(BG_TRANSLATE_AMPLITUDE, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-BG_TRANSLATE_AMPLITUDE, { duration: 10000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    bgTranslateY.value = withRepeat(
      withSequence(
        withTiming(-BG_TRANSLATE_AMPLITUDE * 0.5, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(BG_TRANSLATE_AMPLITUDE * 0.5, { duration: 12000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    // Animation de la carte
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100, mass: 0.8 }));
  }, []);

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }, { translateX: bgTranslateX.value }, { translateY: bgTranslateY.value }],
  }));
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  // Handle accordion toggle with sequential animation
  const handleAccordionToggle = useCallback((section) => {
    const isOpening = openAccordion !== section;
    const otherSection = section === 'specific' ? 'generic' : 'specific';
    
    if (isOpening && openAccordion !== null) {
      // Close the other accordion first
      if (openAccordion === 'specific') {
        specificAccordionHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
        specificRotation.value = withTiming(0, { duration: 250 });
      } else {
        genericAccordionHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
        genericRotation.value = withTiming(0, { duration: 250 });
      }
      
      // Then open the new one after a short delay
      setTimeout(() => {
        if (section === 'specific') {
          specificAccordionHeight.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
          specificRotation.value = withTiming(1, { duration: 350 });
        } else {
          genericAccordionHeight.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
          genericRotation.value = withTiming(1, { duration: 350 });
        }
        setOpenAccordion(section);
      }, 280);
    } else if (isOpening) {
      // Just open the section
      if (section === 'specific') {
        specificAccordionHeight.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
        specificRotation.value = withTiming(1, { duration: 350 });
      } else {
        genericAccordionHeight.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
        genericRotation.value = withTiming(1, { duration: 350 });
      }
      setOpenAccordion(section);
    } else {
      // Close the section
      if (section === 'specific') {
        specificAccordionHeight.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
        specificRotation.value = withTiming(0, { duration: 300 });
      } else {
        genericAccordionHeight.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
        genericRotation.value = withTiming(0, { duration: 300 });
      }
      setOpenAccordion(null);
    }
  }, [openAccordion]);

  // Animated styles for accordions
  const specificContentStyle = useAnimatedStyle(() => {
    const maxHeight = ARTYWIZ_THEMES.length * 70; // Approximate max height
    return {
      maxHeight: interpolate(specificAccordionHeight.value, [0, 1], [0, maxHeight]),
      opacity: specificAccordionHeight.value,
      overflow: 'hidden',
    };
  });

  const genericContentStyle = useAnimatedStyle(() => {
    const maxHeight = GENERIC_THEMES.length * 70;
    return {
      maxHeight: interpolate(genericAccordionHeight.value, [0, 1], [0, maxHeight]),
      opacity: genericAccordionHeight.value,
      overflow: 'hidden',
    };
  });

  const specificChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(specificRotation.value, [0, 1], [0, 180])}deg` }],
  }));

  const genericChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(genericRotation.value, [0, 1], [0, 180])}deg` }],
  }));

  // Toggle animation for auto-sponsoring
  const handleToggleAutoSponsoring = () => {
    const newValue = !autoSponsoring;
    
    toggleScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1.1, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    
    toggleProgress.value = withSpring(newValue ? 1 : 0, {
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    });
    
    contentHeight.value = withTiming(newValue ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    
    setAutoSponsoring(newValue);
  };
  
  const animatedToggleContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      toggleProgress.value,
      [0, 1],
      [Colors.border, Colors.primary]
    ),
    transform: [{ scale: toggleScale.value }],
  }));
  
  const animatedToggleThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(toggleProgress.value, [0, 1], [2, 26]) },
      { scale: interpolate(toggleProgress.value, [0, 0.5, 1], [1, 1.2, 1]) },
    ],
  }));
  
  const animatedContentStyle = useAnimatedStyle(() => ({
    height: interpolate(contentHeight.value, [0, 1], [0, 120]),
    opacity: interpolate(contentHeight.value, [0, 0.5, 1], [0, 0.5, 1]),
    transform: [{ translateY: interpolate(contentHeight.value, [0, 1], [-20, 0]) }],
  }));

  const isEditing = hasCompletedOnboarding;

  // Check if all themes are selected
  const allSpecificSelected = useMemo(() => {
    return ARTYWIZ_THEMES.every(theme => selectedThemeIds.includes(theme.id));
  }, [selectedThemeIds]);

  const allGenericSelected = useMemo(() => {
    return GENERIC_THEMES.every(theme => selectedThemeIds.includes(theme.id));
  }, [selectedThemeIds]);

  // Count selected themes per category
  const specificSelectedCount = useMemo(() => {
    return ARTYWIZ_THEMES.filter(t => selectedThemeIds.includes(t.id)).length;
  }, [selectedThemeIds]);

  const genericSelectedCount = useMemo(() => {
    return GENERIC_THEMES.filter(t => selectedThemeIds.includes(t.id)).length;
  }, [selectedThemeIds]);

  const toggleTheme = (themeId) => {
    setPreferencesPerProfile(prev => {
      const currentThemes = prev[currentProfileKey] || [];
      const newThemes = currentThemes.includes(themeId)
        ? currentThemes.filter(id => id !== themeId)
        : [...currentThemes, themeId];
      return { ...prev, [currentProfileKey]: newThemes };
    });
  };

  const toggleSelectAllSpecific = () => {
    setPreferencesPerProfile(prev => {
      const currentThemes = prev[currentProfileKey] || [];
      const specificIds = ARTYWIZ_THEMES.map(t => t.id);
      if (allSpecificSelected) {
        return { ...prev, [currentProfileKey]: currentThemes.filter(id => !specificIds.includes(id)) };
      } else {
        return { ...prev, [currentProfileKey]: [...new Set([...currentThemes, ...specificIds])] };
      }
    });
  };

  const toggleSelectAllGeneric = () => {
    setPreferencesPerProfile(prev => {
      const currentThemes = prev[currentProfileKey] || [];
      const genericIds = GENERIC_THEMES.map(t => t.id);
      if (allGenericSelected) {
        return { ...prev, [currentProfileKey]: currentThemes.filter(id => !genericIds.includes(id)) };
      } else {
        return { ...prev, [currentProfileKey]: [...new Set([...currentThemes, ...genericIds])] };
      }
    });
  };

  const getProfileIcon = (type) => {
    switch (type) {
      case 'ligue': return 'globe';
      case 'district': return 'map';
      case 'club': return 'shield';
      case 'equipe': return 'people';
      case 'sponsor': return 'briefcase';
      default: return 'person';
    }
  };

  const getProfileTypeLabel = (type) => {
    switch (type) {
      case 'ligue': return 'Ligue';
      case 'district': return 'District';
      case 'club': return 'Club';
      case 'equipe': return 'Équipe';
      case 'sponsor': return 'Sponsor';
      default: return type;
    }
  };

  const handleSwitchProfile = (index) => {
    setCurrentProfileIndex(index);
    setShowProfileModal(false);
  };

  const handleSave = () => {
    const allProfilesHaveThemes = selectedProfiles.every(profile => {
      const key = profile.id || profile.name;
      const themes = preferencesPerProfile[key] || [];
      return themes.length > 0;
    });

    if (!allProfilesHaveThemes) {
      Alert.alert('Sélection requise', 'Chaque profil doit avoir au moins une thématique sélectionnée.');
      return;
    }

    const allSelectedThemes = Object.values(preferencesPerProfile).flat();
    const uniqueThemes = [...new Set(allSelectedThemes)];
    
    console.log('[OnboardingThemes] Saving themes:', uniqueThemes.length, uniqueThemes);
    setSelectedThemes(uniqueThemes);
    
    console.log('[OnboardingThemes] Saving sponsoring prefs');
    setSponsoringPrefs({
      autoSponsoringEnabled: autoSponsoring,
      pricePerDoc: pricePerDoc,
      maxSponsorsPerDoc: 5,
    });
    
    if (!hasCompletedOnboarding) {
      console.log('[OnboardingThemes] Completing onboarding');
      completeOnboarding();
    }

    // Petit délai pour s'assurer que la persistance est effectuée
    setTimeout(() => {
      if (isEditing) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }, 100);
  };

  const renderThemeItem = (theme) => {
    const isSelected = selectedThemeIds.includes(theme.id);
    return (
      <TouchableOpacity
        key={theme.id}
        style={[styles.themeItem, isSelected && styles.themeItemSelected]}
        onPress={() => toggleTheme(theme.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.themeIcon, isSelected && styles.themeIconSelected]}>
          <Ionicons
            name={theme.icon}
            size={18}
            color={isSelected ? Colors.white : Colors.primary}
          />
        </View>
        <Text style={[styles.themeName, isSelected && styles.themeNameSelected]}>
          {theme.name}
        </Text>
        <Ionicons 
          name={isSelected ? "checkbox" : "square-outline"} 
          size={20} 
          color={isSelected ? Colors.primary : Colors.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Fond animé */}
      <Animated.View style={[styles.bgWrapper, bgAnimatedStyle]}>
        <ImageBackground
          source={require('../assets/images/fond_blocs.png')}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Logo animé */}
      <AnimatedThemesLogo />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xxl 
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.mainCard, cardAnimatedStyle]}>
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
              <Text style={styles.titleLine2}>Préférences</Text>
            </View>
          </View>

          {/* Profile Selector */}
          <TouchableOpacity 
            style={styles.profileSelector}
            onPress={() => setShowProfileModal(true)}
          >
            <View style={styles.profileSelectorIcon}>
              <Ionicons 
                name={getProfileIcon(currentProfile?.type || 'club')} 
                size={20} 
                color={Colors.primary} 
              />
            </View>
            <View style={styles.profileSelectorInfo}>
              <Text style={styles.profileSelectorLabel}>Profil actif</Text>
              <Text style={styles.profileSelectorName}>{currentProfile?.name || 'Mon profil'}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Accordion 1: Thématiques spécifiques */}
          <View style={styles.accordionCard}>
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => handleAccordionToggle('specific')}
            activeOpacity={0.7}
          >
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={(e) => {
                e.stopPropagation();
                toggleSelectAllSpecific();
              }}
            >
              <Ionicons 
                name={allSpecificSelected ? "checkbox" : "square-outline"} 
                size={24} 
                color={allSpecificSelected ? Colors.primary : Colors.textSecondary} 
              />
            </TouchableOpacity>
            <View style={styles.accordionTitleContainer}>
              <Text style={styles.accordionTitle}>Thématiques spécifiques</Text>
              <Text style={styles.accordionSubtitle}>
                {specificSelectedCount}/{ARTYWIZ_THEMES.length} sélectionnées
              </Text>
            </View>
            <Animated.View style={specificChevronStyle}>
              <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={specificContentStyle}>
            <View style={styles.themesList}>
              {ARTYWIZ_THEMES.map(renderThemeItem)}
            </View>
          </Animated.View>
        </View>

          {/* Accordion 2: Thématiques génériques */}
          <View style={[styles.accordionCard, styles.cardSpacing]}>
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => handleAccordionToggle('generic')}
            activeOpacity={0.7}
          >
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={(e) => {
                e.stopPropagation();
                toggleSelectAllGeneric();
              }}
            >
              <Ionicons 
                name={allGenericSelected ? "checkbox" : "square-outline"} 
                size={24} 
                color={allGenericSelected ? Colors.primary : Colors.textSecondary} 
              />
            </TouchableOpacity>
            <View style={styles.accordionTitleContainer}>
              <Text style={styles.accordionTitle}>Thématiques génériques</Text>
              <Text style={styles.accordionSubtitle}>
                {genericSelectedCount}/{GENERIC_THEMES.length} sélectionnées
              </Text>
            </View>
            <Animated.View style={genericChevronStyle}>
              <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={genericContentStyle}>
            <View style={styles.themesList}>
              {GENERIC_THEMES.map(renderThemeItem)}
            </View>
          </Animated.View>
        </View>

          {/* Block 3: Auto-sponsoring - Hidden for sponsor profiles */}
          {!isSponsorProfile && (
            <View style={[styles.accordionCard, styles.cardSpacing]}>
            <View style={styles.autoSponsoringHeader}>
              <View style={styles.autoSponsoringTitleContainer}>
                <Text style={styles.blockTitle}>Auto-sponsoring</Text>
                {!autoSponsoring && (
                  <Text style={styles.autoSponsoringHint}>
                    Activez l&apos;autosponsoring pour booster vos recettes club !
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={handleToggleAutoSponsoring}
                activeOpacity={0.8}
              >
                <Animated.View style={[styles.toggleContainer, animatedToggleContainerStyle]}>
                  <Animated.View style={[styles.toggleThumb, animatedToggleThumbStyle]} />
                </Animated.View>
              </TouchableOpacity>
            </View>

            <Animated.View style={[styles.priceSectionAnimated, animatedContentStyle]}>
              <View style={styles.priceLabelRow}>
                <Text style={styles.priceLabel}>Tarif pour 1 logo sponsor</Text>
              </View>
              <View style={styles.priceControls}>
                <TouchableOpacity 
                  style={styles.priceButton}
                  onPress={() => setPricePerDoc(prev => Math.max(1, prev - 1))}
                >
                  <Ionicons name="remove" size={20} color={Colors.white} />
                </TouchableOpacity>
                
                <View style={styles.priceValueContainer}>
                  <TextInput
                    style={styles.priceValue}
                    value={String(pricePerDoc)}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setPricePerDoc(Math.max(1, num));
                    }}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={styles.priceCurrency}>€</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.priceButton}
                  onPress={() => setPricePerDoc(prev => prev + 1)}
                >
                  <Ionicons name="add" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}

          {/* Bouton Continuer uniquement */}
          <TouchableOpacity 
            style={styles.singleButton}
            onPress={handleSave}
          >
            <Text style={styles.singleButtonText}>{isEditing ? 'Enregistrer' : 'Continuer'}</Text>
            <Ionicons name={isEditing ? "checkmark" : "arrow-forward"} size={18} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Profile Selector Modal */}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un profil</Text>
            <View style={styles.profilesList}>
              {selectedProfiles.map((profile, index) => {
                const profileKey = profile.id || profile.name;
                const themesCount = (preferencesPerProfile[profileKey] || []).length;
                return (
                  <TouchableOpacity
                    key={profile.id || index}
                    style={[
                      styles.profileItem,
                      index === currentProfileIndex && styles.profileItemActive
                    ]}
                    onPress={() => handleSwitchProfile(index)}
                  >
                    <View style={[
                      styles.profileItemIcon,
                      index === currentProfileIndex && styles.profileItemIconActive
                    ]}>
                      <Ionicons 
                        name={getProfileIcon(profile.type)} 
                        size={20} 
                        color={index === currentProfileIndex ? Colors.white : Colors.primary} 
                      />
                    </View>
                    <View style={styles.profileItemInfo}>
                      <Text style={styles.profileItemName}>{profile.name}</Text>
                      <Text style={styles.profileItemType}>
                        {getProfileTypeLabel(profile.type)} • {themesCount} thématique{themesCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    {index === currentProfileIndex && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
    zIndex: 10,  // Au-dessus du logo (zIndex 1)
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  mainCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    marginTop: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 100,
    zIndex: 200, // Par-dessus le logo
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
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
  accordionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerLogo: {
    width: 36,
    height: 36,
    marginRight: Spacing.md,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardSpacing: {
    marginTop: Spacing.md,
  },
  // Accordion styles
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkboxContainer: {
    padding: Spacing.xs,
  },
  accordionTitleContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  accordionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  themesList: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  themeItemSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  themeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  themeIconSelected: {
    backgroundColor: Colors.primary,
  },
  themeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  themeNameSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  // Auto-sponsoring
  autoSponsoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  autoSponsoringTitleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  autoSponsoringHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  toggleContainer: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  priceSectionAnimated: {
    marginTop: Spacing.sm,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
  },
  priceLabelRow: {
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  priceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  priceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 10,
    minWidth: 70,
    maxWidth: 90,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    minWidth: 35,
    maxWidth: 50,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 2,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    gap: Spacing.xs,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  singleButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  singleButtonText: {
    fontSize: 13,         // Harmonisé
    fontWeight: '300',    // Léger
    color: Colors.white,
    marginRight: Spacing.xs,
    letterSpacing: 0.5,
  },
  // Profile Selector
  profileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  profileSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  profileSelectorInfo: {
    flex: 1,
  },
  profileSelectorLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  profileSelectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  profilesList: {},
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
