import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../../constants';
import { useAuthStore } from '../../stores/authStore';
import { useUserPreferencesStore, UserProfile } from '../../stores/userPreferencesStore';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from 'react-native-reanimated';

const AVATAR_KEY = '@artywiz_avatar';
const MAX_PROFILES = 30;

// Configuration des animations "jeu vidéo"
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

// Mapping des logos pour les profils
const PROFILE_LOGOS: { [key: string]: any } = {
  'club_1': require('../../assets/images/logo AS Strasbourg.png'),
  'ligue_1': require('../../assets/images/logo LGEF ligue grand est.png'),
  'ligue_2': require('../../assets/images/logo ligue normandie.png'),
  'district_1': require('../../assets/images/logo district alsace.png'),
};

// Types de profils pour le modal
const PROFILE_TYPES = [
  { id: 'equipe', label: 'Équipe', icon: 'people-outline', color: '#6366F1' },
  { id: 'club', label: 'Club', icon: 'shield-outline', color: '#0EA5E9' },
  { id: 'district', label: 'District', icon: 'map-outline', color: '#10B981' },
  { id: 'ligue', label: 'Ligue', icon: 'globe-outline', color: '#8B5CF6' },
  { id: 'sponsor', label: 'Sponsor', icon: 'business-outline', color: '#F59E0B' },
];

// Fonction pour obtenir le logo d'un profil
const getProfileLogo = (profileId: string, clubId?: string) => {
  if (clubId && PROFILE_LOGOS[clubId]) {
    return PROFILE_LOGOS[clubId];
  }
  return PROFILE_LOGOS[profileId] || null;
};

// ============================================
// COMPOSANT ACCORDEON ANIMÉ
// ============================================
interface AccordionProps {
  title: string;
  rightLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  isDestructive?: boolean;
}

