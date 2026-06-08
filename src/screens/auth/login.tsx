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
import LinearGradient from 'react-native-linear-gradient';
import Input from '../../components/input';
import PrimaryButton from '../../components/primaryButton';
import LanguageSelector from '../../components/languageSelector';
import { colors } from '../../constants/colors';
import { Mail, Lock, Check, Sun, Moon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { images } from '../../constants/images';
import { textStyles } from '../../constants/textStyles';
//@ts-ignore
import CheckBox from 'react-native-check-box';
import {
  login,
  setAuthToken,
  googleMobileLogin,
  getAuthContext,
} from '../../services/authService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { customToast } from '../../utils/toastMessage';
import { validateInput } from '../../utils/inputValidations';
import userStore from '../../store/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../constants/theme';
import useThemeStore from '../../store/themeStore';
import RemedyLogo from '../../components/RemedyLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Login = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { colors: themeColors, isDark } = useTheme();
  const { toggleTheme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // GoogleSignin configuration moved to handleGoogleLogin

  const handleLogin = async () => {
    if (!email || !password) {
      customToast('error', 'Error', 'Please enter email and password');
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
      const resp = await login({ email, password });
      const raw = resp?.data;
      const payload = raw?.data || raw;
      const userId =
        payload?.userId ||
        payload?.id ||
        payload?.user?.id ||
        raw?.userId ||
        raw?.id ||
        raw?.user?.id;
      if (userId) {
        // eslint-disable-next-line no-console
        console.log('User ID:', String(userId));
      }
      const token = payload?.token || payload?.accessToken;
      if (token) {
        setAuthToken(token);
        userStore.getState().setToken(token);

        // Persist session for 24h (Standard Login)
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem(
          'auth_session_expires_at',
          String(Date.now() + 24 * 60 * 60 * 1000),
        );
        try {
          const authCtx = await getAuthContext();
          const ctx = authCtx?.data?.data;
          if (ctx) {
            const userObj: any = {
              id: ctx._id || ctx.id || ctx.userId,
              email: ctx.email || '',
              name:
                ctx.fname ||
                ctx.name ||
                (ctx.email ? String(ctx.email).split('@')[0] : ''),
              profilePicture: ctx.profileImage || '',
              role: ctx.role,
              settings: ctx.settings,
              whitelist: ctx.whitelist,
              token: token,
            };
            userStore.getState().setAuth(userObj);
            await AsyncStorage.setItem('auth_user', JSON.stringify(userObj));
          }
        } catch (e) {
          console.log('Failed to fetch auth context', e);
        }

        customToast('success', 'Success', 'Logged in successfully');
        navigation.replace('tabs');
      } else if (payload?.loginToken || payload?.requires2FA) {
        const twoFAUserId =
          payload?.userId ||
          payload?.id ||
          payload?.data?.id ||
          raw?.userId ||
          raw?.id ||
          raw?.data?.id;
        // eslint-disable-next-line no-console
        console.log(
          '2FA required. userId:',
          twoFAUserId,
          'requires2FA:',
          !!payload?.requires2FA,
        );
        // eslint-disable-next-line no-console
        console.log('2FA payload message:', payload?.message || raw?.message);
        navigation.replace('otpVerification', {
          context: 'login',
          email,
          password,
          loginToken: payload?.loginToken
            ? String(payload.loginToken)
            : undefined,
          userId: twoFAUserId ? String(twoFAUserId) : undefined,
          nextRoute: 'tabs',
        });
        try {
          await AsyncStorage.setItem('last_login_email', email);
          await AsyncStorage.setItem('last_login_password', password);
        } catch (_) {}
        const message =
          payload?.message ||
          raw?.message ||
          'Two-factor verification required. Enter the OTP sent to your email';
        customToast('success', 'Success', message);
      } else {
        customToast(
          'error',
          'Error',
          raw?.message || 'Invalid response from server',
        );
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to sign in. Please try again';

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
        customToast('error', 'Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
          const webClientId =
            '260564684390-veuu1bt36i05avrh98i4t6tqoms5ir2e.apps.googleusercontent.com';
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
            googleEmail =
              account?.user?.email || account?.data?.user?.email || '';
          } else if (account?.data?.idToken) {
            idToken = account.data.idToken;
            googleEmail =
              account?.user?.email || account?.data?.user?.email || '';
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
            customToast(
              'error',
              'Error',
              'Play services not available or outdated',
            );
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
        email: googleEmail,
        isSignup: false,
      };
      console.log(
        'Google Sign-In caught. Preparing backend payload:',
        JSON.stringify(loginPayload, null, 2),
      );

      const resp = await googleMobileLogin(loginPayload);
      console.log('Google Mobile Login Status:', resp.status);
      console.log(
        'Google Mobile Login API Response Body:',
        JSON.stringify(resp.data, null, 2),
      );

      const payload = resp?.data?.data || resp?.data;
      const token = payload?.token || payload?.accessToken;

      if (token) {
        setAuthToken(token);
        userStore.getState().setToken(token);

        // Persist session for 24h (Google Login)
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem(
          'auth_session_expires_at',
          String(Date.now() + 24 * 60 * 60 * 1000),
        );

        try {
          const authCtx = await getAuthContext();
          const ctx = authCtx?.data?.data;
          if (ctx) {
            const userObj: any = {
              id: ctx._id || ctx.id || ctx.userId,
              email: ctx.email || '',
              name:
                ctx.fname ||
                ctx.name ||
                (ctx.email ? String(ctx.email).split('@')[0] : ''),
              profilePicture: ctx.profileImage || '',
              role: ctx.role,
              settings: ctx.settings,
              whitelist: ctx.whitelist,
              token: token,
            };
            userStore.getState().setAuth(userObj);
            await AsyncStorage.setItem('auth_user', JSON.stringify(userObj));
          }
        } catch (e) {
          console.log('Failed to fetch auth context', e);
        }

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
        console.error(
          'Error Response Data:',
          JSON.stringify(error.response.data, null, 2),
        );
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
    <View
      style={[styles.mainContainer, { backgroundColor: themeColors.canvas }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.canvas}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.topRightControls}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.themeToggle}
            accessibilityLabel="Toggle theme">
            {isDark ? (
              <Sun size={20} color="#FFD700" strokeWidth={2} />
            ) : (
              <Moon size={20} color="#475569" strokeWidth={2} />
            )}
          </TouchableOpacity>
          <LanguageSelector variant="inline" showLabel={false} />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 30 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoWrapper}>
                <RemedyLogo width={wp(25.5)} height={wp(25.5)} />
                <View style={styles.productNameContainer}>
                  <Text
                    style={[
                      styles.mioText,
                      {
                        color: isDark ? '#FAFAFA' : '#1A202C',
                        textShadowColor: isDark
                          ? 'rgba(70, 183, 198, 0.5)'
                          : 'transparent',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 20,
                      },
                    ]}>
                    EVA
                  </Text>
                  <Text
                    style={[
                      styles.mioSubText,
                      { color: themeColors.accentPrimary },
                    ]}>
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
                  backgroundColor={
                    isDark ? themeColors.inputBackground : '#FAFAFA'
                  }
                  borderColor={isDark ? themeColors.inputBorder : 'transparent'}
                  textColor={themeColors.textPrimary}
                  placeholderTextColor={
                    isDark ? themeColors.textMuted : undefined
                  }
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
                  backgroundColor={
                    isDark ? themeColors.inputBackground : '#FAFAFA'
                  }
                  borderColor={isDark ? themeColors.inputBorder : 'transparent'}
                  textColor={themeColors.textPrimary}
                  placeholderTextColor={
                    isDark ? themeColors.textMuted : undefined
                  }
                  borderRadius={14}
                  width="100%"
                  height={hp(6.2)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={t('login.passwordPlaceholder')}
                  returnKeyType="go"
                  onSubmitEditing={() => handleLogin()}
                />
              </View>

              {/* Options Row */}
              <View style={styles.optionsRow}>
                <View style={styles.checkboxContainer}>
                  <CheckBox
                    style={styles.checkbox}
                    onClick={() => setRememberMe(!rememberMe)}
                    isChecked={rememberMe}
                    checkedCheckBoxColor="#46B7C6"
                    uncheckedCheckBoxColor="#C7C7CC"
                    checkedImage={
                      <View style={styles.checkedBox}>
                        <Check size={12} color="white" />
                      </View>
                    }
                    unCheckedImage={<View style={styles.uncheckedBox} />}
                  />
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.checkboxText,
                      { color: isDark ? themeColors.textSecondary : '#86868b' },
                    ]}>
                    {t('login.rememberMe')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('forgotPassword')}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text variant="bodySmall" style={styles.forgotPasswordText}>
                    {t('login.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <View
                style={[
                  styles.primaryButtonWrapper,
                  isDark && {
                    shadowColor: themeColors.shadowColor,
                    shadowOpacity: themeColors.shadowOpacity,
                  },
                ]}>
                <PrimaryButton
                  text={t('login.signIn')}
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  width="100%"
                  borderRadius={16}
                  backgroundColor={themeColors.accentPrimary}
                  useGradient={false}
                  loaderColor={themeColors.accentPrimary}
                  accessibilityLabel={t('login.signIn')}
                />
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpSection}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.noAccountText,
                    { color: isDark ? themeColors.textSecondary : '#86868b' },
                  ]}>
                  {t('login.noAccount')}{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('signUp')}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.signUpText,
                      { color: themeColors.accentPrimary },
                    ]}>
                    {t('login.signUp')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text
                  style={[
                    styles.dividerText,
                    { color: isDark ? themeColors.textSecondary : '#86868b' },
                  ]}>
                  {t('login.or')}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In - Apple Style */}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  {
                    backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
                    borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                  },
                ]}
                onPress={handleGoogleLogin}
                disabled={loading}
                activeOpacity={0.7}>
                <Image source={images.googleIcon} style={styles.googleIcon} />
                <Text
                  variant="labelLarge"
                  style={[
                    styles.googleButtonText,
                    { color: isDark ? themeColors.textPrimary : '#86868b' },
                  ]}>
                  {t('login.signInWithGoogle')}
                </Text>
              </TouchableOpacity>

              {/* Development Skip Login Button */}
              {/* <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipLogin}
                disabled={loading}
                activeOpacity={0.7}>
                <Text variant="labelLarge" style={styles.skipButtonText}>
                  Skip Login (Development)
                </Text>
              </TouchableOpacity> */}
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
    backgroundColor: '#FFFFFF', // Pure white for Swiss/Apple look
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
    paddingBottom: hp(1), // Bottom padding for safety
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
  },
  mioText: {
    fontSize: 40,
    fontWeight: '300', // Light weight
    letterSpacing: 12, // Very wide tracking
    textTransform: 'uppercase',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Light' : 'sans-serif-light',
    marginBottom: 2,
  },
  mioSubText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
    opacity: 0.9,
  },
  languageSelectorWrapper: {
    marginTop: hp(2),
  },
  logo: {
    width: wp(25),
    height: wp(25), // Square logo looks more modern if icon-based, or adjust if full text
  },
  textWrapper: {
    alignItems: 'center',
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700', // SemiBold/Bold
    color: '#000000', // Deep black
    letterSpacing: -0.8, // Tight Apple-style tracking
    marginBottom: hp(1.5),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
    lineHeight: 40,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#86868b', // Apple gray
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

  // Options
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(1),
    marginBottom: hp(4),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: wp(2),
    transform: [{ scale: 0.9 }], // Slightly smaller checkbox
  },
  customCheckbox: {
    width: 18,
    height: 18,
  },
  checkedBox: {
    width: 18,
    height: 18,
    backgroundColor: '#46B7C6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 4,
  },
  checkboxText: {
    fontSize: 14,
    color: '#86868b',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },

  // Buttons
  primaryButtonWrapper: {
    marginBottom: hp(3),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16, // Premium diffused shadow
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
    marginTop: 'auto', // This pushes the footer to the bottom of the scroll view content
    alignItems: 'center',
    paddingTop: hp(4),
  },
  footerText: {
    fontSize: 12,
    color: '#C7C7CC', // Very subtle gray
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    letterSpacing: 0.5,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#86868b',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },

  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    height: hp(5),
    width: '100%',
    marginTop: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
    letterSpacing: -0.2,
  },
  topRightControls: {
    position: 'absolute',
    top: 10,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 50,
    marginTop: hp(6),
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

export default Login;
