import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSponsorStore } from '../stores/sponsorStore';
import { SponsorMockService } from '../services/sponsorMockService';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// Steps
const STEPS = [
  { id: 1, title: 'Nom', icon: 'pencil' },
  { id: 2, title: 'Visuel', icon: 'image' },
  { id: 3, title: 'Thématiques', icon: 'pricetags' },
  { id: 4, title: 'Zone', icon: 'location' },
  { id: 5, title: 'Période', icon: 'calendar' },
  { id: 6, title: 'Budget', icon: 'wallet' },
];

// Thématiques disponibles
const THEMATIQUES = [
  { id: 'football', label: 'Football', icon: 'football' },
  { id: 'basket', label: 'Basketball', icon: 'basketball' },
  { id: 'rugby', label: 'Rugby', icon: 'american-football' },
  { id: 'handball', label: 'Handball', icon: 'hand-left' },
  { id: 'volley', label: 'Volleyball', icon: 'tennisball' },
  { id: 'tennis', label: 'Tennis', icon: 'tennisball-outline' },
  { id: 'athletisme', label: 'Athlétisme', icon: 'walk' },
  { id: 'natation', label: 'Natation', icon: 'water' },
];

// Rayons disponibles
const RAYONS = [5, 10, 15, 25, 50, 100];

// Types de période
type PeriodeType = 'weekend' | 'semaine' | 'custom';

