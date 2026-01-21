import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
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
import { VisitType } from '../../../store/onboarding';

interface VisitTypeStepProps {
  selectedVisitType: VisitType;
  onSelect: (type: VisitType) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const VISIT_TYPES: Array<{
  id: VisitType;
  iconName: 'clipboard-list' | 'refresh-cw';
  titleKey: string;
}> = [
  {
    id: 'First Visit',
    iconName: 'clipboard-list',
    titleKey: 'onboarding.visitType.firstVisit',
  },
  {
    id: 'Follow-up',
    iconName: 'refresh-cw',
    titleKey: 'onboarding.visitType.followUp',
  },
];

const VisitTypeStep: React.FC<VisitTypeStepProps> = ({
  selectedVisitType,
  onSelect,
  onContinue,
  onBack,
  onSkip,
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();

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
          {t('onboarding.visitType.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text 
          entering={FadeInDown.delay(150).duration(DURATIONS.normal)}
          style={styles.subtitle}
        >
          {t('onboarding.visitType.subtitle')}
        </Animated.Text>

        {/* Visit Type Cards */}
        <View style={styles.cardsContainer}>
          {VISIT_TYPES.map((type, index) => (
            <Animated.View
              key={type.id}
              entering={FadeInDown.delay(200 + index * 50).duration(DURATIONS.normal)}
              style={styles.cardWrapper}
            >
              <SelectionCard
                iconName={type.iconName}
                title={t(type.titleKey)}
                isSelected={selectedVisitType === type.id}
                onSelect={() => onSelect(type.id)}
                testID={`visit-type-${type.id}`}
              />
            </Animated.View>
          ))}
        </View>

        {/* Hint */}
        <Animated.View 
          entering={FadeIn.delay(350).duration(DURATIONS.normal)}
          style={styles.hintContainer}
        >
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>
            {t('onboarding.visitType.hint')}
          </Text>
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
    flexGrow: 1,
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
    borderRadius: ONBOARDING_RADIUS.md,
    padding: ONBOARDING_SPACING.md,
    marginTop: ONBOARDING_SPACING.lg,
  },
  hintIcon: {
    fontSize: 16,
    marginRight: ONBOARDING_SPACING.xs,
  },
  hintText: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textSecondary,
    flex: 1,
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

export default VisitTypeStep;
