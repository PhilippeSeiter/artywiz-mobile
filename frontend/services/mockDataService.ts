import mockDataJson from '../assets/mock_data.json';
import { Document, Theme, Profile, Notification, MockData, FilterState } from '../types';
import { DocumentDataService } from './documentDataService';
import { GeneratedDoc, DocType } from '../types/documents';

const mockData = mockDataJson as MockData;

// New mockups mapping for dashboard "Mes docs du jour"
// Mapping par type de document
const docMockupsMap: Record<string, any> = {
  'match_poster_01': require('../assets/docs_mockups/match_poster_01.png'),
  'match_poster_02': require('../assets/docs_mockups/match_poster_02.png'),
  'match_list_01': require('../assets/docs_mockups/match_list_01.png'),
  'match_list_02': require('../assets/docs_mockups/match_list_02.png'),
  'result_poster_01': require('../assets/docs_mockups/result_poster_01.png'),
  'result_poster_02': require('../assets/docs_mockups/result_poster_02.png'),
  'result_list_01': require('../assets/docs_mockups/result_list_01.png'),
  'result_list_02': require('../assets/docs_mockups/result_list_02.png'),
  'campaign_arbitrage_01': require('../assets/docs_mockups/campaign_arbitrage_01.png'),
  'campaign_calendars_01': require('../assets/docs_mockups/campaign_calendars_01.png'),
};

// Mapping des mockups par type de document (basé sur Excel)
const docTypeMockupsMap: Record<DocType, string[]> = {
  'annoncer-match': ['match_poster_01', 'match_poster_02'],
  'resultat': ['result_poster_01', 'result_poster_02'],
  'liste-matchs': ['match_list_01', 'match_list_02'],
  'ephemeride': ['campaign_arbitrage_01'],
  'calendrier': ['campaign_calendars_01'],
  'accessoires': ['result_list_01'],
};

// Generated previews for "Publier" section (vignettes)
const generatedPreviewsMap: Record<string, any> = {
  'preview_1': require('../assets/generated_previews/annoncer-un-match-publication-facebook-558351.png'),
  'preview_2': require('../assets/generated_previews/annoncer-un-match-publication-facebook-559192.png'),
  'preview_3': require('../assets/generated_previews/annoncer-un-match-publication-facebook-577815.png'),
  'preview_4': require('../assets/generated_previews/annoncer-un-match-publication-facebook-620787.png'),
  'preview_5': require('../assets/generated_previews/Annoncer un match Publication Facebook -79488.png'),
  'preview_6': require('../assets/generated_previews/Facebook post - resultat 6.png'),
  'preview_7': require('../assets/generated_previews/Facebook post - resultat 8.png'),
  'preview_8': require('../assets/generated_previews/liste-de-matchs-story-620740 (1).png'),
};

// Available mockup keys
const docMockupKeys = Object.keys(docMockupsMap);
const generatedPreviewKeys = Object.keys(generatedPreviewsMap);

// Sponsoring prices array for variation
const sponsoringPrices = [10, 15, 20, 25, 30, 35, 40, 50];

export class MockDataService {
  static getAllThemes(): Theme[] {
    return mockData.themes;
  }

  static getAllProfiles(): Profile[] {
    return mockData.profiles;
  }

  static getAllDocuments(): Document[] {
    // Sort by date descending
    return [...mockData.documents].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Get mockup for dashboard "Mes docs du jour"
  // Utilise le nouveau système basé sur l'Excel
  static getDocMockup(docId: string): any {
    // Essayer d'abord avec le nouveau système DocumentDataService
    const generatedDoc = DocumentDataService.getDocById(docId);
    if (generatedDoc) {
      const typeKeys = docTypeMockupsMap[generatedDoc.typeId];
      if (typeKeys && typeKeys.length > 0) {
        const index = parseInt(docId.replace(/\D/g, ''), 10) || 0;
        const key = typeKeys[index % typeKeys.length];
        return docMockupsMap[key];
      }
    }
    
    // Fallback sur l'ancien système
    const index = parseInt(docId.replace(/\D/g, ''), 10) || 0;
    const key = docMockupKeys[index % docMockupKeys.length];
    return docMockupsMap[key];
  }

  // Get generated preview for "Publier" section
  static getGeneratedPreview(docId: string): any {
    const index = parseInt(docId.replace(/\D/g, ''), 10) || 0;
    const key = generatedPreviewKeys[index % generatedPreviewKeys.length];
    return generatedPreviewsMap[key];
  }

  // Get sponsoring price (varied based on doc)
  // Utilise le nouveau système basé sur l'Excel
  static getSponsoringPrice(docId: string): number {
    // Essayer d'abord avec le nouveau système
    const price = DocumentDataService.getSponsoringPrice(docId);
    if (price > 0) return price;
    
    // Fallback
    const index = parseInt(docId.replace(/\D/g, ''), 10) || 0;
    return sponsoringPrices[index % sponsoringPrices.length];
  }

  // Legacy function - keep for compatibility
  static getPreviewImage(docId: string): any {
    return this.getDocMockup(docId);
  }
  
  // ============================================
  // NOUVELLES MÉTHODES BASÉES SUR L'EXCEL
  // ============================================
  
  // Obtenir les documents pour le dashboard depuis le nouveau système
  static getDocsForDashboard(limit: number = 6): any[] {
    const generatedDocs = DocumentDataService.getDocsForDashboard(limit);
    return generatedDocs.map(doc => DocumentDataService.toLegacyDocument(doc));
  }
  
  // Obtenir tous les documents (combine ancien et nouveau système)
  static getAllDocsFromExcel(): any[] {
    return DocumentDataService.getAllLegacyDocuments();
  }
  
  // Obtenir les types de documents disponibles
  static getDocTypes() {
    return DocumentDataService.getDocTypeDefinitions();
  }
  
  // Vérifier si un document est sponsorisé
  static isDocSponsored(docId: string): boolean {
    return DocumentDataService.isSponsored(docId);
  }

  static getFilteredDocuments(filters: FilterState, searchQuery?: string): Document[] {
    let documents = this.getAllDocuments();

    // Apply theme filter
    if (filters.selectedThemeId && filters.selectedThemeId !== 'all') {
      documents = documents.filter(doc => doc.themeId === filters.selectedThemeId);
    }

    // Apply subtheme filter
    if (filters.selectedSubthemeId && filters.selectedSubthemeId !== 'all') {
      documents = documents.filter(doc => doc.subthemeId === filters.selectedSubthemeId);
    }

    // Apply sponsored filter
    if (filters.showSponsoredOnly) {
      documents = documents.filter(doc => doc.isSponsored);
    }

    // Apply search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.typeLabel.toLowerCase().includes(query)
      );
    }

    return documents;
  }

  static getDocumentById(id: string): Document | undefined {
    return mockData.documents.find(doc => doc.id === id);
  }

  static getAllNotifications(): Notification[] {
    return [...mockData.notifications].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  static getSubthemesByThemeId(themeId: string): { id: string; label: string }[] {
    const theme = mockData.themes.find(t => t.id === themeId);
    return theme ? theme.subthemes : [];
  }

  static getProfileById(profileId: string): Profile | undefined {
    return mockData.profiles.find(p => p.id === profileId);
  }

  static getLogo(): string {
    return mockData.assets.logo;
  }

  static getPlaceholder(): string {
    return mockData.assets.placeholder;
  }
}
