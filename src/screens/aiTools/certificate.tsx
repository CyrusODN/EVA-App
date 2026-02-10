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
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
  Vibration,
  ScrollView,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { 
  ClipboardList, 
  Sparkles, 
  Bookmark, 
  Camera, 
  FolderOpen, 
  FileText,
  Search as SearchIcon, 
  X, 
  ChevronRight, 
  FileCheck,
  CheckCircle2,
  Circle,
  ScrollText
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { customToast } from '../../utils/toastMessage';

import { colors } from '../../constants/colors';
import Header from '../../components/header';
import PromptLibrary from '../../components/PromptLibrary';
import { useTheme } from '../../constants/theme';
import { sessionStorage, Session, SessionType, SessionStatus } from '../../utils/sessionStorage';
import { getEvents } from '../../services/authService';
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
import dischargeService from '../../services/dischargeService';


const PRIMARY_COLOR = '#46B7C6';

const Certificate = () => {
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
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [renamingSummaryId, setRenamingSummaryId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisits, setSelectedVisits] = useState<Session[]>([]);

  // Check if first time user on mount
  useEffect(() => {
    checkFirstTimeUser();
    loadSavedSummaries();
    return () => {
      // Clear generated summary when leaving the screen
      setGeneratedSummary('');
    };
  }, []);

  const loadSavedSummaries = async () => {
    try {
      const stored = await AsyncStorage.getItem('saved_certificates');
      if (stored) {
        setSavedSummaries(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading saved summaries:', error);
    }
  };

  const saveSummariesToStorage = async (summaries: SavedSummary[]) => {
    try {
      await AsyncStorage.setItem('saved_certificates', JSON.stringify(summaries));
    } catch (error) {
      console.log('Error saving summaries to storage:', error);
    }
  };

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('certificate_welcome_seen');
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
      await AsyncStorage.setItem('certificate_welcome_seen', 'true');
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
    fileName?: string,
    mimeType?: string
  ) => {
    const newObs: Observation & { mimeType?: string } = {
      id: Date.now().toString(),
      type,
      content,
      uri,
      fileName,
      mimeType,
      timestamp: new Date().toISOString(),
      status: 'done', // Files are now marked as done immediately since we don't do local OCR
    };

    setObservations(prev => [...prev, newObs]);
    triggerHaptic('notification');

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleDeleteObservation = (id: string) => {
    setObservations(prev => prev.filter(obs => obs.id !== id));
    triggerHaptic('impact');
  };


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
        addObservation(
          'image', 
          '', 
          result.assets[0].uri, 
          result.assets[0].fileName,
          result.assets[0].type
        );
      }
    } catch (error) {
      console.log('Camera error', error);
      Alert.alert('Camera unavailable', 'Unable to access camera.');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        addObservation(
          'image', 
          '', 
          result.assets[0].uri, 
          result.assets[0].fileName,
          result.assets[0].type
        );
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
        addObservation(
          'file', 
          '', 
          result[0].uri, 
          result[0].name || 'document.pdf',
          result[0].type || undefined
        );
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
    if (observations.length === 0 && selectedVisits.length === 0) {
      Alert.alert('No Data', 'Please add medical notes or select visits first.');
      return;
    }

    triggerHaptic('impact');
    setIsSynthesizing(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const eventIds = selectedVisits.map(v => v.sessionId).filter(id => !!id) as string[];
      const observationsText = observations
        .filter(o => o.type === 'text')
        .map(o => o.content)
        .join('\n');
      const certType = 'medical-report';

      // Use FormData for binary upload
      const formData = new FormData();
      formData.append('observations', observationsText);
      formData.append('certificateType', certType);

      if (eventIds.length > 0) {
        eventIds.forEach(id => formData.append('eventIds', id));
      }

      // Add binary documents
      observations.forEach(obs => {
        if ((obs.type === 'image' || obs.type === 'file') && obs.uri) {
          formData.append('documents', {
            uri: obs.uri,
            type: (obs as any).mimeType || (obs.type === 'image' ? 'image/jpeg' : 'application/pdf'),
            name: obs.fileName || (obs.type === 'image' ? 'photo.jpg' : 'document.pdf'),
          } as any);
        }
      });

      console.log('[Certificate] Starting generation with FormData payload:');
      // For logging FormData in React Native
      const logData: any = {};
      (formData as any)._parts?.forEach(([key, value]: [string, any]) => {
        if (key === 'documents') {
          logData[key] = logData[key] || [];
          logData[key].push({ name: value.name, type: value.type, uri: value.uri });
        } else {
          logData[key] = value;
        }
      });
      console.log('[Certificate] Payload Details:', JSON.stringify(logData, null, 2));

      const response = await dischargeService.generateCertificate(
        formData,
        token || undefined
      );

      console.log('[Certificate] API Response received:', {
        success: response.data?.success,
        hasContent: !!response.data?.data?.certificateContent,
      });

      if (response.data?.success) {
        setGeneratedSummary(response.data.data.certificateContent);
      } else {
        throw new Error(response.data?.message || 'Generation failed');
      }

      setIsSynthesizing(false);
      setShowSynthesis(true);
      triggerHaptic('notification');
    } catch (error: any) {
      console.error('[Certificate] Error generating certificate:', error);
      Alert.alert('Generation Error', error.message || 'Failed to generate medical certificate.');
      setIsSynthesizing(false);
    }
  };

  const handleSaveSummary = () => {
    if (!generatedSummary.trim()) return;
    setSaveNameInput(`Medical Certificate ${savedSummaries.length + 1}`);
    setRenamingSummaryId(null);
    
    // Close the preview modal first to avoid nested modal issues on iOS
    setShowSynthesis(false);
    
    // Delay opening the save dialog to allow the first modal to close
    setTimeout(() => {
      setShowSaveDialog(true);
    }, 400);
  };

  const handleCopy = () => {
    if (!generatedSummary.trim()) return;
    triggerHaptic('impact');
    Clipboard.setString(generatedSummary);
    customToast('success', 'Certificate copied.');
  };

  const handleSelectSavedSummary = (summary: SavedSummary) => {
    setGeneratedSummary(summary.content);
    setShowSynthesis(true);
    setShowSavedSummaries(false);
  };

  const handleConfirmSaveName = async () => {
    const name = saveNameInput.trim();
    if (!name) {
      Alert.alert(
        t('certificateAssistant.savedSummaries.nameRequiredTitle'),
        t('certificateAssistant.savedSummaries.nameRequiredMessage')
      );
      return;
    }

    // Capture state values before clearing
    const currentRenamingId = renamingSummaryId;
    const currentGeneratedSummary = generatedSummary;
    const currentSavedSummaries = [...savedSummaries];

    // 1. Close the dialog first to unblock UI
    setShowSaveDialog(false);
    
    // Give modal time to animate out
    setTimeout(async () => {
      let updated: SavedSummary[] = [];

      if (currentRenamingId) {
        updated = currentSavedSummaries.map(item => 
          item.id === currentRenamingId ? { ...item, title: name } : item
        );
        customToast('success', t('certificateAssistant.savedSummaries.savedSuccess') || 'Saved successfully');
      } else {
        const newSummary: SavedSummary = {
          id: Date.now().toString(),
          title: name,
          createdAt: new Date().toISOString(),
          content: currentGeneratedSummary,
        };
        updated = [newSummary, ...currentSavedSummaries];
        triggerHaptic('notification');
        customToast('success', t('certificateAssistant.savedSummaries.savedSuccess') || 'Saved successfully');
      }

      // Update state
      setSavedSummaries(updated);
      
      // Save in background
      saveSummariesToStorage(updated);
      
      // Reset dialog state
      setSaveNameInput('');
      setRenamingSummaryId(null);
    }, 400);
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
    triggerHaptic('notification');
  };

  const handleSelectPrompt = (prompt: CustomPrompt) => {
    setShowPromptLibrary(false);
  };

  const handleDeletePrompt = (id: string) => {
    setCustomPrompts(prev => prev.filter(p => p.id !== id));
  };

  const handleRenameSummary = (id: string, currentTitle: string) => {
    setRenamingSummaryId(id);
    setSaveNameInput(currentTitle);
    
    // Close the list modal first
    setShowSavedSummaries(false);
    
    // Delay opening the save dialog
    setTimeout(() => {
      setShowSaveDialog(true);
    }, 400);
  };

  const handleImportVisit = () => {
    setShowVisitModal(true);
  };

  const handleSelectVisits = (sessions: Session[]) => {
    console.log('[Certificate] Visits selected:', sessions.map(s => s.title));
    setSelectedVisits(sessions);
    triggerHaptic('notification');
  };

  const handleRemoveVisit = (visitId: string) => {
    console.log('[Certificate] Removing visit:', visitId);
    setSelectedVisits(prev => prev.filter(v => v.id !== visitId));
    triggerHaptic('impact');
  };

  const handleDeleteSummary = (id: string, title: string) => {
    Alert.alert(
      t('certificateAssistant.savedSummaries.deleteTitle'),
      t('certificateAssistant.savedSummaries.deleteMessage'),
      [
        { text: t('certificateAssistant.actions.cancel'), style: 'cancel' },
        {
          text: t('certificateAssistant.savedSummaries.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            const updatedSummaries = savedSummaries.filter(summary => summary.id !== id);
            setSavedSummaries(updatedSummaries);
            await saveSummariesToStorage(updatedSummaries);
            customToast('success', 'Deleted successfully');
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
            title={t('certificateAssistant.headerTitle')}
            subtitle={t('certificateAssistant.headerSubtitle')}
            onLeftPress={handleBackPress}
            icon={ClipboardList}
            showIcon={false}
            backgroundColor={DYNAMIC_THEME.background}
            showBorder={true}
            textColor={PRIMARY_COLOR}
          />
          <View style={styles.headerRightButtons}>
{/* 
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowPromptLibrary(true)}
            >
              <Sparkles size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            */}
            {generatedSummary.length > 0 && (
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={() => {
                  triggerHaptic('impact');
                  setShowSynthesis(true);
                }}
              >
                <ScrollText size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            )}
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

        {/* Imported Visit Banner */}
        {selectedVisits.length > 0 && (
          <View style={[styles.visitBanner, { backgroundColor: DYNAMIC_THEME.surface, borderBottomColor: DYNAMIC_THEME.border }]}>
            <View style={{ gap: 12 }}>
              {selectedVisits.map((visit) => (
                <View key={visit.id} style={styles.visitBannerContent}>
                  <View style={styles.visitBannerTextContainer}>
                    <Text style={[styles.visitBannerTitle, { color: DYNAMIC_THEME.text }]} numberOfLines={1}>
                      {visit.title}
                    </Text>
                    <Text style={[styles.visitBannerDate, { color: DYNAMIC_THEME.textSecondary }]}>
                      {new Date(visit.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  
                  <View style={styles.visitBannerChips}>
                    {visit.noteGenerationMeta?.visitTypeLabel && (
                      <View style={[styles.visitChip, { backgroundColor: isDark ? 'rgba(70, 183, 198, 0.1)' : '#F0F9FA' }]}>
                        <Text style={[styles.visitChipText, { color: PRIMARY_COLOR }]}>{visit.noteGenerationMeta.visitTypeLabel}</Text>
                      </View>
                    )}
                    {visit.noteGenerationMeta?.specializationLabel && (
                      <View style={[styles.visitChip, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#F5F3FF' }]}>
                        <Text style={[styles.visitChipText, { color: '#8B5CF6' }]}>{visit.noteGenerationMeta.specializationLabel}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => handleRemoveVisit(visit.id)} style={styles.visitBannerClose}>
                    <X size={18} color={DYNAMIC_THEME.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Timeline with Type Selection Header */}
        <ObservationTimeline
          items={observations}
          HeaderComponent={null}
          emptyState={{
            title: t('certificateAssistant.emptyState.title'),
            subtitle: t('certificateAssistant.emptyState.subtitle'),
          }}
          primaryColor={PRIMARY_COLOR}
          scrollViewRef={scrollViewRef}
          onDelete={handleDeleteObservation}
          statusTexts={{
            analyzingPixelData: t('certificateAssistant.status.analyzingPixelData'),
            analyzingDocument: t('certificateAssistant.status.analyzingDocument'),
          }}
        />

        {/* Generate Button (Floating) */}
        {(observations.length > 0 || selectedVisits.length > 0) && 
         !isSynthesizing && 
         !observations.some(obs => obs.status === 'processing') && (
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
              <Text style={styles.generateText}>{t('certificateAssistant.actions.generate') || 'Generate Certificate'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Overlay for Synthesis */}
        {isSynthesizing && (
          <View style={styles.synthesizingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={[styles.synthesizingText, { color: PRIMARY_COLOR }]}>
              {t('certificateAssistant.status.generating') || 'Generating medical certificate...'}
            </Text>
          </View>
        )}

        {/* Input Bar */}
        <SmartInputBar
          inputText={inputText}
          onChangeText={setInputText}
          onSendText={handleSendText}
          onPlusPress={handlePlusPress}
          placeholder={t('certificateAssistant.inputBar.placeholder')}
          insets={insets}
          primaryColor={PRIMARY_COLOR}
        />
      </View>

      {/* Summary View Modal */}
      <SummaryView
        visible={showSynthesis}
        onClose={() => setShowSynthesis(false)}
        summary={generatedSummary}
        onSave={handleSaveSummary}
        onCopy={handleCopy}
        onExport={() => Alert.alert('Export PDF')}
        title={t('certificateAssistant.savedSummaries.certificateTitle') || "Medical Certificate"}
        primaryColor={PRIMARY_COLOR}
        saveLabel={t('certificateAssistant.savedSummaries.save')}
      />

      {/* Saved Summaries Modal */}
      <SavedDocumentsList
        visible={showSavedSummaries}
        onClose={() => setShowSavedSummaries(false)}
        items={savedSummaries}
        onSelectItem={handleSelectSavedSummary}
        onRename={handleRenameSummary}
        onDelete={handleDeleteSummary}
        title={t('certificateAssistant.savedSummaries.title')}
        emptyText={t('certificateAssistant.savedSummaries.empty')}
        renameText={t('certificateAssistant.savedSummaries.rename')}
        deleteText={t('certificateAssistant.savedSummaries.delete')}
        cancelText={t('certificateAssistant.actions.cancel')}
      />

      {/* Prompt Library with Magic Creator */}
      <PromptLibrary
        visible={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        prompts={customPrompts}
        selectedPromptId={null}
        onSelectPrompt={handleSelectPrompt}
        onDeletePrompt={handleDeletePrompt}
        onSavePrompt={handleSaveMagicTemplate}
      />

      {/* Welcome Modal - First Time User */}
      <WelcomeModal
        visible={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        title={t('certificateAssistant.welcomeModal.title')}
        description={t('certificateAssistant.welcomeModal.description')}
        buttonText={t('certificateAssistant.welcomeModal.button')}
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
                      setTimeout(() => handleImportVisit(), 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentOptionIcon, { backgroundColor: 'rgba(70, 183, 198, 0.15)' }]}>
                      <FileCheck size={24} color={PRIMARY_COLOR} strokeWidth={2} />
                    </View>
                    <Text style={[styles.attachmentOptionLabel, { color: DYNAMIC_THEME.text }]}>{t('consultChat.attachOptions.importVisit') || 'Import from Visits'}</Text>
                  </TouchableOpacity>

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
                    <Text style={[styles.attachmentOptionLabel, { color: DYNAMIC_THEME.text }]}>{t('certificateAssistant.actions.files')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attachmentOption, { backgroundColor: DYNAMIC_THEME.surface }]}
                    onPress={() => {
                      setShowAttachmentModal(false);
                      setTimeout(() => handleScan(), 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentOptionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Camera size={24} color="#10B981" strokeWidth={2} />
                    </View>
                    <Text style={[styles.attachmentOptionLabel, { color: DYNAMIC_THEME.text }]}>{t('certificateAssistant.actions.scanDocuments')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.attachmentOption, { backgroundColor: DYNAMIC_THEME.surface }]}
                    onPress={() => {
                      setShowAttachmentModal(false);
                      setTimeout(() => handleGallery(), 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attachmentOptionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <FolderOpen size={24} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <Text style={[styles.attachmentOptionLabel, { color: DYNAMIC_THEME.text }]}>{t('certificateAssistant.actions.gallery')}</Text>
                  </TouchableOpacity>
                  
                </View>

                <TouchableOpacity style={[styles.attachmentCancelButton, { backgroundColor: DYNAMIC_THEME.surfaceAlt }]} onPress={() => setShowAttachmentModal(false)}>
                  <Text style={[styles.attachmentCancelText, { color: DYNAMIC_THEME.textSecondary }]}>{t('certificateAssistant.actions.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Visit Selection Modal */}
      <VisitSelectionModal
        visible={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        onSelectVisits={handleSelectVisits}
        selectedVisitIds={selectedVisits.map(v => v.id)}
        dynamicTheme={DYNAMIC_THEME}
      />

      {/* Save/Rename Dialog */}
      <Modal 
        visible={showSaveDialog} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowSaveDialog(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSaveDialog(false)}>
          <View style={[styles.dialogOverlay, { backgroundColor: DYNAMIC_THEME.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.dialogCard, { backgroundColor: DYNAMIC_THEME.background, borderColor: DYNAMIC_THEME.border }]}>
                <Text style={[styles.dialogTitle, { color: DYNAMIC_THEME.text }]}>
                  {renamingSummaryId
                    ? t('certificateAssistant.savedSummaries.renameTitle')
                    : t('certificateAssistant.savedSummaries.nameTitle')}
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
                  placeholder={t('certificateAssistant.savedSummaries.namePlaceholder')}
                  placeholderTextColor={isDark ? themeColors.textMuted : colors.onSurfaceVariant}
                  value={saveNameInput}
                  onChangeText={setSaveNameInput}
                  autoFocus
                />
                <View style={styles.dialogActions}>
                  <TouchableOpacity onPress={() => setShowSaveDialog(false)}>
                    <Text style={[styles.dialogCancel, { color: DYNAMIC_THEME.textSecondary }]}>{t('certificateAssistant.actions.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConfirmSaveName}>
                    <Text style={styles.dialogConfirm}>
                      {renamingSummaryId
                        ? t('certificateAssistant.savedSummaries.renameConfirm')
                        : t('certificateAssistant.savedSummaries.saveConfirm')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Certificate;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const VisitSelectionModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectVisits: (sessions: Session[]) => void;
  selectedVisitIds: string[];
  dynamicTheme: any;
}> = ({ visible, onClose, onSelectVisits, selectedVisitIds, dynamicTheme }) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientSessions, setPatientSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedVisitIds);

  useEffect(() => {
    if (visible) {
      setLocalSelectedIds(selectedVisitIds);
      loadPatientSessions();
    }
  }, [visible, selectedVisitIds]);

  const toggleSelection = (id: string) => {
    setLocalSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selected = patientSessions.filter(s => localSelectedIds.includes(s.id));
    onSelectVisits(selected);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      loadPatientSessions();
    }
  }, [visible]);

  const loadPatientSessions = async () => {
    setIsLoading(true);
    try {
      const response = await getEvents();
      console.log('[VisitSelectionModal] API response status:', response.status);
      
      // The API returns { data: { docs: [...] } }
      if (response.data && response.data.data && Array.isArray(response.data.data.docs)) {
        console.log('[VisitSelectionModal] Fetched sessions count:', response.data.data.docs.length);
        // Map backend events to Session interface
        const sessions: Session[] = response.data.data.docs.map((event: any) => {
          // Determine status based on provided backend flags
          let status: SessionStatus = 'new';
          if (event.notes && event.notes.length > 0) {
            status = 'completed';
          } else if (event.isTranscribed) {
            status = 'transcribed';
          } else if (event.recordingUrl) {
            status = 'recorded';
          }

          const firstNote = event.notes && event.notes.length > 0 ? event.notes[0] : null;

          return {
            id: event._id,
            sessionId: event._id,
            title: event.title || 'Untitled Visit',
            type: (event.type as SessionType) || 'patient',
            date: event.date || event.createdAt,
            status,
            hasRecording: !!event.recordingUrl,
            hasTranscription: !!event.isTranscribed,
            duration: event.transcription?.duration?.toString() || null,
            transcriptText: event.transcription?.text || null,
            generatedNotes: firstNote?.content || null,
            noteGenerationMeta: {
              generationMode: firstNote?.type || 'standard',
              specializationLabel: firstNote?.specialization || '',
              visitTypeLabel: firstNote?.visitType || '',
            },
          };
        });

        const filteredByStatus = sessions.filter(s => 
          s.type === 'patient' && 
          (s.status === 'transcribed' || s.status === 'completed')
        );
        
        console.log('[VisitSelectionModal] Filtered sessions count:', filteredByStatus.length);
        filteredByStatus.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPatientSessions(filteredByStatus);
      }
    } catch (error) {
      console.error('[VisitSelectionModal] Error loading sessions from API:', error);
      // Fallback to local storage if API fails
      try {
        console.log('[VisitSelectionModal] Attempting local storage fallback...');
        const localSessions = await sessionStorage.getSessionsByType('patient');
        const filtered = localSessions.filter(s => s.status === 'transcribed' || s.status === 'completed');
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPatientSessions(filtered);
      } catch (localError) {
        console.error('[VisitSelectionModal] Local fallback failed:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = patientSessions.filter(session => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.status.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const locale = i18n.language || 'en-US';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('status.completed') || 'Completed';
      case 'transcribed': return t('status.transcribed') || 'Transcribed';
      default: return status;
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet" 
      onRequestClose={onClose}
    >
      <View style={[styles.visitModalContainer, { backgroundColor: dynamicTheme.background }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={[styles.visitModalHeader, { borderBottomColor: dynamicTheme.border }]}>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <X size={24} color={dynamicTheme.text} />
            </TouchableOpacity>
            <Text style={[styles.visitModalTitle, { color: dynamicTheme.text }]}>{t('consultChat.visitSelection.title') || 'Select Visit'}</Text>
            <TouchableOpacity onPress={handleConfirm} style={{ padding: 8 }}>
              <Text style={{ color: '#46B7C6', fontWeight: '700', fontSize: 16 }}>{t('common.done') || 'Done'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.visitSearchContainer, { backgroundColor: dynamicTheme.surfaceAlt || dynamicTheme.surface }]}>
            <SearchIcon size={20} color={dynamicTheme.textSecondary} />
            <TextInput
              style={[styles.visitSearchInput, { color: dynamicTheme.text }]}
              placeholder={t('consultChat.visitSelection.searchPlaceholder') || 'Search visits...'}
              placeholderTextColor={dynamicTheme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={{ flex: 1 }}>
            {isLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#46B7C6" size="large" />
              </View>
            ) : (
              <ScrollView 
                style={styles.visitsList}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={true}
              >
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.visitItem, 
                        { 
                          backgroundColor: dynamicTheme.surfaceAlt || dynamicTheme.surface,
                          borderColor: dynamicTheme.border
                        }
                      ]}
                      onPress={() => toggleSelection(session.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.visitIconContainer, { backgroundColor: 'rgba(70, 183, 198, 0.1)' }]}>
                        <FileCheck size={20} color="#46B7C6" />
                      </View>
                      <View style={styles.visitInfo}>
                        <Text style={[styles.visitPatientName, { color: dynamicTheme.text }]}>{session.title}</Text>
                        <Text style={[styles.visitDetails, { color: dynamicTheme.textSecondary }]}>
                          {formatDate(session.date)} • {getStatusLabel(session.status)}
                        </Text>
                      </View>
                      {localSelectedIds.includes(session.id) ? (
                        <CheckCircle2 size={22} color="#46B7C6" />
                      ) : (
                        <Circle size={22} color={dynamicTheme.border} />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noVisitsContainer}>
                    <FileCheck size={48} color={dynamicTheme.border} />
                    <Text style={{ color: dynamicTheme.textSecondary, marginTop: 16 }}>{t('common.noRecords') || 'No visits found'}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

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

  // Visit Banner Styles
  visitBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  visitBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visitBannerTextContainer: {
    flex: 1,
    gap: 2,
  },
  visitBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  visitBannerDate: {
    fontSize: 13,
  },
  visitBannerChips: {
    flexDirection: 'row',
    gap: 6,
  },
  visitChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visitChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  visitBannerClose: {
    padding: 4,
  },

  // Visit Modal Styles
  visitModalContainer: {
    flex: 1,
  },
  visitModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  visitModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  visitSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  visitSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  visitsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
  },
  visitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitInfo: {
    flex: 1,
  },
  visitPatientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  visitDetails: {
    fontSize: 13,
  },
  noVisitsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  // Type Selector Styles
  typeSelectorWrapper: {
    paddingVertical: 1,
    paddingBottom: 12,
  },
  typeSelectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: (wp(90) - 8) / 2, // Accounting for ObservationTimeline's wp(5) horizontal padding on both sides
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeTextContainer: {
    flex: 1,
  },
  typeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 0,
  },
  typeCardSubtitle: {
    fontSize: 10,
  },
});
