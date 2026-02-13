import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { useTheme } from '../constants/theme';

interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  iconSize?: number;
  iconColor?: string;
  title?: string;
  message?: string;
  subtext?: string;
  style?: any;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  iconSize = 48,
  iconColor,
  title,
  message,
  subtext,
  style,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  // Use theme colors if iconColor is not provided, or handle legacy default
  const effectiveIconColor =
    iconColor || (isDark ? themeColors.textMuted : colors.surfaceDisabled);

  return (
    <View style={[styles.container, style]}>
      {Icon && <Icon size={iconSize} color={effectiveIconColor} />}
      {title && (
        <Text
          variant="headlineSmall"
          style={[
            styles.title,
            { color: isDark ? themeColors.textPrimary : colors.onSurface },
          ]}>
          {title}
        </Text>
      )}
      {message && (
        <Text
          variant="bodyMedium"
          style={[
            styles.message,
            {
              color: isDark
                ? themeColors.textSecondary
                : colors.onSurfaceVariant,
            },
          ]}>
          {message}
        </Text>
      )}
      {subtext && (
        <Text
          variant="bodySmall"
          style={[
            styles.subtext,
            { color: isDark ? themeColors.textMuted : colors.onSurfaceVariant },
          ]}>
          {subtext}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(8),
  },
  title: {
    color: colors.onSurface,
    marginTop: hp(2),
    textAlign: 'center',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  message: {
    color: colors.onSurfaceVariant,
    marginTop: hp(1),
    textAlign: 'center',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  subtext: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.5),
    textAlign: 'center',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
});

export default EmptyState;
