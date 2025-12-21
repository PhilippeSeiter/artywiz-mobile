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
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
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

    const halfCycleDuration = 1200;
    const easeConfig = { duration: halfCycleDuration, easing: Easing.inOut(Easing.ease) };

    scaleW.value = withRepeat(
      withSequence(
        withTiming(1.05, easeConfig),
        withTiming(0.95, easeConfig)
      ),
      -1,
      true
    );

    setTimeout(() => {
      scaleArtywiz.value = withRepeat(
        withSequence(
          withTiming(0.95, easeConfig),
          withTiming(1.05, easeConfig)
        ),
        -1,
        true
      );
    }, 500);

    setTimeout(() => {
      scaleFootball.value = withRepeat(
        withSequence(
          withTiming(1.05, easeConfig),
          withTiming(0.95, easeConfig)
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
    { id: 'ligue_1', name: 'Ligue Grand Est de Football', numero: 'LGEF', logo: require('../assets/images/logo LGEF ligue grand est.png') },
    { id: 'ligue_2', name: 'Ligue de Normandie de Football', numero: 'LNF', logo: require('../assets/images/logo ligue normandie.png') },
    { id: 'ligue_3', name: "Ligue d'Île-de-France de Football", numero: 'LIDF', logo: null },
    { id: 'ligue_4', name: 'Ligue Auvergne-Rhône-Alpes de Football', numero: 'LAURAF', logo: null },
  ],
  district: [
    { id: 'district_1', name: "District d'Alsace", numero: '67', logo: require('../assets/images/logo district alsace.png') },
    { id: 'district_2', name: 'District des Ardennes', numero: '08', logo: null },
    { id: 'district_3', name: "District de l'Aube", numero: '10', logo: null },
    { id: 'district_4', name: 'District de la Marne', numero: '51', logo: null },
    { id: 'district_5', name: 'District de Meurthe-et-Moselle', numero: '54', logo: null },
    { id: 'district_6', name: 'District de Moselle', numero: '57', logo: null },
  ],
  club: [
    { id: 'club_1', name: 'AS Strasbourg', numero: '500001', logo: require('../assets/images/logo AS Strasbourg.png') },
    { id: 'club_2', name: 'ASL Robertsau', numero: '500002', logo: null },
    { id: 'club_3', name: 'Club sportif Orne Amnéville', numero: '570001', logo: null },
    { id: 'club_4', name: 'ASPTT Metz', numero: '570002', logo: null },
    { id: 'club_5', name: 'Football Club de Metz', numero: '570005', logo: null },
    { id: 'club_6', name: 'Association sportive mulhousienne', numero: '680001', logo: null },
    { id: 'club_7', name: 'FC Kogenheim', numero: '670001', logo: null },
    { id: 'club_8', name: 'Olympique Charleville', numero: '080001', logo: null },
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

// Types de comptes
const ACCOUNT_TYPES = [
  { id: 'equipe', label: 'Créer un compte équipe', icon: 'people', color: '#6366F1', steps: 2 },
  { id: 'club', label: 'Créer un compte club', icon: 'shield', color: '#0EA5E9', steps: 1 },
  { id: 'district', label: 'Créer un compte district', icon: 'map', color: '#10B981', steps: 1 },
  { id: 'ligue', label: 'Créer un compte ligue', icon: 'globe', color: '#8B5CF6', steps: 1 },
];

// ============================================
// ANIMATED ACCOUNT CARD
// ============================================
interface AccountCardProps {
  account: UserProfile;
  index: number;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}

const AccountCard = ({ account, index, isActive, onPress, onDelete }: AccountCardProps) => {
  const scale = useSharedValue(1);
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'equipe': return 'people';
      case 'club': return 'shield';
      case 'district': return 'map';
      case 'ligue': return 'globe';
      default: return 'person';
    }
  };
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'equipe': return '#6366F1';
      case 'club': return '#0EA5E9';
      case 'district': return '#10B981';
      case 'ligue': return '#8B5CF6';
      default: return Colors.primary;
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const typeColor = getTypeColor(account.type);

  return (
    <Animated.View 
      entering={SlideInDown.delay(index * 80).springify().damping(14)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify().damping(15)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.accountCard,
          isActive && styles.accountCardActive,
          isActive && { borderColor: typeColor },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Logo ou icône */}
        <View style={[styles.accountLogo, { backgroundColor: typeColor + '20' }]}>
          <Ionicons name={getTypeIcon(account.type) as any} size={24} color={typeColor} />
        </View>
        
        {/* Info */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountName} numberOfLines={1}>{account.name}</Text>
          <Text style={styles.accountType}>
            {account.type === 'equipe' ? 'Équipe' : 
             account.type === 'club' ? 'Club' :
             account.type === 'district' ? 'District' : 'Ligue'}
          </Text>
        </View>
        
        {/* Badge actif */}
        {isActive && (
          <View style={[styles.activeBadge, { backgroundColor: typeColor }]}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
          </View>
        )}
        
        {/* Bouton supprimer */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// ADD BUTTON (Cercle +)
// ============================================
const AddAccountButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Subtle pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handlePressIn = () => {
    rotation.value = withSpring(90, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    rotation.value = withSpring(0, { damping: 12, stiffness: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.addButtonContainer}
    >
      <Animated.View style={[styles.addButton, animatedStyle]}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={40} color="#FFF" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.addButtonLabel}>Ajouter un compte</Text>
    </TouchableOpacity>
  );
};

// ============================================
// POPUP - SELECTION DU TYPE
// ============================================
interface TypeSelectionPopupProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
}

const TypeSelectionPopup = ({ visible, onClose, onSelectType }: TypeSelectionPopupProps) => {
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      contentScale.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );
      contentOpacity.value = withTiming(1, { duration: 150 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      contentScale.value = withTiming(0.8, { duration: 150 });
      contentOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.popupOverlay, overlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.popupContent, contentStyle]}>
          {/* Close button */}
          <TouchableOpacity style={styles.popupCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.popupTitle}>Nouveau compte</Text>
          <Text style={styles.popupSubtitle}>Quel type de compte souhaitez-vous créer ?</Text>
          
          <View style={styles.typeList}>
            {ACCOUNT_TYPES.map((type, index) => (
              <Animated.View 
                key={type.id}
                entering={SlideInDown.delay(index * 50).springify()}
              >
                <TouchableOpacity
                  style={[styles.typeItem, { borderLeftColor: type.color }]}
                  onPress={() => onSelectType(type.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
                    <Ionicons name={type.icon as any} size={24} color={type.color} />
                  </View>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ============================================
// POPUP - RECHERCHE ET SELECTION
// ============================================
interface SearchPopupProps {
  visible: boolean;
  type: string;
  step: number; // 1 = club selection (for equipe), 2 = team selection
  selectedClub?: typeof MOCK_DATA.club[0] | null;
  onClose: () => void;
  onSelectItem: (item: any) => void;
  onBack?: () => void;
}

const SearchPopup = ({ visible, type, step, selectedClub, onClose, onSelectItem, onBack }: SearchPopupProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const overlayOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      contentTranslateY.value = withSpring(0, { damping: 20, stiffness: 150 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      contentTranslateY.value = withTiming(height, { duration: 200 });
      setSearchQuery('');
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  // Déterminer les données à afficher
  const getItems = () => {
    if (type === 'equipe') {
      if (step === 1) {
        return MOCK_DATA.club;
      } else {
        return MOCK_DATA.equipe;
      }
    }
    return MOCK_DATA[type as keyof typeof MOCK_DATA] || [];
  };

  const items = getItems();
  const filteredItems = items.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.numero && item.numero.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Titre dynamique
  const getTitle = () => {
    if (type === 'equipe') {
      return step === 1 ? 'Choisissez le club de votre équipe' : 'Choisissez votre équipe';
    }
    switch(type) {
      case 'club': return 'Choisissez votre club';
      case 'district': return 'Choisissez votre district';
      case 'ligue': return 'Choisissez votre ligue';
      default: return 'Sélection';
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.popupOverlay, overlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.searchPopupContent, contentStyle]}>
          {/* Header */}
          <View style={styles.searchPopupHeader}>
            {step === 2 && onBack ? (
              <TouchableOpacity style={styles.searchBackBtn} onPress={onBack}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={styles.searchPopupTitle}>{getTitle()}</Text>
            <TouchableOpacity style={styles.popupCloseBtn2} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Club badge if step 2 */}
          {step === 2 && selectedClub && (
            <View style={styles.selectedClubBadge}>
              <Ionicons name="shield" size={16} color="#FFF" />
              <Text style={styles.selectedClubText}>{selectedClub.name}</Text>
            </View>
          )}

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

          {/* Results list */}
          <ScrollView style={styles.searchResultsList} showsVerticalScrollIndicator={false}>
            {filteredItems.length === 0 ? (
              <Text style={styles.noResultsText}>Aucun résultat</Text>
            ) : (
              filteredItems.map((item: any, index: number) => (
                <Animated.View
                  key={item.id}
                  entering={FadeIn.delay(index * 30)}
                >
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => onSelectItem(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      {item.numero && (
                        <Text style={styles.searchResultNumero}>
                          {type === 'equipe' && step === 2 
                            ? (item.sexe || (item.numero === 'M' ? 'Masculin' : 'Féminin'))
                            : `N° ${item.numero}`}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
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

  // Filter out base profiles and sponsor
  const getRealAccounts = (profiles: UserProfile[]) => {
    return profiles.filter(p => !p.id.startsWith('base_') && p.type !== 'sponsor');
  };

  const [accounts, setAccounts] = useState<UserProfile[]>(getRealAccounts(existingProfiles));
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    accounts.length > 0 ? accounts[activeProfileIndex]?.id || accounts[0]?.id : null
  );

  // Popup states
  const [showTypePopup, setShowTypePopup] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [currentType, setCurrentType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClubForEquipe, setSelectedClubForEquipe] = useState<typeof MOCK_DATA.club[0] | null>(null);

  // Animation
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

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

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const isEditing = hasCompletedOnboarding;
  const hasAccounts = accounts.length > 0;

  // Handlers
  const handleAddAccount = () => {
    setShowTypePopup(true);
  };

  const handleSelectType = (type: string) => {
    setShowTypePopup(false);
    setCurrentType(type);
    setCurrentStep(type === 'equipe' ? 1 : 1);
    setSelectedClubForEquipe(null);
    setTimeout(() => setShowSearchPopup(true), 200);
  };

  const handleSelectItem = (item: any) => {
    if (currentType === 'equipe') {
      if (currentStep === 1) {
        // Step 1: Club selected, go to step 2
        setSelectedClubForEquipe(item);
        setCurrentStep(2);
      } else {
        // Step 2: Team selected, create account
        const newAccount: UserProfile = {
          id: `equipe_${Date.now()}`,
          type: 'equipe',
          name: `${item.name} - ${selectedClubForEquipe?.name}`,
          clubId: selectedClubForEquipe?.id,
        };
        addAccount(newAccount);
        setShowSearchPopup(false);
        setSelectedClubForEquipe(null);
        setCurrentStep(1);
      }
    } else {
      // Single step for club, district, ligue
      const newAccount: UserProfile = {
        id: `${currentType}_${Date.now()}`,
        type: currentType as UserProfile['type'],
        name: item.name,
      };
      addAccount(newAccount);
      setShowSearchPopup(false);
    }
  };

  const handleBackToClubSelection = () => {
    setCurrentStep(1);
    setSelectedClubForEquipe(null);
  };

  const addAccount = (account: UserProfile) => {
    const newAccounts = [...accounts, account];
    setAccounts(newAccounts);
    setActiveAccountId(account.id);
    
    // Update store
    const baseProfiles = existingProfiles.filter(p => p.id.startsWith('base_') || p.type === 'sponsor');
    setSelectedProfiles([...baseProfiles, ...newAccounts]);
  };

  const handleDeleteAccount = (accountId: string) => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer ce compte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const newAccounts = accounts.filter(a => a.id !== accountId);
            setAccounts(newAccounts);
            
            // Update active if needed
            if (activeAccountId === accountId && newAccounts.length > 0) {
              setActiveAccountId(newAccounts[0].id);
            } else if (newAccounts.length === 0) {
              setActiveAccountId(null);
            }
            
            // Update store
            const baseProfiles = existingProfiles.filter(p => p.id.startsWith('base_') || p.type === 'sponsor');
            setSelectedProfiles([...baseProfiles, ...newAccounts]);
          },
        },
      ]
    );
  };

  const handleActivateAccount = (accountId: string) => {
    setActiveAccountId(accountId);
    const index = accounts.findIndex(a => a.id === accountId);
    if (index !== -1) {
      setActiveProfile(index);
    }
  };

  const handleContinue = () => {
    if (accounts.length === 0) {
      Alert.alert('Compte requis', 'Vous devez avoir au minimum 1 compte actif pour continuer.');
      return;
    }
    
    // Save to store
    const baseProfiles = existingProfiles.filter(p => p.id.startsWith('base_') || p.type === 'sponsor');
    setSelectedProfiles([...baseProfiles, ...accounts]);
    
    if (isEditing) {
      router.back();
    } else {
      router.push('/onboarding-themes');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/* Background */}
      <View style={styles.bgWrapper}>
        <ImageBackground
          source={require('../assets/images/fond_blocs.png')}
          style={styles.bgImage}
          resizeMode="cover"
        />
      </View>

      {/* Logo */}
      <AnimatedProfileLogo />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {/* Header */}
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

          {/* Explanatory text - only show if no accounts */}
          {!hasAccounts && (
            <Animated.View 
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.explanationContainer}
            >
              <Text style={styles.explanationText}>
                Artywiz vous permet de gérer plusieurs comptes (équipe, club, district, ligue…).
              </Text>
              <Text style={styles.explanationText}>
                Ajoutez vos profils et choisissez celui à utiliser.
              </Text>
              <Text style={styles.explanationMinimum}>
                Minimum : 1 compte actif pour démarrer.
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
                />
              ))}
            </View>
          )}

          {/* Add button */}
          <AddAccountButton onPress={handleAddAccount} />

          {/* Continue button */}
          <TouchableOpacity 
            style={[styles.continueButton, !hasAccounts && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!hasAccounts}
          >
            <LinearGradient
              colors={hasAccounts ? ['#007BFF', '#0056CC'] : ['#CBD5E1', '#94A3B8']}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>
                {isEditing ? 'Enregistrer' : 'Continuer'}
              </Text>
              <View style={styles.continueArrow}>
                <Ionicons name={isEditing ? 'checkmark' : 'arrow-forward'} size={18} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Type Selection Popup */}
      <TypeSelectionPopup
        visible={showTypePopup}
        onClose={() => setShowTypePopup(false)}
        onSelectType={handleSelectType}
      />

      {/* Search Popup */}
      <SearchPopup
        visible={showSearchPopup}
        type={currentType}
        step={currentStep}
        selectedClub={selectedClubForEquipe}
        onClose={() => {
          setShowSearchPopup(false);
          setCurrentStep(1);
          setSelectedClubForEquipe(null);
        }}
        onSelectItem={handleSelectItem}
        onBack={currentStep === 2 ? handleBackToClubSelection : undefined}
      />
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
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
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
  // Explanation
  explanationContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  explanationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  explanationHighlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: '#ECFDF5',
    padding: Spacing.md,
    borderRadius: 12,
  },
  explanationCheckmark: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  explanationHighlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    lineHeight: 20,
  },
  // Account cards
  accountsList: {
    marginBottom: Spacing.lg,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountCardActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  accountLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  accountType: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Add button
  addButtonContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonLabel: {
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // Continue button
  continueButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  continueArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Popup overlay
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  // Type selection popup
  popupContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
  },
  popupCloseBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  popupCloseBtn2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  popupSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  typeList: {
    gap: Spacing.sm,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  typeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Search popup
  searchPopupContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: height * 0.85,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  searchPopupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPopupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  selectedClubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0EA5E9',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  selectedClubText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  searchResultsList: {
    maxHeight: height * 0.5,
    paddingHorizontal: Spacing.lg,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  searchResultNumero: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
