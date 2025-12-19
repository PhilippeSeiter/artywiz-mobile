import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface InsightsSummary {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_impressions: number;
  total_clicks: number;
  engagement_rate: number;
}

interface PostInsight {
  id: string;
  platform: string;
  content: string;
  image_url?: string;
  published_at: string;
  insights?: {
    likes: number;
    comments: number;
    shares?: number;
    impressions?: number;
    clicks?: number;
  };
}

// Animated counter component
const AnimatedCounter = ({ 
  value, 
  delay = 0, 
  suffix = '',
  prefix = ''
}: { 
  value: number; 
  delay?: number;
  suffix?: string;
  prefix?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 100 }));
    
    // Animate counter
    const duration = 1500;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime - delay;
      if (elapsed < 0) return;
      
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayValue(Math.floor(value * eased));
      
      if (progress >= 1) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Animated.Text style={[styles.statValue, animatedStyle]}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </Animated.Text>
  );
};

// Stat card component
const StatCard = ({ 
  icon, 
  label, 
  value, 
  color, 
  delay,
  suffix = '',
  prefix = ''
}: { 
  icon: string; 
  label: string; 
  value: number; 
  color: string;
  delay: number;
  suffix?: string;
  prefix?: string;
}) => {
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, cardStyle]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <AnimatedCounter value={value} delay={delay + 200} suffix={suffix} prefix={prefix} />
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// Platform icon
const PlatformIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, { name: string; color: string }> = {
    facebook: { name: 'logo-facebook', color: '#1877F2' },
    instagram: { name: 'logo-instagram', color: '#E4405F' },
    linkedin: { name: 'logo-linkedin', color: '#0A66C2' },
  };
  const config = icons[platform] || { name: 'globe-outline', color: '#6B7280' };
  
  return (
    <View style={[styles.platformIcon, { backgroundColor: `${config.color}15` }]}>
      <Ionicons name={config.name as any} size={16} color={config.color} />
    </View>
  );
};

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [posts, setPosts] = useState<PostInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch summary
      const summaryRes = await fetch(`${BACKEND_URL}/api/social/insights/summary?user_id=default_user`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      } else {
        // If API fails, show empty state instead of error
        setSummary({
          total_posts: 0,
          total_likes: 0,
          total_comments: 0,
          total_shares: 0,
          total_impressions: 0,
          total_clicks: 0,
          engagement_rate: 0
        });
      }
      
      // Fetch posts history
      const postsRes = await fetch(`${BACKEND_URL}/api/social/posts?user_id=default_user&limit=20`);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      // On error, show empty state instead of error message
      setSummary({
        total_posts: 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        total_impressions: 0,
        total_clicks: 0,
        engagement_rate: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInsights();
  }, [fetchInsights]);

  const hasData = summary && summary.total_posts > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes Statistiques</Text>
          <Text style={styles.headerSubtitle}>Performance de vos publications</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchInsights}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bar-chart-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Pas encore de statistiques</Text>
            <Text style={styles.emptyText}>
              Publiez vos premiers visuels sur les réseaux sociaux pour voir vos performances ici.
            </Text>
            <TouchableOpacity 
              style={styles.publishButton}
              onPress={() => router.push('/(tabs)/creer')}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.publishButtonGradient}
              >
                <Ionicons name="share-social-outline" size={20} color="#FFF" />
                <Text style={styles.publishButtonText}>Publier un visuel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard 
                icon="heart" 
                label="Likes" 
                value={summary.total_likes} 
                color="#EF4444"
                delay={0}
              />
              <StatCard 
                icon="chatbubble" 
                label="Commentaires" 
                value={summary.total_comments} 
                color="#3B82F6"
                delay={100}
              />
              <StatCard 
                icon="share-social" 
                label="Partages" 
                value={summary.total_shares} 
                color="#10B981"
                delay={200}
              />
              <StatCard 
                icon="eye" 
                label="Impressions" 
                value={summary.total_impressions} 
                color="#8B5CF6"
                delay={300}
              />
              <StatCard 
                icon="hand-left" 
                label="Clics" 
                value={summary.total_clicks} 
                color="#F59E0B"
                delay={400}
              />
              <StatCard 
                icon="trending-up" 
                label="Engagement" 
                value={summary.engagement_rate} 
                color="#06B6D4"
                delay={500}
                suffix="%"
              />
            </View>

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                <Text style={styles.summaryTitle}>Résumé</Text>
              </View>
              <Text style={styles.summaryText}>
                Vous avez publié <Text style={styles.summaryHighlight}>{summary.total_posts} visuels</Text> qui ont généré{' '}
                <Text style={styles.summaryHighlight}>{summary.total_likes + summary.total_comments + summary.total_shares}</Text> interactions.
              </Text>
            </View>

            {/* Recent posts */}
            {posts.length > 0 && (
              <View style={styles.postsSection}>
                <Text style={styles.sectionTitle}>Publications récentes</Text>
                {posts.slice(0, 5).map((post, index) => (
                  <View key={post.id || index} style={styles.postCard}>
                    <PlatformIcon platform={post.platform} />
                    <View style={styles.postContent}>
                      <Text style={styles.postText} numberOfLines={2}>
                        {post.content || 'Publication'}
                      </Text>
                      <Text style={styles.postDate}>
                        {new Date(post.published_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    {post.insights && (
                      <View style={styles.postStats}>
                        <View style={styles.postStatItem}>
                          <Ionicons name="heart" size={14} color="#EF4444" />
                          <Text style={styles.postStatValue}>{post.insights.likes}</Text>
                        </View>
                        <View style={styles.postStatItem}>
                          <Ionicons name="chatbubble" size={14} color="#3B82F6" />
                          <Text style={styles.postStatValue}>{post.insights.comments}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginTop: -Spacing.md,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  publishButton: {
    marginTop: Spacing.xl,
    borderRadius: 25,
    overflow: 'hidden',
  },
  publishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm * 2) / 3,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  summaryHighlight: {
    fontWeight: '700',
    color: Colors.primary,
  },
  postsSection: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  postText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  postDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  postStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
