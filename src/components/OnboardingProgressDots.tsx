import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import {
  ONBOARDING_COLORS,
  SPRINGS,
  ONBOARDING_SPACING,
} from '../constants/onboardingTheme';

interface OnboardingProgressDotsProps {
  totalSteps: number;
  currentStep: number;
}

const OnboardingProgressDots: React.FC<OnboardingProgressDotsProps> = ({
  totalSteps,
  currentStep,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <Dot
          key={index}
          isActive={index === currentStep}
          isPast={index < currentStep}
        />
      ))}
    </View>
  );
};

interface DotProps {
  isActive: boolean;
  isPast: boolean;
}

const Dot: React.FC<DotProps> = ({ isActive, isPast }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(isActive ? 1 : 0.75, SPRINGS.snappy);
    const backgroundColor = isActive
      ? ONBOARDING_COLORS.primary
      : isPast
      ? ONBOARDING_COLORS.primary
      : ONBOARDING_COLORS.border;

    return {
      transform: [{ scale }],
      backgroundColor,
      opacity: isPast ? 0.5 : 1,
    };
  }, [isActive, isPast]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ONBOARDING_SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingProgressDots;
