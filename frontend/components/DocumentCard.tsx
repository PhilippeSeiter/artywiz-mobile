import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Document } from '../types';
import { Colors, Spacing } from '../constants';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
}

const getIconName = (themeId: string, subthemeId: string): keyof typeof Ionicons.glyphMap => {
  if (subthemeId.includes('poster')) return 'megaphone';
  if (subthemeId.includes('list')) return 'list';
  if (subthemeId.includes('result')) return 'trophy';
  if (subthemeId.includes('campaign')) return 'megaphone-outline';
  return 'document-text';
};

const isListDocument = (subthemeId: string) => {
  return subthemeId.includes('match_list') || subthemeId.includes('result_list');
};

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPress }) => {
  const iconName = getIconName(document.themeId, document.subthemeId);
  const isList = isListDocument(document.subthemeId);
  const isMatch = document.themeId === 'match';
  const isResult = document.themeId === 'result';

  // Generate mock sponsored price
  const sponsoredPrice = document.isSponsored ? Math.floor(Math.random() * 20) + 5 : 0;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        document.isSponsored && styles.sponsoredContainer
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, document.isSponsored && styles.sponsoredIconContainer]}>
        <Ionicons name={iconName} size={24} color={document.isSponsored ? Colors.warning : Colors.primary} />
      </View>
      
      <View style={styles.content}>
        {/* For Match/Result Lists: Special formatting */}
        {isList ? (
          <>
            <Text style={styles.title} numberOfLines={1}>
              {isMatch ? 'Matchs du week-end' : isResult ? 'Résultats du week-end' : document.title}
            </Text>
            <Text style={styles.metaText}>
              {document.typeLabel}
            </Text>
            <Text style={styles.date}>{new Date(document.date).toLocaleDateString('fr-FR')}</Text>
          </>
        ) : (
          <>
            {/* For Single Match/Poster documents: Regular formatting */}
            <Text style={styles.title} numberOfLines={2}>{document.title}</Text>
            <View style={styles.metadata}>
              <Text style={styles.metaText}>{document.typeLabel}</Text>
              {document.teamLabel && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.metaText}>{document.teamLabel}</Text>
                </>
              )}
            </View>
            <Text style={styles.date}>{new Date(document.date).toLocaleDateString('fr-FR')}</Text>
          </>
        )}

        {/* Sponsored line with price */}
        {document.isSponsored && (
          <View style={styles.sponsoredRow}>
            <Ionicons name="star" size={12} color={Colors.warning} />
            <Text style={styles.sponsoredPrice}>Sponsorisé : {sponsoredPrice}€</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sponsoredContainer: {
    backgroundColor: Colors.warning + '08',
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sponsoredIconContainer: {
    backgroundColor: Colors.warning + '15',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Spacing.xs / 2,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  separator: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
  },
  date: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '400',
  },
  sponsoredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs / 2,
  },
  sponsoredPrice: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
  },
});
