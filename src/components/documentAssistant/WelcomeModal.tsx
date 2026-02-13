import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Sparkles,
  FileText,
  Bookmark,
  ClipboardList,
  History,
  FileCheck,
  ScrollText,
} from 'lucide-react-native';
import { useTheme } from '../../constants/theme';
import { WelcomeFeature } from './types';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonText: string;
  iconColor: string;
  features?: WelcomeFeature[];
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onClose,
  title,
  description,
  buttonText,
  iconColor,
  features,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  const getIcon = (name: string) => {
    switch (name) {
      case 'FileText':
        return <FileText size={20} color={iconColor} />;
      case 'Sparkles':
        return <Sparkles size={20} color="#8B5CF6" />;
      case 'Bookmark':
        return <Bookmark size={20} color="#F59E0B" />;
      case 'ClipboardList':
        return <ClipboardList size={20} color={iconColor} />;
      case 'History':
        return <History size={20} color="#10B981" />;
      case 'FileCheck':
        return <FileCheck size={20} color={iconColor} />;
      case 'ScrollText':
        return <ScrollText size={20} color="#F59E0B" />;
      default:
        return <Sparkles size={20} color={iconColor} />;
    }
  };

  const getIconBg = (name: string) => {
    switch (name) {
      case 'Sparkles':
        return isDark ? 'rgba(139, 92, 246, 0.1)' : '#F5F3FF';
      case 'Bookmark':
      case 'ScrollText':
        return isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB';
      default:
        return isDark ? 'rgba(70, 183, 198, 0.1)' : '#F0F9FA';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.welcomeModalOverlay}>
        <View
          style={[
            styles.welcomeModalContainer,
            {
              backgroundColor: isDark ? themeColors.layer1 : '#F9FAFB',
              borderWidth: isDark ? 1 : 0,
              borderColor: themeColors.borderSubtle,
            },
          ]}>
          {/* Main Icon */}

          {/* Text Content Area with solid background for legibility */}
          <View
            style={[
              styles.textBackground,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}>
            <View
              style={[
                styles.welcomeIconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(70, 183, 198, 0.15)'
                    : 'rgba(70, 183, 198, 0.08)',
                },
              ]}>
              <View
                style={[
                  styles.welcomeIconInner,
                  { backgroundColor: `${iconColor}25` },
                ]}>
                <Sparkles size={40} color={iconColor} strokeWidth={2.5} />
              </View>
            </View>
            {/* Title */}
            <Text
              style={[
                styles.welcomeModalTitle,
                { color: isDark ? themeColors.textPrimary : '#111827' },
              ]}>
              {title}
            </Text>

            {/* Description */}
            <Text
              style={[
                styles.welcomeModalDescription,
                { color: isDark ? themeColors.textSecondary : '#6B7280' },
              ]}>
              {description}
            </Text>
          </View>

          {/* Feature List */}
          <View style={styles.featuresList}>
            {(features || []).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: getIconBg(feature.icon) },
                  ]}>
                  {getIcon(feature.icon)}
                </View>
                <View style={styles.featureText}>
                  <Text
                    style={[
                      styles.featureTitle,
                      { color: isDark ? themeColors.textPrimary : '#111827' },
                    ]}>
                    {feature.title}
                  </Text>
                  <Text
                    style={[
                      styles.featureDesc,
                      { color: isDark ? themeColors.textSecondary : '#6B7280' },
                    ]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.welcomeModalButton, { backgroundColor: iconColor }]}
            onPress={onClose}
            activeOpacity={0.8}>
            <Text style={styles.welcomeModalButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default WelcomeModal;

const styles = StyleSheet.create({
  welcomeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, .3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  welcomeModalContainer: {
    borderRadius: 28,
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },
  welcomeIconContainer: {
    width: wp(19),
    height: hp(8),
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  welcomeIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(1),
    letterSpacing: -0.6,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  welcomeModalDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: hp(1),
    paddingHorizontal: wp(2),
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  welcomeModalButton: {
    width: '100%',
    paddingVertical: hp(1.5),
    borderRadius: 16,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  welcomeModalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  featuresList: {
    width: '100%',
    marginBottom: hp(2),
    gap: hp(1.5),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  textBackground: {
    width: '100%',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: 20,
    marginBottom: hp(2),
    alignItems: 'center',
  },
});
