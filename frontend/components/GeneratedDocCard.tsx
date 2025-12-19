import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants';

export interface GeneratedDocument {
  id: string;
  title: string;
  typeLabel: string;
  date: string;
  previewImage: string;
  isSponsored: boolean;
  sponsorPrice?: number;
  channel: string;
}

interface GeneratedDocCardProps {
  document: GeneratedDocument;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;

export const GeneratedDocCard: React.FC<GeneratedDocCardProps> = ({ document, onPress }) => {
  const getImageSource = () => {
    // Map the preview images from the generated previews folder
    const imageMap: Record<string, any> = {
      'generated_1.png': require('../assets/generated_previews/annoncer-un-match-publication-facebook-558351.png'),
      'generated_2.png': require('../assets/generated_previews/annoncer-un-match-publication-facebook-559192.png'),
      'generated_3.png': require('../assets/generated_previews/annoncer-un-match-publication-facebook-577815.png'),
      'generated_4.png': require('../assets/generated_previews/annoncer-un-match-publication-facebook-620787.png'),
      'generated_5.png': require('../assets/generated_previews/Annoncer un match Publication Facebook -79488.png'),
      'generated_6.png': require('../assets/generated_previews/Facebook post - resultat 6.png'),
      'generated_7.png': require('../assets/generated_previews/Facebook post - resultat 8.png'),
      'generated_8.png': require('../assets/generated_previews/liste-de-matchs-story-620740 (1).png'),
    };
    
    return imageMap[document.previewImage] || require('../assets/images/placeholder_preview.png');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageWrapper}>
        <Image source={getImageSource()} style={styles.image} resizeMode="cover" />
        {document.isSponsored && (
          <View style={styles.sponsoredBadge}>
            <Ionicons name="star" size={10} color={Colors.white} />
            <Text style={styles.sponsoredText}>Sponsorisé</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{document.title}</Text>
        <Text style={styles.type}>{document.typeLabel}</Text>
        {document.isSponsored && document.sponsorPrice && (
          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={12} color={Colors.success} />
            <Text style={styles.price}>{document.sponsorPrice}€</Text>
          </View>
        )}
        <Text style={styles.date}>{new Date(document.date).toLocaleDateString('fr-FR')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH * 1.2,
    backgroundColor: Colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  sponsoredText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.white,
  },
  content: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  type: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  price: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  date: {
    fontSize: 10,
    color: Colors.textLight,
  },
});
