import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';
import { ClinicalTheme } from '../constants/clinicalTheme';

interface ToastLayoutProps {
  type: 'success' | 'error' | 'info';
  text1?: string;
  text2?: string;
}

const ToastLayout: React.FC<ToastLayoutProps> = ({ type, text1, text2 }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} color={ClinicalTheme.semantic.success} />;
      case 'error':
        return <AlertCircle size={24} color={ClinicalTheme.semantic.error} />;
      case 'info':
        return <Info size={24} color={ClinicalTheme.semantic.info} />;
      default:
        return <Info size={24} color={ClinicalTheme.brand.primary} />;
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'success':
        return ClinicalTheme.semantic.success;
      case 'error':
        return ClinicalTheme.semantic.error;
      case 'info':
        return ClinicalTheme.semantic.info;
      default:
        return ClinicalTheme.brand.primary;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return ClinicalTheme.semantic.successLight;
      case 'error':
        return ClinicalTheme.semantic.errorLight;
      case 'info':
        return ClinicalTheme.semantic.infoLight;
      default:
        return ClinicalTheme.brand.light;
    }
  };

  return (
    <View style={[styles.container, ClinicalTheme.shadow.floating]}>
      <View style={[styles.accentBar, { backgroundColor: getAccentColor() }]} />
      <View style={styles.contentContainer}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getBackgroundColor() },
          ]}>
          {getIcon()}
        </View>
        <View style={styles.textContainer}>
          {text1 ? (
            <Text style={styles.title} numberOfLines={1}>
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text style={styles.message} numberOfLines={2}>
              {text2}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <ToastLayout type="success" text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }) => (
    <ToastLayout type="error" text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }) => (
    <ToastLayout type="info" text1={text1} text2={text2} />
  ),
};

export const customToast = (type: string, text1 = '', text2 = '') => {
  Toast.show({
    type: type, // 'success', 'error', 'info'
    position: 'top',
    text1: text1,
    text2: text2,
    visibilityTime: 4000,
    topOffset: Platform.OS === 'ios' ? 60 : 40,
  });
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: ClinicalTheme.pure, // Clean white background
    borderRadius: ClinicalTheme.radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 60,
    alignSelf: 'center',
    marginVertical: 10,
    // Shadow is applied via style prop from ClinicalTheme
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  },
  accentBar: {
    width: 4,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: ClinicalTheme.typography.sizes.base,
    fontFamily: ClinicalTheme.typography.family.text,
    fontWeight: ClinicalTheme.typography.weights.semibold,
    color: ClinicalTheme.text.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: ClinicalTheme.typography.sizes.sm,
    fontFamily: ClinicalTheme.typography.family.text,
    color: ClinicalTheme.text.secondary,
    lineHeight: 18,
  },
});
