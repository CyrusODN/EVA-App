import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
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
import { signup, ssoRequest } from '../../services/authService';
import { customToast } from '../../utils/toastMessage';

const SignUp = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      customToast('error', t('common.error'), 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      customToast('error', t('common.error'), 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup({ email, password });
      customToast(
        'success',
        t('common.success'),
        'Account created. Please verify your email',
      );
      navigation.navigate('login');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to sign up. Please try again';
      customToast('error', t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const resp = await ssoRequest({ provider: 'google', email });
      const reqId =
        resp?.data?.requestId || resp?.data?.data?.requestId || resp?.data?.id;
      if (reqId) {
        navigation.navigate('otpVerification', {
          context: 'sso',
          requestId: String(reqId),
          email,
          nextRoute: 'tabs',
        });
      } else {
        customToast(
          'error',
          t('common.error'),
          'Failed to initiate Google sign up',
        );
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to initiate Google sign up';
      customToast('error', t('common.error'), message);
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
            keyboardDismissMode="on-drag"
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
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
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
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Input
                  ref={passwordRef}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  setValue={setPassword}
                  isPassword={true}
                  backgroundColor="#FAFAFA"
                  borderColor="transparent"
                  borderRadius={14}
                  width="100%"
                  height={hp(6.2)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={t('login.passwordPlaceholder')}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Input
                  ref={confirmPasswordRef}
                  placeholder={t('login.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  setValue={setConfirmPassword}
                  isPassword={true}
                  backgroundColor="#FAFAFA"
                  borderColor="transparent"
                  borderRadius={14}
                  width="100%"
                  height={hp(6.2)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={t('login.confirmPasswordPlaceholder')}
                  returnKeyType="go"
                  onSubmitEditing={handleSignUp}
                />
              </View>

              {/* Sign Up Button */}
              <View style={styles.primaryButtonWrapper}>
                <PrimaryButton
                  text={t('login.signUp')}
                  onPress={handleSignUp}
                  loading={loading}
                  disabled={loading}
                  width="100%"
                  borderRadius={16}
                  backgroundColor="#46B7C6"
                  useGradient={false}
                  accessibilityLabel={t('login.signUp')}
                />
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpSection}>
                <Text variant="bodyMedium" style={styles.noAccountText}>
                  {t('login.alreadyHaveAccount')}{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('login')}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text variant="bodyMedium" style={styles.signUpText}>
                    {t('login.signIn')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('login.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In - Apple Style */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignUp}
                disabled={loading}
                activeOpacity={0.7}>
                <Image source={images.googleIcon} style={styles.googleIcon} />
                <Text variant="labelLarge" style={styles.googleButtonText}>
                  {t('login.signUpWithGoogle')}
                </Text>
              </TouchableOpacity>
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
  noAccountText: {
    fontSize: 15,
    color: '#86868b',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  signUpText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(3),
    opacity: 0.6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#86868b',
    fontSize: 13,
    fontWeight: '500',
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    height: hp(6.5),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: wp(2.5),
  },
  googleButtonText: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
    letterSpacing: -0.3,
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

export default SignUp;
