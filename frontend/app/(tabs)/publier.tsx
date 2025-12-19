import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDocumentStore } from '../../stores/documentStore';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { MockDataService } from '../../services/mockDataService';

type TabType = 'a_publier' | 'publie';

interface GeneratedDoc {
  id: string;
  title: string;
  typeLabel: string;
  themeId: string;
  date: string;
  previewImage?: any;
  status: 'a_publier' | 'publie';
  isSponsored: boolean;
  channel: string;
}

export default function PublierScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { generatingDocs, documentStates, getDocumentState } = useDocumentStore();
  const { sponsoringPrefs } = useUserPreferencesStore();
  const [activeTab, setActiveTab] = useState<TabType>('a_publier');

  // Animation for rotating star
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, []);

  const starRotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Check if auto-sponsoring is enabled
  const isAutoSponsoringEnabled = sponsoringPrefs?.autoSponsoringEnabled ?? false;

  const themes = MockDataService.getAllThemes();

  // Get theme label
  const getThemeLabel = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme?.label || themeId;
  };

  // Get documents from store - only show documents that are ready or published
  const allDocs = useMemo(() => {
    const mockDocs = MockDataService.getAllDocuments();
    
    // Filter and convert to our format based on document store states
    const docs: GeneratedDoc[] = mockDocs
      .filter(doc => {
        const docState = getDocumentState(doc.id);
        return docState?.status === 'pret' || docState?.status === 'publie';
      })
      .map((doc) => {
        const docState = getDocumentState(doc.id);
        return {
          id: doc.id,
          title: doc.title,
          typeLabel: doc.typeLabel,
          themeId: doc.themeId || 'match',
          date: doc.date,
          previewImage: MockDataService.getPreviewImage(doc.id),
          status: docState?.status === 'publie' ? 'publie' as const : 'a_publier' as const,
          isSponsored: Math.random() > 0.5,
          channel: doc.channel,
        };
      });

    return docs;
  }, [generatingDocs, documentStates, getDocumentState]);

  const aPublierCount = allDocs.filter(d => d.status === 'a_publier').length;
  const publiesCount = allDocs.filter(d => d.status === 'publie').length;

  const renderDocument = ({ item }: { item: GeneratedDoc }) => {
    const sponsoringPrice = MockDataService.getSponsoringPrice(item.id);
    const showSponsoring = item.isSponsored && isAutoSponsoringEnabled;
    
    // Format date
    const formattedDate = new Date(item.date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    return (
      <TouchableOpacity
        style={styles.documentRow}
        onPress={() => router.push(`/generated-doc/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Contenu principal */}
        <View style={styles.documentInfo}>
          {/* Ligne 1: Catégorie */}
          <Text style={styles.documentLine1} numberOfLines={1}>
            {item.channel} - {getThemeLabel(item.themeId)}
          </Text>
          
          {/* Ligne 2-3: Titre */}
          <Text style={styles.documentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Ligne 4: Date */}
          <Text style={styles.documentDate}>
            le {formattedDate}
          </Text>
        </View>

        {/* Badge Sponsoring */}
        {showSponsoring && (
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
        <Text style={styles.headerTitle}>Publier</Text>
        <Text style={styles.headerSubtitle}>Prêts à faire le Buzz ? Vos documents vous attendent !</Text>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'a_publier' && styles.tabActive]}
            onPress={() => setActiveTab('a_publier')}
          >
            <Text style={[styles.tabText, activeTab === 'a_publier' && styles.tabTextActive]}>
              À publier
            </Text>
            {aPublierCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'a_publier' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'a_publier' && styles.tabBadgeTextActive]}>
                  {aPublierCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'publie' && styles.tabActive]}
            onPress={() => setActiveTab('publie')}
          >
            <Text style={[styles.tabText, activeTab === 'publie' && styles.tabTextActive]}>
              Publiés
            </Text>
            {publiesCount > 0 && (
              <View style={[styles.tabBadge, activeTab === 'publie' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'publie' && styles.tabBadgeTextActive]}>
                  {publiesCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Document List */}
      <View style={styles.listContainer}>
        <FlatList
          data={allDocs.filter(d => {
            if (activeTab === 'a_publier') {
              return d.status === 'a_publier';
            }
            return d.status === 'publie';
          })}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'a_publier' ? 'document-text-outline' : 'checkmark-done-outline'} 
                size={64} 
                color={Colors.textLight} 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'a_publier' 
                  ? 'Aucun document à publier'
                  : 'Aucun document publié'
                }
              </Text>
              {activeTab === 'a_publier' && (
                <TouchableOpacity 
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(tabs)/preparer')}
                >
                  <Text style={styles.emptyBtnText}>Préparer des documents</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
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
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    minHeight: 80,
  },
  documentInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  // Ligne 1: Catégorie
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
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
