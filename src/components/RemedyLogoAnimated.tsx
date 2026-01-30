import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import RemedyLogoIcon from './RemedyLogoIcon';
import { ONBOARDING_COLORS, SPRINGS, DURATIONS } from '../constants/onboardingTheme';

interface RemedyLogoAnimatedProps {
  size?: number;
  color?: string;
  animated?: boolean;
  delay?: number;
}

const RemedyLogoAnimated: React.FC<RemedyLogoAnimatedProps> = ({
  size = 80,
  color = ONBOARDING_COLORS.primary,
  animated = true,
  delay = 0,
}) => {
  const scale = useSharedValue(animated ? 0.8 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      // Staggered entrance animation (Superhuman style)
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: DURATIONS.slow, easing: Easing.out(Easing.ease) })
      );
      
      scale.value = withDelay(
        delay + 100,
        withSpring(1, {
          ...SPRINGS.bouncy,
          overshootClamping: false,
        })
      );
    }
  }, [animated, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <RemedyLogoIcon size={size} color={color} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RemedyLogoAnimated;