/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Vibration,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { Shield, Info, Check } from 'lucide-react-native';
import Input from './input';
import PrimaryButton from './primaryButton';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/textStyles';

// DNA Helix Decorative Component
// const DNAHelix = () => {
//   const dots = [];
//   const helixHeight = hp(50);
//   const helixWidth = wp(30);
//   const centerX = helixWidth / 2;
//   const amplitude = helixWidth * 0.2;
//   const frequency = 0.25;
//   const numDots = 80;

//   // Create dots for DNA helix pattern
//   for (let i = 0; i < numDots; i++) {
//     const y = (i / numDots) * helixHeight;
//     const angle = i * frequency;

//     // Left strand
//     const leftX = centerX - amplitude * Math.sin(angle);
//     const leftOpacity = 0.3 + (Math.sin(angle) + 1) * 0.25;
//     dots.push(
//       <View
//         key={`left-${i}`}
//         style={[
//           styles.dnaDot,
//           {
//             left: leftX,
//             top: y,
//             opacity: leftOpacity,
//           },
//         ]}
//       />,
//     );

//     // Right strand
//     const rightX = centerX + amplitude * Math.sin(angle);
//     const rightOpacity = 0.9 + (Math.sin(angle + Math.PI) + 1) * 0.15;
//     dots.push(
//       <View
//         key={`right-${i}`}
//         style={[
//           styles.dnaDot,
//           {
//             left: rightX,
//             top: y,
//             opacity: rightOpacity,
//           },
//         ]}
//       />,
//     );

//     // Connection lines/rungs (every few dots) - DNA steps connecting corresponding dots
//     if (i % 4 === 0) {
//       const lineWidth = Math.abs(rightX - leftX);
//       const lineStartX = Math.min(leftX, rightX);

//       dots.push(
//         <View
//           key={`line-${i}`}
//           style={[
//             styles.dnaLine,
//             {
//               left: lineStartX,
//               top: y - 1,
//               width: lineWidth,
//               height: 2,
//             },
//           ]}
//         />,
//       );
//     }
//   }

//   return <View style={styles.dnaHelixContainer}>{dots}</View>;
// };

interface VisitDialogModalProps {
  visible: boolean;
  onClose: () => void;
  visitType: 'patient' | 'meeting' | 'lecture' | string;
  onCreateVisit: (visitName: string) => void;
}

const VisitDialogModal = ({
  visible,
  onClose,
  visitType,
  onCreateVisit,
}: VisitDialogModalProps) => {
  const { t } = useTranslation();
  const [visitName, setVisitName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      inputOpacity.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (agreedToTerms) {
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(inputOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [agreedToTerms]);

  const handleCreateVisit = () => {
    if (visitName.trim() && agreedToTerms) {
      onCreateVisit(visitName.trim());
      setVisitName('');
      setAgreedToTerms(false);
      onClose();
    }
  };

  const handleCheckboxToggle = () => {
    // Trigger haptic feedback - light tap (10ms vibration)
    try {
      if (Platform.OS === 'ios') {
        // iOS: Single light tap
        Vibration.vibrate(10);
      } else {
        // Android: Light haptic feedback
        Vibration.vibrate(50);
      }
    } catch (error) {
      // Haptic feedback not available, continue without it
    }
    setAgreedToTerms(!agreedToTerms);
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}>
          <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'bottom', 'left', 'right']}>
            <TouchableOpacity
              style={styles.backdropTouchable}
              activeOpacity={1}
              onPress={onClose}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={styles.modalTouchable}>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}>
                  <View style={styles.modalContent}>
                    {/* Shield Icon */}
                    <View style={styles.iconContainer}>
                      <View style={styles.shieldBackground}>
                        <Shield size={32} color="#46B7C6" strokeWidth={2} />
                      </View>
                    </View>

                    {/* Title */}
                    <View style={styles.titleSection}>
                      <Text style={styles.modalTitle}>
                        {t('dialog.phi.title')}
                      </Text>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                      <Text style={styles.modalDescription}>
                        {t('dialog.phi.description')}
                      </Text>
                    </View>

                    {/* Checkbox Agreement */}
                    <View style={styles.checkboxSection}>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={handleCheckboxToggle}
                        activeOpacity={0.7}>
                        <View
                          style={[
                            styles.customCheckbox,
                            agreedToTerms && styles.customCheckboxChecked,
                          ]}>
                          {agreedToTerms && (
                            <Check size={16} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </View>
                        <Text style={styles.checkboxText}>
                          {t('dialog.phi.agreement')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Input Section - Shows when checkbox is checked */}
                    {agreedToTerms && (
                      <Animated.View
                        style={[
                          styles.inputAnimatedSection,
                          {
                            opacity: inputOpacity,
                            transform: [
                              {
                                translateY: inputOpacity.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-10, 0],
                                }),
                              },
                            ],
                          },
                        ]}>
                        <View style={styles.inputLabelContainer}>
                          <Text style={styles.inputLabel}>
                            {t('visitNameInput.label')}
                          </Text>
                        </View>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            placeholder={getPlaceholder()}
                            value={visitName}
                            onChangeText={setVisitName}
                            style={styles.textInput}
                            placeholderTextColor="#C7C7CC"
                            underlineColor="transparent"
                            outlineColor="transparent"
                            autoFocus={true}
                          />
                        </View>
                        {visitType === 'patient' && (
                          <Text style={styles.tooltipText}>
                            {t('visitNameInput.tooltip')}
                          </Text>
                        )}
                      </Animated.View>
                    )}

                    {/* Primary Button */}
                    <View style={styles.buttonSection}>
                      <PrimaryButton
                        text={
                          agreedToTerms && visitName.trim()
                            ? t('buttons.continue')
                            : t('dialog.phi.continueButton')
                        }
                        onPress={handleCreateVisit}
                        disabled={
                          !agreedToTerms || (agreedToTerms && !visitName.trim())
                        }
                        width={wp(78)}
                        useGradient={false}
                        backgroundColor="#46B7C6"
                        borderRadius={16}
                      />
                    </View>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default VisitDialogModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTouchable: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: wp(88),
    maxWidth: 480,
    marginTop: hp(2),
    maxHeight: hp(70),
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  // Shield Icon Section
  iconContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  shieldBackground: {
    width: wp(15),
    height: wp(15),
    borderRadius: 30,
    backgroundColor: '#EAF8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0D0D0D',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    letterSpacing: -0.5,
  },

  // Description Section
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#A6A6A6',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },

  // Checkbox Section
  checkboxSection: {
    width: '100%',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customCheckboxChecked: {
    backgroundColor: '#46B7C6',
    borderColor: '#46B7C6',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0D0D0D',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },

  // Input Section
  inputAnimatedSection: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabelContainer: {
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D0D0D',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  inputWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#46B7C6',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  textInput: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },
  tooltipText: {
    fontSize: 11,
    color: '#A6A6A6',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },

  // Button Section
  buttonSection: {
    width: '100%',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
});
