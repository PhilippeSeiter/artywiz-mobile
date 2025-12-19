/**
 * Service de données pour les documents ArtyWiz
 * Basé sur le fichier Excel "Artywiz docs names & infos"
 */

import {
  DocType,
  DocFormat,
  ProfileTarget,
  DocTypeDefinition,
  GeneratedDoc,
  DocAsset,
  DocFormatConfig,
} from '../types/documents';

// ============================================
// DÉFINITIONS DES TYPES DE DOCUMENTS
// Basé sur l'Excel - colonne "Ligne 2"
// ============================================
export const DOC_TYPE_DEFINITIONS: DocTypeDefinition[] = [
  {
    id: 'annoncer-match',
    label: 'Annoncer un match',
    description: 'Annonce d\'un match à venir',
    formats: {
      postReel: true,
      affiche: true,
      flyer: true,
      newsletter: true,
      video: true,
      banniere: true,
      mockup: true,
    },
    isSponsored: true,
    defaultPrice: 25,
  },
  {
    id: 'resultat',
    label: 'Communiquer un résultat',
    description: 'Résultat d\'un match joué',
    formats: {
      postReel: true,
      affiche: true,
      flyer: true,
      newsletter: true,
      video: true,
      banniere: true,
      mockup: true,
    },
    isSponsored: true,
    defaultPrice: 20,
  },
  {
    id: 'liste-matchs',
    label: 'Liste de matchs',
    description: 'Programme de matchs (semaine/mois)',
    formats: {
      postReel: true,
      affiche: true,
      flyer: true,
      newsletter: true,
      video: true,
      banniere: true,
      mockup: true,
    },
    isSponsored: true,
    defaultPrice: 30,
  },
  {
    id: 'ephemeride',
    label: 'Éphéméride',
    description: 'Journée spéciale (ex: Le jour du foot)',
    formats: {
      postReel: true,
      affiche: true,
      flyer: true,
      newsletter: true,
      video: true,
      banniere: true,
      mockup: true,
    },
    isSponsored: true,
    defaultPrice: 15,
  },
  {
    id: 'calendrier',
    label: 'Calendrier',
    description: 'Calendrier annuel personnalisé',
    formats: {
      postReel: true,
      affiche: true,
      flyer: false,
      newsletter: false,
      video: false,
      banniere: false,
      mockup: false,
    },
    isSponsored: false,
    defaultPrice: 0,
  },
  {
    id: 'accessoires',
    label: 'Accessoires',
    description: 'Goodies et produits dérivés',
    formats: {
      postReel: true,
      affiche: true,
      flyer: false,
      newsletter: false,
      video: false,
      banniere: false,
      mockup: false,
    },
    isSponsored: false,
    defaultPrice: 0,
  },
];