const AnimatedAccordion = ({
  title,
  rightLabel,
  icon,
  iconColor = Colors.primary,
  children,
  isOpen,
  onToggle,
  index,
  isDestructive = false,
}: AccordionProps) => {
  const heightProgress = useSharedValue(0);
  const arrowRotation = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const headerGlow = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (isOpen) {
      heightProgress.value = withSpring(1, SPRING_CONFIG);
      arrowRotation.value = withSpring(180, SPRING_BOUNCE);
      contentOpacity.value = withTiming(1, { duration: 200 });
      headerGlow.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0.3, { duration: 300 })
      );
    } else {
      heightProgress.value = withSpring(0, SPRING_CONFIG);
      arrowRotation.value = withSpring(0, SPRING_BOUNCE);
      contentOpacity.value = withTiming(0, { duration: 100 });
      headerGlow.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const handlePressIn = () => {
    headerScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    headerScale.value = withSpring(1, SPRING_BOUNCE);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerGlow.value * 0.5,
  }));

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotation.value}deg` }],
  }));

  const contentContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      heightProgress.value,
      [0, 1],
      [0, contentHeight || 200],
      Extrapolation.CLAMP
    );
    return {
      height: contentHeight > 0 ? height : heightProgress.value > 0 ? 'auto' : 0,
      opacity: contentOpacity.value,
      overflow: 'hidden' as const,
    };
  });

  const measureContent = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && contentHeight === 0) {
      setContentHeight(height + 16);
    }
  };

  const baseColor = isDestructive ? Colors.error : Colors.primary;

  return (
    <Animated.View style={styles.accordionContainer}>
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.accordionHeader, headerAnimatedStyle]}>
          <Animated.View style={[styles.headerGlow, glowAnimatedStyle, { backgroundColor: baseColor }]} />
          
          <View style={[styles.accordionIcon, { backgroundColor: baseColor + '15' }]}>
            <Ionicons name={icon} size={20} color={iconColor || baseColor} />
          </View>

          <Text style={[styles.accordionTitle, isDestructive && { color: Colors.error }]}>
            {title}
          </Text>

          <Text style={[styles.accordionRightLabel, isDestructive && { color: Colors.error }]}>
            {rightLabel}
          </Text>

          {!isDestructive && (
            <Animated.View style={arrowAnimatedStyle}>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>

      {!isDestructive && (
        <Animated.View style={contentContainerStyle}>
          <View onLayout={measureContent} style={styles.accordionContent}>
            {children}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function CompteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const { selectedProfiles, setSelectedProfiles } = useUserPreferencesStore();
  const { logout } = useAuthStore();
  
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  // État pour l'édition des infos
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  
  // État pour le modal d'ajout de profil
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);

  // Animation d'entrée des accordéons
  const accordion1Y = useSharedValue(50);
  const accordion2Y = useSharedValue(50);
  const accordion3Y = useSharedValue(50);
  const accordion1Opacity = useSharedValue(0);
  const accordion2Opacity = useSharedValue(0);
  const accordion3Opacity = useSharedValue(0);

  useEffect(() => {
    loadAvatar();
    
    const delay = 100;
    setTimeout(() => {
      accordion1Y.value = withSpring(0, SPRING_CONFIG);
      accordion1Opacity.value = withTiming(1, { duration: 300 });
    }, delay);
    setTimeout(() => {
      accordion2Y.value = withSpring(0, SPRING_CONFIG);
      accordion2Opacity.value = withTiming(1, { duration: 300 });
    }, delay * 2);
    setTimeout(() => {
      accordion3Y.value = withSpring(0, SPRING_CONFIG);
      accordion3Opacity.value = withTiming(1, { duration: 300 });
    }, delay * 3);
  }, []);

  // Sync edit fields with user
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const loadAvatar = async () => {
    try {
      const saved = await AsyncStorage.getItem(AVATAR_KEY);
      if (saved) setAvatarUri(saved);
    } catch (e) {
      console.log('Error loading avatar:', e);
    }
  };

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        await AsyncStorage.setItem(AVATAR_KEY, uri);
      }
    } catch (e) {
      console.log('Error picking avatar:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await logout();
              if (!success) {
                Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
              }
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
            }
          },
        },
      ]
    );
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(prev => prev === id ? null : id);
    // Reset edit mode when closing
    if (id === 'infos' && openAccordion === 'infos') {
      setIsEditingInfo(false);
    }
  };

  // Sauvegarder les modifications des infos
  const handleSaveInfo = async () => {
    if (updateUser) {
      await updateUser({
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
    }
    setIsEditingInfo(false);
    Alert.alert('Succès', 'Vos informations ont été mises à jour.');
  };

  // Supprimer un profil
  const handleDeleteProfile = (profileId: string) => {
    Alert.alert(
      'Supprimer le profil',
      'Êtes-vous sûr de vouloir supprimer ce profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedProfiles = selectedProfiles.filter(p => p.id !== profileId);
            setSelectedProfiles(updatedProfiles);
          },
        },
      ]
    );
  };

  // Sélection d'un type de profil depuis le modal
  const handleSelectProfileType = (type: string) => {
    setShowAddProfileModal(false);
    // Navigate to profile-selection with the type pre-selected
    router.push(`/profile-selection?openType=${type}`);
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

  // Grouper les profils par type
  const groupedProfiles = selectedProfiles.reduce((acc, profile) => {
    const type = profile.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(profile);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  // Ordre d'affichage des types
  const typeOrder = ['equipe', 'club', 'district', 'ligue', 'sponsor'];

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

  const displayName = user?.name || 'Utilisateur';

  return (
    <View style={styles.container}>
      {/* Header avec logo W */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
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
          <Text style={styles.headerTitle}>Mon compte</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: insets.bottom + Spacing.xxl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar centré */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                style={styles.avatarPlaceholder}
              >
                <Ionicons name="person" size={36} color={Colors.white} />
              </LinearGradient>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Bonjour, {displayName} !</Text>
        </View>

        {/* Accordéon 1: Mes infos (éditable) */}
        <Animated.View style={accordion1Style}>
          <AnimatedAccordion
            title="Mes infos"
            rightLabel={displayName}
            icon="person-circle"
            isOpen={openAccordion === 'infos'}
            onToggle={() => toggleAccordion('infos')}
            index={0}
          >
            <View style={styles.infoContent}>
              {isEditingInfo ? (
                // Mode édition
                <>
                  <View style={styles.editRow}>
                    <Text style={styles.infoLabel}>Nom</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Votre nom"
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editEmail}
                      onChangeText={setEditEmail}
                      placeholder="Votre email"
                      placeholderTextColor={Colors.textLight}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={[styles.editRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>Téléphone</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="Votre téléphone"
                      placeholderTextColor={Colors.textLight}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.editButtonsRow}>
                    <TouchableOpacity 
                      style={styles.cancelEditBtn}
                      onPress={() => {
                        setIsEditingInfo(false);
                        setEditName(user?.name || '');
                        setEditEmail(user?.email || '');
                        setEditPhone(user?.phone || '');
                      }}
                    >
                      <Text style={styles.cancelEditText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.saveEditBtn}
                      onPress={handleSaveInfo}
                    >
                      <Ionicons name="checkmark" size={18} color={Colors.white} />
                      <Text style={styles.saveEditText}>Enregistrer</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // Mode lecture
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nom</Text>
                    <Text style={styles.infoValue}>{user?.name || 'Non renseigné'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user?.email || 'Non renseigné'}</Text>
                  </View>
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>Téléphone</Text>
                    <Text style={styles.infoValue}>{user?.phone || 'Non renseigné'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.editInfoBtn}
                    onPress={() => setIsEditingInfo(true)}
                  >
                    <Ionicons name="pencil" size={16} color={Colors.primary} />
                    <Text style={styles.editInfoText}>Modifier</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </AnimatedAccordion>
        </Animated.View>

        {/* Accordéon 2: Mes profils */}
        <Animated.View style={accordion2Style}>
          <AnimatedAccordion
            title="Mes profils"
            rightLabel={`${selectedProfiles.length}/${MAX_PROFILES}`}
            icon="layers"
            iconColor="#6366F1"
            isOpen={openAccordion === 'profils'}
            onToggle={() => toggleAccordion('profils')}
            index={1}
          >
            <View style={styles.profilesContent}>
              {selectedProfiles.length === 0 ? (
                <Text style={styles.noProfilesText}>Aucun profil configuré</Text>
              ) : (
                // Afficher les profils groupés par type
                typeOrder.map(type => {
                  const profiles = groupedProfiles[type];
                  if (!profiles || profiles.length === 0) return null;
                  
                  return (
                    <View key={type} style={styles.profileTypeGroup}>
                      <Text style={styles.profileTypeHeader}>
                        {getProfileTypeLabel(type)}s
                      </Text>
                      {profiles.map((profile) => (
                        <View key={profile.id} style={styles.profileItemRow}>
                          <TouchableOpacity 
                            style={styles.profileItem}
                            onPress={() => router.push(`/edit-profile?id=${profile.id}`)}
                            activeOpacity={0.7}
                          >
                            {profile.logo ? (
                              <Image source={{ uri: profile.logo }} style={styles.profileItemLogo} />
                            ) : getProfileLogo(profile.id, profile.clubId) ? (
                              <Image source={getProfileLogo(profile.id, profile.clubId)} style={styles.profileItemLogo} />
                            ) : (
                              <View style={styles.profileItemIcon}>
                                <Ionicons 
                                  name={getProfileIcon(profile.type)} 
                                  size={18} 
                                  color={Colors.primary} 
                                />
                              </View>
                            )}
                            <View style={styles.profileItemInfo}>
                              <Text style={styles.profileItemName} numberOfLines={1}>{profile.name}</Text>
                            </View>
                            <Ionicons 
                              name="chevron-forward" 
                              size={16} 
                              color={Colors.textSecondary} 
                            />
                          </TouchableOpacity>
                          {/* Bouton supprimer */}
                          <TouchableOpacity 
                            style={styles.deleteProfileBtn}
                            onPress={() => handleDeleteProfile(profile.id)}
                          >
                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  );
                })
              )}

              {/* Bouton Ajouter un profil */}
              <TouchableOpacity 
                style={styles.addProfileButton}
                onPress={() => setShowAddProfileModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color={Colors.primary} />
                <Text style={styles.addProfileText}>Ajouter un profil</Text>
              </TouchableOpacity>
            </View>
          </AnimatedAccordion>
        </Animated.View>

        {/* Accordéon 3: Déconnexion */}
        <Animated.View style={accordion3Style}>
          <TouchableOpacity 
            style={styles.logoutAccordion}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={[styles.accordionIcon, { backgroundColor: Colors.error + '15' }]}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </View>
            <Text style={styles.logoutText}>Déconnexion</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.error} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal d'ajout de profil */}
      <Modal
        visible={showAddProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddProfileModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddProfileModal(false)}
        >
          <View style={styles.addProfileModalContent}>
            <Text style={styles.addProfileModalTitle}>Quel type de profil ?</Text>
            <Text style={styles.addProfileModalSubtitle}>Choisissez le type à ajouter</Text>
            
            <View style={styles.profileTypeGrid}>
              {PROFILE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.profileTypeCard, { borderColor: type.color + '40' }]}
                  onPress={() => handleSelectProfileType(type.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.profileTypeIconBox, { backgroundColor: type.color + '15' }]}>
                    <Ionicons name={type.icon as any} size={28} color={type.color} />
                  </View>
                  <Text style={styles.profileTypeLabel}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.cancelModalBtn}
              onPress={() => setShowAddProfileModal(false)}
            >
              <Text style={styles.cancelModalText}>Annuler</Text>
            </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
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
    gap: Spacing.md,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accordionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  accordionRightLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  accordionContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  // Info Content
  infoContent: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  editInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  editInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Edit mode
  editRow: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editInput: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
  },
  cancelEditText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveEditBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  saveEditText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  // Profiles Content
  profilesContent: {
    gap: Spacing.sm,
  },
  noProfilesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  profileTypeGroup: {
    marginBottom: Spacing.xs,
  },
  profileTypeHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  profileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  profileItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: Spacing.sm,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  profileItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileItemLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  profileItemInfo: {
    flex: 1,
  },
  profileItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profileItemType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  deleteProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: Spacing.xs,
  },
  addProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Logout
  logoutAccordion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  addProfileModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  addProfileModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  addProfileModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  profileTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  profileTypeCard: {
    width: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
  },
  profileTypeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profileTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cancelModalBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
