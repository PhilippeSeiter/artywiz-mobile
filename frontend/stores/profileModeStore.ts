import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileMode = 'community' | 'sponsor' | 'admin';

interface ProfileModeState {
  mode: ProfileMode;
  setMode: (mode: ProfileMode) => void;
}

export const useProfileModeStore = create<ProfileModeState>()(
  persist(
    (set) => ({
      mode: 'community',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'profile-mode-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
