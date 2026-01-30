import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const useThemeStore = create(
  persist<ThemeState>(
    (set) => ({
      theme: 'dark', // Default to dark as per "Atlas" vibe, or 'light' if preferred default
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'remedy-app-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useThemeStore;
