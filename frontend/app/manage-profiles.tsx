import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientHeader, CustomButton } from '../components';
import { Colors, Spacing } from '../constants';
import { MockDataService } from '../services/mockDataService';
import { useAuthStore } from '../stores/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileType = 'ligue' | 'district' | 'club' | 'team' | 'sponsor';

interface UserProfile {
  id: string;
  name: string;
  type: ProfileType;
  isActive: boolean;
}

export default function ManageProfilesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuthStore();
  
  // Mock user profiles - in real app would come from backend
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([
    { id: 'club_strasbourg', name: 'FC. Artywiz Strasbourg', type: 'club', isActive: true },
    { id: 'team_u18', name: 'FC. Artywiz U18', type: 'team', isActive: false },
    { id: 'team_senior', name: 'FC. Artywiz Senior', type: 'team', isActive: false },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ProfileType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const profileTypes: { type: ProfileType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { type: 'ligue', label: 'Une Ligue', icon: 'globe-outline' },
    { type: 'district', label: 'Un District', icon: 'map-outline' },
    { type: 'club', label: 'Un Club', icon: 'shield-outline' },
    { type: 'team', label: 'Une Équipe', icon: 'people-outline' },
    { type: 'sponsor', label: 'Un Sponsor', icon: 'business-outline' },
  ];

  const getTypeLabel = (type: ProfileType) => {
    switch (type) {
      case 'ligue': return 'Ligue';
      case 'district': return 'District';
      case 'club': return 'Club';
      case 'team': return 'Équipe';
      case 'sponsor': return 'Sponsor';
    }
  };

  const getTypeColor = (type: ProfileType) => {
    switch (type) {
      case 'ligue': return '#9C27B0';
      case 'district': return '#2196F3';
      case 'club': return Colors.primary;
      case 'team': return Colors.success;
      case 'sponsor': return Colors.warning;
    }
  };

  const handleSwitchProfile = (profileId: string) => {
    setUserProfiles(prev => prev.map(p => ({
      ...p,
      isActive: p.id === profileId
    })));
    
    Alert.alert(
      'Profil changé',
      'Vous êtes maintenant connecté avec ce profil.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    const profile = userProfiles.find(p => p.id === profileId);
    if (profile?.isActive) {
      Alert.alert('Erreur', 'Vous ne pouvez pas supprimer votre profil actif.');
      return;
    }
    
    Alert.alert(
      'Supprimer le profil',
      `Êtes-vous sûr de vouloir supprimer "${profileName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setUserProfiles(prev => prev.filter(p => p.id !== profileId));
          }
        }
      ]
    );
  };

  const handleAddProfile = () => {
    if (!selectedType) return;
    
    // Mock adding a new profile
    const newProfile: UserProfile = {
      id: `new_${Date.now()}`,
      name: searchQuery || `Nouveau ${getTypeLabel(selectedType)}`,
      type: selectedType,
      isActive: false,
    };
    
    setUserProfiles(prev => [...prev, newProfile]);
    setShowAddModal(false);
    setSelectedType(null);
    setSearchQuery('');
    
    Alert.alert('Succès', 'Profil ajouté avec succès !');
  };

  const canAddMore = userProfiles.length < 5;

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Gérer mes profils"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            Vous pouvez avoir jusqu'à 5 profils. Cliquez sur un profil pour le sélectionner.
          </Text>
        </View>

        {/* Profile List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes profils ({userProfiles.length}/5)</Text>
          
          {userProfiles.map((profile) => (
            <View key={profile.id} style={styles.profileCard}>
              <TouchableOpacity
                style={[
                  styles.profileContent,
                  profile.isActive && styles.activeProfile
                ]}
                onPress={() => handleSwitchProfile(profile.id)}
              >
                <View style={[styles.profileIcon, { backgroundColor: getTypeColor(profile.type) + '20' }]}>
                  <Ionicons 
                    name={profileTypes.find(t => t.type === profile.type)?.icon || 'shield-outline'} 
                    size={24} 
                    color={getTypeColor(profile.type)} 
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <View style={styles.profileMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(profile.type) + '20' }]}>
                      <Text style={[styles.typeText, { color: getTypeColor(profile.type) }]}>
                        {getTypeLabel(profile.type)}
                      </Text>
                    </View>
                    {profile.isActive && (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={styles.activeText}>Actif</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              
              {!profile.isActive && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProfile(profile.id, profile.name)}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Add Profile Button */}
        {canAddMore && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <View style={styles.addButtonIcon}>
              <Ionicons name="add" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.addButtonText}>Ajouter un profil</Text>
          </TouchableOpacity>
        )}

        {!canAddMore && (
          <View style={styles.maxProfilesCard}>
            <Ionicons name="warning" size={24} color={Colors.warning} />
            <Text style={styles.maxProfilesText}>
              Vous avez atteint le nombre maximum de profils (5).
              Supprimez un profil pour en ajouter un nouveau.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Profile Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un profil</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Sélectionnez le type de profil à ajouter
            </Text>

            <ScrollView style={styles.typeList}>
              {profileTypes.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeOption,
                    selectedType === item.type && styles.typeOptionSelected
                  ]}
                  onPress={() => setSelectedType(item.type)}
                >
                  <View style={[styles.typeOptionIcon, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                    <Ionicons name={item.icon} size={24} color={getTypeColor(item.type)} />
                  </View>
                  <Text style={styles.typeOptionLabel}>{item.label}</Text>
                  {selectedType === item.type && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedType && (
              <View style={styles.searchSection}>
                <Text style={styles.searchLabel}>Rechercher par nom ou numéro</Text>
                <View style={styles.searchInput}>
                  <Ionicons name="search" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.searchTextInput}
                    placeholder="Ex: FC Strasbourg, 67000..."
                    placeholderTextColor={Colors.textLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
            )}

            <CustomButton
              title="AJOUTER CE PROFIL"
              onPress={handleAddProfile}
              disabled={!selectedType}
              icon="add-circle"
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
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeProfile: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.md,
    marginLeft: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  maxProfilesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  maxProfilesText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  typeList: {
    maxHeight: 300,
    marginBottom: Spacing.md,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  typeOptionSelected: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  typeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  typeOptionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  searchSection: {
    marginBottom: Spacing.lg,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});
