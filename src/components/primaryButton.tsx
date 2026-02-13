/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  Platform,
  DimensionValue,
} from 'react-native';
import React from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Text } from 'react-native-paper';
import { colors } from '../constants/colors';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../constants/theme';

interface PrimaryButtonProps {
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  iconSource?: any;
  iconSourceRight?: any;
  iconRight?: boolean;
  iconComponent?: React.ComponentType<any>;
  width?: DimensionValue;
  loaderColor?: string;
  useGradient?: boolean;
  accessibilityLabel?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text = '',
  textColor = 'white',
  backgroundColor = colors.primary,
  borderColor = colors.primary,
  borderRadius = 16,
  onPress,
  loading = false,
  disabled = false,
  iconSource = null,
  iconSourceRight = null,
  iconRight = false,
  iconComponent = null,
  width = wp(90),
  loaderColor = 'white',
  useGradient = false,
  accessibilityLabel,
}) => {
  const { isDark } = useTheme();
  const isDisabled = disabled || loading;

  const IconComponent = iconComponent;

  const buttonContent = (
    <View style={styles.buttonContent}>
      {(iconSource || IconComponent) && !loading && (
        <>
          {iconSource ? (
            <Image
              source={iconSource}
              style={styles.leftIcon}
              resizeMode="contain"
            />
          ) : IconComponent ? (
            <IconComponent
              size={hp(2)}
              color={isDisabled ? colors.onSurfaceDisabled : textColor}
            />
          ) : null}
          {text && <View style={styles.iconSpacing} />}
        </>
      )}

      {loading ? (
        <ActivityIndicator
          color={loaderColor}
          size="small"
          testID="button-loading"
        />
      ) : (
        text && (
          <Text
            variant="labelLarge"
            style={[
              styles.buttonText,
              {
                color: isDisabled ? colors.onSurfaceDisabled : textColor,
              },
            ]}>
            {text}
          </Text>
        )
      )}

      {iconRight && iconSourceRight && !loading ? (
        <>
          <View style={styles.iconSpacing} />
          <Image
            source={iconSourceRight}
            style={styles.rightIcon}
            resizeMode="contain"
          />
        </>
      ) : (iconSource || IconComponent) && !loading ? (
        <View style={styles.iconPlaceholder} />
      ) : null}
    </View>
  );

  const neonShadowStyle: ViewStyle = isDark
    ? {
        shadowColor: '#46B7C6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 8,
      }
    : {};

  const buttonStyle: ViewStyle = {
    borderRadius: borderRadius,
    width: width,
    height: hp(6.5),
    overflow: isDark ? 'visible' : 'hidden', // Allow shadow to glow outside in dark mode
    opacity: isDisabled ? 0.6 : 1,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: disabled ? 0 : 0.25,
    shadowRadius: 16,
    elevation: disabled ? 0 : 8,
    ...neonShadowStyle,
  };

  if (isDark && !isDisabled) {
    // In dark mode, we can use LinearGradient for the "neon" button look if desired,
    // or just the solid background with glow. The tutorial suggests a gradient.
    // "bg-gradient-to-r from-neon-cyan to-remedy-primary"
    return (
      <TouchableOpacity
        onPress={!isDisabled ? onPress : undefined}
        disabled={isDisabled}
        style={buttonStyle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        accessibilityLabel={accessibilityLabel || text}>
        <LinearGradient
          colors={['#46B7C6', '#3D97C5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientBackground,
            {
              borderRadius: borderRadius,
              borderWidth: 0,
            },
          ]}>
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      style={buttonStyle}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={accessibilityLabel || text}>
      <View
        style={[
          styles.solidBackground,
          {
            backgroundColor: isDisabled
              ? colors.surfaceDisabled
              : backgroundColor,
            borderColor: isDisabled ? colors.surfaceDisabled : borderColor,
            borderWidth: 1,
            borderRadius: borderRadius,
          },
        ]}>
        {buttonContent}
      </View>
    </TouchableOpacity>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solidBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 17,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProText-Semibold' : 'SFProText-Semibold',
    letterSpacing: -0.2,
  },
  leftIcon: {
    width: hp(2.5),
    height: hp(2.5),
  },
  rightIcon: {
    width: hp(2.5),
    height: hp(2.5),
  },
  iconSpacing: {
    width: wp(1.5),
  },
  iconPlaceholder: {
    width: hp(2.5),
  },
});
