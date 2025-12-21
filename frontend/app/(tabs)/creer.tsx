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
import { useDocumentStore } from '../../stores/documentStore';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 120;
const MOCKUP_WIDTH_PERCENT = 0.5; // 50% de la largeur de la carte

// Types
type DocumentStatus = 'brouillon' | 'en-cours' | 'pret' | 'publie';

// Type unifié pour les documents (équipe, club ou ligue)
type UnifiedDocument = ASDocument | ASClubDocument | LGEFDocument;

interface Profile {
  id: string;
  name: string;
  type: 'equipe' | 'club' | 'ligue';
}

// Profils disponibles
const PROFILES: Profile[] = [
  { id: 'seniors1', name: 'AS Strasbourg - Séniors 1', type: 'equipe' },
  { id: 'club', name: 'AS Strasbourg (Club)', type: 'club' },
  { id: 'lgef', name: 'Ligue LGEF', type: 'ligue' },
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
}: { 
  doc: ASDocument; 
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.documentCard, animatedStyle]}>
        {/* Mockup à gauche - 50% de la largeur */}
        <View style={styles.mockupContainer}>
          <Image 
            source={doc.mockupImage} 
            style={styles.mockupImage} 
            resizeMode="cover" 
          />
        </View>

        {/* Infos à droite - 50% de la largeur avec 4 lignes */}
        <View style={styles.documentInfo}>
          {/* Header avec indicateurs */}
          <View style={styles.docHeader}>
            {/* Ligne 1: Date */}
            <Text style={styles.ligne1}>{doc.ligne1}</Text>
            <View style={styles.rightIndicators}>
              {doc.isSponsored && doc.sponsorPrice && (
                <SponsorBadge amount={doc.sponsorPrice} />
              )}
              <StatusIndicator status={doc.status} />
            </View>
          </View>

          {/* Ligne 2: Type de document */}
          <Text style={styles.ligne2} numberOfLines={1}>{doc.ligne2}</Text>

          {/* Ligne 3: Description / Compétition */}
          <Text style={styles.ligne3} numberOfLines={2}>{doc.ligne3}</Text>

          {/* Ligne 4: Équipe ou info complémentaire */}
          <Text style={styles.ligne4} numberOfLines={1}>{doc.ligne4}</Text>

          {/* Nombre de supports disponibles */}
          <View style={styles.supportsRow}>
            <Ionicons name="layers-outline" size={12} color="#9CA3AF" />
            <Text style={styles.supportsCount}>{doc.supports.length} support(s)</Text>
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
  
  // Filtres
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
  const [filterSponsored, setFilterSponsored] = useState<boolean | null>(null);

  // Charger les documents selon le profil sélectionné
  const loadDocuments = useCallback(() => {
    setIsLoading(true);
    if (selectedProfile.type === 'equipe') {
      const allDocs = ASStrasbourgDataService.getAllDocuments();
      setDocuments(allDocs);
    } else if (selectedProfile.type === 'club') {
      const allDocs = ASStrasbourgClubDataService.getAllDocuments();
      setDocuments(allDocs);
    } else if (selectedProfile.type === 'ligue') {
      const allDocs = LGEFDataService.getAllDocuments();
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
    // Filtre recherche
    const searchText = `${doc.ligne1} ${doc.ligne2} ${doc.ligne3} ${doc.ligne4}`.toLowerCase();
    if (searchQuery && !searchText.includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filtre statut
    if (filterStatus !== 'all' && doc.status !== filterStatus) {
      return false;
    }
    // Filtre sponsorisé
    if (filterSponsored !== null && doc.isSponsored !== filterSponsored) {
      return false;
    }
    return true;
  });
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilterStatus('all');
    setFilterSponsored(null);
    setShowFilterModal(false);
  };

  // Render document item
  const renderDocument = ({ item }: { item: UnifiedDocument }) => (
    <DocumentCard 
      doc={item as ASDocument} 
      onPress={() => handleDocumentPress(item)}
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
          
          {/* Titre au centre */}
          <TouchableOpacity 
            style={styles.titleContainer}
            onPress={() => {
              console.log('Titre Communication cliqué');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.pageTitle}>Communication</Text>
          </TouchableOpacity>
          
          {/* Sélecteur de profil à droite */}
          <TouchableOpacity 
            style={styles.clubSelectorCompact}
            onPress={() => setShowProfileModal(true)}
          >
            <Ionicons name={selectedProfile.type === 'club' ? 'business' : selectedProfile.type === 'ligue' ? 'globe' : 'people'} size={16} color="#FFFFFF" />
            <Text style={styles.clubNameCompact} numberOfLines={1}>{selectedProfile.name}</Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
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

      {/* Liste des documents */}
      <FlatList
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

      {/* Modal Filtre */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.modalTitle}>Filtrer les documents</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Filtre par statut */}
            <Text style={styles.filterLabel}>Statut</Text>
            <View style={styles.filterOptions}>
              {[
                { id: 'all', label: 'Tous', icon: 'apps-outline' },
                { id: 'to_generate', label: 'Brouillon', icon: 'document-text-outline', color: '#EF4444' },
                { id: 'generating', label: 'En cours', icon: 'hourglass-outline', color: '#F59E0B' },
                { id: 'ready', label: 'Prêt', icon: 'flash', color: '#10B981' },
                { id: 'published', label: 'Publié', icon: 'checkmark-done', color: '#3B82F6' },
              ].map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterOption,
                    filterStatus === option.id && styles.filterOptionSelected,
                    filterStatus === option.id && option.color && { borderColor: option.color, backgroundColor: option.color + '15' }
                  ]}
                  onPress={() => setFilterStatus(option.id as DocumentStatus | 'all')}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={16} 
                    color={filterStatus === option.id ? (option.color || Colors.primary) : '#6B7280'} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    filterStatus === option.id && { color: option.color || Colors.primary, fontWeight: '600' }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Filtre sponsorisé */}
            <Text style={styles.filterLabel}>Sponsoring</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, filterSponsored === null && styles.filterOptionSelected]}
                onPress={() => setFilterSponsored(null)}
              >
                <Text style={[styles.filterOptionText, filterSponsored === null && styles.filterOptionTextSelected]}>
                  Tous
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, filterSponsored === true && styles.filterOptionSelected]}
                onPress={() => setFilterSponsored(true)}
              >
                <Ionicons name="star" size={16} color={filterSponsored === true ? '#F59E0B' : '#6B7280'} />
                <Text style={[styles.filterOptionText, filterSponsored === true && { color: '#F59E0B', fontWeight: '600' }]}>
                  Sponsorisés
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, filterSponsored === false && styles.filterOptionSelected]}
                onPress={() => setFilterSponsored(false)}
              >
                <Text style={[styles.filterOptionText, filterSponsored === false && styles.filterOptionTextSelected]}>
                  Non sponsorisés
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Boutons actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Ionicons name="refresh" size={18} color="#6B7280" />
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    height: CARD_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  mockupContainer: {
    width: '50%', // 50% de la largeur de la carte
    height: CARD_HEIGHT,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  mockupImage: {
    width: '100%',
    height: '100%',
  },
  documentInfo: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  docTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 16,
    marginRight: 6,
  },
  rightIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Styles pour les 4 lignes de texte
  ligne1: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  ligne2: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  supportsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 4,
    gap: 4,
  },
  supportsCount: {
    fontSize: 10,
    color: '#9CA3AF',
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
  // Filter Modal
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    maxHeight: '80%',
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

