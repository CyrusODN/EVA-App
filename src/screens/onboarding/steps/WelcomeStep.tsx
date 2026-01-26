import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import RemedyLogoAnimated from '../../../components/RemedyLogoAnimated';
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

interface WelcomeStepProps {
  onContinue: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onContinue,
  onSkip,
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();

  // Staggered animation values
  const headlineOpacity = useSharedValue(0);
  const headlineTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animation (Superhuman style)
    const baseDelay = 400;

    // Headline
    headlineOpacity.value = withDelay(
      baseDelay,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );
    headlineTranslateY.value = withDelay(
      baseDelay,
      withTiming(0, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );

    // Subtitle
    subtitleOpacity.value = withDelay(
      baseDelay + 100,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );
    subtitleTranslateY.value = withDelay(
      baseDelay + 100,
      withTiming(0, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );

    // Dots
    dotsOpacity.value = withDelay(
      baseDelay + 200,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );

    // Button
    buttonOpacity.value = withDelay(
      baseDelay + 300,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );
    buttonTranslateY.value = withDelay(
      baseDelay + 300,
      withTiming(0, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );
  }, []);

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {/* Animated Logo */}
        <RemedyLogoAnimated size={100} animated delay={0} />

        {/* Headline */}
        <Animated.Text style={[styles.headline, headlineStyle]}>
          {t('onboarding.welcome.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          {t('onboarding.welcome.subtitle')}
        </Animated.Text>

        {/* Progress dots */}
        <Animated.View style={[styles.dotsContainer, dotsStyle]}>
          <OnboardingProgressDots
            totalSteps={totalSteps}
            currentStep={currentStep}
          />
        </Animated.View>
      </View>

      {/* CTA Button */}
      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onContinue}
          activeOpacity={0.9}>
          <Text style={styles.ctaText}>{t('onboarding.welcome.cta')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
    paddingHorizontal: ONBOARDING_SPACING.lg,
    paddingTop: ONBOARDING_SPACING.xxl,
    paddingBottom: ONBOARDING_SPACING.xl,
  },
  skipButton: {
    position: 'absolute',
    top: ONBOARDING_SPACING.xxl + ONBOARDING_SPACING.md,
    right: ONBOARDING_SPACING.lg,
    zIndex: 10,
    padding: ONBOARDING_SPACING.xs,
  },
  skipText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textTertiary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ONBOARDING_SPACING.md,
  },
  headline: {
    ...ONBOARDING_TYPOGRAPHY.display,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.xl,
  },
  subtitle: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
    lineHeight: 22,
  },
  dotsContainer: {
    marginTop: ONBOARDING_SPACING.xl,
  },
  buttonContainer: {
    paddingHorizontal: ONBOARDING_SPACING.md,
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

export default WelcomeStep;
