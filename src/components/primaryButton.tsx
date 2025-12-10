import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  Platform,
} from 'react-native';
import React from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Text } from 'react-native-paper';
import { colors } from '../constants/colors';
import LinearGradient from 'react-native-linear-gradient';

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
  width?: number;
  loaderColor?: string;
  useGradient?: boolean;
  accessibilityLabel?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text = '',
  textColor = 'white',
  backgroundColor = colors.primary,
  borderColor = colors.primary,
  borderRadius = 12,
  onPress,
  loading = false,
  disabled = false,
  iconSource = null,
  iconSourceRight = null,
  iconRight = false,
  iconComponent = null,
  width = wp(90),
  loaderColor = 'white',
  useGradient = true,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;
  const gradientColors = disabled
    ? [colors.surfaceDisabled, colors.surfaceDisabled]
    : ['#4A90B9', '#5BA6B6', '#68BFB3'];

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
              {
                color: isDisabled ? colors.onSurfaceDisabled : textColor,
              },
            ]}
          >
            {text}
          </Text>
        )
      )}

      {iconRight && iconSourceRight && !loading && (
        <>
          <View style={styles.iconSpacing} />
          <Image
            source={iconSourceRight}
            style={styles.rightIcon}
            resizeMode="contain"
          />
        </>
      )}
    </View>
  );

  const buttonStyle: ViewStyle = {
    borderRadius: borderRadius,
    width: width,
    height: hp(5),
    overflow: 'hidden',
    opacity: isDisabled ? 0.6 : 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: disabled ? 0 : 0.15,
    shadowRadius: 4,
    elevation: disabled ? 0 : 3,
  };

  return (
    <TouchableOpacity
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      style={buttonStyle}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={accessibilityLabel || text}
    >
      {useGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBackground}
        >
          {buttonContent}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.solidBackground,
            {
              backgroundColor: isDisabled
                ? colors.surfaceDisabled
                : backgroundColor,
              borderColor: isDisabled ? colors.surfaceDisabled : borderColor,
              borderWidth: 1,
            },
          ]}
        >
          {buttonContent}
        </View>
      )}
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
    fontFamily:
      Platform.OS === 'ios' ? 'SFProText-Semibold' : 'SFProText-Semibold',
    letterSpacing: 0.3,
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
    width: wp(3),
  },
});
