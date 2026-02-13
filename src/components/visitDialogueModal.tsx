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
  Keyboard,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Info, Check } from 'lucide-react-native';
import Input from './input';
import PrimaryButton from './primaryButton';
import { colors as legacyColors } from '../constants/colors';
import { textStyles } from '../constants/textStyles';
import { useTheme } from '../constants/theme';

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
  visitType: 'patient' | 'meeting' | 'lecture';
  onCreateVisit: (visitName: string) => void;
}

const VisitDialogModal: React.FC<VisitDialogModalProps> = ({
  visible,
  onClose,
  visitType,
  onCreateVisit,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
      setAgreedToTerms(false);
      setVisitName('');
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
      <View style={StyleSheet.absoluteFill}>
        {/* Separate backdrop for background only */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: fadeAnim,
              backgroundColor: isDark
                ? 'rgba(0, 0, 0, 0.8)'
                : 'rgba(0, 0, 0, 0.5)',
            },
          ]}
        />

        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: insets.top,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={{ width: '100%', backgroundColor: 'transparent' }}>
            <TouchableOpacity
              style={styles.backdropTouchable}
              activeOpacity={1}
              onPress={onClose}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => {
                  e.stopPropagation();
                  Keyboard.dismiss();
                }}
                style={styles.modalTouchable}>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                      backgroundColor: isDark ? themeColors.canvas : '#FFFFFF',
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark
                        ? 'rgba(70, 183, 198, 0.3)'
                        : 'transparent',
                      shadowColor: isDark ? themeColors.accentPrimary : '#000',
                      shadowOffset: { width: 0, height: isDark ? 0 : 8 },
                      shadowOpacity: isDark ? 0.3 : 0.2,
                      shadowRadius: isDark ? 20 : 20,
                      elevation: isDark ? 12 : 12,
                    },
                  ]}>
                  <View
                    style={[
                      styles.modalContent,
                      {
                        backgroundColor: isDark
                          ? themeColors.canvas
                          : '#FFFFFF',
                      },
                    ]}>
                    {/* Shield Icon */}
                    <View style={styles.iconContainer}>
                      <View
                        style={[
                          styles.shieldBackground,
                          {
                            backgroundColor: isDark
                              ? 'rgba(70, 183, 198, 0.1)'
                              : '#EAF8FA',
                          },
                        ]}>
                        <Shield
                          size={32}
                          color={themeColors.accentPrimary}
                          strokeWidth={2}
                        />
                      </View>
                    </View>

                    {/* Title */}
                    <View style={styles.titleSection}>
                      <Text
                        style={[
                          styles.modalTitle,
                          {
                            color: isDark ? themeColors.textPrimary : '#0D0D0D',
                          },
                        ]}>
                        {t('dialog.phi.title')}
                      </Text>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                      <Text
                        style={[
                          styles.modalDescription,
                          {
                            color: isDark
                              ? themeColors.textSecondary
                              : '#A6A6A6',
                          },
                        ]}>
                        {t('dialog.phi.description')}
                      </Text>
                    </View>

                    {/* Checkbox Agreement */}
                    <View style={styles.checkboxSection}>
                      <View style={styles.checkboxRow}>
                        <TouchableOpacity
                          onPress={handleCheckboxToggle}
                          activeOpacity={0.7}>
                          <View
                            style={[
                              styles.customCheckbox,
                              agreedToTerms && styles.customCheckboxChecked,
                              {
                                borderColor: agreedToTerms
                                  ? themeColors.accentPrimary
                                  : isDark
                                  ? themeColors.borderNormal
                                  : '#E5E5EA',
                                backgroundColor: agreedToTerms
                                  ? themeColors.accentPrimary
                                  : isDark
                                  ? 'transparent'
                                  : '#FFFFFF',
                              },
                            ]}>
                            {agreedToTerms && (
                              <Check
                                size={16}
                                color={isDark ? '#000000' : '#FFFFFF'}
                                strokeWidth={3}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.checkboxText,
                            {
                              color: isDark
                                ? themeColors.textPrimary
                                : '#0D0D0D',
                            },
                          ]}>
                          {t('dialog.phi.agreement')}
                        </Text>
                      </View>
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
                          <Text
                            style={[
                              styles.inputLabel,
                              {
                                color: isDark
                                  ? themeColors.textPrimary
                                  : '#0D0D0D',
                              },
                            ]}>
                            {t('visitNameInput.label')}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.inputWrapper,
                            {
                              borderColor: isDark
                                ? themeColors.borderNormal
                                : '#E5E5EA',
                              backgroundColor: 'transparent',
                            },
                          ]}>
                          <TextInput
                            placeholder={getPlaceholder()}
                            value={visitName}
                            onChangeText={setVisitName}
                            style={[
                              styles.textInput,
                              {
                                backgroundColor: 'transparent',
                              },
                            ]}
                            placeholderTextColor={
                              isDark ? themeColors.textMuted : '#C7C7CC'
                            }
                            underlineColor="transparent"
                            outlineColor="transparent"
                            autoFocus={true}
                            textColor={isDark ? '#FFFFFF' : '#000000'}
                            keyboardAppearance={isDark ? 'dark' : 'light'}
                            theme={{
                              colors: {
                                text: isDark ? '#FFFFFF' : '#000000',
                                placeholder: isDark
                                  ? themeColors.textMuted
                                  : '#C7C7CC',
                                onSurfaceVariant: isDark
                                  ? '#FFFFFF'
                                  : '#000000',
                              },
                            }}
                          />
                        </View>
                        {visitType === 'patient' && (
                          <Text
                            style={[
                              styles.tooltipText,
                              {
                                color: isDark
                                  ? themeColors.textSecondary
                                  : '#A6A6A6',
                              },
                            ]}>
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
                        onPress={
                          agreedToTerms && visitName.trim()
                            ? handleCreateVisit
                            : () => {}
                        }
                        disabled={
                          !agreedToTerms || (agreedToTerms && !visitName.trim())
                        }
                        width={wp(78)}
                        useGradient={false}
                        backgroundColor={themeColors.accentPrimary}
                        borderRadius={16}
                      />
                    </View>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
    maxHeight: hp(65),
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
    padding: 22,
    alignItems: 'center',
  },
  // Shield Icon Section
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  shieldBackground: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: '#EAF8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D0D0D',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    letterSpacing: -0.5,
  },

  // Description Section
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 3,
    paddingHorizontal: 5,
  },
  modalDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A6A6A6',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },

  // Checkbox Section
  checkboxSection: {
    width: '100%',
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
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
    marginRight: 12,
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
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },

  // Input Section
  inputAnimatedSection: {
    width: '100%',
    marginBottom: 8,
  },
  inputLabelContainer: {
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D0D0D',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  inputWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  textInput: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    paddingHorizontal: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },
  tooltipText: {
    fontSize: 12,
    color: '#A6A6A6',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
  },

  // Button Section
  buttonSection: {
    width: '100%',
    alignItems: 'center',
  },
});
