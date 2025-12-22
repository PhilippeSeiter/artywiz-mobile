import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  KeyboardAvoidingView,
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
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  Layout,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferencesStore, UserProfile, DEFAULT_BASE_PROFILES } from '../stores/userPreferencesStore';

const { width, height } = Dimensions.get('window');
const SLIDE_DURATION = 300;
const POPUP_WIDTH = Math.min(width - 32, 400); // Largeur du popup

// ============================================
// ANIMATED LOGO COMPONENT
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
    const halfCycleDuration = 1200;
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
  container: { position: 'absolute', top: 55, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  wrapper: { width: 220, height: 100, alignItems: 'center', justifyContent: 'flex-start' },
  part: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  partW: { top: 0, width: '100%', alignItems: 'center' },
  imageW: { width: 55, height: 39 },
  partArtywiz: { top: 36, width: '100%', alignItems: 'center' },
  imageArtywiz: { width: 154, height: 33 },
  partFootball: { top: 68, width: '100%', alignItems: 'center' },
  imageFootball: { width: 110, height: 22 },
});

// ============================================
// MOCK DATA
// ============================================
const MOCK_DATA = {
  ligue: [
    { id: 'ligue_1', name: 'Ligue Grand Est de Football', numero: 'LGEF' },
    { id: 'ligue_2', name: 'Ligue de Normandie de Football', numero: 'LNF' },
    { id: 'ligue_3', name: "Ligue d'Île-de-France de Football", numero: 'LIDF' },
    { id: 'ligue_4', name: 'Ligue Auvergne-Rhône-Alpes de Football', numero: 'LAURAF' },
  ],
  district: [
    { id: 'district_1', name: "District d'Alsace", numero: '67' },
    { id: 'district_2', name: 'District des Ardennes', numero: '08' },
    { id: 'district_3', name: "District de l'Aube", numero: '10' },
    { id: 'district_4', name: 'District de la Marne', numero: '51' },
    { id: 'district_5', name: 'District de Meurthe-et-Moselle', numero: '54' },
    { id: 'district_6', name: 'District de Moselle', numero: '57' },
  ],
  club: [
    { id: 'club_1', name: 'AS Strasbourg', numero: '500001' },
    { id: 'club_2', name: 'ASL Robertsau', numero: '500002' },
    { id: 'club_3', name: 'Club sportif Orne Amnéville', numero: '570001' },
    { id: 'club_4', name: 'ASPTT Metz', numero: '570002' },
    { id: 'club_5', name: 'Football Club de Metz', numero: '570005' },
    { id: 'club_6', name: 'Association sportive mulhousienne', numero: '680001' },
    { id: 'club_7', name: 'FC Kogenheim', numero: '670001' },
    { id: 'club_8', name: 'Olympique Charleville', numero: '080001' },
  ],
  equipe: [
    { id: 'equipe_1', name: 'U11', numero: 'M', sexe: 'Masculin' },
    { id: 'equipe_2', name: 'U13', numero: 'M', sexe: 'Masculin' },
    { id: 'equipe_3', name: 'U15', numero: 'M', sexe: 'Masculin' },
    { id: 'equipe_4', name: 'U17', numero: 'M', sexe: 'Masculin' },
    { id: 'equipe_5', name: 'U19', numero: 'M', sexe: 'Masculin' },
    { id: 'equipe_6', name: 'Séniors', numero: 'M', sexe: 'Masculin' },
    { id: 'equipe_7', name: 'Vétérans', numero: 'M', sexe: 'Masculin' },
    { id: 'equipe_8', name: 'U13F', numero: 'F', sexe: 'Féminin' },
    { id: 'equipe_9', name: 'U15F', numero: 'F', sexe: 'Féminin' },
    { id: 'equipe_10', name: 'SéniorsF', numero: 'F', sexe: 'Féminin' },
  ],
};

const ACCOUNT_TYPES = [
  { id: 'equipe', label: 'Créer un compte équipe', icon: 'people', color: '#6366F1' },
  { id: 'club', label: 'Créer un compte club', icon: 'shield', color: '#0EA5E9' },
  { id: 'district', label: 'Créer un compte district', icon: 'map', color: '#10B981' },
  { id: 'ligue', label: 'Créer un compte ligue', icon: 'globe', color: '#8B5CF6' },
];

