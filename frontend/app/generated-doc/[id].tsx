import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GeneratedDocsService } from '../../services/generatedDocsService';
import { MockDataService } from '../../services/mockDataService';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useDocumentStore } from '../../stores/documentStore';
import { RotatingStar } from '../../components';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Supports disponibles avec leurs icônes
const SUPPORTS_CONFIG = [
  { id: 'post', label: 'Post', icon: 'image-outline' },
  { id: 'reel', label: 'Reel', icon: 'play-circle-outline' },
  { id: 'affiche', label: 'Affiche', icon: 'document-outline' },
  { id: 'flyer', label: 'Flyer', icon: 'newspaper-outline' },
  { id: 'newsletter', label: 'Newsletter', icon: 'mail-outline' },
  { id: 'video', label: 'Vidéo HD', icon: 'videocam-outline' },
  { id: 'banniere', label: 'Bannière', icon: 'browsers-outline' },
];

// Options de partage
const SHARE_OPTIONS = [
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter', color: '#000000' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'email', name: 'Email', icon: 'mail', color: Colors.primary },
  { id: 'download', name: 'Télécharger', icon: 'download', color: Colors.success },
  { id: 'more', name: 'Plus...', icon: 'share-outline', color: Colors.textSecondary },
];

// Plateformes de publication directe
const PUBLISH_PLATFORMS = [
  { id: 'facebook', name: 'Facebook Page', icon: 'logo-facebook', color: '#1877F2', platform: 'facebook' },
  { id: 'instagram', name: 'Instagram Business', icon: 'logo-instagram', color: '#E4405F', platform: 'instagram' },
  { id: 'linkedin', name: 'LinkedIn Page', icon: 'logo-linkedin', color: '#0A66C2', platform: 'linkedin' },
];

interface SocialAccount {
  id: string;
  platform: string;
  account_type: string;
  name: string;
  username?: string;
  picture_url?: string;
  is_active: boolean;
}

