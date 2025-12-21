import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientHeader, CustomButton, RotatingStar, AnimatedAccordion, useChevronAnimation } from '../../components';
import { Colors, Spacing } from '../../constants';
import { ASStrasbourgDataService, ASDocument } from '../../services/asStrasbourgDataService';
import { ASStrasbourgClubDataService } from '../../services/asStrasbourgClubDataService';
import { LGEFDataService } from '../../services/lgefDataService';
import { NormandieDataService } from '../../services/normandieDataService';
import { AlsaceDataService } from '../../services/alsaceDataService';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useDocumentStore } from '../../stores/documentStore';
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
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Helper pour trouver un document dans tous les services
const findDocumentById = (id: string) => {
  // Chercher dans AS Strasbourg - Seniors 1
  let doc = ASStrasbourgDataService.getDocumentById(id);
  if (doc) return { doc, allDocs: ASStrasbourgDataService.getAllDocuments() };
  
  // Chercher dans AS Strasbourg Club
  doc = ASStrasbourgClubDataService.getDocumentById(id);
  if (doc) return { doc, allDocs: ASStrasbourgClubDataService.getAllDocuments() };
  
  // Chercher dans LGEF
  doc = LGEFDataService.getDocumentById(id);
  if (doc) return { doc, allDocs: LGEFDataService.getAllDocuments() };
  
  // Chercher dans Normandie
  doc = NormandieDataService.getDocumentById(id);
  if (doc) return { doc, allDocs: NormandieDataService.getAllDocuments() };
  
  // Chercher dans Alsace
  doc = AlsaceDataService.getDocumentById(id);
  if (doc) return { doc, allDocs: AlsaceDataService.getAllDocuments() };
  
  return null;
};

// Types
type DocStatus = 'a_peaufiner' | 'pret_a_buzzer' | 'publie';

// Mock sponsors potentiels
const POTENTIAL_SPONSORS = [
  { id: 's1', name: 'Région Alsace', logo: '🏛️', offer: 10 },
  { id: 's2', name: 'Sport 2000', logo: '⚽', offer: 15 },
  { id: 's3', name: 'Crédit Mutuel', logo: '🏦', offer: 12 },
  { id: 's4', name: 'Adidas', logo: '👟', offer: 20 },
  { id: 's5', name: 'Pizza Hut', logo: '🍕', offer: 8 },
];

// Available supports
const SUPPORTS = [
  { id: 'post', label: 'Post', icon: 'image-outline', canPublish: true },
  { id: 'reel', label: 'Reel', icon: 'play-circle-outline', canPublish: true },
  { id: 'affiche', label: 'Affiche', icon: 'document-outline', canPublish: false },
  { id: 'flyer', label: 'Flyer', icon: 'newspaper-outline', canPublish: false },
  { id: 'newsletter', label: 'Newsletter', icon: 'mail-outline', canPublish: false },
  { id: 'video', label: 'Vidéo HD', icon: 'videocam-outline', canPublish: true },
  { id: 'banniere', label: 'Bannière', icon: 'browsers-outline', canPublish: false },
];

