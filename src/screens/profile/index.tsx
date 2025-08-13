import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Text, List, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';

// Mock user data - replace with actual user data from your state management
const mockUser = {
  email: 'john.doe@example.com',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  name: 'John Doe',
};

const Profile = () => {
  const { t } = useTranslation();
  const [user] = useState(mockUser);

  const handleNavigate = (screen) => {
    // Implement navigation logic here
    console.log(`Navigate to ${screen}`);
  };

  const handleImagePicker = () => {
    // Implement image picker logic here
    console.log('Open image picker');
  };

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logout user');
  };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text variant="bodyMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
      <Divider />
    </View>
  );

  const PressableItem = ({ title, icon, onPress, titleStyle }) => (
    <TouchableOpacity onPress={onPress}>
      <List.Item
        title={title}
        titleStyle={[styles.listItemTitle, titleStyle]}
        left={() => <List.Icon icon={icon} color={colors.darkPrimary} />}
        right={() => (
          <List.Icon icon="chevron-right" color={colors.darkPrimary} />
        )}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user.profilePicture }} 
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleImagePicker}>
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
            onPress={() => handleNavigate('generalSettings')}
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
            onPress={() => handleNavigate('deleteAccount')}
            titleStyle={styles.deleteText}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  editIcon: {
    margin: 0,
  },
  userEmail: {
    color: colors.darkPrimary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.darkPrimary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  listItemTitle: {
    color: colors.darkPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  logoutText: {
    color: colors.darkPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  deleteText: {
    color: colors.error,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
});

export default Profile;