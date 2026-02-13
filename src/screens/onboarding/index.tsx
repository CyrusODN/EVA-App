import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import WelcomeStep from './steps/WelcomeStep';
import SpecializationStep from './steps/SpecializationStep';
import NoteLengthStep from './steps/NoteLengthStep';
import VisitTypeStep from './steps/VisitTypeStep';
import MagicTemplateIntro from './steps/MagicTemplateIntro';
import CompletionStep from './steps/CompletionStep';
import MagicTemplateCreator from '../../components/MagicTemplateCreator';
import { templateStorage } from '../../utils/templateStorage';

import useOnboardingStore, {
  Specialization,
  NoteLength,
  VisitType,
} from '../../store/onboarding';
import { useOnboardingTheme } from '../../constants/onboardingTheme';

type OnboardingStep =
  | 'welcome'
  | 'specialization'
  | 'noteLength'
  | 'visitType'
  | 'magicIntro'
  | 'completion';

const TOTAL_STEPS = 6;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useOnboardingTheme();
  const {
    defaultSpecialization,
    defaultNoteLength,
    defaultVisitType,
    setDefaultSpecialization,
    setDefaultNoteLength,
    setDefaultVisitType,
    completeOnboarding,
    skipOnboarding,
  } = useOnboardingStore();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [showMagicCreator, setShowMagicCreator] = useState(false);

  // Local state for selections (committed to store on completion)
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<Specialization | null>(defaultSpecialization);
  const [selectedNoteLength, setSelectedNoteLength] =
    useState<NoteLength>(defaultNoteLength);
  const [selectedVisitType, setSelectedVisitType] =
    useState<VisitType>(defaultVisitType);

  const getStepIndex = (step: OnboardingStep): number => {
    const steps: OnboardingStep[] = [
      'welcome',
      'specialization',
      'noteLength',
      'visitType',
      'magicIntro',
      'completion',
    ];
    return steps.indexOf(step);
  };

  const navigateToHome = useCallback(() => {
    // Reset navigation state to go to home
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' as never }],
      }),
    );
  }, [navigation]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Save current selections before skipping
    if (selectedSpecialization) {
      setDefaultSpecialization(selectedSpecialization);
    }
    setDefaultNoteLength(selectedNoteLength);
    setDefaultVisitType(selectedVisitType);

    skipOnboarding();
    navigateToHome();
  }, [
    selectedSpecialization,
    selectedNoteLength,
    selectedVisitType,
    setDefaultSpecialization,
    setDefaultNoteLength,
    setDefaultVisitType,
    skipOnboarding,
    navigateToHome,
  ]);

  const handleComplete = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Commit all selections to store
    if (selectedSpecialization) {
      setDefaultSpecialization(selectedSpecialization);
    }
    setDefaultNoteLength(selectedNoteLength);
    setDefaultVisitType(selectedVisitType);

    completeOnboarding();
    navigateToHome();
  }, [
    selectedSpecialization,
    selectedNoteLength,
    selectedVisitType,
    setDefaultSpecialization,
    setDefaultNoteLength,
    setDefaultVisitType,
    completeOnboarding,
    navigateToHome,
  ]);

  const goToNextStep = (step: OnboardingStep) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setCurrentStep(step);
  };

  const handleSaveTemplate = useCallback(
    async (template: {
      name: string;
      instructions: string;
      refinedPrompt: string;
    }) => {
      try {
        await templateStorage.addTemplate({
          title: template.name,
          content: template.refinedPrompt,
        });
      } catch (error) {
        console.error('Failed to save template from onboarding:', error);
      }
      setShowMagicCreator(false);
      // Continue to completion
      setCurrentStep('completion');
    },
    [],
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeStep
            onContinue={() => goToNextStep('specialization')}
            onSkip={handleSkip}
            currentStep={getStepIndex('welcome')}
            totalSteps={TOTAL_STEPS}
          />
        );

      case 'specialization':
        return (
          <SpecializationStep
            selectedSpecialization={selectedSpecialization}
            onSelect={setSelectedSpecialization}
            onContinue={() => goToNextStep('noteLength')}
            onBack={() => goToNextStep('welcome')}
            onSkip={handleSkip}
            currentStep={getStepIndex('specialization')}
            totalSteps={TOTAL_STEPS}
          />
        );

      case 'noteLength':
        return (
          <NoteLengthStep
            selectedLength={selectedNoteLength}
            onSelect={setSelectedNoteLength}
            onContinue={() => goToNextStep('visitType')}
            onBack={() => goToNextStep('specialization')}
            onSkip={handleSkip}
            currentStep={getStepIndex('noteLength')}
            totalSteps={TOTAL_STEPS}
          />
        );

      case 'visitType':
        return (
          <VisitTypeStep
            selectedVisitType={selectedVisitType}
            onSelect={setSelectedVisitType}
            onContinue={() => goToNextStep('magicIntro')}
            onBack={() => goToNextStep('noteLength')}
            onSkip={handleSkip}
            currentStep={getStepIndex('visitType')}
            totalSteps={TOTAL_STEPS}
          />
        );

      case 'magicIntro':
        return (
          <MagicTemplateIntro
            onCreateTemplate={() => setShowMagicCreator(true)}
            onSkip={() => goToNextStep('completion')}
            onBack={() => goToNextStep('visitType')}
            currentStep={getStepIndex('magicIntro')}
            totalSteps={TOTAL_STEPS}
          />
        );

      case 'completion':
        return <CompletionStep onComplete={handleComplete} />;

      default:
        return null;
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      {renderStep()}

      <MagicTemplateCreator
        visible={showMagicCreator}
        onClose={() => {
          setShowMagicCreator(false);
          // After closing magic creator, continue to completion
          setCurrentStep('completion');
        }}
        onSaveTemplate={handleSaveTemplate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OnboardingScreen;