// Mapping pour les icônes de diffusion
const CHANNEL_ICONS: Record<string, { icon: string; color: string }> = {
  facebook: { icon: 'logo-facebook', color: '#1877F2' },
  instagram: { icon: 'logo-instagram', color: '#E4405F' },
  linkedin: { icon: 'logo-linkedin', color: '#0A66C2' },
  post: { icon: 'image-outline', color: '#10B981' },
  affiche: { icon: 'document-outline', color: '#8B5CF6' },
  reel: { icon: 'play-circle-outline', color: '#F59E0B' },
  download: { icon: 'download-outline', color: '#6B7280' },
};

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { sponsoringPrefs } = useUserPreferencesStore();
  const { startGeneration, getDocumentStatus, publishDocument } = useDocumentStore();

  const [isPreparingDoc, setIsPreparingDoc] = useState(false);
  const [selectedSupports, setSelectedSupports] = useState<string[]>(['post']);
  const [selectedSingleSupport, setSelectedSingleSupport] = useState<string>('post');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Canaux de diffusion utilisés (s'accumulent progressivement)
  const [usedChannels, setUsedChannels] = useState<string[]>([]);
  
  // Sponsors : 'accepted', 'refused', ou undefined (en attente)
  const [sponsorDecisions, setSponsorDecisions] = useState<Record<string, 'accepted' | 'refused'>>({});
  // Sponsor actuellement en mode édition (affiche les boutons)
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  
  // Accordéons (ouverts par défaut)
  const [sponsoringAccordionOpen, setSponsoringAccordionOpen] = useState(true);
  const [supportsAccordionOpen, setSupportsAccordionOpen] = useState(true);
  
  // Hook pour animation chevron
  const sponsoringChevronStyle = useChevronAnimation(sponsoringAccordionOpen);
  const supportsChevronStyle = useChevronAnimation(supportsAccordionOpen);
  
  // Proposer un sponsor
  const [proposeSponsorEmail, setProposeSponsorEmail] = useState('');
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  
  // Auto-scroll des sponsors
  const sponsorScrollRef = useRef<ScrollView>(null);
  
  // Loading states pour les actions
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState<string | null>(null); // 'facebook', 'instagram', 'linkedin'
  const [isSharing, setIsSharing] = useState(false);

  // Trouver le document avec le helper
  const docResult = findDocumentById(id as string);
  const document = docResult?.doc;
  const allDocuments = docResult?.allDocs || [];
  const currentIndex = allDocuments.findIndex(doc => doc.id === id);
  const totalDocs = allDocuments.length;

  const prevDocument = currentIndex > 0 ? allDocuments[currentIndex - 1] : null;
  const nextDocument = currentIndex < allDocuments.length - 1 ? allDocuments[currentIndex + 1] : null;

  // Get status from store
  const storeStatus = getDocumentStatus(id as string);
  
  const getDisplayStatus = (): DocStatus => {
    if (!document) return 'a_peaufiner';
    if (document.status === 'pret') return 'pret_a_buzzer';
    if (document.status === 'publie') return 'publie';
    return 'a_peaufiner';
  };
  
  const docStatus = getDisplayStatus();
  const isAutoSponsoringEnabled = sponsoringPrefs?.autoSponsoringEnabled ?? false;

  // Toggle support - multi ou single selon statut
  const toggleSupport = (supportId: string) => {
    if (docStatus === 'a_peaufiner') {
      setSelectedSupports(prev => 
        prev.includes(supportId)
          ? prev.filter(id => id !== supportId)
          : [...prev, supportId]
      );
    } else {
      setSelectedSingleSupport(supportId);
    }
  };

  // Animation values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotateZ = useSharedValue(0);
  const incomingTranslateX = useSharedValue(0);
  const incomingScale = useSharedValue(0.9);
  const incomingOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
    scale.value = 1;
    opacity.value = 1;
    rotateZ.value = 0;
    incomingOpacity.value = 0;
    setIsTransitioning(false);
  }, [id]);

  const navigateToDocument = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left' && nextDocument) {
      router.setParams({ id: nextDocument.id });
    } else if (direction === 'right' && prevDocument) {
      router.setParams({ id: prevDocument.id });
    }
  }, [nextDocument, prevDocument, router]);

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isTransitioning) return;
      translateX.value = event.translationX;
      const progress = Math.abs(event.translationX) / width;
      opacity.value = interpolate(progress, [0, 0.5], [1, 0.6], Extrapolation.CLAMP);
      scale.value = interpolate(progress, [0, 0.5], [1, 0.88], Extrapolation.CLAMP);
      rotateZ.value = interpolate(event.translationX, [-width, 0, width], [-10, 0, 10], Extrapolation.CLAMP);

      const direction = event.translationX > 0 ? 'right' : 'left';
      if (direction === 'left' && nextDocument) {
        incomingTranslateX.value = interpolate(progress, [0, 0.3], [width * 0.5, 0], Extrapolation.CLAMP);
        incomingScale.value = interpolate(progress, [0, 0.5], [0.85, 0.95], Extrapolation.CLAMP);
        incomingOpacity.value = interpolate(progress, [0, 0.3], [0, 0.8], Extrapolation.CLAMP);
      } else if (direction === 'right' && prevDocument) {
        incomingTranslateX.value = interpolate(progress, [0, 0.3], [-width * 0.5, 0], Extrapolation.CLAMP);
        incomingScale.value = interpolate(progress, [0, 0.5], [0.85, 0.95], Extrapolation.CLAMP);
        incomingOpacity.value = interpolate(progress, [0, 0.3], [0, 0.8], Extrapolation.CLAMP);
      }
    })
    .onEnd((event) => {
      if (isTransitioning) return;
      const shouldNavigate = Math.abs(event.translationX) > 80;
      const direction = event.translationX > 0 ? 'right' : 'left';
      const canNavigate = (direction === 'left' && nextDocument) || (direction === 'right' && prevDocument);
      
      if (shouldNavigate && canNavigate) {
        runOnJS(setIsTransitioning)(true);
        const exitDirection = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(exitDirection * width * 1.2, { duration: 280, easing: Easing.out(Easing.cubic) });
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.8, { duration: 200 });
        rotateZ.value = withTiming(exitDirection * 20, { duration: 250 });
        incomingTranslateX.value = withSpring(0, { damping: 18, stiffness: 120 });
        incomingScale.value = withSpring(1, { damping: 15, stiffness: 100 });
        incomingOpacity.value = withTiming(1, { duration: 250 }, () => {
          runOnJS(navigateToDocument)(direction);
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        rotateZ.value = withSpring(0, { damping: 15, stiffness: 150 });
        incomingOpacity.value = withTiming(0, { duration: 150 });
        incomingScale.value = withTiming(0.85, { duration: 150 });
      }
    });

  const currentCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotateZ.value}deg` },
    ],
    opacity: opacity.value,
    zIndex: 2,
  }));

  const incomingCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: incomingTranslateX.value },
      { scale: incomingScale.value },
    ],
    opacity: incomingOpacity.value,
    zIndex: 1,
  }));

  if (!document) {
    return (
      <View style={styles.container}>
        <GradientHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Document introuvable</Text>
          <CustomButton title="Retour" onPress={() => router.back()} variant="secondary" />
        </View>
      </View>
    );
  }

  // Utiliser les propriétés du nouveau modèle de données
  const sponsoringPrice = document.sponsorPrice || 0;
  const mockup = document.mockupImage;
  const nextMockup = nextDocument ? nextDocument.mockupImage : null;

  // === HANDLERS ===

  const handlePrepareDocument = () => {
    if (selectedSupports.length === 0) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner au moins un support.');
      return;
    }
    setIsPreparingDoc(true);
    startGeneration(document.id, selectedSupports);
    Alert.alert(
      'Document en préparation',
      `Votre document est en cours de génération pour ${selectedSupports.length} support(s).`,
      [{ text: 'OK', onPress: () => { setIsPreparingDoc(false); router.back(); }}]
    );
  };

  // Ajouter un canal à la liste des canaux utilisés
  const addUsedChannel = (channel: string) => {
    if (!usedChannels.includes(channel)) {
      setUsedChannels(prev => [...prev, channel]);
    }
  };

  // === VRAIES ACTIONS ===

  // Télécharger l'image dans la galerie
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Demander la permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la galerie pour télécharger.');
        setIsDownloading(false);
        return;
      }
      
      // Charger l'asset (image du mockup)
      const asset = Asset.fromModule(mockup);
      await asset.downloadAsync();
      
      if (asset.localUri) {
        // Copier dans un fichier temporaire
        const filename = `artywiz_${document.id}_${Date.now()}.png`;
        const fileUri = FileSystem.cacheDirectory + filename;
        
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: fileUri,
        });
        
        // Sauvegarder dans la galerie
        const savedAsset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('ArtyWiz', savedAsset, false);
        
        addUsedChannel(selectedSingleSupport);
        const supportLabel = SUPPORTS.find(s => s.id === selectedSingleSupport)?.label || 'Document';
        Alert.alert('✅ Téléchargé !', `Le ${supportLabel} a été sauvegardé dans votre galerie (album ArtyWiz).`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Erreur', 'Impossible de télécharger l\'image.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Partager l'image via le menu natif
  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      // Charger l'asset
      const asset = Asset.fromModule(mockup);
      await asset.downloadAsync();
      
      if (asset.localUri) {
        // Vérifier si le partage est disponible
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(asset.localUri, {
            mimeType: 'image/png',
            dialogTitle: `Partager ${document.ligne2}`,
          });
        } else {
          // Fallback vers Share natif
          await Share.share({
            message: `${document.ligne2} - Créé avec ArtyWiz`,
            title: document.ligne2,
          });
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      if ((error as any).message !== 'User did not share') {
        Alert.alert('Erreur', 'Impossible de partager.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Publier sur les réseaux sociaux (via API backend)
  const handlePublish = async (platform: 'facebook' | 'instagram' | 'linkedin') => {
    try {
      setIsPublishing(platform);
      
      // Récupérer le profil actif
      const { selectedProfiles, activeProfileIndex, getSocialConnections } = useUserPreferencesStore.getState();
      const activeProfile = selectedProfiles[activeProfileIndex];
      
      if (!activeProfile) {
        Alert.alert('Erreur', 'Aucun profil actif trouvé.');
        setIsPublishing(null);
        return;
      }
      
      // Vérifier si le compte RS est connecté
      const connections = getSocialConnections(activeProfile.id);
      const platformType = platform === 'facebook' || platform === 'instagram' ? 'meta' : 'linkedin';
      const connection = connections.find(c => c.platform === platformType);
      
      if (!connection?.connected) {
        Alert.alert(
          'Compte non connecté',
          `Veuillez d'abord connecter votre compte ${platform === 'linkedin' ? 'LinkedIn' : 'Meta'} dans les paramètres du profil.`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Configurer', onPress: () => router.push(`/edit-profile?id=${activeProfile.id}`) }
          ]
        );
        setIsPublishing(null);
        return;
      }
      
      // Appeler l'API backend pour publier
      const response = await fetch(`${BACKEND_URL}/api/social/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeProfile.id,
          platform: platform,
          content: {
            title: document.ligne2,
            description: `${document.ligne3} - ${document.ligne4 || ''}`,
            // En production, envoyer l'URL de l'image hébergée
            // image_url: 'https://...',
          }
        }),
      });
      
      if (response.ok) {
        addUsedChannel(platform);
        publishDocument(document.id);
        
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        Alert.alert('✅ Publié !', `Votre document a été publié sur ${platformName}.`);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur de publication');
      }
    } catch (error) {
      console.error('Publish error:', error);
      Alert.alert('Erreur de publication', (error as Error).message || 'Impossible de publier.');
    } finally {
      setIsPublishing(null);
    }
  };

  // Accepter/Refuser un sponsor
  const handleSponsorAction = (sponsorId: string, accept: boolean) => {
    const acceptedCount = Object.values(sponsorDecisions).filter(d => d === 'accepted').length;
    
    if (accept && acceptedCount >= 4) {
      Alert.alert('Maximum atteint', 'Vous ne pouvez accepter que 4 sponsors maximum.');
      return;
    }
    
    setSponsorDecisions(prev => ({
      ...prev,
      [sponsorId]: accept ? 'accepted' : 'refused'
    }));
    
    // Fermer le mode édition
    setEditingSponsorId(null);
  };
  
  // Toggle mode édition d'un sponsor (pour re-afficher les boutons)
  const toggleSponsorEdit = (sponsorId: string) => {
    setEditingSponsorId(prev => prev === sponsorId ? null : sponsorId);
  };
  
  // Compter les sponsors acceptés
  const acceptedCount = Object.values(sponsorDecisions).filter(d => d === 'accepted').length;
  
  // Proposer un sponsor (version mockée)
  const handleProposeSponsor = async () => {
    if (!proposeSponsorEmail.trim()) {
      Alert.alert('Email requis', 'Veuillez saisir l\'email du sponsor.');
      return;
    }
    
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(proposeSponsorEmail)) {
      Alert.alert('Email invalide', 'Veuillez saisir une adresse email valide.');
      return;
    }
    
    setIsSendingProposal(true);
    
    // Simulation d'envoi (mockée)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSendingProposal(false);
    setProposeSponsorEmail('');
    
    Alert.alert(
      '✅ Proposition envoyée !',
      `Un email a été envoyé à ${proposeSponsorEmail} avec le visuel du document.`,
      [{ text: 'OK' }]
    );
  };

  // Obtenir les boutons d'action selon le support sélectionné
  const getActionButtons = () => {
    const support = SUPPORTS.find(s => s.id === selectedSingleSupport);
    const canPublish = support?.canPublish ?? false;
    
    return (
      <View style={styles.actionButtonsContainer}>
        {canPublish && (
          <>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#1877F2' }, isPublishing === 'facebook' && styles.actionBtnDisabled]} 
              onPress={() => handlePublish('facebook')}
              disabled={!!isPublishing}
            >
              {isPublishing === 'facebook' ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="logo-facebook" size={20} color="#FFF" />
              )}
              <Text style={styles.actionBtnText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#E4405F' }, isPublishing === 'instagram' && styles.actionBtnDisabled]} 
              onPress={() => handlePublish('instagram')}
              disabled={!!isPublishing}
            >
              {isPublishing === 'instagram' ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="logo-instagram" size={20} color="#FFF" />
              )}
              <Text style={styles.actionBtnText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#0A66C2' }, isPublishing === 'linkedin' && styles.actionBtnDisabled]} 
              onPress={() => handlePublish('linkedin')}
              disabled={!!isPublishing}
            >
              {isPublishing === 'linkedin' ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="logo-linkedin" size={20} color="#FFF" />
              )}
              <Text style={styles.actionBtnText}>LinkedIn</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#10B981' }, isDownloading && styles.actionBtnDisabled]} 
          onPress={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#FFF" />
          )}
          <Text style={styles.actionBtnText}>{isDownloading ? 'Téléchargement...' : 'Télécharger'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#6B7280' }, isSharing && styles.actionBtnDisabled]} 
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="share-social-outline" size={20} color="#FFF" />
          )}
          <Text style={styles.actionBtnText}>{isSharing ? 'Partage...' : 'Partager'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render le badge de statut avec icônes progressives
  const renderStatusBadge = () => {
    if (docStatus === 'a_peaufiner') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#EF4444' }]}>
          <Ionicons name="document-text-outline" size={16} color="#FFF" />
          <Text style={styles.statusBadgeText}>Brouillon</Text>
        </View>
      );
    }
    
    // Pour "Prêt à buzzer" et "Publié" : badge vert avec icônes
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
        {usedChannels.length === 0 ? (
          <>
            <Ionicons name="flash" size={16} color="#FFF" />
            <Text style={styles.statusBadgeText}>Prêt à buzzer</Text>
          </>
        ) : (
          <>
            {usedChannels.map((channel, idx) => {
              const channelInfo = CHANNEL_ICONS[channel];
              return (
                <Ionicons 
                  key={channel + idx} 
                  name={channelInfo?.icon as any || 'checkmark'} 
                  size={16} 
                  color="#FFF" 
                  style={{ marginRight: idx < usedChannels.length - 1 ? 4 : 0 }}
                />
              );
            })}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader 
        ligne1={document.ligne1}
        ligne2={document.ligne2}
        ligne3={document.ligne3}
        ligne4={document.ligne4}
        showBack
        onBackPress={() => router.back()}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentNoPadding} showsVerticalScrollIndicator={false}>
        
        {/* Swipe indicator - compact */}
        <View style={styles.swipeIndicatorCompact}>
          <Ionicons name="chevron-back" size={16} color={prevDocument ? Colors.textSecondary : Colors.border} />
          <Text style={styles.swipeText}>{currentIndex >= 0 ? `${currentIndex + 1} / ${totalDocs}` : ''}</Text>
          <Ionicons name="chevron-forward" size={16} color={nextDocument ? Colors.textSecondary : Colors.border} />
        </View>

        {/* Mockup PLEINE LARGEUR - sans card, sans espaces */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.fullWidthMockupContainer, currentCardStyle]}>
            <Image source={mockup} style={styles.fullWidthMockup} resizeMode="cover" />
          </Animated.View>
        </GestureDetector>

        {/* Incoming mockup for swipe */}
        {(prevDocument || nextDocument) && (
          <Animated.View style={[styles.fullWidthMockupContainer, styles.incomingMockup, incomingCardStyle]}>
            {nextMockup && <Image source={nextMockup} style={styles.fullWidthMockup} resizeMode="cover" />}
          </Animated.View>
        )}

        {/* Supports selection - just after mockup */}
        <View style={styles.supportsSection}>
          <Text style={styles.supportsSectionTitle}>Choisissez vos supports</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supportsRow}>
            {SUPPORTS.map((support) => (
              <TouchableOpacity
                key={support.id}
                style={[
                  styles.supportChip,
                  selectedSupports.includes(support.id) && styles.supportChipSelected
                ]}
                onPress={() => {
                  setSelectedSupports(prev => 
                    prev.includes(support.id) 
                      ? prev.filter(s => s !== support.id)
                      : [...prev, support.id]
                  );
                }}
              >
                <Ionicons 
                  name={support.icon as any} 
                  size={18} 
                  color={selectedSupports.includes(support.id) ? Colors.white : Colors.textSecondary} 
                />
                <Text style={[
                  styles.supportChipText,
                  selectedSupports.includes(support.id) && styles.supportChipTextSelected
                ]}>
                  {support.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* === SECTION AUTOSPONSORING (Accordéon) === */}
        {isAutoSponsoringEnabled && (
          <View style={styles.accordionWrapper}>
            <AnimatedAccordion
              isOpen={sponsoringAccordionOpen}
              onToggle={() => setSponsoringAccordionOpen(!sponsoringAccordionOpen)}
              maxHeight={350}
              header={
                <View style={styles.accordionHeader}>
                  <View style={styles.accordionHeaderLeft}>
                    <View style={styles.accordionIcon}>
                      <RotatingStar size={18} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={styles.accordionTitle}>AutoSponsoring</Text>
                      <Text style={styles.accordionSubtitle}>{acceptedCount}/4 sponsors • {sponsoringPrice}€ potentiel</Text>
                    </View>
                  </View>
                  <Animated.View style={sponsoringChevronStyle}>
                    <Ionicons name="chevron-down" size={22} color={Colors.textSecondary} />
                  </Animated.View>
                </View>
              }
            >
              {/* Carousel de sponsors */}
              <ScrollView 
                ref={sponsorScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sponsorsCarousel}
              >
                {POTENTIAL_SPONSORS.map((sponsor) => {
                  const decision = sponsorDecisions[sponsor.id];
                  const isEditing = editingSponsorId === sponsor.id;
                  const showButtons = !decision || isEditing;
                  
                  const cardBgColor = decision === 'accepted' ? '#D1FAE5' : decision === 'refused' ? '#FEE2E2' : '#FFF';
                  const borderColor = decision === 'accepted' ? '#10B981' : decision === 'refused' ? '#EF4444' : 'transparent';
                  
                  return (
                    <TouchableOpacity 
                      key={sponsor.id} 
                      style={[
                        styles.sponsorCard, 
                        { backgroundColor: cardBgColor, borderWidth: decision ? 2 : 0, borderColor }
                      ]}
                      onPress={() => decision && toggleSponsorEdit(sponsor.id)}
                      activeOpacity={decision ? 0.7 : 1}
                    >
                      <Text style={styles.sponsorLogo}>{sponsor.logo}</Text>
                      <Text style={styles.sponsorName} numberOfLines={1}>{sponsor.name}</Text>
                      <Text style={[
                        styles.sponsorOffer, 
                        decision === 'refused' && { color: '#EF4444', textDecorationLine: 'line-through' }
                      ]}>{sponsor.offer}€</Text>
                      
                      {showButtons && (
                        <View style={styles.sponsorActions}>
                          <TouchableOpacity 
                            style={[styles.sponsorBtn, styles.sponsorBtnReject]}
                            onPress={() => handleSponsorAction(sponsor.id, false)}
                          >
                            <Ionicons name="close" size={18} color="#EF4444" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.sponsorBtn, styles.sponsorBtnAccept]}
                            onPress={() => handleSponsorAction(sponsor.id, true)}
                            disabled={acceptedCount >= 4 && decision !== 'accepted'}
                          >
                            <Ionicons name="checkmark" size={18} color="#10B981" />
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {decision && !isEditing && (
                        <View style={styles.sponsorDecisionIcon}>
                          <Ionicons 
                            name={decision === 'accepted' ? 'checkmark-circle' : 'close-circle'} 
                            size={20} 
                            color={decision === 'accepted' ? '#10B981' : '#EF4444'} 
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              {/* Formulaire Proposer un sponsor */}
              <View style={styles.proposeSponsorContainer}>
                <Text style={styles.proposeSponsorTitle}>Proposer un sponsor</Text>
                <View style={styles.proposeSponsorForm}>
                  <TextInput
                    style={styles.proposeSponsorInput}
                    placeholder="Email du sponsor"
                    placeholderTextColor="#9CA3AF"
                    value={proposeSponsorEmail}
                    onChangeText={setProposeSponsorEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    style={[styles.proposeSponsorBtn, isSendingProposal && styles.proposeSponsorBtnDisabled]}
                    onPress={handleProposeSponsor}
                    disabled={isSendingProposal}
                  >
                    {isSendingProposal ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color="#FFF" />
                        <Text style={styles.proposeSponsorBtnText}>Proposer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedAccordion>
          </View>
        )}

        {/* === SECTION SUPPORTS (Accordéon) === */}
        <View style={styles.accordionWrapper}>
          <AnimatedAccordion
            isOpen={supportsAccordionOpen}
            onToggle={() => setSupportsAccordionOpen(!supportsAccordionOpen)}
            maxHeight={200}
            header={
              <View style={styles.accordionHeader}>
                <View style={styles.accordionHeaderLeft}>
                  <View style={[styles.accordionIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="layers-outline" size={18} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={styles.accordionTitle}>Supports</Text>
                    <Text style={styles.accordionSubtitle}>
                      {docStatus === 'a_peaufiner' 
                        ? `${selectedSupports.length} sélectionné(s)` 
                        : SUPPORTS.find(s => s.id === selectedSingleSupport)?.label || 'Post'}
                    </Text>
                  </View>
                </View>
                <Animated.View style={supportsChevronStyle}>
                  <Ionicons name="chevron-down" size={22} color={Colors.textSecondary} />
                </Animated.View>
              </View>
            }
          >
            <View style={styles.supportsGrid}>
              {SUPPORTS.map((support) => {
                const isSelected = docStatus === 'a_peaufiner' 
                  ? selectedSupports.includes(support.id)
                  : selectedSingleSupport === support.id;
                return (
                  <TouchableOpacity
                    key={support.id}
                    style={[styles.supportChip, isSelected && styles.supportChipSelected]}
                    onPress={() => toggleSupport(support.id)}
                  >
                    <Ionicons name={support.icon as any} size={18} color={isSelected ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.supportLabel, isSelected && styles.supportLabelSelected]}>
                      {support.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </AnimatedAccordion>
        </View>

        {/* === BOUTONS D'ACTION === */}
        <View style={styles.actions}>
          {docStatus === 'a_peaufiner' ? (
            <CustomButton
              title={isPreparingDoc ? "Préparation..." : "FINALISER CE DOCUMENT"}
              onPress={handlePrepareDocument}
              icon="sparkles"
              loading={isPreparingDoc}
              disabled={selectedSupports.length === 0}
            />
          ) : (
            getActionButtons()
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingBottom: Spacing.xxl },
  contentNoPadding: { paddingBottom: Spacing.xxl },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorText: { fontSize: 18, color: Colors.textSecondary, marginBottom: Spacing.lg },
  
  // Swipe indicator compact
  swipeIndicatorCompact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: Spacing.sm },
  swipeIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xs, gap: Spacing.sm },
  swipeText: { fontSize: 12, color: Colors.textSecondary },
  
  // Full width mockup - SANS marges, SANS card
  fullWidthMockupContainer: { width: width, height: width * 1.1 },
  fullWidthMockup: { width: '100%', height: '100%' },
  incomingMockup: { position: 'absolute', top: 0, left: 0 },
  
  // Legacy card styles (pour compatibilité)
  cardContainer: { height: width * 1.1, marginHorizontal: Spacing.md, marginVertical: Spacing.sm, position: 'relative' },
  card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.white, borderRadius: 20, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8, overflow: 'hidden' },
  incomingCard: { position: 'absolute' },
  previewCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  mockup: { width: '100%', height: '100%' },
  sponsorBadge: { position: 'absolute', top: Spacing.md, right: Spacing.md, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: 16, gap: 4 },
  sponsorAmount: { fontSize: 14, fontWeight: '700', color: Colors.white },
  
  // Info section compact (sans titre)
  infoSectionCompact: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  infoSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  documentTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  
  // Badges row (Status + AutoSponsoring)
  badgesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  statusBadgeText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  autoSponsoringBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  autoSponsoringBadgeText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  sponsorInfoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  sponsorInfoText: { fontSize: 13, fontWeight: '600', color: '#D97706' },
  
  // Sponsoring section (inside accordion)
  sponsoringSection: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm },
  sponsorsCarousel: { paddingVertical: Spacing.sm, gap: Spacing.sm },
  sponsorCard: { width: 100, backgroundColor: '#FFF', borderRadius: 12, padding: Spacing.sm, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  sponsorLogo: { fontSize: 28, marginBottom: 4 },
  sponsorName: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  sponsorOffer: { fontSize: 14, fontWeight: '700', color: '#10B981', marginVertical: 4 },
  sponsorActions: { flexDirection: 'row', gap: 8 },
  sponsorBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  sponsorBtnReject: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  sponsorBtnAccept: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  sponsorDecisionIcon: { marginTop: 4 },
  noSponsorsText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', paddingHorizontal: Spacing.md },
  
  // Accordion wrapper
  accordionWrapper: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: Spacing.md, borderRadius: 12 },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  accordionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  accordionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  accordionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  
  // Propose sponsor form
  proposeSponsorContainer: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  proposeSponsorTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  proposeSponsorForm: { flexDirection: 'row', gap: Spacing.sm },
  proposeSponsorInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary },
  proposeSponsorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F1', paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: 10, gap: 6 },
  proposeSponsorBtnDisabled: { opacity: 0.7 },
  proposeSponsorBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  
  // Support section
  supportsSection: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.background },
  supportsSectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  supportsRow: { gap: Spacing.sm, paddingRight: Spacing.md },
  supportSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  supportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  supportChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  supportChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  supportChipText: { fontSize: 13, color: Colors.textSecondary },
  supportChipTextSelected: { color: Colors.white, fontWeight: '600' },
  supportLabel: { fontSize: 14, color: Colors.textSecondary },
  supportLabelSelected: { color: Colors.white, fontWeight: '500' },
  
  // Actions
  actions: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  actionButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, gap: 6, minWidth: 100 },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
});
