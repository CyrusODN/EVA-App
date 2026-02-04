import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import Input from '../../components/input';
import PrimaryButton from '../../components/primaryButton';
import { colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { images } from '../../constants/images';
import { forgetPassword } from '../../services/authService';
import { customToast } from '../../utils/toastMessage';
import { validateInput } from '../../utils/inputValidations';
import { useTheme } from '../../constants/theme';
import useThemeStore from '../../store/themeStore';
import RemedyLogo from '../../components/RemedyLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {Check } from 'lucide-react-native';


const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme();
  const { toggleTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const insets = useSafeAreaInsets();

  const handleResetPassword = async () => {
    if (!email) {
      customToast('error', 'Error', 'Please enter your email');
      return;
    }
    
    // Validate email using the utility
    const emailErrors = validateInput(email, 'email');
    if (emailErrors.length > 0) {
      customToast('error', 'Error', emailErrors[0]);
      return;
    }

    setLoading(true);
    try {
      const resp = await forgetPassword({ email });
      const raw = resp?.data;
      const message =
        raw?.message ||
        raw?.data ||
        'Password reset link sent. Check your email.';
      customToast('success', 'Success', String(message));
      setResetSent(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send reset link';
      customToast('error', 'Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: themeColors.canvas }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={themeColors.canvas} 
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent,{paddingBottom: insets.bottom + hp(2)}]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoWrapper}>
                
                <RemedyLogo width={wp(25.5)} height={wp(25.5)} />
                <View style={styles.productNameContainer}>
                  <Text style={[
                    styles.mioText, 
                    { 
                      color: isDark ? '#FAFAFA' : '#1A202C',
                      textShadowColor: isDark ? 'rgba(70, 183, 198, 0.5)' : 'transparent',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 20
                    }
                  ]}>
                    EVA
                  </Text>
                  <Text style={[styles.mioSubText, { color: themeColors.accentPrimary }]}>
                    {t('login.productSubtitle')}
                  </Text>
                </View>
              </View>

              <View style={styles.textWrapper}>
                <Text variant="displayMedium" style={[styles.welcomeTitle,{color:themeColors.textPrimary}]}>
                  {t('login.resetPassword')}
                </Text>
                <Text variant="bodyLarge" style={[styles.welcomeSubtitle,{color:isDark ? themeColors.textSecondary : '#86868b'}]}>
                  {t('login.resetInstructions')}
                </Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {!resetSent ? (
                <>
                  <View style={styles.inputWrapper}>
                    <Input
                      placeholder={t('login.emailPlaceholder')}
                      value={email}
                      setValue={setEmail}
                      mode="email"
                      backgroundColor={isDark ? themeColors.inputBackground : "#FAFAFA"}
                      borderColor={isDark ? themeColors.inputBorder : "transparent"}
                      textColor={themeColors.textPrimary}
                      placeholderTextColor={isDark ? themeColors.textMuted : undefined}
                      borderRadius={14}
                      width="100%"
                      height={hp(6.2)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel={t('login.emailPlaceholder')}
                    />
                  </View>

                  {/* Send Reset Link Button */}
                  <View style={[styles.primaryButtonWrapper, isDark && { shadowColor: themeColors.shadowColor, shadowOpacity: themeColors.shadowOpacity }]}>
                    <PrimaryButton
                      text={t('login.sendResetLink')}
                      onPress={handleResetPassword}
                      loading={loading}
                      disabled={loading}
                      width="100%"
                      borderRadius={16}
                      backgroundColor={themeColors.accentPrimary}
                      useGradient={false}
                      accessibilityLabel={t('login.sendResetLink')}
                    />
                  </View>
                </>
              ) : (
                // Success State
                <View style={[styles.successContainer, { 
                  backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
                  paddingVertical: hp(4),
                  paddingHorizontal: wp(5),
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)',
                }]}>
                  <View style={[styles.successIcon, { backgroundColor: isDark ? '#4CAF50' : '#4CAF50' }]}>
                    <Check size={hp(5)} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text variant="headlineMedium" style={[styles.successTitle, { color: themeColors.textPrimary }]}>
                    {t('login.resetLinkSent')}
                  </Text>
                  <Text variant="bodyMedium" style={[styles.successSubtitle, { color: isDark ? themeColors.textSecondary : '#86868b' }]}>
                    {t('login.checkEmail')}
                  </Text>
                </View>
              )}

              {/* Back to Login Link */}
              <View style={styles.signUpSection}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('login' as never)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text variant="bodyMedium" style={[styles.signUpText, { color: themeColors.accentPrimary }]}>
                    ← {t('login.backToLogin')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer - Pushed to bottom */}
            <View style={styles.footer}>
              <Text variant="bodySmall" style={[styles.footerText, { color: themeColors.textMuted }]}>
                {t('login.protectedBy')}{' '}
                <Text variant="bodySmall" style={[styles.brandText,{ color: isDark ? themeColors.textSecondary : '#86868b' }]}>
                  Remedy AI
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(8),
    paddingTop: hp(2),
  },

  // Header Section
  headerSection: {
    alignItems: 'center', // Center alignment for premium symmetry
    marginBottom: hp(4),
  },
  logoWrapper: {
    marginTop: hp(4),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  productNameContainer: {
    alignItems: 'center',
    marginBottom: hp(3),

  },
  mioText: {
    fontSize: 40,
    fontWeight: '300', // Light weight
    letterSpacing: 12, // Very wide tracking
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Light' : 'sans-serif-light',
    marginBottom: 2,
  },
  mioSubText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
    opacity: 0.9,
  },
  logo: {
    width: wp(25),
    height: wp(25),
  },
  textWrapper: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
    lineHeight: 40,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#86868b',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    letterSpacing: 0.2,
  },

  // Form Section
  formSection: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: hp(2),
  },

  // Buttons
  primaryButtonWrapper: {
    marginBottom: hp(3),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  signUpText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },

  // Success State
  successContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: hp(3),
  },
  successIcon: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successTitle: {
    color: '#000000',
    marginBottom: hp(1),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  successSubtitle: {
    color: '#86868b',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: hp(4),
  },
  footerText: {
    fontSize: 12,
    color: '#C7C7CC',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    letterSpacing: 0.5,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#86868b',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'absolute',
    top: hp(2),
    right: 0,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ForgotPassword;
