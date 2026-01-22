/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image as RNImage,
  ActivityIndicator,
  Modal,
  ActionSheetIOS,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ArrowUp,
  X,
  Copy,
  File,
  Sparkles,
  Share,
  Bookmark,
  Save,
  Plus,
  Monitor,
  AlignJustify,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { Vibration } from 'react-native';

import { colors } from '../../constants/colors';
import Header from '../../components/header';

// Types
type ObservationType = 'text' | 'image' | 'file';
type ProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

interface Observation {
  id: string;
  type: ObservationType;
  content: string; // Text content or extracted text
  uri?: string; // For images/files
  fileName?: string;
  timestamp: string;
  status: ProcessingStatus;
}

interface SavedSummary {
  id: string;
  title: string;
  createdAt: string;
  content: string;
}

interface CustomPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

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

// Avatar chatbota
const CHATBOT_AVATAR = 'https://i.imgur.com/rCPznko.jpeg';

// Pulsing AI Logo for empty state
const PulsingAILogo: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, []);

  return (
    <View style={styles.aiLogoContainer}>
      <Animated.View style={[styles.aiLogoInner, { transform: [{ scale: pulseAnim }] }]}>
        <RNImage 
          source={{ uri: CHATBOT_AVATAR }} 
          style={styles.avatarImage}
        />
      </Animated.View>
    </View>
  );
};

