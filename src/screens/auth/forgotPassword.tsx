import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
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

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
  
    const handleResetPassword = () => {
    //   setLoading(true);
    //   setTimeout(() => {
    //     setLoading(false);
    //     setResetSent(true);
    //   }, 2000);
    };
  
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F4F7FF', '#FFFFFF']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={images.logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
  
            {/* Reset Password Form */}
            <View style={styles.formContainer}>
              <View style={styles.card}>
                {!resetSent ? (
                  <>
                    {/* Title */}
                    <View style={styles.titleContainer}>
                      <Text variant="headlineMedium" style={styles.title}>
                        {t('login.resetPassword')}
                      </Text>
                      <Text variant="bodyMedium" style={styles.subtitle}>
                        {t('login.resetInstructions')}
                      </Text>
                    </View>
  
                    {/* Email Input */}
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
                        width={wp(80)}
                      />
                    </View>
  
                    {/* Send Reset Link Button */}
                    <View style={styles.buttonGroup}>
                      <PrimaryButton
                        text={t('login.sendResetLink')}
                        onPress={handleResetPassword}
                        loading={loading}
                        width={wp(80)}
                      />
                    </View>
                  </>
                ) : (
                  // Success State
                  <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                      <Text variant="headlineLarge" style={styles.checkmark}>✓</Text>
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
                <View style={styles.backToLoginContainer}>
                  <TouchableOpacity onPress={() => navigation.navigate('login')}>
                    <Text variant="bodyMedium" style={styles.backToLoginText}>
                      ← {t('login.backToLogin')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
  
            {/* Footer */}
            <View style={styles.footer}>
              <Text variant="bodySmall" style={styles.footerText}>
                {t('login.protectedBy')} <Text variant="bodySmall" style={styles.brandText}>Remedy AI</Text>
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
      width: wp(40),
      height: hp(8),
    },
    formContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: wp(8),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
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
      marginBottom: hp(2.5),
      alignSelf: 'center',
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
      width: wp(80),
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
  
  export default ForgotPassword;