import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ASStrasbourgDataService, ASDocument } from '../../services/asStrasbourgDataService';
import { ASStrasbourgClubDataService, ASClubDocument } from '../../services/asStrasbourgClubDataService';
import { LGEFDataService, LGEFDocument } from '../../services/lgefDataService';
import { NormandieDataService, NormandieDocument } from '../../services/normandieDataService';
import { AlsaceDataService, AlsaceDocument } from '../../services/alsaceDataService';
import { useDocumentStore } from '../../stores/documentStore';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
  SlideInDown,
  SlideOutDown,
  Layout,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Types pour les tailles d'affichage
type DisplaySize = 'small' | 'medium' | 'large'; // 8 docs, 4 docs, 2 docs
type SortOption = 'brouillons' | 'prets' | 'publies' | null;
type SponsorFilter = 'sponsored' | 'not_sponsored' | null;

// Configuration des tailles de cartes
const CARD_CONFIGS: Record<DisplaySize, { height: number; columns: number }> = {
  small: { height: 90, columns: 1 },    // 8 docs - petites cartes
  medium: { height: 120, columns: 1 },  // 4 docs - taille actuelle (défaut)
  large: { height: 180, columns: 1 },   // 2 docs - grandes cartes
};

const MOCKUP_WIDTH_PERCENT = 0.5; // 50% de la largeur de la carte

// Types
type DocumentStatus = 'brouillon' | 'en-cours' | 'pret' | 'publie';

// Type unifié pour les documents (équipe, club ou ligue)
type UnifiedDocument = ASDocument | ASClubDocument | LGEFDocument | NormandieDocument | AlsaceDocument;

interface Profile {
  id: string;
  name: string;
  type: 'equipe' | 'club' | 'ligue';
  logo: any; // require() pour l'image du logo
}

// Profils disponibles avec leurs logos
const PROFILES: Profile[] = [
  { id: 'seniors1', name: 'AS Strasbourg - Séniors 1', type: 'equipe', logo: require('../../assets/images/logo AS Strasbourg.png') },
  { id: 'club', name: 'AS Strasbourg (Club)', type: 'club', logo: require('../../assets/images/logo AS Strasbourg.png') },
  { id: 'lgef', name: 'Ligue LGEF', type: 'ligue', logo: require('../../assets/images/logo LGEF ligue grand est.png') },
  { id: 'normandie', name: 'Ligue Normandie', type: 'ligue', logo: require('../../assets/images/logo ligue normandie.png') },
  { id: 'alsace', name: 'Ligue Alsace', type: 'ligue', logo: require('../../assets/images/logo district alsace.png') },
];

// Couleurs de fond pour les mockups (fallback)
const MOCKUP_COLORS = [
  ['#3B82F6', '#1D4ED8'],
  ['#10B981', '#047857'],
  ['#F59E0B', '#D97706'],
  ['#EF4444', '#DC2626'],
  ['#8B5CF6', '#6D28D9'],
];

// Composant Spinner animé
const Spinner = ({ size = 20, color = '#F59E0B' }: { size?: number; color?: string }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="reload-outline" size={size} color={color} />
    </Animated.View>
  );
};

// Fonction pour obtenir des plateformes aléatoires pour les documents publiés
const getRandomPlatforms = (): string[] => {
  const allPlatforms = ['facebook', 'instagram', 'linkedin', 'post', 'affiche', 'reel'];
  const count = Math.floor(Math.random() * 3) + 1; // 1 à 3 plateformes
  const shuffled = [...allPlatforms].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Composant Étoile de sponsoring
const SponsorBadge = ({ amount }: { amount: number }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.sponsorBadge, animatedStyle]}>
      <Ionicons name="star" size={12} color="#FFD700" />
      <Text style={styles.sponsorAmount}>{amount}€</Text>
    </Animated.View>
  );
};

