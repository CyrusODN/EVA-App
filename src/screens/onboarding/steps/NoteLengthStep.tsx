import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import OnboardingProgressDots from '../../../components/OnboardingProgressDots';
import {
  ONBOARDING_COLORS,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_SHADOWS,
  ONBOARDING_RADIUS,
  SPRINGS,
  DURATIONS,
} from '../../../constants/onboardingTheme';
import { NoteLength } from '../../../store/onboarding';
import { NOTE_EXAMPLES } from '../../../constants/noteLengthExamples';

interface NoteLengthStepProps {
  selectedLength: NoteLength;
  onSelect: (length: NoteLength) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const LENGTH_OPTIONS: Array<{
  id: NoteLength;
  titleKey: string;
  descKey: string;
}> = [
  {
    id: 'Small',
    titleKey: 'onboarding.noteLength.concise',
    descKey: 'onboarding.noteLength.conciseDesc',
  },
  {
    id: 'Medium',
    titleKey: 'onboarding.noteLength.standard',
    descKey: 'onboarding.noteLength.standardDesc',
  },
  {
    id: 'Large',
    titleKey: 'onboarding.noteLength.detailed',
    descKey: 'onboarding.noteLength.detailedDesc',
  },
];

const NoteLengthStep: React.FC<NoteLengthStepProps> = ({
  selectedLength,
  onSelect,
  onContinue,
  onBack,
  onSkip,
  currentStep,
  totalSteps,
}) => {
  const { t, i18n } = useTranslation();
  const [previewKey, setPreviewKey] = useState(0);
  
  const currentLanguage = i18n.language.startsWith('pl') ? 'pl' : 'en';
  const examples = NOTE_EXAMPLES[currentLanguage];
  const currentExample = examples[selectedLength];

  const handleSelect = (length: NoteLength) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSelect(length);
    // Trigger preview animation
    setPreviewKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      {/* Header with Back and Skip */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←  {t('onboarding.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.Text 
          entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
          style={styles.title}
        >
          {t('onboarding.noteLength.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text 
          entering={FadeInDown.delay(150).duration(DURATIONS.normal)}
          style={styles.subtitle}
        >
          {t('onboarding.noteLength.subtitle')}
        </Animated.Text>

        {/* Segmented Control */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(DURATIONS.normal)}
          style={styles.segmentedControl}
        >
          {LENGTH_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.segmentButton,
                selectedLength === option.id && styles.segmentButtonActive,
              ]}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedLength === option.id && styles.segmentButtonTextActive,
              ]}>
                {t(option.titleKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Description of selected option */}
        <Animated.Text 
          key={`desc-${selectedLength}`}
          entering={FadeIn.duration(DURATIONS.fast)}
          style={styles.optionDescription}
        >
          {t(LENGTH_OPTIONS.find(o => o.id === selectedLength)?.descKey || '')}
        </Animated.Text>

        {/* Live Preview Card */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(DURATIONS.normal)}
          style={styles.previewCard}
        >
          <Text style={styles.previewLabel}>{t('onboarding.noteLength.previewTitle')}</Text>
          
          <Animated.View 
            key={`preview-${previewKey}`}
            entering={FadeIn.duration(DURATIONS.normal)}
            layout={Layout.springify()}
            style={styles.previewContent}
          >
            <Text style={styles.previewTitle}>{currentExample.title}</Text>
            <Text style={styles.previewText}>{currentExample.content}</Text>
          </Animated.View>
        </Animated.View>

        {/* Progress dots */}
        <Animated.View 
          entering={FadeIn.delay(400).duration(DURATIONS.normal)}
          style={styles.dotsContainer}
        >
          <OnboardingProgressDots totalSteps={totalSteps} currentStep={currentStep} />
        </Animated.View>
      </ScrollView>

      {/* Continue Button */}
      <Animated.View 
        entering={FadeInDown.delay(500).duration(DURATIONS.normal)}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>{t('onboarding.next')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ONBOARDING_SPACING.lg,
    paddingTop: ONBOARDING_SPACING.xxl + ONBOARDING_SPACING.md,
    paddingBottom: ONBOARDING_SPACING.md,
  },
  backButton: {
    padding: ONBOARDING_SPACING.xs,
  },
  backText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
  },
  skipButton: {
    padding: ONBOARDING_SPACING.xs,
  },
  skipText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textTertiary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ONBOARDING_SPACING.lg,
    paddingBottom: ONBOARDING_SPACING.xl,
  },
  title: {
    ...ONBOARDING_TYPOGRAPHY.headline,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.md,
  },
  subtitle: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.md,
    padding: 4,
    marginTop: ONBOARDING_SPACING.xl,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: ONBOARDING_SPACING.sm,
    borderRadius: ONBOARDING_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: ONBOARDING_COLORS.primary,
    ...ONBOARDING_SHADOWS.sm,
  },
  segmentButtonText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: ONBOARDING_COLORS.pureWhite,
    fontWeight: '600',
  },
  optionDescription: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
  },
  previewCard: {
    backgroundColor: ONBOARDING_COLORS.pureWhite,
    borderRadius: ONBOARDING_RADIUS.lg,
    padding: ONBOARDING_SPACING.md,
    marginTop: ONBOARDING_SPACING.lg,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
    ...ONBOARDING_SHADOWS.sm,
  },
  previewLabel: {
    ...ONBOARDING_TYPOGRAPHY.overline,
    color: ONBOARDING_COLORS.primary,
    marginBottom: ONBOARDING_SPACING.sm,
  },
  previewContent: {
    minHeight: 100,
  },
  previewTitle: {
    ...ONBOARDING_TYPOGRAPHY.title,
    marginBottom: ONBOARDING_SPACING.xs,
  },
  previewText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    lineHeight: 22,
  },
  dotsContainer: {
    marginTop: ONBOARDING_SPACING.xl,
    alignItems: 'center',
  },
  buttonContainer: {
    paddingHorizontal: ONBOARDING_SPACING.lg,
    paddingBottom: ONBOARDING_SPACING.xl,
    paddingTop: ONBOARDING_SPACING.md,
  },
  ctaButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    height: 56,
    borderRadius: ONBOARDING_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...ONBOARDING_SHADOWS.glow,
  },
  ctaText: {
    ...ONBOARDING_TYPOGRAPHY.title,
    color: ONBOARDING_COLORS.pureWhite,
  },
});

export default NoteLengthStep;
