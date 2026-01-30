import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { customToast } from '../../utils/toastMessage';
import {
  Text,
  Divider,
  Button,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Camera } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/input';
import PrimaryButton from '../../components/primaryButton';
import LanguageSelector from '../../components/languageSelector';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import Header from '../../components/header';
import { useNavigation } from '@react-navigation/native';
import Gap from '../../components/gap';
import { textStyles } from '../../constants/textStyles';
import { changePassword, setAuthToken, forgetPassword, getAuthContext } from '../../services/authService';
import userStore from '../../store/user';
import { api } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import useOnboardingStore from '../../store/onboarding';
import { useTheme } from '../../constants/theme';
import { Sun, Moon } from 'lucide-react-native';

// Mock fallback if store does not have a user yet
const mockUser = {
  email: 'john.doe@example.com',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  name: 'John Doe',
};

const Settings = () => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark, toggleTheme } = useTheme();
  const storeUser = userStore.getState().loggedInUser;
  const [user, setUser] = useState(storeUser || mockUser);
  const navigation = useNavigation<any>();
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Onboarding preferences
  const {
    defaultSpecialization,
    defaultNoteLength,
    defaultVisitType,
    resetOnboarding,
  } = useOnboardingStore();

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Support states
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  // Delete account states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const uploadProfileImage = async (form: FormData) => {
    const endpoints = [
      '/auth/profile-image',
      '/auth/profile/image',
      '/user/profile-image',
      '/users/profile-image',
    ];
    let lastError: any = null;
    for (const ep of endpoints) {
      try {
        await api.post(ep, form);
        return ep;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 404 || status === 405) {
          lastError = e;
          continue;
        }
        throw e;
      }
    }
    throw lastError || new Error('Profile image upload endpoint not found');
  };

  const handleImagePicker = async () => {
    if (uploading) return;
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });
      if (res.didCancel) return;
      if (res.errorMessage || res.errorCode) {
        customToast('error', t('common.error'), res.errorMessage || 'Failed to open gallery');
        return;
      }
      const asset = res.assets && res.assets.length > 0 ? res.assets[0] : undefined;
      if (!asset || !asset.uri) {
        customToast('error', t('common.error'), 'No image selected');
        return;
      }
      const mime = asset.type || 'image/jpeg';
      if (!String(mime).startsWith('image/')) {
        customToast('error', t('common.error'), 'Please select an image file');
        return;
      }
      setUser((prev: any) => ({ ...(prev as any), profilePicture: asset.uri }));
      setUploading(true);
      const token = userStore.getState().token || (await AsyncStorage.getItem('auth_token'));
      if (token) setAuthToken(token);
      const form = new FormData();
      form.append('profileImage', {
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: mime,
      } as any);
      await uploadProfileImage(form);
      try {
        const resp = await getAuthContext();
        const ctx = resp?.data?.data;
        if (ctx?.profileImage) {
          const ctxUser: any = {
            email: ctx?.email || (user as any).email,
            name:
              ctx?.fname ||
              (ctx?.email ? String(ctx.email).split('@')[0] : (user as any).name),
            profilePicture: ctx?.profileImage || (user as any).profilePicture,
            role: ctx?.role,
            settings: ctx?.settings,
            whitelist: ctx?.whitelist,
          };
          userStore.getState().setAuth({
            ...ctxUser,
            token: userStore.getState().token,
          });
          await AsyncStorage.setItem('auth_user', JSON.stringify(ctxUser));
          setUser(ctxUser);
        }
      } catch {}
      customToast('success', t('common.success'), 'Profile image updated');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to upload image';
      customToast('error', t('common.error'), message);
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      customToast('error', t('common.error'), 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      customToast('error', t('settings.password.alertMatch'));
      return;
    }
    if (String(newPassword).trim().length < 6) {
      customToast('error', t('common.error'), 'New password must be at least 6 characters');
      return;
    }
    if (newPassword === currentPassword) {
      customToast('error', t('common.error'), 'New password must differ from current password');
      return;
    }
    setChangingPassword(true);
    try {
      let token = userStore.getState().token || (await AsyncStorage.getItem('auth_token'));
      if (token) setAuthToken(token);
      try {
        const ctxResp = await getAuthContext();
        const ctx = ctxResp?.data?.data;
        const nextToken = ctx?.token || token;
        if (nextToken) {
          setAuthToken(nextToken);
          userStore.getState().setToken(nextToken);
          await AsyncStorage.setItem('auth_token', String(nextToken));
          token = nextToken;
        }
      } catch {}
      const resp = await changePassword({
        currentPassword,
        newPassword,
      });
      const raw = resp?.data;
      const payload = raw?.data || raw;
      if ((resp?.status && resp.status >= 200 && resp.status < 300) || payload?.success || payload?.message) {
        customToast('success', t('settings.password.alertChanged'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        try {
          userStore.getState().purgeAuth();
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          await AsyncStorage.removeItem('auth_session_expires_at');
          setAuthToken(null);
        } catch {}
        //@ts-ignore
        (navigation as any).reset({ index: 0, routes: [{ name: 'login' }] });
      } else {
        customToast('error', t('common.error'), payload?.message || 'Failed to change password');
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        customToast('error', t('common.error'), 'Session expired. Please log in again.');
        try {
          userStore.getState().purgeAuth();
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          await AsyncStorage.removeItem('auth_session_expires_at');
          setAuthToken(null);
        } catch {}
        //@ts-ignore
        (navigation as any).reset({ index: 0, routes: [{ name: 'login' }] });
        return;
      }
      if (status === 404) {
        try {
          const emailToUse = user?.email;
          if (!emailToUse) {
            customToast('error', t('common.error'), 'No email found for current user');
            return;
          }
          const resp = await forgetPassword({ email: emailToUse });
          const raw = resp?.data;
          const message =
            raw?.message || raw?.data || 'Password reset link sent. Check your email.';
          customToast('success', t('common.success'), String(message));
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } catch (e: any) {
          const msg =
            e?.response?.data?.message || e?.message || 'Failed to send reset link';
          customToast('error', t('common.error'), msg);
        }
      } else {
        const message =
          error?.response?.data?.message || error?.message || 'Failed to change password';
        customToast('error', t('common.error'), message);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSupportSubmit = () => {
    if (!supportEmail || !supportSubject || !supportMessage) {
      customToast('error', 'Please fill in all fields');
      return;
    }
    console.log('Support message sent');
    customToast('success', t('settings.support.alertSent'));
    setSupportEmail('');
    setSupportSubject('');
    setSupportMessage('');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      console.log('Account deleted');
      customToast(
        'success',
        t('common.success'),
        t('settings.deleteAccount.alertDeleted'),
      );
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
    } else {
      customToast(
        'error',
        t('common.error'),
        'Confirmation text does not match.',
      );
    }
  };

  type SectionProps = { title: string; children: React.ReactNode };
  const Section = ({ title, children }: SectionProps) => (
    <View style={styles.section}>
      <Text variant="headlineMedium" style={[textStyles.sectionTitle, { color: isDark ? themeColors.textPrimary : colors.darkPrimary }]}>
        {title}
      </Text>
      {children}
      <Divider style={[styles.divider, { backgroundColor: isDark ? themeColors.borderSubtle : '#F1F5F9' }]} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? themeColors.canvas : '#F8FAFC' }]}>
      <Header
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        onLeftPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.mainContainer, { backgroundColor: isDark ? themeColors.canvas : '#F8FAFC' }]}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Picture Section */}
          <Section title={t('settings.profile.picture')}>
            <View style={[styles.profileSection, { 
              backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
              shadowColor: isDark ? themeColors.accentPrimary : '#000'
            }]}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: user.profilePicture }}
                  style={[styles.profileImage, { 
                    borderColor: themeColors.accentPrimary,
                    backgroundColor: isDark ? themeColors.layer1 : '#F8FAFC'
                  }]}
                />
                <TouchableOpacity
                  style={[styles.editButton, { 
                    backgroundColor: isDark ? 'rgba(70, 183, 198, 0.15)' : 'rgba(70, 183, 198, 0.1)',
                    borderColor: isDark ? themeColors.layer2 : '#FFFFFF'
                  }]}
                  onPress={handleImagePicker}
                  activeOpacity={0.7}
                >
                  <Camera size={16} color={themeColors.accentPrimary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.changeAvatarButton, {
                  backgroundColor: themeColors.accentPrimary,
                  shadowColor: themeColors.accentPrimary
                }]}
                onPress={handleImagePicker}
                activeOpacity={0.85}
                >
                  <Camera size={16} color="white" />
                <Text variant="labelLarge" style={styles.changeAvatarText}>
                    {t('settings.profile.changeAvatar')}
                  </Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* AI Scribe Preferences Section */}
          <Section title={t('settings.aiScribe.title') || 'AI Scribe Preferences'}>
            <View style={[styles.aiScribeSection, { 
              backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
              shadowColor: isDark ? themeColors.accentPrimary : '#000'
            }]}>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceContent}>
                  <Text style={[styles.preferenceLabel, { color: isDark ? themeColors.textPrimary : '#1A1A1A' }]}>
                    {t('settings.aiScribe.specialization') || 'Specialization'}
                  </Text>
                  <Text style={[styles.preferenceValue, { color: isDark ? themeColors.textSecondary : '#64748B' }]}>
                    {defaultSpecialization 
                      ? t(`onboarding.specialization.${defaultSpecialization.toLowerCase().replace(' ', '')}`) || defaultSpecialization
                      : t('settings.aiScribe.notSet') || 'Not set'}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.preferenceRowDivider, { backgroundColor: isDark ? themeColors.borderSubtle : '#F1F5F9' }]} />
              
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceContent}>
                  <Text style={[styles.preferenceLabel, { color: isDark ? themeColors.textPrimary : '#1A1A1A' }]}>
                    {t('settings.aiScribe.noteLength') || 'Note Length'}
                  </Text>
                  <Text style={[styles.preferenceValue, { color: isDark ? themeColors.textSecondary : '#64748B' }]}>
                    {t(`onboarding.noteLength.${defaultNoteLength.toLowerCase()}`) || defaultNoteLength}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.preferenceRowDivider, { backgroundColor: isDark ? themeColors.borderSubtle : '#F1F5F9' }]} />
              
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceContent}>
                  <Text style={[styles.preferenceLabel, { color: isDark ? themeColors.textPrimary : '#1A1A1A' }]}>
                    {t('settings.aiScribe.visitType') || 'Default Visit Type'}
                  </Text>
                  <Text style={[styles.preferenceValue, { color: isDark ? themeColors.textSecondary : '#64748B' }]}>
                    {t(`onboarding.visitType.${defaultVisitType === 'First Visit' ? 'firstVisit' : 'followUp'}`) || defaultVisitType}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.preferenceRowDivider, { backgroundColor: isDark ? themeColors.borderSubtle : '#F1F5F9' }]} />
              
              <TouchableOpacity 
                style={styles.rerunOnboardingButton}
                onPress={() => {
                  resetOnboarding();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Onboarding' }],
                  });
                }}
              >
                <Text style={[styles.rerunOnboardingText, { color: themeColors.accentPrimary }]}>
                  {t('settings.aiScribe.rerunOnboarding') || 'Re-run Setup Wizard'}
                </Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* Language and Theme Selector Section */}
          <Section title={t('settings.language.title') || 'Language & Theme'}>
            <View style={[styles.languageThemeSection, { 
              backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
              shadowColor: isDark ? themeColors.accentPrimary : '#000'
            }]}>
            <LanguageSelector variant="full" showLabel={false} />
              
              <View style={[styles.preferenceRowDivider, { backgroundColor: isDark ? themeColors.borderSubtle : '#F1F5F9' }]} />
              
              <View style={styles.themeToggleRow}>
                <View style={styles.themeToggleContent}>
                  <Text style={[styles.preferenceLabel, { color: isDark ? themeColors.textPrimary : '#1A1A1A' }]}>
                    {t('Theme') || 'Theme'}
                  </Text>
                  <Text style={[styles.preferenceValue, { color: isDark ? themeColors.textSecondary : '#64748B' }]}>
                    {isDark ? (t('Dark Mode') || 'Dark Mode') : (t('Light Mode') || 'Light Mode')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={[styles.themeToggleButton, { 
                    backgroundColor: isDark ? 'rgba(70, 183, 198, 0.15)' : 'rgba(70, 183, 198, 0.1)'
                  }]}
                  activeOpacity={0.7}
                >
                  {isDark ? (
                    <Sun size={20} color="#FFD700" strokeWidth={2} />
                  ) : (
                    <Moon size={20} color="#475569" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Section>

          {/* Change Password Section */}
          <Text variant="headlineMedium" style={[textStyles.sectionTitle, { color: isDark ? themeColors.textPrimary : colors.darkPrimary }]}>
            {t('settings.password.title')}
          </Text>
          <View style={[styles.passwordSection, { 
            backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
            shadowColor: isDark ? themeColors.accentPrimary : '#000'
          }]}>
            <Input
              placeholder={t('settings.password.current')}
              value={currentPassword}
              setValue={setCurrentPassword}
              isPassword={true}
              backgroundColor={isDark ? themeColors.layer1 : colors.surface}
              borderColor={isDark ? themeColors.borderNormal : colors.borderColor}
            />
            <Input
              placeholder={t('settings.password.new')}
              value={newPassword}
              setValue={setNewPassword}
              isPassword={true}
              backgroundColor={isDark ? themeColors.layer1 : colors.surface}
              borderColor={isDark ? themeColors.borderNormal : colors.borderColor}
            />
            <Input
              placeholder={t('settings.password.confirm')}
              value={confirmPassword}
              setValue={setConfirmPassword}
              isPassword={true}
              backgroundColor={isDark ? themeColors.layer1 : colors.surface}
              borderColor={isDark ? themeColors.borderNormal : colors.borderColor}
            />
            <PrimaryButton
              text={t('settings.password.update')}
              onPress={handlePasswordChange}
              loading={changingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            />
          </View>
          <Gap height={hp(2)} />
          {/* Customer Support Section */}
          <Text variant="headlineMedium" style={[textStyles.sectionTitle, { color: isDark ? themeColors.textPrimary : colors.darkPrimary }]}>
            {t('settings.support.title')}
          </Text>
          <View style={[styles.supportSection, { 
            backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
            shadowColor: isDark ? themeColors.accentPrimary : '#000'
          }]}>
            <Input
              placeholder={t('settings.support.email')}
              value={supportEmail}
              setValue={setSupportEmail}
              mode="email"
              backgroundColor={isDark ? themeColors.layer1 : colors.surface}
              borderColor={isDark ? themeColors.borderNormal : colors.borderColor}
            />
            <Input
              placeholder={t('settings.support.subject')}
              value={supportSubject}
              setValue={setSupportSubject}
              backgroundColor={isDark ? themeColors.layer1 : colors.surface}
              borderColor={isDark ? themeColors.borderNormal : colors.borderColor}
            />
            <Input
              placeholder={t('settings.support.message')}
              value={supportMessage}
              setValue={setSupportMessage}
              multiline={true}
              numberOfLines={4}
              backgroundColor={isDark ? themeColors.layer1 : colors.surface}
              borderColor={isDark ? themeColors.borderNormal : colors.borderColor}
            />
            <PrimaryButton
              text={t('settings.support.send')}
              onPress={handleSupportSubmit}
              disabled={!supportEmail || !supportSubject || !supportMessage}
            />
          </View>
        </ScrollView>

        {/* Delete Account Dialog */}
        <Portal>
          <Dialog
            visible={showDeleteDialog}
            onDismiss={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmText('');
            }}
            style={{ backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF' }}
          >
            <Dialog.Title style={[styles.dialogTitle, { color: isDark ? themeColors.textPrimary : '#1A1A1A' }]}>
              {t('settings.deleteAccount.dialogTitle')}
            </Dialog.Title>
            <Dialog.Content>
              <Paragraph style={[styles.dialogDescription, { color: isDark ? themeColors.textPrimary : '#1A1A1A' }]}>
                {t('settings.deleteAccount.dialogDescription')}
              </Paragraph>
              <Text variant="bodySmall" style={styles.deleteWarning}>
                {t('settings.deleteAccount.warning')}
              </Text>
              <Input
                placeholder={t('settings.deleteAccount.confirm')}
                value={deleteConfirmText}
                setValue={setDeleteConfirmText}
                backgroundColor={isDark ? themeColors.layer1 : colors.surface}
                borderColor={isDark ? themeColors.borderNormal : colors.borderColor}
                width={250}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                textColor={isDark ? themeColors.textPrimary : colors.darkPrimary}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onPress={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                buttonColor={colors.error}
                mode="contained"
              >
                {t('settings.deleteAccount.button')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  divider: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: '#46B7C6',
    backgroundColor: '#F8FAFC',
  },
  editButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#46B7C6',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editIcon: {
    margin: 0,
  },
  changeAvatarButton: {
    backgroundColor: '#46B7C6',
    borderRadius: 10,
    height: hp(4),
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  changeAvatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  passwordSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  supportSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  deleteSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  warningText: {
    color: '#EF4444',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  dialogTitle: {
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  dialogDescription: {
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    marginBottom: 12,
  },
  deleteWarning: {
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    marginBottom: 12,
  },
  aiScribeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  preferenceValue: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    marginTop: 2,
  },
  preferenceRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  rerunOnboardingButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rerunOnboardingText: {
    fontSize: 15,
    color: '#46B7C6',
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  languageThemeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  themeToggleContent: {
    flex: 1,
  },
  themeToggleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(70, 183, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Settings;
