import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useLanguageStore = create((set) => ({
  language: {},
  setLanguage: async (newLanguage) => {
    set((state) => ({
      language: { ...state.language, language: newLanguage },
    }));
    await AsyncStorage.setItem('language', newLanguage);
  },
}));

export default useLanguageStore;
