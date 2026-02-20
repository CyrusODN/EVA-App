/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from '../../services/socketService';
import userStore from '../../store/user';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  LayoutAnimation,
  UIManager,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Users,
  Brain,
  Edit3,
  Trash2,
  RotateCcw,
  Plus,
  Check,
  X,
  Search,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Camera,
  Type,
  Clipboard as ClipboardIcon,
  PhoneCall,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Input from '../../components/input';
import CustomTemplateManager, {
  CustomTemplate,
} from '../../components/customTemplateManager';
import { customToast } from '../../utils/toastMessage';
import { sessionStorage } from '../../utils/sessionStorage';
import useOnboardingStore from '../../store/onboarding';
import { generateNotes, getAuthContext } from '../../services/authService';
import {
  createNotesPrompt,
  getNotesPrompts,
  deleteNotesPrompt,
  type NotesPrompt,
} from '../../services/promptsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

Dimensions.get('window');

// Design System Constants
const DEFAULT_DESIGN_TOKENS = {
  fonts: {
    regular: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    medium: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
    semibold: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    displaySemibold: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  colors: {
    primary: '#46B7C6',
    text: '#000000',
    textSecondary: '#A6A6A6',
    textTertiary: '#86868b',
    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    backgroundTertiary: '#F8F8F8',
    success: '#10b981',
    error: '#ef4444',
  },
  borderRadius: {
    small: 6,
    medium: 8,
    large: 10,
    xlarge: 12,
    xxlarge: 16,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};
const DESIGN_TOKENS = DEFAULT_DESIGN_TOKENS;

const TranscriptionComplete = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();

  const DESIGN_TOKENS = {
    fonts: DEFAULT_DESIGN_TOKENS.fonts,
    colors: {
      primary: themeColors.accentPrimary,
      text: isDark ? themeColors.textPrimary : '#000000',
      textSecondary: isDark ? themeColors.textSecondary : '#A6A6A6',
      textTertiary: isDark ? themeColors.textMuted : '#86868b',
      border: isDark ? themeColors.borderNormal : '#E5E5E5',
      borderLight: isDark ? themeColors.borderSubtle : '#F0F0F0',
      background: isDark ? themeColors.canvas : '#FFFFFF',
      backgroundSecondary: isDark ? themeColors.layer2 : '#FAFAFA',
      backgroundTertiary: isDark ? 'rgba(255,255,255,0.05)' : '#F8F8F8',
      success: themeColors.success,
      error: themeColors.error,
    },
    borderRadius: DEFAULT_DESIGN_TOKENS.borderRadius,
    shadows: isDark
      ? {
          small: {
            shadowColor: themeColors.accentPrimary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          },
          medium: {
            shadowColor: themeColors.accentPrimary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          },
          large: {
            shadowColor: themeColors.accentPrimary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
          },
        }
      : DEFAULT_DESIGN_TOKENS.shadows,
  };

  // Get onboarding defaults
  const { defaultSpecialization, defaultNoteLength, defaultVisitType } =
    useOnboardingStore();

  // Get session data from route params
  const { sessionData, sessionType } = ((route as any).params || {}) as {
    sessionData?: any;
    sessionType?: string;
  };

  // --- NEW ARCHITECTURE STATE ---
  const [generationMode, setGenerationMode] = useState<'standard' | 'custom'>(
    'standard',
  );
  // ------------------------------

  // State management - initialized with onboarding defaults
  const [noteType, setNoteType] = useState<string>('SOAP'); // Default to SOAP for standard mode
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>(
    defaultSpecialization || 'Psychiatry',
  );
  const [visitType, setVisitType] = useState<string>(defaultVisitType || '');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [showVisitTypeModal, setShowVisitTypeModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [selectedFollowUpVisits, setSelectedFollowUpVisits] = useState<
    Set<string>
  >(new Set<string>());
  const [importedFollowUpVisits, setImportedFollowUpVisits] = useState<
    Array<{ _id: string; title: string; date: Date | string }>
  >([]);
  const [visitSearchQuery, setVisitSearchQuery] = useState<string>('');
  const [manualFollowUpText, setManualFollowUpText] = useState<string>('');
  const [showManualTextModal, setShowManualTextModal] =
    useState<boolean>(false);
  const [tempManualText, setTempManualText] = useState<string>('');
  // removed unused followUpPhoto state
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string>(
    sessionData?.generatedNotes || '',
  );
  const generatedNotesRef = useRef<string>(sessionData?.generatedNotes || ''); // To track latest value inside socket callbacks
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
  const [noteLength, setNoteLength] = useState<'Small' | 'Medium' | 'Large'>(
    defaultNoteLength || 'Medium',
  );

  // Custom Template State
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedTemplateTitle, setSelectedTemplateTitle] =
    useState<string>('');

  const noteScrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (noteScrollViewRef.current) {
      if (isGeneratingNotes) {
        // While generating, auto-scroll to bottom to follow stream
        noteScrollViewRef.current.scrollToEnd({ animated: true });
      } else if (generatedNotes.length > 0) {
        // When generation finishes (isGeneratingNotes becomes false), scroll to top
        // Small timeout to ensure layout is ready after collapse animation
        setTimeout(() => {
          noteScrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      }
    }
  }, [generatedNotes, isGeneratingNotes]);

  const noteLengthOptions: Array<'Small' | 'Medium' | 'Large'> = [
    'Small',
    'Medium',
    'Large',
  ];

  // Model selection state
  const [selectedModel, setSelectedModel] = useState<'standard' | 'pro'>(
    'standard',
  );
  // Prompts states
  const [customPromptTitle, setCustomPromptTitle] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<NotesPrompt[]>([]); // Saved custom prompts
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null); // Currently selected prompt
  const specializationOptions = [
    {
      key: 'Psychiatry',
      label: t('mainContent.transcriptionComplete.specialization.psychiatry'),
    },
    {
      key: 'Child Psychiatry',
      label: t(
        'mainContent.transcriptionComplete.specialization.childPsychiatry',
      ),
    },
    {
      key: 'Surgery',
      label: t('mainContent.transcriptionComplete.specialization.surgery'),
    },
    {
      key: 'Family Medicine',
      label: t(
        'mainContent.transcriptionComplete.specialization.familyMedicine',
      ),
    },
    {
      key: 'Smart Select',
      label: t('mainContent.transcriptionComplete.specialization.smartSelect'),
    },
  ];
  const visitTypeOptions = [
    {
      key: 'First Visit',
      label: t('mainContent.transcriptionComplete.visitType.firstVisit'),
    },
    {
      key: 'Follow-up',
      label: t('mainContent.transcriptionComplete.visitType.followUp'),
    },
  ];

  // Helper to switch modes with animation
  const handleModeChange = (mode: 'standard' | 'custom') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGenerationMode(mode);

    // Optional: Reset logic when switching if needed
    if (mode === 'standard') {
      setNoteType('SOAP');
    } else {
      setNoteType('custom');
    }
  };

  const handleClearCustomPrompt = () => {
    setCustomNote('');
    setSelectedTemplateId(null);
    setSelectedTemplateTitle('');
    setNoteType('SOAP'); // Reset to default SOAP
    customToast('success', t('common.success'), 'Custom prompt cleared');
  };

  const handleDeletePrompt = async (promptId: string, promptTitle: string) => {
    try {
      await deleteNotesPrompt(promptId);

      // Remove from local state
      setSavedPrompts((prev) => prev.filter((p) => p._id !== promptId));

      // Clear selection if deleted prompt was selected
      if (selectedPromptId === promptId) {
        setSelectedPromptId(null);
        setCustomNote('');
        setCustomPromptTitle('');
        setNoteType('SOAP'); // Reset to default SOAP
      }

      customToast('success', 'Deleted', `"${promptTitle}" has been deleted`);
      console.log('[TranscriptionComplete] Prompt deleted:', promptId);
    } catch (error: any) {
      console.error('[TranscriptionComplete] Failed to delete prompt:', error);
      customToast(
        'error',
        'Error',
        error?.message || 'Failed to delete prompt',
      );
    }
  };

  const handleSelectTemplate = (template: CustomTemplate | null) => {
    if (!template) {
      handleClearCustomPrompt();
      return;
    }
    setSelectedTemplateId(template.id);
    setSelectedTemplateTitle(template.title);
    setNoteType('custom');
    setCustomNote(template.content);
  };

  // Mock session data if not provided
  const session = sessionData || {
    id: '1',
    title: t('mainContent.recording.newSession'),
    type: sessionType || 'patient',
    date: new Date().toISOString(),
    duration: null,
    hasRecording: true,
    hasTranscription: true,
    status: 'transcribed',
  };

  const isNoteReady = generatedNotes.trim().length > 0;
  // State for available sessions to use as follow-up visits
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);

  // Load available sessions for follow-up visits
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await sessionStorage.getAllSessions();
        // Filter to only show sessions with transcriptions, same type, excluding current session
        const filteredSessions = allSessions
          .filter(
            (s) =>
              s.type === session.type &&
              s.id !== session.id &&
              s.hasTranscription === true,
          )
          .map((s) => ({
            _id: s.id,
            title: s.title,
            date: new Date(s.date),
          }));
        setAvailableSessions(filteredSessions);
        console.log(
          '[TranscriptionComplete] Loaded available sessions for follow-up:',
          filteredSessions.length,
        );
      } catch (error) {
        console.error(
          '[TranscriptionComplete] Failed to load sessions:',
          error,
        );
      }
    };
    loadSessions();
  }, [session.type, session.id]);

  // Load saved custom prompts for this session type
  const loadPrompts = useCallback(async () => {
    try {
      const prompts = await getNotesPrompts(
        session.type as 'patient' | 'meeting' | 'lecture',
      );
      setSavedPrompts(prompts);
      console.log(
        '[TranscriptionComplete] Loaded custom prompts:',
        prompts.length,
      );
    } catch (error) {
      console.error('[TranscriptionComplete] Failed to load prompts:', error);
    }
  }, [session.type]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Load saved notes from storage if session already has notes
  // Load saved notes from storage if session already has notes
  useEffect(() => {
    const loadSavedNotes = async () => {
      // Use session.id (which is reliable via the session variable) instead of sessionData?.id
      if (session.id && session.id !== '1') {
        try {
          // Add a small delay to ensure storage write matches read (rare race condition)
          await new Promise((resolve) => setTimeout(resolve, 100));

          const latestSession = await sessionStorage.getSessionById(session.id);
          if (latestSession?.generatedNotes) {
            console.log(
              '[TranscriptionComplete] Loaded saved notes from storage:',
              latestSession.generatedNotes.length,
              'characters',
            );
            setGeneratedNotes(latestSession.generatedNotes);
            generatedNotesRef.current = latestSession.generatedNotes;
          } else {
            console.log(
              '[TranscriptionComplete] No saved notes found for session:',
              session.id,
            );
          }
        } catch (error) {
          console.error(
            '[TranscriptionComplete] Failed to load saved notes:',
            error,
          );
        }
      }
    };
    loadSavedNotes();
  }, [session.id]);

  const filteredFollowUpVisits = availableSessions.filter((visit) =>
    visit.title.toLowerCase().includes(visitSearchQuery.toLowerCase()),
  );

  const getSessionIcon = () => {
    switch (session.type) {
      case 'patient':
        return Users;
      case 'meeting':
        return FileText;
      case 'lecture':
        return Brain;
      default:
        return FileText;
    }
  };

  const getSessionTypeText = () => {
    switch (session.type) {
      case 'patient':
        return t('tabs.patients');
      case 'meeting':
        return t('tabs.meetings');
      case 'lecture':
        return t('tabs.lectures');
      default:
        return t('tabs.patients');
    }
  };

  const handleExpandConfig = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsConfigCollapsed(false);
  };

  const handleCollapseConfig = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsConfigCollapsed(true);
  };

  const handleRename = async () => {
    if (!newSessionName.trim()) return;
    setIsRenaming(true);
    try {
      // Update in local storage (handles backend sync internally)
      await sessionStorage.updateSessionTitle(
        session.id,
        newSessionName.trim(),
      );
      setShowRenameModal(false);
      customToast('success', t('common.success'), t('success.sessionRenamed'));
    } catch (error) {
      console.error('[TranscriptionComplete] Rename error:', error);
      customToast('error', t('common.error'), 'Failed to rename session');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete from local storage (handles backend sync internally)
      await sessionStorage.deleteSession(session.id);
      setShowDeleteModal(false);
      customToast('success', t('common.success'), t('success.sessionDeleted'));
      (navigation as any).goBack();
    } catch (error) {
      console.error('[TranscriptionComplete] Delete error:', error);
      customToast('error', t('common.error'), 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Reset in local storage (handles backend sync internally)
      await sessionStorage.resetSession(session.id);
      setShowResetModal(false);
      customToast('success', t('common.success'), t('success.sessionReset'));
      (navigation as any).goBack();
    } catch (error) {
      console.error('[TranscriptionComplete] Reset error:', error);
      customToast('error', t('common.error'), 'Failed to reset session');
    } finally {
      setIsResetting(false);
    }
  };

  const handleFollowUpVisitSelect = (visitId: string) => {
    setSelectedFollowUpVisits((prev) => {
      const next = new Set(prev);
      next.has(visitId) ? next.delete(visitId) : next.add(visitId);
      return next;
    });
  };

  const handleImportFollowUpVisits = () => {
    const selectedVisitData = availableSessions
      .filter((visit) => selectedFollowUpVisits.has(visit._id))
      .map((visit) => ({
        _id: visit._id,
        title: visit.title,
        date: visit.date,
      }));
    setImportedFollowUpVisits(selectedVisitData);
    setShowFollowUpModal(false);
    setVisitSearchQuery('');
  };

  // --- NEW RENDER: Mode Switcher (The Segmented Control) ---
  const renderModeSwitch = () => {
    if (session.type !== 'patient') return null;
    return (
      <View style={styles.modeSwitchContainer}>
        <Text
          variant="labelMedium"
          style={[styles.sectionLabel, { color: DESIGN_TOKENS.colors.text }]}>
          {t('mainContent.transcriptionComplete.generationMode')}
        </Text>
        <View
          style={[
            styles.compactSegmentedControl,
            { backgroundColor: DESIGN_TOKENS.colors.border },
          ]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              generationMode === 'standard' && [
                styles.segmentBtnActive,
                { backgroundColor: DESIGN_TOKENS.colors.primary },
              ],
            ]}
            onPress={() => handleModeChange('standard')}>
            <Text
              style={[
                generationMode === 'standard'
                  ? styles.segmentTextActive
                  : styles.segmentTextInactive,
                generationMode === 'standard'
                  ? { color: '#FFF' }
                  : {
                      color: isDark
                        ? DESIGN_TOKENS.colors.textSecondary
                        : '#666',
                    },
              ]}>
              {t('mainContent.transcriptionComplete.modes.standard')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              generationMode === 'custom' && [
                styles.segmentBtnActive,
                { backgroundColor: DESIGN_TOKENS.colors.primary },
              ],
            ]}
            onPress={() => handleModeChange('custom')}>
            <Text
              style={[
                generationMode === 'custom'
                  ? styles.segmentTextActive
                  : styles.segmentTextInactive,
                generationMode === 'custom'
                  ? { color: '#FFF' }
                  : {
                      color: isDark
                        ? DESIGN_TOKENS.colors.textSecondary
                        : '#666',
                    },
              ]}>
              {t('mainContent.transcriptionComplete.modes.custom')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Keep logic for non-patient types
  const renderLegacyNoteButtons = () => {
    if (session.type === 'patient') return null;
    return (
      <View style={styles.noteTypeContainer}>
        <Text
          variant="labelMedium"
          style={[styles.sectionLabel, { color: DESIGN_TOKENS.colors.text }]}>
          {t('mainContent.transcriptionComplete.noteType')}
        </Text>
        <View
          style={[
            styles.compactSegmentedControl,
            { backgroundColor: DESIGN_TOKENS.colors.border },
          ]}>
          <TouchableOpacity
            style={[
              styles.compactSegmentButton,
              styles.compactSegmentButtonSelected,
              { backgroundColor: DESIGN_TOKENS.colors.primary },
            ]}>
            <Text
              style={[styles.compactSegmentTextSelected, { color: '#FFF' }]}>
              {t('mainContent.transcriptionComplete.noteOptions.general')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSpecializationSection = () => {
    return (
      <View style={styles.selectionSection}>
        <Text
          variant="labelMedium"
          style={[styles.sectionLabel, { color: DESIGN_TOKENS.colors.text }]}>
          {t('mainContent.transcriptionComplete.specialization.select')}
        </Text>
        <TouchableOpacity
          style={[
            styles.compactDropdownField,
            {
              borderColor: DESIGN_TOKENS.colors.border,
              backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
            },
          ]}
          onPress={() => setShowSpecializationModal(true)}>
          <Text
            variant="bodySmall"
            style={
              selectedSpecialization
                ? [
                    styles.compactDropdownValue,
                    { color: DESIGN_TOKENS.colors.text },
                  ]
                : [
                    styles.compactDropdownPlaceholder,
                    { color: DESIGN_TOKENS.colors.textSecondary },
                  ]
            }>
            {selectedSpecialization
              ? specializationOptions.find(
                  (s) => s.key === selectedSpecialization,
                )?.label
              : t('mainContent.transcriptionComplete.specialization.select')}
          </Text>
          <ChevronRight size={18} color={DESIGN_TOKENS.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderVisitTypeSection = () => {
    return (
      <View style={styles.selectionSection}>
        <Text
          variant="labelMedium"
          style={[styles.sectionLabel, { color: DESIGN_TOKENS.colors.text }]}>
          {t('mainContent.transcriptionComplete.visitType.select')}
        </Text>
        <TouchableOpacity
          style={[
            styles.compactDropdownField,
            {
              borderColor: DESIGN_TOKENS.colors.border,
              backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
            },
          ]}
          onPress={() => setShowVisitTypeModal(true)}>
          <Text
            variant="bodySmall"
            style={
              visitType
                ? [
                    styles.compactDropdownValue,
                    { color: DESIGN_TOKENS.colors.text },
                  ]
                : [
                    styles.compactDropdownPlaceholder,
                    { color: DESIGN_TOKENS.colors.textSecondary },
                  ]
            }>
            {visitType
              ? visitTypeOptions.find((v) => v.key === visitType)?.label
              : t('mainContent.transcriptionComplete.visitType.select')}
          </Text>
          <ChevronRight size={18} color={DESIGN_TOKENS.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderNoteLengthSection = () => {
    const noteLengthLabels = {
      Small: t('mainContent.transcriptionComplete.noteLength.small'),
      Medium: t('mainContent.transcriptionComplete.noteLength.medium'),
      Large: t('mainContent.transcriptionComplete.noteLength.large'),
    };

    return (
      <View style={styles.selectionSection}>
        <Text
          variant="labelMedium"
          style={[styles.sectionLabel, { color: DESIGN_TOKENS.colors.text }]}>
          {t('mainContent.transcriptionComplete.noteLength.select')}
        </Text>
        <View
          style={[
            styles.compactSegmentedControl,
            { backgroundColor: DESIGN_TOKENS.colors.border },
          ]}>
          {noteLengthOptions.map((length) => (
            <TouchableOpacity
              key={length}
              style={[
                styles.compactSegmentButton,
                noteLength === length && [
                  styles.compactSegmentButtonSelected,
                  {
                    backgroundColor: DESIGN_TOKENS.colors.primary,
                    shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
                  },
                ],
              ]}
              onPress={() => setNoteLength(length)}>
              <Text
                variant="bodySmall"
                style={[
                  styles.compactSegmentText,
                  {
                    color: isDark
                      ? DESIGN_TOKENS.colors.textSecondary
                      : '#666666',
                  },
                  noteLength === length && [
                    styles.compactSegmentTextSelected,
                    { color: '#FFF' },
                  ],
                ]}>
                {noteLengthLabels[length]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFollowUpSection = () => {
    if (visitType !== 'Follow-up') return null;

    return (
      <View style={styles.selectionSection}>
        <Text
          variant="labelMedium"
          style={[styles.sectionLabel, { color: DESIGN_TOKENS.colors.text }]}>
          {t(
            'mainContent.transcriptionComplete.followUpVisits.previousVisitContext',
          )}
        </Text>

        <View style={styles.followUpOptionsRow}>
          <TouchableOpacity
            style={[
              styles.followUpOptionButton,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                borderColor: DESIGN_TOKENS.colors.borderLight,
                shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
              },
            ]}
            onPress={() => setShowFollowUpModal(true)}>
            <Plus size={14} color={DESIGN_TOKENS.colors.primary} />
            <Text
              variant="bodySmall"
              style={[
                styles.followUpOptionText,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              {t(
                'mainContent.transcriptionComplete.followUpVisits.fromHistory',
              )}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.followUpOptionButton,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                borderColor: DESIGN_TOKENS.colors.borderLight,
                shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
              },
            ]}
            onPress={() => {
              setTempManualText(manualFollowUpText);
              setShowManualTextModal(true);
            }}>
            <Type size={14} color={DESIGN_TOKENS.colors.primary} />
            <Text
              variant="bodySmall"
              style={[
                styles.followUpOptionText,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              {t('mainContent.transcriptionComplete.followUpVisits.typeText')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.followUpOptionButton,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                borderColor: DESIGN_TOKENS.colors.borderLight,
                shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
              },
            ]}
            onPress={() => {
              customToast(
                'info',
                t('common.comingSoon'),
                t(
                  'mainContent.transcriptionComplete.followUpVisits.photoComingSoon',
                ),
              );
            }}>
            <Camera size={14} color={DESIGN_TOKENS.colors.primary} />
            <Text
              variant="bodySmall"
              style={[
                styles.followUpOptionText,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              {t('mainContent.transcriptionComplete.followUpVisits.takePhoto')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual Text Preview */}
        {manualFollowUpText.trim() && (
          <View
            style={[
              styles.manualTextPreview,
              {
                backgroundColor: DESIGN_TOKENS.colors.backgroundTertiary,
                borderLeftColor: DESIGN_TOKENS.colors.success,
                shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
              },
            ]}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.customNoteLabel,
                    { color: DESIGN_TOKENS.colors.textSecondary },
                  ]}>
                  {t(
                    'mainContent.transcriptionComplete.followUpVisits.manualContext',
                  )}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.manualTextSnippet,
                    { color: DESIGN_TOKENS.colors.textSecondary },
                  ]}
                  numberOfLines={2}>
                  {manualFollowUpText}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: wp(2) }}>
                <TouchableOpacity
                  style={[
                    styles.customNoteActionButton,
                    { backgroundColor: DESIGN_TOKENS.colors.background },
                  ]}
                  onPress={() => {
                    setTempManualText(manualFollowUpText);
                    setShowManualTextModal(true);
                  }}>
                  <Edit3 size={16} color={DESIGN_TOKENS.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.customNoteActionButton,
                    { backgroundColor: DESIGN_TOKENS.colors.background },
                  ]}
                  onPress={() => setManualFollowUpText('')}>
                  <X size={16} color={DESIGN_TOKENS.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Imported Visits from History */}
        {importedFollowUpVisits.length > 0 && (
          <View style={styles.importedVisitsContainer}>
            <Text
              variant="bodySmall"
              style={[
                styles.importedVisitsCount,
                { color: DESIGN_TOKENS.colors.textTertiary },
              ]}>
              {t(
                'mainContent.transcriptionComplete.followUpVisits.selectedVisits',
                {
                  count: importedFollowUpVisits.length,
                },
              )}
            </Text>
            {importedFollowUpVisits.map((visit) => (
              <View
                key={visit._id}
                style={[
                  styles.importedVisitItem,
                  {
                    backgroundColor: DESIGN_TOKENS.colors.background,
                    borderColor: DESIGN_TOKENS.colors.borderLight,
                    shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
                  },
                ]}>
                <View style={styles.importedVisitInfo}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.importedVisitTitle,
                      { color: DESIGN_TOKENS.colors.text },
                    ]}>
                    {visit.title}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.importedVisitDate,
                      { color: DESIGN_TOKENS.colors.textTertiary },
                    ]}>
                    {new Date(visit.date).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setImportedFollowUpVisits((prev) =>
                      prev.filter((v) => v._id !== visit._id),
                    );
                  }}>
                  <X size={16} color={DESIGN_TOKENS.colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getGeneratedSummary = () => {
    if (session.type !== 'patient') {
      return t('mainContent.transcriptionComplete.generatedUsing.general');
    }
    if (generationMode === 'standard') {
      const specializationLabel =
        specializationOptions.find((s) => s.key === selectedSpecialization)
          ?.label || t('mainContent.transcriptionComplete.modes.standard');
      return t(
        'mainContent.transcriptionComplete.generatedUsing.standardMode',
        { specialization: specializationLabel },
      );
    }
    return t('mainContent.transcriptionComplete.generatedUsing.customMode', {
      template:
        selectedTemplateTitle ||
        t('mainContent.transcriptionComplete.customTemplate'),
    });
  };

  const renderGenerateButton = () => {
    const canGenerate =
      noteType &&
      (noteType === 'custom' ||
        session.type !== 'patient' ||
        (selectedSpecialization && visitType));

    return (
      <TouchableOpacity
        style={[
          styles.floatingGenerateButton,
          { shadowColor: DESIGN_TOKENS.colors.primary },
          (!canGenerate || isGeneratingNotes) && [
            styles.floatingGenerateButtonDisabled,
            { backgroundColor: DESIGN_TOKENS.colors.border },
          ],
        ]}
        onPress={async () => {
          if (!canGenerate) {
            customToast(
              'error',
              t('common.error'),
              t('errors.noteTypeRequired'),
            );
            return;
          }
          const loggedInUser = userStore.getState().loggedInUser;

          // Check if we have sessionId
          if (!session.sessionId) {
            customToast(
              'error',
              t('common.error'),
              'Session ID not found. Please create a new session.',
            );
            return;
          }

          // Check if we have userId for socket connection
          let userId = loggedInUser?.id;
          if (!userId) {
            console.warn(
              '[TranscriptionComplete] No logged in user ID for socket auth, attempting to fetch auth context...',
            );
            try {
              const authCtx = await getAuthContext();
              const ctx = authCtx?.data?.data;
              if (ctx && (ctx._id || ctx.id || ctx.userId)) {
                const userObj: any = {
                  id: ctx._id || ctx.id || ctx.userId,
                  email: ctx.email || '',
                  name:
                    ctx.fname ||
                    ctx.name ||
                    (ctx.email ? String(ctx.email).split('@')[0] : ''),
                  profilePicture: ctx.profileImage || '',
                  role: ctx.role,
                  settings: ctx.settings,
                  whitelist: ctx.whitelist,
                  token: userStore.getState().token,
                };
                userStore.getState().setAuth(userObj);
                await AsyncStorage.setItem(
                  'auth_user',
                  JSON.stringify(userObj),
                );
                console.log(
                  '[TranscriptionComplete] Successfully fetched and stored user context',
                );
                userId = userObj.id;
              } else {
                console.error(
                  '[TranscriptionComplete] Auth context fetch failed - no user ID found',
                );
                customToast(
                  'error',
                  t('common.error'),
                  'User session error. Please log in again.',
                );
                return;
              }
            } catch (ctxError: any) {
              console.error(
                '[TranscriptionComplete] Failed to fetch auth context:',
                ctxError,
              );
              customToast(
                'error',
                t('common.error'),
                'User session error. Please log in again.',
              );
              return;
            }
          }

          // Get socket instance from service
          let socket = getSocket();

          // Fallback: If socket is not initialized, try to connect now
          if (!socket) {
            console.log(
              '[TranscriptionComplete] Socket not initialized, attempting connection now...',
            );
            socket = connectSocket(userId) || null;
          }

          // Check if socket is connected, wait a bit if not
          if (!socket) {
            customToast(
              'error',
              t('common.error'),
              'Socket connection failed. Please try again.',
            );
            return;
          }

          // Wait for socket connection if not connected (max 5 seconds)
          if (!socket.connected) {
            console.log(
              '[TranscriptionComplete] Socket not connected, waiting...',
            );

            let attempts = 0;
            const maxAttempts = 10;

            while (!socket.connected && attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              attempts++;
              console.log(
                '[TranscriptionComplete] Waiting for connection, attempt:',
                attempts,
              );
            }

            if (!socket.connected) {
              console.error(
                '[TranscriptionComplete] Socket connection timeout',
              );
              customToast(
                'error',
                t('common.error'),
                'Could not establish connection. Please check your internet and try again.',
              );
              return;
            }

            console.log(
              '[TranscriptionComplete] Socket connected after waiting',
            );
          }

          setIsGeneratingNotes(true);
          setGeneratedNotes(''); // Clear previous notes

          // Automatically hide configurations as soon as generation starts
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsConfigCollapsed(true);

          try {
            console.log(
              '[TranscriptionComplete] Generating notes via API + Socket...',
            );
            console.log(
              '[TranscriptionComplete] Session ID:',
              session.sessionId,
            );

            // Prepare payload matching backend expectations from guide
            // Prepare payload matching backend expectations from guide
            // Set appropriate default noteType based on session type
            const defaultNoteType =
              session.type === 'lecture'
                ? 'medical'
                : session.type === 'meeting'
                ? 'general'
                : 'SOAP';

            // Map UI selection to model identifier
            const llmModel =
              selectedModel === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

            let payload: any = {};

            if (noteType === 'custom') {
              payload = {
                noteType: 'custom',
                promptId: selectedTemplateId, // Use selectedTemplateId as it holds the custom prompt ID
                llmModel,
              };
              console.log(
                '[TranscriptionComplete] Using custom prompt ID:',
                selectedTemplateId,
              );
            } else if (session.type === 'meeting') {
              payload = {
                llmModel,
                noteType: 'general',
              };
            } else if (session.type === 'lecture') {
              payload = {
                llmModel,
                noteType: 'medical',
              };
            } else {
              payload = {
                noteType: noteType || defaultNoteType,
                visitType:
                  visitType.toLowerCase().replace(' ', '-') || 'first-visit',
                specialization:
                  selectedSpecialization === 'Child Psychiatry'
                    ? 'childPsychiatry'
                    : selectedSpecialization === 'Family Medicine'
                    ? 'familymedicine'
                    : selectedSpecialization === 'Smart Select'
                    ? 'smartSelect'
                    : selectedSpecialization.toLowerCase() || 'psychiatry',
                length: noteLength.toLowerCase(),
                llmModel,
              };
            }
            if (importedFollowUpVisits.length > 0) {
              payload.followUpVisits = importedFollowUpVisits.map((v) => v._id);
            }
            if (manualFollowUpText.trim()) {
              payload.followUpText = manualFollowUpText.trim();
            }

            console.log('[TranscriptionComplete] Payload:', payload);

            // Note: We don't remove listeners here because we want to catch the completion event
            // Listeners will clean themselves up after firing

            // Set up socket listeners for streaming (matching guide implementation)
            socket.on('notes_generation_started', (event: any) => {
              if (event.payload?.eventId === session.sessionId) {
                console.log(
                  '[TranscriptionComplete] ✅ Notes generation started:',
                  event.payload.eventId,
                );
              }
            });

            socket.on('notes_generation_chunk', (event: any) => {
              if (event.payload?.eventId === session.sessionId) {
                console.log(
                  '[TranscriptionComplete] 📝 Received chunk (accumulated)',
                );
                // The guide's example uses setNoteContent(event.payload.content) which replaces the content.
                // This suggests the backend sends the full accumulated string.
                if (event.payload?.content !== undefined) {
                  setGeneratedNotes(event.payload.content);
                  generatedNotesRef.current = event.payload.content; // Update ref for socket callbacks
                }
              }
            });

            socket.on('notes_generation_completed', (event: any) => {
              console.log(
                '[TranscriptionComplete] 🎯 Completion event received!',
                event,
              );
              console.log(
                '[TranscriptionComplete] 🔑 Event eventId:',
                event.payload?.eventId,
              );
              console.log(
                '[TranscriptionComplete] 🔑 Session sessionId:',
                session.sessionId,
              );
              console.log(
                '[TranscriptionComplete] 🔑 Match:',
                event.payload?.eventId === session.sessionId,
              );

              if (event.payload?.eventId === session.sessionId) {
                console.log(
                  '[TranscriptionComplete] ✅ Notes generation complete - INSIDE IF',
                );
                console.log(
                  '[TranscriptionComplete] 🔍 Event payload:',
                  event.payload,
                );

                // Use ref to get the latest notes content (state might not be updated yet)
                const contentToSave =
                  event.payload?.content || generatedNotesRef.current;
                console.log(
                  '[TranscriptionComplete] 💾 Content to save length:',
                  contentToSave?.length || 0,
                );
                console.log(
                  '[TranscriptionComplete] 💾 Ref content length:',
                  generatedNotesRef.current?.length || 0,
                );

                if (contentToSave && contentToSave.length > 0) {
                  console.log(
                    '[TranscriptionComplete] 💾 Saving notes and status from completion handler...',
                  );
                  // Use atomic update to prevent race conditions
                  sessionStorage
                    .updateSessionAfterGeneration(
                      session.id,
                      contentToSave,
                      'completed',
                    )
                    .then(() => {
                      console.log(
                        '[TranscriptionComplete] ✅ Session updated (notes + status) successfully!',
                      );
                    })
                    .catch((error) => {
                      console.error(
                        '[TranscriptionComplete] ❌ Failed to update session:',
                        error,
                      );
                    });
                } else {
                  console.warn(
                    '[TranscriptionComplete] ⚠️ No content to save in completion handler',
                  );
                  // Even if no notes, mark completed
                  sessionStorage.updateSessionStatus(session.id, 'completed');
                }

                // Set isGeneratingNotes to false
                setIsGeneratingNotes(false);

                // Clean up listeners AFTER save logic
                socket.off('notes_generation_started');
                socket.off('notes_generation_chunk');
                socket.off('notes_generation_completed');
                socket.off('notes_generation_error');

                customToast(
                  'success',
                  t('common.success'),
                  t('mainContent.transcriptionComplete.notesGeneratedSuccess'),
                );
              } else {
                console.warn(
                  '[TranscriptionComplete] ⚠️ EventId mismatch - not processing',
                );
              }
            });

            socket.on('notes_generation_error', (event: any) => {
              if (event.payload?.eventId === session.sessionId) {
                console.error(
                  '[TranscriptionComplete] ❌ Notes generation error:',
                  event.payload,
                );
                setIsGeneratingNotes(false);

                // Clean up listeners
                socket.off('notes_generation_started');
                socket.off('notes_generation_chunk');
                socket.off('notes_generation_completed');
                socket.off('notes_generation_error');

                customToast(
                  'error',
                  t('common.error'),
                  event.payload?.message ||
                    event.payload?.error ||
                    'Failed to generate notes. Please try again.',
                );
              }
            });

            // Trigger the note generation via HTTP API (as per guide Step 3)
            await generateNotes(session.sessionId, payload);
            console.log(
              '[TranscriptionComplete] 🚀 Triggered generation via API',
            );
          } catch (error: any) {
            console.error(
              '[TranscriptionComplete] Generate notes error:',
              error,
            );
            setIsGeneratingNotes(false);

            customToast(
              'error',
              t('common.error'),
              error?.response?.data?.message ||
                error?.message ||
                'Failed to trigger notes generation.',
            );
          }
        }}
        disabled={!canGenerate || isGeneratingNotes}
        activeOpacity={0.85}>
        <Text variant="bodyMedium" style={styles.floatingGenerateButtonText}>
          {isGeneratingNotes
            ? t('common.generating')
            : t('mainContent.transcriptionComplete.generateNote')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: DESIGN_TOKENS.colors.background },
      ]}
      edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={DESIGN_TOKENS.colors.background}
      />

      {/* Compact Header */}
      <View
        style={[
          styles.compactHeader,
          {
            backgroundColor: DESIGN_TOKENS.colors.background,
            borderBottomColor: DESIGN_TOKENS.colors.borderLight,
          },
        ]}>
        <View style={styles.compactHeaderLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <ChevronLeft size={20} color={DESIGN_TOKENS.colors.text} />
          </TouchableOpacity>

          {(() => {
            const IconComponent = getSessionIcon();
            return (
              <View
                style={[
                  styles.compactIconContainer,
                  {
                    backgroundColor: isDark
                      ? 'rgba(70, 183, 198, 0.15)'
                      : 'rgba(70, 183, 198, 0.1)',
                  },
                ]}>
                <IconComponent size={16} color={DESIGN_TOKENS.colors.primary} />
              </View>
            );
          })()}

          <View style={styles.compactTitleContainer}>
            <Text
              variant="titleMedium"
              style={[
                styles.compactTitle,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              {session.title}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.compactSubtitle,
                { color: DESIGN_TOKENS.colors.textSecondary },
              ]}>
              {getSessionTypeText()}
            </Text>
          </View>
        </View>

        <View style={styles.compactHeaderRight}>
          {session.type === 'patient' && (
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() =>
                (navigation as any).navigate('consult', {
                  transcription: session.transcriptText,
                })
              }>
              <MessageSquare
                size={20}
                color={DESIGN_TOKENS.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => {
              setNewSessionName(session.title);
              setShowRenameModal(true);
            }}>
            <Edit3 size={20} color={DESIGN_TOKENS.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => setShowDeleteModal(true)}>
            <Trash2 size={20} color={DESIGN_TOKENS.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => setShowResetModal(true)}>
            <RotateCcw size={20} color={DESIGN_TOKENS.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {isNoteReady && isConfigCollapsed ? (
        <TouchableOpacity
          style={[
            styles.generatedSummaryBar,
            {
              backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
              borderColor: DESIGN_TOKENS.colors.borderLight,
            },
          ]}
          onPress={handleExpandConfig}
          activeOpacity={0.85}>
          <View style={styles.generatedSummaryTextGroup}>
            <Text
              variant="bodyMedium"
              style={[
                styles.generatedSummaryTitle,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              {getGeneratedSummary()}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.generatedSummarySubtitle,
                { color: DESIGN_TOKENS.colors.textTertiary },
              ]}>
              {t('mainContent.transcriptionComplete.tapToEdit')}
            </Text>
          </View>
          <ChevronDown size={18} color={DESIGN_TOKENS.colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.settingsSection}>
          {isNoteReady && (
            <View style={styles.settingsHeaderRow}>
              <Text
                variant="labelMedium"
                style={[
                  styles.settingsHeaderTitle,
                  { color: DESIGN_TOKENS.colors.textSecondary },
                ]}>
                {t('mainContent.transcriptionComplete.configuration')}
              </Text>
              <TouchableOpacity
                onPress={handleCollapseConfig}
                style={[
                  styles.settingsHeaderAction,
                  {
                    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
                    borderColor: DESIGN_TOKENS.colors.border,
                  },
                ]}>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.settingsHeaderActionText,
                    { color: DESIGN_TOKENS.colors.primary },
                  ]}>
                  {t('mainContent.transcriptionComplete.hide')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 1. SWITCHER (New) */}
          {renderModeSwitch()}
          {renderLegacyNoteButtons()}

          {/* MODEL SELECTOR */}
          <View style={styles.modeSwitchContainer}>
            <Text
              variant="labelMedium"
              style={[
                styles.sectionLabel,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              AI Model
            </Text>
            <View
              style={[
                styles.compactSegmentedControl,
                { backgroundColor: DESIGN_TOKENS.colors.border },
              ]}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  selectedModel === 'standard' && [
                    styles.segmentBtnActive,
                    { backgroundColor: DESIGN_TOKENS.colors.primary },
                  ],
                ]}
                onPress={() => setSelectedModel('standard')}>
                <Text
                  style={[
                    selectedModel === 'standard'
                      ? styles.segmentTextActive
                      : styles.segmentTextInactive,
                    selectedModel === 'standard'
                      ? { color: '#FFF' }
                      : {
                          color: isDark
                            ? DESIGN_TOKENS.colors.textSecondary
                            : '#666',
                        },
                  ]}>
                  Standard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  selectedModel === 'pro' && [
                    styles.segmentBtnActive,
                    { backgroundColor: DESIGN_TOKENS.colors.primary },
                  ],
                ]}
                onPress={() => setSelectedModel('pro')}>
                <Text
                  style={[
                    selectedModel === 'pro'
                      ? styles.segmentTextActive
                      : styles.segmentTextInactive,
                    selectedModel === 'pro'
                      ? { color: '#FFF' }
                      : {
                          color: isDark
                            ? DESIGN_TOKENS.colors.textSecondary
                            : '#666',
                        },
                  ]}>
                  Pro ✨
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. STANDARD MODE */}
          {session.type === 'patient' && generationMode === 'standard' && (
            <View>
              <View style={{ height: hp(1) }} />
              <View style={styles.twoColumnGrid}>
                <View style={styles.gridColumn}>
                  {renderSpecializationSection()}
                </View>
                <View style={styles.gridColumn}>
                  {renderVisitTypeSection()}
                </View>
              </View>
              <View style={{ height: hp(1) }} />
              {renderNoteLengthSection()}

              {visitType === 'Follow-up' && (
                <View style={{ height: hp(0.6) }} />
              )}
              {renderFollowUpSection()}
            </View>
          )}

          {/* 3. CUSTOM MODE */}
          {session.type === 'patient' && generationMode === 'custom' && (
            <View style={{ marginTop: hp(1) }}>
              <CustomTemplateManager
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
                noteType={session.type as 'patient' | 'meeting' | 'lecture'}
                savedPrompts={savedPrompts}
                onRefresh={loadPrompts}
              />
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.noteDocumentContainer,
          {
            backgroundColor: isDark
              ? themeColors.layer2
              : DESIGN_TOKENS.colors.background,
            borderColor: DESIGN_TOKENS.colors.borderLight,
            shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
          },
        ]}>
        {isNoteReady ? (
          <>
            <ScrollView
              ref={noteScrollViewRef}
              style={[
                styles.noteDocumentContent,
                { backgroundColor: DESIGN_TOKENS.colors.background },
              ]}
              contentContainerStyle={styles.noteDocumentScrollContent}
              showsVerticalScrollIndicator={true}>
              <Text
                variant="bodyMedium"
                style={[
                  styles.noteDocumentText,
                  { color: DESIGN_TOKENS.colors.text },
                ]}>
                {(() => {
                  return generatedNotes.split('\n').map((line, lineIndex) => {
                    const cleanLine = line.trim();
                    // Check if line is a heading: formatting is **...** OR content is UPPERCASE (min 4 chars to avoid tiny abbr)
                    const isAllUppercase =
                      cleanLine.length > 3 &&
                      cleanLine === cleanLine.toUpperCase() &&
                      /[A-Z]/.test(cleanLine);

                    if (isAllUppercase) {
                      return (
                        <Text
                          key={lineIndex}
                          style={{
                            fontWeight: '700',
                            fontFamily: DESIGN_TOKENS.fonts.semibold,
                            color: DESIGN_TOKENS.colors.primary,
                          }}>
                          {line}
                          {'\n'}
                        </Text>
                      );
                    }

                    // Standard markdown parsing for lines that aren't full headings
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <Text
                        key={lineIndex}
                        style={{ color: DESIGN_TOKENS.colors.text }}>
                        {parts.map((part, partIndex) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <Text
                                key={partIndex}
                                style={{
                                  fontWeight: '700',
                                  fontFamily: DESIGN_TOKENS.fonts.semibold,
                                  color: DESIGN_TOKENS.colors.primary,
                                }}>
                                {part.slice(2, -2)}
                              </Text>
                            );
                          }
                          return (
                            <Text
                              key={partIndex}
                              style={{ color: DESIGN_TOKENS.colors.text }}>
                              {part}
                            </Text>
                          );
                        })}
                        {'\n'}
                      </Text>
                    );
                  });
                })()}
              </Text>
            </ScrollView>
            <View
              style={[
                styles.noteDocumentFooter,
                {
                  backgroundColor: DESIGN_TOKENS.colors.background,
                  borderTopColor: DESIGN_TOKENS.colors.border,
                },
              ]}>
              <TouchableOpacity
                style={[
                  styles.noteCopyButton,
                  {
                    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
                    borderColor: DESIGN_TOKENS.colors.border,
                  },
                ]}
                onPress={async () => {
                  if (!generatedNotes.trim()) return;
                  await Clipboard.setString(generatedNotes);
                  customToast('success', 'Copied', 'Note copied to clipboard');
                }}>
                <ClipboardIcon size={16} color={DESIGN_TOKENS.colors.primary} />
                <Text
                  variant="bodySmall"
                  style={[
                    styles.noteCopyButtonText,
                    { color: DESIGN_TOKENS.colors.text },
                  ]}>
                  {t('common.copy')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : isGeneratingNotes ? (
          <View style={styles.noteEmptyState}>
            <ActivityIndicator
              size="large"
              color={DESIGN_TOKENS.colors.primary}
            />
            <Text
              variant="bodySmall"
              style={[styles.noteEmptySubtitle, { marginTop: 12 }]}>
              {t('common.generatingNote')}...
            </Text>
          </View>
        ) : (
          <View style={styles.noteEmptyState}>
            <Text
              variant="titleSmall"
              style={[
                styles.noteEmptyTitle,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              {t('mainContent.transcriptionComplete.noNote')}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.noteEmptySubtitle,
                { color: DESIGN_TOKENS.colors.textTertiary },
              ]}>
              {t('mainContent.transcriptionComplete.generateToSee')}
            </Text>
          </View>
        )}
      </View>

      {!isNoteReady || !isConfigCollapsed ? (
        <View
          style={[
            styles.stickyFooter,
            { backgroundColor: DESIGN_TOKENS.colors.background },
          ]}>
          {renderGenerateButton()}
        </View>
      ) : null}

      {/* --- ALL MODALS RESTORED BELOW --- */}

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                ...DESIGN_TOKENS.shadows.large,
              },
            ]}>
            <Text
              variant="titleLarge"
              style={[styles.modalTitle, { color: DESIGN_TOKENS.colors.text }]}>
              {t('mainContent.recording.renameSession')}
            </Text>
            <Input
              placeholder={t('mainContent.recording.sessionNamePlaceholder')}
              value={newSessionName}
              setValue={setNewSessionName}
              width={wp(80)}
              style={{
                color: DESIGN_TOKENS.colors.text,
                borderColor: DESIGN_TOKENS.colors.border,
              }}
              placeholderTextColor={DESIGN_TOKENS.colors.textTertiary}
            />
            <View style={styles.renameButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.renameButton,
                  styles.renameCancelButton,
                  {
                    borderColor: DESIGN_TOKENS.colors.borderLight,
                    backgroundColor: DESIGN_TOKENS.colors.background,
                  },
                ]}
                onPress={() => setShowRenameModal(false)}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.renameCancelText,
                    { color: DESIGN_TOKENS.colors.text },
                  ]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.renameButton,
                  styles.renameSaveButton,
                  isRenaming && styles.renameSaveButtonDisabled,
                  { backgroundColor: DESIGN_TOKENS.colors.primary },
                ]}
                onPress={handleRename}
                disabled={isRenaming}>
                {isRenaming ? (
                  <ActivityIndicator
                    size="small"
                    color={DESIGN_TOKENS.colors.background}
                  />
                ) : (
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.renameSaveText,
                      { color: DESIGN_TOKENS.colors.background },
                    ]}>
                    {t('common.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                ...DESIGN_TOKENS.shadows.large,
              },
            ]}>
            <Text
              variant="titleLarge"
              style={[styles.modalTitle, { color: DESIGN_TOKENS.colors.text }]}>
              {t('mainContent.recording.deleteSession')}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.modalDescription,
                { color: DESIGN_TOKENS.colors.textSecondary },
              ]}>
              {t('common.confirmDelete')}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  {
                    borderColor: DESIGN_TOKENS.colors.borderLight,
                    backgroundColor: DESIGN_TOKENS.colors.background,
                  },
                ]}
                onPress={() => setShowDeleteModal(false)}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.cancelButtonText,
                    { color: DESIGN_TOKENS.colors.text },
                  ]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.deleteButton,
                  {
                    borderColor: DESIGN_TOKENS.colors.error,
                    backgroundColor: DESIGN_TOKENS.colors.error,
                  },
                ]}
                onPress={handleDelete}
                disabled={isDeleting}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.deleteButtonText,
                    { color: DESIGN_TOKENS.colors.background },
                  ]}>
                  {isDeleting ? t('common.deleting') : t('common.delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResetModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                ...DESIGN_TOKENS.shadows.large,
              },
            ]}>
            <Text
              variant="titleLarge"
              style={[styles.modalTitle, { color: DESIGN_TOKENS.colors.text }]}>
              {t('mainContent.recording.resetSession')}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.modalDescription,
                { color: DESIGN_TOKENS.colors.textSecondary },
              ]}>
              {t('common.confirmReset')}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  {
                    borderColor: DESIGN_TOKENS.colors.borderLight,
                    backgroundColor: DESIGN_TOKENS.colors.background,
                  },
                ]}
                onPress={() => setShowResetModal(false)}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.cancelButtonText,
                    { color: DESIGN_TOKENS.colors.text },
                  ]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.deleteButton,
                  {
                    borderColor: DESIGN_TOKENS.colors.error,
                    backgroundColor: DESIGN_TOKENS.colors.error,
                  },
                ]}
                onPress={handleReset}
                disabled={isResetting}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.deleteButtonText,
                    { color: DESIGN_TOKENS.colors.background },
                  ]}>
                  {isResetting ? t('common.resetting') : t('common.reset')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Specialization Selection Modal */}
      <Modal
        visible={showSpecializationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpecializationModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: DESIGN_TOKENS.colors.background },
            ]}>
            <Text
              variant="titleLarge"
              style={[styles.modalTitle, { color: DESIGN_TOKENS.colors.text }]}>
              {t('mainContent.transcriptionComplete.specialization.select')}
            </Text>
            <View style={styles.optionsList}>
              {specializationOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
                      borderColor: DESIGN_TOKENS.colors.borderLight,
                    },
                    selectedSpecialization === option.key && {
                      backgroundColor: DESIGN_TOKENS.colors.primary,
                      borderColor: DESIGN_TOKENS.colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedSpecialization(option.key);
                    setShowSpecializationModal(false);
                  }}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.optionText,
                      { color: DESIGN_TOKENS.colors.text },
                      selectedSpecialization === option.key && {
                        color: '#FFF',
                      },
                    ]}>
                    {option.label}
                  </Text>
                  {selectedSpecialization === option.key && (
                    <Check size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                {
                  width: '100%',
                  backgroundColor: DESIGN_TOKENS.colors.background,
                  borderColor: DESIGN_TOKENS.colors.borderLight,
                },
              ]}
              onPress={() => setShowSpecializationModal(false)}>
              <Text
                variant="bodyMedium"
                style={[
                  styles.cancelButtonText,
                  { color: DESIGN_TOKENS.colors.text },
                ]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Visit Type Selection Modal */}
      <Modal
        visible={showVisitTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVisitTypeModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                ...DESIGN_TOKENS.shadows.large,
              },
            ]}>
            <Text
              variant="titleLarge"
              style={[styles.modalTitle, { color: DESIGN_TOKENS.colors.text }]}>
              {t('mainContent.transcriptionComplete.visitType.select')}
            </Text>
            <View style={styles.optionsList}>
              {visitTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
                      borderColor: DESIGN_TOKENS.colors.borderLight,
                    },
                    visitType === option.key && {
                      backgroundColor: DESIGN_TOKENS.colors.primary,
                      borderColor: DESIGN_TOKENS.colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setVisitType(option.key);
                    setShowVisitTypeModal(false);
                  }}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.optionText,
                      { color: DESIGN_TOKENS.colors.text },
                      visitType === option.key && [
                        styles.selectedOptionText,
                        { color: DESIGN_TOKENS.colors.background },
                      ],
                    ]}>
                    {option.label}
                  </Text>
                  {visitType === option.key && (
                    <Check size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                {
                  width: '100%',
                  backgroundColor: DESIGN_TOKENS.colors.background,
                  borderColor: DESIGN_TOKENS.colors.borderLight,
                },
              ]}
              onPress={() => setShowVisitTypeModal(false)}>
              <Text
                variant="bodyMedium"
                style={[
                  styles.cancelButtonText,
                  { color: DESIGN_TOKENS.colors.text },
                ]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Follow-up Visits Selection Modal */}
      <Modal
        visible={showFollowUpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowUpModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.followUpModalCard,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                ...DESIGN_TOKENS.shadows.large,
              },
            ]}>
            <View style={[styles.followUpModalHeader]}>
              <Text
                variant="titleLarge"
                style={[
                  styles.followUpModalTitle,
                  { color: DESIGN_TOKENS.colors.text },
                ]}>
                {t(
                  'mainContent.transcriptionComplete.followUpVisits.selectDialog.title',
                )}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFollowUpModal(false)}
                style={styles.followUpCloseButton}>
                <X size={18} color={DESIGN_TOKENS.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.followUpSearchBar,
                {
                  backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
                  shadowColor: DESIGN_TOKENS.shadows.small.shadowColor,
                },
              ]}>
              <Search size={18} color={DESIGN_TOKENS.colors.textSecondary} />
              <TextInput
                placeholder={t(
                  'mainContent.transcriptionComplete.followUpVisits.selectDialog.searchPlaceholder',
                )}
                placeholderTextColor={DESIGN_TOKENS.colors.textSecondary}
                value={visitSearchQuery}
                onChangeText={setVisitSearchQuery}
                style={[
                  styles.followUpSearchInput,
                  { color: DESIGN_TOKENS.colors.text },
                ]}
                returnKeyType="search"
              />
            </View>

            <ScrollView
              style={styles.visitsList}
              showsVerticalScrollIndicator={true}>
              {filteredFollowUpVisits.length === 0 ? (
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.noVisitsText,
                    { color: DESIGN_TOKENS.colors.textTertiary },
                  ]}>
                  {availableSessions.length === 0
                    ? t(
                        'mainContent.transcriptionComplete.followUpVisits.selectDialog.noVisitsAvailable',
                      )
                    : t(
                        'mainContent.transcriptionComplete.followUpVisits.selectDialog.noVisitsFound',
                      )}
                </Text>
              ) : (
                filteredFollowUpVisits.map((visit) => {
                  const isSelected = selectedFollowUpVisits.has(visit._id);
                  return (
                    <TouchableOpacity
                      key={visit._id}
                      style={[
                        styles.visitCard,
                        {
                          backgroundColor: DESIGN_TOKENS.colors.background,
                          borderColor: DESIGN_TOKENS.colors.borderLight,
                        },
                        isSelected && [
                          styles.visitCardSelected,
                          {
                            backgroundColor: isDark
                              ? 'rgba(70, 183, 198, 0.15)'
                              : '#F5FBFC',
                            borderColor: DESIGN_TOKENS.colors.primary,
                          },
                        ],
                      ]}
                      onPress={() => handleFollowUpVisitSelect(visit._id)}
                      activeOpacity={0.9}>
                      <View style={styles.visitCardLeft}>
                        <View
                          style={[
                            styles.visitIconCircle,
                            {
                              backgroundColor: isDark
                                ? 'rgba(70, 183, 198, 0.2)'
                                : '#EAF6F8',
                            },
                          ]}>
                          <PhoneCall
                            size={15}
                            color={DESIGN_TOKENS.colors.primary}
                          />
                        </View>
                        <View style={styles.visitInfo}>
                          <Text
                            variant="bodyMedium"
                            style={[
                              styles.visitTitle,
                              { color: DESIGN_TOKENS.colors.text },
                            ]}
                            numberOfLines={1}>
                            {visit.title}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={[
                              styles.visitSubtitle,
                              { color: DESIGN_TOKENS.colors.textSecondary },
                            ]}
                            numberOfLines={1}>
                            {visit.label}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.visitCardRight}>
                        <View
                          style={[
                            styles.visitDateTag,
                            {
                              backgroundColor:
                                DESIGN_TOKENS.colors.backgroundSecondary,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.visitDateTagText,
                              { color: DESIGN_TOKENS.colors.textSecondary },
                            ]}>
                            {new Date(visit.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.visitCheckbox,
                            {
                              borderColor: DESIGN_TOKENS.colors.border,
                              backgroundColor: DESIGN_TOKENS.colors.background,
                            },
                            isSelected && [
                              styles.visitCheckboxSelected,
                              {
                                backgroundColor: DESIGN_TOKENS.colors.primary,
                                borderColor: DESIGN_TOKENS.colors.primary,
                              },
                            ],
                          ]}>
                          {isSelected && (
                            <Check
                              size={14}
                              color={
                                isSelected
                                  ? isDark
                                    ? '#000'
                                    : '#FFF'
                                  : DESIGN_TOKENS.colors.background
                              }
                            />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.followUpImportButton,
                selectedFollowUpVisits.size === 0 && [
                  styles.followUpImportButtonDisabled,
                  { backgroundColor: DESIGN_TOKENS.colors.border },
                ],
                selectedFollowUpVisits.size > 0 && {
                  backgroundColor: DESIGN_TOKENS.colors.primary,
                },
              ]}
              onPress={handleImportFollowUpVisits}
              disabled={selectedFollowUpVisits.size === 0}
              activeOpacity={0.85}>
              <Text style={styles.followUpImportButtonText}>
                {t(
                  'mainContent.transcriptionComplete.followUpVisits.selectDialog.importButton',
                  { count: selectedFollowUpVisits.size },
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Text Input Modal - 2026 Slim Design */}
      <Modal
        visible={showManualTextModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualTextModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.slimModalContent,
              {
                backgroundColor: DESIGN_TOKENS.colors.background,
                ...DESIGN_TOKENS.shadows.large,
              },
            ]}>
            <TouchableOpacity
              onPress={() => setShowManualTextModal(false)}
              style={styles.slimModalClose}>
              <X size={18} color={DESIGN_TOKENS.colors.textSecondary} />
            </TouchableOpacity>

            <Text
              variant="titleMedium"
              style={[
                styles.slimModalTitle,
                { color: DESIGN_TOKENS.colors.text },
              ]}>
              {t(
                'mainContent.transcriptionComplete.followUpVisits.manualContextTitle',
              )}
            </Text>

            <TouchableOpacity
              style={[
                styles.slimPasteButton,
                {
                  backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
                  borderColor: DESIGN_TOKENS.colors.border,
                },
              ]}
              onPress={async () => {
                try {
                  const text = await Clipboard.getString();
                  if (text) {
                    setTempManualText(text);
                    customToast(
                      'success',
                      t(
                        'mainContent.transcriptionComplete.followUpVisits.pastedTitle',
                      ),
                      t(
                        'mainContent.transcriptionComplete.followUpVisits.pastedMessage',
                      ),
                    );
                  }
                } catch (error) {
                  customToast(
                    'error',
                    t('common.error'),
                    t(
                      'mainContent.transcriptionComplete.followUpVisits.pasteFailed',
                    ),
                  );
                }
              }}>
              <ClipboardIcon size={14} color={DESIGN_TOKENS.colors.primary} />
              <Text
                variant="bodySmall"
                style={[
                  styles.slimPasteButtonText,
                  { color: DESIGN_TOKENS.colors.primary },
                ]}>
                {t('mainContent.transcriptionComplete.followUpVisits.paste')}
              </Text>
            </TouchableOpacity>

            <Input
              placeholder={t(
                'mainContent.transcriptionComplete.followUpVisits.typePlaceholder',
              )}
              value={tempManualText}
              setValue={setTempManualText}
              width={wp(80)}
              multiline={true}
              height={hp(20)}
              numberOfLines={8}
              style={{ color: DESIGN_TOKENS.colors.text }}
              placeholderTextColor={DESIGN_TOKENS.colors.textTertiary}
            />

            <View style={styles.slimModalActions}>
              <TouchableOpacity
                style={[
                  styles.slimCancelButton,
                  {
                    backgroundColor: DESIGN_TOKENS.colors.background,
                    borderColor: DESIGN_TOKENS.colors.borderLight,
                  },
                ]}
                onPress={() => setShowManualTextModal(false)}>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.slimCancelText,
                    { color: DESIGN_TOKENS.colors.text },
                  ]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.slimSaveButton,
                  { backgroundColor: DESIGN_TOKENS.colors.primary },
                ]}
                onPress={() => {
                  setManualFollowUpText(tempManualText);
                  setShowManualTextModal(false);
                  if (tempManualText.trim()) {
                    customToast(
                      'success',
                      t(
                        'mainContent.transcriptionComplete.followUpVisits.savedTitle',
                      ),
                      t(
                        'mainContent.transcriptionComplete.followUpVisits.savedMessage',
                      ),
                    );
                  }
                }}>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.slimSaveText,
                    { color: DESIGN_TOKENS.colors.background },
                  ]}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TranscriptionComplete;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  compactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  compactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTitleContainer: {
    flex: 1,
  },
  compactTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.3,
  },
  compactSubtitle: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 12,
    fontFamily: DESIGN_TOKENS.fonts.regular,
    marginTop: 1,
  },
  compactHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactActionButton: {
    padding: 6,
    fontWeight: '600',
  },
  settingsSection: {
    flexShrink: 0,
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: hp(0.8),
    overflow: 'visible',
  },
  settingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
  },
  settingsHeaderTitle: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  settingsHeaderAction: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
  },
  settingsHeaderActionText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.1,
  },
  generatedSummaryBar: {
    marginHorizontal: wp(5),
    marginTop: hp(1.2),
    marginBottom: hp(0.8),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  generatedSummaryTextGroup: {
    flex: 1,
  },
  generatedSummaryTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  generatedSummarySubtitle: {
    color: DESIGN_TOKENS.colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  transcriptWindow: {
    flex: 1,
    marginHorizontal: wp(5),
    marginBottom: hp(1.2),
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderRadius: DESIGN_TOKENS.borderRadius.xxlarge,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.small,
  },
  transcriptWindowCompact: {
    marginTop: hp(0.8),
  },
  transcriptWindowWithFollowUp: {
    marginTop: hp(1.2),
  },
  stickyFooter: {
    flexShrink: 0,
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(2.5) : hp(2),
    backgroundColor: DESIGN_TOKENS.colors.background,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  noteTypeContainer: {
    marginBottom: hp(0.5),
  },
  sectionLabel: {
    color: DESIGN_TOKENS.colors.text,
    fontWeight: '600',
    fontSize: 11,
    marginBottom: hp(0.7),
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  compactSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: DESIGN_TOKENS.colors.border,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    padding: 2,
    gap: 2,
  },
  compactSegmentButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DESIGN_TOKENS.borderRadius.small,
  },
  compactSegmentButtonSelected: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  compactSegmentText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: DESIGN_TOKENS.fonts.medium,
    letterSpacing: -0.1,
  },
  compactSegmentTextSelected: {
    color: DESIGN_TOKENS.colors.background,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
  },
  noteDocumentContainer: {
    flex: 1,
    marginHorizontal: wp(5),
    marginBottom: hp(1.2),
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderRadius: DESIGN_TOKENS.borderRadius.xxlarge,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.small,
  },
  noteDocumentContent: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  noteDocumentScrollContent: {
    paddingVertical: hp(2),
  },
  noteDocumentText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: DESIGN_TOKENS.fonts.regular,
    letterSpacing: -0.2,
  },
  noteDocumentFooter: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    paddingBottom: hp(2.2),
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.border,
    alignItems: 'center',
  },
  noteCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
    minHeight: 44,
  },
  noteCopyButtonText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  noteEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(10),
  },
  noteEmptyTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    marginBottom: 6,
  },
  noteEmptySubtitle: {
    color: DESIGN_TOKENS.colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  customNoteLabel: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
    fontFamily: DESIGN_TOKENS.fonts.semibold,
  },
  customNoteActionButton: {
    padding: 6,
    borderRadius: DESIGN_TOKENS.borderRadius.small,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  selectionSection: {
    marginBottom: hp(0.5),
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: hp(0.5),
  },
  gridColumn: {
    flex: 1,
  },
  compactDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
  },
  compactDropdownValue: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: DESIGN_TOKENS.fonts.medium,
    letterSpacing: -0.2,
    flex: 1,
  },
  compactDropdownPlaceholder: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 13,
    fontFamily: DESIGN_TOKENS.fonts.regular,
    letterSpacing: -0.2,
    flex: 1,
  },
  followUpOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: hp(0.8),
  },
  followUpOptionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(1.5),
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    backgroundColor: DESIGN_TOKENS.colors.background,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  followUpOptionText: {
    marginTop: 4,
    color: DESIGN_TOKENS.colors.text,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.15,
    textAlign: 'center',
  },
  manualTextPreview: {
    backgroundColor: DESIGN_TOKENS.colors.backgroundTertiary,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    padding: wp(2.5),
    marginTop: hp(0.6),
    marginBottom: hp(0.8),
    borderLeftWidth: 3,
    borderLeftColor: DESIGN_TOKENS.colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  manualTextSnippet: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
    fontFamily: DESIGN_TOKENS.fonts.regular,
    letterSpacing: -0.1,
  },
  slimModalContent: {
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderRadius: DESIGN_TOKENS.borderRadius.xxlarge,
    padding: wp(5),
    width: wp(88),
    maxHeight: hp(70),
    ...DESIGN_TOKENS.shadows.large,
  },
  slimModalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  slimModalTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: hp(1.5),
    fontFamily: DESIGN_TOKENS.fonts.displaySemibold,
    letterSpacing: -0.4,
  },
  slimPasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DESIGN_TOKENS.borderRadius.small,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
    marginBottom: hp(1),
  },
  slimPasteButtonText: {
    color: DESIGN_TOKENS.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.1,
  },
  slimModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: hp(1.5),
  },
  slimCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.background,
    minHeight: 38,
    justifyContent: 'center',
  },
  slimCancelText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: DESIGN_TOKENS.fonts.medium,
    letterSpacing: -0.2,
  },
  slimSaveButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    minHeight: 38,
    justifyContent: 'center',
  },
  slimSaveText: {
    color: DESIGN_TOKENS.colors.background,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  generatedNoteContainer: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  generatedNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.border,
  },
  generatedNoteHeaderTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.3,
  },
  generatedNoteContent: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  generatedNoteScrollContent: {
    paddingVertical: hp(2),
  },
  generatedNoteText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: DESIGN_TOKENS.fonts.regular,
    letterSpacing: -0.2,
  },
  generatedNoteFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    paddingBottom: hp(3),
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.border,
    ...DESIGN_TOKENS.shadows.medium,
  },
  generatedNoteActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  generatedNotePrimaryButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  generatedNoteActionText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  generatedNotePrimaryText: {
    color: DESIGN_TOKENS.colors.background,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  importedVisitsContainer: {
    marginTop: hp(0.6),
  },
  importedVisitsCount: {
    color: DESIGN_TOKENS.colors.textTertiary,
    fontSize: 10,
    marginBottom: hp(0.6),
    fontFamily: DESIGN_TOKENS.fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  importedVisitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DESIGN_TOKENS.colors.background,
    padding: wp(2.5),
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    marginBottom: hp(0.6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  importedVisitInfo: {
    flex: 1,
  },
  importedVisitTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  importedVisitDate: {
    color: DESIGN_TOKENS.colors.textTertiary,
    fontSize: 11,
    marginTop: hp(0.3),
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.borderLight,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  transcriptionScrollView: {
    flex: 1,
  },
  transcriptionTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  transcriptionDuration: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 12,
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  transcriptionChatContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(2),
  },
  chatUtterance: {
    marginBottom: hp(2),
  },
  chatUtteranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: hp(0.5),
  },
  chatSpeakerName: {
    color: DESIGN_TOKENS.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.1,
  },
  chatTimestamp: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 11,
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  chatUtteranceText: {
    color: '#0D0D0D',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: DESIGN_TOKENS.fonts.regular,
    letterSpacing: -0.2,
  },
  floatingGenerateButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: wp(8),
    borderRadius: DESIGN_TOKENS.borderRadius.xlarge,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingGenerateButtonDisabled: {
    backgroundColor: DESIGN_TOKENS.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  floatingGenerateButtonText: {
    color: DESIGN_TOKENS.colors.background,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderRadius: DESIGN_TOKENS.borderRadius.xxlarge,
    padding: wp(5),
    width: wp(88),
    maxHeight: hp(80),
    ...DESIGN_TOKENS.shadows.large,
  },
  modalTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: hp(1.5),
    textAlign: 'center',
    fontFamily: DESIGN_TOKENS.fonts.displaySemibold,
    letterSpacing: -0.5,
  },
  modalDescription: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: hp(2),
    lineHeight: 20,
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    gap: 10,
  },
  renameButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.2),
    gap: 10,
  },
  renameButton: {
    flex: 1,
    paddingVertical: hp(1),
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  renameCancelButton: {
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  renameCancelText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: DESIGN_TOKENS.fonts.medium,
    letterSpacing: -0.2,
  },
  renameSaveButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  renameSaveButtonDisabled: {
    opacity: 0.7,
  },
  renameSaveText: {
    color: DESIGN_TOKENS.colors.background,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  modalButton: {
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(4),
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  cancelButtonText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: DESIGN_TOKENS.fonts.medium,
    letterSpacing: -0.2,
  },
  deleteButton: {
    backgroundColor: DESIGN_TOKENS.colors.error,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.error,
  },
  deleteButtonText: {
    color: DESIGN_TOKENS.colors.background,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  optionsList: {
    marginVertical: hp(1.5),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(4),
    borderRadius: DESIGN_TOKENS.borderRadius.xlarge,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    marginBottom: hp(1),
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
  },
  selectedOptionItem: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  optionText: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    fontFamily: DESIGN_TOKENS.fonts.medium,
    letterSpacing: -0.2,
  },
  selectedOptionText: {
    color: DESIGN_TOKENS.colors.background,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
  },
  visitsList: {
    marginVertical: hp(1),
    maxHeight: hp(36),
  },
  noVisitsText: {
    textAlign: 'center',
    color: DESIGN_TOKENS.colors.textTertiary,
    fontSize: 15,
    paddingVertical: hp(3),
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(4),
    borderRadius: DESIGN_TOKENS.borderRadius.xlarge,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    marginBottom: hp(1),
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
  },
  selectedVisitItem: {
    borderColor: DESIGN_TOKENS.colors.primary,
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
  },
  visitInfo: {
    flex: 1,
  },
  visitTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  visitDate: {
    color: DESIGN_TOKENS.colors.textTertiary,
    fontSize: 13,
    marginTop: hp(0.5),
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  followUpModalCard: {
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderRadius: DESIGN_TOKENS.borderRadius.xxlarge,
    padding: wp(5),
    width: wp(88),
    maxHeight: hp(80),
    ...DESIGN_TOKENS.shadows.large,
  },
  followUpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  followUpModalTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.displaySemibold,
    letterSpacing: -0.4,
  },
  followUpCloseButton: {
    padding: 6,
  },
  followUpSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  followUpSearchInput: {
    flex: 1,
    fontSize: 15,
    color: DESIGN_TOKENS.colors.text,
    marginLeft: 10,
    height: 44,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.1),
    paddingHorizontal: wp(3.2),
    borderRadius: DESIGN_TOKENS.borderRadius.xlarge,
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.borderLight,
    marginBottom: hp(0.7),
    ...DESIGN_TOKENS.shadows.small,
  },
  visitCardSelected: {
    borderColor: DESIGN_TOKENS.colors.primary,
    backgroundColor: '#F5FBFC',
  },
  visitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  visitIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAF6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitSubtitle: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
    fontFamily: DESIGN_TOKENS.fonts.regular,
  },
  visitCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  visitDateTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: DESIGN_TOKENS.colors.backgroundSecondary,
  },
  visitDateTagText: {
    color: DESIGN_TOKENS.colors.textSecondary,
    fontSize: 11,
    fontFamily: DESIGN_TOKENS.fonts.medium,
  },
  visitCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DESIGN_TOKENS.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  visitCheckboxSelected: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  followUpImportButton: {
    marginTop: hp(1),
    paddingVertical: 12,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followUpImportButtonDisabled: {
    backgroundColor: DESIGN_TOKENS.colors.border,
  },
  followUpImportButtonText: {
    color: DESIGN_TOKENS.colors.background,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.semibold,
    letterSpacing: -0.2,
  },
  modeSwitchContainer: {
    marginBottom: hp(1),
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  segmentTextActive: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextInactive: {
    color: '#666',
    fontWeight: '500',
    fontSize: 13,
  },
});
