/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  ActionSheetIOS,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { FileText, Sparkles, Bookmark } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../../constants/colors';
import Header from '../../components/header';
import PromptLibrary from '../../components/PromptLibrary';
import { useTheme } from '../../constants/theme';
import {
  ObservationTimeline,
  SmartInputBar,
  WelcomeModal,
  SummaryView,
  SavedDocumentsList,
  type Observation,
  type SavedSummary,
  type CustomPrompt,
} from '../../components/documentAssistant';

const INITIAL_PROMPTS: CustomPrompt[] = [
  {
    id: 'p1',
    title: 'Primary Care Summary',
    content: 'Summarize for primary care physician in under 200 words.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    title: 'Medication Changes Focus',
    content: 'Focus only on medication changes and discharge plan.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    title: 'Short Discharge',
    content: 'Keep it concise, bullet format, highlight follow-up.',
    createdAt: new Date().toISOString(),
  },
];

const PRIMARY_COLOR = '#46B7C6';

const Discharge = () => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);

  // State
  const [observations, setObservations] = useState<Observation[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([]);
  const [showSavedSummaries, setShowSavedSummaries] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>(INITIAL_PROMPTS);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [renamingSummaryId, setRenamingSummaryId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check if first time user on mount
  useEffect(() => {
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('discharge_welcome_seen');
      if (!hasSeenWelcome) {
        setTimeout(() => {
          setShowWelcomeModal(true);
        }, 500);
      }
    } catch (error) {
      console.log('Error checking first time user:', error);
    }
  };

  const handleCloseWelcomeModal = async () => {
    try {
      await AsyncStorage.setItem('discharge_welcome_seen', 'true');
      setShowWelcomeModal(false);
    } catch (error) {
      console.log('Error saving welcome modal state:', error);
      setShowWelcomeModal(false);
    }
  };

  // Haptics Helper
  const triggerHaptic = (type: 'impact' | 'notification' = 'impact') => {
    if (type === 'impact') {
      Vibration.vibrate(10);
    } else {
      Vibration.vibrate(50);
    }
  };

  // Handlers
  const handleBackPress = () => {
    if (showSynthesis) {
      setShowSynthesis(false);
    } else {
      navigation.goBack();
    }
  };

  const addObservation = (
    type: 'text' | 'image' | 'file',
    content: string,
    uri?: string,
    fileName?: string
  ) => {
    const newObs: Observation = {
      id: Date.now().toString(),
      type,
      content,
      uri,
      fileName,
      timestamp: new Date().toISOString(),
      status: type === 'text' ? 'done' : 'processing',
    };

    setObservations(prev => [...prev, newObs]);
    triggerHaptic('notification');

    // Simulate OCR/Processing for non-text
    if (type !== 'text') {
      setTimeout(() => {
        setObservations(prev =>
          prev.map(obs =>
            obs.id === newObs.id
              ? {
                  ...obs,
                  status: 'done',
                  content:
                    obs.content ||
                    (type === 'image'
                      ? 'Extracted clinical data...'
                      : 'Analyzed document content...'),
                }
              : obs
          )
        );
      }, 2500);
    }

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const selectedPrompt = customPrompts.find(p => p.id === selectedPromptId) || null;

  const handleSendText = () => {
    if (!inputText.trim()) return;
    triggerHaptic('impact');
    addObservation('text', inputText.trim());
    setInputText('');
  };

  const handleScan = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        presentationStyle: 'fullScreen',
      });

      if (result.assets && result.assets[0]) {
        addObservation('image', '', result.assets[0].uri, result.assets[0].fileName);
      }
    } catch (error) {
      console.log('Camera error', error);
      Alert.alert('Camera unavailable', 'Using mock image for demo.');
      addObservation('image', '', 'https://via.placeholder.com/300', 'monitor_scan.jpg');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        addObservation('image', '', result.assets[0].uri, result.assets[0].fileName);
      }
    } catch (error) {
      console.log('Gallery error', error);
    }
  };

  const handleFile = async () => {
    try {
      const result = await pick({
        type: [types.pdf, types.docx, types.plainText],
      });

      if (result && result[0]) {
        addObservation('file', '', result[0].uri, result[0].name || 'document.pdf');
      }
    } catch (error) {
      console.log('File picker error', error);
    }
  };

  const handlePlusPress = () => {
    triggerHaptic('impact');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('dischargeAssistant.actions.cancel'),
            t('dischargeAssistant.actions.scanDocuments'),
            t('dischargeAssistant.actions.gallery'),
            t('dischargeAssistant.actions.files'),
          ],
          cancelButtonIndex: 0,
          tintColor: PRIMARY_COLOR,
        },
        buttonIndex => {
          if (buttonIndex === 1) handleScan();
          else if (buttonIndex === 2) handleGallery();
          else if (buttonIndex === 3) handleFile();
        }
      );
    } else {
      Alert.alert(
        t('dischargeAssistant.headerTitle'),
        t('dischargeAssistant.inputBar.placeholder'),
        [
          { text: t('dischargeAssistant.actions.scanDocuments'), onPress: handleScan },
          { text: t('dischargeAssistant.actions.gallery'), onPress: handleGallery },
          { text: t('dischargeAssistant.actions.files'), onPress: handleFile },
          { text: t('dischargeAssistant.actions.cancel'), style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const handleGenerateSummary = () => {
    if (observations.length === 0) {
      Alert.alert('No Data', 'Please add observations or scan documents first.');
      return;
    }

    triggerHaptic('impact');
    setIsSynthesizing(true);

    // Simulate AI Generation
    setTimeout(() => {
      const promptHeader = selectedPrompt
        ? `**Prompt Applied**\n${selectedPrompt.title}\n\n`
        : '';
      setGeneratedSummary(`
**DISCHARGE SUMMARY**

${promptHeader}
**Patient Information**
Age: 45 | Gender: Male
Admission Date: ${new Date(Date.now() - 86400000 * 4).toLocaleDateString()}
Discharge Date: ${new Date().toLocaleDateString()}

**Primary Diagnosis**
Acute Exacerbation of COPD
Hypertension, controlled

**Hospital Course**
Patient admitted with shortness of breath and wheezing. Started on IV corticosteroids and nebulizers. O2 saturation improved from 88% to 96% on room air over 48 hours. No fever spikes.

**Procedures**
- Chest X-Ray: Hyperinflation, no consolidation.
- Spirometry: FEV1 65% predicted.

**Discharge Medications**
1. Prednisone 40mg daily x 5 days
2. Albuterol Inhaler 2 puffs q4h prn
3. Lisinopril 10mg daily

**Follow-up**
Follow up with Dr. Smith in Pulmonology in 2 weeks.
      `);
      setIsSynthesizing(false);
      setShowSynthesis(true);
      triggerHaptic('notification');
    }, 2000);
  };

  const handleSaveSummary = () => {
    if (!generatedSummary.trim()) return;
    setSaveNameInput(`Discharge Summary ${savedSummaries.length + 1}`);
    setRenamingSummaryId(null);
    setShowSaveDialog(true);
  };

  const handleSelectSavedSummary = (summary: SavedSummary) => {
    setGeneratedSummary(summary.content);
    setShowSynthesis(true);
    setShowSavedSummaries(false);
  };

  const handleConfirmSaveName = () => {
    const name = saveNameInput.trim();
    if (!name) {
      Alert.alert(
        t('dischargeAssistant.savedSummaries.nameRequiredTitle'),
        t('dischargeAssistant.savedSummaries.nameRequiredMessage')
      );
      return;
    }

    if (renamingSummaryId) {
      setSavedSummaries(prev =>
        prev.map(item => (item.id === renamingSummaryId ? { ...item, title: name } : item))
      );
    } else {
      const newSummary: SavedSummary = {
        id: Date.now().toString(),
        title: name,
        createdAt: new Date().toISOString(),
        content: generatedSummary,
      };
      setSavedSummaries(prev => [newSummary, ...prev]);
      triggerHaptic('notification');
      Alert.alert(t('dischargeAssistant.savedSummaries.savedSuccess'));
    }

    setShowSaveDialog(false);
    setSaveNameInput('');
    setRenamingSummaryId(null);
  };

  const handleSaveMagicTemplate = (template: {
    name: string;
    instructions: string;
    refinedPrompt: string;
  }) => {
    const newPrompt: CustomPrompt = {
      id: Date.now().toString(),
      title: template.name,
      content: template.refinedPrompt,
      createdAt: new Date().toISOString(),
    };
    setCustomPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newPrompt.id);
    triggerHaptic('notification');
  };

  const handleSelectPrompt = (prompt: CustomPrompt) => {
    setSelectedPromptId(prompt.id);
    setShowPromptLibrary(false);
  };

  const handleDeletePrompt = (id: string) => {
    setCustomPrompts(prev => prev.filter(p => p.id !== id));
    if (selectedPromptId === id) setSelectedPromptId(null);
  };

  const handleRenameSummary = (id: string, currentTitle: string) => {
    setRenamingSummaryId(id);
    setSaveNameInput(currentTitle);
    setShowSaveDialog(true);
  };

  const handleDeleteSummary = (id: string, title: string) => {
    Alert.alert(
      t('dischargeAssistant.savedSummaries.deleteTitle'),
      t('dischargeAssistant.savedSummaries.deleteMessage'),
      [
        { text: t('dischargeAssistant.actions.cancel'), style: 'cancel' },
        {
          text: t('dischargeAssistant.savedSummaries.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            setSavedSummaries(prev => prev.filter(summary => summary.id !== id));
          },
        },
      ]
    );
  };

  // Dynamic theme
  const DYNAMIC_THEME = {
    background: isDark ? themeColors.canvas : '#FFFFFF',
    surface: isDark ? themeColors.layer1 : '#F9FAFB',
    surfaceAlt: isDark ? themeColors.layer2 : '#F3F4F6',
    text: isDark ? themeColors.textPrimary : '#111827',
    textSecondary: isDark ? themeColors.textSecondary : '#6B7280',
    border: isDark ? themeColors.borderSubtle : '#E5E5EA',
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: DYNAMIC_THEME.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.headerWrapper}>
          <Header
            title={t('dischargeAssistant.headerTitle')}
            subtitle={t('dischargeAssistant.headerSubtitle')}
            onLeftPress={handleBackPress}
            icon={FileText}
            showIcon={false}
            backgroundColor={DYNAMIC_THEME.background}
            showBorder={true}
            textColor={PRIMARY_COLOR}
          />
          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowPromptLibrary(true)}
            >
              <Sparkles size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowSavedSummaries(true)}>
              <Bookmark size={20} color={PRIMARY_COLOR} />
              {savedSummaries.length > 0 && (
                <View style={[styles.savedBadge, { backgroundColor: isDark ? 'rgba(70, 183, 198, 0.2)' : '#E0F2F5' }]}>
                  <Text style={styles.savedBadgeText}>{savedSummaries.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline */}
        <ObservationTimeline
          items={observations}
          emptyState={{
            title: t('dischargeAssistant.emptyState.title'),
            subtitle: t('dischargeAssistant.emptyState.subtitle'),
          }}
          primaryColor={PRIMARY_COLOR}
          scrollViewRef={scrollViewRef}
          statusTexts={{
            analyzingPixelData: t('dischargeAssistant.status.analyzingPixelData'),
            analyzingDocument: t('dischargeAssistant.status.analyzingDocument'),
          }}
        />

        {/* Generate Button (Floating) */}
        {observations.length > 0 && !isSynthesizing && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                {
                  backgroundColor: PRIMARY_COLOR,
                  ...(isDark ? {
                    shadowColor: PRIMARY_COLOR,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 15,
                  } : {
                    shadowColor: PRIMARY_COLOR,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  })
                }
              ]}
              onPress={handleGenerateSummary}
              activeOpacity={0.9}
            >
              <Sparkles size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.generateText}>Generate Summary</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Overlay for Synthesis */}
        {isSynthesizing && (
          <View style={styles.synthesizingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={[styles.synthesizingText, { color: PRIMARY_COLOR }]}>
              Synthesizing clinical data...
            </Text>
          </View>
        )}

        {/* Input Bar */}
        <SmartInputBar
          inputText={inputText}
          onChangeText={setInputText}
          onSendText={handleSendText}
          onPlusPress={handlePlusPress}
          placeholder={t('dischargeAssistant.inputBar.placeholder')}
          insets={insets}
          primaryColor={PRIMARY_COLOR}
        />
      </View>
      </KeyboardAvoidingView>

      {/* Summary View Modal */}
      <SummaryView
        visible={showSynthesis}
        onClose={() => setShowSynthesis(false)}
        summary={generatedSummary}
        onSave={handleSaveSummary}
        onCopy={() => Alert.alert('Copied')}
        onExport={() => Alert.alert('Export PDF')}
        title="Discharge Summary"
        primaryColor={PRIMARY_COLOR}
        saveLabel={t('dischargeAssistant.savedSummaries.save')}
      />

      {/* Saved Summaries Modal */}
      <SavedDocumentsList
        visible={showSavedSummaries}
        onClose={() => setShowSavedSummaries(false)}
        items={savedSummaries}
        onSelectItem={handleSelectSavedSummary}
        onRename={handleRenameSummary}
        onDelete={handleDeleteSummary}
        title={t('dischargeAssistant.savedSummaries.title')}
        emptyText={t('dischargeAssistant.savedSummaries.empty')}
        renameText={t('dischargeAssistant.savedSummaries.rename')}
        deleteText={t('dischargeAssistant.savedSummaries.delete')}
        cancelText={t('dischargeAssistant.actions.cancel')}
      />

      {/* Prompt Library with Magic Creator */}
      <PromptLibrary
        visible={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        prompts={customPrompts}
        selectedPromptId={selectedPromptId}
        onSelectPrompt={handleSelectPrompt}
        onDeletePrompt={handleDeletePrompt}
        onSavePrompt={handleSaveMagicTemplate}
      />

      {/* Welcome Modal - First Time User */}
      <WelcomeModal
        visible={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        title={t('dischargeAssistant.welcomeModal.title')}
        description={t('dischargeAssistant.welcomeModal.description')}
        buttonText={t('dischargeAssistant.welcomeModal.button')}
        iconColor={PRIMARY_COLOR}
      />

      {/* Save/Rename Dialog */}
      {showSaveDialog && (
        <View style={[styles.dialogOverlay, { backgroundColor: DYNAMIC_THEME.overlay }]}>
          <View style={[styles.dialogCard, { backgroundColor: DYNAMIC_THEME.background, borderColor: DYNAMIC_THEME.border }]}>
            <Text style={[styles.dialogTitle, { color: DYNAMIC_THEME.text }]}>
              {renamingSummaryId
                ? t('dischargeAssistant.savedSummaries.renameTitle')
                : t('dischargeAssistant.savedSummaries.nameTitle')}
            </Text>
            <TextInput
              style={[
                styles.dialogInput,
                {
                  borderColor: DYNAMIC_THEME.border,
                  color: DYNAMIC_THEME.text,
                  backgroundColor: DYNAMIC_THEME.surface,
                }
              ]}
              placeholder={t('dischargeAssistant.savedSummaries.namePlaceholder')}
              placeholderTextColor={isDark ? themeColors.textMuted : colors.onSurfaceVariant}
              value={saveNameInput}
              onChangeText={setSaveNameInput}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setShowSaveDialog(false)}>
                <Text style={[styles.dialogCancel, { color: DYNAMIC_THEME.textSecondary }]}>{t('dischargeAssistant.actions.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmSaveName}>
                <Text style={styles.dialogConfirm}>
                  {renamingSummaryId
                    ? t('dischargeAssistant.savedSummaries.renameConfirm')
                    : t('dischargeAssistant.savedSummaries.saveConfirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Discharge;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
  flex: 1,
},
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerWrapper: {
    position: 'relative',
  },
  headerRightButtons: {
    position: 'absolute',
    right: 16,
    top: 18,
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  savedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  savedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#46B7C6',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: hp(19),
    alignSelf: 'center',
    zIndex: 100,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 6,
  },
  generateText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  synthesizingContainer: {
    position: 'absolute',
    bottom: hp(15),
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
  },
  synthesizingText: {
    fontWeight: '500',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  dialogCancel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogConfirm: {
    fontSize: 14,
    color: '#46B7C6',
    fontWeight: '700',
  },
});