// ============================================
// DONNÉES DE DOCUMENTS GÉNÉRÉS
// Basé sur l'Excel - profil "Séniors 1"
// ============================================
const GENERATED_DOCS_DATA: GeneratedDoc[] = [
  // Document 1: Annoncer un match - Séniors 1
  {
    id: 'doc_001',
    typeId: 'annoncer-match',
    profileTarget: 'seniors-1',
    clubId: 'as-strasbourg',
    clubName: 'AS Strasbourg',
    teamId: 'seniors-1',
    teamName: 'Séniors 1',
    ligne2: 'Annoncer un match',
    ligne3: 'Championnat R3 Strasbourg - Paris',
    date: '2025-12-19',
    createdAt: '2025-12-19T00:00:00Z',
    assets: [
      {
        id: 'asset_001_fb',
        docId: 'doc_001',
        format: 'publication-facebook',
        filename: '1_19-12-2025_annoncer-un-match_AS-Strasbourg_publication-facebook.png',
        width: 1200,
        height: 630,
        generated: true,
        generatedAt: '2025-12-19T00:00:00Z',
      },
      {
        id: 'asset_001_story',
        docId: 'doc_001',
        format: 'story',
        filename: '1_19-12-2025_annoncer-un-match_AS-Strasbourg_story.png',
        width: 1080,
        height: 1920,
        generated: true,
        generatedAt: '2025-12-19T00:00:00Z',
      },
      {
        id: 'asset_001_video',
        docId: 'doc_001',
        format: 'video-hd',
        filename: '1_19-12-2025_annoncer-un-match_AS-Strasbourg_video-hd.png',
        width: 1920,
        height: 1080,
        generated: true,
        generatedAt: '2025-12-19T00:00:00Z',
      },
      {
        id: 'asset_001_mockup',
        docId: 'doc_001',
        format: 'mockup',
        filename: '1_19-12-2025_annoncer-un-match_AS-Strasbourg_publication-facebook_mockup.png',
        width: 1200,
        height: 900,
        generated: true,
        generatedAt: '2025-12-19T00:00:00Z',
      },
    ],
    isSponsored: true,
    sponsorPrice: 25,
    status: 'generated',
  },
  
  // Document 2: Communiquer un résultat - Séniors 1
  {
    id: 'doc_002',
    typeId: 'resultat',
    profileTarget: 'seniors-1',
    clubId: 'as-strasbourg',
    clubName: 'AS Strasbourg',
    teamId: 'seniors-1',
    teamName: 'Séniors 1',
    ligne2: 'Communiquer un résultat',
    ligne3: 'Championnat R3 Strasbourg - Paris',
    date: '2025-12-18',
    createdAt: '2025-12-18T12:00:00Z',
    assets: [
      {
        id: 'asset_002_fb',
        docId: 'doc_002',
        format: 'publication-facebook',
        filename: '2_18-12-2025_resultat_AS-Strasbourg_publication-facebook.png',
        width: 1200,
        height: 630,
        generated: true,
      },
      {
        id: 'asset_002_story',
        docId: 'doc_002',
        format: 'story',
        filename: '2_18-12-2025_resultat_AS-Strasbourg_story.png',
        width: 1080,
        height: 1920,
        generated: true,
      },
    ],
    isSponsored: true,
    sponsorPrice: 20,
    status: 'generated',
  },
  
  // Document 3: Liste de matchs - Séniors 1
  {
    id: 'doc_003',
    typeId: 'liste-matchs',
    profileTarget: 'seniors-1',
    clubId: 'as-strasbourg',
    clubName: 'AS Strasbourg',
    teamId: 'seniors-1',
    teamName: 'Séniors 1',
    ligne2: 'Liste de matchs',
    ligne3: 'Championnat R3 Programme de décembre',
    date: '2025-12-01',
    createdAt: '2025-12-01T08:00:00Z',
    assets: [
      {
        id: 'asset_003_fb',
        docId: 'doc_003',
        format: 'publication-facebook',
        filename: '3_01-12-2025_liste-matchs_AS-Strasbourg_publication-facebook.png',
        width: 1200,
        height: 630,
        generated: true,
      },
    ],
    isSponsored: true,
    sponsorPrice: 30,
    status: 'generated',
  },
  
  // Document 4: Éphéméride - St Philippe (sponsor)
  {
    id: 'doc_004',
    typeId: 'ephemeride',
    profileTarget: 'st-philippe',
    clubId: 'as-strasbourg',
    clubName: 'AS Strasbourg',
    ligne2: 'Éphéméride',
    ligne3: 'Le jour du foot et des animaux',
    date: '2025-12-20',
    createdAt: '2025-12-20T00:00:00Z',
    assets: [
      {
        id: 'asset_004_fb',
        docId: 'doc_004',
        format: 'publication-facebook',
        filename: '4_20-12-2025_ephemeride_St-Philippe_publication-facebook.png',
        width: 1200,
        height: 630,
        generated: true,
      },
    ],
    isSponsored: true,
    sponsorPrice: 15,
    sponsorId: 'st-philippe',
    sponsorName: 'St Philippe',
    status: 'generated',
  },
  
  // Document 5: Calendrier 2026
  {
    id: 'doc_005',
    typeId: 'calendrier',
    profileTarget: 'club',
    clubId: 'as-strasbourg',
    clubName: 'AS Strasbourg',
    ligne2: 'Calendrier',
    ligne3: 'Calendrier 2026 - 13 pages',
    date: '2026-01-01',
    createdAt: '2025-12-15T00:00:00Z',
    assets: [
      {
        id: 'asset_005_affiche',
        docId: 'doc_005',
        format: 'affiche',
        filename: '5_2026_calendrier_AS-Strasbourg_affiche.png',
        width: 2480,
        height: 3508,
        generated: true,
      },
    ],
    isSponsored: false,
    sponsorPrice: 0,
    status: 'generated',
  },
  
  // Document 6: Accessoires - Sacs en coton
  {
    id: 'doc_006',
    typeId: 'accessoires',
    profileTarget: 'club',
    clubId: 'as-strasbourg',
    clubName: 'AS Strasbourg',
    ligne2: 'Accessoires',
    ligne3: 'Sacs en coton',
    date: '2025-12-10',
    createdAt: '2025-12-10T00:00:00Z',
    assets: [
      {
        id: 'asset_006_fb',
        docId: 'doc_006',
        format: 'publication-facebook',
        filename: '6_10-12-2025_accessoires_AS-Strasbourg_publication-facebook.png',
        width: 1200,
        height: 630,
        generated: true,
      },
    ],
    isSponsored: false,
    sponsorPrice: 0,
    status: 'generated',
  },
];

// ============================================
// SERVICE DE DONNÉES
// ============================================
export class DocumentDataService {
  
  // Obtenir toutes les définitions de types de documents
  static getDocTypeDefinitions(): DocTypeDefinition[] {
    return DOC_TYPE_DEFINITIONS;
  }
  
