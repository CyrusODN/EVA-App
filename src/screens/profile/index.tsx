import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Text, List, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import userStore from '../../store/user';
import { getAuthContext, setAuthToken } from '../../services/authService';
import { api } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customToast } from '../../utils/toastMessage';
import * as DocumentPicker from '@react-native-documents/picker';
import { launchImageLibrary } from 'react-native-image-picker';

const Profile = () => {
  const { t } = useTranslation();
  const storeUser = userStore.getState().loggedInUser;
  const [user, setUser] = useState(
    storeUser || { email: '', name: '', profilePicture: '' },
  );
  const navigation = useNavigation();
  const [showPickerSheet, setShowPickerSheet] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const token =
        userStore.getState().token || (await AsyncStorage.getItem('auth_token'));
      if (!token) return;
      setAuthToken(token);
      try {
        const resp = await getAuthContext();
        const ctx = resp?.data?.data;
        if (!ctx) return;
        const nextToken = ctx?.token || token;
        if (nextToken) {
          setAuthToken(nextToken);
          userStore.getState().setToken(nextToken);
          await AsyncStorage.setItem('auth_token', String(nextToken));
        }
        const ctxUser: any = {
          email: ctx?.email || '',
          name:
            ctx?.fname ||
            (ctx?.email ? String(ctx.email).split('@')[0] : ''),
          profilePicture: ctx?.profileImage || '',
          role: ctx?.role,
          settings: ctx?.settings,
          whitelist: ctx?.whitelist,
        };
        userStore.getState().setAuth({ ...ctxUser, token: nextToken });
        await AsyncStorage.setItem('auth_user', JSON.stringify(ctxUser));
        if (mounted) setUser(ctxUser);
      } catch (_) {}
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleNavigate = (screen: string) => {
    //@ts-ignore
    navigation.navigate(screen);
  };

  const [uploading, setUploading] = useState(false);

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
        customToast('error', 'Error', res.errorMessage || 'Failed to open gallery');
        return;
      }
      const asset = res.assets && res.assets.length > 0 ? res.assets[0] : undefined;
      if (!asset || !asset.uri) {
        customToast('error', 'Error', 'No image selected');
        return;
      }
      const mime = asset.type || 'image/jpeg';
      if (!String(mime).startsWith('image/')) {
        customToast('error', 'Error', 'Please select an image file');
        return;
      }
      setUser((prev: any) => ({ ...prev, profilePicture: asset.uri }));
      setUploading(true);
      const token =
        userStore.getState().token || (await AsyncStorage.getItem('auth_token'));
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
            email: ctx?.email || user.email,
            name:
              ctx?.fname ||
              (ctx?.email ? String(ctx.email).split('@')[0] : user.name),
            profilePicture: ctx?.profileImage || user.profilePicture,
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
      customToast('success', 'Success', 'Profile image updated');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to upload image';
      customToast('error', 'Error', message);
    } finally {
      setUploading(false);
      setShowPickerSheet(false);
    }
  };

  const pickFromFiles = async () => {
    if (uploading) return;
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        allowMultiSelection: false,
      });
      const file = Array.isArray(result) ? result[0] : result;
      if (!file) return;
      await handleImagePickerFromFile(file);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to pick file';
      customToast('error', 'Error', message);
    }
  };

  const handleImagePickerFromFile = async (file: any) => {
    if (!file) return;
    const isImage = String(file.type || '').startsWith('image/');
    if (!isImage) {
      customToast('error', 'Error', 'Please select an image file');
      return;
    }
    setUser((prev: any) => ({ ...prev, profilePicture: file.uri }));
    setUploading(true);
    try {
      const token =
        userStore.getState().token || (await AsyncStorage.getItem('auth_token'));
      if (token) setAuthToken(token);
      const form = new FormData();
      form.append('profileImage', {
        uri: file.uri,
        name: file.name || 'profile.jpg',
        type: file.type || 'image/jpeg',
      } as any);
      await uploadProfileImage(form);
      try {
        const resp = await getAuthContext();
        const ctx = resp?.data?.data;
        if (ctx?.profileImage) {
          const ctxUser: any = {
            email: ctx?.email || user.email,
            name:
              ctx?.fname ||
              (ctx?.email ? String(ctx.email).split('@')[0] : user.name),
            profilePicture: ctx?.profileImage || user.profilePicture,
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
      customToast('success', 'Success', 'Profile image updated');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to upload image';
      customToast('error', 'Error', message);
    } finally {
      setUploading(false);
      setShowPickerSheet(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const token =
        userStore.getState().token || (await AsyncStorage.getItem('auth_token'));
      if (token) setAuthToken(token);
      try {
        await api.delete('/auth/profile-image');
      } catch {}
      const cleared = {
        ...(user || {}),
        profilePicture: '',
      };
      userStore.getState().setAuth({
        ...cleared,
        token: userStore.getState().token,
      } as any);
      await AsyncStorage.setItem('auth_user', JSON.stringify(cleared));
      setUser(cleared as any);
      customToast('success', 'Success', 'Profile image removed');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to remove image';
      customToast('error', 'Error', message);
    } finally {
      setUploading(false);
      setShowPickerSheet(false);
    }
  };

  const handleLogout = () => {
    (async () => {
      try {
        userStore.getState().purgeAuth();
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
        await AsyncStorage.removeItem('auth_session_expires_at');
        setAuthToken(null);
        customToast('success', 'Success', 'Logged out');
        //@ts-ignore
        navigation.reset({ index: 0, routes: [{ name: 'login' }] });
      } catch {
        customToast('error', 'Error', 'Failed to log out');
      }
    })();
  };

  const performDeleteAccount = async () => {
    try {
      const token =
        userStore.getState().token || (await AsyncStorage.getItem('auth_token'));
      if (token) setAuthToken(token);
      await api.post('/auth/delete-account', {});
      customToast('success', 'Success', 'Account deleted');
      await (async () => {
        try {
          userStore.getState().purgeAuth();
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          await AsyncStorage.removeItem('auth_session_expires_at');
          setAuthToken(null);
          //@ts-ignore
          navigation.reset({ index: 0, routes: [{ name: 'login' }] });
        } catch {}
      })();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete account';
      customToast('error', 'Error', message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This action is irreversible. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            performDeleteAccount();
          },
        },
      ],
    );
  };

  type SectionProps = { title: string; children: React.ReactNode };
  const Section = ({ title, children }: SectionProps) => (
    <View style={styles.section}>
      <Text variant="bodyMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
      <Divider />
    </View>
  );

  type PressableItemProps = {
    title: string;
    icon: string;
    onPress: () => void;
    titleStyle?: any;
  };
  const PressableItem = ({
    title,
    icon,
    onPress,
    titleStyle,
  }: PressableItemProps) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <List.Item
        title={title}
        titleStyle={[styles.listItemTitle, titleStyle]}
        left={() => (
          <List.Icon
            icon={icon}
            color={colors.primary}
            style={{ marginLeft: wp(2) }}
          />
        )}
        right={() => (
          <List.Icon
            icon="chevron-right"
            color={colors.subText}
            style={{ marginRight: wp(2) }}
          />
        )}
        style={{
          paddingVertical: hp(1),
        }}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri:
                  user.profilePicture ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    user.name || user.email || 'User',
                  )}`,
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowPickerSheet(true)}
            >
              <IconButton
                icon="camera"
                size={20}
                iconColor="white"
                style={styles.editIcon}
              />
            </TouchableOpacity>
          </View>

          <Text variant="titleMedium" style={styles.userEmail}>
            {user.email}
          </Text>
        </View>

        {/* Settings Section */}
        <Section title={t('menu.settings')}>
          <PressableItem
            title={t('common.settings')}
            icon="cog"
            onPress={() => handleNavigate('settings')}
          />
        </Section>

        {/* Billing Section */}
        <Section title={t('subscription.title')}>
          <PressableItem
            title={t('menu.subscription')}
            icon="credit-card"
            onPress={() => handleNavigate('subscription')}
          />
          <PressableItem
            title={t('menu.transactions')}
            icon="receipt"
            onPress={() => handleNavigate('transactions')}
          />
        </Section>

        {/* Account Section */}
        <Section title={t('settings.deleteAccount.title')}>
          <PressableItem
            title={t('common.logout')}
            icon="logout"
            onPress={handleLogout}
            titleStyle={styles.logoutText}
          />
          <PressableItem
            title={t('settings.deleteAccount.title')}
            icon="delete"
            onPress={handleDeleteAccount}
            titleStyle={styles.deleteText}
          />
        </Section>
      </ScrollView>
      <Modal visible={showPickerSheet} transparent animationType="slide">
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowPickerSheet(false)}
          />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text variant="titleMedium" style={styles.sheetTitle}>
              {t('Update profile picture') || 'Update Profile Photo'}
            </Text>
            <View style={styles.sheetList}>
              <TouchableOpacity onPress={handleImagePicker} disabled={uploading} accessibilityLabel="Choose from Photos">
                <List.Item
                  title={t('Choose Photo') || 'Choose from Photos'}
                  titleStyle={styles.sheetItemTitle}
                  left={() => <List.Icon icon="image" color={colors.primary} />}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity onPress={pickFromFiles} disabled={uploading} accessibilityLabel="Choose from Files">
                <List.Item
                  title={t('Select Files') || 'Select Files'}
                  titleStyle={styles.sheetItemTitle}
                  left={() => <List.Icon icon="folder" color={colors.primary} />}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity onPress={handleDeletePhoto} disabled={uploading} accessibilityLabel="Delete Photo">
                <List.Item
                  title={t('Delete Photo') || 'Delete Photo'}
                  titleStyle={[styles.sheetItemTitle, styles.deleteText]}
                  left={() => <List.Icon icon="delete" color={colors.error} />}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity onPress={() => setShowPickerSheet(false)} disabled={uploading} accessibilityLabel="Cancel">
                <List.Item
                  title={t('common.cancel') || 'Cancel'}
                  titleStyle={styles.sheetItemTitle}
                  left={() => <List.Icon icon="close" color={colors.subText} />}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: wp(5),
    paddingBottom: hp(6),
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: hp(4),
    paddingTop: hp(2),
    paddingBottom: hp(2),
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: wp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: hp(2),
  },
  profileImage: {
    width: hp(14),
    height: hp(14),
    borderRadius: hp(7),
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: hp(3.5),
    width: hp(7),
    height: hp(7),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editIcon: {
    margin: 0,
  },
  userEmail: {
    color: colors.onSurface,
    textAlign: 'center',
    fontSize: hp(1.8),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
  },
  section: {
    marginBottom: hp(3),
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: wp(2),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: hp(1.7),
    color: colors.subText,
    marginBottom: hp(1),
    marginTop: hp(2),
    marginHorizontal: wp(5),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItemTitle: {
    color: colors.onSurface,
    fontSize: hp(1.8),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  logoutText: {
    color: colors.onSurface,
    fontSize: hp(1.8),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  deleteText: {
    color: colors.error,
    fontSize: hp(1.8),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: wp(12),
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderColor,
    marginBottom: hp(1),
  },
  sheetTitle: {
    color: colors.onSurface,
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: colors.subText,
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  sheetButton: {
    paddingVertical: hp(1.5),
  },
  sheetButtonText: {
    color: colors.onSurface,
    textAlign: 'center',
    fontSize: hp(1.8),
  },
  sheetList: {
    marginTop: hp(0.5),
  },
  sheetItemTitle: {
    color: colors.onSurface,
    fontSize: hp(1.9),
  },
});

export default Profile;
