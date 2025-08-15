import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { customToast } from '../../utils/toastMessage';
import {
  Text,
  List,
  Divider,
  IconButton,
  TextInput,
  Button,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/input';
import PrimaryButton from '../../components/primaryButton';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import Header from '../../components/header';
import { useNavigation } from '@react-navigation/native';

// Mock user data - replace with actual user data from your state management
const mockUser = {
  email: 'john.doe@example.com',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  name: 'John Doe',
};

const Settings = () => {
  const { t } = useTranslation();
  const [user] = useState(mockUser);
  const navigation = useNavigation();

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

  const handleImagePicker = () => {
    // Implement image picker logic here
    console.log('Open image picker');
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      customToast(
        'error',
        t('common.error'),
        t('settings.password.alertMatch'),
      );
      return;
    }
    console.log('Password changed');
    customToast(
      'success',
      t('common.success'),
      t('settings.password.alertChanged'),
    );
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSupportSubmit = () => {
    if (!supportEmail || !supportSubject || !supportMessage) {
      customToast('error', t('common.error'), 'Please fill in all fields');
      return;
    }
    console.log('Support message sent');
    customToast(
      'success',
      t('common.success'),
      t('settings.support.alertSent'),
    );
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

  const handleGoBack = () => {
    navigation.goBack();
  };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
      <Divider style={styles.divider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('settings.title')}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {t('settings.subtitle')}
          </Text>
        </View>
      </View> */}
      <Header
  title={t('settings.title')}
  subtitle={t('settings.subtitle')}
  onLeftPress={() => navigation.goBack()}
//   rightIcon={true}
//   onRightPress={() => handleNotifications()}
//   rightIconSource="bell"
/>
      <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Section */}
          <Section title={t('settings.profile.picture')}>
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.profileImage}
                />
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleImagePicker}
                >
                  <IconButton
                    icon="camera"
                    size={16}
                    iconColor="white"
                    style={styles.editIcon}
                  />
                </TouchableOpacity>
              </View>
              <PrimaryButton
                text={t('settings.profile.changeAvatar')}
                onPress={handleImagePicker}
                width={200}
              />
            </View>
          </Section>

          {/* Change Password Section */}
          <Section title={t('settings.password.title')}>
            <View style={styles.passwordSection}>
              <Input
                placeholder={t('settings.password.current')}
                value={currentPassword}
                setValue={setCurrentPassword}
                isPassword={true}
                backgroundColor={colors.surface}
                borderColor={colors.borderColor}
              />
              <Input
                placeholder={t('settings.password.new')}
                value={newPassword}
                setValue={setNewPassword}
                isPassword={true}
                backgroundColor={colors.surface}
                borderColor={colors.borderColor}
              />
              <Input
                placeholder={t('settings.password.confirm')}
                value={confirmPassword}
                setValue={setConfirmPassword}
                isPassword={true}
                backgroundColor={colors.surface}
                borderColor={colors.borderColor}
              />
              <PrimaryButton
                text={t('settings.password.update')}
                onPress={handlePasswordChange}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              />
            </View>
          </Section>

          {/* Customer Support Section */}
          <Section title={t('settings.support.title')}>
            <View style={styles.supportSection}>
              <Input
                placeholder={t('settings.support.email')}
                value={supportEmail}
                setValue={setSupportEmail}
                mode="email"
                backgroundColor={colors.surface}
                borderColor={colors.borderColor}
              />
              <Input
                placeholder={t('settings.support.subject')}
                value={supportSubject}
                setValue={setSupportSubject}
                backgroundColor={colors.surface}
                borderColor={colors.borderColor}
              />
              <Input
                placeholder={t('settings.support.message')}
                value={supportMessage}
                setValue={setSupportMessage}
                multiline={true}
                numberOfLines={4}
                backgroundColor={colors.surface}
                borderColor={colors.borderColor}
              />
              <PrimaryButton
                text={t('settings.support.send')}
                onPress={handleSupportSubmit}
                disabled={!supportEmail || !supportSubject || !supportMessage}
              />
            </View>
          </Section>

          {/* Delete Account Section */}
          {/* <Section title={t('settings.deleteAccount.title')}>
          <View style={styles.deleteSection}>
            <Text variant="bodyMedium" style={styles.warningText}>
              {t('settings.deleteAccount.warning')}
            </Text>
            <PrimaryButton
              text={t('settings.deleteAccount.button')}
              onPress={() => setShowDeleteDialog(true)}
              backgroundColor={colors.error}
              borderColor={colors.error}
            />
          </View>
        </Section> */}
        </ScrollView>
      </View>
      {/* Delete Account Dialog */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => {
            setShowDeleteDialog(false);
            setDeleteConfirmText('');
          }}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {t('settings.deleteAccount.dialogTitle')}
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogDescription}>
              {t('settings.deleteAccount.dialogDescription')}
            </Paragraph>
            <Text variant="bodySmall" style={styles.deleteWarning}>
              {t('settings.deleteAccount.warning')}
            </Text>
            <Input
              placeholder={t('settings.deleteAccount.confirm')}
              value={deleteConfirmText}
              setValue={setDeleteConfirmText}
              backgroundColor={colors.surface}
              borderColor={colors.borderColor}
              width={250}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
              }}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  backButton: {
    marginRight: wp(4),
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.lightGreen,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
  },
  headerSubtitle: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginTop: 2,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.darkPrimary,
    marginBottom: 16,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  divider: {
    marginTop: 16,
    backgroundColor: colors.borderColor,
  },
  profileSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.lightGreen,
    backgroundColor: colors.primaryContainer,
  },
  editButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.lightGreen,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  editIcon: {
    margin: 0,
  },
  passwordSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  supportSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  deleteSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  warningText: {
    color: colors.error,
    textAlign: 'center',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  dialogTitle: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  dialogDescription: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginBottom: 12,
  },
  deleteWarning: {
    color: colors.error,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginBottom: 12,
  },
});

export default Settings;
