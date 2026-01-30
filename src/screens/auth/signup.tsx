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
import {signup, googleMobileLogin, setAuthToken } from '../../services/authService';
import { customToast } from '../../utils/toastMessage';
import userStore from '../../store/user';
import { useTheme } from '../../constants/theme';
import useThemeStore from '../../store/themeStore';
import RemedyLogo from '../../components/RemedyLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Moon } from 'lucide-react-native';
import LanguageSelector from '../../components/languageSelector';

const SignUp = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { colors: themeColors, isDark } = useTheme();
  const { toggleTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

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
      navigation.replace('login');
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
    setLoading(true);
    try {
      let googleEmail = '';
      let idToken = '';

      try {
        // Dynamically require to avoid build errors if the module isn't installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {
          GoogleSignin,
          statusCodes,
        } = require('@react-native-google-signin/google-signin');

        try {
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
        } catch (_) {}

        try {
          const webClientId = '344164367688-8c5s72053a6c0auatspaklmrvr9291v8.apps.googleusercontent.com'
          await GoogleSignin.configure({
            webClientId,
          });
        } catch (err) {
          console.warn('GoogleSignin configure error:', err);
        }

        try {
      const account = await GoogleSignin.signIn();
          console.log('Google Sign In Account:', account);
          if (account?.idToken) {
            idToken = account.idToken;
            googleEmail = account?.user?.email || account?.data?.user?.email || '';
          } else if (account?.data?.idToken) {
             idToken = account.data.idToken;
             googleEmail = account?.user?.email || account?.data?.user?.email || '';
          }
        } catch (error: any) {
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('User cancelled the login flow');
            setLoading(false);
            return;
          } else if (error.code === statusCodes.IN_PROGRESS) {
            console.log('Sign in is in progress already');
            return;
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            customToast('error', 'Error', 'Play services not available or outdated');
            setLoading(false);
            return;
          } else {
            console.error('Google Sign-In Error:', error);
            throw error; // Rethrow to be caught by outer catch if it's a real error
          }
        }
      } catch (err) {
         // Module not found or other setup error
         console.warn('Google Sign In setup error:', err);
      }

      if (!idToken) {
        // If we didn't get an idToken from Google, stop here.
        setLoading(false);
        customToast('error', 'Error', 'Error Signing In with Google');
        return;
      }

      // New API call using googleMobileLogin
      const loginPayload = {
        idToken,
        email : googleEmail,
        isSignup: true,
      };
      console.log('Google Sign-In caught. Preparing backend payload:', JSON.stringify(loginPayload, null, 2));

      const resp = await googleMobileLogin(loginPayload);
      console.log('Google Mobile Login Status:', resp.status);
      console.log('Google Mobile Login API Response Body:', JSON.stringify(resp.data, null, 2));
      
      const payload = resp?.data?.data || resp?.data;
      const token = payload?.token || payload?.accessToken;

      if (token) {
        setAuthToken(token);
        userStore.getState().setToken(token);
        customToast('success', 'Success', 'Logged in successfully');
        navigation.replace('tabs');
        return;
      }

      const reqId =
        payload?.requestId ||
        payload?.request_id ||
        payload?.ssoRequestId ||
        payload?.sso_request_id ||
        payload?.userId;

      if (reqId) {
         navigation.replace('otpVerification', {
          context: 'sso',
          requestId: reqId ? String(reqId) : undefined,
          email: googleEmail,
          nextRoute: 'tabs',
        });
        return;
      }
      
      // Fallback if no token and no requestId found (unexpected state)
      customToast('error', 'Error', 'Unexpected response from server');

    } catch (error: any) {
      console.error('Google Mobile Login FAILED:', error);
      if (error?.response) {
         console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
         console.error('Error Response Status:', error.response.status);
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to initiate Google login';
        
      if (
        message === 'User not authorized' ||
        message.includes('not whitelisted')
      ) {
         customToast(
          'error',
          'Access Denied',
          'You are not authorized to use this service',
        );
      } else {
         customToast('error', t('common.error'), message);
      }
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent ,{paddingBottom: insets.bottom + hp(2)}]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
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
                  backgroundColor={isDark ? themeColors.inputBackground : "#FAFAFA"}
                  borderColor={isDark ? themeColors.inputBorder : "transparent"}
                  textColor={themeColors.textPrimary}
                  placeholderTextColor={isDark ? themeColors.textMuted : undefined}
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
                  backgroundColor={isDark ? themeColors.inputBackground : "#FAFAFA"}
                  borderColor={isDark ? themeColors.inputBorder : "transparent"}
                  textColor={themeColors.textPrimary}
                  placeholderTextColor={isDark ? themeColors.textMuted : undefined}
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
              <View style={[styles.primaryButtonWrapper, isDark && { shadowColor: themeColors.shadowColor, shadowOpacity: themeColors.shadowOpacity }]}>
                <PrimaryButton
                  text={t('login.signUp')}
                  onPress={handleSignUp}
                  loading={loading}
                  disabled={loading}
                  width="100%"
                  borderRadius={16}
                  backgroundColor={themeColors.accentPrimary}
                  useGradient={false}
                  accessibilityLabel={t('login.signUp')}
                />
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpSection}>
                 <Text variant="bodyMedium" style={[styles.noAccountText, { color: isDark ? themeColors.textSecondary : '#86868b' }]}>
                  {t('login.alreadyHaveAccount')}{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('login')}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text variant="bodyMedium" style={[styles.signUpText, { color: themeColors.accentPrimary }]}>
                    {t('login.signIn')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.orDivider}>

                <View style={[styles.dividerLine, { backgroundColor: isDark ? themeColors.borderSubtle : '#E5E5EA' }]} />
                <Text style={[styles.dividerText, { color: isDark ? themeColors.textMuted : '#86868b' }]}>{t('login.or')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? themeColors.borderSubtle : '#E5E5EA' }]} />
              </View>

              {/* Google Sign In - Apple Style */}
              <TouchableOpacity
                                style={[
                  styles.googleButton,
                  { 
                    backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
                    borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0'
                  }
                ]}
                onPress={handleGoogleSignUp}
                disabled={loading}
                activeOpacity={0.7}>
                <Image source={images.googleIcon} style={styles.googleIcon} />
                <Text variant="labelLarge" style={[styles.googleButtonText, { color: themeColors.textPrimary }]}>
                  {t('login.signUpWithGoogle')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer - Pushed to bottom */}
            <View style={styles.footer}>
              <Text variant="bodySmall" style={[styles.footerText, { color: themeColors.textMuted }]}>
                {t('login.protectedBy')}{' '}
                <Text variant="bodySmall" style={[styles.brandText, { color: isDark ? themeColors.textSecondary : '#86868b' }]}>
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
    alignItems: 'center',
    marginTop: hp(1),
    marginBottom: hp(5),
  },
  logoWrapper: {
    marginTop: hp(2),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
        alignItems: 'center',
  },
  productNameContainer: {
    alignItems: 'center',
    // marginTop: hp(2),
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
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: hp(2),
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

export default SignUp;
