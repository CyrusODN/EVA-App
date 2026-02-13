import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Check, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useLanguageStore from '../store/language';
import { useTheme } from '../constants/theme';

// Scalable language configuration
// Add new languages here easily
export type LanguageCode = 'en' | 'pl';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
  },
  // Easy to add more:
  // {
  //   code: 'de',
  //   name: 'German',
  //   nativeName: 'Deutsch',
  // },
];

type LanguageSelectorProps = {
  variant?: 'full' | 'compact' | 'inline' | 'minimal';
  showLabel?: boolean;
  onLanguageChange?: (language: LanguageCode) => void;
};

const LanguageSelector = ({
  variant = 'full',
  showLabel = true,
  onLanguageChange,
}: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation();
  const { setLanguage } = useLanguageStore();
  const { colors, isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const currentLanguage = i18n.language as LanguageCode;
  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const handleLanguageSelect = async (langCode: LanguageCode) => {
    try {
      await i18n.changeLanguage(langCode);
      await setLanguage(langCode);
      setShowModal(false);
      onLanguageChange?.(langCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // COMPACT VARIANT - For headers/navbars
  if (variant === 'compact') {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.compactButton,
            {
              backgroundColor: isDark ? colors.layer2 : '#F8FAFC',
              borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
            },
          ]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}>
          <Text style={[styles.compactCode, { color: colors.textPrimary }]}>
            {currentLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>
        {renderModal()}
      </>
    );
  }

  // MINIMAL VARIANT - For login screen header
  if (variant === 'minimal') {
    return (
      <>
        <TouchableOpacity
          style={[styles.minimalButton]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.minimalText,
              { color: isDark ? colors.textSecondary : '#64748B' },
            ]}>
            {currentLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>
        {renderModal()}
      </>
    );
  }

  // INLINE VARIANT - For login screen
  if (variant === 'inline') {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.inlineButton,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.05)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            },
          ]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}>
          <Globe
            size={18}
            color={isDark ? colors.textSecondary : '#64748B'}
            strokeWidth={2}
          />
          <Text style={[styles.inlineText, { color: colors.textPrimary }]}>
            {currentLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>
        {renderModal()}
      </>
    );
  }

  // FULL VARIANT - For settings page
  function renderModal() {
    return (
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}>
          <TouchableOpacity
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' },
            ]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isDark ? colors.borderSubtle : '#F1F5F9' },
              ]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('settings.language.select')}
              </Text>
            </View>

            <View style={styles.languageList}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLanguage;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageItem,
                      isSelected && {
                        backgroundColor: isDark
                          ? 'rgba(70, 183, 198, 0.1)'
                          : '#F0F9FA',
                      },
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                    activeOpacity={0.7}>
                    <View style={styles.languageInfo}>
                      <View
                        style={[
                          styles.languageCodeBadge,
                          {
                            backgroundColor: isDark ? colors.layer2 : '#F8FAFC',
                            borderColor: isDark
                              ? colors.borderSubtle
                              : '#E2E8F0',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.languageCode,
                            {
                              color: isDark ? colors.textSecondary : '#64748B',
                            },
                          ]}>
                          {lang.code.toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.languageName,
                          { color: colors.textPrimary },
                        ]}>
                        {lang.nativeName}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check
                        size={20}
                        color={colors.accentPrimary}
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fullButton,
          {
            backgroundColor: isDark ? colors.layer1 : '#FFFFFF',
            borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
          },
        ]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}>
        <View style={styles.fullButtonContent}>
          <View style={styles.fullButtonLeft}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(70, 183, 198, 0.1)'
                    : '#F0F9FA',
                },
              ]}>
              <Globe size={20} color={colors.accentPrimary} strokeWidth={2} />
            </View>
            <View>
              {showLabel && (
                <Text
                  style={[
                    styles.fullButtonLabel,
                    { color: colors.textSecondary },
                  ]}>
                  {t('settings.language.label')}
                </Text>
              )}
              <Text
                style={[styles.fullButtonValue, { color: colors.textPrimary }]}>
                {currentLangConfig.nativeName}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.fullButtonCode, { color: colors.textSecondary }]}>
            {currentLanguage.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
      {renderModal()}
    </>
  );
};

const styles = StyleSheet.create({
  // COMPACT VARIANT
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: 0.5,
  },

  // MINIMAL VARIANT
  minimalButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: 0.5,
  },

  // INLINE VARIANT
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  inlineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },

  // FULL VARIANT
  fullButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  fullButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullButtonLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  fullButtonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  fullButtonCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: 0.5,
  },

  // LANGUAGE CODE BADGE - Industry standard
  languageCodeBadge: {
    width: 44,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Bold' : 'System',
    letterSpacing: 0.8,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp(85),
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  languageList: {
    paddingVertical: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  languageItemSelected: {
    backgroundColor: '#F0F9FA',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
});

export default LanguageSelector;
