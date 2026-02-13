import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Vibration,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { FileText, ClipboardList, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/header';
import { useTheme } from '../../constants/theme';

// Design tokens for "Invisible Luxury" aesthetic
const THEME = {
  // Backgrounds
  pure: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceAlt: '#F3F4F6',

  // Text
  navy: '#111827',
  secondary: '#6B7280',
  tertiary: '#9CA3AF',

  // Brand
  brand: '#46B7C6',
  brandLight: 'rgba(70, 183, 198, 0.08)',
  brandMedium: 'rgba(70, 183, 198, 0.15)',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

// Haptics helper with fallback
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  const duration = type === 'light' ? 5 : type === 'medium' ? 10 : 20;
  Vibration.vibrate(duration);
};

interface ReportModuleCardProps {
  mode: 'discharge' | 'certificate';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
  dynamicTheme: any;
  isDark: boolean;
}

const ReportModuleCard: React.FC<ReportModuleCardProps> = ({
  mode,
  title,
  description,
  icon: Icon,
  onPress,
  dynamicTheme,
  isDark,
}) => {
  const handlePress = () => {
    triggerHaptic('medium');
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.moduleCard,
        {
          backgroundColor: dynamicTheme.pure,
          borderColor: dynamicTheme.borderLight,
          ...(isDark
            ? {
                shadowColor: dynamicTheme.brand,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              }),
        },
        pressed && { backgroundColor: dynamicTheme.surfaceAlt },
      ]}>
      <View style={styles.cardContent}>
        {/* Icon container */}
        <View style={styles.iconWrapper}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: dynamicTheme.brandMedium },
            ]}>
            <Icon size={24} color={dynamicTheme.brand} strokeWidth={1.8} />
          </View>
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
          <Text style={[styles.cardTitle, { color: dynamicTheme.navy }]}>
            {title}
          </Text>
          <Text
            style={[styles.cardDescription, { color: dynamicTheme.secondary }]}>
            {description}
          </Text>
        </View>

        {/* Arrow indicator */}
        <View
          style={[
            styles.arrowContainer,
            { backgroundColor: dynamicTheme.surface },
          ]}>
          <ArrowRight
            size={20}
            color={dynamicTheme.tertiary}
            strokeWidth={1.5}
          />
        </View>
      </View>
    </Pressable>
  );
};

const Report = () => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  // Dynamic theme tokens
  const DYNAMIC_THEME = {
    pure: isDark ? themeColors.canvas : THEME.pure,
    surface: isDark ? themeColors.layer1 : THEME.surface,
    surfaceAlt: isDark ? themeColors.layer2 : THEME.surfaceAlt,
    navy: isDark ? themeColors.textPrimary : THEME.navy,
    secondary: isDark ? themeColors.textSecondary : THEME.secondary,
    tertiary: isDark ? themeColors.textMuted : THEME.tertiary,
    brand: themeColors.accentPrimary,
    brandLight: isDark ? 'rgba(70, 183, 198, 0.15)' : THEME.brandLight,
    brandMedium: isDark ? 'rgba(70, 183, 198, 0.2)' : THEME.brandMedium,
    border: isDark ? themeColors.borderNormal : THEME.border,
    borderLight: isDark ? themeColors.borderSubtle : THEME.borderLight,
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleModulePress = (mode: 'discharge' | 'certificate') => {
    if (mode === 'discharge') {
      navigation.navigate('discharge');
    } else {
      navigation.navigate('certificate');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: DYNAMIC_THEME.pure }]}
      edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View
          style={[
            styles.contentWrapper,
            { backgroundColor: DYNAMIC_THEME.pure },
          ]}>
          <Header
            title={t('remediusReport.main.title')}
            subtitle={t('remediusReport.main.subtitle')}
            onLeftPress={handleBack}
            showIcon={false}
            backgroundColor={DYNAMIC_THEME.pure}
            showBorder={true}
          />

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Module cards */}
            <View style={styles.modulesContainer}>
              <ReportModuleCard
                mode="discharge"
                title={t('remediusReport.main.modules.discharge.title')}
                description={t(
                  'remediusReport.main.modules.discharge.description',
                )}
                icon={FileText}
                onPress={() => handleModulePress('discharge')}
                dynamicTheme={DYNAMIC_THEME}
                isDark={isDark}
              />

              <ReportModuleCard
                mode="certificate"
                title={t('remediusReport.main.modules.certificate.title')}
                description={t(
                  'remediusReport.main.modules.certificate.description',
                )}
                icon={ClipboardList}
                onPress={() => handleModulePress('certificate')}
                dynamicTheme={DYNAMIC_THEME}
                isDark={isDark}
              />
            </View>

            {/* Info footer */}
            <View style={styles.infoFooter}>
              <Text
                style={[styles.infoText, { color: DYNAMIC_THEME.tertiary }]}>
                {t('remediusReport.main.infoFooter')}
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2.5),
    paddingBottom: hp(5),
  },

  // Modules container
  modulesContainer: {
    gap: hp(1.5),
  },

  // Module card
  moduleCard: {
    borderRadius: 16,
    padding: wp(5),
    paddingVertical: hp(2.5),
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  moduleCardPressed: {
    // Removed - now inline with dynamic theme
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrapper: {
    marginRight: wp(4),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContent: {
    flex: 1,
    paddingRight: wp(2),
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  cardDescription: {
    fontSize: 13,
    marginTop: hp(0.5),
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info footer
  infoFooter: {
    marginTop: hp(4),
    paddingHorizontal: wp(2),
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});

export default Report;
