import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import RemedyLogoIcon from './RemedyLogoIcon';
import {
  ONBOARDING_COLORS,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_SHADOWS,
  ONBOARDING_RADIUS,
  DURATIONS,
} from '../constants/onboardingTheme';
import { useTheme } from '../constants/theme';

const AnimatedRemedyLogo = Animated.createAnimatedComponent(RemedyLogoIcon);

interface VoiceInputButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isRecording,
  onPress,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();
  
  // Pulsing animation
  const innerScale = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      innerScale.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      // Color shifting for recording state
      colorProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Stop animation
      cancelAnimation(innerScale);
      cancelAnimation(colorProgress);
      innerScale.value = withTiming(1, { duration: DURATIONS.fast });
      colorProgress.value = withTiming(0, { duration: DURATIONS.fast });
    }

    return () => {
      cancelAnimation(innerScale);
      cancelAnimation(colorProgress);
    };
  }, [isRecording]);

  const handlePress = () => {
    if (disabled) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => {
    const backgroundColor = isRecording
      ? interpolateColor(
          colorProgress.value,
          [0, 1],
          [themeColors.accentPrimary, '#3A9FAD'] // Darker shade of brand color
        )
      : themeColors.accentPrimary;

    return {
      backgroundColor,
    };
  });

  const neonGlowStyle = isDark ? {
    shadowColor: themeColors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  } : ONBOARDING_SHADOWS.glow;

  return (
    <View style={styles.container}>
      {/* Main button */}
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <Animated.View style={[styles.buttonInner, buttonStyle, innerStyle, neonGlowStyle]}>
          <RemedyLogoIcon size={36} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
      
      {/* Hint text */}
      <Text style={[styles.hint, { color: themeColors.textSecondary }, disabled && styles.hintDisabled]}>
        {isRecording ? t('magicCreator.recording') || 'Recording...' : t('magicCreator.voiceHint')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  buttonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ONBOARDING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ONBOARDING_SHADOWS.glow,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  hint: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textSecondary,
    marginTop: ONBOARDING_SPACING.md,
  },
  hintDisabled: {
    color: ONBOARDING_COLORS.textDisabled,
  },
});

export default VoiceInputButton;