const Discharge = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [observations, setObservations] = useState<Observation[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([]);
  const [showSavedSummaries, setShowSavedSummaries] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>(INITIAL_PROMPTS);
  const [showPromptManager, setShowPromptManager] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [promptTitleInput, setPromptTitleInput] = useState('');
  const [promptContentInput, setPromptContentInput] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [renamingSummaryId, setRenamingSummaryId] = useState<string | null>(null);

  // Primary Brand Color
  const PRIMARY_COLOR = '#46B7C6';

  // Haptics Helper
  const triggerHaptic = (type: 'impact' | 'notification' = 'impact') => {
    // Fallback to Vibration since expo-haptics might not be linked
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

  const addObservation = (type: ObservationType, content: string, uri?: string, fileName?: string) => {
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
        setObservations(prev => prev.map(obs =>
          obs.id === newObs.id
            ? { ...obs, status: 'done', content: obs.content || (type === 'image' ? 'Extracted clinical data...' : 'Analyzed document content...') }
            : obs
        ));
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
        },
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
        t('dischargeAssistant.savedSummaries.nameRequiredMessage'),
      );
      return;
    }

    if (renamingSummaryId) {
      setSavedSummaries(prev =>
        prev.map(item =>
          item.id === renamingSummaryId ? { ...item, title: name } : item
        ),
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

  const handleEditPrompt = (prompt: CustomPrompt) => {
    setEditingPromptId(prompt.id);
    setPromptTitleInput(prompt.title);
    setPromptContentInput(prompt.content);
  };

  const handleSavePrompt = () => {
    if (!promptTitleInput.trim() || !promptContentInput.trim()) {
      Alert.alert(t('dischargeAssistant.prompts.incompleteTitle'), t('dischargeAssistant.prompts.incompleteMessage'));
      return;
    }

    if (editingPromptId) {
      setCustomPrompts(prev =>
        prev.map(p =>
          p.id === editingPromptId
            ? { ...p, title: promptTitleInput.trim(), content: promptContentInput.trim() }
            : p
        )
      );
    } else {
      const newPrompt: CustomPrompt = {
        id: Date.now().toString(),
        title: promptTitleInput.trim(),
        content: promptContentInput.trim(),
        createdAt: new Date().toISOString(),
      };
      setCustomPrompts(prev => [newPrompt, ...prev]);
    }

    setPromptTitleInput('');
    setPromptContentInput('');
    setEditingPromptId(null);
  };

  const handleDeletePrompt = (id: string) => {
    Alert.alert(
      t('dischargeAssistant.prompts.deleteTitle'),
      t('dischargeAssistant.prompts.deleteMessage'),
      [
        { text: t('dischargeAssistant.actions.cancel'), style: 'cancel' },
        {
          text: t('dischargeAssistant.prompts.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            setCustomPrompts(prev => prev.filter(p => p.id !== id));
            if (selectedPromptId === id) setSelectedPromptId(null);
          },
        },
      ],
    );
  };

  const renderTimelineItem = (item: Observation) => {
    const isImage = item.type === 'image';
    const isFile = item.type === 'file';

  return (
      <View key={item.id} style={styles.streamItemContainer}>
        {/* Left Icon */}
        <View style={styles.streamIconContainer}>
            {item.type === 'text' && <AlignJustify size={20} color={colors.onSurfaceVariant} />}
            {item.type === 'image' && <Monitor size={20} color={PRIMARY_COLOR} />}
            {item.type === 'file' && <File size={20} color={colors.primary} />}
        </View>

        {/* Content */}
        <View style={styles.streamContentContainer}>
            {item.type === 'text' && (
                 <Text style={styles.streamText} numberOfLines={3} ellipsizeMode="tail">
                    {item.content}
                 </Text>
            )}

            {isImage && (
                <View>
                    <View style={styles.thumbnailWrapper}>
                        {item.uri ? (
                            <RNImage source={{ uri: item.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.thumbnailImage, { backgroundColor: '#F0F0F0' }]} />
                        )}
                        {item.status === 'processing' && (
                            <View style={styles.processingOverlay}>
                                <ActivityIndicator color="white" size="small" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.statusText}>
                        {item.status === 'processing'
                            ? t('dischargeAssistant.status.analyzingPixelData')
                            : 'Monitor Screen • Captured'}
                    </Text>
                </View>
            )}

            {isFile && (
                <View>
                     <View style={styles.fileCard}>
                        <File size={16} color={colors.onSurfaceVariant} />
                        <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
                     </View>
                     <Text style={styles.statusText}>
                        {item.status === 'processing'
                            ? t('dischargeAssistant.status.analyzingDocument')
                            : 'Document • Processed'}
                    </Text>
                </View>
            )}
        </View>

        {/* Time */}
        <Text style={styles.streamTime}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.headerWrapper}>
        <Header
          title={t('dischargeAssistant.headerTitle')}
            subtitle={t('dischargeAssistant.headerSubtitle')}
          onLeftPress={handleBackPress}
          icon={FileText}
            showIcon={false} // Minimalist
            backgroundColor="#FFFFFF"
            showBorder={true}
            textColor={PRIMARY_COLOR}
          />
                <TouchableOpacity
            style={styles.savedSummariesButton}
            onPress={() => setShowSavedSummaries(true)}
          >
            <Bookmark size={20} color={PRIMARY_COLOR} />
            {savedSummaries.length > 0 && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>{savedSummaries.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stream Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.streamContainer}
          contentContainerStyle={styles.streamContent}
          showsVerticalScrollIndicator={false}
        >
          {observations.length === 0 ? (
            <View style={styles.emptyState}>
              <PulsingAILogo />
              <Text style={styles.emptyTitle}>Clinical Stream</Text>
              <Text style={styles.emptySubtitle}>
                Add observations, scan monitor screens, or upload documents to start.
                    </Text>
            </View>
          ) : (
            observations.map(renderTimelineItem)
          )}
          <View style={{ height: hp(10) }} />
        </ScrollView>

        {/* Generate Button (Floating) */}
        {observations.length > 0 && !isSynthesizing && (
          <View style={styles.floatingButtonContainer}>
                <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: PRIMARY_COLOR }]}
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
              <Text style={[styles.synthesizingText, { color: PRIMARY_COLOR }]}>Synthesizing clinical data...</Text>
            </View>
        )}

        {/* Smart Input Bar (iMessage Style) */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[styles.inputWrapper, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20 }]}>
            <View style={styles.promptBar}>
              <View style={styles.promptInfo}>
                <Text style={styles.promptLabel}>
                  {t('dischargeAssistant.prompts.label')}
                </Text>
                <Text style={styles.promptValue} numberOfLines={1}>
                  {selectedPrompt ? selectedPrompt.title : t('dischargeAssistant.prompts.none')}
                </Text>
            </View>
              <TouchableOpacity
                style={styles.promptButton}
                onPress={() => setShowPromptManager(true)}
              >
                <Text style={styles.promptButtonText}>
                  {t('dischargeAssistant.prompts.manage')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputBarContainer}>
                {/* Plus Button */}
                <TouchableOpacity
                    style={styles.plusButton}
                    onPress={handlePlusPress}
                    activeOpacity={0.7}
                >
                    <Plus size={22} color={colors.onSurfaceVariant} strokeWidth={2} />
                </TouchableOpacity>

                {/* Text Input */}
              <TextInput
                    style={styles.messageInput}
                    placeholder={t('dischargeAssistant.inputBar.placeholder')}
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={inputText}
                    onChangeText={setInputText}
                multiline
                    maxLength={1000}
              />

                {/* Send Button - only visible when there's text */}
                {inputText.trim().length > 0 && (
            <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendText}
                        activeOpacity={0.7}
                    >
                        <ArrowUp size={18} color="white" strokeWidth={2.5} />
            </TouchableOpacity>
                )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Synthesis Result Modal */}
      <Modal
        visible={showSynthesis}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSynthesis(false)}
      >
        <SafeAreaView style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <View style={{ width: 24 }} />
            <Text style={styles.resultTitle}>Discharge Summary</Text>
              <TouchableOpacity
              style={styles.saveButton}
                onPress={() => {
                Alert.alert('Saved', 'Summary saved to patient record.');
                setShowSynthesis(false);
              }}
            >
              <Text style={[styles.saveButtonText, { color: PRIMARY_COLOR }]}>Done</Text>
              </TouchableOpacity>
            </View>

          <ScrollView style={styles.resultContent} showsVerticalScrollIndicator={false}>
            <View style={styles.documentCard}>
              <Text style={styles.documentText}>{generatedSummary}</Text>
                    </View>
            <View style={{height: hp(5)}} />
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.resultActionBtn} onPress={handleSaveSummary}>
               <Save size={20} color={colors.onSurface} />
               <Text style={styles.resultActionLabel}>{t('dischargeAssistant.savedSummaries.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resultActionBtn} onPress={() => Alert.alert('Copied')}>
               <Copy size={20} color={colors.onSurface} />
               <Text style={styles.resultActionLabel}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resultActionBtn} onPress={() => Alert.alert('Export PDF')}>
               <Share size={20} color={colors.onSurface} />
               <Text style={styles.resultActionLabel}>Export</Text>
                      </TouchableOpacity>
                    </View>
          {showSaveDialog && (
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogCard}>
                <Text style={styles.dialogTitle}>
                  {renamingSummaryId
                    ? t('dischargeAssistant.savedSummaries.renameTitle')
                    : t('dischargeAssistant.savedSummaries.nameTitle')}
                    </Text>
                <TextInput
                  style={styles.dialogInput}
                  placeholder={t('dischargeAssistant.savedSummaries.namePlaceholder')}
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={saveNameInput}
                  onChangeText={setSaveNameInput}
                />
                <View style={styles.dialogActions}>
                  <TouchableOpacity onPress={() => setShowSaveDialog(false)}>
                    <Text style={styles.dialogCancel}>
                      {t('dischargeAssistant.actions.cancel')}
                    </Text>
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
      </Modal>

      {/* Saved Summaries Modal */}
      <Modal
        visible={showSavedSummaries}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSavedSummaries(false)}
      >
        <SafeAreaView style={styles.savedModalContainer}>
          <View style={styles.savedModalHeader}>
            <Text style={styles.savedModalTitle}>
              {t('dischargeAssistant.savedSummaries.title')}
                      </Text>
            <TouchableOpacity onPress={() => setShowSavedSummaries(false)}>
              <X size={22} color={colors.onSurface} />
            </TouchableOpacity>
                    </View>
          <ScrollView contentContainerStyle={styles.savedList}>
            {savedSummaries.length === 0 ? (
              <Text style={styles.savedEmptyText}>
                {t('dischargeAssistant.savedSummaries.empty')}
              </Text>
            ) : (
              savedSummaries.map(item => (
                <View key={item.id} style={styles.savedCard}>
                  <View style={styles.savedCardHeader}>
                  <TouchableOpacity
                      style={styles.savedCardContent}
                      onPress={() => handleSelectSavedSummary(item)}
                    >
                      <Text style={styles.savedTitle}>{item.title}</Text>
                      <Text style={styles.savedMeta}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                  </TouchableOpacity>
                    <View style={styles.savedActions}>
                  <TouchableOpacity
                        onPress={() => {
                          setRenamingSummaryId(item.id);
                          setSaveNameInput(item.title);
                          setShowSaveDialog(true);
                        }}
                      >
                        <Text style={styles.savedRename}>
                          {t('dischargeAssistant.savedSummaries.rename')}
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            t('dischargeAssistant.savedSummaries.deleteTitle'),
                            t('dischargeAssistant.savedSummaries.deleteMessage'),
                            [
                              { text: t('dischargeAssistant.actions.cancel'), style: 'cancel' },
                              {
                                text: t('dischargeAssistant.savedSummaries.deleteConfirm'),
                                style: 'destructive',
                                onPress: () => {
                                  setSavedSummaries(prev =>
                                    prev.filter(summary => summary.id !== item.id),
                                  );
                                },
                              },
                            ],
                          );
                        }}
                      >
                        <Text style={[styles.savedRename, styles.savedDelete]}>
                          {t('dischargeAssistant.savedSummaries.delete')}
                      </Text>
                  </TouchableOpacity>
                </View>
                  </View>
                  <Text style={styles.savedPreview} numberOfLines={2}>
                    {item.content.replace(/\n/g, ' ')}
                  </Text>
              </View>
              ))
            )}
          </ScrollView>
          {showSaveDialog && (
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogCard}>
                <Text style={styles.dialogTitle}>
                  {renamingSummaryId
                    ? t('dischargeAssistant.savedSummaries.renameTitle')
                    : t('dischargeAssistant.savedSummaries.nameTitle')}
                </Text>
                <TextInput
                  style={styles.dialogInput}
                  placeholder={t('dischargeAssistant.savedSummaries.namePlaceholder')}
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={saveNameInput}
                  onChangeText={setSaveNameInput}
                />
                <View style={styles.dialogActions}>
                  <TouchableOpacity onPress={() => setShowSaveDialog(false)}>
                    <Text style={styles.dialogCancel}>
                      {t('dischargeAssistant.actions.cancel')}
                </Text>
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
      </Modal>

      {/* Custom Prompts Modal */}
      <Modal
        visible={showPromptManager}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPromptManager(false)}
      >
        <SafeAreaView style={styles.promptModalContainer}>
          <View style={styles.promptModalHeader}>
            <TouchableOpacity onPress={() => setShowPromptManager(false)}>
              <X size={22} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.promptModalTitle}>
              {t('dischargeAssistant.prompts.title')}
                    </Text>
            <View style={{ width: 22 }} />
                    </View>

          <ScrollView contentContainerStyle={styles.promptList}>
            {customPrompts.length === 0 ? (
              <Text style={styles.savedEmptyText}>
                {t('dischargeAssistant.prompts.empty')}
              </Text>
            ) : (
              customPrompts.map(prompt => {
                const isActive = selectedPromptId === prompt.id;
                return (
                  <TouchableOpacity
                    key={prompt.id}
                    style={[styles.promptCard, isActive && styles.promptCardActive]}
                    activeOpacity={0.9}
                    onPress={() => {
                      setSelectedPromptId(prompt.id);
                      setShowPromptManager(false);
                    }}
                  >
                    <View style={styles.promptCardHeader}>
                      <Text style={[styles.promptCardTitle, isActive && styles.promptCardTitleActive]}>
                        {prompt.title}
                    </Text>
                      {isActive && (
                        <Text style={styles.promptSelectedTag}>
                          {t('dischargeAssistant.prompts.selected')}
                  </Text>
                      )}
              </View>
                    <Text style={styles.promptCardContent} numberOfLines={2}>
                      {prompt.content}
                </Text>
                    <View style={styles.promptActions}>
                      <TouchableOpacity onPress={() => handleEditPrompt(prompt)}>
                        <Text style={styles.promptActionText}>
                          {t('dischargeAssistant.prompts.edit')}
                </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeletePrompt(prompt.id)}>
                        <Text style={[styles.promptActionText, styles.promptDeleteText]}>
                          {t('dischargeAssistant.prompts.delete')}
                        </Text>
            </TouchableOpacity>
          </View>
                  </TouchableOpacity>
                );
              })
            )}
        </ScrollView>

          <View style={styles.promptEditor}>
            <Text style={styles.promptEditorTitle}>
              {editingPromptId
                ? t('dischargeAssistant.prompts.editTitle')
                : t('dischargeAssistant.prompts.newTitle')}
                    </Text>
            <TextInput
              style={styles.promptInput}
              placeholder={t('dischargeAssistant.prompts.titlePlaceholder')}
              placeholderTextColor={colors.onSurfaceVariant}
              value={promptTitleInput}
              onChangeText={setPromptTitleInput}
            />
            <TextInput
              style={[styles.promptInput, styles.promptInputMultiline]}
              placeholder={t('dischargeAssistant.prompts.contentPlaceholder')}
              placeholderTextColor={colors.onSurfaceVariant}
              value={promptContentInput}
              onChangeText={setPromptContentInput}
              multiline
            />
            <TouchableOpacity style={styles.promptSaveButton} onPress={handleSavePrompt}>
              <Text style={styles.promptSaveButtonText}>
                {editingPromptId
                  ? t('dischargeAssistant.prompts.update')
                  : t('dischargeAssistant.prompts.save')}
                    </Text>
            </TouchableOpacity>
      </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Discharge;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clinical White
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  streamContainer: {
    flex: 1,
  },
  streamContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  emptyState: {
    marginTop: hp(15),
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  aiLogoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  aiLogoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Stream Items
  streamItemContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  streamIconContainer: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 2,
  },
  streamContentContainer: {
    flex: 1,
    marginRight: 8,
  },
  streamText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  streamTime: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  thumbnailWrapper: {
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  statusText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
      backgroundColor: '#F9FAFB',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      marginBottom: 4,
    alignSelf: 'flex-start',
      gap: 8,
  },
  fileName: {
      fontSize: 13,
      color: '#333',
      maxWidth: wp(50),
  },

  // Input Bar (iMessage Style)
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  plusButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
  },
  messageInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#46B7C6',
  },

  // Header Right Button
  headerWrapper: {
    position: 'relative',
  },
  savedSummariesButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 8,
  },
  savedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E0F2F5',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  savedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#46B7C6',
  },

  // Floating Button
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
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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

  // Prompt Bar
  promptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  promptInfo: {
    flex: 1,
    marginRight: 8,
  },
  promptLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
  },
  promptValue: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  promptButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  promptButtonText: {
    fontSize: 12,
    color: '#46B7C6',
    fontWeight: '600',
  },

  // Result Modal
  resultContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  resultContent: {
    flex: 1,
    padding: 16,
  },
  documentCard: {
    backgroundColor: 'white',
    borderRadius: 4, // A4 style
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: hp(60),
  },
  documentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  resultActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  resultActionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  resultActionLabel: {
    fontSize: 12,
    color: colors.onSurface,
  },

  // Saved Summaries Modal
  savedModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  savedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  savedModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  savedList: {
    padding: 16,
    gap: 12,
  },
  savedEmptyText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 40,
  },
  savedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  savedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savedCardContent: {
    flex: 1,
    marginRight: 12,
  },
  savedActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  savedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  savedMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  savedRename: {
    fontSize: 12,
    color: '#46B7C6',
    fontWeight: '600',
  },
  savedDelete: {
    color: '#EF4444',
  },
  savedPreview: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },

  // Prompt Manager Modal
  promptModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  promptModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  promptModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  promptList: {
    padding: 16,
    gap: 12,
  },
  promptCard: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  promptCardActive: {
    borderColor: '#46B7C6',
    backgroundColor: '#F0FDFA',
  },
  promptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  promptCardTitleActive: {
    color: '#46B7C6',
  },
  promptSelectedTag: {
    fontSize: 11,
    color: '#46B7C6',
    fontWeight: '600',
  },
  promptCardContent: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 6,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  promptActionText: {
    fontSize: 12,
    color: '#46B7C6',
    fontWeight: '600',
  },
  promptDeleteText: {
    color: '#EF4444',
  },
  promptEditor: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  promptEditorTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111827',
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  promptInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  promptSaveButton: {
    backgroundColor: '#46B7C6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  promptSaveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Save/Rename Dialog
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  dialogCancel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  dialogConfirm: {
    fontSize: 14,
    color: '#46B7C6',
    fontWeight: '700',
  },
});
