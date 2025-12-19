import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CalendarModal } from '../components';

const { width } = Dimensions.get('window');

// Animation config
const SPRING_CONFIG = {
  damping: 14,
  stiffness: 120,
  mass: 0.8,
};

// Fake data par date (différent selon la date)
const generateStatsForDate = (date: Date) => {
  const seed = date.getDate() + date.getMonth() * 30;
  return {
    publications: {
      facebook: 3 + (seed % 5),
      instagram: 5 + (seed % 8),
      tiktok: 2 + (seed % 4),
      linkedin: 1 + (seed % 3),
    },
    engagement: {
      totalViews: 8000 + (seed * 127) % 10000,
      totalLikes: 2000 + (seed * 89) % 5000,
      totalShares: 500 + (seed * 37) % 1500,
      totalComments: 200 + (seed * 23) % 800,
    },
  };
};

// Composant compteur animé style "pompe à essence"
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
}

const AnimatedCounter = ({ value, suffix = '', duration = 1500 }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const steps = 25;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * easeOut));

      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return <Text style={styles.counterValue}>{formatNumber(displayValue)}{suffix}</Text>;
};

// Icônes des réseaux sociaux
const SOCIAL_NETWORKS = [
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
];

export default function StatisticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Date et calendrier
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  
  // Stats générées selon la date
  const [stats, setStats] = useState(generateStatsForDate(new Date()));
  const [animationKey, setAnimationKey] = useState(0);
  
  // Header animation
  const headerScale = useSharedValue(0.95);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1, SPRING_CONFIG);
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  // Changement de date -> régénérer les stats avec animation
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setStats(generateStatsForDate(date));
    setAnimationKey(prev => prev + 1); // Force re-render des compteurs
  }, []);

  const handlePeriodChange = useCallback((start: Date, end: Date) => {
    setPeriodStart(start);
    setPeriodEnd(end);
    setStats(generateStatsForDate(start));
    setAnimationKey(prev => prev + 1);
  }, []);

  // Format date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    const formatted = date.toLocaleDateString('fr-FR', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatPeriodDisplay = () => {
    if (periodStart && periodEnd) {
      const startStr = periodStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const endStr = periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    return formatDate(selectedDate);
  };

  const totalPublications = Object.values(stats.publications).reduce((a, b) => a + b, 0);

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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Animated.Text style={[styles.headerTitle, headerStyle]}>
            Mes Statistiques
          </Animated.Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Date Selector - Cliquable comme sur le tableau de bord */}
      <TouchableOpacity 
        style={styles.dateSelector}
        onPress={() => setShowCalendar(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
        <Text style={styles.dateText}>{formatPeriodDisplay()}</Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Mes Publications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes publications</Text>
          <View style={styles.sectionTitleMargin} />
          
          <View style={styles.publicationsGrid}>
            {SOCIAL_NETWORKS.map((network) => (
              <View key={network.id} style={styles.publicationCard}>
                <View style={[styles.socialIconBox, { backgroundColor: network.color + '15' }]}>
                  <Ionicons name={network.icon as any} size={24} color={network.color} />
                </View>
                <View style={styles.publicationInfo}>
                  <Text style={styles.publicationName}>{network.name}</Text>
                  <View style={styles.publicationCountRow}>
                    <AnimatedCounter 
                      key={`${network.id}-${animationKey}`}
                      value={stats.publications[network.id as keyof typeof stats.publications]} 
                    />
                    <Text style={styles.publicationLabel}> publications</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          
          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <AnimatedCounter key={`total-${animationKey}`} value={totalPublications} />
          </View>
        </View>

        {/* Section 2: Engagement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement</Text>
          <View style={styles.sectionTitleMargin} />
          
          <View style={styles.engagementGrid}>
            <View style={styles.engagementCard}>
              <View style={[styles.engagementIconBox, { backgroundColor: '#6366F115' }]}>
                <Ionicons name="eye" size={22} color="#6366F1" />
              </View>
              <AnimatedCounter 
                key={`views-${animationKey}`}
                value={stats.engagement.totalViews} 
              />
              <Text style={styles.engagementLabel}>Vues</Text>
            </View>
            
            <View style={styles.engagementCard}>
              <View style={[styles.engagementIconBox, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="heart" size={22} color="#EF4444" />
              </View>
              <AnimatedCounter 
                key={`likes-${animationKey}`}
                value={stats.engagement.totalLikes} 
              />
              <Text style={styles.engagementLabel}>J'aime</Text>
            </View>
            
            <View style={styles.engagementCard}>
              <View style={[styles.engagementIconBox, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="share-social" size={22} color="#10B981" />
              </View>
              <AnimatedCounter 
                key={`shares-${animationKey}`}
                value={stats.engagement.totalShares} 
              />
              <Text style={styles.engagementLabel}>Partages</Text>
            </View>
            
            <View style={styles.engagementCard}>
              <View style={[styles.engagementIconBox, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="chatbubble" size={22} color="#F59E0B" />
              </View>
              <AnimatedCounter 
                key={`comments-${animationKey}`}
                value={stats.engagement.totalComments} 
              />
              <Text style={styles.engagementLabel}>Commentaires</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          handleDateChange(date);
          setShowCalendar(false);
        }}
        onPeriodSelect={(start, end) => {
          handlePeriodChange(start, end);
          setShowCalendar(false);
        }}
        allowPeriodSelection={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  // Date Selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitleMargin: {
    height: 12,
  },
  // Publications
  publicationsGrid: {
    gap: Spacing.sm,
  },
  publicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.sm,
  },
  socialIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicationInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  publicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  publicationCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  publicationLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  // Engagement
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  engagementCard: {
    width: (width - Spacing.md * 4 - Spacing.sm) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  engagementIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  engagementLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Counter
  counterValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
