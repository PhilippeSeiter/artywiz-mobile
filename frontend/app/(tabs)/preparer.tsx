import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { MockDataService } from '../../services/mockDataService';
import { DocumentDataService } from '../../services/documentDataService';
import { 
  useUserPreferencesStore, 
  ARTYWIZ_THEMES, 
  GENERIC_THEMES 
} from '../../stores/userPreferencesStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALL_THEMES = [...ARTYWIZ_THEMES, ...GENERIC_THEMES];

// Types d'état des documents
type DocState = 'brouillon' | 'en-cours' | 'pret' | 'publie' | 'telecharge';

interface FilterState {
  selectedThemes: string[];
  selectedSubthemes: string[];
  showSponsoredOnly: boolean;
}

// ============================================
// COMPOSANT: Indicateur d'État (cercle clignotant)
// ============================================
const StatusIndicator = ({ status }: { status: DocState }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'en-cours') {
      // Animation de clignotement vert/rouge
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(colorAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(colorAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    }
  }, [status]);

  // Brouillon: pas d'indicateur
  if (status === 'brouillon') return null;

  // En cours: cercle qui clignote vert/rouge
  if (status === 'en-cours') {
    const backgroundColor = colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#22C55E', '#EF4444'], // vert -> rouge
    });

    return (
      <Animated.View style={[styles.statusCircle, { backgroundColor }]} />
    );
  }

  // Prêt: cercle vert fixe
  if (status === 'pret') {
    return <View style={[styles.statusCircle, styles.statusPret]} />;
  }

  // Publié: icône
  if (status === 'publie') {
    return (
      <View style={styles.statusIcon}>
        <Ionicons name="share-social" size={16} color="#22C55E" />
      </View>
    );
  }

  // Téléchargé: icône
  if (status === 'telecharge') {
    return (
      <View style={styles.statusIcon}>
        <Ionicons name="download" size={16} color="#3B82F6" />
      </View>
    );
  }

  return null;
};

