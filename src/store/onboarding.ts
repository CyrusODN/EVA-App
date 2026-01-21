import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NoteLength = 'Small' | 'Medium' | 'Large';
export type VisitType = 'First Visit' | 'Follow-up';
export type Specialization = 'Psychiatry' | 'Child Psychiatry' | 'Surgery' | 'Smart Select';

interface OnboardingState {
    // Preferences
    defaultSpecialization: Specialization | null;
    defaultNoteLength: NoteLength;
    defaultVisitType: VisitType;

    // Onboarding status
    hasCompletedOnboarding: boolean;
    onboardingSkipped: boolean;
    tutorialCompleted: boolean;

    // Current step tracking (for resume capability)
    currentStep: number;

    // Actions
    setDefaultSpecialization: (spec: Specialization) => void;
    setDefaultNoteLength: (length: NoteLength) => void;
    setDefaultVisitType: (type: VisitType) => void;
    setCurrentStep: (step: number) => void;
    completeOnboarding: () => void;
    skipOnboarding: () => void;
    completeTutorial: () => void;
    resetOnboarding: () => void;

    // Computed helpers
    getPreferencesSummary: () => {
        specialization: string;
        noteLength: string;
        visitType: string;
    };
}

const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            // Initial state
            defaultSpecialization: null,
            defaultNoteLength: 'Medium',
            defaultVisitType: 'Follow-up', // Default per user research - most visits are follow-ups
            hasCompletedOnboarding: false,
            onboardingSkipped: false,
            tutorialCompleted: false,
            currentStep: 0,

            // Actions
            setDefaultSpecialization: (spec) => set({ defaultSpecialization: spec }),

            setDefaultNoteLength: (length) => set({ defaultNoteLength: length }),

            setDefaultVisitType: (type) => set({ defaultVisitType: type }),

            setCurrentStep: (step) => set({ currentStep: step }),

            completeOnboarding: () => set({
                hasCompletedOnboarding: true,
                onboardingSkipped: false,
            }),

            skipOnboarding: () => set({
                hasCompletedOnboarding: true,
                onboardingSkipped: true,
            }),

            completeTutorial: () => set({ tutorialCompleted: true }),

            resetOnboarding: () => set({
                hasCompletedOnboarding: false,
                onboardingSkipped: false,
                tutorialCompleted: false,
                currentStep: 0,
                // Keep preferences when resetting
            }),

            // Helper to get formatted preferences
            getPreferencesSummary: () => {
                const state = get();
                return {
                    specialization: state.defaultSpecialization || 'Not set',
                    noteLength: state.defaultNoteLength,
                    visitType: state.defaultVisitType,
                };
            },
        }),
        {
            name: 'remedy-onboarding',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                defaultSpecialization: state.defaultSpecialization,
                defaultNoteLength: state.defaultNoteLength,
                defaultVisitType: state.defaultVisitType,
                hasCompletedOnboarding: state.hasCompletedOnboarding,
                onboardingSkipped: state.onboardingSkipped,
                tutorialCompleted: state.tutorialCompleted,
                currentStep: state.currentStep,
            }),
        }
    )
);

export default useOnboardingStore;
