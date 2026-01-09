import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
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
import { colors } from '../../constants/colors';
import { Mail, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { images } from '../../constants/images';
import { textStyles } from '../../constants/textStyles';
//@ts-ignore
import CheckBox from 'react-native-check-box';
import { login, setAuthToken, ssoRequest } from '../../services/authService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { customToast } from '../../utils/toastMessage';
import userStore from '../../store/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
 
  
GoogleSignin.configure({
  webClientId: '1032423224242-93453453453453453453453453453453.apps.googleusercontent.com',
});


  const handleLogin = async () => {
    if (!email || !password) {
      customToast('error', 'Error', 'Please enter email and password');
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
        customToast('success', 'Success', 'Logged in successfully');
        navigation.navigate('tabs');
      } else if (payload?.loginToken || payload?.requires2FA) {
        const twoFAUserId =
          payload?.userId ||
          payload?.id ||
          payload?.data?.id ||
          raw?.userId ||
          raw?.id ||
          raw?.data?.id;
        // eslint-disable-next-line no-console
        console.log('2FA required. userId:', twoFAUserId, 'requires2FA:', !!payload?.requires2FA);
        // eslint-disable-next-line no-console
        console.log('2FA payload message:', payload?.message || raw?.message);
        navigation.navigate('otpVerification', {
          context: 'login',
          email,
          password,
          loginToken: payload?.loginToken ? String(payload.loginToken) : undefined,
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
      customToast('error', 'Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      let googleEmail = email;
      try {
        // Dynamically require to avoid build errors if the module isn't installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        } catch (_) {}
        try {
          await GoogleSignin.configure({});
        } catch (_) {}
        try {
          const account = await GoogleSignin.signIn();
          console.log("Google Sign In Account:", account);
          googleEmail = account?.user?.email || googleEmail;
        } catch (_) {}
        try {
          const silent = await GoogleSignin.signInSilently();
          googleEmail = silent?.user?.email || googleEmail;
        } catch (_) {}
        try {
          const current = await GoogleSignin.getCurrentUser();
          googleEmail = current?.user?.email || googleEmail;
        } catch (_) {}
      } catch (_) {}

      if (!googleEmail && email) {
        googleEmail = email;
      }
      if (!googleEmail) {
        customToast('error', t('common.error'), 'Please enter your email or select a Google account');
        setLoading(false);
        return;
      }
      const resp = await ssoRequest({ provider: 'google', email: googleEmail });
      const reqId =
        resp?.data?.requestId ||
        resp?.data?.data?.requestId ||
        resp?.data?.id ||
        resp?.data?.ssoRequestId ||
        resp?.data?.data?.ssoRequestId;
      navigation.navigate('otpVerification', {
        context: 'sso',
        requestId: reqId ? String(reqId) : undefined,
        email: googleEmail,
        nextRoute: 'tabs',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to initiate Google login';
      customToast('error', t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F4F7FF', '#FFFFFF']} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={images.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Input
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  setValue={setEmail}
                  leftIcon={<Mail size={20} color={colors.subText} />}
                  mode="email"
                  backgroundColor={colors.inputBackground}
                  borderColor={colors.borderColor}
                  borderRadius={12}
                  width="100%"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={t('login.emailPlaceholder')}
                />
              </View>
              <View style={styles.inputGroup}>
                <Input
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  setValue={setPassword}
                  leftIcon={<Lock size={20} color={colors.subText} />}
                  isPassword={true}
                  backgroundColor={colors.inputBackground}
                  borderColor={colors.borderColor}
                  borderRadius={12}
                  width="100%"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={t('login.passwordPlaceholder')}
                />
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <View style={styles.checkboxContainer}>
                  <CheckBox
                    style={{
                      marginRight: wp(1),
                    }}
                    onClick={() => {
                      setRememberMe(!rememberMe);
                    }}
                    isChecked={rememberMe}
                    checkedCheckBoxColor={colors.primary}
                    uncheckedCheckBoxColor={colors.primary}
                  />
                  <Text variant="bodyMedium" style={styles.checkboxText}>
                    {t('login.rememberMe')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('forgotPassword')}
                >
                  <Text variant="bodyMedium" style={styles.forgotPasswordText}>
                    {t('login.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <View style={styles.buttonGroup}>
                <PrimaryButton
                  text={t('login.signIn')}
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  width="100%"
                  accessibilityLabel={t('login.signIn')}
                />
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text variant="bodyMedium" style={styles.dividerText}>
                  {t('login.or')}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                >
                  <Image source={images.googleIcon} style={styles.googleIcon} />
                  <Text variant="titleMedium" style={textStyles.titleMedium}>
                    {t('login.signInWithGoogle')}
                  </Text>
                </TouchableOpacity>
              </View>
              

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text variant="bodyMedium" style={styles.noAccountText}>
                  {t('login.noAccount')}{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('signUp')}>
                  <Text variant="bodyMedium" style={styles.signUpText}>
                    {t('login.signUp')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              {t('login.protectedBy')}{' '}
              <Text variant="bodySmall" style={styles.brandText}>
                Remedy AI
              </Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FF',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(5),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: hp(8),
    marginBottom: hp(4),
  },
  logo: {
    width: wp(50),
    height: hp(10),
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: wp(6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  title: {
    color: colors.onSurface,
    marginBottom: hp(1),
  },
  subtitle: {
    color: colors.subText,
    textAlign: 'center',
    lineHeight: hp(2.5),
  },
  inputGroup: {
    marginBottom: hp(2),
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    color: colors.subText,
    marginLeft: wp(2),
  },
  forgotPasswordText: {
    color: colors.primary,
    fontWeight: '500',
  },
  buttonGroup: {
    alignItems: 'center',
    marginBottom: hp(2.5),
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(2.5),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderColor,
  },
  dividerText: {
    color: colors.subText,
    marginHorizontal: wp(4),
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderColor,
    borderRadius: 12,
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(6),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIcon: {
    width: hp(2.5),
    height: hp(2.5),
    marginRight: wp(3),
  },
  googleButtonText: {
    color: colors.subText,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
  },
  noAccountText: {
    color: colors.subText,
  },
  signUpText: {
    color: colors.primary,
    fontWeight: '600',
  },
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
    color: colors.surface,
    fontWeight: 'bold',
  },
  successTitle: {
    color: colors.onSurface,
    marginBottom: hp(1),
  },
  successSubtitle: {
    color: colors.subText,
    textAlign: 'center',
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  backToLoginText: {
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: hp(3),
  },
  footerText: {
    color: colors.subText,
  },
  brandText: {
    fontWeight: '600',
    color: colors.onSurface,
  },
});

export default Login;
