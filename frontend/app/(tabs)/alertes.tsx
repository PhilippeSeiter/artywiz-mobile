import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  UIManager,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../../constants';
import { Notification, NotificationType } from '../../types';
// Native Animated API used instead of reanimated for Expo Go compatibility

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

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.55;

// Configuration des types de notifications
const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; color: string; label: string }> = {
  validation: { icon: 'shield-checkmark', color: '#FF9500', label: 'Validation' },
  sponsoring: { icon: 'briefcase', color: '#34C759', label: 'Sponsoring' },
  document: { icon: 'document-text', color: '#0066FF', label: 'Document' },
  info: { icon: 'mail', color: '#5856D6', label: 'Message' },
};

// Interface étendue pour les notifications avec message
interface ExtendedNotification extends Notification {
  senderName?: string;
  fullMessage?: string;
  actionTaken?: 'accepted' | 'refused' | 'negotiated' | null;
}

// Données mockées enrichies
const MOCK_NOTIFICATIONS: ExtendedNotification[] = [
  {
    id: '1',
    title: 'Affiche du match FCV vs USM prête',
    subtitle: 'Cliquez pour télécharger',
    date: '2025-12-01',
    docId: 'doc1',
    state: 'unread',
    type: 'document',
    priority: 3,
    actionTaken: null,
  },
  {
    id: '2',
    title: 'Nouveau sponsor potentiel : SportMarket',
    subtitle: 'Consulter la proposition de partenariat',
    date: '2025-12-02',
    docId: 'doc2',
    state: 'unread',
    type: 'sponsoring',
    priority: 2,
    actionTaken: null,
  },
  {
    id: '3',
    title: 'Publication en attente de validation',
    subtitle: 'Le contenu attend votre approbation',
    date: '2025-12-03',
    docId: 'doc3',
    state: 'unread',
    type: 'validation',
    priority: 1,
    actionTaken: null,
  },
  {
    id: '4',
    senderName: 'Jean Dupont',
    title: 'Message de Jean Dupont',
    subtitle: 'Nouveau message reçu',
    fullMessage: 'Bonjour,\n\nJe souhaitais vous informer que nous avons finalisé le contrat de sponsoring avec la marque XYZ. Les termes ont été validés par notre équipe juridique.\n\nMerci de confirmer votre accord.',
    date: '2025-12-04',
    docId: 'doc5',
    state: 'unread',
    type: 'info',
    priority: 4,
    actionTaken: null,
  },
  {
    id: '5',
    title: 'Contrat sponsor à valider',
    subtitle: 'Action requise avant le 15/12',
    date: '2025-12-04',
    docId: 'doc7',
    state: 'unread',
    type: 'validation',
    priority: 1,
    actionTaken: null,
  },
  {
    id: '6',
    title: 'Proposition LocalShop',
    subtitle: 'Nouveau sponsor intéressé',
    date: '2025-12-05',
    docId: 'doc8',
    state: 'unread',
    type: 'sponsoring',
    priority: 2,
    actionTaken: null,
  },
  {
    id: '7',
    senderName: 'Marie Martin',
    title: 'Message de Marie Martin',
    subtitle: 'Question concernant le partenariat',
    fullMessage: 'Bonjour,\n\nPourriez-vous me confirmer les dates prévues pour la campagne publicitaire ? Nous devons planifier les livraisons.\n\nCordialement',
    date: '2025-12-03',
    docId: 'doc9',
    state: 'read',
    type: 'info',
    priority: 4,
    actionTaken: null,
  },
];

type SortOrder = 'recent' | 'oldest';

