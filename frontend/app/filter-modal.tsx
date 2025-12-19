import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../components';
import { Colors, Spacing } from '../constants';
import { useFilterStore } from '../stores/filterStore';
import { MockDataService } from '../services/mockDataService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FilterModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const filters = useFilterStore();

  const [selectedTheme, setSelectedTheme] = useState(filters.selectedThemeId);
  const [selectedSubtheme, setSelectedSubtheme] = useState(filters.selectedSubthemeId);
  const [showSponsored, setShowSponsored] = useState(filters.showSponsoredOnly);

  const themes = MockDataService.getAllThemes();
  
  const subthemes = useMemo(() => {
    if (!selectedTheme || selectedTheme === 'all') return [];
    return MockDataService.getSubthemesByThemeId(selectedTheme);
  }, [selectedTheme]);

  const handleThemeSelect = (themeId: string | null) => {
    setSelectedTheme(themeId);
    setSelectedSubtheme(null); // Reset subtheme when theme changes
  };

  const handleApply = () => {
    filters.setTheme(selectedTheme);
    filters.setSubtheme(selectedSubtheme);
    if (showSponsored !== filters.showSponsoredOnly) {
      filters.toggleSponsored();
    }
    router.back();
  };

  const handleReset = () => {
    setSelectedTheme(null);
    setSelectedSubtheme(null);
    setShowSponsored(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filtres</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Theme Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thème</Text>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              (!selectedTheme || selectedTheme === 'all') && styles.selectedOption,
            ]}
            onPress={() => handleThemeSelect(null)}
          >
            <Text
              style={[
                styles.filterOptionText,
                (!selectedTheme || selectedTheme === 'all') && styles.selectedOptionText,
              ]}
            >
              Tous les thèmes
            </Text>
            {(!selectedTheme || selectedTheme === 'all') && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>

          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[styles.filterOption, selectedTheme === theme.id && styles.selectedOption]}
              onPress={() => handleThemeSelect(theme.id)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selectedTheme === theme.id && styles.selectedOptionText,
                ]}
              >
                {theme.label}
              </Text>
              {selectedTheme === theme.id && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Subtheme Filter */}
        {selectedTheme && selectedTheme !== 'all' && subthemes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sous-thème</Text>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                (!selectedSubtheme || selectedSubtheme === 'all') && styles.selectedOption,
              ]}
              onPress={() => setSelectedSubtheme(null)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  (!selectedSubtheme || selectedSubtheme === 'all') && styles.selectedOptionText,
                ]}
              >
                Tous les sous-thèmes
              </Text>
              {(!selectedSubtheme || selectedSubtheme === 'all') && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>

            {subthemes.map((subtheme) => (
              <TouchableOpacity
                key={subtheme.id}
                style={[
                  styles.filterOption,
                  selectedSubtheme === subtheme.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedSubtheme(subtheme.id)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedSubtheme === subtheme.id && styles.selectedOptionText,
                  ]}
                >
                  {subtheme.label}
                </Text>
                {selectedSubtheme === subtheme.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sponsored Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <TouchableOpacity
            style={[styles.filterOption, styles.toggleOption]}
            onPress={() => setShowSponsored(!showSponsored)}
          >
            <View style={styles.toggleContent}>
              <Ionicons name="star" size={20} color={Colors.warning} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.filterOptionText}>Documents sponsorisés uniquement</Text>
                <Text style={styles.toggleSubtext}>
                  Afficher uniquement les documents avec sponsors
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, showSponsored && styles.toggleActive]}>
              <View style={[styles.toggleThumb, showSponsored && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <CustomButton title="APPLIQUER LES FILTRES" onPress={handleApply} icon="checkmark" />
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resetText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs / 2,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