// ============================================
// COMPOSANT: Carte Document (structure 4 lignes)
// ============================================
const DocumentCard = ({ 
  item, 
  isSelected,
  onSelect,
  onPress,
  sponsoringPrice,
  showSponsoring,
  docStatus,
}: {
  item: any;
  isSelected: boolean;
  onSelect: () => void;
  onPress: () => void;
  sponsoringPrice: number;
  showSponsoring: boolean;
  docStatus: DocState;
}) => {
  // Déterminer l'état pour l'indicateur
  const status: DocState = docStatus;
  
  // Format date: "le 19 décembre 2025"
  const formattedDate = new Date(item.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <TouchableOpacity
      style={[
        styles.documentCard,
        status === 'en-cours' && styles.documentCardEnCours,
        status === 'pret' && styles.documentCardPret,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Checkbox - masqué si doc prêt ou en cours */}
      {status === 'brouillon' ? (
        <TouchableOpacity
          style={styles.checkboxArea}
          onPress={onSelect}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.checkboxPlaceholder} />
      )}

      {/* Contenu principal - 4 lignes */}
      <View style={styles.documentContent}>
        {/* Ligne 1: Type de document (ex: "Annoncer un match") */}
        <Text style={styles.ligne1} numberOfLines={1}>
          {item.ligne2 || item.typeLabel || item.title}
        </Text>
        
        {/* Ligne 2: Compétition / Description */}
        <Text style={styles.ligne2} numberOfLines={2}>
          {item.ligne3 || item.competitionLabel || ''}
        </Text>
        
        {/* Ligne 3: Équipe / Club */}
        <Text style={styles.ligne3} numberOfLines={1}>
          {item.ligne4 || item.teamLabel || ''}
        </Text>
        
        {/* Ligne 4: Date */}
        <Text style={styles.ligne4}>
          le {formattedDate}
        </Text>
      </View>

      {/* Zone droite: Sponsoring + État */}
      <View style={styles.rightSection}>
        {/* Prix Sponsoring */}
        {showSponsoring && (
          <View style={styles.sponsorBadge}>
            <Ionicons name="star" size={12} color={Colors.white} />
            <Text style={styles.sponsorPrice}>{sponsoringPrice}€</Text>
          </View>
        )}
        
        {/* Indicateur d'état */}
        <StatusIndicator status={status} />
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function PreparerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sponsoringPrefs, selectedThemes: userSelectedThemes, selectedProfiles } = useUserPreferencesStore();
  const { 
    isDocumentGenerating, 
    isDocumentReady, 
    startGeneration,
    getDocumentStatus 
  } = useDocumentStore();
  
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    selectedThemes: [],
    selectedSubthemes: [],
    showSponsoredOnly: false,
  });

  const isAutoSponsoringEnabled = sponsoringPrefs?.autoSponsoringEnabled ?? false;

  // Profil actif (premier sélectionné)
  const activeProfile = selectedProfiles[0];

  // Documents depuis le nouveau système
  const documents = useMemo(() => {
    let docs = DocumentDataService.getAllLegacyDocuments();
    
    // Apply theme filter
    if (filters.selectedThemes.length > 0) {
      docs = docs.filter((d: any) => filters.selectedThemes.includes(d.themeId));
    }
    
    // Apply sponsored filter
    if (filters.showSponsoredOnly) {
      docs = docs.filter((d: any) => d.isSponsored);
    }
    
    return docs;
  }, [filters]);

  // Document sélectionné pour le panneau de détails
  const selectedDocument = useMemo(() => {
    if (!selectedDocId) return null;
    return documents.find((d: any) => d.id === selectedDocId);
  }, [selectedDocId, documents]);

  // Fonctions
  const toggleSelect = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const toggleThemeFilter = (themeId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedThemes: prev.selectedThemes.includes(themeId)
        ? prev.selectedThemes.filter(id => id !== themeId)
        : [...prev.selectedThemes, themeId],
    }));
  };

  const resetFilters = () => {
    setFilters({
      selectedThemes: [],
      selectedSubthemes: [],
      showSponsoredOnly: false,
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map((d: any) => d.id));
    }
  };

  const handleCreateDocuments = () => {
    if (selectedDocs.length === 0) return;
    selectedDocs.forEach(docId => {
      startGeneration(docId, ['post']);
    });
    setSelectedDocs([]);
  };

  const getDocStatus = (docId: string): DocState => {
    if (isDocumentReady(docId)) return 'pret';
    if (isDocumentGenerating(docId)) return 'en-cours';
    return 'brouillon';
  };

  const availableThemes = useMemo(() => {
    if (!userSelectedThemes || userSelectedThemes.length === 0) {
      return ALL_THEMES;
    }
    return ALL_THEMES.filter(theme => userSelectedThemes.includes(theme.id));
  }, [userSelectedThemes]);

  const isAllSelected = documents.length > 0 && selectedDocs.length === documents.length;
  const activeFiltersCount = filters.selectedThemes.length + (filters.showSponsoredOnly ? 1 : 0);

  // Render document
  const renderDocument = ({ item }: { item: any }) => {
    const isSelected = selectedDocs.includes(item.id);
    const sponsoringPrice = DocumentDataService.getSponsoringPrice(item.id) || MockDataService.getSponsoringPrice(item.id);
    const showSponsoring = item.isSponsored && isAutoSponsoringEnabled;
    const docStatus = getDocStatus(item.id);

    return (
      <DocumentCard
        item={item}
        isSelected={isSelected}
        onSelect={() => toggleSelect(item.id)}
        onPress={() => {
          setSelectedDocId(item.id);
          if (docStatus === 'pret') {
            router.push(`/generated-doc/${item.id}`);
          } else {
            router.push(`/document/${item.id}`);
          }
        }}
        sponsoringPrice={sponsoringPrice}
        showSponsoring={showSponsoring}
        docStatus={docStatus}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header avec sélecteur de compte centré */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        {/* Sélecteur de compte centré */}
        <View style={styles.accountSelector}>
          <TouchableOpacity style={styles.accountButton}>
            {/* Logo du compte actif */}
            <View style={styles.accountLogo}>
              <Ionicons 
                name={activeProfile?.type === 'club' ? 'shield' : activeProfile?.type === 'equipe' ? 'people' : 'business'} 
                size={20} 
                color={Colors.white} 
              />
            </View>
            <Text style={styles.accountName} numberOfLines={1}>
              {activeProfile?.name || 'Mon compte'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Titre et Filtres */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Mes documents</Text>
            <Text style={styles.headerSubtitle}>{documents.length} document(s)</Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={22} color={Colors.white} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Liste des documents */}
      <View style={styles.listContainer}>
        {/* "Tout sélectionner" */}
        {documents.length > 0 && (
          <TouchableOpacity style={styles.selectAllRow} onPress={toggleSelectAll}>
            <View style={styles.checkboxArea}>
              <View style={[styles.checkbox, isAllSelected && styles.checkboxSelected]}>
                {isAllSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
            </View>
            <Text style={styles.selectAllText}>
              {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={Colors.textLight} />
              <Text style={styles.emptyText}>Aucun document trouvé</Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                  <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      {/* Bouton Créer */}
      {selectedDocs.length > 0 && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateDocuments}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              <Ionicons name="create" size={20} color={Colors.white} />
              <Text style={styles.createButtonText}>
                Créer {selectedDocs.length} document(s)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Filtres */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrer</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Filtre Sponsorisé */}
              {isAutoSponsoringEnabled && (
                <TouchableOpacity
                  style={[styles.filterOption, styles.sponsoredFilterOption]}
                  onPress={() => setFilters(prev => ({ ...prev, showSponsoredOnly: !prev.showSponsoredOnly }))}
                >
                  <View style={styles.filterOptionInfo}>
                    <Ionicons name="star" size={22} color={Colors.warning} />
                    <Text style={styles.sponsoredFilterText}>Documents sponsorisés</Text>
                  </View>
                  <Ionicons
                    name={filters.showSponsoredOnly ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={filters.showSponsoredOnly ? Colors.primary : Colors.textSecondary}
                  />
                </TouchableOpacity>
              )}

              {/* Thématiques */}
              <Text style={styles.filterSectionTitle}>Mes thématiques</Text>
              {availableThemes.map(theme => (
                <TouchableOpacity
                  key={theme.id}
                  style={styles.filterOption}
                  onPress={() => toggleThemeFilter(theme.id)}
                >
                  <View style={styles.filterOptionInfo}>
                    <View style={[
                      styles.themeIconSmall,
                      filters.selectedThemes.includes(theme.id) && styles.themeIconSmallSelected
                    ]}>
                      <Ionicons 
                        name={theme.icon as any} 
                        size={16} 
                        color={filters.selectedThemes.includes(theme.id) ? Colors.white : Colors.primary} 
                      />
                    </View>
                    <Text style={styles.filterOptionText}>{theme.name}</Text>
                  </View>
                  <Ionicons
                    name={filters.selectedThemes.includes(theme.id) ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={filters.selectedThemes.includes(theme.id) ? Colors.primary : Colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetFilterBtn} onPress={resetFilters}>
                <Text style={styles.resetFilterText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFilterBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFilterText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  accountSelector: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  accountLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    maxWidth: 150,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  // Liste
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  // Carte Document
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    minHeight: 90,
  },
  documentCardEnCours: {
    backgroundColor: Colors.warning + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  documentCardPret: {
    backgroundColor: Colors.success + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  checkboxArea: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkboxPlaceholder: {
    width: 16,
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  documentContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  // 4 lignes de texte
  ligne1: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  ligne2: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  ligne3: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 2,
  },
  ligne4: {
    fontSize: 11,
    color: Colors.textLight,
  },
  // Section droite
  rightSection: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
    gap: 6,
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  sponsorPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  // Indicateurs d'état
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusPret: {
    backgroundColor: '#22C55E',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  resetBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: 20,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Footer sticky
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: '80%',
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
  modalScroll: {
    maxHeight: 400,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sponsoredFilterOption: {
    backgroundColor: Colors.warning + '10',
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sponsoredFilterText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.warning,
  },
  filterOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  filterOptionText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  themeIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIconSmallSelected: {
    backgroundColor: Colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  resetFilterBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  resetFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  applyFilterBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
