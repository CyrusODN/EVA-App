import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../constants/theme';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonText: string;
  iconColor: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onClose,
  title,
  description,
  buttonText,
  iconColor,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.welcomeModalOverlay]}>
        <View style={[styles.welcomeModalContainer, { backgroundColor: isDark ? themeColors.layer1 : '#FFFFFF' }]}>
          {/* Sparkles Icon */}
          <View style={[styles.welcomeIconContainer, { backgroundColor: isDark ? 'rgba(70, 183, 198, 0.15)' : 'rgba(70, 183, 198, 0.08)' }]}>
            <View style={[styles.welcomeIconInner, { backgroundColor: `${iconColor}15` }]}>
              <Sparkles size={32} color={iconColor} strokeWidth={2} />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.welcomeModalTitle, { color: isDark ? themeColors.textPrimary : '#111827' }]}>{title}</Text>

          {/* Description */}
          <Text style={[styles.welcomeModalDescription, { color: isDark ? themeColors.textSecondary : '#6B7280' }]}>{description}</Text>

          {/* Button */}
          <TouchableOpacity
            style={[styles.welcomeModalButton, { backgroundColor: iconColor }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  welcomeModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(70, 183, 198, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  welcomeIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: hp(1.5),
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  welcomeModalDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: hp(3),
    paddingHorizontal: wp(2),
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  welcomeModalButton: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.8),
    borderRadius: 14,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    minWidth: wp(40),
    alignItems: 'center',
  },
  welcomeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
});