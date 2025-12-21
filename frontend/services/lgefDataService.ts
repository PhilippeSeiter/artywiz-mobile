/**
 * Service de données pour LGEF - Ligue Grand Est de Football
 * Basé sur les fichiers fournis dans le ZIP LGEF.zip
 */

export interface LGEFDocumentSupport {
  id: string;
  type: 'publication' | 'post-facebook' | 'story' | 'video-hd' | 'reel' | 'calendrier' | 'mockup' | 'pdf';
  label: string;
  filename: string;
}

export interface LGEFDocument {
  id: string;
  folderId: string;
  ligne1: string; // Date
  ligne2: string; // Type de document
  ligne3: string; // Description / Compétition
  ligne4: string; // Ligue ou info complémentaire
  mockupImage: any; // require() pour l'image
  supports: LGEFDocumentSupport[];
  isSponsored: boolean;
  sponsorPrice?: number;
  status: 'brouillon' | 'en-cours' | 'pret' | 'publie';
}

// Documents pour LGEF - Ligue Grand Est de Football
export const LGEF_DOCUMENTS: LGEFDocument[] = [
  {
    id: 'lgef_liste_matchs',
    folderId: 'Liste de Matchs R1 Homiris',
    ligne1: '22 décembre 2025',
    ligne2: 'Liste de matchs R1 Homiris',
    ligne3: 'Championnat Régional 1',
    ligne4: 'Ligue Grand Est de Football',
    mockupImage: require('../assets/documents/LGEF/Liste de Matchs R1 Homiris/mockup.png'),
    supports: [
      { id: 'lm_pub', type: 'publication', label: 'Publication', filename: 'publication.png' },
      { id: 'lm_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
      { id: 'lm_reel', type: 'reel', label: 'Reel', filename: 'LGEF_liste-de-matchs-reel-20627082.png' },
    ],
    isSponsored: true,
    sponsorPrice: 150,
    status: 'pret',
  },
  {
    id: 'lgef_liste_resultats',
    folderId: 'Liste de Resultats R1 Homiris',
    ligne1: '21 décembre 2025',
    ligne2: 'Liste de résultats R1 Homiris',
    ligne3: 'Résultats Championnat Régional 1',
    ligne4: 'Ligue Grand Est de Football',
    mockupImage: require('../assets/documents/LGEF/Liste de Resultats R1 Homiris/Mockup.png'),
    supports: [
      { id: 'lr_fb', type: 'post-facebook', label: 'Post Facebook', filename: 'post facebook.png' },
      { id: 'lr_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'lr_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 100,
    status: 'en-cours',
  },
  {
    id: 'lgef_ephemeride',
    folderId: 'Ephemerides',
    ligne1: '20 décembre 2025',
    ligne2: 'Éphéméride',
    ligne3: 'La journée du football régional',
    ligne4: 'Ligue Grand Est de Football',
    mockupImage: require('../assets/documents/LGEF/Ephemerides/Mockup.png'),
    supports: [
      { id: 'eph_post', type: 'publication', label: 'Post', filename: 'post.png' },
      { id: 'eph_story', type: 'story', label: 'Story', filename: 'story.png' },
    ],
    isSponsored: false,
    status: 'publie',
  },
  {
    id: 'lgef_calendrier',
    folderId: 'Calendriers Mensuels',
    ligne1: '15 décembre 2025',
    ligne2: 'Calendrier mensuel',
    ligne3: 'Calendrier des compétitions',
    ligne4: 'Ligue Grand Est de Football',
    mockupImage: require('../assets/documents/LGEF/Calendriers Mensuels/Mockup.png'),
    supports: [
      { id: 'cal_pdf', type: 'pdf', label: 'PDF', filename: 'Calendriers.pdf' },
    ],
    isSponsored: true,
    sponsorPrice: 200,
    status: 'brouillon',
  },
];

export class LGEFDataService {
  static getAllDocuments(): LGEFDocument[] {
    return LGEF_DOCUMENTS;
  }

  static getDocumentById(id: string): LGEFDocument | undefined {
    return LGEF_DOCUMENTS.find(d => d.id === id);
  }

  static getDocumentsByStatus(status: LGEFDocument['status']): LGEFDocument[] {
    return LGEF_DOCUMENTS.filter(d => d.status === status);
  }

  static getSponsoredDocuments(): LGEFDocument[] {
    return LGEF_DOCUMENTS.filter(d => d.isSponsored);
  }
}

export default LGEFDataService;
