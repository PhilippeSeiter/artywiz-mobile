import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSponsorStore } from '../../stores/sponsorStore';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useAuthStore } from '../../stores/authStore';
import { MockDataService } from '../../services/mockDataService';

export default function SponsorCompteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSponsorMode } = useSponsorStore();
  const { selectedProfiles, activeProfileIndex, selectedThemes } = useUserPreferencesStore();
  const { user, logout } = useAuthStore();
  
  // Get active sponsor profile
  const activeProfile = selectedProfiles[activeProfileIndex];
  
  // Get themes for display
  const allThemes = MockDataService.getAllThemes();
  const footballThemes = allThemes.filter(t => t.id.startsWith('foot') || t.id === 'match_annonce' || t.id === 'resultat');
  const genericThemes = allThemes.filter(t => !t.id.startsWith('foot') && t.id !== 'match_annonce' && t.id !== 'resultat');
  
  // Get selected theme names
  const getSelectedThemeNames = (themeList: typeof allThemes) => {
    return themeList
      .filter(t => selectedThemes.includes(t.id))
      .map(t => t.label)
      .slice(0, 3)
      .join(', ') || 'Aucune';
  };

  const [notificationsPush, setNotificationsPush] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            setSponsorMode(false);
            logout();
          },
        },
      ]
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
        <Text style={styles.headerTitle}>Mon compte</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card with real info and logo */}
        <View style={styles.profileCard}>
          {activeProfile?.logo ? (
            <Image 
              source={{ uri: activeProfile.logo }} 
              style={styles.profileLogo} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profileAvatar}>
              <Ionicons name="briefcase" size={32} color={Colors.primary} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{activeProfile?.name || 'Mon entreprise'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'contact@entreprise.com'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/profile-selection')}
          >
            <Ionicons name="pencil" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Thématiques Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thématiques</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => router.push('/onboarding-themes')}
          >
            <View style={styles.optionRow}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="football" size={20} color={Colors.success} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Thématiques football</Text>
                <Text style={styles.optionDesc}>{getSelectedThemeNames(footballThemes)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => router.push('/onboarding-themes')}
          >
            <View style={styles.optionRow}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="pricetags" size={20} color={Colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Thématiques génériques</Text>
                <Text style={styles.optionDesc}>{getSelectedThemeNames(genericThemes)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          
          <View style={styles.optionCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="notifications" size={20} color={Colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Notifications push</Text>
                <Text style={styles.optionDesc}>Recevoir les alertes sur mon téléphone</Text>
              </View>
              <Switch
                value={notificationsPush}
                onValueChange={setNotificationsPush}
                trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                thumbColor={notificationsPush ? Colors.primary : Colors.textSecondary}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Types de docs préférés</Text>
                <Text style={styles.optionDesc}>Post, Story, Affiche</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          
          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="card" size={20} color={Colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Moyens de paiement</Text>
                <Text style={styles.optionDesc}>Gérer mes cartes</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionIcon}>
                <Ionicons name="receipt" size={20} color={Colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Historique des achats</Text>
                <Text style={styles.optionDesc}>Factures et reçus</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Switch Mode */}
        <TouchableOpacity 
          style={styles.switchModeCard}
          onPress={() => {
            setSponsorMode(false);
            router.replace('/(tabs)');
          }}
        >
          <Ionicons name="swap-horizontal" size={24} color={Colors.primary} />
          <Text style={styles.switchModeText}>Passer en mode Club</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // Switch Mode
  switchModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  switchModeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.error,
  },
});
