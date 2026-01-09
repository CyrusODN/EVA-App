import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import PrimaryButton from '../../components/primaryButton';
import { colors } from '../../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { images } from '../../constants/images';
import { textStyles } from '../../constants/textStyles';
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
  const params: OtpParams = route?.params || {};
  const RESEND_SECONDS = 300;
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [expired, setExpired] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>(
    params.requestId,
  );
  const [currentLoginToken, setCurrentLoginToken] = useState<string | undefined>(
    params.loginToken,
  );
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
  }, []);

  useEffect(() => {
    if (expired) return;
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft(prev => prev - 1), 1000);
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
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e?.nativeEvent?.key === 'Backspace' && !otpDigits[index]) {
      if (index === 5) d4.current?.focus();
      if (index === 4) d3.current?.focus();
      if (index === 3) d2.current?.focus();
      if (index === 2) d1.current?.focus();
      if (index === 1) d0.current?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = otpDigits.join('');
    if (!otp || otp.length < 6) {
      customToast('error', 'Error', t('login.verificationCode'));
      return;
    }
    if (expired) {
      customToast('error', 'Error', 'Code expired. Request a new code.');
      return;
    }
    setLoading(true);
    try {
      let resp;
      if (params.context === 'login') {
        const payload: any = { otp };
        if (currentUserId) {
          payload.userId = currentUserId;
        } else {
          payload.email = params.email;
        }
        if (currentLoginToken) {
          payload.loginToken = currentLoginToken;
        }
        resp = await verifyLoginOtp(payload);
      } else {
        const payload: any = { otp };
        if (currentRequestId) {
          payload.requestId = currentRequestId;
        } else {
          payload.email = params.email;
        }
        resp = await ssoVerify(payload);
      }
      const raw = resp?.data;
      const payload = raw?.data || raw;
      const token = payload?.token || payload?.accessToken;
      if (token) {
        setAuthToken(token);
        userStore.getState().setToken(token);
        const userPayload = payload?.user || payload;
        const email = userPayload?.email;
        const name =
          userPayload?.name ||
          userPayload?.fullName ||
          (email ? String(email).split('@')[0] : undefined);
        const profilePicture = userPayload?.profilePicture || userPayload?.avatar;
        const normalizedUser: any = {
          email: email || undefined,
          name: name || undefined,
          profilePicture: profilePicture || undefined,
        };
        userStore.getState().setAuth({ ...normalizedUser, token });
        try {
          await AsyncStorage.setItem('auth_token', String(token));
          await AsyncStorage.setItem('auth_user', JSON.stringify(normalizedUser));
          await AsyncStorage.setItem(
            'auth_session_expires_at',
            String(Date.now() + 24 * 60 * 60 * 1000),
          );
        } catch (_) {}
        try {
          const ctxResp = await getAuthContext();
          const ctx = ctxResp?.data?.data;
          if (ctx) {
            const nextToken = ctx?.token || token;
            if (nextToken) {
              setAuthToken(nextToken);
              userStore.getState().setToken(nextToken);
              await AsyncStorage.setItem('auth_token', String(nextToken));
            }
            const ctxUser: any = {
              email: ctx?.email || normalizedUser.email,
              name:
                ctx?.fname ||
                normalizedUser.name ||
                (ctx?.email ? String(ctx.email).split('@')[0] : undefined),
              profilePicture: ctx?.profileImage || normalizedUser.profilePicture,
              role: ctx?.role,
              settings: ctx?.settings,
              whitelist: ctx?.whitelist,
            };
            userStore.getState().setAuth({ ...ctxUser, token: nextToken });
            await AsyncStorage.setItem('auth_user', JSON.stringify(ctxUser));
          }
        } catch (_) {}
        customToast('success', 'Success', 'Verification successful');
        navigation.reset({
          index: 0,
          routes: [{ name: params.nextRoute || 'tabs' }],
        });
      } else {
        customToast('error', 'Error', raw?.message || 'Invalid verification response');
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
          resp?.data?.userId || resp?.data?.data?.userId || resp?.data?.id;
        if (newToken) setCurrentLoginToken(String(newToken));
        if (newUserId) setCurrentUserId(String(newUserId));
        Alert.alert('New OTP Sent', 'Please check your email for the new verification code.');
      } else {
        const resp = await ssoRequest({ provider: 'google', email: params.email });
        const reqId =
          resp?.data?.requestId ||
          resp?.data?.data?.requestId ||
          resp?.data?.id ||
          resp?.data?.ssoRequestId ||
          resp?.data?.data?.ssoRequestId;
        if (reqId) setCurrentRequestId(String(reqId));
        Alert.alert('New OTP Sent', 'Please check your email for the new verification code.');
      }
      setOtpDigits(['', '', '', '', '', '']);
      setSecondsLeft(RESEND_SECONDS);
      setExpired(false);
      setCanResend(false);
      customToast('success', 'Success', 'Verification code resent');
      d0.current?.focus();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to resend verification code';
      customToast('error', 'Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F4F7FF', '#FFFFFF']} style={styles.gradient}>
        <View style={styles.logoContainer}>
          <Image source={images.logo} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.card}>
          <Text variant="headlineLarge" style={textStyles.headlineLarge}>
            {t('Two-Factor Authentication')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('Enter the verification code sent to your email')}
          </Text>

          <View style={styles.otpRow}>
            <TextInput
              ref={d0}
              style={[styles.otpBox, expired && styles.otpBoxDisabled]}
              value={otpDigits[0]}
              onChangeText={t => handleDigitChange(0, t)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!expired}
              onKeyPress={e => handleKeyPress(0, e)}
            />
            <TextInput
              ref={d1}
              style={[styles.otpBox, expired && styles.otpBoxDisabled]}
              value={otpDigits[1]}
              onChangeText={t => handleDigitChange(1, t)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!expired}
              onKeyPress={e => handleKeyPress(1, e)}
            />
            <TextInput
              ref={d2}
              style={[styles.otpBox, expired && styles.otpBoxDisabled]}
              value={otpDigits[2]}
              onChangeText={t => handleDigitChange(2, t)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!expired}
              onKeyPress={e => handleKeyPress(2, e)}
            />
            <TextInput
              ref={d3}
              style={[styles.otpBox, expired && styles.otpBoxDisabled]}
              value={otpDigits[3]}
              onChangeText={t => handleDigitChange(3, t)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!expired}
              onKeyPress={e => handleKeyPress(3, e)}
            />
            <TextInput
              ref={d4}
              style={[styles.otpBox, expired && styles.otpBoxDisabled]}
              value={otpDigits[4]}
              onChangeText={t => handleDigitChange(4, t)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!expired}
              onKeyPress={e => handleKeyPress(4, e)}
            />
            <TextInput
              ref={d5}
              style={[styles.otpBox, expired && styles.otpBoxDisabled]}
              value={otpDigits[5]}
              onChangeText={t => handleDigitChange(5, t)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!expired}
              onKeyPress={e => handleKeyPress(5, e)}
            />
          </View>

          <View style={styles.buttonGroup}>
            <PrimaryButton
              text={t('Verify Code')}
              onPress={handleVerify}
              loading={loading}
              disabled={expired}
              useGradient={true}
              width={wp(80)}
              accessibilityLabel={t('Verify Code')}
            />
          </View>

          <View style={styles.resendContainer}>
            <Text variant="bodySmall" style={styles.resendText}>
              {expired ? 'Code expired' : `Code expires in ${formatTime(secondsLeft)}`}
            </Text>
            <TouchableOpacity disabled={!canResend} onPress={handleResend}>
              <Text
                variant="bodySmall"
                style={[
                  styles.resendLink,
                  { opacity: canResend ? 1 : 0.5 },
                ]}
              >
                {t('Resend verification Code')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            {t('login.protectedBy')}{' '}
            <Text variant="bodySmall" style={styles.brandText}>
              Remedy AI
            </Text>
          </Text>
        </View>
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
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: hp(8),
    marginBottom: hp(4),
  },
  logo: {
    width: wp(40),
    height: hp(8),
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: wp(8),
    alignItems: 'center',
    width: wp(90),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  subtitle: {
    color: colors.subText,
    textAlign: 'center',
    marginTop: hp(1),
    marginBottom: hp(2),
    fontSize: 14,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp(75),
    marginBottom: hp(2),
  },
  otpBox: {
    width: wp(10),
    height: hp(6),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderColor,
    backgroundColor: colors.inputBackground,
    textAlign: 'center',
    fontSize: 18,
    color: colors.onSurface,
    ...StyleSheet.flatten({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    }),
  },
  otpBoxDisabled: {
    backgroundColor: colors.surfaceDisabled,
    borderColor: colors.outlineVariant,
    color: colors.onSurfaceDisabled,
  },
  buttonGroup: {
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: hp(1),
  },
  resendText: {
    color: colors.subText,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: hp(1),
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

export default OtpVerification;
