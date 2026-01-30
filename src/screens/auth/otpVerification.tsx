import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import PrimaryButton from '../../components/primaryButton';
import { colors } from '../../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { images } from '../../constants/images';
import {
  setAuthToken,
  ssoVerify,
  verifyLoginOtp,
  login,
  ssoRequest,
  getAuthContext,
} from '../../services/authService';
import { customToast } from '../../utils/toastMessage';
import userStore from '../../store/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../constants/theme';
import useThemeStore from '../../store/themeStore';
import RemedyLogo from '../../components/RemedyLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Moon } from 'lucide-react-native';
import LanguageSelector from '../../components/languageSelector';

type OtpParams = {
  context: 'login' | 'sso';
  email?: string;
  password?: string;
  loginToken?: string;
  requestId?: string;
  nextRoute?: string;
  userId?: string;
};

const OtpVerification = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors: themeColors, isDark } = useTheme();
  const params: OtpParams = route?.params || {};
  const insets = useSafeAreaInsets();
  const RESEND_SECONDS = 300;
  const [otpDigits, setOtpDigits] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [expired, setExpired] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>(
    params.requestId,
  );
  const [currentLoginToken, setCurrentLoginToken] = useState<
    string | undefined
  >(params.loginToken);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    params.userId,
  );
  const d0 = useRef<TextInput>(null);
  const d1 = useRef<TextInput>(null);
  const d2 = useRef<TextInput>(null);
  const d3 = useRef<TextInput>(null);
  const d4 = useRef<TextInput>(null);
  const d5 = useRef<TextInput>(null);

  useEffect(() => {
    setCanResend(false);
    setSecondsLeft(RESEND_SECONDS);
    setExpired(false);
    // Auto-focus the first input after a short delay to allow transition
    const timeout = setTimeout(() => {
      d0.current?.focus();
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (expired) return;
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setExpired(true);
    setCanResend(true);
  }, [secondsLeft, expired]);

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${mm}:${ss}`;
  };

  const handleDigitChange = (index: number, text: string) => {
    if (expired) return;

    // Handle pasting or auto-fill of multiple digits
    if (text.length > 1) {
      const sanitized = text.replace(/[^0-9]/g, '');
      const digits = sanitized.split('').slice(0, 6);

      // Full Code Override: If exactly 6 digits, always start from index 0
      const startIndex = digits.length === 6 ? 0 : index;
      const next = [...otpDigits];

      digits.forEach((digit, i) => {
        if (startIndex + i < 6) {
          next[startIndex + i] = digit;
        }
      });

      setOtpDigits(next);
      const finalCode = next.join('');

      // Auto-Submit: If fully filled, trigger verification
      if (finalCode.length === 6 && !next.includes('')) {
        d5.current?.blur();
        handleVerify(finalCode);
        return;
      }

      // Focus Logic for partial pastes
      const lastIndex = Math.min(startIndex + digits.length - 1, 5);
      if (lastIndex === 5) {
        d5.current?.blur();
      } else {
        const inputRefs = [d0, d1, d2, d3, d4, d5];
        inputRefs[lastIndex + 1].current?.focus();
      }
      return;
    }

    const val = text.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...otpDigits];
    next[index] = val;
    setOtpDigits(next);

    if (val) {
      if (index === 0) d1.current?.focus();
      if (index === 1) d2.current?.focus();
      if (index === 2) d3.current?.focus();
      if (index === 3) d4.current?.focus();
      if (index === 4) d5.current?.focus();
      if (index === 5) {
        d5.current?.blur();
        // Auto-submit if manual typing finished the code
        const finalCode = next.join('');
        if (finalCode.length === 6 && !next.includes('')) {
          handleVerify(finalCode);
        }
      }
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index]) {
      if (index === 1) d0.current?.focus();
      if (index === 2) d1.current?.focus();
      if (index === 3) d2.current?.focus();
      if (index === 4) d3.current?.focus();
      if (index === 5) d4.current?.focus();
    }
  };

  const handleVerify = async (manualCode?: string) => {
    const code = manualCode || otpDigits.join('');
    if (code.length !== 6) {
      if (!manualCode) {
        customToast('error', 'Error', 'Please enter 6-digit code');
      }
      return;
    }
    if (expired) {
      customToast('error', 'Error', 'Code expired. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      let resp: any;
      if (params.context === 'sso') {
        const reqId = currentRequestId || params.requestId;
        if (!reqId) {
          customToast('error', 'Error', 'Missing request ID');
          setLoading(false);
          return;
        }
        resp = await ssoVerify({
          requestId: reqId,
          email: params.email,
          otp: code,
        });
      } else {
        const token = currentLoginToken || params.loginToken;
        const userId = currentUserId || params.userId;
        if (!token && !userId) {
          customToast('error', 'Error', 'Missing login token');
          setLoading(false);
          return;
        }
        resp = await verifyLoginOtp({
          loginToken: token,
          userId,
          otp: code,
        });
      }
      const raw = resp?.data;
      const payload = raw?.data || raw;
      const accessToken =
        payload?.token ||
        payload?.accessToken ||
        payload?.access_token ||
        raw?.token ||
        raw?.accessToken;
      if (accessToken) {
        setAuthToken(accessToken);
        userStore.getState().setToken(accessToken);
        await AsyncStorage.setItem(
          'auth_session_expires_at',
          String(Date.now() + 24 * 60 * 60 * 1000),
        );

        try {
          const authCtx = await getAuthContext();
          const ctx = authCtx?.data?.data;
          if (ctx) {
            const userObj: any = {
              id:
                ctx._id ||
                ctx.id ||
                ctx.userId ||
                payload?.userId ||
                payload?.id,
              email: ctx.email || '',
              name:
                ctx.fname ||
                ctx.name ||
                (ctx.email ? String(ctx.email).split('@')[0] : ''),
              profilePicture: ctx.profileImage || '',
              role: ctx.role,
              settings: ctx.settings,
              whitelist: ctx.whitelist,
              token: accessToken,
            };
            userStore.getState().setAuth(userObj);
            await AsyncStorage.setItem('auth_user', JSON.stringify(userObj));
          }
        } catch (ctxError) {
          console.warn(
            '[OtpVerification] Failed to fetch auth context:',
            ctxError,
          );
        }

        customToast('success', 'Success', 'Verified successfully');
        navigation.reset({
          index: 0,
          routes: [{ name: params.nextRoute || 'tabs' }],
        });
      } else {
        customToast(
          'error',
          'Error',
          raw?.message || 'Invalid verification response',
        );
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to verify OTP';
      customToast('error', 'Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      if (params.context === 'login') {
        let email: string | undefined = params.email;
        let password: string | undefined = params.password;
        try {
          if (!email) {
            const e = await AsyncStorage.getItem('last_login_email');
            if (e) email = e;
          }
          if (!password) {
            const p = await AsyncStorage.getItem('last_login_password');
            if (p) password = p;
          }
        } catch (_) {}
        if (!email || !password) {
          customToast('error', 'Error', 'Missing email or password for resend');
          setLoading(false);
          return;
        }
        const credEmail: string = email as string;
        const credPassword: string = password as string;
        const resp = await login({
          email: credEmail,
          password: credPassword,
        });
        const newToken =
          resp?.data?.loginToken ||
          resp?.data?.data?.loginToken ||
          resp?.data?.token;
        const newUserId =
          resp?.data?.userId ||
          resp?.data?.id ||
          resp?.data?.user?.id ||
          resp?.data?.data?.userId ||
          resp?.data?.data?.id;
        if (newToken || newUserId) {
          setCurrentLoginToken(newToken ? String(newToken) : undefined);
          setCurrentUserId(newUserId ? String(newUserId) : undefined);
        }
        customToast('success', 'Success', 'OTP resent successfully');
      } else {
        const emailForResend = params.email;
        if (!emailForResend) {
          customToast('error', 'Error', 'Email is required for SSO resend');
          setLoading(false);
          return;
        }
        const resp = await ssoRequest({
          provider: 'google',
          email: emailForResend,
        });
        const newReqId =
          resp?.data?.requestId ||
          resp?.data?.data?.requestId ||
          resp?.data?.id;
        if (newReqId) {
          setCurrentRequestId(String(newReqId));
        }
        customToast('success', 'Success', 'OTP resent successfully');
      }
      setSecondsLeft(RESEND_SECONDS);
      setCanResend(false);
      setExpired(false);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to resend OTP';
      customToast('error', 'Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: themeColors.canvas }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={themeColors.canvas} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoWrapper}>
                <RemedyLogo width={wp(25.5)} height={wp(25.5)} />
              </View>

              <View style={styles.textWrapper}>
                <Text variant="displayMedium" style={[styles.welcomeTitle, { color: themeColors.textPrimary }]}>
                  {t('login.twoFactorAuth')}
                </Text>
                <Text variant="bodyLarge" style={[styles.welcomeSubtitle, { color: isDark ? themeColors.textSecondary : '#86868b' }]}>
                  {t('login.enterVerificationCode')}
                </Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.otpRow}>
                {otpDigits.map((digit, index) => (
                <TextInput
                                    key={index}
                    ref={index === 0 ? d0 : index === 1 ? d1 : index === 2 ? d2 : index === 3 ? d3 : index === 4 ? d4 : d5}
                    style={[
                      styles.otpBox, 
                      { 
                        backgroundColor: isDark ? themeColors.inputBackground : '#FAFAFA',
                        borderColor: isDark ? themeColors.inputBorder : '#E5E5EA',
                        color: themeColors.textPrimary
                      },
                      expired && {
                         backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F0F0F0',
                         color: isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'
                      }
                    ]}
                    value={digit}
                    onChangeText={t => handleDigitChange(index, t)}
                 
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  editable={!expired}
                  
                    onKeyPress={e => handleKeyPress(index, e)}
                    placeholderTextColor={isDark ? themeColors.textMuted : undefined}
                />
                ))}
              </View>

              {/* Verify Code Button */}
              <View style={[styles.primaryButtonWrapper, isDark && { shadowColor: themeColors.shadowColor, shadowOpacity: themeColors.shadowOpacity }]}>
                <PrimaryButton
                  text={t('login.verifyCode')}
                  onPress={() => handleVerify()}
                  loading={loading}
                  disabled={expired || loading}
                  useGradient={false}
                  backgroundColor={themeColors.accentPrimary}
                  width="100%"
                  borderRadius={16}
                  accessibilityLabel={t('login.verifyCode')}
                />
              </View>

              <View style={styles.resendContainer}>
                <Text variant="bodySmall" style={[styles.resendText, { color: isDark ? themeColors.textSecondary : '#86868b' }]}>
                  {expired
                    ? 'Code expired'
                    : `${t('login.resendCodeIn')} ${formatTime(secondsLeft)}`}
                </Text>
                <TouchableOpacity
                  disabled={!canResend}
                  onPress={handleResend}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.resendLink,
                     { 
                        color: themeColors.accentPrimary,
                        opacity: canResend ? 1 : 0.5 
                      },
                    ]}>
                    {t('login.resendVerificationCode')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer - Pushed to bottom */}
            <View style={styles.footer}>
              <Text variant="bodySmall" style={[styles.footerText,{color:themeColors.textMuted}]}>
                {t('login.protectedBy')}{' '}
                <Text variant="bodySmall" style={[styles.brandText,{color:isDark?themeColors.textSecondary:'#86868b'}]}>
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
    fontWeight: '300',
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

  // OTP Inputs
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(4),
  },
  otpBox: {
    width: wp(12),
    height: hp(6.5),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  otpBoxDisabled: {
    backgroundColor: colors.surfaceDisabled,
    borderColor: colors.outlineVariant,
    color: colors.onSurfaceDisabled,
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

  resendContainer: {
    alignItems: 'center',
    marginTop: hp(1),
  },
  resendText: {
    fontSize: 13,
    color: '#86868b',
    marginBottom: hp(1),
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  resendLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
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

export default OtpVerification;
