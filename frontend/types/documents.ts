/**
 * Types de documents ArtyWiz
 * Basé sur le fichier Excel "Artywiz docs names & infos"
 */

// Types de documents disponibles
export type DocType = 
  | 'annoncer-match'      // Annoncer un match
  | 'resultat'            // Communiquer un résultat
  | 'liste-matchs'        // Liste de matchs / Programme
  | 'ephemeride'          // Éphéméride (jour spécial)
  | 'calendrier'          // Calendrier annuel
  | 'accessoires';        // Accessoires (goodies)

// Formats de sortie disponibles
export type DocFormat = 
  | 'publication-facebook'
  | 'story'
  | 'video-hd'
  | 'affiche'
  | 'flyer'
  | 'newsletter'
  | 'banniere'
  | 'mockup';

// Profils cibles
export type ProfileTarget = 
  | 'seniors-1'
  | 'seniors-2'
  | 'u19'
  | 'u17'
  | 'u15'
  | 'u13'
  | 'u11'
  | 'feminines'
  | 'st-philippe'  // Exemple de sponsor
  | 'club';        // Niveau club (toutes équipes)

// Configuration des formats disponibles par type de document
export interface DocFormatConfig {
  postReel: boolean;
  affiche: boolean;
  flyer: boolean;
  newsletter: boolean;
  video: boolean;
  banniere: boolean;
  mockup: boolean;
}

// Définition d'un type de document
export interface DocTypeDefinition {
  id: DocType;
  label: string;
  description: string;
  formats: DocFormatConfig;
  isSponsored: boolean;
  defaultPrice: number;  // Prix sponsoring par défaut en euros
}

// Document généré (instance)
export interface GeneratedDoc {
  id: string;                    // ID unique
  typeId: DocType;               // Type de document
  profileTarget: ProfileTarget;  // Profil cible
  clubId: string;                // ID du club
  clubName: string;              // Nom du club
  teamId?: string;               // ID de l'équipe (optionnel)
  teamName?: string;             // Nom de l'équipe (optionnel)
  
  // Lignes de texte (comme dans l'Excel)
  ligne1A?: string;              // Catégorie principale
  ligne1B?: string;              // Sous-catégorie
  ligne2: string;                // Titre principal (ex: "Annoncer un match")
  ligne3: string;                // Détail (ex: "Championnat R3 Strasbourg - Paris")
  ligne4?: string;               // Date/info supplémentaire
  
  // Métadonnées
  date: string;                  // Date de l'événement/création (ISO)
  createdAt: string;             // Date de création du doc
  
  // Assets générés par format
  assets: DocAsset[];
  
  // Sponsoring
  isSponsored: boolean;
  sponsorPrice: number;
  sponsorId?: string;
  sponsorName?: string;
  
  // État
  status: 'draft' | 'generated' | 'published' | 'archived';
}

// Asset généré (un format spécifique d'un document)
export interface DocAsset {
  id: string;
  docId: string;
  format: DocFormat;
  filename: string;              // Nom du fichier (convention Excel)
  url?: string;                  // URL de l'image
  localPath?: string;            // Chemin local
  width: number;
  height: number;
  generated: boolean;
  generatedAt?: string;
}

// Configuration de la convention de nommage
// Format: {profil}_{date}_{type-doc}_{équipe}_{format}.png
export interface DocFilenameConfig {
  profile: string;
  date: string;                  // Format: DD-MM-YYYY
  typeDoc: string;
  team: string;
  format: string;
  extension: string;
}

// Helper pour générer un nom de fichier
export function generateDocFilename(config: DocFilenameConfig): string {
  return `${config.profile}_${config.date}_${config.typeDoc}_${config.team}_${config.format}.${config.extension}`;
}

// Helper pour parser un nom de fichier
export function parseDocFilename(filename: string): DocFilenameConfig | null {
  const parts = filename.replace(/\.[^.]+$/, '').split('_');
  if (parts.length < 5) return null;
  
  const extension = filename.split('.').pop() || 'png';
  
  return {
    profile: parts[0],
    date: parts[1],
    typeDoc: parts[2],
    team: parts[3],
    format: parts.slice(4).join('_'),
    extension,
  };
}