// ============================================
// ACCOUNT CARD
// ============================================
const AccountCard = ({ account, index, isActive, onPress, onDelete, canDelete }: {
  account: UserProfile; index: number; isActive: boolean; onPress: () => void; onDelete: () => void; canDelete: boolean;
}) => {
  const scale = useSharedValue(1);
  const getTypeIcon = (type: string) => {
    switch(type) { case 'equipe': return 'people'; case 'club': return 'shield'; case 'district': return 'map'; case 'ligue': return 'globe'; default: return 'person'; }
  };
  const getTypeColor = (type: string) => {
    switch(type) { case 'equipe': return '#6366F1'; case 'club': return '#0EA5E9'; case 'district': return '#10B981'; case 'ligue': return '#8B5CF6'; default: return Colors.primary; }
  };
  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const typeColor = getTypeColor(account.type);

  return (
    <Animated.View layout={Layout.springify().damping(15)} style={animatedStyle}>
      <TouchableOpacity style={[styles.accountCard, isActive && styles.accountCardActive, isActive && { borderColor: typeColor }]} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <View style={[styles.accountLogo, { backgroundColor: typeColor + '20' }]}>
          <Ionicons name={getTypeIcon(account.type) as any} size={24} color={typeColor} />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName} numberOfLines={1}>{account.name}</Text>
          <Text style={styles.accountType}>{account.type === 'equipe' ? 'Équipe' : account.type === 'club' ? 'Club' : account.type === 'district' ? 'District' : 'Ligue'}</Text>
        </View>
        {isActive && <View style={[styles.activeBadge, { backgroundColor: typeColor }]}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
        {/* Bouton supprimer - seulement si on peut supprimer (pas le dernier compte) */}
        {canDelete ? (
          <TouchableOpacity style={styles.deleteButton} onPress={(e) => { e.stopPropagation(); onDelete(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.deleteButtonPlaceholder} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// ADD BUTTON
// ============================================
const AddAccountButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })), -1, true);
  }, []);

  const handlePressIn = () => { rotation.value = withSpring(90, { damping: 10, stiffness: 200 }); };
  const handlePressOut = () => { rotation.value = withSpring(0, { damping: 12, stiffness: 150 }); };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }] }));

  return (
    <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={styles.addButtonContainer}>
      <Animated.View style={[styles.addButton, animatedStyle]}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.addButtonGradient}>
          <Ionicons name="add" size={40} color="#FFF" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.addButtonLabel}>Ajouter un compte</Text>
    </TouchableOpacity>
  );
};

// ============================================
// UNIFIED POPUP WITH HORIZONTAL SLIDE
// ============================================
type PopupStep = 'types' | 'search_club' | 'search_team' | 'search_single';

interface UnifiedPopupProps {
  visible: boolean;
  onClose: () => void;
  onAccountCreated: (account: UserProfile) => void;
}

