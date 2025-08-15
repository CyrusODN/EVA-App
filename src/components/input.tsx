import React, { SetStateAction, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageSourcePropType,
  Platform,
} from 'react-native';
//@ts-ignore
import { Ionicons } from '@react-native-vector-icons/ionicons';
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
  width?: number;
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
}

const Input: React.FC<InputProps> = ({
  placeholder = '',
  textColor = 'black',
  backgroundColor = 'white',
  borderColor = colors.buttonBackground,
  borderRadius = 10,
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
  numberOfLines = 7,
  onFocus = () => {},
  onBlur = () => {},
}) => {
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <View
      style={[
        styles.inputContainer,
        {
          borderColor,
          borderRadius: borderRadius,
          backgroundColor,
          width,
        },
      ]}
    >
      {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

      <TextInput
        inputMode={mode}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholderColor}
        value={value}
        onChangeText={handleChangeText}
        style={[
          styles.input,
          {
            color: textColor,
            borderColor: borderColor,
            paddingLeft: leftIcon ? 45 : 15, // Adjust padding based on icon presence
            paddingRight: isPassword || rightIcon ? 45 : 15,
            height: multiline ? hp(10) : height || hp(6),
            backgroundColor: backgroundColor,
          },
        ]}
        secureTextEntry={isPassword && !showPassword}
        multiline={multiline}
        editable={disable ? false : true}
        onFocus={onFocus}
        onBlur={onBlur}
        // numberOfLines={numberOfLines}
      />

      {(isPassword || rightIcon) && (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={isPassword ? toggleShowPassword : rightIconPress}
          activeOpacity={isPassword ? 0.7 : 1}
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
                style={{
                  width: hp(2),
                  height: hp(2),
                  opacity: value ? 1 : 0.4,
                }}
                source={rightIcon}
              />
            )
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    height: hp(6),
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 14,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    position: 'absolute',
    right: 15,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