export default function GeneratedDocDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sponsoringPrefs } = useUserPreferencesStore();
  const { getDocumentState, publishDocument } = useDocumentStore();

  const [selectedSupport, setSelectedSupport] = useState<string | null>(null);
  
  // Publication sur les réseaux
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishCaption, setPublishCaption] = useState('');

  // Check if auto-sponsoring is enabled
  const isAutoSponsoringEnabled = sponsoringPrefs?.autoSponsoringEnabled ?? false;

  // Get document - first try generated docs, then fall back to regular docs
  const generatedDoc = GeneratedDocsService.getGeneratedDocById(id as string);
  const regularDoc = MockDataService.getDocumentById(id as string);
  const document = generatedDoc || regularDoc;
  
  // Get document state from store (contains selected supports)
  const docState = getDocumentState(id as string);
  const selectedSupports = docState?.selectedSupports || ['post']; // Default to post

  // Animation values for swipe
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Set first available support as selected by default
  useEffect(() => {
    if (selectedSupports.length > 0 && !selectedSupport) {
      setSelectedSupport(selectedSupports[0]);
    }
  }, [selectedSupports]);

  // Charger les comptes connectés quand le modal s'ouvre
  const loadConnectedAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/social/accounts?user_id=default_user`);
      if (response.ok) {
        const accounts = await response.json();
        setConnectedAccounts(accounts);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Ouvrir le modal de publication
  const handleOpenPublishModal = () => {
    // Préparer la légende par défaut
    const defaultCaption = document 
      ? `${document.title}\n\n#Artywiz #Sports`
      : '';
    setPublishCaption(defaultCaption);
    setSelectedAccounts([]);
    setShowPublishModal(true);
    loadConnectedAccounts();
  };

  // Toggle sélection d'un compte
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Publier sur les comptes sélectionnés
  const handlePublishToSocial = async () => {
    if (selectedAccounts.length === 0) {
      Alert.alert('Attention', 'Sélectionnez au moins un compte');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/social/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_ids: selectedAccounts,
          document_id: document?.id || '',
          caption: publishCaption,
          image_url: 'https://example.com/mockup.jpg', // TODO: URL réelle du mockup
        }),
      });

      const result = await response.json();
      
      if (result.total_success > 0) {
        Alert.alert(
          'Publié ! 🎉',
          `Document publié sur ${result.total_success} compte(s)`,
          [{ text: 'OK', onPress: () => setShowPublishModal(false) }]
        );
        // Marquer comme publié
        if (document) publishDocument(document.id);
      } else {
        Alert.alert('Erreur', 'La publication a échoué');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier');
    } finally {
      setIsPublishing(false);
    }
  };

  // Connecter un nouveau compte - redirige vers edit-profile du profil actif
  const handleConnectAccount = () => {
    setShowPublishModal(false);
    const { selectedProfiles, activeProfileIndex } = useUserPreferencesStore.getState();
    const activeProfile = selectedProfiles[activeProfileIndex];
    if (activeProfile) {
      router.push(`/edit-profile?id=${activeProfile.id}`);
    }
  };

  // Get mockup/preview source
  const getPreviewSource = () => {
    if (generatedDoc) {
      return GeneratedDocsService.getPreviewSource(generatedDoc.previewImage);
    } else if (regularDoc) {
      return MockDataService.getDocMockup(regularDoc.id);
    }
    return null;
  };

  const previewSource = getPreviewSource();

  const handleShareOption = async (optionId: string) => {
    const title = document?.title || 'Document';
    
    switch (optionId) {
      case 'facebook':
        Alert.alert('Facebook', 'Publication sur Facebook en cours...');
        // Mark as published
        if (document) publishDocument(document.id);
        break;
      case 'instagram':
        Alert.alert('Instagram', 'Ouverture d\'Instagram...');
        if (document) publishDocument(document.id);
        break;
      case 'whatsapp':
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(`Découvrez ce document : ${title}`)}`;
        Linking.canOpenURL(whatsappUrl).then(supported => {
          if (supported) {
            Linking.openURL(whatsappUrl);
            if (document) publishDocument(document.id);
          } else {
            Alert.alert('WhatsApp', 'WhatsApp n\'est pas installé');
          }
        });
        break;
      case 'twitter':
        const twitterUrl = `twitter://post?message=${encodeURIComponent(title)}`;
        Linking.canOpenURL(twitterUrl).then(supported => {
          if (supported) {
            Linking.openURL(twitterUrl);
            if (document) publishDocument(document.id);
          } else {
            Alert.alert('X (Twitter)', 'X n\'est pas installé');
          }
        });
        break;
      case 'linkedin':
        Alert.alert('LinkedIn', 'Partage LinkedIn en cours...');
        if (document) publishDocument(document.id);
        break;
      case 'email':
        const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Voici mon document : ${title}`)}`;
        Linking.openURL(emailUrl);
        if (document) publishDocument(document.id);
        break;
      case 'download':
        Alert.alert('Téléchargement', `"${title}" a été téléchargé en HD.`);
        break;
      case 'more':
        try {
          await Share.share({
            message: `Découvrez ce document : ${title}`,
            title: title,
          });
          if (document) publishDocument(document.id);
        } catch (error) {
          console.log('Error sharing:', error);
        }
        break;
    }
  };

  if (!document) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Document</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorText}>Document introuvable</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sponsoringPrice = MockDataService.getSponsoringPrice(document.id);
  
  // Format date
  const formattedDate = new Date(document.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get team and competition labels
  const teamLabel = (document as any).teamLabel || '';
  const competitionLabel = (document as any).competitionLabel || '';
  const themeLabel = (document as any).typeLabel || '';

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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{document.title}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Image */}
        <View style={styles.imageContainer}>
          {previewSource && (
            <Image
              source={previewSource}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          {/* Sponsoring badge */}
          {isAutoSponsoringEnabled && (
            <View style={styles.sponsorBadge}>
              <RotatingStar size={14} color={Colors.white} />
              <Text style={styles.sponsorAmount}>{sponsoringPrice}€</Text>
            </View>
          )}
        </View>

        {/* Supports disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supports disponibles</Text>
          <View style={styles.supportsRow}>
            {selectedSupports.map((supportId) => {
              const support = SUPPORTS_CONFIG.find(s => s.id === supportId);
              if (!support) return null;
              
              const isSelected = selectedSupport === supportId;
              return (
                <TouchableOpacity
                  key={supportId}
                  style={[styles.supportChip, isSelected && styles.supportChipSelected]}
                  onPress={() => setSelectedSupport(supportId)}
                >
                  <Ionicons 
                    name={support.icon as any} 
                    size={20} 
                    color={isSelected ? Colors.white : Colors.textSecondary} 
                  />
                  <Text style={[styles.supportLabel, isSelected && styles.supportLabelSelected]}>
                    {support.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section Publier sur les réseaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publier sur les réseaux</Text>
          <TouchableOpacity 
            style={styles.publishButton}
            onPress={handleOpenPublishModal}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.publishButtonGradient}
            >
              <Ionicons name="paper-plane" size={20} color={Colors.white} />
              <Text style={styles.publishButtonText}>Publier directement</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.platformsPreview}>
            {PUBLISH_PLATFORMS.map(platform => (
              <View key={platform.id} style={styles.platformIcon}>
                <Ionicons name={platform.icon as any} size={20} color={platform.color} />
              </View>
            ))}
          </View>
        </View>

        {/* Section Partager */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partager</Text>
          <View style={styles.shareGrid}>
            {SHARE_OPTIONS.map(option => (
              <TouchableOpacity 
                key={option.id}
                style={styles.shareBtn}
                onPress={() => handleShareOption(option.id)}
              >
                <View style={[styles.shareIcon, { backgroundColor: option.color + '15' }]}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>
                <Text style={styles.shareName}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations du document */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            {/* Ligne 1: Équipe - Catégorie */}
            {(teamLabel || themeLabel) && (
              <View style={styles.infoRow}>
                <Ionicons name="football-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  {teamLabel ? `${teamLabel} - ` : ''}{themeLabel}
                </Text>
              </View>
            )}
            
            {/* Ligne 2: Championnat/Titre */}
            <View style={styles.infoRow}>
              <Ionicons name="trophy-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoTextBold}>
                {competitionLabel || document.title}
              </Text>
            </View>
            
            {/* Ligne 3: Date */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>le {formattedDate}</Text>
            </View>

            {/* Support actif */}
            {selectedSupport && (
              <View style={styles.infoRow}>
                <Ionicons name="phone-portrait-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  Support : {SUPPORTS_CONFIG.find(s => s.id === selectedSupport)?.label}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de publication sur les réseaux */}
      <Modal
        visible={showPublishModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPublishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.md }]}>
            {/* Header du modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Publier sur les réseaux</Text>
              <TouchableOpacity onPress={() => setShowPublishModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Contenu */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Message si aucun compte connecté */}
              {!isLoadingAccounts && connectedAccounts.length === 0 && (
                <View style={styles.noAccountsContainer}>
                  <Ionicons name="link-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.noAccountsTitle}>Aucun compte connecté</Text>
                  <Text style={styles.noAccountsText}>
                    Connectez vos Pages Facebook et comptes Instagram Business pour publier directement depuis Artywiz.
                  </Text>
                  
                  {/* Bouton pour connecter */}
                  <TouchableOpacity
                    style={styles.connectMetaBtn}
                    onPress={handleConnectAccount}
                  >
                    <LinearGradient
                      colors={['#1877F2', '#0866FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.connectMetaBtnGradient}
                    >
                      <Ionicons name="logo-facebook" size={20} color={Colors.white} />
                      <Text style={styles.connectMetaBtnText}>Connecter Meta</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Chargement */}
              {isLoadingAccounts && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Chargement des comptes...</Text>
                </View>
              )}

              {/* Liste des comptes connectés */}
              {!isLoadingAccounts && connectedAccounts.length > 0 && (
                <>
                  <Text style={styles.selectAccountsLabel}>Sélectionnez les comptes :</Text>
                  {connectedAccounts.map(account => {
                    const platformConfig = PUBLISH_PLATFORMS.find(p => p.platform === account.platform);
                    const isSelected = selectedAccounts.includes(account.id);
                    
                    return (
                      <TouchableOpacity
                        key={account.id}
                        style={[styles.accountItem, isSelected && styles.accountItemSelected]}
                        onPress={() => toggleAccountSelection(account.id)}
                      >
                        <View style={[styles.accountIcon, { backgroundColor: platformConfig?.color + '15' }]}>
                          <Ionicons 
                            name={platformConfig?.icon as any || 'globe'} 
                            size={24} 
                            color={platformConfig?.color || Colors.primary} 
                          />
                        </View>
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountName}>{account.name}</Text>
                          {account.username && (
                            <Text style={styles.accountUsername}>@{account.username}</Text>
                          )}
                        </View>
                        <Ionicons 
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
                          size={24} 
                          color={isSelected ? Colors.primary : Colors.border} 
                        />
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>

            {/* Bouton publier */}
            {connectedAccounts.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.publishNowButton,
                  selectedAccounts.length === 0 && styles.publishNowButtonDisabled
                ]}
                onPress={handlePublishToSocial}
                disabled={selectedAccounts.length === 0 || isPublishing}
              >
                {isPublishing ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color={Colors.white} />
                    <Text style={styles.publishNowButtonText}>
                      Publier sur {selectedAccounts.length} compte(s)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
  imageContainer: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
  },
  sponsorBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  sponsorAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  supportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  supportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  supportChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  supportLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  supportLabelSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  shareBtn: {
    alignItems: 'center',
    width: (width - Spacing.md * 2 - Spacing.md * 3) / 4,
  },
  shareIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  shareName: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoTextBold: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  // Styles pour la section "Publier sur les réseaux"
  publishButton: {
    marginBottom: Spacing.sm,
  },
  publishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  platformsPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Styles pour le Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  noAccountsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noAccountsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noAccountsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  connectButtonsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  connectPlatformBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  connectPlatformText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  selectAccountsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  accountItemSelected: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  accountUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  publishNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  publishNowButtonDisabled: {
    backgroundColor: Colors.border,
  },
  publishNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  connectMetaBtn: {
    width: '100%',
    marginTop: Spacing.md,
  },
  connectMetaBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  connectMetaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
