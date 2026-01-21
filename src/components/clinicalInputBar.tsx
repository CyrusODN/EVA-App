/**
 * ClinicalInputBar Component
 * 
 * Unified iMessage-style input bar for clinical screens (Consult, Pharmacopedia, Discharge).
 * Pattern: Plus button (left) + TextInput (center) + Send button (right, conditional)
 */

import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ArrowUp } from 'lucide-react-native';
import { ClinicalTheme } from '../constants/clinicalTheme';

interface ClinicalInputBarProps {
  // Text input
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  
  // Actions
  onSend: () => void;
  onPlusPress: () => void;
  
  // Customization
  maxLength?: number;
  disabled?: boolean;
  showSend?: boolean; // Override automatic show/hide
}

export const ClinicalInputBar: React.FC<ClinicalInputBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Type a message...',
  onSend,
  onPlusPress,
  maxLength = 1000,
  disabled = false,
  showSend,
}) => {
  const insets = useSafeAreaInsets();
  
  const shouldShowSend = showSend !== undefined ? showSend : value.trim().length > 0;
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.wrapper, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20 }]}>
        <View style={styles.container}>
          {/* Plus Button */}
          <TouchableOpacity
            style={styles.plusButton}
            onPress={onPlusPress}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Plus 
              size={22} 
              color={ClinicalTheme.inputBar.plusButton.icon} 
              strokeWidth={2} 
            />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={ClinicalTheme.inputBar.input.placeholder}
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={maxLength}
            editable={!disabled}
          />

          {/* Send Button - conditional */}
          {shouldShowSend && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={onSend}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <ArrowUp size={18} color={ClinicalTheme.inputBar.sendButton.icon} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: ClinicalTheme.pure,
    borderTopWidth: 1,
    borderTopColor: ClinicalTheme.border.light,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: ClinicalTheme.inputBar.background,
    borderRadius: ClinicalTheme.radius.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.inputBar.border,
    ...ClinicalTheme.shadow.input,
  },
  plusButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: ClinicalTheme.inputBar.plusButton.background,
  },
  input: {
    flex: 1,
    fontSize: ClinicalTheme.typography.sizes.base,
    color: ClinicalTheme.inputBar.input.text,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    fontFamily: ClinicalTheme.typography.family.text,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.inputBar.sendButton.background,
  },
});

export default ClinicalInputBar;
