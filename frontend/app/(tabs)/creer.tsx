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
import { MockDataService, Document } from '../../services/mockDataService';
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
type DocumentStatus = 'to_generate' | 'generating' | 'ready' | 'published';

interface EnrichedDocument extends Document {
  displayStatus: DocumentStatus;
  isSponsored?: boolean;
  sponsorAmount?: number;
  publishStats?: {
    views: number;
    likes: number;
    shares: number;
    platforms: string[];
  };
  generationStartTime?: number;
}

interface Club {
  id: string;
  name: string;
}

// Données mock pour les clubs
const CLUBS: Club[] = [
  { id: 'artywiz', name: 'FC. Artywiz Strasbourg' },
  { id: 'u18', name: 'Équipe U18' },
  { id: 'u15', name: 'Équipe U15' },
];

// Couleurs de fond pour les mockups (fallback)
const MOCKUP_COLORS = [
  ['#3B82F6', '#1D4ED8'],
  ['#10B981', '#047857'],
  ['#F59E0B', '#D97706'],
  ['#EF4444', '#DC2626'],
  ['#8B5CF6', '#6D28D9'],
];

// Fonction pour obtenir le mockup d'un document
const getDocMockup = (docId: string) => MockDataService.getDocMockup(docId);

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
    if (status === 'generating') {
      // Animation de clignotement vert/rouge
      colorAnim.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      colorAnim.value,
      [0, 1],
      [0, 1]
    );
    // Interpoler entre vert (#22C55E) et rouge (#EF4444)
    return {
      backgroundColor: colorAnim.value < 0.5 ? '#22C55E' : '#EF4444',
    };
  });

  // Brouillon: pas d'indicateur
  if (status === 'to_generate') return null;

  // En cours: cercle qui clignote vert/rouge
  if (status === 'generating') {
    return (
      <Animated.View style={[styles.statusCircle, animatedStyle]} />
    );
  }

  // Prêt: cercle vert fixe
  if (status === 'ready') {
    return <View style={[styles.statusCircle, styles.statusReady]} />;
  }

  // Publié: icône
  if (status === 'published') {
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

// Composant Document Card
const DocumentCard = ({ 
  doc, 
  onPress, 
  mockupIndex 
}: { 
  doc: EnrichedDocument; 
  onPress: () => void;
  mockupIndex: number;
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

  // Récupérer le vrai mockup du document
  const mockupSource = MockDataService.getDocMockup(doc.id);

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
            source={mockupSource} 
            style={styles.mockupImage} 
            resizeMode="cover" 
          />
        </View>

        {/* Infos à droite - 50% de la largeur */}
        <View style={styles.documentInfo}>
          {/* Header avec sponsor et indicateur d'état */}
          <View style={styles.docHeader}>
            <Text style={styles.docTitle} numberOfLines={2}>{doc.title}</Text>
            <View style={styles.rightIndicators}>
              {doc.isSponsored && doc.sponsorAmount && (
                <SponsorBadge amount={doc.sponsorAmount} />
              )}
              <StatusIndicator status={doc.displayStatus} />
            </View>
          </View>

          {/* Type de document */}
          <View style={styles.docTypeRow}>
            <Ionicons name={getDocTypeIcon(doc.typeLabel) as any} size={14} color="#6B7280" />
            <Text style={styles.docType}>{doc.typeLabel}</Text>
          </View>

          {/* Équipe/Club */}
          <Text style={styles.docTeam}>FC. Artywiz Strasbourg</Text>

          {/* Stats si publié */}
          {doc.displayStatus === 'published' && doc.publishStats && (
            <StatsRow stats={doc.publishStats} />
          )}

          {/* Message selon statut */}
          {doc.displayStatus === 'generating' && (
            <Text style={styles.generatingText}>Génération en cours...</Text>
          )}
          {doc.displayStatus === 'ready' && (
            <Text style={styles.readyText}>Prêt à publier !</Text>
          )}
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
  
  // Store
  const { 
    documentStates, 
    getDocumentStatus, 
    isDocumentGenerating,
    completeGeneration,
  } = useDocumentStore();
  
  // États
  const [documents, setDocuments] = useState<EnrichedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club>(CLUBS[0]);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtres
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
  const [filterSponsored, setFilterSponsored] = useState<boolean | null>(null);

  // Ref pour le timer des likes
  const likesIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les documents et synchroniser avec le store
  const loadDocuments = useCallback(() => {
    const allDocs = MockDataService.getAllDocuments();
    
    // Enrichir les documents avec des statuts du store
    const enrichedDocs: EnrichedDocument[] = allDocs.slice(0, 10).map((doc, index) => {
      // Quelques documents sponsorisés
      const isSponsored = index % 4 === 0;
      const sponsorAmount = isSponsored ? [50, 75, 100, 150][index % 4] : undefined;
      
      // Récupérer le statut depuis le store
      const storeStatus = getDocumentStatus(doc.id);
      let displayStatus: DocumentStatus = 'to_generate';
      
      if (storeStatus === 'en_cours') displayStatus = 'generating';
      else if (storeStatus === 'pret') displayStatus = 'ready';
      else if (storeStatus === 'publie') displayStatus = 'published';
      
      // Récupérer le state complet pour generationStartTime
      const docState = documentStates[doc.id];
      
      return {
        ...doc,
        displayStatus,
        isSponsored,
        sponsorAmount,
        generationStartTime: docState?.generationStartedAt,
        publishStats: displayStatus === 'published' ? {
          views: Math.floor(Math.random() * 100) + 20,
          likes: Math.floor(Math.random() * 50) + 10,
          shares: Math.floor(Math.random() * 20) + 5,
          platforms: getRandomPlatforms(),
        } : undefined,
      };
    });

    setDocuments(enrichedDocs);
    setIsLoading(false);
  }, [documentStates, getDocumentStatus]);

  useEffect(() => {
    loadDocuments();
    
    // Cleanup
    return () => {
      if (likesIntervalRef.current) {
        clearInterval(likesIntervalRef.current);
      }
    };
  }, [loadDocuments]);

  // Timer pour augmenter les likes des documents publiés
  useEffect(() => {
    likesIntervalRef.current = setInterval(() => {
      setDocuments(prevDocs => prevDocs.map(doc => {
        if (doc.displayStatus === 'published' && doc.publishStats) {
          const shouldIncrement = Math.random() > 0.7; // 30% de chance d'incrément
          if (shouldIncrement) {
            const incrementType = Math.random();
            return {
              ...doc,
              publishStats: {
                ...doc.publishStats,
                likes: incrementType < 0.5 ? doc.publishStats.likes + 1 : doc.publishStats.likes,
                views: incrementType >= 0.5 && incrementType < 0.8 ? doc.publishStats.views + Math.floor(Math.random() * 3) : doc.publishStats.views,
                shares: incrementType >= 0.8 ? doc.publishStats.shares + 1 : doc.publishStats.shares,
              }
            };
          }
        }
        return doc;
      }));
    }, 5000); // Toutes les 5 secondes

    return () => {
      if (likesIntervalRef.current) {
        clearInterval(likesIntervalRef.current);
      }
    };
  }, []);

  // Vérifier les documents en génération (via le store)
  useEffect(() => {
    const checkGeneratingDocs = setInterval(() => {
      const now = Date.now();
      
      // Vérifier dans le store
      Object.entries(documentStates).forEach(([docId, state]) => {
        if (state.status === 'en_cours' && state.generationStartedAt) {
          const elapsed = now - state.generationStartedAt;
          if (elapsed >= 15000) { // 15 secondes pour le test (30 sec en prod)
            // Compléter la génération dans le store
            completeGeneration(docId);
            
            // Trouver le titre du document
            const doc = documents.find(d => d.id === docId);
            const docTitle = doc?.title || 'Document';
            
            // Afficher l'alerte
            setTimeout(() => {
              Alert.alert(
                '🎉 Document prêt !',
                `Votre document "${docTitle}" est prêt. Souhaitez-vous le publier ?`,
                [
                  { text: 'Plus tard', style: 'cancel', onPress: () => loadDocuments() },
                  { 
                    text: 'Publier', 
                    onPress: () => {
                      loadDocuments();
                      router.push(`/document/${docId}`);
                    }
                  }
                ]
              );
            }, 100);
          }
        }
      });
      
      // Recharger pour mettre à jour l'affichage
      loadDocuments();
    }, 2000);

    return () => clearInterval(checkGeneratingDocs);
  }, [documentStates, completeGeneration, documents, loadDocuments, router]);

  // Ouvrir un document
  const handleDocumentPress = (doc: EnrichedDocument) => {
    if (doc.displayStatus === 'to_generate') {
      // Ouvrir l'éditeur pour sélectionner les supports
      router.push(`/document/${doc.id}`);
    } else if (doc.displayStatus === 'ready') {
      // Ouvrir pour publier
      router.push(`/document/${doc.id}`);
    } else if (doc.displayStatus === 'published') {
      // Voir les stats
      router.push(`/document/${doc.id}`);
    }
    // Si en génération, ne rien faire (ou afficher un message)
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
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filtre statut
    if (filterStatus !== 'all' && doc.displayStatus !== filterStatus) {
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
  const renderDocument = ({ item, index }: { item: EnrichedDocument; index: number }) => (
    <DocumentCard 
      doc={item} 
      onPress={() => handleDocumentPress(item)}
      mockupIndex={index}
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
          
          {/* Sélecteur de club à droite */}
          <TouchableOpacity 
            style={styles.clubSelectorCompact}
            onPress={() => setShowClubModal(true)}
          >
            <Ionicons name="shield" size={16} color="#FFFFFF" />
            <Text style={styles.clubNameCompact} numberOfLines={1}>{selectedClub.name}</Text>
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

      {/* Modal sélection club */}
      <Modal
        visible={showClubModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClubModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowClubModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner un profil</Text>
            {CLUBS.map((club) => (
              <TouchableOpacity
                key={club.id}
                style={[
                  styles.clubOption,
                  selectedClub.id === club.id && styles.clubOptionSelected
                ]}
                onPress={() => {
                  setSelectedClub(club);
                  setShowClubModal(false);
                }}
              >
                <Ionicons 
                  name="shield" 
                  size={20} 
                  color={selectedClub.id === club.id ? Colors.primary : '#6B7280'} 
                />
                <Text style={[
                  styles.clubOptionText,
                  selectedClub.id === club.id && styles.clubOptionTextSelected
                ]}>
                  {club.name}
                </Text>
                {selectedClub.id === club.id && (
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
  docTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  docType: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 3,
  },
  docTeam: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
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
  // Stats
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
  // Messages
  generatingText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 6,
  },
  readyText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 6,
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
