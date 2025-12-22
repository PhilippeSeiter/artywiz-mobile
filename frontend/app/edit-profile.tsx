import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { 
  useUserPreferencesStore, 
  UserProfile,
  ARTYWIZ_THEMES,
  GENERIC_THEMES,
  SocialConnection,
} from '../stores/userPreferencesStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ============================================
// CONFIGURATION ANIMATIONS "JEU VIDÉO"
// ============================================
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

const SPRING_SNAPPY = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

// ============================================
// COMPOSANT ACCORDEON GAMING
// ============================================
interface GamingAccordionProps {
  title: string;
  countLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

const GamingAccordion = ({
  title,
  countLabel,
  icon,
  iconColor,
  iconBgColor,
  children,
  isOpen,
  onToggle,
  index,
}: GamingAccordionProps) => {
  const heightProgress = useSharedValue(0);
  const arrowRotation = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const borderGlow = useSharedValue(0);
  
  const [contentHeight, setContentHeight] = useState(0);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Ouverture avec effet "power up"
      heightProgress.value = withSpring(1, SPRING_CONFIG);
      arrowRotation.value = withSpring(180, SPRING_BOUNCE);
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 250 }));
      
      // Effet de glow pulsé
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 150 }),
        withTiming(0.3, { duration: 200 })
      );
      borderGlow.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.5, { duration: 300 })
      );
    } else {
      // Fermeture fluide
      contentOpacity.value = withTiming(0, { duration: 100 });
      heightProgress.value = withSpring(0, SPRING_SNAPPY);
      arrowRotation.value = withSpring(0, SPRING_BOUNCE);
      glowOpacity.value = withTiming(0, { duration: 150 });
      borderGlow.value = withTiming(0, { duration: 150 });
    }
  }, [isOpen]);

  const handlePressIn = () => {
    headerScale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    headerScale.value = withSpring(1, SPRING_BOUNCE);
  };

  // Styles animés
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(0, 102, 255, ${borderGlow.value * 0.5})`,
    borderWidth: interpolate(borderGlow.value, [0, 1], [0, 2], Extrapolation.CLAMP),
  }));

  const contentContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      heightProgress.value,
      [0, 1],
      [0, contentHeight || 400],
      Extrapolation.CLAMP
    );
    return {
      height: measured ? height : (heightProgress.value > 0 ? undefined : 0),
      opacity: contentOpacity.value,
      overflow: 'hidden' as const,
    };
  });

  const measureContent = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && !measured) {
      setContentHeight(height + 20);
      setMeasured(true);
    }
  };

  return (
    <Animated.View style={[styles.accordionContainer, borderStyle]}>
      {/* Header cliquable */}
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.accordionHeader, headerAnimatedStyle]}>
          {/* Glow effect background */}
          <Animated.View 
            style={[
              styles.headerGlow, 
              glowStyle, 
              { backgroundColor: iconColor }
            ]} 
          />
          
          {/* Icône avec effet */}
          <View style={[styles.accordionIcon, { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={22} color={iconColor} />
          </View>

          {/* Titre et compteur */}
          <View style={styles.accordionTitleContainer}>
            <Text style={styles.accordionTitle}>{title}</Text>
          </View>

          {/* Compteur badge */}
          <View style={[styles.countBadge, { backgroundColor: iconBgColor }]}>
            <Text style={[styles.countBadgeText, { color: iconColor }]}>{countLabel}</Text>
          </View>

          {/* Flèche animée */}
          <Animated.View style={[styles.arrowContainer, arrowAnimatedStyle]}>
            <Ionicons name="chevron-down" size={22} color={Colors.textSecondary} />
          </Animated.View>
        </Animated.View>
      </Pressable>

      {/* Contenu dépliable */}
      <Animated.View style={contentContainerStyle}>
        <View onLayout={measureContent} style={styles.accordionContent}>
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    selectedProfiles, 
    selectedThemes,
    setSelectedThemes,
    setSocialConnection,
    removeSocialConnection,
    getSocialConnections,
  } = useUserPreferencesStore();

  const profileIndex = selectedProfiles.findIndex(p => p.id === id);
  const profile = selectedProfiles[profileIndex];

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [localSelectedThemes, setLocalSelectedThemes] = useState<string[]>(selectedThemes);
  
  // État des accordéons
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  // Social connections state
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [socialConnections, setSocialConnectionsLocal] = useState<SocialConnection[]>([]);
  
  // État pour la délégation du profil
  const [delegateEmail, setDelegateEmail] = useState<string>(profile?.delegatedTo || '');
  const [delegateInputEmail, setDelegateInputEmail] = useState('');

  // Animations d'entrée
  const accordion1Y = useSharedValue(60);
  const accordion2Y = useSharedValue(60);
  const accordion3Y = useSharedValue(60);
  const accordion4Y = useSharedValue(60);
  const accordion5Y = useSharedValue(60);
  const accordion1Opacity = useSharedValue(0);
  const accordion2Opacity = useSharedValue(0);
  const accordion3Opacity = useSharedValue(0);
  const accordion4Opacity = useSharedValue(0);
  const accordion5Opacity = useSharedValue(0);

  // Animation d'entrée séquentielle
  useEffect(() => {
    const baseDelay = 80;
    
    setTimeout(() => {
      accordion1Y.value = withSpring(0, SPRING_CONFIG);
      accordion1Opacity.value = withTiming(1, { duration: 300 });
    }, baseDelay);
    
    setTimeout(() => {
      accordion2Y.value = withSpring(0, SPRING_CONFIG);
      accordion2Opacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 2);
    
    setTimeout(() => {
      accordion3Y.value = withSpring(0, SPRING_CONFIG);
      accordion3Opacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 3);
    
    setTimeout(() => {
      accordion4Y.value = withSpring(0, SPRING_CONFIG);
      accordion4Opacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 4);
    
    setTimeout(() => {
      accordion5Y.value = withSpring(0, SPRING_CONFIG);
      accordion5Opacity.value = withTiming(1, { duration: 300 });
    }, baseDelay * 5);
  }, []);

  // Styles animés pour l'entrée
  const accordion1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: accordion1Y.value }],
    opacity: accordion1Opacity.value,
  }));
  const accordion2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: accordion2Y.value }],
    opacity: accordion2Opacity.value,
  }));
  const accordion3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: accordion3Y.value }],
    opacity: accordion3Opacity.value,
  }));
  const accordion4Style = useAnimatedStyle(() => ({
    transform: [{ translateY: accordion4Y.value }],
    opacity: accordion4Opacity.value,
  }));
  const accordion5Style = useAnimatedStyle(() => ({
    transform: [{ translateY: accordion5Y.value }],
    opacity: accordion5Opacity.value,
  }));

  // Load existing connections
  useEffect(() => {
    if (profile) {
      const connections = getSocialConnections(profile.id);
      setSocialConnectionsLocal(connections);
    }
  }, [profile, getSocialConnections]);

  const getConnectionForPlatform = (platform: 'meta' | 'linkedin'): SocialConnection | undefined => {
    return socialConnections.find(c => c.platform === platform);
  };

  // Connect Meta
  const handleConnectMeta = async () => {
    if (!profile) return;
    
    setIsConnectingMeta(true);
    try {
      const callbackUrl = `${BACKEND_URL}/api/auth/meta/callback`;
      const response = await fetch(
        `${BACKEND_URL}/api/auth/meta/start?user_id=${profile.id}&redirect_uri=${encodeURIComponent(callbackUrl)}`
      );
      
      if (!response.ok) throw new Error('Failed to get auth URL');
      
      const { auth_url } = await response.json();
      
      if (Platform.OS === 'web') {
        const popup = window.open(auth_url, 'meta_auth', 'width=600,height=700');
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            setIsConnectingMeta(false);
            loadMetaStatus();
          }
        }, 500);
      } else {
        const result = await WebBrowser.openAuthSessionAsync(auth_url, callbackUrl);
        if (result.type === 'success') {
          loadMetaStatus();
          Alert.alert('Succès', 'Comptes Meta connectés !');
        }
        setIsConnectingMeta(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la connexion Meta');
      setIsConnectingMeta(false);
    }
  };

  // Connect LinkedIn
  const handleConnectLinkedIn = async () => {
    if (!profile) return;
    
    setIsConnectingLinkedIn(true);
    try {
      const callbackUrl = `${BACKEND_URL}/api/auth/linkedin/callback`;
      const response = await fetch(
        `${BACKEND_URL}/api/auth/linkedin/start?user_id=${profile.id}&redirect_uri=${encodeURIComponent(callbackUrl)}`
      );
      
      if (!response.ok) throw new Error('Failed to get auth URL');
      
      const { auth_url } = await response.json();
      
      if (Platform.OS === 'web') {
        const popup = window.open(auth_url, 'linkedin_auth', 'width=600,height=700');
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            setIsConnectingLinkedIn(false);
            loadLinkedInStatus();
          }
        }, 500);
      } else {
        const result = await WebBrowser.openAuthSessionAsync(auth_url, callbackUrl);
        if (result.type === 'success') {
          loadLinkedInStatus();
          Alert.alert('Succès', 'Compte LinkedIn connecté !');
        }
        setIsConnectingLinkedIn(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la connexion LinkedIn');
      setIsConnectingLinkedIn(false);
    }
  };

  const loadMetaStatus = useCallback(async () => {
    if (!profile) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/meta/status?user_id=${profile.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          const accounts: SocialConnection['accounts'] = [];
          data.facebook?.accounts?.forEach((acc: any) => {
            accounts.push({ id: acc.id, name: acc.name, type: 'facebook', pictureUrl: acc.picture_url, isDefault: acc.is_default });
          });
          data.instagram?.accounts?.forEach((acc: any) => {
            accounts.push({ id: acc.id, name: acc.name || acc.username, type: 'instagram', pictureUrl: acc.picture_url, isDefault: acc.is_default });
          });
          const connection: SocialConnection = { platform: 'meta', connected: true, connectedAt: new Date().toISOString(), accounts };
          setSocialConnection(profile.id, connection);
          setSocialConnectionsLocal(prev => [...prev.filter(c => c.platform !== 'meta'), connection]);
        }
      }
    } catch (error) {
      console.error('Error loading Meta status:', error);
    }
  }, [profile, setSocialConnection]);

  const loadLinkedInStatus = useCallback(async () => {
    if (!profile) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/linkedin/status?user_id=${profile.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          const accounts: SocialConnection['accounts'] = [];
          data.personal?.accounts?.forEach((acc: any) => {
            accounts.push({ id: acc.id, name: acc.name, type: 'linkedin_personal', pictureUrl: acc.picture_url, isDefault: acc.is_default });
          });
          data.company?.accounts?.forEach((acc: any) => {
            accounts.push({ id: acc.id, name: acc.name, type: 'linkedin_company', pictureUrl: acc.picture_url, isDefault: acc.is_default });
          });
          const connection: SocialConnection = { platform: 'linkedin', connected: true, connectedAt: new Date().toISOString(), accounts };
          setSocialConnection(profile.id, connection);
          setSocialConnectionsLocal(prev => [...prev.filter(c => c.platform !== 'linkedin'), connection]);
        }
      }
    } catch (error) {
      console.error('Error loading LinkedIn status:', error);
    }
  }, [profile, setSocialConnection]);

  useEffect(() => {
    if (profile) {
      loadMetaStatus();
      loadLinkedInStatus();
    }
  }, [profile, loadMetaStatus, loadLinkedInStatus]);

  const handleDisconnectMeta = () => {
    if (!profile) return;
    Alert.alert('Déconnecter Meta', 'Déconnecter Facebook et Instagram ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/auth/meta/disconnect?user_id=${profile.id}`, { method: 'POST' });
            removeSocialConnection(profile.id, 'meta');
            setSocialConnectionsLocal(prev => prev.filter(c => c.platform !== 'meta'));
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de déconnecter');
          }
        }
      }
    ]);
  };

  const handleDisconnectLinkedIn = () => {
    if (!profile) return;
    Alert.alert('Déconnecter LinkedIn', 'Déconnecter LinkedIn ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/auth/linkedin/disconnect?user_id=${profile.id}`, { method: 'POST' });
            removeSocialConnection(profile.id, 'linkedin');
            setSocialConnectionsLocal(prev => prev.filter(c => c.platform !== 'linkedin'));
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de déconnecter');
          }
        }
      }
    ]);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(prev => prev === id ? null : id);
  };

  const toggleTheme = (themeId: string) => {
    setLocalSelectedThemes(prev => 
      prev.includes(themeId) ? prev.filter(id => id !== themeId) : [...prev, themeId]
    );
  };

  const handleSwitchProfile = (index: number) => {
    const newProfile = selectedProfiles[index];
    setShowProfileModal(false);
    router.replace(`/edit-profile?id=${newProfile.id}`);
  };

  const handleSave = () => {
    setSelectedThemes(localSelectedThemes);
    router.back();
  };

  // Gérer la délégation du profil
  const handleDelegate = () => {
    if (!delegateInputEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide.');
      return;
    }
    // Valider le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(delegateInputEmail)) {
      Alert.alert('Erreur', 'Format d\'email invalide.');
      return;
    }
    
    setDelegateEmail(delegateInputEmail);
    setDelegateInputEmail('');
    Alert.alert('Succès', `Profil délégué à ${delegateInputEmail}`);
    // TODO: Sauvegarder dans le store/backend
  };

  // Retirer la délégation
  const handleRemoveDelegate = () => {
    Alert.alert(
      'Retirer la délégation',
      `Retirer la délégation de ${delegateEmail} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            setDelegateEmail('');
          },
        },
      ]
    );
  };

  const getProfileIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'ligue': return 'globe';
      case 'district': return 'map';
      case 'club': return 'shield';
      case 'equipe': return 'people';
      case 'sponsor': return 'business';
      default: return 'person';
    }
  };

  const getProfileTypeLabel = (type: string): string => {
    switch (type) {
      case 'ligue': return 'Ligue';
      case 'district': return 'District';
      case 'club': return 'Club';
      case 'equipe': return 'Équipe';
      case 'sponsor': return 'Sponsor';
      default: return 'Profil';
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier profil</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorText}>Profil non trouvé</Text>
          <TouchableOpacity style={styles.backLinkButton} onPress={() => router.back()}>
            <Text style={styles.backLink}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const metaConnection = getConnectionForPlatform('meta');
  const linkedInConnection = getConnectionForPlatform('linkedin');
  
  // Compteurs pour les badges
  const metaCount = metaConnection?.connected ? metaConnection.accounts.length : 0;
  const linkedInCount = linkedInConnection?.connected ? linkedInConnection.accounts.length : 0;
  const socialTotal = metaCount + linkedInCount;
  
  const artywizSelectedCount = ARTYWIZ_THEMES.filter(t => localSelectedThemes.includes(t.id)).length;
  const genericSelectedCount = GENERIC_THEMES.filter(t => localSelectedThemes.includes(t.id)).length;

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Éditer un profil</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Profile Switcher */}
        <TouchableOpacity style={styles.profileSwitch} onPress={() => setShowProfileModal(true)}>
          {profile.logo ? (
            <Image source={{ uri: profile.logo }} style={styles.profileLogo} />
          ) : (
            <View style={styles.profileBadge}>
              <Ionicons name={getProfileIcon(profile.type)} size={16} color={Colors.white} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileType}>{getProfileTypeLabel(profile.type)}</Text>
            <Text style={styles.profileName}>{profile.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Accordéon 1: Réseaux sociaux */}
        <Animated.View style={accordion1Style}>
          <GamingAccordion
            title="Réseaux sociaux"
            countLabel={`${socialTotal}/4`}
            icon="share-social"
            iconColor="#1877F2"
            iconBgColor="#1877F215"
            isOpen={openAccordion === 'social'}
            onToggle={() => toggleAccordion('social')}
            index={0}
          >
            {/* Meta */}
            <View style={styles.socialCard}>
              <View style={styles.socialCardHeader}>
                <View style={[styles.socialIcon, { backgroundColor: '#1877F215' }]}>
                  <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                </View>
                <View style={styles.socialInfo}>
                  <Text style={styles.socialName}>Meta</Text>
                  <Text style={styles.socialDesc}>Facebook & Instagram</Text>
                </View>
                {metaConnection?.connected ? (
                  <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnectMeta}>
                    <Text style={styles.disconnectText}>Déconnecter</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.connectBtn, { backgroundColor: '#1877F2' }]} 
                    onPress={handleConnectMeta}
                    disabled={isConnectingMeta}
                  >
                    {isConnectingMeta ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.connectText}>Connecter</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              {metaConnection?.connected && metaConnection.accounts.length > 0 && (
                <View style={styles.accountsList}>
                  {metaConnection.accounts.map(acc => (
                    <View key={acc.id} style={styles.accountItem}>
                      <Ionicons 
                        name={acc.type === 'facebook' ? 'logo-facebook' : 'logo-instagram'} 
                        size={16} 
                        color={acc.type === 'facebook' ? '#1877F2' : '#E4405F'} 
                      />
                      <Text style={styles.accountName}>{acc.name}</Text>
                      {acc.isDefault && <View style={styles.defaultDot} />}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* LinkedIn */}
            <View style={[styles.socialCard, { marginTop: Spacing.sm }]}>
              <View style={styles.socialCardHeader}>
                <View style={[styles.socialIcon, { backgroundColor: '#0A66C215' }]}>
                  <Ionicons name="logo-linkedin" size={22} color="#0A66C2" />
                </View>
                <View style={styles.socialInfo}>
                  <Text style={styles.socialName}>LinkedIn</Text>
                  <Text style={styles.socialDesc}>Profil & Pages</Text>
                </View>
                {linkedInConnection?.connected ? (
                  <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnectLinkedIn}>
                    <Text style={styles.disconnectText}>Déconnecter</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.connectBtn, { backgroundColor: '#0A66C2' }]} 
                    onPress={handleConnectLinkedIn}
                    disabled={isConnectingLinkedIn}
                  >
                    {isConnectingLinkedIn ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.connectText}>Connecter</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              {linkedInConnection?.connected && linkedInConnection.accounts.length > 0 && (
                <View style={styles.accountsList}>
                  {linkedInConnection.accounts.map(acc => (
                    <View key={acc.id} style={styles.accountItem}>
                      <Ionicons 
                        name={acc.type === 'linkedin_company' ? 'business' : 'person'} 
                        size={16} 
                        color="#0A66C2" 
                      />
                      <Text style={styles.accountName}>{acc.name}</Text>
                      {acc.isDefault && <View style={[styles.defaultDot, { backgroundColor: '#0A66C2' }]} />}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </GamingAccordion>
        </Animated.View>

        {/* Accordéon 2: Thématiques ArtyWiz */}
        <Animated.View style={accordion2Style}>
          <GamingAccordion
            title="Thématiques spécifiques"
            countLabel={`${artywizSelectedCount}/${ARTYWIZ_THEMES.length}`}
            icon="star"
            iconColor="#F59E0B"
            iconBgColor="#F59E0B15"
            isOpen={openAccordion === 'artywiz'}
            onToggle={() => toggleAccordion('artywiz')}
            index={1}
          >
            <View style={styles.themesGrid}>
              {ARTYWIZ_THEMES.map(theme => {
                const isSelected = localSelectedThemes.includes(theme.id);
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[styles.themeChip, isSelected && styles.themeChipSelected]}
                    onPress={() => toggleTheme(theme.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={theme.icon as any} 
                      size={16} 
                      color={isSelected ? Colors.white : Colors.primary} 
                    />
                    <Text style={[styles.themeChipText, isSelected && styles.themeChipTextSelected]}>
                      {theme.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkMark}>
                        <Ionicons name="checkmark" size={12} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GamingAccordion>
        </Animated.View>

        {/* Accordéon 3: Thématiques Génériques */}
        <Animated.View style={accordion3Style}>
          <GamingAccordion
            title="Thématiques génériques"
            countLabel={`${genericSelectedCount}/${GENERIC_THEMES.length}`}
            icon="grid"
            iconColor="#8B5CF6"
            iconBgColor="#8B5CF615"
            isOpen={openAccordion === 'generic'}
            onToggle={() => toggleAccordion('generic')}
            index={2}
          >
            <View style={styles.themesGrid}>
              {GENERIC_THEMES.map(theme => {
                const isSelected = localSelectedThemes.includes(theme.id);
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[styles.themeChip, isSelected && styles.themeChipSelected]}
                    onPress={() => toggleTheme(theme.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={theme.icon as any} 
                      size={16} 
                      color={isSelected ? Colors.white : '#8B5CF6'} 
                    />
                    <Text style={[styles.themeChipText, isSelected && styles.themeChipTextSelected]}>
                      {theme.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.checkMark, { backgroundColor: '#8B5CF6' }]}>
                        <Ionicons name="checkmark" size={12} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GamingAccordion>
        </Animated.View>

        {/* Accordéon 4: Déléguer le profil */}
        <Animated.View style={accordion4Style}>
          <GamingAccordion
            title={delegateEmail ? delegateEmail : "Déléguer le profil"}
            countLabel={delegateEmail ? "✓" : ""}
            icon={delegateEmail ? "person-circle" : "person-add-outline"}
            iconColor={delegateEmail ? "#10B981" : "#F97316"}
            iconBgColor={delegateEmail ? "#10B98115" : "#F9731615"}
            isOpen={openAccordion === 'delegate'}
            onToggle={() => toggleAccordion('delegate')}
            index={3}
          >
            {delegateEmail ? (
              // Délégation existante
              <View style={styles.delegateContent}>
                <View style={styles.delegateInfoCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <View style={styles.delegateInfoText}>
                    <Text style={styles.delegateLabel}>Profil délégué à</Text>
                    <Text style={styles.delegateEmailValue}>{delegateEmail}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeDelegateBtn}
                  onPress={handleRemoveDelegate}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  <Text style={styles.removeDelegateText}>Retirer la délégation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Formulaire de délégation
              <View style={styles.delegateContent}>
                <Text style={styles.delegateDescription}>
                  Entrez l'email de la personne à qui vous souhaitez déléguer ce profil.
                </Text>
                <View style={styles.delegateInputRow}>
                  <TextInput
                    style={styles.delegateInput}
                    value={delegateInputEmail}
                    onChangeText={setDelegateInputEmail}
                    placeholder="email@exemple.com"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.delegateOkBtn}
                    onPress={handleDelegate}
                  >
                    <Ionicons name="checkmark" size={22} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </GamingAccordion>
        </Animated.View>

        {/* BLOC 5: Partenaire - Sponsor (légèrement séparé) */}
        <Animated.View style={[accordion5Style, { marginTop: Spacing.lg }]}>
          <GamingAccordion
            title="Partenaire - Sponsor"
            countLabel=""
            icon="diamond-outline"
            iconColor="#FFB800"
            iconBgColor="#FFB80015"
            isOpen={openAccordion === 'sponsor'}
            onToggle={() => toggleAccordion('sponsor')}
            index={4}
          >
            <View style={styles.sponsorContent}>
              <Text style={styles.sponsorDescription}>
                Vous souhaitez devenir partenaire ou sponsor Artywiz ?{'\n'}
                Contactez-nous pour découvrir nos offres.
              </Text>
              <TouchableOpacity 
                style={styles.sponsorButton}
                onPress={() => router.push('/contact')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFB800', '#FF9500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sponsorButtonGradient}
                >
                  <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.sponsorButtonText}>Nous contacter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GamingAccordion>
        </Animated.View>

        {/* Bouton Enregistrer */}
        <Animated.View style={[accordion5Style, { marginTop: Spacing.md }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.9}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Profile Switch Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowProfileModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un profil</Text>
            <View style={styles.profilesList}>
              {selectedProfiles.map((p, index) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.profileListItem, p.id === id && styles.profileListItemActive]}
                  onPress={() => handleSwitchProfile(index)}
                >
                  {p.logo ? (
                    <Image source={{ uri: p.logo }} style={styles.profileListLogo} />
                  ) : (
                    <View style={[styles.profileListIcon, p.id === id && styles.profileListIconActive]}>
                      <Ionicons name={getProfileIcon(p.type)} size={18} color={p.id === id ? Colors.white : Colors.primary} />
                    </View>
                  )}
                  <View style={styles.profileListInfo}>
                    <Text style={styles.profileListName}>{p.name}</Text>
                    <Text style={styles.profileListType}>{getProfileTypeLabel(p.type)}</Text>
                  </View>
                  {p.id === id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  profileSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  profileBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileInfo: {
    flex: 1,
  },
  profileType: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.8,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  // Accordion styles
  accordionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  accordionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accordionTitleContainer: {
    flex: 1,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accordionContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  // Social cards
  socialCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.sm,
  },
  socialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  socialName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  socialDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  connectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  connectText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  disconnectBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  accountsList: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  accountName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  defaultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  // Themes
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  themeChipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  checkMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  // Delegate section
  delegateContent: {
    gap: Spacing.md,
  },
  delegateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  delegateInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  delegateInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: Colors.textPrimary,
  },
  delegateOkBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  delegateInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98110',
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  delegateInfoText: {
    flex: 1,
  },
  delegateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  delegateEmailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  removeDelegateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.xs,
  },
  removeDelegateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  // Sponsor content
  sponsorContent: {
    gap: Spacing.md,
  },
  sponsorDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sponsorButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sponsorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  sponsorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Save button
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  profilesList: {
    gap: Spacing.sm,
  },
  profileListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  profileListItemActive: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  profileListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  profileListIconActive: {
    backgroundColor: Colors.primary,
  },
  profileListLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
  },
  profileListInfo: {
    flex: 1,
  },
  profileListName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profileListType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  backLinkButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
  },
  backLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
