import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Pill, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/header';

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

interface ModuleCardProps {
  mode: 'consult' | 'pharmacopedia';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  mode,
  title,
  description,
  icon: Icon,
  onPress,
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
        pressed && styles.moduleCardPressed,
      ]}>
      <View style={styles.cardContent}>
        {/* Icon container */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconContainer}>
            <Icon size={24} color={THEME.brand} strokeWidth={1.8} />
          </View>
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>

        {/* Arrow indicator */}
        <View style={styles.arrowContainer}>
          <ArrowRight size={20} color={THEME.tertiary} strokeWidth={1.5} />
        </View>
      </View>
    </Pressable>
  );
};

const ClinicalWorkspace = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleModulePress = (mode: 'consult' | 'pharmacopedia') => {
    if (mode === 'consult') {
      navigation.navigate('consultChat');
    } else {
      navigation.navigate('pharmacopediaChat');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.contentWrapper}>
        <Header
          title={t('clinicalTools.title')}
          subtitle={t('clinicalTools.subtitle')}
          onLeftPress={handleBack}
          showIcon={false}
          backgroundColor={THEME.pure}
          showBorder={true}
        />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Module cards */}
          <View style={styles.modulesContainer}>
            <ModuleCard
              mode="consult"
              title={t('clinicalTools.consult.title')}
              description={t('clinicalTools.consult.description')}
              icon={Stethoscope}
              onPress={() => handleModulePress('consult')}
            />

            <ModuleCard
              mode="pharmacopedia"
              title={t('clinicalTools.pharmacopedia.title')}
              description={t('clinicalTools.pharmacopedia.description')}
              icon={Pill}
              onPress={() => handleModulePress('pharmacopedia')}
            />
          </View>

          {/* Info footer */}
          <View style={styles.infoFooter}>
            <Text style={styles.infoText}>{t('clinicalTools.footer')}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.pure,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: THEME.pure,
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
    backgroundColor: THEME.pure,
    borderRadius: 16,
    padding: wp(5),
    paddingVertical: hp(2.5),
    borderWidth: 1,
    borderColor: THEME.borderLight,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  moduleCardPressed: {
    backgroundColor: THEME.surface,
    transform: [{ scale: 0.98 }],
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
    backgroundColor: THEME.brandMedium,
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
    color: THEME.navy,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  cardDescription: {
    fontSize: 13,
    color: THEME.secondary,
    marginTop: hp(0.5),
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.surface,
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
    color: THEME.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});

export default ClinicalWorkspace;
