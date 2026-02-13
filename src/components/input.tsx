/* eslint-disable react-native/no-inline-styles */
import React, { SetStateAction, useState, useRef, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageSourcePropType,
  Platform,
  Animated,
  ReturnKeyTypeOptions,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { colors as legacyColors } from '../constants/colors';
import { useTheme } from '../constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
  placeholder?: string;
  placeholderTextColor?: string;
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
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => void;
  blurOnSubmit?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      placeholder = '',
      placeholderTextColor,
      textColor = legacyColors.onSurface,
      backgroundColor = legacyColors.inputBackground,
      borderColor = legacyColors.borderColor,
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
      returnKeyType,
      onSubmitEditing,
      blurOnSubmit,
      style,
      containerStyle,
    },
    ref,
  ) => {
    const { colors: themeColors, isDark } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const borderWidthAnim = useRef(new Animated.Value(1.5)).current;

    const toggleShowPassword = () => {
      setShowPassword((prevState) => !prevState);
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
        toValue: 1.5,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur();
      Animated.timing(borderWidthAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const dynamicBorderColor = error
      ? isDark
        ? themeColors.error
        : legacyColors.error
      : isFocused
      ? isDark
        ? themeColors.accentPrimary
        : legacyColors.primary
      : borderColor === legacyColors.borderColor && isDark
      ? themeColors.inputBorder
      : borderColor;

    const neonGlowStyle: ViewStyle =
      isDark && isFocused
        ? {
            shadowColor: themeColors.accentPrimary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          }
        : {};

    const effectiveBackgroundColor =
      backgroundColor === legacyColors.inputBackground && isDark
        ? themeColors.inputBackground
        : disable
        ? legacyColors.surfaceDisabled
        : backgroundColor;

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
            backgroundColor: effectiveBackgroundColor,
            width: width as any,
            borderWidth: borderWidthAnim as unknown as number,
          },
          neonGlowStyle,
          containerStyle,
        ]}>
        {leftIcon && (
          <View style={[styles.leftIconContainer, { left: iconPadding }]}>
            {leftIcon}
          </View>
        )}

        <TextInput
          ref={ref}
          inputMode={mode}
          placeholder={placeholder}
          placeholderTextColor={
            placeholderTextColor ||
            (isDark ? themeColors.textSecondary : 'rgba(74, 69, 78, 0.5)')
          }
          value={value}
          onChangeText={handleChangeText}
          style={[
            styles.input,
            {
              color: disable
                ? legacyColors.onSurfaceDisabled
                : textColor === legacyColors.onSurface && isDark
                ? themeColors.textPrimary
                : textColor,
              paddingLeft: inputPaddingLeft,
              paddingRight: inputPaddingRight,
              height: multiline ? height || hp(12) : height || hp(6.5),
              fontSize: Platform.OS === 'ios' ? 15 : 14,
              // paddingTop: multiline ? hp(1.5) : 0,
            },
            style,
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
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
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
            }>
            {isPassword ? (
              showPassword ? (
                <Eye
                  size={20}
                  color={
                    isDark ? themeColors.textSecondary : legacyColors.subText
                  }
                />
              ) : (
                <EyeOff
                  size={20}
                  color={
                    isDark ? themeColors.textSecondary : legacyColors.subText
                  }
                />
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
  },
);

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
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProText-Regular' : 'SFProText-Regular',
    fontSize: 16,
    ...Platform.select({
      ios: {
        paddingVertical: hp(2),
      },
      android: {
        paddingVertical: hp(1.5),
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
