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
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { FileText, Sparkles, Bookmark, Camera, FolderOpen } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dischargeService from '../../services/dischargeService';
import { customToast } from '../../utils/toastMessage';
import Clipboard from '@react-native-clipboard/clipboard';

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
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [renamingSummaryId, setRenamingSummaryId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // Check if first time user on mount
  useEffect(() => {
    checkFirstTimeUser();
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setIsLoadingPrompts(true);
    console.log('[Discharge] Fetching prompts...');
    try {
      const response = await dischargeService.getPrompts({
        toolType: 'discharge',
        page: 1,
        limit: 100,
      });
      
      console.log('[Discharge] API Raw Response Data:', JSON.stringify(response.data, null, 2));

      let promptsData: any[] = [];
      
      // Handle different possible response structures
      if (response.data.success) {
        if (response.data.data?.docs) {
          promptsData = response.data.data.docs;
          console.log('[Discharge] Found prompts in data.docs');
        } else if (Array.isArray(response.data.data)) {
          promptsData = response.data.data;
          console.log('[Discharge] Found prompts directly in data');
        } else if (Array.isArray(response.data)) {
          // This case is unlikely given the ApiResponse wrapper
          promptsData = (response.data as any);
          console.log('[Discharge] Found prompts directly in response.data');
        }
      }

      if (promptsData.length > 0) {
        const formattedPrompts: CustomPrompt[] = promptsData.map((p: any) => ({
          id: p._id || p.id,
          title: p.title || 'Untitled Prompt',
          content: p.content || p.instructions || '',
          createdAt: p.createdAt || new Date().toISOString(),
        }));
        
        console.log('[Discharge] Successfully formatted prompts:', formattedPrompts.length);
        setCustomPrompts(formattedPrompts);
        
        // Auto-select the first prompt if none selected
        if (formattedPrompts.length > 0 && !selectedPromptId) {
          console.log('[Discharge] Auto-selecting first prompt:', formattedPrompts[0].id);
          setSelectedPromptId(formattedPrompts[0].id);
        }
      } else {
        console.log('[Discharge] No prompts found in response');
        setCustomPrompts([]);
      }
    } catch (error) {
      console.error('[Discharge] Error fetching prompts:', error);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

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
    setShowAttachmentModal(true);
  };

  const handleGenerateSummary = async () => {
    if (observations.length === 0) {
      Alert.alert('No Data', 'Please add observations or scan documents first.');
      return;
    }

    if (!selectedPromptId) {
      Alert.alert(
        t('dischargeAssistant.promptRequired.title'),
        t('dischargeAssistant.promptRequired.message')
      );
      return;
    }

    triggerHaptic('impact');
    setIsSynthesizing(true);

    try {
      // Format observations for API
      const formattedObservations = observations.map(obs => ({
        content: obs.content || '',
        categories: [], // Add categories if available in your observation model
        tags: [], // Add tags if available in your observation model
        timestamp: obs.timestamp,
      }));

      console.log('[Discharge] Generating summary with:', {
        observationsCount: formattedObservations.length,
        promptId: selectedPromptId,
      });

      const response = await dischargeService.generateSummary({
        observations: formattedObservations,
        promptId: selectedPromptId,
      });

      console.log('[Discharge] Summary generation response:', response.data);

      if (response.data.success && response.data.data) {
        const { summaryId, summary } = response.data.data;
        
        // Add prompt header for context
        const promptHeader = selectedPrompt
          ? `**Prompt Applied:** ${selectedPrompt.title}\n\n`
          : '';
        
        setGeneratedSummary(`${promptHeader}${summary}`);
        setShowSynthesis(true);
        triggerHaptic('notification');
        
        console.log('[Discharge] Summary generated successfully. ID:', summaryId);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('[Discharge] Error generating summary:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to generate summary. Please try again.';
      
      Alert.alert(
        t('common.error'),
        errorMessage
      );
    } finally {
      setIsSynthesizing(false);
    }
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

  const handleDeletePrompt = async (id: string) => {
    try {
      const response = await dischargeService.deletePrompt(id);
      if (response.data.success) {
        setCustomPrompts(prev => prev.filter(p => p.id !== id));
        if (selectedPromptId === id) setSelectedPromptId(null);
        customToast('success', 'Template deleted successfully');
        console.log('Template deleted successfully',response.data);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      Alert.alert('Error', 'Failed to delete template. Please try again.');
    }
  };

  const handleRenameSummary = (id: string, currentTitle: string) => {
    setRenamingSummaryId(id);
    setSaveNameInput(currentTitle);
    setShowSaveDialog(true);
  };

  const handleDeleteSummary = (id: string, title: string) => {
    Alert.alert(
      t('dischargeAssistant.summaryHistory.deleteTitle'),
      t('dischargeAssistant.summaryHistory.deleteMessage').replace('{{title}}', title),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await dischargeService.deleteSummary(id);
              if (response.data.success) {
                setSavedSummaries(prev => prev.filter(s => s.id !== id));
                customToast('success', t('common.success'), t('dischargeAssistant.summaryHistory.deleteSuccess'));
              }
            } catch (error) {
              console.log('Error deleting summary:', error);
              customToast('error', t('common.error'), t('dischargeAssistant.summaryHistory.deleteError'));
            }
          }
        },
      ]
    );
  };

  const handleDeleteObservation = (id: string) => {
    setObservations(prev => prev.filter(obs => obs.id !== id));
    triggerHaptic('impact');
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
    inactive: isDark ? themeColors.textMuted : '#9CA3AF',
    brand: PRIMARY_COLOR,
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
          onDelete={handleDeleteObservation}
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
        onCopy={() => {
          Clipboard.setString(generatedSummary);
          triggerHaptic('impact');
          customToast('success', 'Copied', 'Summary copied to clipboard');
        }}
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
        isLoading={isLoadingPrompts}
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

      {/* Attachment Modal */}
      <Modal visible={showAttachmentModal} transparent animationType="fade" onRequestClose={() => setShowAttachmentModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAttachmentModal(false)}>
          <View style={styles.attachmentModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.attachmentModalContent, { backgroundColor: DYNAMIC_THEME.background }]}>
                <View style={styles.attachmentModalHeader}>
                  <View style={[styles.attachmentModalHandle, { backgroundColor: DYNAMIC_THEME.border }]} />
                </View>
                
                <View style={styles.attachmentOptionsContainer}>
                  <TouchableOpacity
                    style={[styles.attachmentOption, { backgroundColor: DYNAMIC_THEME.surface }]}
                    onPress={() => {
                      setShowAttachmentModal(false);
                      setTimeout(() => handleFile(), 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentOptionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <FileText size={24} color="#8B5CF6" strokeWidth={2} />
                    </View>
                    <Text style={[styles.attachmentOptionLabel, { color: DYNAMIC_THEME.text }]}>{t('dischargeAssistant.actions.files')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.attachmentOption, 
                      { backgroundColor: DYNAMIC_THEME.surface, opacity: 0.7 }
                    ]}
                    onPress={() => {}}
                    activeOpacity={1}
                    disabled={true}
                  >
                    <View style={[styles.attachmentOptionIcon, { backgroundColor: DYNAMIC_THEME.surfaceAlt }]}>
                      <Camera size={24} color={DYNAMIC_THEME.inactive} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.attachmentOptionLabel, { color: DYNAMIC_THEME.inactive }]}>{t('dischargeAssistant.actions.scanDocuments')}</Text>
                      <Text style={{ fontSize: 12, color: DYNAMIC_THEME.brand, fontWeight: '600' }}>Coming soon</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.attachmentOption, 
                      { backgroundColor: DYNAMIC_THEME.surface, opacity: 0.7 }
                    ]}
                    onPress={() => {}}
                    activeOpacity={1}
                    disabled={true}
                  >
                    <View style={[styles.attachmentOptionIcon, { backgroundColor: DYNAMIC_THEME.surfaceAlt }]}>
                      <FolderOpen size={24} color={DYNAMIC_THEME.inactive} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.attachmentOptionLabel, { color: DYNAMIC_THEME.inactive }]}>{t('dischargeAssistant.actions.gallery')}</Text>
                      <Text style={{ fontSize: 12, color: DYNAMIC_THEME.brand, fontWeight: '600' }}>Coming soon</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.attachmentCancelButton, { backgroundColor: DYNAMIC_THEME.surfaceAlt }]} onPress={() => setShowAttachmentModal(false)}>
                  <Text style={[styles.attachmentCancelText, { color: DYNAMIC_THEME.textSecondary }]}>{t('dischargeAssistant.actions.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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

  // Attachment Modal styles
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(2),
  },
  attachmentModalHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  attachmentModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  attachmentOptionsContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    gap: 12,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  attachmentOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  attachmentCancelButton: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  attachmentCancelText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});
