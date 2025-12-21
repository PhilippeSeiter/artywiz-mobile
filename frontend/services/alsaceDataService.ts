/**
 * Service de données pour Ligue de Football d'Alsace
 * Basé sur les fichiers fournis dans le ZIP Alsace.zip
 */

export interface AlsaceDocumentSupport {
  id: string;
  type: 'post' | 'story' | 'video-hd' | 'hd' | 'calendrier' | 'mockup' | 'pdf';
  label: string;
  filename: string;
}

export interface AlsaceDocument {
  id: string;
  folderId: string;
  ligne1: string; // Date
  ligne2: string; // Type de document
  ligne3: string; // Description / Compétition
  ligne4: string; // Ligue ou info complémentaire
  mockupImage: any; // require() pour l'image
  supports: AlsaceDocumentSupport[];
  isSponsored: boolean;
  sponsorPrice?: number;
  status: 'brouillon' | 'en-cours' | 'pret' | 'publie';
}

// Documents pour Ligue de Football d'Alsace
export const ALSACE_DOCUMENTS: AlsaceDocument[] = [
  {
    id: 'alsace_liste_matchs',
    folderId: 'Liste de Match',
    ligne1: '23 décembre 2025',
    ligne2: 'Liste de matchs',
    ligne3: 'Programme du weekend',
    ligne4: 'Ligue de Football d\'Alsace',
    mockupImage: require('../assets/documents/Alsace/Liste de Match/Mockup.png'),
    supports: [
      { id: 'lm_post', type: 'post', label: 'Post', filename: 'post.png' },
      { id: 'lm_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'lm_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 90,
    status: 'pret',
  },
  {
    id: 'alsace_liste_resultats',
    folderId: 'Liste de Resultats',
    ligne1: '22 décembre 2025',
    ligne2: 'Liste de résultats',
    ligne3: 'Résultats du weekend',
    ligne4: 'Ligue de Football d\'Alsace',
    mockupImage: require('../assets/documents/Alsace/Liste de Resultats/mockup.png'),
    supports: [
      { id: 'lr_post', type: 'post', label: 'Post', filename: 'Post.png' },
      { id: 'lr_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'lr_hd', type: 'hd', label: 'HD', filename: 'hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 70,
    status: 'en-cours',
  },
  {
    id: 'alsace_ephemeride',
    folderId: 'Ephemerides',
    ligne1: '21 décembre 2025',
    ligne2: 'Éphéméride',
    ligne3: 'La fierté alsacienne',
    ligne4: 'Ligue de Football d\'Alsace',
    mockupImage: require('../assets/documents/Alsace/Ephemerides/Mockup.png'),
    supports: [
      { id: 'eph_post', type: 'post', label: 'Post', filename: 'post.png' },
      { id: 'eph_story', type: 'story', label: 'Story', filename: 'story.png' },
    ],
    isSponsored: false,
    status: 'publie',
  },
  {
    id: 'alsace_calendrier',
    folderId: 'Calendriers Mensuels',
    ligne1: '20 décembre 2025',
    ligne2: 'Calendrier mensuel',
    ligne3: 'Calendrier des compétitions',
    ligne4: 'Ligue de Football d\'Alsace',
    mockupImage: require('../assets/documents/Alsace/Calendriers Mensuels/Mockup.png'),
    supports: [
      { id: 'cal_pdf', type: 'pdf', label: 'PDF', filename: 'calendriers.pdf' },
    ],
    isSponsored: true,
    sponsorPrice: 110,
    status: 'brouillon',
  },
];

export class AlsaceDataService {
  static getAllDocuments(): AlsaceDocument[] {
    return ALSACE_DOCUMENTS;
  }

  static getDocumentById(id: string): AlsaceDocument | undefined {
    return ALSACE_DOCUMENTS.find(d => d.id === id);
  }

  static getDocumentsByStatus(status: AlsaceDocument['status']): AlsaceDocument[] {
    return ALSACE_DOCUMENTS.filter(d => d.status === status);
  }

  static getSponsoredDocuments(): AlsaceDocument[] {
    return ALSACE_DOCUMENTS.filter(d => d.isSponsored);
  }
}

export default AlsaceDataService;
