/* eslint-disable react-native/no-inline-styles */
import React, { SetStateAction, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageSourcePropType,
  Platform,
  Animated,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
  placeholder?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  width?: number | string;
  leftIcon?: React.ReactNode;
  rightIcon?: ImageSourcePropType;
  isPassword?: boolean;
  setError?: React.Dispatch<SetStateAction<boolean>>;
  value?: string;
  setValue?: (text: string) => void;
  multiline?: boolean;
  height?: number;
  disable?: boolean;
  rightIconPress?: () => void;
  mode?: 'text' | 'email' | 'numeric' | 'tel' | 'url';
  numberOfLines?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  accessibilityLabel?: string;
}

const Input: React.FC<InputProps> = ({
  placeholder = '',
  textColor = colors.onSurface,
  backgroundColor = colors.inputBackground,
  borderColor = colors.borderColor,
  borderRadius = 12,
  width = wp(90),
  leftIcon = null,
  rightIcon = null,
  isPassword = false,
  setError,
  value = '',
  setValue,
  multiline = false,
  height,
  disable = false,
  rightIconPress,
  mode = 'text',
  numberOfLines = 4,
  onFocus = () => {},
  onBlur = () => {},
  error = false,
  autoCapitalize = 'none',
  autoCorrect = false,
  accessibilityLabel,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const borderWidthAnim = useState(new Animated.Value(1.5))[0];

  const toggleShowPassword = () => {
    setShowPassword(prevState => !prevState);
  };

  const handleChangeText = (text: string) => {
    if (setValue) {
      setValue(text);
    }
    if (setError) {
      setError(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
    Animated.timing(borderWidthAnim, {
      toValue: 2,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
    Animated.timing(borderWidthAnim, {
      toValue: 1.5,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const dynamicBorderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : borderColor;

  const iconPadding = wp(4);
  const inputPaddingLeft = leftIcon ? wp(12) : wp(4);
  const inputPaddingRight = isPassword || rightIcon ? wp(12) : wp(4);

  return (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          borderColor: dynamicBorderColor,
          borderRadius: borderRadius,
          backgroundColor: disable ? colors.surfaceDisabled : backgroundColor,
          width,
          borderWidth: borderWidthAnim,
        },
      ]}
    >
      {leftIcon && (
        <View style={[styles.leftIconContainer, { left: iconPadding }]}>
          {leftIcon}
        </View>
      )}

      <TextInput
        inputMode={mode}
        placeholder={placeholder}
        placeholderTextColor="rgba(74, 69, 78, 0.5)"
        value={value}
        onChangeText={handleChangeText}
        style={[
          styles.input,
          {
            color: disable ? colors.onSurfaceDisabled : textColor,
            paddingLeft: inputPaddingLeft,
            paddingRight: inputPaddingRight,
            height: multiline ? height || hp(12) : height || hp(6.5),
            fontSize: Platform.OS === 'ios' ? 15 : 14,
            // paddingTop: multiline ? hp(1.5) : 0,
          },
        ]}
        secureTextEntry={isPassword && !showPassword}
        multiline={multiline}
        editable={!disable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        numberOfLines={multiline ? numberOfLines : 1}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        accessibilityLabel={accessibilityLabel || placeholder}
        accessibilityState={{ disabled: disable }}
      />

      {(isPassword || rightIcon) && (
        <TouchableOpacity
          style={[styles.rightIconContainer, { right: iconPadding }]}
          onPress={isPassword ? toggleShowPassword : rightIconPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isPassword
              ? showPassword
                ? 'Hide password'
                : 'Show password'
              : 'Action button'
          }
        >
          {isPassword ? (
            showPassword ? (
              <Eye size={20} color={colors.subText} />
            ) : (
              <EyeOff size={20} color={colors.subText} />
            )
          ) : (
            rightIcon && (
              <Image
                resizeMode="contain"
                style={[styles.rightIconImage, { opacity: value ? 1 : 0.4 }]}
                source={rightIcon}
              />
            )
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProText-Regular' : 'SFProText-Regular',
    ...Platform.select({
      ios: {
        paddingVertical: hp(1.5),
      },
      android: {
        paddingVertical: hp(1),
      },
    }),
  },
  leftIconContainer: {
    position: 'absolute',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  rightIconContainer: {
    position: 'absolute',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minWidth: 32,
    paddingHorizontal: 4,
  },
  rightIconImage: {
    width: hp(2.5),
    height: hp(2.5),
  },
});
