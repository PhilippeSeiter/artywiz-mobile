export interface Theme {
  id: string;
  label: string;
  subthemes: Subtheme[];
}

export interface Subtheme {
  id: string;
  label: string;
}

export interface Profile {
  id: string;
  type: 'club' | 'team';
  name: string;
  clubId?: string;
}

export interface Document {
  id: string;
  profileId: string;
  themeId: string;
  subthemeId: string;
  title: string;
  typeLabel: string;
  date: string;
  channel: string;
  teamLabel: string;
  competitionLabel: string;
  matchdayLabel: string;
  previewImage: string;
  status: string;
  isSponsored: boolean;
}

export type NotificationType = 'document' | 'sponsoring' | 'validation' | 'info';

export interface Notification {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  docId: string;
  state: 'read' | 'unread';
  type: NotificationType;
  priority: number; // 1 = highest, 4 = lowest
}

export interface MockData {
  app: {
    name: string;
    version: string;
    locale: string;
  };
  profiles: Profile[];
  themes: Theme[];
  documents: Document[];
  notifications: Notification[];
  assets: {
    logo: string;
    placeholder: string;
    note: string;
  };
}

export interface User {
  email: string;
  name: string;
  profileId: string;
}

export interface FilterState {
  selectedThemeId: string | null;
  selectedSubthemeId: string | null;
  showSponsoredOnly: boolean;
}
