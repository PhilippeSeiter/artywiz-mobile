import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientHeader, CustomButton, CustomInput } from '../../components';
import { Colors, Spacing } from '../../constants';
import { useAuthStore } from '../../stores/authStore';
import { useProfileModeStore } from '../../stores/profileModeStore';
import { MockDataService } from '../../services/mockDataService';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

const AVATAR_KEY = '@artywiz_avatar';

export default function AccountScreen() {
  const localRouter = useRouter();
  const { user, logout } = useAuthStore();
  const { setMode } = useProfileModeStore();
  const [activeTab, setActiveTab] = useState<'personal' | 'teams'>('personal');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  const profiles = MockDataService.getAllProfiles();
  const currentProfile = user ? MockDataService.getProfileById(user.profileId) : null;

  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      const saved = await AsyncStorage.getItem(AVATAR_KEY);
      if (saved) setAvatarUri(saved);
    } catch (error) {
      console.log('Error loading avatar:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_KEY, uri);
    }
  };

  const handleLogout = async () => {
    // Clear auth data FIRST, then navigate
    await AsyncStorage.removeItem('@artywiz_auth');
    await AsyncStorage.removeItem(AVATAR_KEY);
    
    // Then navigate to welcome screen
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      localRouter.push('/');
    }
  };

  const handleEditProfile = () => {
    setShowPasswordModal(true);
  };

  const verifyPassword = () => {
    if (password.trim().length < 6) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }
    setShowPasswordModal(false);
    setShowEditModal(true);
    setPassword('');
  };

  const saveProfile = async () => {
    const updatedUser = { ...user, name: editName, email: editEmail };
    await AsyncStorage.setItem('@artywiz_auth', JSON.stringify(updatedUser));
    setShowEditModal(false);
    Alert.alert('Succès', 'Profil mis à jour');
  };

  const handleAddProfile = () => {
    localRouter.push('/manage-profiles');
  };

  return (
    <View style={styles.container}>
      <GradientHeader title="Mon compte" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
              Personnel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'teams' && styles.activeTab]}
            onPress={() => setActiveTab('teams')}
          >
            <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>
              Équipes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <View style={styles.content}>
            {/* Profile Card with Avatar */}
            <View style={styles.card}>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={Colors.white} />
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
            </View>

            {/* Current Profile with W Logo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profil actuel</Text>
              <View style={styles.profileCard}>
                <Image
                  source={require('../../assets/images/W-artywiz.png')}
                  style={styles.profileLogo}
                  resizeMode="contain"
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{currentProfile?.name}</Text>
                  <Text style={styles.profileType}>
                    {currentProfile?.type === 'club' ? 'Club' : 'Équipe'}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              </View>
            </View>

            {/* Switch to Sponsor Mode */}
            <TouchableOpacity 
              style={styles.sponsorModeCard} 
              onPress={() => {
                setMode('sponsor');
                localRouter.replace('/(sponsor)');
              }}
            >
              <View style={styles.sponsorModeIcon}>
                <Ionicons name="business" size={24} color="#D97706" />
              </View>
              <View style={styles.sponsorModeInfo}>
                <Text style={styles.sponsorModeTitle}>Espace Sponsor</Text>
                <Text style={styles.sponsorModeText}>Gérer vos campagnes publicitaires</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Gestion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gestion</Text>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
                <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuText}>Modifier le profil</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleAddProfile}>
                <Ionicons name="people-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuText}>Gérer mes profils</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="card-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuText}>Gérer mon abonnement</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Support */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support</Text>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="help-circle-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuText}>Aide & Support</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuText}>À propos</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
              <CustomButton
                title="DÉCONNEXION"
                onPress={handleLogout}
                icon="log-out"
                variant="outline"
              />
            </View>
          </View>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <View style={styles.content}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mes équipes</Text>
                <TouchableOpacity onPress={handleAddProfile}>
                  <Text style={styles.addButton}>+ Ajouter</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionSubtitle}>
                Sélectionnez une équipe pour changer de profil
              </Text>

              {profiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  style={[
                    styles.profileCard,
                    profile.id === user?.profileId && styles.activeProfileCard,
                  ]}
                >
                  <Image
                    source={require('../../assets/images/W-artywiz.png')}
                    style={styles.profileLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileType}>
                      {profile.type === 'club' ? 'Club' : 'Équipe'}
                    </Text>
                  </View>
                  {profile.id === user?.profileId ? (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Add Profile Button */}
              <TouchableOpacity style={styles.addProfileCard} onPress={handleAddProfile}>
                <View style={styles.addProfileIcon}>
                  <Ionicons name="add" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.addProfileText}>Ajouter des profils</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Password Verification Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vérification</Text>
            <Text style={styles.modalSubtitle}>
              Entrez votre mot de passe pour continuer
            </Text>

            <CustomInput
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              isPassword
              icon="lock-closed"
            />

            <View style={styles.modalButtons}>
              <CustomButton
                title="Annuler"
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Confirmer"
                onPress={verifyPassword}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Nom"
              value={editName}
              onChangeText={setEditName}
              icon="person"
            />

            <CustomInput
              label="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomButton
              title="ENREGISTRER"
              onPress={saveProfile}
              icon="checkmark"
            />
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
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: 12,
    padding: Spacing.xs / 2,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  content: {
    paddingTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sponsorModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  sponsorModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sponsorModeInfo: {
    flex: 1,
  },
  sponsorModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  sponsorModeText: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeProfileCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileLogo: {
    width: 48,
    height: 48,
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  profileType: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  logoutContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  addProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
  },
  addProfileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  addProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