export default function CreateCampaignScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { createCampaign, budget } = useSponsorStore();

  // Current step
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Nom
  const [campaignName, setCampaignName] = useState('');

  // Step 2: Visuel/Logo
  const [campaignVisual, setCampaignVisual] = useState<string | null>(null);

  // Step 3: Thématiques
  const [selectedThematiques, setSelectedThematiques] = useState<string[]>([]);

  // Step 4: Zone
  const [codePostal, setCodePostal] = useState('');
  const [rayonKm, setRayonKm] = useState(10);
  const [clubsPotentiels, setClubsPotentiels] = useState(0);

  // Step 5: Période
  const [periodeType, setPeriodeType] = useState<PeriodeType>('weekend');
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);

  // Step 6: Budget
  const [hasBudgetCap, setHasBudgetCap] = useState(false);
  const [budgetCap, setBudgetCap] = useState('');
  const [stopWhenCapReached, setStopWhenCapReached] = useState(true);

  // Calculate potential clubs based on postal code and radius
  const calculateClubsPotentiels = (cp: string, rayon: number) => {
    if (cp.length < 2) {
      setClubsPotentiels(0);
      return;
    }
    // Simulate calculation based on postal code prefix
    const prefix = cp.substring(0, 2);
    const baseCount = parseInt(prefix) % 30 + 5; // Random-ish based on prefix
    const multiplier = rayon / 10;
    setClubsPotentiels(Math.floor(baseCount * multiplier));
  };

  // Handlers
  const handlePickVisual = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCampaignVisual(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error picking image:', e);
    }
  };

  const handleRemoveVisual = () => {
    setCampaignVisual(null);
  };

  const toggleThematique = (id: string) => {
    setSelectedThematiques(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCodePostalChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 5);
    setCodePostal(cleaned);
    calculateClubsPotentiels(cleaned, rayonKm);
  };

  const handleRayonChange = (rayon: number) => {
    setRayonKm(rayon);
    calculateClubsPotentiels(codePostal, rayon);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return campaignName.trim().length >= 3;
      case 2: return true; // Visual is optional
      case 3: return selectedThematiques.length > 0;
      case 4: return codePostal.length === 5 && clubsPotentiels > 0;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      router.back();
    }
  };

  const handleLaunchCampaign = () => {
    // Validate
    if (!campaignName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom de campagne.');
      return;
    }
    if (selectedThematiques.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une thématique.');
      return;
    }
    if (codePostal.length !== 5) {
      Alert.alert('Erreur', 'Veuillez saisir un code postal valide.');
      return;
    }

    // Create campaign
    const campaign = createCampaign({
      name: campaignName.trim(),
      visual: campaignVisual || undefined,
      thematiques: selectedThematiques,
      zone: {
        codePostal,
        rayonKm,
      },
      periode: {
        type: periodeType,
        dateDebut: periodeType === 'custom' ? dateDebut.toISOString() : undefined,
        dateFin: periodeType === 'custom' ? dateFin.toISOString() : undefined,
      },
      status: 'active',
      budgetCap: hasBudgetCap ? parseFloat(budgetCap) || undefined : undefined,
      stopWhenCapReached: hasBudgetCap ? stopWhenCapReached : undefined,
    });

    // Navigate to campaign detail
    Alert.alert(
      'Campagne lancée ! 🎉',
      `Votre campagne "${campaignName}" est maintenant active. ${clubsPotentiels} clubs ont été ciblés.`,
      [
        {
          text: 'Voir ma campagne',
          onPress: () => router.replace(`/campaign/${campaign.id}`),
        },
      ]
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Nom de la campagne</Text>
            <Text style={styles.stepDescription}>
              Choisissez un nom clair pour identifier votre campagne
            </Text>
            <TextInput
              style={styles.textInput}
              value={campaignName}
              onChangeText={setCampaignName}
              placeholder="Ex: Équipements Été 2025"
              placeholderTextColor={Colors.textLight}
              maxLength={50}
              autoFocus
            />
            <Text style={styles.charCount}>{campaignName.length}/50</Text>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Visuel / Logo</Text>
            <Text style={styles.stepDescription}>
              Ajoutez un visuel pour votre campagne (optionnel)
            </Text>
            
            {campaignVisual ? (
              <View style={styles.visualPreviewContainer}>
                <Image source={{ uri: campaignVisual }} style={styles.visualPreview} />
                <TouchableOpacity 
                  style={styles.removeVisualBtn}
                  onPress={handleRemoveVisual}
                >
                  <Ionicons name="close-circle" size={28} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={handlePickVisual}>
                <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
                <Text style={styles.uploadText}>Importer une image</Text>
                <Text style={styles.uploadHint}>PNG ou JPG • Max 5 MB</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Thématiques</Text>
            <Text style={styles.stepDescription}>
              Sélectionnez les thématiques sportives ciblées
            </Text>
            
            <View style={styles.thematiquesGrid}>
              {THEMATIQUES.map(theme => {
                const isSelected = selectedThematiques.includes(theme.id);
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[styles.thematiqueItem, isSelected && styles.thematiqueItemSelected]}
                    onPress={() => toggleThematique(theme.id)}
                  >
                    <Ionicons 
                      name={theme.icon as any} 
                      size={24} 
                      color={isSelected ? Colors.white : Colors.primary} 
                    />
                    <Text style={[styles.thematiqueLabel, isSelected && styles.thematiqueLabelSelected]}>
                      {theme.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {selectedThematiques.length > 0 && (
              <Text style={styles.selectionCount}>
                {selectedThematiques.length} thématique{selectedThematiques.length > 1 ? 's' : ''} sélectionnée{selectedThematiques.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Zone géographique</Text>
            <Text style={styles.stepDescription}>
              Définissez la zone de ciblage des clubs
            </Text>

            <Text style={styles.inputLabel}>Code postal</Text>
            <TextInput
              style={styles.textInput}
              value={codePostal}
              onChangeText={handleCodePostalChange}
              placeholder="Ex: 75001"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
              maxLength={5}
            />

            <Text style={styles.inputLabel}>Rayon</Text>
            <View style={styles.rayonSelector}>
              {RAYONS.map(rayon => (
                <TouchableOpacity
                  key={rayon}
                  style={[styles.rayonOption, rayonKm === rayon && styles.rayonOptionSelected]}
                  onPress={() => handleRayonChange(rayon)}
                >
                  <Text style={[styles.rayonText, rayonKm === rayon && styles.rayonTextSelected]}>
                    {rayon} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {codePostal.length === 5 && (
              <View style={styles.clubsCard}>
                <Ionicons name="people" size={32} color={Colors.primary} />
                <View style={styles.clubsInfo}>
                  <Text style={styles.clubsCount}>{clubsPotentiels}</Text>
                  <Text style={styles.clubsLabel}>Clubs potentiels</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Période</Text>
            <Text style={styles.stepDescription}>
              Quand souhaitez-vous diffuser votre campagne ?
            </Text>

            <View style={styles.periodeOptions}>
              <TouchableOpacity
                style={[styles.periodeOption, periodeType === 'weekend' && styles.periodeOptionSelected]}
                onPress={() => setPeriodeType('weekend')}
              >
                <Ionicons 
                  name="sunny" 
                  size={24} 
                  color={periodeType === 'weekend' ? Colors.primary : Colors.textSecondary} 
                />
                <Text style={[styles.periodeText, periodeType === 'weekend' && styles.periodeTextSelected]}>
                  Week-end
                </Text>
                <Text style={styles.periodeHint}>Sam-Dim prochains</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodeOption, periodeType === 'semaine' && styles.periodeOptionSelected]}
                onPress={() => setPeriodeType('semaine')}
              >
                <Ionicons 
                  name="calendar" 
                  size={24} 
                  color={periodeType === 'semaine' ? Colors.primary : Colors.textSecondary} 
                />
                <Text style={[styles.periodeText, periodeType === 'semaine' && styles.periodeTextSelected]}>
                  Semaine
                </Text>
                <Text style={styles.periodeHint}>7 jours</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodeOption, periodeType === 'custom' && styles.periodeOptionSelected]}
                onPress={() => setPeriodeType('custom')}
              >
                <Ionicons 
                  name="options" 
                  size={24} 
                  color={periodeType === 'custom' ? Colors.primary : Colors.textSecondary} 
                />
                <Text style={[styles.periodeText, periodeType === 'custom' && styles.periodeTextSelected]}>
                  Personnalisé
                </Text>
                <Text style={styles.periodeHint}>Choisir dates</Text>
              </TouchableOpacity>
            </View>

            {periodeType === 'custom' && (
              <View style={styles.customDates}>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowDateDebutPicker(true)}
                >
                  <Text style={styles.dateLabel}>Date début</Text>
                  <Text style={styles.dateValue}>
                    {dateDebut.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowDateFinPicker(true)}
                >
                  <Text style={styles.dateLabel}>Date fin</Text>
                  <Text style={styles.dateValue}>
                    {dateFin.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {showDateDebutPicker && (
              <DateTimePicker
                value={dateDebut}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDateDebutPicker(false);
                  if (date) setDateDebut(date);
                }}
              />
            )}

            {showDateFinPicker && (
              <DateTimePicker
                value={dateFin}
                mode="date"
                display="default"
                minimumDate={dateDebut}
                onChange={(event, date) => {
                  setShowDateFinPicker(false);
                  if (date) setDateFin(date);
                }}
              />
            )}
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Budget (optionnel)</Text>
            <Text style={styles.stepDescription}>
              Définissez un plafond pour maîtriser vos dépenses
            </Text>

            <View style={styles.budgetInfo}>
              <Ionicons name="wallet" size={24} color={Colors.primary} />
              <Text style={styles.budgetLabel}>Votre solde actuel</Text>
              <Text style={styles.budgetValue}>{budget.disponible}€</Text>
            </View>

            <TouchableOpacity
              style={styles.budgetToggle}
              onPress={() => setHasBudgetCap(!hasBudgetCap)}
            >
              <Ionicons 
                name={hasBudgetCap ? "checkbox" : "square-outline"} 
                size={24} 
                color={Colors.primary} 
              />
              <Text style={styles.budgetToggleText}>Définir un plafond budgétaire</Text>
            </TouchableOpacity>

            {hasBudgetCap && (
              <View style={styles.budgetCapSection}>
                <Text style={styles.inputLabel}>Plafond</Text>
                <View style={styles.budgetInputRow}>
                  <TextInput
                    style={[styles.textInput, styles.budgetInput]}
                    value={budgetCap}
                    onChangeText={setBudgetCap}
                    placeholder="Ex: 500"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencyLabel}>€</Text>
                </View>

                <TouchableOpacity
                  style={styles.stopToggle}
                  onPress={() => setStopWhenCapReached(!stopWhenCapReached)}
                >
                  <Ionicons 
                    name={stopWhenCapReached ? "checkbox" : "square-outline"} 
                    size={22} 
                    color={Colors.primary} 
                  />
                  <Text style={styles.stopToggleText}>
                    Stopper la campagne quand le plafond est atteint
                  </Text>
                </TouchableOpacity>

                {!stopWhenCapReached && (
                  <View style={styles.alertInfo}>
                    <Ionicons name="information-circle" size={20} color={Colors.warning} />
                    <Text style={styles.alertText}>
                      Vous recevrez des alertes journalières sur l'activité et les dépenses
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.budgetNote}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.budgetNoteText}>
                Les euros sont consommés uniquement lorsqu'un accord est validé avec un club.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer une campagne</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View key={step.id} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                currentStep >= step.id && styles.progressDotActive,
                currentStep === step.id && styles.progressDotCurrent,
              ]}>
                {currentStep > step.id ? (
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                ) : (
                  <Text style={[
                    styles.progressNumber,
                    currentStep >= step.id && styles.progressNumberActive,
                  ]}>
                    {step.id}
                  </Text>
                )}
              </View>
              {index < STEPS.length - 1 && (
                <View style={[
                  styles.progressLine,
                  currentStep > step.id && styles.progressLineActive,
                ]} />
              )}
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.md }]}>
        {currentStep < STEPS.length ? (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <LinearGradient
              colors={canProceed() ? [Colors.gradientStart, Colors.gradientEnd] : [Colors.border, Colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={[styles.nextButtonText, !canProceed() && styles.nextButtonTextDisabled]}>
                Continuer
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={canProceed() ? Colors.white : Colors.textSecondary} 
              />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.launchButton}
            onPress={handleLaunchCampaign}
          >
            <LinearGradient
              colors={[Colors.success, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.launchButtonGradient}
            >
              <Ionicons name="rocket" size={20} color={Colors.white} />
              <Text style={styles.launchButtonText}>Lancer la campagne</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.white,
  },
  progressDotCurrent: {
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  progressNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  progressNumberActive: {
    color: Colors.primary,
  },
  progressLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: Colors.white,
  },
  // Content
  scrollContent: {
    padding: Spacing.lg,
  },
  stepContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  // Text Input
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  // Visual upload
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.primary + '08',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  uploadHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  visualPreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  visualPreview: {
    width: width - Spacing.lg * 4 - Spacing.lg * 2,
    height: width - Spacing.lg * 4 - Spacing.lg * 2,
    borderRadius: 16,
  },
  removeVisualBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  // Thematiques
  thematiquesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  thematiqueItem: {
    width: (width - Spacing.lg * 4 - Spacing.sm * 3) / 4,
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thematiqueItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  thematiqueLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  thematiqueLabelSelected: {
    color: Colors.white,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  // Zone
  rayonSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rayonOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rayonOptionSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  rayonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  rayonTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  clubsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  clubsInfo: {
    flex: 1,
  },
  clubsCount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  clubsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Periode
  periodeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  periodeOption: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  periodeOptionSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  periodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  periodeTextSelected: {
    color: Colors.primary,
  },
  periodeHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  customDates: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  // Budget
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  budgetLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  budgetToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  budgetToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  budgetCapSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInput: {
    flex: 1,
  },
  currencyLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  stopToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  stopToggleText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: Colors.warning,
  },
  budgetNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  budgetNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.success,
    lineHeight: 18,
  },
  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  nextButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  launchButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  launchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  launchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
