import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
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
  useOnboardingTheme,
  ONBOARDING_SHADOWS,
  ONBOARDING_SHADOWS_DARK,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
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
  const { colors: themeColors, isDark } = useOnboardingTheme();
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
    setPreviewKey((prev) => prev + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header with Back and Skip */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backText, { color: themeColors.textSecondary }]}>← {t('onboarding.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={[styles.skipText, { color: themeColors.textTertiary }]}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
          style={[styles.title, { color: themeColors.textPrimary }]}>
          {t('onboarding.noteLength.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(150).duration(DURATIONS.normal)}
          style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {t('onboarding.noteLength.subtitle')}
        </Animated.Text>

        {/* Segmented Control */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(DURATIONS.normal)}
          style={[styles.segmentedControl, { backgroundColor: themeColors.surface }]}>
          {LENGTH_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.segmentButton,
                selectedLength === option.id && {
                  backgroundColor: themeColors.primary,
                  ...(isDark ? ONBOARDING_SHADOWS_DARK.sm : ONBOARDING_SHADOWS.sm),
                },
              ]}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.segmentButtonText,
                  {
                    color: selectedLength === option.id ? themeColors.pureWhite : themeColors.textSecondary,
                    fontWeight: selectedLength === option.id ? '600' : '500',
                  },
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
          style={[styles.optionDescription, { color: themeColors.textSecondary }]}>
          {t(
            LENGTH_OPTIONS.find((o) => o.id === selectedLength)?.descKey || '',
          )}
        </Animated.Text>

        {/* Live Preview Card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(DURATIONS.normal)}
          style={[
            styles.previewCard,
            {
              backgroundColor: isDark ? themeColors.surface : themeColors.pureWhite,
              borderColor: themeColors.borderLight,
            },
            isDark ? ONBOARDING_SHADOWS_DARK.sm : ONBOARDING_SHADOWS.sm,
          ]}>
          <Text style={[styles.previewLabel, { color: themeColors.primary }]}>
            {t('onboarding.noteLength.previewTitle')}
          </Text>

          <Animated.View
            key={`preview-${previewKey}`}
            entering={FadeIn.duration(DURATIONS.normal)}
            layout={Layout.springify()}
            style={styles.previewContent}>
            <Text style={[styles.previewTitle, { color: themeColors.textPrimary }]}>{currentExample.title}</Text>
            <Text style={[styles.previewText, { color: themeColors.textSecondary }]}>{currentExample.content}</Text>
          </Animated.View>
        </Animated.View>

        {/* Progress dots */}
        <Animated.View
          entering={FadeIn.delay(400).duration(DURATIONS.normal)}
          style={styles.dotsContainer}>
          <OnboardingProgressDots
            totalSteps={totalSteps}
            currentStep={currentStep}
          />
        </Animated.View>
      </ScrollView>

      {/* Continue Button */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(DURATIONS.normal)}
        style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            { backgroundColor: themeColors.primary },
            isDark ? ONBOARDING_SHADOWS_DARK.glow : ONBOARDING_SHADOWS.glow,
          ]}
          onPress={onContinue}
          activeOpacity={0.9}>
          <Text style={[styles.ctaText, { color: themeColors.pureWhite }]}>{t('onboarding.next')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  skipButton: {
    padding: ONBOARDING_SPACING.xs,
  },
  skipText: {
    ...ONBOARDING_TYPOGRAPHY.body,
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
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
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
  segmentButtonText: {
    ...ONBOARDING_TYPOGRAPHY.body,
  },
  optionDescription: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
  },
  previewCard: {
    borderRadius: ONBOARDING_RADIUS.lg,
    padding: ONBOARDING_SPACING.md,
    marginTop: ONBOARDING_SPACING.lg,
    borderWidth: 1,
  },
  previewLabel: {
    ...ONBOARDING_TYPOGRAPHY.overline,
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
    height: 56,
    borderRadius: ONBOARDING_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...ONBOARDING_TYPOGRAPHY.title,
  },
});

export default NoteLengthStep;
