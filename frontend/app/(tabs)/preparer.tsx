import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { MockDataService } from '../../services/mockDataService';
import { 
  useUserPreferencesStore, 
  ARTYWIZ_THEMES, 
  GENERIC_THEMES 
} from '../../stores/userPreferencesStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Combine all available themes for lookup
const ALL_THEMES = [...ARTYWIZ_THEMES, ...GENERIC_THEMES];

interface FilterState {
  selectedThemes: string[];
  selectedSubthemes: string[];
  showSponsoredOnly: boolean;
}

export default function PreparerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sponsoringPrefs, selectedThemes: userSelectedThemes } = useUserPreferencesStore();
  const { 
    isDocumentGenerating, 
    isDocumentReady, 
    startGeneration,
    getDocumentStatus 
  } = useDocumentStore();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    selectedThemes: [],
    selectedSubthemes: [],
    showSponsoredOnly: false,
  });

  // Animation for the star icon
  const starAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  // Animation for gear icon (rotating)
  const gearRotation = useRef(new Animated.Value(0)).current;

  // Check if auto-sponsoring is enabled
  const isAutoSponsoringEnabled = sponsoringPrefs?.autoSponsoringEnabled ?? false;

  // Animate gear icon continuously
  useEffect(() => {
    const gearAnim = Animated.loop(
      Animated.timing(gearRotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    gearAnim.start();
    return () => gearAnim.stop();
  }, []);

  const gearSpin = gearRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animate star when auto-sponsoring is enabled
  useEffect(() => {
    if (isAutoSponsoringEnabled) {
      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(starAnimation, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(starAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Rotate animation
      const rotate = Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulseAnimation.start();
      rotate.start();

      return () => {
        pulseAnimation.stop();
        rotate.stop();
      };
    }
  }, [isAutoSponsoringEnabled]);

  const starRotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Get themes from mock service (for document filtering)
  const mockThemes = MockDataService.getAllThemes();

  // Filter available themes based on user's selected preferences
  const availableThemes = useMemo(() => {
    if (!userSelectedThemes || userSelectedThemes.length === 0) {
      // If no themes selected, show all themes from store
      return ALL_THEMES;
    }
    // Only show themes that user has selected in their preferences
    return ALL_THEMES.filter(theme => userSelectedThemes.includes(theme.id));
  }, [userSelectedThemes]);

  const documents = useMemo(() => {
    let docs = MockDataService.getAllDocuments();
    
    // Apply theme filter
    if (filters.selectedThemes.length > 0) {
      docs = docs.filter(d => filters.selectedThemes.includes(d.themeId));
    }
    
    // Apply subtheme filter
    if (filters.selectedSubthemes.length > 0) {
      docs = docs.filter(d => filters.selectedSubthemes.includes(d.subthemeId));
    }
    
    // Apply sponsored filter
    if (filters.showSponsoredOnly) {
      docs = docs.filter(d => d.isSponsored);
    }
    
    return docs;
  }, [filters]);

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

  const toggleSubthemeFilter = (subthemeId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSubthemes: prev.selectedSubthemes.includes(subthemeId)
        ? prev.selectedSubthemes.filter(id => id !== subthemeId)
        : [...prev.selectedSubthemes, subthemeId],
    }));
  };

  const resetFilters = () => {
    setFilters({
      selectedThemes: [],
      selectedSubthemes: [],
      showSponsoredOnly: false,
    });
  };

  // Tout sélectionner / Tout désélectionner
  const toggleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(d => d.id));
    }
  };

  const isAllSelected = documents.length > 0 && selectedDocs.length === documents.length;

  const activeFiltersCount = filters.selectedThemes.length + 
    filters.selectedSubthemes.length + 
    (filters.showSponsoredOnly ? 1 : 0);

  const handleCreateDocuments = () => {
    if (selectedDocs.length === 0) return;
    
    // Start generation for each selected doc
    selectedDocs.forEach(docId => {
      startGeneration(docId, ['post']); // Default supports
    });
    
    Alert.alert(
      'Documents en cours de création',
      `${selectedDocs.length} document(s) sont en cours de génération.\n\nUn badge "En cours" apparaît sur les documents. Vous serez notifié quand ils seront prêts.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setSelectedDocs([]);
          },
        },
      ]
    );
  };

  // Get theme label by id - prioritize store themes, fallback to mock themes
  const getThemeLabel = (themeId: string) => {
    // First check in store themes
    const storeTheme = ALL_THEMES.find(t => t.id === themeId);
    if (storeTheme) return storeTheme.name;
    
    // Fallback to mock themes
    const mockTheme = mockThemes.find(t => t.id === themeId);
    return mockTheme?.label || themeId;
  };

  const renderDocument = ({ item, index }: { item: typeof documents[0]; index: number }) => {
    const isSelected = selectedDocs.includes(item.id);
    const sponsoringPrice = MockDataService.getSponsoringPrice(item.id);
    const showSponsoring = item.isSponsored && isAutoSponsoringEnabled;
    
    // Get document status
    const docStatus = getDocumentStatus(item.id);
    const isGenerating = isDocumentGenerating(item.id);
    const isReady = isDocumentReady(item.id);
    
    // Format date
    const formattedDate = new Date(item.date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Handle press - if ready, go to generated-doc, otherwise go to document detail
    const handlePress = () => {
      if (isReady) {
        // Naviguer vers l'écran de document généré
        router.push(`/generated-doc/${item.id}`);
      } else {
        router.push(`/document/${item.id}`);
      }
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.documentRow,
          isGenerating && styles.documentRowGenerating,
          isReady && styles.documentRowReady,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Checkbox avec zone de touch plus grande - masqué si doc prêt ou en cours */}
        {!isReady && !isGenerating ? (
          <TouchableOpacity
            style={styles.checkboxArea}
            onPress={() => toggleSelect(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={18} color={Colors.white} />}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.checkboxAreaPlaceholder} />
        )}

        {/* Contenu principal */}
        <View style={styles.documentInfo}>
          {/* Ligne 1: Équipe - Catégorie */}
          <Text style={styles.documentLine1} numberOfLines={1}>
            {item.teamLabel ? `${item.teamLabel} - ` : ''}{getThemeLabel(item.themeId)}
          </Text>
          
          {/* Ligne 2-3: Championnat ou Titre */}
          <Text style={styles.documentTitle} numberOfLines={2}>
            {item.competitionLabel || item.title}
          </Text>
          
          {/* Ligne 4: Date */}
          <Text style={styles.documentDate}>
            le {formattedDate}
          </Text>
        </View>

        {/* Gear icon for generating docs */}
        {isGenerating && (
          <Animated.View style={[styles.gearIcon, { transform: [{ rotate: gearSpin }] }]}>
            <Ionicons name="settings" size={20} color={Colors.warning} />
          </Animated.View>
        )}

        {/* Ready badge */}
        {isReady && (
          <View style={styles.readyBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
            <Text style={styles.readyBadgeText}>Prêt</Text>
          </View>
        )}

        {/* Badge Sponsoring */}
        {showSponsoring && !isGenerating && !isReady && (
          <View style={styles.sponsorBadge}>
            <Animated.View style={[styles.sponsorStar, { transform: [{ rotate: starRotate }] }]}>
              <Ionicons name="star" size={12} color={Colors.white} />
            </Animated.View>
            <Text style={styles.sponsorBadgeText}>{sponsoringPrice}€</Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </TouchableOpacity>
    );
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Rechercher</Text>
            <Text style={styles.headerSubtitle}>Sélectionnez les documents à créer</Text>
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

      {/* Document List */}
      <View style={styles.listContainer}>
        {/* Case "Tout sélectionner" */}
        {documents.length > 0 && (
          <TouchableOpacity 
            style={styles.selectAllRow}
            onPress={toggleSelectAll}
          >
            <View style={styles.checkboxArea}>
              <View style={[styles.checkbox, isAllSelected && styles.checkboxSelected]}>
                {isAllSelected && <Ionicons name="checkmark" size={18} color={Colors.white} />}
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

      {/* Sticky CTA */}
      {selectedDocs.length > 0 && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateDocuments}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              <Ionicons name="create" size={20} color={Colors.white} />
              <Text style={styles.createButtonText}>
                Créer le(s) document(s) ({selectedDocs.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
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

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              {/* Sponsored Filter - Only show if auto-sponsoring is enabled */}
              {isAutoSponsoringEnabled && (
                <TouchableOpacity
                  style={[styles.filterOption, styles.sponsoredFilterOption]}
                  onPress={() => setFilters(prev => ({ ...prev, showSponsoredOnly: !prev.showSponsoredOnly }))}
                >
                  <View style={styles.filterOptionInfo}>
                    <Animated.View style={{ 
                      transform: [
                        { scale: starAnimation },
                        { rotate: starRotate }
                      ] 
                    }}>
                      <Ionicons name="star" size={22} color={Colors.warning} />
                    </Animated.View>
                    <Text style={styles.sponsoredFilterText}>Documents sponsorisés</Text>
                  </View>
                  <Ionicons
                    name={filters.showSponsoredOnly ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={filters.showSponsoredOnly ? Colors.primary : Colors.textSecondary}
                  />
                </TouchableOpacity>
              )}

              {/* User's selected themes */}
              <Text style={styles.filterSectionTitle}>Mes thématiques</Text>
              
              {availableThemes.length === 0 ? (
                <View style={styles.noThemesContainer}>
                  <Ionicons name="alert-circle-outline" size={32} color={Colors.textSecondary} />
                  <Text style={styles.noThemesText}>
                    Aucune thématique sélectionnée.{'\n'}
                    Configurez vos préférences dans "Mon compte".
                  </Text>
                </View>
              ) : (
                availableThemes.map(theme => (
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
                ))
              )}
            </ScrollView>

            {/* Modal Actions */}
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing.xs,
  },
  // "Tout sélectionner" row
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
    marginLeft: 60, // Align with content after checkbox
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    minHeight: 80,
  },
  // Surbrillance pour doc en cours de génération
  documentRowGenerating: {
    backgroundColor: Colors.warning + '15',
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  // Surbrillance pour doc prêt
  documentRowReady: {
    backgroundColor: Colors.success + '15',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  // Gear icon for generating
  gearIcon: {
    marginRight: Spacing.sm,
  },
  // Ready badge
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: Spacing.sm,
    gap: 4,
  },
  readyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  // Zone de checkbox plus grande (44x44)
  checkboxArea: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  // Placeholder pour maintenir l'alignement quand checkbox est masquée
  checkboxAreaPlaceholder: {
    width: 20,
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
  documentInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  // Ligne 1: Équipe - Catégorie
  documentLine1: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  // Ligne 2-3: Titre
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  // Ligne 4: Date
  documentDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  // Badge Sponsoring orange
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: Spacing.sm,
    gap: 4,
  },
  sponsorStar: {
    width: 12,
    height: 12,
  },
  sponsorBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
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
    borderRadius: 0,
    borderBottomWidth: 0,
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
  noThemesContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noThemesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  subthemesContainer: {
    paddingLeft: Spacing.lg,
    backgroundColor: Colors.background,
  },
  subthemeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subthemeText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