// Composant Indicateur d'État (cercle clignotant ou icône)
const StatusIndicator = ({ status }: { status: DocumentStatus }) => {
  const colorAnim = useSharedValue(0);

  useEffect(() => {
    if (status === 'en-cours') {
      // Animation de clignotement vert/rouge
      colorAnim.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => {
    // Interpoler entre vert (#22C55E) et rouge (#EF4444)
    return {
      backgroundColor: colorAnim.value < 0.5 ? '#22C55E' : '#EF4444',
    };
  });

  // Brouillon: pas d'indicateur
  if (status === 'brouillon') return null;

  // En cours: cercle qui clignote vert/rouge
  if (status === 'en-cours') {
    return (
      <Animated.View style={[styles.statusCircle, animatedStyle]} />
    );
  }

  // Prêt: cercle vert fixe
  if (status === 'pret') {
    return <View style={[styles.statusCircle, styles.statusReady]} />;
  }

  // Publié: icône
  if (status === 'publie') {
    return (
      <View style={styles.statusIconContainer}>
        <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
      </View>
    );
  }

  return null;
};

// Composant Stats (likes, vues, etc.)
const StatsRow = ({ stats }: { stats: { views: number; likes: number; shares: number; platforms: string[] } }) => {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Ionicons name="eye-outline" size={14} color="#6B7280" />
        <Text style={styles.statValue}>{stats.views}</Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="heart" size={14} color="#EF4444" />
        <Text style={styles.statValue}>{stats.likes}</Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="share-social-outline" size={14} color="#6B7280" />
        <Text style={styles.statValue}>{stats.shares}</Text>
      </View>
      <View style={styles.platformIcons}>
        {stats.platforms.map((p, i) => (
          <Ionicons 
            key={i} 
            name={p === 'facebook' ? 'logo-facebook' : p === 'instagram' ? 'logo-instagram' : 'globe-outline'} 
            size={12} 
            color="#6B7280" 
            style={{ marginLeft: i > 0 ? 4 : 0 }}
          />
        ))}
      </View>
    </View>
  );
};

// Composant Document Card - Nouvelle structure avec 4 lignes
const DocumentCard = ({ 
  doc, 
  onPress,
  index,
  displaySize = 'medium',
}: { 
  doc: ASDocument; 
  onPress: () => void;
  index: number; // Index pour l'animation Tetris
  displaySize?: DisplaySize;
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(SCREEN_HEIGHT); // Commence hors de l'écran (en bas)
  const opacity = useSharedValue(0);
  
  const cardHeight = CARD_CONFIGS[displaySize].height;

  // Animation d'entrée Tetris avec délai basé sur l'index
  useEffect(() => {
    const delay = index * 100; // 100ms entre chaque carte
    
    // Animation de glissement du bas vers le haut avec rebond
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 12,      // Rebond modéré
        stiffness: 100,   // Vitesse de ressort
        mass: 0.8,        // Légèreté
        overshootClamping: false, // Permet le dépassement (rebond)
      })
    );
    
    // Fade in avec le même délai
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    );
  }, [index]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.documentCard, { height: cardHeight }, animatedStyle]}>
        {/* Mockup à gauche - 50% de la largeur */}
        <View style={[styles.mockupContainer, { height: cardHeight }]}>
          <Image 
            source={doc.mockupImage} 
            style={styles.mockupImage} 
            resizeMode="cover" 
          />
        </View>

        {/* Infos à droite - Structure selon modèle XLS */}
        <View style={styles.documentInfo}>
          {/* Ligne 1A - Ligne 1B (ex: "Séniors 1 - 01/01/25") */}
          <Text style={[styles.ligne1, displaySize === 'small' && { fontSize: 9 }]}>{doc.ligne1}</Text>

          {/* Ligne 2 (ex: "Annoncer un match") */}
          <Text style={[styles.ligne2, displaySize === 'small' && { fontSize: 11 }]}>{doc.ligne2}</Text>

          {/* Ligne 3 (ex: "Championnat R3") - masqué en petit */}
          {displaySize !== 'small' && (
            <Text style={[styles.ligne3, displaySize === 'large' && { fontSize: 14 }]} numberOfLines={2}>{doc.ligne3}</Text>
          )}

          {/* Ligne 4 (ex: "ASS Strasbourg - FR Haguenau") - EN GRAS */}
          <Text style={[styles.ligne4, displaySize === 'small' && { fontSize: 10 }, displaySize === 'large' && { fontSize: 14 }]}>{doc.ligne4}</Text>

          {/* Indicateurs en bas à droite */}
          <View style={styles.bottomIndicators}>
            {doc.isSponsored && doc.sponsorPrice && (
              <SponsorBadge amount={doc.sponsorPrice} />
            )}
            <StatusIndicator status={doc.status} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// Fonction pour obtenir l'icône du type de document
