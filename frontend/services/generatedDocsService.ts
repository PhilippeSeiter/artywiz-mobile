import { GeneratedDocument } from '../components/GeneratedDocCard';

// Mock data for generated documents (documents that are ready to be published)
export const generatedDocuments: GeneratedDocument[] = [
  {
    id: 'gen_001',
    title: 'FC ARTYWIZ vs AS ST NICOLAS',
    typeLabel: 'Publication Facebook',
    date: '2025-12-03',
    previewImage: 'generated_1.png',
    isSponsored: false,
    channel: 'Facebook',
  },
  {
    id: 'gen_002',
    title: 'U18 Molsheim - Match du week-end',
    typeLabel: 'Publication Facebook',
    date: '2025-12-02',
    previewImage: 'generated_2.png',
    isSponsored: true,
    sponsorPrice: 15,
    channel: 'Facebook',
  },
  {
    id: 'gen_003',
    title: 'Annonce match Senior',
    typeLabel: 'Publication Facebook',
    date: '2025-12-01',
    previewImage: 'generated_3.png',
    isSponsored: false,
    channel: 'Facebook',
  },
  {
    id: 'gen_004',
    title: 'FC ARTYWIZ - Derby régional',
    typeLabel: 'Publication Facebook',
    date: '2025-11-30',
    previewImage: 'generated_4.png',
    isSponsored: true,
    sponsorPrice: 25,
    channel: 'Facebook',
  },
  {
    id: 'gen_005',
    title: 'Match championship U20',
    typeLabel: 'Publication Facebook',
    date: '2025-11-29',
    previewImage: 'generated_5.png',
    isSponsored: false,
    channel: 'Facebook',
  },
  {
    id: 'gen_006',
    title: 'Résultat Senior - Victoire !',
    typeLabel: 'Post Résultat',
    date: '2025-11-28',
    previewImage: 'generated_6.png',
    isSponsored: true,
    sponsorPrice: 10,
    channel: 'Facebook',
  },
  {
    id: 'gen_007',
    title: 'Résultats U18 - Week-end',
    typeLabel: 'Post Résultat',
    date: '2025-11-27',
    previewImage: 'generated_7.png',
    isSponsored: false,
    channel: 'Facebook',
  },
  {
    id: 'gen_008',
    title: 'Matchs du week-end - Story',
    typeLabel: 'Story Instagram',
    date: '2025-11-26',
    previewImage: 'generated_8.png',
    isSponsored: true,
    sponsorPrice: 20,
    channel: 'Instagram',
  },
];

export class GeneratedDocsService {
  static getAllGeneratedDocs(): GeneratedDocument[] {
    return [...generatedDocuments].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  static getGeneratedDocById(id: string): GeneratedDocument | undefined {
    return generatedDocuments.find(doc => doc.id === id);
  }

  static getSponsoredDocs(): GeneratedDocument[] {
    return generatedDocuments.filter(doc => doc.isSponsored);
  }

  static getPreviewSource(previewImage: string): any {
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
    return imageMap[previewImage] || imageMap['generated_1.png'];
  }
}