// Composant NotificationCard
const NotificationCard = ({ 
  item, 
  onAction, 
  isExpanded, 
  onToggleExpand,
}: { 
  item: ExtendedNotification; 
  onAction: (id: string, action: string, message?: string) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}) => {
  const config = NOTIFICATION_CONFIG[item.type];
  const isUnread = item.state === 'unread' && !item.actionTaken;
  const [showOverlay, setShowOverlay] = useState<'check' | 'cross' | null>(null);
  const [showNegotiateInput, setShowNegotiateInput] = useState(false);
  const [negotiateMessage, setNegotiateMessage] = useState('');
  // État pour la réponse aux messages
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation d'action (check ou cross)
  const handleActionWithOverlay = (actionType: 'accept' | 'refuse') => {
    const overlayType = actionType === 'accept' ? 'check' : 'cross';
    setShowOverlay(overlayType);
    
    Animated.sequence([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowOverlay(null);
      onAction(item.id, actionType);
    });
  };

  // Ouvrir zone de négociation
  const handleNegotiate = () => {
    setShowNegotiateInput(true);
  };

  // Ouvrir zone de réponse (pour messages)
  const handleReply = () => {
    setShowReplyInput(true);
  };

  // Envoyer la réponse
  const handleSendReply = () => {
    if (replyMessage.trim()) {
      onAction(item.id, 'reply', replyMessage);
      setShowReplyInput(false);
      setReplyMessage('');
    }
  };

  // Archiver le message
  const handleArchive = () => {
    onAction(item.id, 'archive');
  };

  // Envoyer message de négociation
  const handleSendNegotiate = () => {
    if (negotiateMessage.trim()) {
      onAction(item.id, 'negotiate', negotiateMessage);
      setShowNegotiateInput(false);
      setNegotiateMessage('');
    }
  };

  // Toggle expansion pour les messages - Animation gérée par Reanimated
  const handleToggleExpand = () => {
    onToggleExpand(item.id);
  };

  // Extraire les 3 premières lignes du message
  const getMessagePreview = () => {
    if (!item.fullMessage) return item.subtitle;
    const lines = item.fullMessage.split('\n').filter(l => l.trim());
    return lines.slice(0, 3).join('\n');
  };

  const isMessage = item.type === 'info' && item.fullMessage;

  return (
    <TouchableOpacity 
      activeOpacity={isMessage ? 0.8 : 1}
      onPress={isMessage ? handleToggleExpand : undefined}
      style={[styles.notificationCard, item.actionTaken && styles.notificationCardTreated]}
    >
      {/* Overlay pour action */}
      {showOverlay && (
        <Animated.View style={[styles.actionOverlay, { opacity: overlayOpacity }]}>
          <View style={[
            styles.overlayIconContainer,
            { backgroundColor: showOverlay === 'check' ? 'rgba(52, 199, 89, 0.5)' : 'rgba(255, 59, 48, 0.5)' }
          ]}>
            <Ionicons 
              name={showOverlay === 'check' ? 'checkmark' : 'close'} 
              size={64} 
              color="#FFF" 
            />
          </View>
        </Animated.View>
      )}

      {/* Badge action effectuée */}
      {item.actionTaken && (
        <View style={[
          styles.actionBadge,
          item.actionTaken === 'accepted' && styles.actionBadgeAccepted,
          item.actionTaken === 'refused' && styles.actionBadgeRefused,
          item.actionTaken === 'negotiated' && styles.actionBadgeNegotiated,
          item.actionTaken === 'replied' && styles.actionBadgeReplied,
          item.actionTaken === 'archived' && styles.actionBadgeArchived,
        ]}>
          <Text style={styles.actionBadgeText}>
            {item.actionTaken === 'accepted' && 'Accepté'}
            {item.actionTaken === 'refused' && 'Refusé'}
            {item.actionTaken === 'negotiated' && 'En discussion'}
            {item.actionTaken === 'replied' && 'Répondu'}
            {item.actionTaken === 'archived' && 'Archivé'}
          </Text>
        </View>
      )}

      {/* Icône type à gauche */}
      <View style={[styles.typeIconContainer, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon as any} size={28} color={config.color} />
      </View>

      {/* Contenu */}
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          {isMessage && item.senderName && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text
            style={[styles.notificationTitle, isUnread && styles.notificationTitleUnread]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {isMessage ? (isExpanded ? item.fullMessage : getMessagePreview()) : item.title}
          </Text>
          {isUnread && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
        </View>
        
        {!isMessage && (
          <Text style={styles.notificationSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
        
        <Text style={styles.notificationDate}>
          {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {/* Actions (seulement si pas déjà traité) */}
        {!item.actionTaken && (item.type === 'sponsoring' || item.type === 'validation') && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleActionWithOverlay('accept')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#34C75920' }]}>
                <Ionicons name="checkmark-circle" size={28} color="#34C759" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={handleNegotiate}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#FF950020' }]}>
                <Ionicons name="chatbubbles" size={28} color="#FF9500" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleActionWithOverlay('refuse')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#FF3B3020' }]}>
                <Ionicons name="close-circle" size={28} color="#FF3B30" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions pour documents */}
        {!item.actionTaken && item.type === 'document' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => onAction(item.id, 'download')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="download" size={28} color={Colors.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => onAction(item.id, 'share')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#5856D620' }]}>
                <Ionicons name="share-social" size={28} color="#5856D6" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Zone de négociation */}
        {showNegotiateInput && (
          <View style={styles.negotiateContainer}>
            <TextInput
              style={styles.negotiateInput}
              placeholder="Votre message"
              placeholderTextColor="#8E8E93"
              value={negotiateMessage}
              onChangeText={setNegotiateMessage}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !negotiateMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendNegotiate}
              disabled={!negotiateMessage.trim()}
            >
              <Text style={styles.sendButtonText}>Envoyer</Text>
              <Ionicons name="send" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Actions pour messages (quand ouvert) */}
        {isMessage && isExpanded && !item.actionTaken && !showReplyInput && (
          <View style={styles.messageActionsRow}>
            <TouchableOpacity
              style={styles.messageActionBtn}
              onPress={handleReply}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
              <Text style={styles.messageActionText}>Répondre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.messageActionBtn, styles.archiveBtn]}
              onPress={handleArchive}
            >
              <Ionicons name="archive-outline" size={18} color="#8E8E93" />
              <Text style={styles.archiveText}>Archiver</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Zone de réponse (pour messages) */}
        {isMessage && showReplyInput && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Votre réponse..."
              placeholderTextColor="#8E8E93"
              value={replyMessage}
              onChangeText={setReplyMessage}
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={styles.replyButtonsRow}>
              <TouchableOpacity 
                style={styles.cancelReplyBtn}
                onPress={() => {
                  setShowReplyInput(false);
                  setReplyMessage('');
                }}
              >
                <Text style={styles.cancelReplyText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendReplyButton, !replyMessage.trim() && styles.sendButtonDisabled]}
                onPress={handleSendReply}
                disabled={!replyMessage.trim()}
              >
                <Text style={styles.sendReplyText}>Envoyer</Text>
                <Ionicons name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Indicateur d'expansion pour messages */}
        {isMessage && !showReplyInput && (
          <View style={styles.expandIndicator}>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#8E8E93" 
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function AlertesScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<ExtendedNotification[]>(MOCK_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [filterValidation, setFilterValidation] = useState(false);
  const [filterInfo, setFilterInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Animation panel
  const slideAnim = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0)).current;

  // Animations standard React Native
  const headerY = useRef(new Animated.Value(-50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const searchY = useRef(new Animated.Value(30)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const tabsY = useRef(new Animated.Value(30)).current;
  const tabsOpacity = useRef(new Animated.Value(0)).current;

  // Animation d'entrée séquentielle 
  useEffect(() => {
    const baseDelay = 80;
    
    // Header slide down
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(headerY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, baseDelay);
    
    // Search bar
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(searchY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(searchOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, baseDelay * 2);
    
    // Tabs
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(tabsY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(tabsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, baseDelay * 3);
  }, []);

  // Styles animés natifs
  const headerAnimStyle = {
    transform: [{ translateY: headerY }],
    opacity: headerOpacity,
  };
  
  const searchAnimStyle = {
    transform: [{ translateY: searchY }],
    opacity: searchOpacity,
  };

  // Compteur de notifications non traitées (pour le badge)
  const unreadCount = notifications.filter((n) => n.state === 'unread' && !n.actionTaken).length;

  // Ouvrir le panneau d'options
  const openOptions = useCallback(() => {
    setShowOptions(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, overlayOpacityAnim]);

  // Fermer le panneau d'options
  const closeOptions = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: PANEL_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowOptions(false));
  }, [slideAnim, overlayOpacityAnim]);

  // Filtrer et trier les notifications
  const getFilteredNotifications = useCallback(() => {
    let filtered = [...notifications];

    // Mode historique = alertes traitées uniquement
    if (showHistory) {
      filtered = filtered.filter((n) => n.actionTaken !== null);
    } else {
      // Mode normal = alertes non traitées
      filtered = filtered.filter((n) => n.actionTaken === null);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.subtitle.toLowerCase().includes(query) ||
          (n.senderName && n.senderName.toLowerCase().includes(query))
      );
    }

    // Filtre par type (combinables)
    if (filterValidation || filterInfo) {
      filtered = filtered.filter((n) => {
        if (filterValidation && (n.type === 'validation' || n.type === 'sponsoring')) return true;
        if (filterInfo && (n.type === 'info' || n.type === 'document')) return true;
        return false;
      });
    }

    // Tri par date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [notifications, searchQuery, sortOrder, filterValidation, filterInfo, showHistory]);

  // Action sur notification - Animation Tetris gérée par react-native-reanimated
  const handleAction = useCallback((notificationId: string, action: string, message?: string) => {
    // Plus besoin de LayoutAnimation, les animations Tetris sont gérées par Reanimated
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId) {
          let actionTaken: 'accepted' | 'refused' | 'negotiated' | 'replied' | 'archived' | null = null;
          if (action === 'accept') actionTaken = 'accepted';
          else if (action === 'refuse') actionTaken = 'refused';
          else if (action === 'negotiate') actionTaken = 'negotiated';
          else if (action === 'download' || action === 'share') actionTaken = 'accepted';
          else if (action === 'reply') actionTaken = 'replied';
          else if (action === 'archive') actionTaken = 'archived';
          
          return { ...n, state: 'read' as const, actionTaken };
        }
        return n;
      })
    );
  }, []);

  // Toggle expansion
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Marquer tout comme lu
  const markAllAsRead = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, state: 'read' as const }))
    );
  };

  // Supprimer les notifications traitées
  const deleteReadNotifications = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications((prev) => prev.filter((n) => n.actionTaken === null));
  };

  const displayedNotifications = getFilteredNotifications();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header avec animation */}
      <Animated.View style={headerAnimStyle}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Image
            source={require('../../assets/images/logo_W.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Alertes</Text>
          <TouchableOpacity onPress={openOptions} style={styles.optionsButton}>
            <Ionicons name="options-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Barre de recherche avec animation */}
      <Animated.View style={[styles.searchContainer, searchAnimStyle]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Liste des notifications */}
      <ScrollView 
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={showHistory ? 'time-outline' : 'notifications-off-outline'} 
              size={64} 
              color="#C7C7CC" 
            />
            <Text style={styles.emptyText}>
              {showHistory ? 'Aucun historique' : 'Aucune notification'}
            </Text>
            <Text style={styles.emptySubtext}>
              {showHistory 
                ? 'Les alertes traitées apparaîtront ici' 
                : 'Vous serez notifié lorsque vous aurez des mises à jour'}
            </Text>
          </View>
        ) : (
          displayedNotifications.map((item, index) => (
            <View key={item.id}>
              <NotificationCard
                item={item}
                onAction={handleAction}
                isExpanded={expandedIds.has(item.id)}
                onToggleExpand={toggleExpand}
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* Overlay */}
      {showOptions && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacityAnim }]}>
          <TouchableOpacity style={styles.overlayTouch} onPress={closeOptions} activeOpacity={1} />
        </Animated.View>
      )}

      {/* Panneau d'options */}
      {showOptions && (
        <Animated.View
          style={[
            styles.optionsPanel,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Header du panneau */}
          <View style={styles.panelHeader}>
            <View style={styles.panelHandle} />
            <Text style={styles.panelTitle}>Options</Text>
            <TouchableOpacity onPress={closeOptions} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Recherche dans le panneau */}
          <View style={styles.panelSearchContainer}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              style={styles.panelSearchInput}
              placeholder="Rechercher..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Tri par date */}
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <TouchableOpacity
                style={[styles.filterChip, sortOrder === 'recent' && styles.filterChipActive]}
                onPress={() => setSortOrder('recent')}
              >
                <Text style={[styles.filterChipText, sortOrder === 'recent' && styles.filterChipTextActive]}>
                  Plus récents
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, sortOrder === 'oldest' && styles.filterChipActive]}
                onPress={() => setSortOrder('oldest')}
              >
                <Text style={[styles.filterChipText, sortOrder === 'oldest' && styles.filterChipTextActive]}>
                  Plus anciens
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtre par type */}
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <Ionicons name="funnel-outline" size={20} color="#666" />
              <TouchableOpacity
                style={[styles.filterChip, filterValidation && styles.filterChipActive]}
                onPress={() => setFilterValidation(!filterValidation)}
              >
                <Text style={[styles.filterChipText, filterValidation && styles.filterChipTextActive]}>
                  Validation
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filterInfo && styles.filterChipActive]}
                onPress={() => setFilterInfo(!filterInfo)}
              >
                <Text style={[styles.filterChipText, filterInfo && styles.filterChipTextActive]}>
                  Information
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.panelAction} onPress={markAllAsRead}>
              <Ionicons name="checkmark-done" size={22} color={Colors.primary} />
              <Text style={styles.panelActionText}>Tout marquer comme lu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.panelAction} onPress={deleteReadNotifications}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <Text style={[styles.panelActionText, { color: '#FF3B30' }]}>Supprimer les alertes lues</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.panelAction} onPress={() => setShowHistory(!showHistory)}>
              <Ionicons name="time-outline" size={22} color={showHistory ? Colors.primary : '#8E8E93'} />
              <Text style={[styles.panelActionText, { color: showHistory ? Colors.primary : '#8E8E93' }]}>
                Voir historique
              </Text>
              {showHistory && <Ionicons name="checkmark" size={20} color={Colors.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Export du compteur pour le badge (sera utilisé par le layout)
export const getUnreadAlertsCount = (): number => {
  // En production, cela viendrait d'un store global ou d'une API
  return MOCK_NOTIFICATIONS.filter((n) => n.state === 'unread' && !n.actionTaken).length;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  optionsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: Spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  notificationCardTreated: {
    opacity: 0.7,
    backgroundColor: '#F8F8F8',
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  overlayIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 5,
  },
  actionBadgeAccepted: {
    backgroundColor: '#34C75920',
  },
  actionBadgeRefused: {
    backgroundColor: '#FF3B3020',
  },
  actionBadgeNegotiated: {
    backgroundColor: '#FF950020',
  },
  actionBadgeReplied: {
    backgroundColor: '#5856D620',
  },
  actionBadgeArchived: {
    backgroundColor: '#8E8E9320',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  typeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5856D6',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    lineHeight: 20,
  },
  notificationTitleUnread: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#C7C7CC',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  actionIconBtn: {
    padding: 2,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  negotiateContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  negotiateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1C1C1E',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  // Styles pour actions messages
  messageActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  messageActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  messageActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  archiveBtn: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  archiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  // Styles pour zone de réponse
  replyContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  replyInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1C1C1E',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  replyButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelReplyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  cancelReplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  sendReplyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  sendReplyText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 10,
  },
  overlayTouch: {
    flex: 1,
  },
  optionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  panelHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    position: 'relative',
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 20,
    gap: 8,
  },
  panelSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  actionsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
  },
  panelAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  panelActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});