const getDocTypeIcon = (typeLabel: string): string => {
  const label = typeLabel.toLowerCase();
  if (label.includes('match') && label.includes('annoncer')) return 'megaphone-outline';
  if (label.includes('résultat') || label.includes('resultat')) return 'trophy-outline';
  if (label.includes('liste')) return 'list-outline';
  if (label.includes('story')) return 'phone-portrait-outline';
  if (label.includes('événement') || label.includes('evenement')) return 'calendar-outline';
  return 'document-outline';
};

export default function CreerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // États
  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile>(PROFILES[0]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSearchQuery, setFilterSearchQuery] = useState(''); // Recherche dans le modal filtre
  
  // Nouveaux états pour les filtres selon le mockup
  const [displaySize, setDisplaySize] = useState<DisplaySize>('medium'); // Défaut = 4 docs
  const [sortOption, setSortOption] = useState<SortOption>(null);
  const [sponsorFilter, setSponsorFilter] = useState<SponsorFilter>(null);

  // Charger les documents selon le profil sélectionné
  const loadDocuments = useCallback(() => {
    setIsLoading(true);
    if (selectedProfile.id === 'seniors1') {
      const allDocs = ASStrasbourgDataService.getAllDocuments();
      setDocuments(allDocs);
    } else if (selectedProfile.id === 'club') {
      const allDocs = ASStrasbourgClubDataService.getAllDocuments();
      setDocuments(allDocs);
    } else if (selectedProfile.id === 'lgef') {
      const allDocs = LGEFDataService.getAllDocuments();
      setDocuments(allDocs);
    } else if (selectedProfile.id === 'normandie') {
      const allDocs = NormandieDataService.getAllDocuments();
      setDocuments(allDocs);
    } else if (selectedProfile.id === 'alsace') {
      const allDocs = AlsaceDataService.getAllDocuments();
      setDocuments(allDocs);
    }
    setIsLoading(false);
  }, [selectedProfile]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Ouvrir un document
  const handleDocumentPress = (doc: UnifiedDocument) => {
    // Naviguer vers les détails du document
    router.push(`/document/${doc.id}`);
  };

  // Refresh
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadDocuments();
      setIsRefreshing(false);
    }, 1000);
  }, [loadDocuments]);

  // Filtrer les documents par recherche et filtres
  const filteredDocuments = documents.filter(doc => {
    // Filtre recherche (combiné header + modal)
    const activeSearchQuery = filterSearchQuery || searchQuery;
    const searchText = `${doc.ligne1} ${doc.ligne2} ${doc.ligne3} ${doc.ligne4}`.toLowerCase();
    if (activeSearchQuery && !searchText.includes(activeSearchQuery.toLowerCase())) {
      return false;
    }
    // Filtre tri (statut)
    if (sortOption === 'brouillons' && doc.status !== 'brouillon') {
      return false;
    }
    if (sortOption === 'prets' && doc.status !== 'pret') {
      return false;
    }
    if (sortOption === 'publies' && doc.status !== 'publie') {
      return false;
    }
    // Filtre sponsorisé
    if (sponsorFilter === 'sponsored' && !doc.isSponsored) {
      return false;
    }
    if (sponsorFilter === 'not_sponsored' && doc.isSponsored) {
      return false;
    }
    return true;
  });
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilterSearchQuery('');
    setDisplaySize('medium');
    setSortOption(null);
    setSponsorFilter(null);
  };
  
  // Appliquer la recherche du modal et fermer
  const applyFilterSearch = () => {
    setSearchQuery(filterSearchQuery);
  };

  // Render document item avec animation Tetris
  const renderDocument = ({ item, index }: { item: UnifiedDocument; index: number }) => (
    <DocumentCard 
      doc={item as ASDocument} 
      onPress={() => handleDocumentPress(item)}
      index={index}
      displaySize={displaySize}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        {/* Header row avec logo W, titre et éléments */}
        <View style={styles.headerTopRow}>
          {/* Logo W à gauche */}
          <View style={styles.logoWContainer}>
            <Image
              source={require('../../assets/images/logo_W.png')}
              style={styles.logoW}
              resizeMode="contain"
            />
          </View>
          
          {/* Sélecteur de profil centré avec logo réel du compte actif */}
          <TouchableOpacity 
            style={styles.profileSelectorCenter}
            onPress={() => setShowProfileModal(true)}
          >
            <Image 
              source={selectedProfile.logo} 
              style={styles.profileLogoImage} 
              resizeMode="contain"
            />
            <Text style={styles.profileNameHeader} numberOfLines={1}>{selectedProfile.name}</Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Espace vide à droite pour équilibrer */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Barre de recherche + Filtre */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
            testID="filter-button"
          >
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Liste des documents avec animation Tetris */}
      <FlatList
        key={`${selectedProfile.id}-${displaySize}`} // Force re-render pour rejouer l'animation
        data={filteredDocuments}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun document trouvé</Text>
          </View>
        }
      />

      {/* Modal sélection profil */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner un profil</Text>
            {PROFILES.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.clubOption,
                  selectedProfile.id === profile.id && styles.clubOptionSelected
                ]}
                onPress={() => {
                  setSelectedProfile(profile);
                  setShowProfileModal(false);
                }}
              >
                <Ionicons 
                  name={profile.type === 'club' ? 'business' : profile.type === 'ligue' ? 'globe' : 'people'} 
                  size={20} 
                  color={selectedProfile.id === profile.id ? Colors.primary : '#6B7280'} 
                />
                <Text style={[
                  styles.clubOptionText,
                  selectedProfile.id === profile.id && styles.clubOptionTextSelected
                ]}>
                  {profile.name}
                </Text>
                {selectedProfile.id === profile.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Modal Filtre - Design Gaming */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.filterModalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <Animated.View 
            entering={SlideInDown.duration(400).springify().damping(15)}
            style={styles.filterModalContent}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Handle bar gaming style */}
              <View style={styles.filterModalHandle}>
                <View style={styles.filterModalHandleBar} />
              </View>
              
              {/* Section 1: Rechercher */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Rechercher</Text>
                <View style={styles.filterSearchRow}>
                  <View style={styles.filterSearchInputContainer}>
                    <Ionicons name="search" size={18} color="#6B7280" />
                    <TextInput
                      style={styles.filterSearchInput}
                      placeholder="Rechercher un document..."
                      placeholderTextColor="#9CA3AF"
                      value={filterSearchQuery}
                      onChangeText={setFilterSearchQuery}
                      returnKeyType="search"
                      onSubmitEditing={applyFilterSearch}
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.filterSearchOkButton}
                    onPress={applyFilterSearch}
                  >
                    <Text style={styles.filterSearchOkText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Section 2: Afficher */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Afficher</Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      displaySize === 'small' && styles.filterChipSelected
                    ]}
                    onPress={() => setDisplaySize('small')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      displaySize === 'small' && styles.filterChipTextSelected
                    ]}>8 docs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      displaySize === 'medium' && styles.filterChipSelected
                    ]}
                    onPress={() => setDisplaySize('medium')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      displaySize === 'medium' && styles.filterChipTextSelected,
                      displaySize === 'medium' && { fontWeight: '700' }
                    ]}>4 docs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      displaySize === 'large' && styles.filterChipSelected
                    ]}
                    onPress={() => setDisplaySize('large')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      displaySize === 'large' && styles.filterChipTextSelected
                    ]}>2 docs</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Section 3: Trier */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Trier</Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      sortOption === 'brouillons' && styles.filterChipSelected
                    ]}
                    onPress={() => setSortOption(sortOption === 'brouillons' ? null : 'brouillons')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      sortOption === 'brouillons' && styles.filterChipTextSelected
                    ]}>Brouillons</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      sortOption === 'prets' && styles.filterChipSelected
                    ]}
                    onPress={() => setSortOption(sortOption === 'prets' ? null : 'prets')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      sortOption === 'prets' && styles.filterChipTextSelected
                    ]}>Prêts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      sortOption === 'publies' && styles.filterChipSelected
                    ]}
                    onPress={() => setSortOption(sortOption === 'publies' ? null : 'publies')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      sortOption === 'publies' && styles.filterChipTextSelected
                    ]}>Publiés</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Section 4: Sponsoring */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sponsoring</Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      sponsorFilter === 'sponsored' && styles.filterChipSelectedGold
                    ]}
                    onPress={() => setSponsorFilter(sponsorFilter === 'sponsored' ? null : 'sponsored')}
                  >
                    <Ionicons 
                      name="star" 
                      size={14} 
                      color={sponsorFilter === 'sponsored' ? '#D97706' : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.filterChipText,
                      sponsorFilter === 'sponsored' && styles.filterChipTextSelectedGold
                    ]}>Docs sponsorisés</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      sponsorFilter === 'not_sponsored' && styles.filterChipSelected
                    ]}
                    onPress={() => setSponsorFilter(sponsorFilter === 'not_sponsored' ? null : 'not_sponsored')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      sponsorFilter === 'not_sponsored' && styles.filterChipTextSelected
                    ]}>Docs non sponsorisés</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Bouton Réinitialiser uniquement */}
              <TouchableOpacity 
                style={styles.filterResetButton} 
                onPress={resetFilters}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.filterResetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  // Header
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  clubSelectorCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  clubNameCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    maxWidth: 100,
  },
  // Nouveau header centré
  profileSelectorCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  profileLogoSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  profileNameHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: 180,
  },
  headerSpacer: {
    width: 40,
  },
  clubSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clubIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  clubName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Liste
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  // Document Card
  documentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  mockupContainer: {
    width: '50%', // 50% de la largeur de la carte
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  mockupImage: {
    width: '100%',
    height: '100%',
  },
  documentInfo: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  // Styles pour les 4 lignes de texte selon modèle XLS
  ligne1: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
  },
  ligne2: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 2,
  },
  ligne3: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    lineHeight: 16,
  },
  ligne4: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  bottomIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 'auto',
    gap: 8,
  },
  // Indicateur d'état (cercle)
  statusCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusReady: {
    backgroundColor: '#22C55E',
  },
  statusIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Sponsor Badge
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  sponsorAmount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  // Stats (gardés pour compatibilité)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  platformIcons: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  clubOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  clubOptionSelected: {
    backgroundColor: '#EBF5FF',
  },
  clubOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    marginLeft: 12,
  },
  clubOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Filter Modal - Gaming Style
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    width: '100%',
    // Gaming style glow effect
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  filterModalHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  filterModalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4B5563',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  filterSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  filterSearchOkButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    // Gaming glow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  filterSearchOkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  filterChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '30',
    // Gaming glow for selected
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipSelectedGold: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B30',
    // Gold glow for sponsoring
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterChipTextSelectedGold: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  filterResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    gap: 8,
    marginTop: 10,
  },
  filterResetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    marginTop: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  filterOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

