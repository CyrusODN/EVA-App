import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Brain,
  Baby,
  Scissors,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Check,
  LucideIcon,
} from 'lucide-react-native';
import {
  useOnboardingTheme,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_SHADOWS,
  ONBOARDING_SHADOWS_DARK,
  ONBOARDING_RADIUS,
  SPRINGS,
  DURATIONS,
} from '../constants/onboardingTheme';

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  baby: Baby,
  scissors: Scissors,
  sparkles: Sparkles,
  'clipboard-list': ClipboardList,
  'refresh-cw': RefreshCw,
};

interface SelectionCardProps {
  iconName: string;
  title: string;
  subtitle?: string;
  hint?: string;
  isSelected: boolean;
  onSelect: () => void;
  testID?: string;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  iconName,
  title,
  subtitle,
  hint,
  isSelected,
  onSelect,
  testID,
}) => {
  const { colors: themeColors, isDark } = useOnboardingTheme();
  const scale = useSharedValue(1);
  const borderColorProgress = useSharedValue(isSelected ? 1 : 0);
  const checkmarkScale = useSharedValue(isSelected ? 1 : 0);

  const IconComponent = ICON_MAP[iconName] || Sparkles;

  useEffect(() => {
    borderColorProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: DURATIONS.fast,
    });
    checkmarkScale.value = withSpring(isSelected ? 1 : 0, SPRINGS.bouncy);
  }, [isSelected]);

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation sequence (Things 3 style)
    scale.value = withSequence(
      withSpring(0.97, SPRINGS.snappy),
      withSpring(1.02, SPRINGS.bouncy),
      withSpring(1.0, SPRINGS.gentle),
    );

    onSelect();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isSelected
      ? themeColors.primary
      : isDark
      ? themeColors.border
      : themeColors.border,
    backgroundColor: isSelected
      ? themeColors.primarySubtle
      : isDark
      ? themeColors.surface
      : themeColors.pureWhite,
    ...(isDark ? ONBOARDING_SHADOWS_DARK.sm : ONBOARDING_SHADOWS.sm),
    ...(isSelected && isDark ? ONBOARDING_SHADOWS_DARK.glow : {}),
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkScale.value,
  }));

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} testID={testID}>
      <Animated.View style={[styles.container, containerStyle]}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark
                ? themeColors.background
                : themeColors.surface,
            },
          ]}>
          <IconComponent
            size={24}
            color={isSelected ? themeColors.primary : themeColors.textSecondary}
            strokeWidth={2}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
          {hint && (
            <Text style={[styles.hint, { color: themeColors.primary }]}>
              {hint}
            </Text>
          )}
        </View>

        {/* Animated checkmark */}
        <Animated.View style={[styles.checkmarkContainer, checkmarkStyle]}>
          <View
            style={[
              styles.checkmark,
              { backgroundColor: themeColors.primary },
            ]}>
            <Check size={14} color={themeColors.pureWhite} strokeWidth={3} />
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ONBOARDING_SPACING.md,
    borderRadius: ONBOARDING_RADIUS.lg,
    borderWidth: 1,
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: ONBOARDING_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ONBOARDING_SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...ONBOARDING_TYPOGRAPHY.title,
  },
  subtitle: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    marginTop: 2,
  },
  hint: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontStyle: 'italic',
    marginTop: 4,
  },
  checkmarkContainer: {
    position: 'absolute',
    right: ONBOARDING_SPACING.md,
    top: ONBOARDING_SPACING.md,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SelectionCard;