  // Obtenir une définition de type par ID
  static getDocTypeById(typeId: DocType): DocTypeDefinition | undefined {
    return DOC_TYPE_DEFINITIONS.find(t => t.id === typeId);
  }
  
  // Obtenir tous les documents générés
  static getAllGeneratedDocs(): GeneratedDoc[] {
    return GENERATED_DOCS_DATA;
  }
  
  // Obtenir les documents par profil cible
  static getDocsByProfile(profileTarget: ProfileTarget): GeneratedDoc[] {
    return GENERATED_DOCS_DATA.filter(d => d.profileTarget === profileTarget);
  }
  
  // Obtenir les documents par type
  static getDocsByType(typeId: DocType): GeneratedDoc[] {
    return GENERATED_DOCS_DATA.filter(d => d.typeId === typeId);
  }
  
  // Obtenir les documents sponsorisés
  static getSponsoredDocs(): GeneratedDoc[] {
    return GENERATED_DOCS_DATA.filter(d => d.isSponsored);
  }
  
  // Obtenir un document par ID
  static getDocById(docId: string): GeneratedDoc | undefined {
    return GENERATED_DOCS_DATA.find(d => d.id === docId);
  }
  
  // Obtenir les assets d'un document
  static getDocAssets(docId: string): DocAsset[] {
    const doc = this.getDocById(docId);
    return doc?.assets || [];
  }
  
  // Obtenir un asset spécifique par format
  static getDocAssetByFormat(docId: string, format: DocFormat): DocAsset | undefined {
    const assets = this.getDocAssets(docId);
    return assets.find(a => a.format === format);
  }
  
  // Obtenir le prix de sponsoring d'un document
  static getSponsoringPrice(docId: string): number {
    const doc = this.getDocById(docId);
    if (!doc) return 0;
    return doc.sponsorPrice;
  }
  
  // Vérifier si un document est sponsorisable
  static isSponsored(docId: string): boolean {
    const doc = this.getDocById(docId);
    return doc?.isSponsored || false;
  }
  
  // Convertir un GeneratedDoc vers le format Document legacy
  static toLegacyDocument(doc: GeneratedDoc): any {
    const typeDef = this.getDocTypeById(doc.typeId);
    const mainAsset = doc.assets[0];
    
    return {
      id: doc.id,
      profileId: doc.profileTarget,
      themeId: doc.typeId,
      subthemeId: doc.typeId,
      title: doc.ligne2,
      typeLabel: typeDef?.label || doc.ligne2,
      date: doc.date,
      channel: mainAsset?.format || 'publication-facebook',
      teamLabel: doc.teamName || doc.clubName,
      competitionLabel: doc.ligne3,
      matchdayLabel: '',
      previewImage: mainAsset?.filename || '',
      status: doc.status,
      isSponsored: doc.isSponsored,
      // Nouvelles lignes pour le DocShowcase
      ligne2: typeDef?.label || doc.ligne2,
      ligne3: doc.ligne3,
      ligne4: doc.teamName || doc.clubName,
    };
  }
  
  // Convertir tous les documents vers le format legacy
  static getAllLegacyDocuments(): any[] {
    return GENERATED_DOCS_DATA.map(doc => this.toLegacyDocument(doc));
  }
  
  // Obtenir les documents pour le dashboard "Mes docs du jour"
  static getDocsForDashboard(limit: number = 6): GeneratedDoc[] {
    // Trier par date décroissante et limiter
    return [...GENERATED_DOCS_DATA]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
  
  // Obtenir le label d'un format
  static getFormatLabel(format: DocFormat): string {
    const labels: Record<DocFormat, string> = {
      'publication-facebook': 'Publication Facebook',
      'story': 'Story',
      'video-hd': 'Vidéo HD',
      'affiche': 'Affiche',
      'flyer': 'Flyer',
      'newsletter': 'Newsletter',
      'banniere': 'Bannière',
      'mockup': 'Mockup',
    };
    return labels[format] || format;
  }
  
  // Obtenir les dimensions d'un format
  static getFormatDimensions(format: DocFormat): { width: number; height: number } {
    const dimensions: Record<DocFormat, { width: number; height: number }> = {
      'publication-facebook': { width: 1200, height: 630 },
      'story': { width: 1080, height: 1920 },
      'video-hd': { width: 1920, height: 1080 },
      'affiche': { width: 2480, height: 3508 },  // A4 300dpi
      'flyer': { width: 1240, height: 1754 },    // A5 300dpi
      'newsletter': { width: 600, height: 800 },
      'banniere': { width: 1200, height: 300 },
      'mockup': { width: 1200, height: 900 },
    };
    return dimensions[format] || { width: 1200, height: 630 };
  }
}

export default DocumentDataService;
