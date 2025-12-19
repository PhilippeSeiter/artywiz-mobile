import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DocumentCard, GradientHeader } from '../../components';
import { Colors, Spacing } from '../../constants';
import { MockDataService } from '../../services/mockDataService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const documents = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    return MockDataService.getFilteredDocuments(
      {
        selectedThemeId: null,
        selectedSubthemeId: null,
        showSponsoredOnly: false,
      },
      searchQuery
    );
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <GradientHeader title="Recherche" />

      <View style={styles.content}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un document..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textSecondary}
                onPress={() => setSearchQuery('')}
              />
            )}
          </View>
        </View>

        {/* Results */}
        {searchQuery.trim() === '' ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>Recherchez un document</Text>
            <Text style={styles.emptySubtext}>
              Saisissez le nom d'un document pour commencer votre recherche
            </Text>
          </View>
        ) : (
          <FlashList
            data={documents}
            renderItem={({ item }) => (
              <DocumentCard
                document={item}
                onPress={() => router.push(`/document/${item.id}`)}
              />
            )}
            estimatedItemSize={100}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                <Text style={styles.emptySubtext}>
                  Essayez avec d'autres mots-clés
                </Text>
              </View>
            }
            ListHeaderComponent={
              documents.length > 0 ? (
                <Text style={styles.resultCount}>
                  {documents.length} résultat{documents.length > 1 ? 's' : ''} trouvé{documents.length > 1 ? 's' : ''}
                </Text>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  resultCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
});
