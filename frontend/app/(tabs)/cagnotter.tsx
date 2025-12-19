import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// Configuration animations gaming
const SPRING_CONFIG = {
  damping: 12,
  stiffness: 180,
  mass: 0.8,
};

const SPRING_BOUNCE = {
  damping: 8,
  stiffness: 250,
  mass: 0.6,
};

// Types
interface ATCWallet {
  id: string;
  user_id: string;
  balance_total: number;
  balance_locked: number;
  balance_available: number;
  unlock_date: string | null;
  total_earned: number;
  total_purchased: number;
  total_spent: number;
  current_price_eur: number;
  value_eur: number;
  created_at: string;
  updated_at: string;
}

interface ATCConfig {
  current_price_eur: number;
  next_price_eur: number;
  next_price_date: string;
  min_purchase_eur: number;
  max_purchase_eur: number | null;
  platform_fee_percent: number;
  vesting_months: number;
  vesting_end_date: string;
  active_promo: any | null;
}

interface ATCLedgerEntry {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  atc_price_eur: number;
  value_eur: number;
  source_type: string | null;
  source_id: string | null;
  description: string;
  is_locked: boolean;
  unlock_date: string | null;
  created_at: string;
}

// DEMO MODE - Mock data
const MOCK_WALLET: ATCWallet = {
  id: 'demo-wallet-001',
  user_id: 'demo-user',
  balance_total: 247.50,
  balance_locked: 200.00,
  balance_available: 47.50,
  unlock_date: '2026-06-15T00:00:00Z',
  total_earned: 127.50,
  total_purchased: 120.00,
  total_spent: 0,
  current_price_eur: 0.10,
  value_eur: 24.75,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2025-01-10T14:30:00Z',
};

const MOCK_CONFIG: ATCConfig = {
  current_price_eur: 0.10,
  next_price_eur: 0.15,
  next_price_date: '2025-02-15T00:00:00Z',
  min_purchase_eur: 10,
  max_purchase_eur: 500,
  platform_fee_percent: 15,
  vesting_months: 18,
  vesting_end_date: '2026-06-15T00:00:00Z',
  active_promo: null,
};

const MOCK_LEDGER: ATCLedgerEntry[] = [
  {
    id: 'tx-001',
    user_id: 'demo-user',
    transaction_type: 'earn_sponsor',
    amount: 50,
    balance_after: 247.50,
    atc_price_eur: 0.10,
    value_eur: 5.00,
    source_type: 'publication',
    source_id: 'pub-123',
    description: 'Sponsoring Nike - Match vs PSG',
    is_locked: true,
    unlock_date: '2026-06-15T00:00:00Z',
    created_at: '2025-01-08T16:45:00Z',
  },
  {
    id: 'tx-002',
    user_id: 'demo-user',
    transaction_type: 'purchase',
    amount: 100,
    balance_after: 197.50,
    atc_price_eur: 0.10,
    value_eur: 10.00,
    source_type: 'stripe',
    source_id: 'pay-456',
    description: 'Achat de 100 ATC',
    is_locked: true,
    unlock_date: '2026-06-15T00:00:00Z',
    created_at: '2025-01-05T09:20:00Z',
  },
  {
    id: 'tx-003',
    user_id: 'demo-user',
    transaction_type: 'earn_engagement',
    amount: 25,
    balance_after: 97.50,
    atc_price_eur: 0.10,
    value_eur: 2.50,
    source_type: 'engagement',
    source_id: 'eng-789',
    description: 'Bonus engagement +1000 likes',
    is_locked: true,
    unlock_date: '2026-06-15T00:00:00Z',
    created_at: '2025-01-02T11:00:00Z',
  },
  {
    id: 'tx-004',
    user_id: 'demo-user',
    transaction_type: 'earn_loyalty',
    amount: 10,
    balance_after: 72.50,
    atc_price_eur: 0.10,
    value_eur: 1.00,
    source_type: 'loyalty',
    source_id: 'loy-012',
    description: 'Bonus fidélité 30 jours',
    is_locked: true,
    unlock_date: '2026-06-15T00:00:00Z',
    created_at: '2024-12-28T08:00:00Z',
  },
];

