/**
 * Service de données pour AS Strasbourg - Club (profil club)
 * Basé sur les fichiers fournis dans le ZIP AS Strasbourg.zip
 */

export interface ClubDocumentSupport {
  id: string;
  type: 'publication-facebook' | 'story' | 'video-hd' | 'newsletter' | 'calendrier' | 'mockup' | 'pdf';
  label: string;
  filename: string;
}

export interface ASClubDocument {
  id: string;
  folderId: string;
  ligne1: string; // Date
  ligne2: string; // Type de document
  ligne3: string; // Description / Compétition
  ligne4: string; // Club ou info complémentaire
  mockupImage: any; // require() pour l'image
  supports: ClubDocumentSupport[];
  isSponsored: boolean;
  sponsorPrice?: number;
  status: 'brouillon' | 'en-cours' | 'pret' | 'publie';
}

// Documents pour AS Strasbourg - Club
export const AS_STRASBOURG_CLUB_DOCUMENTS: ASClubDocument[] = [
  {
    id: 'asclub_liste_matchs',
    folderId: 'Liste de Matchs',
    ligne1: '20 novembre 2025',
    ligne2: 'Liste de matchs',
    ligne3: 'Programme du weekend',
    ligne4: 'AS Strasbourg - Club',
    mockupImage: require('../assets/documents/AS Strasbourg/Liste de Matchs/Club_20-11-2025_liste-de-matchs_AS Strasbourg_story-mockup.png'),
    supports: [
      { id: 'lm_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'Club_20-11-2025_liste-de-matchs_AS Strasbourg_publication-facebook.png' },
      { id: 'lm_story', type: 'story', label: 'Story', filename: 'Club_20-11-2025_liste-de-matchs_AS Strasbourg_story.png' },
      { id: 'lm_video', type: 'video-hd', label: 'Vidéo HD', filename: 'Club_20-11-2025_liste-de-matchs_AS Strasbourg_video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 75,
    status: 'pret',
  },
  {
    id: 'asclub_liste_resultats',
    folderId: 'Liste de Resultats',
    ligne1: '18 novembre 2025',
    ligne2: 'Liste de résultats',
    ligne3: 'Résultats du weekend',
    ligne4: 'AS Strasbourg - Club',
    mockupImage: require('../assets/documents/AS Strasbourg/Liste de Resultats/mockup.png'),
    supports: [
      { id: 'lr_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'publication-facebook.png' },
      { id: 'lr_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'lr_video', type: 'video-hd', label: 'Vidéo HD', filename: 'video-hd.png' },
    ],
    isSponsored: true,
    sponsorPrice: 50,
    status: 'en-cours',
  },
  {
    id: 'asclub_ephemeride',
    folderId: 'Ephemerides',
    ligne1: '15 novembre 2025',
    ligne2: 'Éphéméride',
    ligne3: 'Journée internationale du football',
    ligne4: 'AS Strasbourg',
    mockupImage: require('../assets/documents/AS Strasbourg/Ephemerides/mockup.png'),
    supports: [
      { id: 'eph_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'publication-facebook.png' },
      { id: 'eph_story', type: 'story', label: 'Story', filename: 'story.png' },
      { id: 'eph_newsletter', type: 'newsletter', label: 'Newsletter', filename: 'newsletter.png' },
    ],
    isSponsored: false,
    status: 'publie',
  },
  {
    id: 'asclub_recrutement',
    folderId: 'Recrutement Arbitre',
    ligne1: '10 novembre 2025',
    ligne2: 'Recrutement arbitre',
    ligne3: 'Devenez arbitre !',
    ligne4: 'AS Strasbourg',
    mockupImage: require('../assets/documents/AS Strasbourg/Recrutement Arbitre/mockup.png'),
    supports: [
      { id: 'rec_fb', type: 'publication-facebook', label: 'Publication Facebook', filename: 'publication-facebook.png' },
      { id: 'rec_story', type: 'story', label: 'Story', filename: 'story.png' },
    ],
    isSponsored: false,
    status: 'brouillon',
  },
  {
    id: 'asclub_calendrier',
    folderId: 'Calendriers',
    ligne1: '5 novembre 2025',
    ligne2: 'Calendrier',
    ligne3: 'Calendrier 2026 - AS Strasbourg',
    ligne4: 'AS Strasbourg',
    mockupImage: require('../assets/documents/AS Strasbourg/Calendriers/mockup.png'),
    supports: [
      { id: 'cal_img', type: 'calendrier', label: 'Calendrier', filename: 'Calendriers.png' },
      { id: 'cal_pdf', type: 'pdf', label: 'PDF', filename: 'calendiers.pdf' },
    ],
    isSponsored: true,
    sponsorPrice: 100,
    status: 'brouillon',
  },
];

export class ASStrasbourgClubDataService {
  static getAllDocuments(): ASClubDocument[] {
    return AS_STRASBOURG_CLUB_DOCUMENTS;
  }

  static getDocumentById(id: string): ASClubDocument | undefined {
    return AS_STRASBOURG_CLUB_DOCUMENTS.find(d => d.id === id);
  }

  static getDocumentsByStatus(status: ASClubDocument['status']): ASClubDocument[] {
    return AS_STRASBOURG_CLUB_DOCUMENTS.filter(d => d.status === status);
  }

  static getSponsoredDocuments(): ASClubDocument[] {
    return AS_STRASBOURG_CLUB_DOCUMENTS.filter(d => d.isSponsored);
  }
}

export default ASStrasbourgClubDataService;
