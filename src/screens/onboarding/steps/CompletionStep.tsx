import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  useOnboardingTheme,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_SHADOWS,
  ONBOARDING_SHADOWS_DARK,
  ONBOARDING_RADIUS,
  SPRINGS,
  DURATIONS,
} from '../../../constants/onboardingTheme';

interface CompletionStepProps {
  onComplete: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useOnboardingTheme();
  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  useEffect(() => {
    // Success haptic
    if (Platform.OS !== 'web') {
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 300);
    }

    // Staggered entrance animation
    checkOpacity.value = withDelay(
      100,
      withTiming(1, { duration: DURATIONS.normal }),
    );
    checkScale.value = withDelay(
      100,
      withSequence(
        withSpring(1.2, SPRINGS.bouncy),
        withSpring(1, SPRINGS.gentle),
      ),
    );

    titleOpacity.value = withDelay(
      400,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );
    titleTranslateY.value = withDelay(
      400,
      withTiming(0, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );

    subtitleOpacity.value = withDelay(
      500,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );

    buttonOpacity.value = withDelay(
      700,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );
    buttonTranslateY.value = withDelay(
      700,
      withTiming(0, {
        duration: DURATIONS.normal,
        easing: Easing.out(Easing.ease),
      }),
    );
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        {/* Animated checkmark */}
        <Animated.View style={[styles.checkContainer, checkStyle]}>
          <View
            style={[
              styles.checkCircle,
              { backgroundColor: themeColors.primary },
              isDark ? ONBOARDING_SHADOWS_DARK.lg : ONBOARDING_SHADOWS.lg,
            ]}>
            <Text style={[styles.checkIcon, { color: themeColors.pureWhite }]}>
              ✓
            </Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={[
            styles.title,
            titleStyle,
            { color: themeColors.textPrimary },
          ]}>
          {t('onboarding.complete.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            subtitleStyle,
            { color: themeColors.textSecondary },
          ]}>
          {t('onboarding.complete.subtitle')}
        </Animated.Text>
      </View>

      {/* CTA Button */}
      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            { backgroundColor: themeColors.primary },
            isDark ? ONBOARDING_SHADOWS_DARK.glow : ONBOARDING_SHADOWS.glow,
          ]}
          onPress={onComplete}
          activeOpacity={0.9}>
          <Text style={[styles.ctaText, { color: themeColors.pureWhite }]}>
            {t('onboarding.complete.cta')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: ONBOARDING_SPACING.lg,
    paddingTop: ONBOARDING_SPACING.xxl,
    paddingBottom: ONBOARDING_SPACING.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    marginBottom: ONBOARDING_SPACING.xl,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 48,
    fontWeight: '600',
  },
  title: {
    ...ONBOARDING_TYPOGRAPHY.display,
    textAlign: 'center',
  },
  subtitle: {
    ...ONBOARDING_TYPOGRAPHY.body,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
  },
  buttonContainer: {
    paddingHorizontal: ONBOARDING_SPACING.md,
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

export default CompletionStep;
