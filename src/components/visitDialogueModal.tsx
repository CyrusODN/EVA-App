import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Switch } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import Input from './input';
import PrimaryButton from './primaryButton';
import { colors } from '../constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VisitDialogModal = ({
  visible,
  onClose,
  visitType,
  onCreateVisit,
}) => {
  const { t } = useTranslation();
  const [visitName, setVisitName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleCreateVisit = () => {
    if (visitName.trim() && agreedToTerms) {
      onCreateVisit(visitName.trim());
      setVisitName('');
      setAgreedToTerms(false);
      onClose();
    }
  };

  const getTitle = () => {
    switch (visitType) {
      case 'patient':
        return t('buttons.newVisit');
      case 'meeting':
        return t('buttons.newMeeting');
      case 'lecture':
        return t('buttons.newLecture');
      default:
        return t('buttons.newVisit');
    }
  };

  const getPlaceholder = () => {
    switch (visitType) {
      case 'patient':
        return t('visitNameInput.placeholder');
      case 'meeting':
        return t('home.meetingNamePlaceholder') || 'Enter meeting name...';
      case 'lecture':
        return t('home.lectureNamePlaceholder') || 'Enter lecture name...';
      default:
        return t('visitNameInput.placeholder');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                  {getTitle()}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* PHI Agreement */}
                <View style={styles.phiSection}>
                  <Text variant="titleMedium" style={styles.phiTitle}>
                    {t('dialog.phi.title')}
                  </Text>
                  <Text variant="bodyMedium" style={styles.phiDescription}>
                    {t('dialog.phi.description')}
                  </Text>
                  
                  <View style={styles.switchContainer}>
                    <Switch
                      value={agreedToTerms}
                      onValueChange={setAgreedToTerms}
                      thumbColor={agreedToTerms ? '#53A0CD' : colors.surfaceDisabled}
                      trackColor={{
                        false: colors.outline,
                        true: 'rgba(83, 160, 205, 0.3)',
                      }}
                    />
                    <Text variant="bodySmall" style={styles.agreementText}>
                      {t('dialog.phi.agreement')}
                    </Text>
                  </View>
                </View>

                {/* Visit Name Input */}
                {agreedToTerms && (
                  <View style={styles.inputSection}>
                    <Text variant="titleMedium" style={styles.inputLabel}>
                      {visitType === 'patient' 
                        ? t('visitNameInput.label')
                        : `${getTitle()} Name`
                      }
                    </Text>
                    <Input
                      placeholder={getPlaceholder()}
                      value={visitName}
                      setValue={setVisitName}
                      width={wp(80)}
                      borderColor={colors.outline}
                      backgroundColor={colors.surface}
                    />
                    {visitType === 'patient' && (
                      <Text variant="bodySmall" style={styles.tooltipText}>
                        {t('visitNameInput.tooltip')}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Footer */}
              {agreedToTerms && (
                <View style={styles.footer}>
                  <PrimaryButton
                    text={t('buttons.continue')}
                    onPress={handleCreateVisit}
                    disabled={!visitName.trim()}
                    width={wp(80)}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default VisitDialogModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: wp(90),
    borderRadius: 20,
    backgroundColor: 'white', // Add white background
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalContent: {
    backgroundColor: '#f8f9fa',
    minHeight: hp(50), // Use minHeight instead of flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    backgroundColor: 'white',
  },
  title: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  content: {
    padding: wp(5),
    backgroundColor: 'white', // Add white background
  },
  phiSection: {
    marginBottom: hp(3),
  },
  phiTitle: {
    color: colors.onSurface,
    marginBottom: hp(1),
    fontWeight: '600',
  },
  phiDescription: {
    color: colors.onSurfaceVariant,
    marginBottom: hp(2),
    lineHeight: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
  },
  agreementText: {
    marginLeft: wp(3),
    flex: 1,
    color: colors.onSurface,
    lineHeight: 18,
  },
  inputSection: {
    marginBottom: hp(2),
  },
  inputLabel: {
    color: colors.onSurface,
    marginBottom: hp(1),
    fontWeight: '500',
  },
  tooltipText: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.5),
    fontStyle: 'italic',
  },
  footer: {
    padding: wp(5),
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    alignItems: 'center',
    backgroundColor: 'white',
  },
});