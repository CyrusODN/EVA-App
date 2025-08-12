import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

const userStore = create(
    persist(
      (set) => ({
        loggedInUser: null,
        patientBasicInformation: null,
        token: null,
        isAuthenticated: false,
  
        // Auth actions
        setToken: (payload) => 
          set(() => ({ token: payload, isAuthenticated: !!payload })),
        
        setAuth: (payload) => 
          set(() => ({ 
            loggedInUser: payload, 
            token: payload.token,
            isAuthenticated: true 
          })),
  
        setPatientBasicInformation: (payload) => 
          set(() => ({ patientBasicInformation: payload })),
  
        purgeAuth: () => 
          set(() => ({ 
            loggedInUser: null, 
            token: null, 
            isAuthenticated: false,
            patientBasicInformation: null 
          })),
      }),
      {
        name: "remedy-ai-psychiatrist",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          token: state.token,
          loggedInUser: state.loggedInUser,
          patientBasicInformation: state.patientBasicInformation,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  );
export default userStore;