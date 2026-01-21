import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Mic, Sparkles, CheckCircle2 } from 'lucide-react-native';
import OnboardingProgressDots from '../../../components/OnboardingProgressDots';
import {
  ONBOARDING_COLORS,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_SHADOWS,
  ONBOARDING_RADIUS,
  DURATIONS,
} from '../../../constants/onboardingTheme';

const { width } = Dimensions.get('window');

interface MagicTemplateIntroProps {
  onCreateTemplate: () => void;
  onSkip: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const MagicTemplateIntro: React.FC<MagicTemplateIntroProps> = ({
  onCreateTemplate,
  onSkip,
  onBack,
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header with Back */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←  {t('onboarding.back')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Magic sparkles icon */}
        <Animated.View 
          entering={FadeIn.delay(100).duration(DURATIONS.slow)}
          style={styles.iconContainer}
        >
          <View style={styles.iconCircle}>
            <Sparkles size={40} color={ONBOARDING_COLORS.primary} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text 
          entering={FadeInDown.delay(200).duration(DURATIONS.normal)}
          style={styles.title}
        >
          {t('onboarding.magicIntro.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text 
          entering={FadeInDown.delay(250).duration(DURATIONS.normal)}
          style={styles.subtitle}
        >
          {t('onboarding.magicIntro.subtitle')}
        </Animated.Text>

        {/* Description */}
        <Animated.Text 
          entering={FadeInDown.delay(300).duration(DURATIONS.normal)}
          style={styles.description}
        >
          {t('onboarding.magicIntro.description')}
        </Animated.Text>

        {/* Description card */}
        <Animated.View 
          entering={FadeInDown.delay(350).duration(DURATIONS.normal)}
          style={styles.descriptionCard}
        >
          <View style={styles.flowStep}>
            <View style={styles.flowStepIcon}>
              <Mic size={20} color={ONBOARDING_COLORS.primary} />
            </View>
            <View style={styles.flowStepText}>
              <Text style={styles.flowStepLabel}>{t('onboarding.magicIntro.step1')}</Text>
            </View>
          </View>
          
          {/* Flow indicator */}
          <View style={styles.flowArrow}>
            <Text style={styles.flowArrowText}>↓</Text>
          </View>
          
          <View style={styles.flowStep}>
            <View style={styles.flowStepIcon}>
              <Sparkles size={20} color={ONBOARDING_COLORS.primary} />
            </View>
            <View style={styles.flowStepText}>
              <Text style={styles.flowStepLabelSmall}>{t('onboarding.magicIntro.step2')}</Text>
            </View>
          </View>
          
          <View style={styles.flowArrow}>
            <Text style={styles.flowArrowText}>↓</Text>
          </View>
          
          <View style={styles.flowStep}>
            <View style={styles.flowStepIconSuccess}>
              <CheckCircle2 size={20} color={ONBOARDING_COLORS.pureWhite} />
            </View>
            <View style={styles.flowStepText}>
              <Text style={styles.flowStepLabelSuccess}>{t('onboarding.magicIntro.step3')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress dots */}
        <Animated.View 
          entering={FadeIn.delay(400).duration(DURATIONS.normal)}
          style={styles.dotsContainer}
        >
          <OnboardingProgressDots totalSteps={totalSteps} currentStep={currentStep} />
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View 
        entering={FadeInUp.delay(500).duration(DURATIONS.normal)}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onCreateTemplate}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>{t('onboarding.magicIntro.createFirst')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.skipTemplateButton}
          onPress={onSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipTemplateText}>{t('onboarding.magicIntro.skipForNow')}</Text>
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
    justifyContent: 'flex-start',
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ONBOARDING_SPACING.lg,
  },
  iconContainer: {
    marginTop: ONBOARDING_SPACING.xl,
    marginBottom: ONBOARDING_SPACING.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...ONBOARDING_TYPOGRAPHY.headline,
    textAlign: 'center',
  },
  subtitle: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
  },
  description: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textTertiary,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.md,
    lineHeight: 20,
    paddingHorizontal: ONBOARDING_SPACING.md,
  },
  descriptionCard: {
    backgroundColor: ONBOARDING_COLORS.pureWhite,
    borderRadius: ONBOARDING_RADIUS.lg,
    padding: ONBOARDING_SPACING.lg,
    marginTop: ONBOARDING_SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
    ...ONBOARDING_SHADOWS.sm,
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ONBOARDING_SPACING.md,
  },
  flowStepIconSuccess: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ONBOARDING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ONBOARDING_SPACING.md,
  },
  flowIcon: {
    fontSize: 18,
  },
  flowStepText: {
    flex: 1,
  },
  flowStepLabel: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textPrimary,
  },
  flowStepLabelSmall: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textSecondary,
    fontStyle: 'italic',
  },
  flowStepLabelSuccess: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.primary,
    fontWeight: '600',
  },
  flowArrow: {
    marginLeft: 16,
    marginVertical: ONBOARDING_SPACING.xs,
  },
  flowArrowText: {
    color: ONBOARDING_COLORS.border,
    fontSize: 12,
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
  skipTemplateButton: {
    marginTop: ONBOARDING_SPACING.md,
    padding: ONBOARDING_SPACING.sm,
    alignItems: 'center',
  },
  skipTemplateText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textTertiary,
  },
});

export default MagicTemplateIntro;