const UnifiedPopup = ({ visible, onClose, onAccountCreated }: UnifiedPopupProps) => {
  const [step, setStep] = useState<PopupStep>('types');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset when opening
  useEffect(() => {
    if (visible) {
      setStep('types');
      setSelectedType('');
      setSelectedClub(null);
      setSearchQuery('');
    }
  }, [visible]);

  // Slide transition - simplified
  const slideToNext = (nextStep: PopupStep) => {
    setStep(nextStep);
    setSearchQuery('');
  };

  const slideBack = (prevStep: PopupStep) => {
    setStep(prevStep);
    setSearchQuery('');
  };

  // Handlers
  const handleSelectType = (type: string) => {
    setSelectedType(type);
    if (type === 'equipe') {
      slideToNext('search_club');
    } else {
      slideToNext('search_single');
    }
  };

  const handleSelectClub = (club: any) => {
    setSelectedClub(club);
    slideToNext('search_team');
  };

  const handleSelectTeam = (team: any) => {
    const newAccount: UserProfile = {
      id: `equipe_${Date.now()}`,
      type: 'equipe',
      name: `${team.name} - ${selectedClub?.name}`,
      clubId: selectedClub?.id,
    };
    onAccountCreated(newAccount);
    onClose();
  };

  const handleSelectSingle = (item: any) => {
    const newAccount: UserProfile = {
      id: `${selectedType}_${Date.now()}`,
      type: selectedType as UserProfile['type'],
      name: item.name,
    };
    onAccountCreated(newAccount);
    onClose();
  };

  const handleBack = () => {
    if (step === 'search_team') {
      setSelectedClub(null);
      slideBack('search_club');
    } else if (step === 'search_club' || step === 'search_single') {
      setSelectedType('');
      slideBack('types');
    } else if (step === 'types') {
      // On est à l'étape initiale, fermer le popup
      onClose();
    }
  };

  // Get subtitle based on step
  const getSubtitle = () => {
    switch (step) {
      case 'types': return 'Quel type de compte souhaitez-vous créer ?';
      case 'search_club': return 'Choisissez le club de votre équipe';
      case 'search_team': return 'Choisissez votre équipe';
      case 'search_single':
        if (selectedType === 'club') return 'Choisissez votre club';
        if (selectedType === 'district') return 'Choisissez votre district';
        if (selectedType === 'ligue') return 'Choisissez votre ligue';
        return '';
      default: return '';
    }
  };

  // Get items for search
  const getItems = () => {
    if (step === 'search_club') return MOCK_DATA.club;
    if (step === 'search_team') return MOCK_DATA.equipe;
    if (step === 'search_single') return MOCK_DATA[selectedType as keyof typeof MOCK_DATA] || [];
    return [];
  };

  const items = getItems();
  const filteredItems = items.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.numero && item.numero.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const showBackButton = step !== 'types';

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={styles.popupOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.popupContainer}>
          {/* Header - Always visible, never slides */}
          <View style={styles.popupHeader}>
            {showBackButton ? (
              <TouchableOpacity style={styles.popupBackBtn} onPress={handleBack}>
                <Ionicons name="arrow-back" size={22} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={styles.popupTitle}>Créer un compte</Text>
            <TouchableOpacity style={styles.popupCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sliding content wrapper */}
          <View style={styles.popupSlideWrapper}>
            <View style={styles.popupSlideContent}>
              {/* Subtitle */}
              <Text style={styles.popupSubtitle}>{getSubtitle()}</Text>

              {/* Club badge when selecting team */}
              {step === 'search_team' && selectedClub && (
                <View style={styles.clubBadge}>
                  <Ionicons name="shield" size={16} color="#FFF" />
                  <Text style={styles.clubBadgeText}>{selectedClub.name}</Text>
                </View>
              )}

              {/* Content */}
              <View style={styles.popupContent}>

            {/* Étape 1: Choix du type de compte */}
            {step === 'types' && (
              <View style={styles.typesList}>
                {ACCOUNT_TYPES.map((type, index) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeItem, { borderLeftColor: type.color }]}
                    onPress={() => handleSelectType(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
                      <Ionicons name={type.icon as any} size={24} color={type.color} />
                    </View>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(step === 'search_club' || step === 'search_team' || step === 'search_single') && (
              <View style={styles.searchContent}>
                {/* Search input */}
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher..."
                    placeholderTextColor={Colors.textLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Results */}
                <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                  {filteredItems.length === 0 ? (
                    <Text style={styles.noResults}>Aucun résultat</Text>
                  ) : (
                    filteredItems.map((item: any) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.searchResultItem}
                        onPress={() => {
                          if (step === 'search_club') handleSelectClub(item);
                          else if (step === 'search_team') handleSelectTeam(item);
                          else handleSelectSingle(item);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultName}>{item.name}</Text>
                          <Text style={styles.searchResultNumero}>
                            {step === 'search_team' 
                              ? (item.sexe || (item.numero === 'M' ? 'Masculin' : 'Féminin'))
                              : `N° ${item.numero}`}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProfileSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedProfiles: existingProfiles, setSelectedProfiles, activeProfileIndex, setActiveProfile, hasCompletedOnboarding } = useUserPreferencesStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const getRealAccounts = (profiles: UserProfile[]) => profiles.filter(p => !p.id.startsWith('base_'));
  const [accounts, setAccounts] = useState<UserProfile[]>(getRealAccounts(existingProfiles));
  const [activeAccountId, setActiveAccountId] = useState<string | null>(accounts.length > 0 ? accounts[activeProfileIndex]?.id || accounts[0]?.id : null);
  const [showPopup, setShowPopup] = useState(false);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  // Auto-redirect to dashboard if user has completed onboarding and has accounts
  useEffect(() => {
    if (!hasCheckedRedirect) {
      setHasCheckedRedirect(true);
      const realAccounts = getRealAccounts(existingProfiles);
      
      // If user has completed onboarding AND has accounts, go directly to dashboard
      if (hasCompletedOnboarding && realAccounts.length > 0) {
        console.log('[ProfileSelection] User has accounts and completed onboarding, redirecting to dashboard');
        router.replace('/(tabs)');
        return;
      }
    }
  }, [hasCompletedOnboarding, existingProfiles, hasCheckedRedirect]);

  useEffect(() => {
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 100, mass: 0.8 }));
  }, []);

  useEffect(() => {
    const realAccounts = getRealAccounts(existingProfiles);
    setAccounts(realAccounts);
    if (realAccounts.length > 0 && !activeAccountId) {
      setActiveAccountId(realAccounts[0].id);
    }
  }, [existingProfiles]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ translateY: cardTranslateY.value }] }));
  const isEditing = hasCompletedOnboarding;
  const hasAccounts = accounts.length > 0;

  const handleAccountCreated = (account: UserProfile) => {
    const newAccounts = [...accounts, account];
    setAccounts(newAccounts);
    setActiveAccountId(account.id);
    const baseProfiles = existingProfiles.filter(p => p.id.startsWith('base_'));
    setSelectedProfiles([...baseProfiles, ...newAccounts]);
  };

  const handleDeleteAccount = (accountId: string) => {
    Alert.alert('Supprimer le compte', 'Êtes-vous sûr de vouloir supprimer ce compte ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => {
          const newAccounts = accounts.filter(a => a.id !== accountId);
          setAccounts(newAccounts);
          if (activeAccountId === accountId && newAccounts.length > 0) setActiveAccountId(newAccounts[0].id);
          else if (newAccounts.length === 0) setActiveAccountId(null);
          const baseProfiles = existingProfiles.filter(p => p.id.startsWith('base_'));
          setSelectedProfiles([...baseProfiles, ...newAccounts]);
        },
      },
    ]);
  };

  const handleActivateAccount = (accountId: string) => {
    setActiveAccountId(accountId);
    const index = accounts.findIndex(a => a.id === accountId);
    if (index !== -1) setActiveProfile(index);
  };

  const handleContinue = () => {
    if (accounts.length === 0) {
      Alert.alert('Compte requis', 'Vous devez avoir au minimum 1 compte actif pour continuer.');
      return;
    }
    
    // Only save user's accounts (not default base profiles)
    setSelectedProfiles(accounts);
    setActiveProfile(0); // Set first account as active
    
    // Set default themes and complete onboarding
    const { setSelectedThemes, completeOnboarding } = useUserPreferencesStore.getState();
    setSelectedThemes([
      'match_com', 'community', 'marketing', 'events', 'sponsors',
      'ephemeride'
    ]);
    completeOnboarding();
    
    if (isEditing) {
      router.back();
    } else {
      // Go directly to dashboard
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
      <View style={styles.bgWrapper}>
        <ImageBackground source={require('../assets/images/fond_blocs.png')} style={styles.bgImage} resizeMode="cover" />
      </View>
      <AnimatedProfileLogo />

      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.backButtonCircle} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine1}>Mes</Text>
              <Text style={styles.titleLine2}>Comptes</Text>
            </View>
          </View>

          {/* Explanatory text - shown when no accounts exist */}
          {!hasAccounts && (
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.explanationContainer}>
              <Text style={styles.explanationText}>
                Gérez tous vos comptes depuis une seule application : équipe, club, district ou ligue.
              </Text>
              <Text style={styles.explanationText}>
                Cliquez sur le bouton + ci-dessous pour créer votre premier compte et commencer à communiquer.
              </Text>
            </Animated.View>
          )}

          {/* Account list */}
          {hasAccounts && (
            <View style={styles.accountsList}>
              {accounts.map((account, index) => (
                <AccountCard 
                  key={account.id} 
                  account={account} 
                  index={index} 
                  isActive={account.id === activeAccountId} 
                  onPress={() => handleActivateAccount(account.id)} 
                  onDelete={() => handleDeleteAccount(account.id)} 
                  canDelete={accounts.length > 1} // Ne peut supprimer que s'il y a plus d'1 compte
                />
              ))}
            </View>
          )}

          {/* Add button */}
          <AddAccountButton onPress={() => setShowPopup(true)} />

          {/* Continue button */}
          <TouchableOpacity style={[styles.continueButton, !hasAccounts && styles.continueButtonDisabled]} onPress={handleContinue} disabled={!hasAccounts}>
            <LinearGradient colors={hasAccounts ? ['#007BFF', '#0056CC'] : ['#CBD5E1', '#94A3B8']} style={styles.continueGradient}>
              <Text style={styles.continueText}>Continuer</Text>
              <View style={styles.continueArrow}>
                <Ionicons name={isEditing ? 'checkmark' : 'arrow-forward'} size={18} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Unified Popup */}
      <UnifiedPopup visible={showPopup} onClose={() => setShowPopup(false)} onAccountCreated={handleAccountCreated} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0066FF', overflow: 'hidden' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  bgImage: { position: 'absolute', width: width, height: height, top: 0, left: 0 },
  scrollView: { flex: 1, zIndex: 10 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: Spacing.xl, marginTop: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 100, zIndex: 200 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  backButtonCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  titleContainer: { marginLeft: Spacing.md, marginTop: 2 },
  titleLine1: { fontSize: 20, fontWeight: '300', color: Colors.textPrimary, lineHeight: 24 },
  titleLine2: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, lineHeight: 24 },
  explanationContainer: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: Spacing.lg, marginBottom: Spacing.lg, alignItems: 'center' },
  welcomeIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366F1' + '15', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  explanationText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm, textAlign: 'center' },
  explanationMinimum: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.sm },
  accountsList: { marginBottom: Spacing.lg },
  accountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 2, borderColor: 'transparent' },
  accountCardActive: { backgroundColor: '#EFF6FF', borderWidth: 2 },
  accountLogo: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  accountType: { fontSize: 13, color: Colors.textSecondary },
  activeBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  deleteButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  deleteButtonPlaceholder: { width: 40, height: 40 },
  addButtonContainer: { alignItems: 'center', marginVertical: Spacing.lg },
  addButton: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  addButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  addButtonLabel: { marginTop: Spacing.sm, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  continueButton: { borderRadius: 30, overflow: 'hidden', marginTop: Spacing.md },
  continueButtonDisabled: { opacity: 0.6 },
  continueGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: Spacing.sm },
  continueText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  continueArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  // Popup
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md },
  popupContainer: { backgroundColor: Colors.white, borderRadius: 24, width: POPUP_WIDTH, maxHeight: height * 0.75, overflow: 'hidden' },
  popupSlideWrapper: { flex: 1, minHeight: 300, overflow: 'hidden' },
  popupSlideContent: { width: POPUP_WIDTH, minHeight: 300 },
  popupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  popupBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  popupCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  popupTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  popupSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  popupContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  // Sports list
  sportsList: { gap: Spacing.sm },
  sportItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: Spacing.md },
  sportIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  sportLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  sportDisabled: { opacity: 0.5 },
  // Types list
  typesList: { gap: Spacing.sm },
  typeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: Spacing.md, borderLeftWidth: 4 },
  typeIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  typeLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  clubBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0EA5E9', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.xs },
  clubBadgeText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  searchContent: { minHeight: 300 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: Spacing.md },
  searchResults: { maxHeight: 280 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.sm },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  searchResultNumero: { fontSize: 13, color: Colors.textSecondary },
  noResults: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl },
});
