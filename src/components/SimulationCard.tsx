import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ONBOARDING_COLORS,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_RADIUS,
  ONBOARDING_SHADOWS,
  DURATIONS,
} from '../constants/onboardingTheme';
import { useTheme } from '../constants/theme';

interface SimulationCardProps {
  sampleNote: string;
  patientName: string;
}

const SimulationCard: React.FC<SimulationCardProps> = ({
  sampleNote,
  patientName,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? themeColors.layer2
            : ONBOARDING_COLORS.pureWhite,
          borderColor: themeColors.accentPrimary,
          shadowColor: isDark
            ? themeColors.accentPrimary
            : ONBOARDING_SHADOWS.md.shadowColor,
        },
      ]}>
      {/* Header with badge */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? 'rgba(70, 183, 198, 0.1)'
              : ONBOARDING_COLORS.primarySubtle,
          },
        ]}>
        <Text style={[styles.title, { color: themeColors.accentPrimary }]}>
          {t('magicCreator.preview.previewTitle')}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: themeColors.accentPrimary },
          ]}>
          <Text style={[styles.badgeText, { color: '#FFF' }]}>
            {t('magicCreator.preview.simulationWarning')}
          </Text>
        </View>
      </View>

      {/* Patient name */}
      <Text
        style={[
          styles.patientLabel,
          {
            color: themeColors.textSecondary,
            backgroundColor: isDark
              ? 'rgba(70, 183, 198, 0.1)'
              : ONBOARDING_COLORS.primarySubtle,
          },
        ]}>
        {patientName}
      </Text>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: isDark
              ? themeColors.borderSubtle
              : ONBOARDING_COLORS.borderLight,
          },
        ]}
      />

      {/* Note content */}
      <ScrollView
        style={styles.noteScrollView}
        contentContainerStyle={styles.noteContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        <Text style={[styles.noteText, { color: themeColors.textPrimary }]}>
          {sampleNote}
        </Text>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ONBOARDING_COLORS.pureWhite,
    borderRadius: ONBOARDING_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: ONBOARDING_COLORS.primary,
    overflow: 'hidden',
    flex: 1,
    ...ONBOARDING_SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingVertical: ONBOARDING_SPACING.xs,
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
  },
  title: {
    ...ONBOARDING_TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    color: ONBOARDING_COLORS.primary,
  },
  badge: {
    backgroundColor: ONBOARDING_COLORS.primary,
    paddingHorizontal: ONBOARDING_SPACING.xs,
    paddingVertical: 2,
    borderRadius: ONBOARDING_RADIUS.xs,
  },
  badgeText: {
    ...ONBOARDING_TYPOGRAPHY.overline,
    color: ONBOARDING_COLORS.pureWhite,
    fontSize: 9,
    fontWeight: '700',
  },
  patientLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 12,
    color: ONBOARDING_COLORS.textSecondary,
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingBottom: ONBOARDING_SPACING.xs,
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
  },
  divider: {
    height: 1,
    backgroundColor: ONBOARDING_COLORS.borderLight,
  },
  noteScrollView: {
    flex: 1,
  },
  noteContent: {
    padding: ONBOARDING_SPACING.md,
    paddingTop: ONBOARDING_SPACING.sm,
  },
  noteText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    fontSize: 15,
    color: ONBOARDING_COLORS.textPrimary,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});

export default SimulationCard;
