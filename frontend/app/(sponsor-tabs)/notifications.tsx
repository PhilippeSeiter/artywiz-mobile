import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSponsorStore } from '../../stores/sponsorStore';
import { SponsorMockService } from '../../services/sponsorMockService';
import { SponsorNotification } from '../../types/sponsor';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    notifications: storeNotifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    unreadCount 
  } = useSponsorStore();

  // Use store notifications if available, fallback to mock service
  const notifications = useMemo(() => {
    if (storeNotifications.length > 0) return storeNotifications;
    return SponsorMockService.getAllNotifications();
  }, [storeNotifications]);

  const getNotificationIcon = (type: SponsorNotification['type']) => {
    switch (type) {
      case 'counter_offer':
        return { name: 'swap-horizontal', color: Colors.warning };
      case 'accepted':
        return { name: 'checkmark-circle', color: Colors.success };
      case 'refused':
        return { name: 'close-circle', color: Colors.error };
      case 'expired':
        return { name: 'time', color: Colors.textSecondary };
      default:
        return { name: 'notifications', color: Colors.primary };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const handleNotificationPress = (notification: SponsorNotification) => {
    // Mark as read
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
    // Navigate to request detail
    if (notification.requestId) {
      router.push(`/request/${notification.requestId}`);
    }
  };

  const renderNotification = ({ item }: { item: SponsorNotification }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.notificationUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name as any} size={22} color={icon.color} />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.read && styles.textBold]}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.clubName}>{item.clubName}</Text>
            <Text style={styles.notificationDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (unreadCount === 0) return null;
    
    return (
      <TouchableOpacity 
        style={styles.markAllReadButton}
        onPress={markAllNotificationsRead}
      >
        <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
        <Text style={styles.markAllReadText}>Tout marquer comme lu</Text>
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
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent, 
          { paddingBottom: insets.bottom + Spacing.xxl }
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={64} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              Vous recevrez ici les réponses des clubs à vos offres de sponsoring
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  unreadBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  // List
  listContent: {
    padding: Spacing.md,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Notification card
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: Colors.primary + '05',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  textBold: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  clubName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  notificationDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.border,
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
});
