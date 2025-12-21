/**
 * Service de données pour Ligue de Football de Normandie
 * Basé sur les fichiers fournis dans le ZIP Normandie.zip
 */

export interface NormandieDocumentSupport {
  id: string;
  type: 'post' | 'story' | 'video-hd' | 'calendrier' | 'mockup' | 'pdf';
  label: string;
  filename: string;
}

export interface NormandieDocument {
  id: string;
  folderId: string;
  ligne1: string; // Date
  ligne2: string; // Type de document
  ligne3: string; // Description / Compétition
  ligne4: string; // Ligue ou info complémentaire
  mockupImage: any; // require() pour l'image
  supports: NormandieDocumentSupport[];
  isSponsored: boolean;
  sponsorPrice?: number;
  status: 'brouillon' | 'en-cours' | 'pret' | 'publie';
}

// Documents pour Ligue de Football de Normandie
export const NORMANDIE_DOCUMENTS: NormandieDocument[] = [
  {
    id: 'normandie_liste_matchs',
    folderId: 'Liste de Match',
    ligne1: '22 décembre 2025',
    ligne2: 'Liste de matchs',
    ligne3: 'Programme du weekend',
    ligne4: 'Ligue de Football de Normandie',
    mockupImage: require('../assets/documents/Normandie/Liste de Match/Mockup.png'),
    supports: [
      { id: 'lm_post', type: 'post', label: 'Post', filename: 'post.png' },
      { id: 'lm_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'lm_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 120,
    status: 'pret',
  },
  {
    id: 'normandie_liste_resultats',
    folderId: 'Liste de Resultats',
    ligne1: '21 décembre 2025',
    ligne2: 'Liste de résultats',
    ligne3: 'Résultats du weekend',
    ligne4: 'Ligue de Football de Normandie',
    mockupImage: require('../assets/documents/Normandie/Liste de Resultats/Mockup.png'),
    supports: [
      { id: 'lr_post', type: 'post', label: 'Post', filename: 'post.png' },
      { id: 'lr_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'lr_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 80,
    status: 'en-cours',
  },
  {
    id: 'normandie_ephemeride',
    folderId: 'Ephemerides',
    ligne1: '20 décembre 2025',
    ligne2: 'Éphéméride',
    ligne3: 'Le foot normand à l\'honneur',
    ligne4: 'Ligue de Football de Normandie',
    mockupImage: require('../assets/documents/Normandie/Ephemerides/Mockup.png'),
    supports: [
      { id: 'eph_post', type: 'post', label: 'Post', filename: 'post.png' },
      { id: 'eph_story', type: 'story', label: 'Story', filename: 'story.png' },
    ],
    isSponsored: false,
    status: 'publie',
  },
  {
    id: 'normandie_calendrier',
    folderId: 'Calendriers Mensuels',
    ligne1: '15 décembre 2025',
    ligne2: 'Calendrier mensuel',
    ligne3: 'Calendrier des compétitions',
    ligne4: 'Ligue de Football de Normandie',
    mockupImage: require('../assets/documents/Normandie/Calendriers Mensuels/Mockup.png'),
    supports: [
      { id: 'cal_pdf', type: 'pdf', label: 'PDF', filename: 'calendriers.pdf' },
    ],
    isSponsored: true,
    sponsorPrice: 150,
    status: 'brouillon',
  },
];

export class NormandieDataService {
  static getAllDocuments(): NormandieDocument[] {
    return NORMANDIE_DOCUMENTS;
  }

  static getDocumentById(id: string): NormandieDocument | undefined {
    return NORMANDIE_DOCUMENTS.find(d => d.id === id);
  }

  static getDocumentsByStatus(status: NormandieDocument['status']): NormandieDocument[] {
    return NORMANDIE_DOCUMENTS.filter(d => d.status === status);
  }

  static getSponsoredDocuments(): NormandieDocument[] {
    return NORMANDIE_DOCUMENTS.filter(d => d.isSponsored);
  }
}

export default NormandieDataService;
