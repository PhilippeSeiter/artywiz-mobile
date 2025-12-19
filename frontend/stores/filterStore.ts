import { create } from 'zustand';
import { FilterState } from '../types';

interface FilterStoreState extends FilterState {
  setTheme: (themeId: string | null) => void;
  setSubtheme: (subthemeId: string | null) => void;
  toggleSponsored: () => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStoreState>((set) => ({
  selectedThemeId: null,
  selectedSubthemeId: null,
  showSponsoredOnly: false,

  setTheme: (themeId) => set({ selectedThemeId: themeId, selectedSubthemeId: null }),
  
  setSubtheme: (subthemeId) => set({ selectedSubthemeId: subthemeId }),
  
  toggleSponsored: () => set((state) => ({ showSponsoredOnly: !state.showSponsoredOnly })),
  
  resetFilters: () => set({ 
    selectedThemeId: null, 
    selectedSubthemeId: null, 
    showSponsoredOnly: false 
  }),
}));
