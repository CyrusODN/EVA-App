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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

// Mock user data - replace with actual user data from your state management
const mockUser = {
  email: 'john.doe@example.com',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  name: 'John Doe',
};

const Profile = () => {
  const { t } = useTranslation();
  const [user] = useState(mockUser);
  const navigation = useNavigation();

  const handleNavigate = (screen: string) => {
    //@ts-ignore
    navigation.navigate(screen);
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
              source={{ uri: user.profilePicture }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleImagePicker}
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
            onPress={() => {}}
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
});

export default Profile;
