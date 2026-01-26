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

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      customToast('error', 'Error', 'Please enter your email');
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
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoWrapper}>
                <Image
                  source={images.logo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.textWrapper}>
                <Text variant="displayMedium" style={styles.welcomeTitle}>
                  {t('login.resetPassword')}
                </Text>
                <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
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
                      backgroundColor="#FAFAFA"
                      borderColor="transparent"
                      borderRadius={14}
                      width="100%"
                      height={hp(6.2)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel={t('login.emailPlaceholder')}
                    />
                  </View>

                  {/* Send Reset Link Button */}
                  <View style={styles.primaryButtonWrapper}>
                    <PrimaryButton
                      text={t('login.sendResetLink')}
                      onPress={handleResetPassword}
                      loading={loading}
                      disabled={loading}
                      width="100%"
                      borderRadius={16}
                      backgroundColor="#46B7C6"
                      useGradient={false}
                      accessibilityLabel={t('login.sendResetLink')}
                    />
                  </View>
                </>
              ) : (
                // Success State
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Text variant="displaySmall" style={styles.checkmark}>
                      ✓
                    </Text>
                  </View>
                  <Text variant="headlineMedium" style={styles.successTitle}>
                    {t('login.resetLinkSent')}
                  </Text>
                  <Text variant="bodyMedium" style={styles.successSubtitle}>
                    {t('login.checkEmail')}
                  </Text>
                </View>
              )}

              {/* Back to Login Link */}
              <View style={styles.signUpSection}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('login' as never)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text variant="bodyMedium" style={styles.signUpText}>
                    ← {t('login.backToLogin')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer - Pushed to bottom */}
            <View style={styles.footer}>
              <Text variant="bodySmall" style={styles.footerText}>
                {t('login.protectedBy')}{' '}
                <Text variant="bodySmall" style={styles.brandText}>
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
    paddingBottom: hp(2),
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginTop: hp(4),
    marginBottom: hp(5),
  },
  logoWrapper: {
    marginBottom: hp(3),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: wp(50),
    height: wp(18),
  },
  textWrapper: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.8,
    marginBottom: hp(1.5),
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
    paddingVertical: hp(4),
  },
  successIcon: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(3),
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
});

export default ForgotPassword;