// ============================================
// COMPTEUR ANIMÉ STYLE STATION ESSENCE
// ============================================
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);
  
  useEffect(() => {
    // Animation du compteur qui "tourne"
    const startValue = 0;
    const endValue = value;
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Easing pour un effet plus naturel
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayValue(endValue);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [value, duration]);
  
  // Séparer la partie entière et décimale
  const intPart = Math.floor(displayValue);
  const decPart = Math.floor((displayValue % 1) * 100);
  
  return (
    <View style={counterStyles.container}>
      <View style={counterStyles.digitGroup}>
        {String(intPart).padStart(3, '0').split('').map((digit, index) => (
          <View key={`int-${index}`} style={counterStyles.digitBox}>
            <Text style={counterStyles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
      <Text style={counterStyles.separator}>.</Text>
      <View style={counterStyles.digitGroup}>
        {String(decPart).padStart(2, '0').split('').map((digit, index) => (
          <View key={`dec-${index}`} style={[counterStyles.digitBox, counterStyles.decimalBox]}>
            <Text style={[counterStyles.digit, counterStyles.decimalDigit]}>{digit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const counterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitGroup: {
    flexDirection: 'row',
  },
  digitBox: {
    backgroundColor: '#0f0f1a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#FFB80040',
    minWidth: 36,
    alignItems: 'center',
  },
  decimalBox: {
    backgroundColor: '#1a1a2e',
    minWidth: 28,
  },
  digit: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFB800',
    fontVariant: ['tabular-nums'],
  },
  decimalDigit: {
    fontSize: 28,
    color: '#FFB800CC',
  },
  separator: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFB800',
    marginHorizontal: 2,
  },
});

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function WalletATCScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  // Use mock data
  const wallet = MOCK_WALLET;
  const config = MOCK_CONFIG;
  const ledger = MOCK_LEDGER;

  // Animations d'entrée gaming
  const headerY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);
  const balanceScale = useSharedValue(0.8);
  const balanceOpacity = useSharedValue(0);
  const statsY = useSharedValue(60);
  const statsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(60);
  const buttonsOpacity = useSharedValue(0);
  const historyY = useSharedValue(60);
  const historyOpacity = useSharedValue(0);

  useEffect(() => {
    // Animation séquentielle gaming à l'entrée
    const baseDelay = 100;
    
    // Header slide down
    setTimeout(() => {
      headerY.value = withSpring(0, SPRING_CONFIG);
      headerOpacity.value = withTiming(1, { duration: 300 });
    }, baseDelay);
    
    // Balance card pop
    setTimeout(() => {
      balanceScale.value = withSequence(
        withSpring(1.05, SPRING_BOUNCE),
        withSpring(1, SPRING_CONFIG)
      );
      balanceOpacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 2);
    
    // Stats slide up
    setTimeout(() => {
      statsY.value = withSpring(0, SPRING_CONFIG);
      statsOpacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 3);
    
    // Buttons
    setTimeout(() => {
      buttonsY.value = withSpring(0, SPRING_CONFIG);
      buttonsOpacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 4);
    
    // History
    setTimeout(() => {
      historyY.value = withSpring(0, SPRING_CONFIG);
      historyOpacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 5);
  }, []);

  // Styles animés
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOpacity.value,
  }));
  
  const balanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
    opacity: balanceOpacity.value,
  }));
  
  const statsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: statsY.value }],
    opacity: statsOpacity.value,
  }));
  
  const buttonsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonsY.value }],
    opacity: buttonsOpacity.value,
  }));
  
  const historyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: historyY.value }],
    opacity: historyOpacity.value,
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeRemaining = (unlockDate: string | null) => {
    if (!unlockDate) return 'N/A';
    
    const now = new Date();
    const unlock = new Date(unlockDate);
    const diffMs = unlock.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Déverrouillé';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    
    if (months > 0) return `${months} mois`;
    return `${days} jours`;
  };

  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'purchase':
        return { icon: 'cart', color: Colors.primary, prefix: '+' };
      case 'earn_sponsor':
        return { icon: 'gift', color: Colors.success, prefix: '+' };
      case 'earn_engagement':
        return { icon: 'heart', color: '#FF6B6B', prefix: '+' };
      case 'earn_referral':
        return { icon: 'people', color: '#9B59B6', prefix: '+' };
      case 'earn_loyalty':
        return { icon: 'star', color: Colors.warning, prefix: '+' };
      case 'admin_credit':
        return { icon: 'shield-checkmark', color: Colors.success, prefix: '+' };
      case 'transfer_out':
        return { icon: 'arrow-up', color: Colors.error, prefix: '-' };
      default:
        return { icon: 'swap-horizontal', color: Colors.textSecondary, prefix: '' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec logo W */}
      <Animated.View style={headerStyle}>
        <LinearGradient
          colors={['#FFB800', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
        >
          <View style={styles.headerContent}>
            <Image
              source={require('../../assets/images/logo_W.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleLine1}>Ma Cagnotte</Text>
              <Text style={styles.headerTitleLine2}>Artycoins</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Balance Card - Compteur style station essence */}
        <Animated.View style={balanceStyle}>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradient}
            >
              <Text style={styles.balanceLabel}>Solde total</Text>
              
              {/* Compteur animé */}
              <View style={styles.counterContainer}>
                <AnimatedCounter value={wallet?.balance_total || 0} duration={2000} />
                <Text style={styles.balanceCurrency}>ATC</Text>
              </View>

              {/* Locked / Available */}
              <View style={styles.balanceDetails}>
                <View style={styles.balanceDetailItem}>
                  <Ionicons name="lock-closed" size={16} color="#FFB800" />
                  <Text style={styles.balanceDetailLabel}>Verrouillé</Text>
                  <Text style={styles.balanceDetailValue}>
                    {wallet?.balance_locked.toFixed(2)} ATC
                  </Text>
                </View>
                <View style={styles.balanceDetailDivider} />
                <View style={styles.balanceDetailItem}>
                  <Ionicons name="lock-open" size={16} color={Colors.success} />
                  <Text style={styles.balanceDetailLabel}>Disponible</Text>
                  <Text style={styles.balanceDetailValue}>
                    {wallet?.balance_available.toFixed(2)} ATC
                  </Text>
                </View>
              </View>

              {/* Unlock countdown */}
              {wallet?.unlock_date && (
                <View style={styles.unlockInfo}>
                  <Ionicons name="time" size={14} color="#FFB800" />
                  <Text style={styles.unlockText}>
                    Déverrouillage dans {formatTimeRemaining(wallet.unlock_date)}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View style={statsStyle}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <Text style={styles.statValue}>{wallet?.total_earned.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Gagnés</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cart" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{wallet?.total_purchased.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Achetés</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="swap-horizontal" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>{wallet?.total_spent.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Utilisés</Text>
            </View>
          </View>
        </Animated.View>

        {/* Boutons Acheter / Vendre */}
        <Animated.View style={buttonsStyle}>
          {/* Buy ATC Button */}
          <TouchableOpacity style={styles.buyButton} activeOpacity={0.8}>
            <LinearGradient
              colors={['#FFB800', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyButtonGradient}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.buyButtonText}>Acheter des ATC</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Sell ATC Button */}
          <TouchableOpacity style={styles.sellButton} activeOpacity={0.8}>
            <Ionicons name="remove-circle" size={24} color="#6366F1" />
            <Text style={styles.sellButtonText}>Vendre mes ATC</Text>
          </TouchableOpacity>
          
          <Text style={styles.buyNote}>
            Minimum {config?.min_purchase_eur}€ • Commission {config?.platform_fee_percent}%
          </Text>
        </Animated.View>

        {/* Price Info Card */}
        <Animated.View style={historyStyle}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="trending-up" size={20} color="#FFB800" />
              <Text style={styles.infoTitle}>Évolution du prix</Text>
            </View>
            <View style={styles.priceEvolution}>
              <View style={styles.priceItem}>
                <Text style={styles.priceItemLabel}>Aujourd'hui</Text>
                <Text style={styles.priceItemValue}>{config?.current_price_eur.toFixed(2)}€</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} />
              <View style={styles.priceItem}>
                <Text style={styles.priceItemLabel}>Prochain</Text>
                <Text style={[styles.priceItemValue, { color: Colors.success }]}>
                  {config?.next_price_eur.toFixed(2)}€
                </Text>
              </View>
            </View>
            <Text style={styles.priceNote}>
              Prochain ajustement le {config ? formatDate(config.next_price_date) : '-'}
            </Text>
          </View>

          {/* Transaction History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Historique récent</Text>
            
            {ledger.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="receipt-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyHistoryText}>Aucune transaction</Text>
              </View>
            ) : (
              ledger.map((entry) => {
                const style = getTransactionStyle(entry.transaction_type);
                return (
                  <View key={entry.id} style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: style.color + '20' }]}>
                      <Ionicons name={style.icon as any} size={20} color={style.color} />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDesc}>{entry.description}</Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(entry.created_at)}
                        {entry.is_locked && (
                          <Text style={styles.lockedBadge}> • 🔒</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[styles.transactionValue, { color: style.color }]}>
                        {style.prefix}{entry.amount.toFixed(2)}
                      </Text>
                      <Text style={styles.transactionCurrency}>ATC</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* How to Earn Section */}
          <View style={styles.earnSection}>
            <Text style={styles.sectionTitle}>Comment gagner des ATC ?</Text>
            
            <View style={styles.earnItem}>
              <View style={[styles.earnIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="megaphone" size={20} color={Colors.success} />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Publications sponsorisées</Text>
                <Text style={styles.earnDesc}>Publiez du contenu avec les logos de vos sponsors</Text>
              </View>
            </View>

            <View style={styles.earnItem}>
              <View style={[styles.earnIcon, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="heart" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Bonus engagement</Text>
                <Text style={styles.earnDesc}>Plus de vues, likes et commentaires = plus d'ATC</Text>
              </View>
            </View>

            <View style={styles.earnItem}>
              <View style={[styles.earnIcon, { backgroundColor: '#9B59B620' }]}>
                <Ionicons name="people" size={20} color="#9B59B6" />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Parrainage</Text>
                <Text style={styles.earnDesc}>Invitez d'autres clubs et gagnez des ATC</Text>
              </View>
            </View>

            <View style={styles.earnItem}>
              <View style={[styles.earnIcon, { backgroundColor: Colors.warning + '20' }]}>
                <Ionicons name="star" size={20} color={Colors.warning} />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Fidélité</Text>
                <Text style={styles.earnDesc}>1 post/jour pendant 30 jours = 10 ATC bonus</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleLine1: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.9,
  },
  headerTitleLine2: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  balanceGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.md,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  balanceCurrency: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFB800',
    marginLeft: Spacing.sm,
  },
  balanceDetails: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    width: '100%',
  },
  balanceDetailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  balanceDetailDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.md,
  },
  balanceDetailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  balanceDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  unlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  unlockText: {
    fontSize: 12,
    color: '#FFB800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  buyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    backgroundColor: '#6366F115',
    borderWidth: 2,
    borderColor: '#6366F1',
    marginBottom: Spacing.xs,
  },
  sellButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  buyNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  priceEvolution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceItemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceItemValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  priceNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  historySection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lockedBadge: {
    color: Colors.warning,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionCurrency: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  earnSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  earnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  earnDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
