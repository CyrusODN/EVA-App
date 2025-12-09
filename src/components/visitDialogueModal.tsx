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
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { X, Info } from 'lucide-react-native';
//@ts-ignore
import CheckBox from 'react-native-check-box';
import Input from './input';
import PrimaryButton from './primaryButton';
import { colors } from '../constants/colors';

// DNA Helix Decorative Component
const DNAHelix = () => {
  const dots = [];
  const helixHeight = hp(50);
  const helixWidth = wp(30);
  const centerX = helixWidth / 2;
  const amplitude = helixWidth * 0.2;
  const frequency = 0.25;
  const numDots = 80;

  // Create dots for DNA helix pattern
  for (let i = 0; i < numDots; i++) {
    const y = (i / numDots) * helixHeight;
    const angle = i * frequency;

    // Left strand
    const leftX = centerX - amplitude * Math.sin(angle);
    const leftOpacity = 0.3 + (Math.sin(angle) + 1) * 0.25;
    dots.push(
      <View
        key={`left-${i}`}
        style={[
          styles.dnaDot,
          {
            left: leftX,
            top: y,
            opacity: leftOpacity,
          },
        ]}
      />,
    );

    // Right strand
    const rightX = centerX + amplitude * Math.sin(angle);
    const rightOpacity = 0.9 + (Math.sin(angle + Math.PI) + 1) * 0.15;
    dots.push(
      <View
        key={`right-${i}`}
        style={[
          styles.dnaDot,
          {
            left: rightX,
            top: y,
            opacity: rightOpacity,
          },
        ]}
      />,
    );

    // Connection lines/rungs (every few dots) - DNA steps connecting corresponding dots
    if (i % 4 === 0) {
      const lineWidth = Math.abs(rightX - leftX);
      const lineStartX = Math.min(leftX, rightX);

      dots.push(
        <View
          key={`line-${i}`}
          style={[
            styles.dnaLine,
            {
              left: lineStartX,
              top: y - 1,
              width: lineWidth,
              height: 2,
            },
          ]}
        />,
      );
    }
  }

  return <View style={styles.dnaHelixContainer}>{dots}</View>;
};

const VisitDialogModal = ({ visible, onClose, visitType, onCreateVisit }) => {
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
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={e => e.stopPropagation()}
              style={styles.modalTouchable}
            >
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.modalContent}>
                  {/* DNA Helix Background */}
                  <View style={styles.dnaHelixBackground}>
                    <DNAHelix />
                  </View>

                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.headerContent}>
                      <View style={styles.titleContainer}>
                        <Text variant="headlineLarge" style={styles.title}>
                          {t('dialog.phi.title')}
                        </Text>
                        <Text variant="bodySmall" style={styles.phiDescription}>
                          {t('dialog.phi.description')}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={20} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <View style={{}}>
                    {/* PHI Agreement Section */}
                    <View style={styles.phiSection}>
                      <View style={styles.toggleSection}>
                        <CheckBox
                          style={styles.checkbox}
                          onClick={() => {
                            setAgreedToTerms(!agreedToTerms);
                          }}
                          isChecked={agreedToTerms}
                          checkedCheckBoxColor="#000000"
                          uncheckedCheckBoxColor="#000000"
                        />
                        <View style={styles.agreementTextContainer}>
                          <Text
                            variant="bodyMedium"
                            style={styles.agreementText}
                          >
                            {t('dialog.phi.agreement')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Footer */}
                  {agreedToTerms && (
                    <Animated.View
                      style={[
                        styles.footer,
                        {
                          opacity: inputOpacity,
                        },
                      ]}
                    >
                      {/* Visit Name Input */}
                      <Animated.View
                        style={[
                          styles.inputSection,
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
                        ]}
                      >
                        <View style={styles.inputLabelContainer}>
                          <Text variant="titleMedium" style={styles.inputLabel}>
                            Visit Name
                          </Text>
                          <Info
                            size={20}
                            color={colors.onSurfaceVariant}
                            style={styles.infoIcon}
                          />
                        </View>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            placeholder={getPlaceholder()}
                            value={visitName}
                            onChangeText={setVisitName}
                            style={{
                              width: '100%',
                              backgroundColor: colors.surface,
                              borderRadius: 0,
                              borderWidth: 1,
                              overflow: 'hidden',
                              borderColor: 'transparent',
                            }}
                            placeholderTextColor={colors.placeholderColor}
                            underlineColor="transparent"
                            outlineColor="transparent"
                          />
                        </View>
                        {visitType === 'patient' && (
                          <Text variant="bodySmall" style={styles.tooltipText}>
                            {t('visitNameInput.tooltip')}
                          </Text>
                        )}
                      </Animated.View>

                      <PrimaryButton
                        text={t('buttons.continue')}
                        onPress={handleCreateVisit}
                        disabled={!visitName.trim()}
                        width={wp(78)}
                        useGradient={true}
                      />
                    </Animated.View>
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    maxWidth: 500,
    maxHeight: hp(90),
    borderRadius: 24,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 12,
        },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalContent: {
    backgroundColor: colors.surface,
    maxHeight: hp(90),
    position: 'relative',
    overflow: 'hidden',
    // minHeight: hp(35),
  },
  dnaHelixBackground: {
    position: 'absolute',
    right: -wp(8),
    top: hp(8),
    width: wp(35),
    height: hp(50),
    zIndex: 0,
    opacity: 0.3,
    pointerEvents: 'none',
  },
  dnaHelixContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dnaDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bluish || '#53A0CD',
  },
  dnaLine: {
    position: 'absolute',
    backgroundColor: colors.bluish || '#53A0CD',
    opacity: 0.5,
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: wp(6),
    paddingTop: wp(5),
    paddingBottom: wp(2),
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    zIndex: 2,
    position: 'relative',
  },
  headerContent: {
    flex: 1,
    marginRight: wp(2),
  },
  titleContainer: {
    marginBottom: 0,
  },
  title: {
    color: colors.onSurface,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  phiSection: {
    width: '90%',
    alignSelf: 'center',
    zIndex: 2,
    position: 'relative',
  },
  phiDescription: {
    color: 'gray',
    marginTop: hp(0.5),
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
  },
  checkbox: {
    marginRight: wp(3),
    padding: 0,
    flex: 0,
    alignSelf: 'flex-start',
    marginTop: hp(0.5),
  },
  toggleWrapper: {
    marginRight: wp(3),
  },
  toggleTrack: {
    borderRadius: 16,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleThumb: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  checkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  inputSection: {
    marginTop: hp(2),
    marginBottom: hp(2),
    zIndex: 2,
    position: 'relative',
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  inputWrapper: {
    width: '98%',
    marginTop: hp(0.5),
    // borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputLabel: {
    color: colors.onSurface,
  },
  infoIcon: {
    marginLeft: wp(1.5),
  },
  tooltipText: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.8),
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    width: '90%',
    alignSelf: 'center',
    zIndex: 2,
    position: 'relative',
    marginBottom: hp(2),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
});
