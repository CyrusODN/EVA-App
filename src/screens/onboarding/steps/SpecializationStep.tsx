import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import SelectionCard from '../../../components/SelectionCard';
import OnboardingProgressDots from '../../../components/OnboardingProgressDots';
import {
  ONBOARDING_COLORS,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_SHADOWS,
  ONBOARDING_RADIUS,
  DURATIONS,
} from '../../../constants/onboardingTheme';
import { Specialization } from '../../../store/onboarding';

interface SpecializationStepProps {
  selectedSpecialization: Specialization | null;
  onSelect: (spec: Specialization) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const SPECIALIZATIONS: Array<{
  id: Specialization;
  iconName: 'brain' | 'baby' | 'scissors' | 'sparkles';
  titleKey: string;
  subtitleKey?: string;
  hintKey?: string;
}> = [
  {
    id: 'Psychiatry',
    iconName: 'brain',
    titleKey: 'onboarding.specialization.psychiatry',
  },
  {
    id: 'Child Psychiatry',
    iconName: 'baby',
    titleKey: 'onboarding.specialization.childPsychiatry',
  },
  {
    id: 'Surgery',
    iconName: 'scissors',
    titleKey: 'onboarding.specialization.surgery',
  },
  {
    id: 'Smart Select',
    iconName: 'sparkles',
    titleKey: 'onboarding.specialization.smartSelect',
    hintKey: 'onboarding.specialization.smartSelectHint',
  },
];

const SpecializationStep: React.FC<SpecializationStepProps> = ({
  selectedSpecialization,
  onSelect,
  onContinue,
  onBack,
  onSkip,
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();

  const canContinue = selectedSpecialization !== null;

  return (
    <View style={styles.container}>
      {/* Header with Back and Skip */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← {t('onboarding.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
          style={styles.title}>
          {t('onboarding.specialization.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(150).duration(DURATIONS.normal)}
          style={styles.subtitle}>
          {t('onboarding.specialization.subtitle')}
        </Animated.Text>

        {/* Specialization Cards */}
        <View style={styles.cardsContainer}>
          {SPECIALIZATIONS.map((spec, index) => (
            <Animated.View
              key={spec.id}
              entering={FadeInDown.delay(200 + index * 50).duration(
                DURATIONS.normal,
              )}
              style={styles.cardWrapper}>
              <SelectionCard
                iconName={spec.iconName}
                title={t(spec.titleKey)}
                hint={spec.hintKey ? t(spec.hintKey) : undefined}
                isSelected={selectedSpecialization === spec.id}
                onSelect={() => onSelect(spec.id)}
                testID={`specialization-${spec.id}`}
              />
            </Animated.View>
          ))}
        </View>

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
          style={[styles.ctaButton, !canContinue && styles.ctaButtonDisabled]}
          onPress={onContinue}
          disabled={!canContinue}
          activeOpacity={0.9}>
          <Text
            style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
            {t('onboarding.next')}
          </Text>
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
  cardsContainer: {
    marginTop: ONBOARDING_SPACING.xl,
    gap: ONBOARDING_SPACING.sm,
  },
  cardWrapper: {
    marginBottom: 0,
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
  ctaButtonDisabled: {
    backgroundColor: ONBOARDING_COLORS.border,
    ...ONBOARDING_SHADOWS.sm,
  },
  ctaText: {
    ...ONBOARDING_TYPOGRAPHY.title,
    color: ONBOARDING_COLORS.pureWhite,
  },
  ctaTextDisabled: {
    color: ONBOARDING_COLORS.textTertiary,
  },
});

export default SpecializationStep;
