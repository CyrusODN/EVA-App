import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Keyboard,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { ArrowUp, Plus } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme';

interface SmartInputBarProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSendText: () => void;
  onPlusPress: () => void;
  placeholder: string;
  insets: EdgeInsets;
  primaryColor: string;
}

const SmartInputBar: React.FC<SmartInputBarProps> = ({
  inputText,
  onChangeText,
  onSendText,
  onPlusPress,
  placeholder,
  insets,
  primaryColor,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Dynamic theme
  const DYNAMIC_THEME = {
    wrapper: isDark ? themeColors.canvas : '#FFFFFF',
    border: isDark ? themeColors.borderSubtle : '#F2F2F7',
    container: isDark ? themeColors.layer2 : '#F3F4F6',
    containerBorder: isDark ? themeColors.borderNormal : '#F3F4F6',
    plusButton: isDark ? themeColors.layer1 : '#FFFFFF',
    text: isDark ? themeColors.textPrimary : '#111827',
    placeholder: isDark ? themeColors.textMuted : colors.onSurfaceVariant,
    iconColor: isDark ? themeColors.textSecondary : colors.onSurfaceVariant,
  };

  return (
    <View
      style={[
        styles.inputWrapper,
        {
          paddingBottom:
            Platform.OS === 'ios' ? (keyboardVisible ? 1 : insets.bottom) : 10,
          backgroundColor: DYNAMIC_THEME.wrapper,
          borderTopColor: DYNAMIC_THEME.border,
        },
      ]}>
      <View
        style={[
          styles.inputBarContainer,
          {
            backgroundColor: DYNAMIC_THEME.container,
            borderColor: DYNAMIC_THEME.containerBorder,
            ...(isDark
              ? {
                  shadowColor: primaryColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                }
              : {}),
          },
        ]}>
        {/* Plus Button */}
        <TouchableOpacity
          style={[
            styles.plusButton,
            { backgroundColor: DYNAMIC_THEME.plusButton },
          ]}
          onPress={onPlusPress}
          activeOpacity={0.7}>
          <Plus size={22} color={DYNAMIC_THEME.iconColor} strokeWidth={2} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={[styles.messageInput, { color: DYNAMIC_THEME.text }]}
          placeholder={placeholder}
          placeholderTextColor={DYNAMIC_THEME.placeholder}
          value={inputText}
          onChangeText={onChangeText}
          multiline
          maxLength={1000}
        />

        {/* Send Button - only visible when there's text */}
        {inputText.trim().length > 0 && (
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: primaryColor }]}
            onPress={onSendText}
            activeOpacity={0.7}>
            <ArrowUp size={18} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SmartInputBar;

const styles = StyleSheet.create({
  inputWrapper: {
    borderTopWidth: 1,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  plusButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
