/**
 * Service de données pour AS Strasbourg - Seniors 1
 * Basé sur les fichiers fournis dans le ZIP
 */

export interface DocumentSupport {
  id: string;
  type: 'publication-facebook' | 'story' | 'video-hd' | 'newsletter' | 'calendrier' | 'mockup';
  label: string;
  filename: string;
}

export interface ASDocument {
  id: string;
  folderId: string;
  ligne1: string; // Date
  ligne2: string; // Type de document
  ligne3: string; // Description / Compétition
  ligne4: string; // Équipe ou info complémentaire
  mockupImage: any; // require() pour l'image
  supports: DocumentSupport[];
  isSponsored: boolean;
  sponsorPrice?: number;
  status: 'brouillon' | 'en-cours' | 'pret' | 'publie';
}

// Documents pour AS Strasbourg - Seniors 1
export const AS_STRASBOURG_DOCUMENTS: ASDocument[] = [
  {
    id: 'ass_annoncer_match',
    folderId: 'Annoncer un Match',
    ligne1: 'Séniors 1 - 01/01/25',
    ligne2: 'Annoncer un match',
    ligne3: 'Championnat R3',
    ligne4: 'ASS Strasbourg - FR Haguenau',
    mockupImage: require('../assets/documents/AS Strasbourg - Team Senior 1/Annoncer un Match/mockup.png'),
    supports: [
      { id: 'ann_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'publication-facebook.png' },
      { id: 'ann_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'ann_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 50,
    status: 'brouillon',
  },
  {
    id: 'ass_resultat',
    folderId: 'Communiquer un Resultat',
    ligne1: 'Séniors 1 - 28/12/24',
    ligne2: 'Communiquer un résultat',
    ligne3: 'Championnat R3',
    ligne4: 'ASS Strasbourg 3 - 1 RC Strasbourg',
    mockupImage: require('../assets/documents/AS Strasbourg - Team Senior 1/Communiquer un Resultat/mockup.png'),
    supports: [
      { id: 'res_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'publication-facebook.png' },
      { id: 'res_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'res_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 50,
    status: 'en-cours',
  },
  {
    id: 'ass_matchs_we',
    folderId: 'Matchs du we',
    ligne1: 'Séniors 1 - Décembre',
    ligne2: 'Liste de matchs',
    ligne3: 'Championnat R3',
    ligne4: 'Programme du mois',
    mockupImage: require('../assets/documents/AS Strasbourg - Team Senior 1/Matchs du we/mockup.png'),
    supports: [
      { id: 'we_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'publication-facebook.png' },
      { id: 'we_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'we_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: false,
    status: 'pret',
  },
  {
    id: 'ass_ephemeride',
    folderId: 'Ephemerides',
    ligne1: 'Séniors 1 - 21/12/24',
    ligne2: 'Éphéméride',
    ligne3: 'Journée du foot',
    ligne4: 'St Philippe',
    mockupImage: require('../assets/documents/AS Strasbourg - Team Senior 1/Ephemerides/mockup.png'),
    supports: [
      { id: 'eph_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'publication-facebook.png' },
      { id: 'eph_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'eph_newsletter', type: 'newsletter', label: 'Newsletter', filename: 'newsletter.png' },
    ],
    isSponsored: true,
    sponsorPrice: 25,
    status: 'publie',
  },
  {
    id: 'ass_calendrier',
    folderId: 'Calendrier',
    ligne1: 'Séniors 1 - 2026',
    ligne2: 'Calendrier',
    ligne3: 'Calendrier annuel',
    ligne4: 'AS Strasbourg',
    mockupImage: require('../assets/documents/AS Strasbourg - Team Senior 1/Calendrier/mockup.png'),
    supports: [
      { id: 'cal_img', type: 'calendrier', label: 'Calendrier', filename: 'calendriers.png' },
    ],
    isSponsored: false,
    status: 'brouillon',
  },
];

export class ASStrasbourgDataService {
  static getAllDocuments(): ASDocument[] {
    return AS_STRASBOURG_DOCUMENTS;
  }

  static getDocumentById(id: string): ASDocument | undefined {
    return AS_STRASBOURG_DOCUMENTS.find(d => d.id === id);
  }

  static getDocumentsByStatus(status: ASDocument['status']): ASDocument[] {
    return AS_STRASBOURG_DOCUMENTS.filter(d => d.status === status);
  }

  static getSponsoredDocuments(): ASDocument[] {
    return AS_STRASBOURG_DOCUMENTS.filter(d => d.isSponsored);
  }
}

export default ASStrasbourgDataService;
