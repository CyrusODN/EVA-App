import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import React from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Text } from 'react-native-paper';
import { colors } from '../constants/colors';
// import {FontAwesome6} from '@react-native-vector-icons/fontAwesome6';
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
  check?: boolean;
  icon?: boolean;
  iconSource: any;
  iconSourceRight: any;
  iconRight?: boolean;
  width?: number;
  loaderColor?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text = '',
  textColor = 'white',
  backgroundColor = colors.buttonBackground,
  borderColor = colors.buttonBackground,
  borderRadius = 10,
  onPress,
  loading = false,
  disabled = false,
  check = false,
  icon = false,
  iconSource = null,
  iconSourceRight = null,
  iconRight = false,
  width = wp(90),
  loaderColor = 'white',
}) => {
  const commonStyles: ViewStyle = {
    flexDirection: 'row',
    borderRadius: borderRadius,
    width: width,
    borderWidth: 1,
    height: hp(6),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const checkTrueStyles = {
    backgroundColor: backgroundColor,
    borderColor: borderColor,
  };

  const checkFalseStyles = {
    // backgroundColor: disabled ? colors.surfaceDisabled : backgroundColor,
    borderColor: disabled ? colors.surfaceDisabled : backgroundColor,
  };

  return (
    <View style={{}}>
      <TouchableOpacity
        onPress={!disabled ? onPress : undefined}
        disabled={disabled}
        style={[commonStyles, check ? checkTrueStyles : checkFalseStyles]}
      >
         <LinearGradient
          colors={['#4A90B9', '#5BA6B6', '#68BFB3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBackground}
        >
        {icon && (
          <>
            {iconSource ? (
              <Image
                source={iconSource}
                style={{
                  width: hp(2.5),
                  height: hp(2.5),
                  resizeMode: 'contain',
                }}
              />
            ) : (
              // <FontAwesome6 name="video" iconStyle='solid' />
              <></>
            )}

            {text && <View style={{ width: wp(5) }} />}
          </>
        )}
          {!loading ? (
            <Text
              variant="titleMedium"
              style={{
                color: textColor,
                fontSize: hp(2),
              }}
            >
              {text}
            </Text>
          ) : (
            <ActivityIndicator style={{}} color={loaderColor} size={'small'} />
          )}
        {iconRight && (
          <>
            <View style={{ width: wp(2) }} />
            <Image
              source={iconSourceRight}
              style={{ width: hp(2.5), height: hp(2.5) }}
            />
          </>
        )}</LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});
