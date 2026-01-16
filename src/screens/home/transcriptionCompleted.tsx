/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socketService';
import userStore from '../../store/user';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {
  FileText,
  Users,
  Brain,
  Edit3,
  Trash2,
  RotateCcw,
  Clock,
  Plus,
  Check,
  X,
  Search,
  MessageSquare,
  Lock,
  Copy,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import PrimaryButton from '../../components/primaryButton';
import Input from '../../components/input';
import Header from '../../components/header';
import { colors } from '../../constants/colors';
import { LinearGradientColors } from '../../constants/linearGradientColors';
import { customToast } from '../../utils/toastMessage';
import { sessionStorage } from '../../utils/sessionStorage';
import { generateNotes, resetEvent, deleteEvent, updateEvent } from '../../services/authService';
import { createNotesPrompt, getNotesPrompts, deleteNotesPrompt, type NotesPrompt } from '../../services/promptsApi';
import Clipboard from '@react-native-clipboard/clipboard';

Dimensions.get('window');

const TranscriptionComplete = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  // Get session data from route params
  const { sessionData, sessionType } = ((route as any).params || {}) as {
    sessionData?: any;
    sessionType?: string;
  };

  // State management
  const [noteType, setNoteType] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [visitType, setVisitType] = useState<string>('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [showVisitTypeModal, setShowVisitTypeModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [selectedFollowUpVisits, setSelectedFollowUpVisits] = useState<Set<string>>(
    new Set<string>(),
  );
  const [importedFollowUpVisits, setImportedFollowUpVisits] = useState<
    Array<{ _id: string; title: string; date: Date | string }>
  >([]);
  const [visitSearchQuery, setVisitSearchQuery] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string>('');
  const [noteLength, setNoteLength] = useState<'Small' | 'Medium' | 'Large'>(
    'Medium',
  );
  const [customNote, setCustomNote] = useState<string>('');
  const noteLengthOptions: Array<'Small' | 'Medium' | 'Large'> = [
    'Small',
    'Medium',
    'Large',
  ];
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [customPromptTitle, setCustomPromptTitle] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<NotesPrompt[]>([]); // Saved custom prompts
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null); // Currently selected prompt
  const isCustomLocked = noteType === 'custom' || !!customNote.trim();
  const notesScrollViewRef = useRef<any>(null);
  const mainScrollViewRef = useRef<any>(null);
  const notesSectionRef = useRef<any>(null);
  const generatedNotesRef = useRef<string>(''); // Ref to track latest notes for socket callbacks
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState<string>('');

  const handleClearCustomPrompt = () => {
    setCustomNote('');
    setCustomPromptTitle('');
    setNoteType(null);
    customToast('success', t('common.success'), 'Custom prompt cleared');
  };

  const handleDeletePrompt = async (promptId: string, promptTitle: string) => {
    try {
      await deleteNotesPrompt(promptId);

      // Remove from local state
      setSavedPrompts(prev => prev.filter(p => p._id !== promptId));

      // Clear selection if deleted prompt was selected
      if (selectedPromptId === promptId) {
        setSelectedPromptId(null);
        setCustomNote('');
        setCustomPromptTitle('');
        setNoteType(null);
      }

      customToast('success', 'Deleted', `"${promptTitle}" has been deleted`);
      console.log('[TranscriptionComplete] Prompt deleted:', promptId);
    } catch (error: any) {
      console.error('[TranscriptionComplete] Failed to delete prompt:', error);
      customToast('error', 'Error', error?.message || 'Failed to delete prompt');
    }
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

  // State for available sessions to use as follow-up visits
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);

  // Load available sessions for follow-up visits
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await sessionStorage.getAllSessions();
        // Filter to only show sessions with transcriptions, same type, excluding current session
        const filteredSessions = allSessions
          .filter(s =>
            s.type === session.type &&
            s.id !== session.id &&
            s.hasTranscription === true
          )
          .map(s => ({
            _id: s.id,
            title: s.title,
            date: new Date(s.date),
          }));
        setAvailableSessions(filteredSessions);
        console.log('[TranscriptionComplete] Loaded available sessions for follow-up:', filteredSessions.length);
      } catch (error) {
        console.error('[TranscriptionComplete] Failed to load sessions:', error);
      }
    };
    loadSessions();
  }, [session.type, session.id]);

  // Load saved custom prompts for this session type
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const prompts = await getNotesPrompts(session.type as 'patient' | 'meeting' | 'lecture');
        setSavedPrompts(prompts);
        console.log('[TranscriptionComplete] Loaded custom prompts:', prompts.length);
      } catch (error) {
        console.error('[TranscriptionComplete] Failed to load prompts:', error);
      }
    };
    loadPrompts();
  }, [session.type]);

  const filteredFollowUpVisits = availableSessions.filter(visit =>
    visit.title.toLowerCase().includes(visitSearchQuery.toLowerCase()),
  );

  useEffect(() => {
    setNewSessionName(session.title);
  }, [session.title]);
  const [latestSession, setLatestSession] = useState<any>(null);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [utterances, setUtterances] = useState<any[]>([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(true);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoadingTranscript(true);
        setTranscriptError(null);
        console.log('[TranscriptionComplete] Loading session:', session.id);

        const s = await sessionStorage.getSessionById(session.id);
        if (s) {
          console.log('[TranscriptionComplete] Session loaded:', s.title);
          console.log('[TranscriptionComplete] Has transcript:', !!s.transcriptText);
          console.log('[TranscriptionComplete] Transcript length:', s.transcriptText?.length || 0);
          console.log('[TranscriptionComplete] Utterances count:', s.utterances?.length || 0);
          console.log('[TranscriptionComplete] Has generated notes:', !!s.generatedNotes);

          setLatestSession(s);
          setTranscriptText(String(s.transcriptText || ''));
          setUtterances(s.utterances || []);

          // Load previously generated notes if they exist
          if (s.generatedNotes) {
            console.log('[TranscriptionComplete] Loading saved notes, length:', s.generatedNotes.length);
            console.log('[TranscriptionComplete] Notes preview:', s.generatedNotes.substring(0, 100));
            setGeneratedNotes(s.generatedNotes);
            console.log('[TranscriptionComplete] Notes set to state');
          } else {
            console.log('[TranscriptionComplete] No saved notes found');
          }
        } else {
          console.error('[TranscriptionComplete] Session not found:', session.id);
          setTranscriptError('Session not found');
        }
      } catch (error) {
        console.error('[TranscriptionComplete] Error loading session:', error);
        setTranscriptError('Failed to load transcript');
      } finally {
        setIsLoadingTranscript(false);
      }
    })();
  }, [session.id]);

  // Get logged in user from store as a reactive hook
  const loggedInUser = userStore((state: any) => state.loggedInUser);

  // Initialize socket connection with user authentication
  useEffect(() => {
    if (!loggedInUser?.id) {
      console.warn('[TranscriptionComplete] No logged in user, skipping socket connection');
      return;
    }

    console.log('[TranscriptionComplete] Connecting socket with userId:', loggedInUser.id);
    connectSocket(loggedInUser.id);

    // Cleanup on unmount
    return () => {
      console.log('[TranscriptionComplete] Disconnecting socket');
      disconnectSocket();
    };
  }, [loggedInUser?.id]);

  // Auto-scroll to bottom when notes are being generated
  useEffect(() => {
    if (isGeneratingNotes && generatedNotes && notesScrollViewRef.current) {
      // Small delay to ensure content is rendered before scrolling
      setTimeout(() => {
        notesScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [generatedNotes, isGeneratingNotes]);

  // Track the Y position of the notes section
  const [notesSectionY, setNotesSectionY] = useState(0);

  // Auto-scroll to notes section when generation starts
  useEffect(() => {
    if (isGeneratingNotes && mainScrollViewRef.current && notesSectionY > 0) {
      // Small delay to ensure smooth scrolling
      setTimeout(() => {
        mainScrollViewRef.current?.scrollTo({
          y: notesSectionY - 50, // Offset for better visibility
          animated: true
        });
      }, 300);
    }
  }, [isGeneratingNotes, notesSectionY]);

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


  // Save notes to session storage when generation completes
  useEffect(() => {
    // Save when generation completes and we have notes
    if (!isGeneratingNotes && generatedNotes && generatedNotes.length > 50) {
      const saveNotes = async () => {
        try {
          await sessionStorage.updateSessionNotes(session.id, generatedNotes);
          console.log('[TranscriptionComplete] ✅ Notes auto-saved to session storage, length:', generatedNotes.length);
        } catch (error) {
          console.error('[TranscriptionComplete] ❌ Failed to auto-save notes:', error);
        }
      };

      saveNotes();
    }
  }, [isGeneratingNotes]); // Trigger when isGeneratingNotes changes

  const handleRename = async () => {
    if (!newSessionName.trim()) return;
    setIsRenaming(true);
    try {
      // Update on backend if sessionId exists
      if (session.sessionId) {
        try {
          await updateEvent(session.sessionId, { title: newSessionName.trim() });
          console.log('[TranscriptionComplete] Session title updated on backend');
        } catch (error) {
          console.error('[TranscriptionComplete] Failed to update session title on backend:', error);
          // Continue with local update even if backend fails
        }
      }

      // Update in local storage
      await sessionStorage.updateSessionTitle(session.id, newSessionName.trim());
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
      // Delete from backend if sessionId exists
      if (session.sessionId) {
        try {
          await deleteEvent(session.sessionId);
          console.log('[TranscriptionComplete] Session deleted from backend');
        } catch (error) {
          console.error('[TranscriptionComplete] Failed to delete session from backend:', error);
          // Continue with local deletion even if backend fails
        }
      }

      // Delete from local storage
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
      // Reset on backend if sessionId exists
      if (session.sessionId) {
        try {
          await resetEvent(session.sessionId);
          console.log('[TranscriptionComplete] Session reset on backend');
        } catch (error) {
          console.error('[TranscriptionComplete] Failed to reset session on backend:', error);
          // Continue with local reset even if backend fails
        }
      }

      // Reset in local storage
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
    setSelectedFollowUpVisits(prev => {
      const next = new Set(prev);
      next.has(visitId) ? next.delete(visitId) : next.add(visitId);
      return next;
    });
  };

  const handleImportFollowUpVisits = () => {
    const selectedVisitData = availableSessions
      .filter((visit: any) => selectedFollowUpVisits.has(visit._id))
      .map((visit: any) => ({
        _id: visit._id,
        title: visit.title,
        date: visit.date,
      }));
    setImportedFollowUpVisits(selectedVisitData);
    setShowFollowUpModal(false);
    setVisitSearchQuery('');
  };

  const handleNoteTypeSelect = (type: string) => {
    if (type !== 'custom') {
      setCustomNote('');
      setCustomPromptTitle('');
      setShowCustomPromptModal(false);
      setSelectedPromptId(null); // Clear selected custom prompt
    }
    setNoteType(type);
  };

  const renderNoteTypeButtons = () => {
    if (session.type === 'lecture') {
      return (
        <View style={styles.noteTypeContainer}>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'medical' && { borderColor: 'transparent' },
                isCustomLocked && noteType !== 'custom' && styles.disabledNoteTypeButton,
              ]}
              disabled={isCustomLocked && noteType !== 'custom'}
              onPress={() => handleNoteTypeSelect('medical')}
            >
              {noteType === 'medical' && (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.noteTypeOverlayGradient}
                />
              )}
              <View style={{ width: wp(5) }} />
              <Brain size={24} color={noteType === 'medical' ? 'white' : colors.subText} />
              <View style={{ width: wp(2) }} />
              <Text
                variant="bodyMedium"
                style={noteType === 'medical' ? styles.selectedNoteTypeText : styles.noteTypeText}
              >
                {t('mainContent.transcriptionComplete.noteOptions.medicalLecture')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'scientific' && { borderColor: 'transparent' },
                isCustomLocked && noteType !== 'custom' && styles.disabledNoteTypeButton,
              ]}
              disabled={isCustomLocked && noteType !== 'custom'}
              onPress={() => handleNoteTypeSelect('scientific')}
            >
              {noteType === 'scientific' && (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.noteTypeOverlayGradient}
                />
              )}
              <View style={{ width: wp(5) }} />
              <FileText size={24} color={noteType === 'scientific' ? 'white' : colors.subText} />
              <View style={{ width: wp(2) }} />
              <Text
                variant="bodyMedium"
                style={noteType === 'scientific' ? styles.selectedNoteTypeText : styles.noteTypeText}
              >
                {t('mainContent.transcriptionComplete.noteOptions.scientificResearch')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'clinicalPractice' && { borderColor: 'transparent' },
                isCustomLocked && noteType !== 'custom' && styles.disabledNoteTypeButton,
              ]}
              disabled={isCustomLocked && noteType !== 'custom'}
              onPress={() => handleNoteTypeSelect('clinicalPractice')}
            >
              {noteType === 'clinicalPractice' && (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.noteTypeOverlayGradient}
                />
              )}
              <View style={{ width: wp(5) }} />
              <Users size={24} color={noteType === 'clinicalPractice' ? 'white' : colors.subText} />
              <View style={{ width: wp(2) }} />
              <Text
                variant="bodyMedium"
                style={noteType === 'clinicalPractice' ? styles.selectedNoteTypeText : styles.noteTypeText}
              >
                {t('mainContent.transcriptionComplete.noteOptions.clinicalPractice')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'custom' && { borderColor: 'transparent' },
              ]}
              onPress={() => {
                setNoteType('custom');
                setShowCustomPromptModal(true);
              }}
            >
              {noteType === 'custom' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(5) }} />
                  <Plus size={24} color="white" />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    Custom Note
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <View style={{ width: wp(5) }} />
                  <Plus size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    Custom Note
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {isCustomLocked && (
            <View style={styles.customNotePreview}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1) }}>
                <Text variant="titleMedium" style={styles.customNoteTitle}>
                  {customPromptTitle || 'Custom Prompt'}
                </Text>
                <View style={{ flexDirection: 'row', gap: wp(2) }}>
                  <TouchableOpacity onPress={() => setShowCustomPromptModal(true)}>
                    <Edit3 size={18} color={colors.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClearCustomPrompt}>
                    <X size={18} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.customNoteText}>
                {customNote}
              </Text>
            </View>
          )}

          {/* Display saved custom prompts */}
          {savedPrompts.length > 0 && (
            <View style={{ marginTop: hp(2) }}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, marginBottom: hp(1), fontWeight: '600' }}>
                Saved Custom Prompts
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: wp(2) }}
              >
                {savedPrompts.map((prompt) => (
                  <View
                    key={prompt._id}
                    style={[
                      styles.savedPromptCard,
                      selectedPromptId === prompt._id && styles.selectedPromptCard
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: wp(2), flex: 1 }}
                      onPress={() => {
                        setSelectedPromptId(prompt._id);
                        setCustomNote(prompt.content);
                        setCustomPromptTitle(prompt.title);
                        setNoteType('custom');
                        customToast('success', 'Prompt Selected', `Using "${prompt.title}"`);
                      }}
                    >
                      <FileText size={20} color={selectedPromptId === prompt._id ? 'white' : colors.subText} />
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.savedPromptTitle,
                          selectedPromptId === prompt._id && { color: 'white' }
                        ]}
                        numberOfLines={1}
                      >
                        {prompt.title}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      onPress={() => handleDeletePrompt(prompt._id, prompt.title)}
                      style={{ padding: wp(1) }}
                    >
                      <Trash2 size={18} color={selectedPromptId === prompt._id ? 'white' : colors.subText} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      );
    } else if (session.type === 'meeting') {
      return (
        <View style={styles.noteTypeContainer}>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'general' && { borderColor: 'transparent' },
                isCustomLocked && noteType !== 'custom' && styles.disabledNoteTypeButton,
              ]}
              disabled={isCustomLocked && noteType !== 'custom'}
              onPress={() => handleNoteTypeSelect('general')}
            >
              {noteType === 'general' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(5) }} />
                  <FileText size={24} color="white" />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.generalSummary',
                    )}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <View style={{ width: wp(5) }} />
                  <FileText size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.generalSummary',
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'detailed' && { borderColor: 'transparent' },
                isCustomLocked && noteType !== 'custom' && styles.disabledNoteTypeButton,
              ]}
              disabled={isCustomLocked && noteType !== 'custom'}
              onPress={() => handleNoteTypeSelect('detailed')}
            >
              {noteType === 'detailed' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(5) }} />
                  <Brain size={24} color="white" />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.detailedReport',
                    )}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <View style={{ width: wp(5) }} />
                  <Brain size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.detailedReport',
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'custom' && { borderColor: 'transparent' },
              ]}
              onPress={() => {
                setNoteType('custom');
                setShowCustomPromptModal(true);
              }}
            >
              {noteType === 'custom' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(5) }} />
                  <Plus size={24} color="white" />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    Custom Note
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <View style={{ width: wp(5) }} />
                  <Plus size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    Custom Note
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {isCustomLocked && (
            <View style={styles.customNotePreview}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1) }}>
                <Text variant="titleMedium" style={styles.customNoteTitle}>
                  {customPromptTitle || 'Custom Prompt'}
                </Text>
                <View style={{ flexDirection: 'row', gap: wp(2) }}>
                  <TouchableOpacity onPress={() => setShowCustomPromptModal(true)}>
                    <Edit3 size={18} color={colors.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClearCustomPrompt}>
                    <X size={18} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.customNoteText}>
                {customNote}
              </Text>
            </View>
          )}

          {/* Display saved custom prompts */}
          {savedPrompts.length > 0 && (
            <View style={{ marginTop: hp(2) }}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, marginBottom: hp(1), fontWeight: '600' }}>
                Saved Custom Prompts
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: wp(2) }}
              >
                {savedPrompts.map((prompt) => (
                  <View
                    key={prompt._id}
                    style={[
                      styles.savedPromptCard,
                      selectedPromptId === prompt._id && styles.selectedPromptCard
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: wp(2), flex: 1 }}
                      onPress={() => {
                        setSelectedPromptId(prompt._id);
                        setCustomNote(prompt.content);
                        setCustomPromptTitle(prompt.title);
                        setNoteType('custom');
                        customToast('success', 'Prompt Selected', `Using "${prompt.title}"`);
                      }}
                    >
                      <FileText size={20} color={selectedPromptId === prompt._id ? 'white' : colors.subText} />
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.savedPromptTitle,
                          selectedPromptId === prompt._id && { color: 'white' }
                        ]}
                        numberOfLines={1}
                      >
                        {prompt.title}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      onPress={() => handleDeletePrompt(prompt._id, prompt.title)}
                      style={{ padding: wp(1) }}
                    >
                      <Trash2 size={18} color={selectedPromptId === prompt._id ? 'white' : colors.subText} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      );
    } else {
      // Patient session
      return (
        <View style={styles.noteTypeContainer}>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'SOAP' && { borderColor: 'transparent' },
                isCustomLocked && noteType !== 'custom' && styles.disabledNoteTypeButton,
              ]}
              disabled={isCustomLocked && noteType !== 'custom'}
              onPress={() => handleNoteTypeSelect('SOAP')}
            >
              {noteType === 'SOAP' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(5) }} />
                  <FileText size={24} color="white" />
                  <View style={{ width: wp(2) }} />

                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    {t('mainContent.transcriptionComplete.noteOptions.soap')}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <View style={{ width: wp(5) }} />
                  <FileText size={24} color={colors.subText} />
                  <View style={{ width: wp(2) }} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t('mainContent.transcriptionComplete.noteOptions.soap')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View />

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'custom' && { borderColor: 'transparent' },
              ]}
              onPress={() => {
                setNoteType('custom');
                setShowCustomPromptModal(true);
              }}
            >
              {noteType === 'custom' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(5) }} />
                  <Plus size={24} color="white" />
                  <View style={{ width: wp(2) }} />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    Custom Note
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <View style={{ width: wp(5) }} />
                  <Plus size={24} color={colors.subText} />
                  <View style={{ width: wp(2) }} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    Custom Note
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {isCustomLocked && (
            <View style={styles.customNotePreview}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1) }}>
                <Text variant="titleMedium" style={styles.customNoteTitle}>
                  {customPromptTitle || 'Custom Prompt'}
                </Text>
                <View style={{ flexDirection: 'row', gap: wp(2) }}>
                  <TouchableOpacity onPress={() => setShowCustomPromptModal(true)}>
                    <Edit3 size={18} color={colors.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClearCustomPrompt}>
                    <X size={18} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.customNoteText}>
                {customNote}
              </Text>
            </View>
          )}

          {/* Display saved custom prompts */}
          {savedPrompts.length > 0 && (
            <View style={{ marginTop: hp(2) }}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, marginBottom: hp(1), fontWeight: '600' }}>
                Saved Custom Prompts
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: wp(2) }}
              >
                {savedPrompts.map((prompt) => (
                  <View
                    key={prompt._id}
                    style={[
                      styles.savedPromptCard,
                      selectedPromptId === prompt._id && styles.selectedPromptCard
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: wp(2), flex: 1 }}
                      onPress={() => {
                        setSelectedPromptId(prompt._id);
                        setCustomNote(prompt.content);
                        setCustomPromptTitle(prompt.title);
                        setNoteType('custom');
                        customToast('success', 'Prompt Selected', `Using "${prompt.title}"`);
                      }}
                    >
                      <FileText size={20} color={selectedPromptId === prompt._id ? 'white' : colors.subText} />
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.savedPromptTitle,
                          selectedPromptId === prompt._id && { color: 'white' }
                        ]}
                        numberOfLines={1}
                      >
                        {prompt.title}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      onPress={() => handleDeletePrompt(prompt._id, prompt.title)}
                      style={{ padding: wp(1) }}
                    >
                      <Trash2 size={18} color={selectedPromptId === prompt._id ? 'white' : colors.subText} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      );
    }
  };

  const renderSpecializationSection = () => {
    if (session.type !== 'patient') return null;

    const specializations = [
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
        key: 'Smart Select',
        label: t(
          'mainContent.transcriptionComplete.specialization.smartSelect',
        ),
      },
    ];

    return (
      <View style={[styles.selectionSection, isCustomLocked && styles.disabledContainer]}>
        <View style={styles.selectionHeader}>
          <Text variant="titleMedium" style={styles.selectionSectionTitle}>
            {t('mainContent.transcriptionComplete.specialization.select')}
          </Text>
          <Plus size={18} color={colors.lightGreen} />
        </View>
        <View style={styles.pillRow}>
          {specializations.map(s => {
            const selected = selectedSpecialization === s.key;
            if (selected) {
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.pill, styles.pillSelected]}
                  disabled={isCustomLocked}
                  onPress={() =>
                    isCustomLocked ? undefined : setSelectedSpecialization(s.key)
                  }
                >
                  <LinearGradient
                    colors={LinearGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pillOverlayGradient}
                  />
                  <Text variant="labelMedium" style={styles.pillSelectedText}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={s.key}
                style={styles.pill}
                disabled={isCustomLocked}
                onPress={() =>
                  isCustomLocked ? undefined : setSelectedSpecialization(s.key)
                }
              >
                <Text variant="labelMedium" style={styles.pillText}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderVisitTypeSection = () => {
    if (session.type !== 'patient') return null;

    const visitTypes = [
      {
        key: 'First Visit',
        label: t('mainContent.transcriptionComplete.visitType.firstVisit'),
      },
      {
        key: 'Follow-up',
        label: t('mainContent.transcriptionComplete.visitType.followUp'),
      },
    ];

    return (
      <View style={[styles.selectionSection, isCustomLocked && styles.disabledContainer]}>
        <View style={styles.selectionHeader}>
          <Text variant="titleMedium" style={styles.selectionSectionTitle}>
            {t('mainContent.transcriptionComplete.visitType.select')}
          </Text>
          <Plus size={18} color={colors.lightGreen} />
        </View>
        <View style={styles.pillRow}>
          {visitTypes.map(v => {
            const selected = visitType === v.key;
            if (selected) {
              return (
                <TouchableOpacity
                  key={v.key}
                  style={[styles.pill, styles.pillSelected]}
                  disabled={isCustomLocked}
                  onPress={() =>
                    isCustomLocked ? undefined : setVisitType(v.key)
                  }
                >
                  <LinearGradient
                    colors={LinearGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pillOverlayGradient}
                  />
                  <Text variant="labelMedium" style={styles.pillSelectedText}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={v.key}
                style={styles.pill}
                disabled={isCustomLocked}
                onPress={() =>
                  isCustomLocked ? undefined : setVisitType(v.key)
                }
              >
                <Text variant="labelMedium" style={styles.pillText}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNoteLengthSection = () => {
    if (session.type !== 'patient') return null;

    const noteLengthLabels = {
      Small: t('mainContent.transcriptionComplete.noteLength.small'),
      Medium: t('mainContent.transcriptionComplete.noteLength.medium'),
      Large: t('mainContent.transcriptionComplete.noteLength.large'),
    };

    return (
      <View style={[styles.selectionSection, isCustomLocked && styles.disabledContainer]}>
        <View style={styles.selectionHeader}>
          <Text variant="titleMedium" style={styles.selectionSectionTitle}>
            {t('mainContent.transcriptionComplete.noteLength.select')}
          </Text>
          <Plus size={18} color={colors.lightGreen} />
        </View>
        <View style={styles.pillRow}>
          {noteLengthOptions.map(length => {
            const selected = noteLength === length;
            if (selected) {
              return (
                <TouchableOpacity
                  key={length}
                  style={[styles.pill, styles.pillSelected]}
                  disabled={isCustomLocked}
                  onPress={() =>
                    isCustomLocked ? undefined : setNoteLength(length)
                  }
                >
                  <LinearGradient
                    colors={LinearGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pillOverlayGradient}
                  />
                  <Text variant="labelMedium" style={styles.pillSelectedText}>
                    {noteLengthLabels[length]}
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={length}
                style={styles.pill}
                disabled={isCustomLocked}
                onPress={() =>
                  isCustomLocked ? undefined : setNoteLength(length)
                }
              >
                <Text variant="labelMedium" style={styles.pillText}>
                  {noteLengthLabels[length]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderFollowUpSection = () => {
    if (session.type !== 'patient' || visitType !== 'Follow-up') return null;

    return (
      <View style={[styles.selectionSection, isCustomLocked && styles.disabledContainer]}>
        <View style={styles.followUpHeader}>
          <Text variant="titleMedium" style={styles.selectionSectionTitle}>
            {t('mainContent.transcriptionComplete.followUpVisits.select')}
          </Text>
          <TouchableOpacity
            style={styles.addVisitsButton}
            disabled={isCustomLocked}
            onPress={() =>
              isCustomLocked ? undefined : setShowFollowUpModal(true)
            }
          >
            <Plus size={16} color={colors.lightGreen} />
            <Text variant="bodyMedium" style={styles.addVisitsText}>
              {t('mainContent.transcriptionComplete.followUpVisits.addButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {importedFollowUpVisits.length > 0 && (
          <View style={styles.importedVisitsContainer}>
            <Text variant="bodySmall" style={styles.importedVisitsCount}>
              {t(
                'mainContent.transcriptionComplete.followUpVisits.selectedVisits',
                {
                  count: importedFollowUpVisits.length,
                },
              )}
            </Text>
            {importedFollowUpVisits.map(visit => (
              <View key={visit._id} style={styles.importedVisitItem}>
                <View style={styles.importedVisitInfo}>
                  <Text variant="bodyMedium" style={styles.importedVisitTitle}>
                    {visit.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.importedVisitDate}>
                    {new Date(visit.date).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setImportedFollowUpVisits(prev =>
                      prev.filter(v => v._id !== visit._id),
                    );
                  }}
                >
                  <X size={16} color={colors.subText} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTranscriptionSection = () => {
    const displayDuration = session.duration || latestSession?.duration || '00:00';
    const recordingDate = session.date ? new Date(session.date) : new Date();
    const recordingTime = recordingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Show loading state
    if (isLoadingTranscript) {
      return (
        <View style={styles.transcriptionSection}>
          <View style={styles.transcriptionHeader}>
            <Text variant="titleMedium" style={styles.transcriptionTitle}>
              {t('mainContent.transcriptionComplete.transcriptionTitle')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Text variant="bodySmall" style={styles.transcriptionDuration}>
                {t('mainContent.transcriptionComplete.totalDuration')}: {displayDuration}
              </Text>
              <Text variant="bodySmall" style={styles.transcriptionDuration}>
                • {recordingTime}
              </Text>
            </View>
          </View>
          <View style={styles.emptyTranscriptionContent}>
            <View style={styles.emptyTranscriptionContainer}>
              <Text variant="bodyMedium" style={styles.emptyTranscriptionText}>
                Loading transcript...
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Show error state
    if (transcriptError) {
      return (
        <View style={styles.transcriptionSection}>
          <View style={styles.transcriptionHeader}>
            <Text variant="titleMedium" style={styles.transcriptionTitle}>
              {t('mainContent.transcriptionComplete.transcriptionTitle')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Text variant="bodySmall" style={styles.transcriptionDuration}>
                {t('mainContent.transcriptionComplete.totalDuration')}: {displayDuration}
              </Text>
              <Text variant="bodySmall" style={styles.transcriptionDuration}>
                • {recordingTime}
              </Text>
            </View>
          </View>
          <View style={styles.emptyTranscriptionContent}>
            <View style={styles.emptyTranscriptionContainer}>
              <FileText size={48} color="#ef4444" />
              <Text variant="bodyMedium" style={[styles.emptyTranscriptionText, { color: '#ef4444' }]}>
                {transcriptError}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    const hasText = transcriptText && transcriptText.trim().length > 0;
    if (!hasText) return renderEmptyTranscriptionSection();

    // Helper function to format milliseconds to MM:SS
    const formatTimestamp = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // If we have utterances with speaker labels, show conversation format
    const hasUtterances = utterances && utterances.length > 0;

    return (
      <View style={styles.transcriptionSection}>
        <View style={styles.transcriptionHeader}>
          <Text variant="titleMedium" style={styles.transcriptionTitle}>
            {t('mainContent.transcriptionComplete.transcriptionTitle')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Text variant="bodySmall" style={styles.transcriptionDuration}>
              {t('mainContent.transcriptionComplete.totalDuration')}: {displayDuration}
            </Text>
            <Text variant="bodySmall" style={styles.transcriptionDuration}>
              • {recordingTime}
            </Text>
          </View>
        </View>
        <ScrollView
          style={styles.transcriptionContent}
          showsVerticalScrollIndicator={false}
        >
          {hasUtterances ? (
            // Show conversation format with speakers and timestamps
            utterances.map((utterance, index) => {
              const speaker = utterance.speaker || 'Speaker';
              const speakerLabel = session.type === 'patient'
                ? (speaker === 'A' ? 'Patient' : 'Doctor')
                : `Speaker ${speaker}`;
              const startTime = formatTimestamp(utterance.start);
              const endTime = formatTimestamp(utterance.end);
              const timeRange = `${startTime} - ${endTime}`;

              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: speaker === 'A' ? '#f0f9ff' : '#fef3f2',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text
                      variant="titleSmall"
                      style={{
                        color: speaker === 'A' ? '#0369a1' : '#dc2626',
                        fontWeight: '600'
                      }}
                    >
                      • {speakerLabel}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        variant="bodySmall"
                        style={{ color: '#6b7280', fontSize: 12 }}
                      >
                        🕐 {timeRange}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodyMedium" style={{ color: '#1f2937', lineHeight: 22 }}>
                    {utterance.text}
                  </Text>
                </View>
              );
            })
          ) : (
            // Fallback to plain text if no utterances
            <View style={styles.utteranceItem}>
              <Text variant="bodyMedium" style={styles.utteranceText}>
                {transcriptText}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const canGenerate =
    noteType &&
    (noteType === 'custom' ||
      session.type !== 'patient' ||
      (selectedSpecialization && visitType));

  const handleGenerateNotes = async () => {
    if (!canGenerate) {
      customToast(
        'error',
        t('common.error'),
        t('errors.noteTypeRequired'),
      );
      return;
    }

    // Check if we have sessionId
    if (!session.sessionId) {
      customToast(
        'error',
        t('common.error'),
        'Session ID not found. Please create a new session.'
      );
      return;
    }

    // Check if we have userId for socket connection
    if (!loggedInUser?.id) {
      console.warn('[TranscriptionComplete] No logged in user ID for socket auth');
      customToast(
        'error',
        t('common.error'),
        'User session error. Please log in again.'
      );
      return;
    }

    // Get socket instance from service
    let socket = getSocket();

    // Fallback: If socket is not initialized, try to connect now
    if (!socket) {
      console.log('[TranscriptionComplete] Socket not initialized, attempting connection now...');
      socket = connectSocket(loggedInUser.id) || null;
    }

    // Check if socket is connected, wait a bit if not
    if (!socket) {
      customToast(
        'error',
        t('common.error'),
        'Socket connection failed. Please try again.'
      );
      return;
    }

    // Wait for socket connection if not connected (max 5 seconds)
    if (!socket.connected) {
      console.log('[TranscriptionComplete] Socket not connected, waiting...');

      let attempts = 0;
      const maxAttempts = 10;

      while (!socket.connected && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        console.log('[TranscriptionComplete] Waiting for connection, attempt:', attempts);
      }

      if (!socket.connected) {
        console.error('[TranscriptionComplete] Socket connection timeout');
        customToast(
          'error',
          t('common.error'),
          'Could not establish connection. Please check your internet and try again.'
        );
        return;
      }

      console.log('[TranscriptionComplete] Socket connected after waiting');
    }

    setIsGeneratingNotes(true);
    setGeneratedNotes(''); // Clear previous notes

    try {
      console.log('[TranscriptionComplete] Generating notes via API + Socket...');
      console.log('[TranscriptionComplete] Session ID:', session.sessionId);

      // Prepare payload matching backend expectations from guide
      // Set appropriate default noteType based on session type
      const defaultNoteType = session.type === 'lecture' ? 'medical'
        : session.type === 'meeting' ? 'general'
          : 'SOAP';

      const payload: any = {
        noteType: noteType || defaultNoteType,
        visitType: visitType.toLowerCase().replace(' ', '-') || 'first-visit',
        specialization: selectedSpecialization.toLowerCase() || 'psychiatry',
        length: noteLength.toLowerCase(),
        llmModel: 'gpt-4.1',
      };

      // Add promptId if custom note is selected
      if (noteType === 'custom' && selectedPromptId) {
        payload.promptId = selectedPromptId;
        console.log('[TranscriptionComplete] Using custom prompt ID:', selectedPromptId);
      }

      console.log('[TranscriptionComplete] Payload:', payload);

      // Note: We don't remove listeners here because we want to catch the completion event
      // Listeners will clean themselves up after firing

      // Set up socket listeners for streaming (matching guide implementation)
      socket.on('notes_generation_started', (event: any) => {
        if (event.payload?.eventId === session.sessionId) {
          console.log('[TranscriptionComplete] ✅ Notes generation started:', event.payload.eventId);
        }
      });

      socket.on('notes_generation_chunk', (event: any) => {
        if (event.payload?.eventId === session.sessionId) {
          console.log('[TranscriptionComplete] 📝 Received chunk (accumulated)');
          // The guide's example uses setNoteContent(event.payload.content) which replaces the content.
          // This suggests the backend sends the full accumulated string.
          if (event.payload?.content !== undefined) {
            setGeneratedNotes(event.payload.content);
            generatedNotesRef.current = event.payload.content; // Update ref for socket callbacks
          }
        }
      });

      socket.on('notes_generation_completed', (event: any) => {
        console.log('[TranscriptionComplete] 🎯 Completion event received!', event);
        console.log('[TranscriptionComplete] 🔑 Event eventId:', event.payload?.eventId);
        console.log('[TranscriptionComplete] 🔑 Session sessionId:', session.sessionId);
        console.log('[TranscriptionComplete] 🔑 Match:', event.payload?.eventId === session.sessionId);

        if (event.payload?.eventId === session.sessionId) {
          console.log('[TranscriptionComplete] ✅ Notes generation complete - INSIDE IF');
          console.log('[TranscriptionComplete] 🔍 Event payload:', event.payload);

          // Use ref to get the latest notes content (state might not be updated yet)
          const contentToSave = event.payload?.content || generatedNotesRef.current;
          console.log('[TranscriptionComplete] 💾 Content to save length:', contentToSave?.length || 0);
          console.log('[TranscriptionComplete] 💾 Ref content length:', generatedNotesRef.current?.length || 0);

          if (contentToSave && contentToSave.length > 0) {
            console.log('[TranscriptionComplete] 💾 Saving notes from completion handler...');
            sessionStorage.updateSessionNotes(session.id, contentToSave)
              .then(() => {
                console.log('[TranscriptionComplete] ✅ Notes saved from completion handler successfully!');
              })
              .catch((error) => {
                console.error('[TranscriptionComplete] ❌ Failed to save notes from completion handler:', error);
              });
          } else {
            console.warn('[TranscriptionComplete] ⚠️ No content to save in completion handler');
          }

          // Update session status in local storage
          sessionStorage.updateSessionStatus(session.id, 'completed');

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
            'Notes generated successfully!'
          );
        } else {
          console.warn('[TranscriptionComplete] ⚠️ EventId mismatch - not processing');
        }
      });

      socket.on('notes_generation_error', (event: any) => {
        if (event.payload?.eventId === session.sessionId) {
          console.error('[TranscriptionComplete] ❌ Notes generation error:', event.payload);
          setIsGeneratingNotes(false);

          // Clean up listeners
          socket.off('notes_generation_started');
          socket.off('notes_generation_chunk');
          socket.off('notes_generation_completed');
          socket.off('notes_generation_error');

          customToast(
            'error',
            t('common.error'),
            event.payload?.error || 'Failed to generate notes. Please try again.'
          );
        }
      });

      // Trigger the note generation via HTTP API (as per guide Step 3)
      await generateNotes(session.sessionId, payload);
      console.log('[TranscriptionComplete] 🚀 Triggered generation via API');

    } catch (error: any) {
      console.error('[TranscriptionComplete] Generate notes error:', error);
      setIsGeneratingNotes(false);

      customToast(
        'error',
        t('common.error'),
        error?.response?.data?.message || error?.message || 'Failed to trigger notes generation.'
      );
    }
  };

  const renderEmptyTranscriptionSection = () => {
    return (
      <View style={styles.transcriptionSection}>
        <View style={styles.transcriptionHeader}>
          <Text variant="titleMedium" style={styles.transcriptionTitle}>
            {t('mainContent.transcriptionComplete.transcriptionTitle')}
          </Text>
          <Text variant="bodySmall" style={styles.transcriptionDuration}>
            {t('mainContent.transcriptionComplete.totalDuration')}: 00:00
          </Text>
        </View>

        <View style={styles.emptyTranscriptionContent}>
          <View style={styles.emptyTranscriptionContainer}>
            <FileText size={48} color={colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyTranscriptionText}>
              {t('mainContent.transcriptionComplete.emptyTranscription')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGeneratedNotes = () => {
    if (!generatedNotes) return null;


    const handleCopyNotes = async () => {
      try {
        if (!generatedNotes) {
          customToast('error', t('common.error'), 'No notes to copy');
          return;
        }

        // Copy to clipboard
        await Clipboard.setString(generatedNotes);
        customToast('success', t('common.success'), 'Notes copied to clipboard!');
      } catch (error) {
        console.error('[TranscriptionComplete] Copy error:', error);
        customToast('error', t('common.error'), 'Failed to copy notes');
      }
    };

    const handleCustomize = () => {
      setShowRegenerateModal(true);
    };

    // Helper to render formatted notes text with colored headers
    const renderFormattedText = (text: string) => {
      if (!text) return null;

      const lines = text.split('\n');
      return lines.map((line, index) => {
        let cleanLine = line.trim();
        if (!cleanLine) return <Text key={index}>{'\n'}</Text>;

        // Detect headers: starts with #, bolded with **, or ends with :
        const isMarkdownHeader = cleanLine.startsWith('#');
        const isBoldHeader = cleanLine.startsWith('**') && cleanLine.endsWith('**');
        const isColonHeader = cleanLine.endsWith(':') && cleanLine.length < 100 && !cleanLine.includes('http');

        const isHeader = isMarkdownHeader || isBoldHeader || isColonHeader;

        // Remove markdown symbols # and *
        cleanLine = cleanLine
          .replace(/^#+\s*/, '')      // Remove leading #
          .replace(/\*/g, '')         // Remove all *
          .trim();

        if (isHeader) {
          return (
            <Text key={index} style={styles.notesHeaderLine}>
              {cleanLine}
              {'\n'}
            </Text>
          );
        }

        // For body text, also remove markdown symbols for a clean look
        const fullyCleanLine = line
          .replace(/#+/g, '')
          .replace(/\*/g, '');

        return (
          <Text key={index} style={styles.notesBodyLine}>
            {fullyCleanLine}
            {'\n'}
          </Text>
        );
      });
    };

    return (
      <View
        ref={notesSectionRef}
        style={styles.generatedNotesSection}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          setNotesSectionY(y);
        }}
      >
        {/* Top Toolbar */}
        <View style={styles.notesToolbar}>
          <View style={styles.notesRightActions}>
            <TouchableOpacity onPress={handleCustomize} activeOpacity={0.8}>
              <LinearGradient
                colors={LinearGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.customizeButtonGradient}
              >
                <Sparkles size={16} color="white" />
                <Text style={styles.customizeButtonText}>Customize</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.notesOutlineButton} onPress={handleCopyNotes}>
              <Copy size={16} color="#4B5563" />
              <Text style={styles.notesOutlineButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Card */}
        <View style={styles.notesCard}>
          <ScrollView
            ref={notesScrollViewRef}
            style={styles.notesScroll}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.notesScrollContent}
          >
            <View style={styles.notesPadding}>
              {renderFormattedText(generatedNotes)}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderGenerateButton = () => {
    return (
      <View style={styles.generateButtonContainer}>
        <PrimaryButton
          text={isGeneratingNotes ? 'Generating...' : t('noteGenerator.generate')}
          onPress={handleGenerateNotes}
          disabled={!canGenerate || isGeneratingNotes}
          loading={isGeneratingNotes}
          width={wp(90)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title={session.title}
        subtitle={getSessionTypeText()}
        onLeftPress={() => navigation.goBack()}
        icon={getSessionIcon()}
        showIcon={true}
        backgroundColor={colors.surface}
        textColor={colors.onSurface}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {session.type === 'patient' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('consult')}
          >
            <MessageSquare size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowRenameModal(true)}
        >
          <Edit3 size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowResetModal(true)}
        >
          <RotateCcw size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView ref={mainScrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {renderNoteTypeButtons()}
        <View style={{ height: hp(2) }} />
        {renderSpecializationSection()}
        <View style={{ height: hp(1) }} />
        {renderVisitTypeSection()}
        <View style={{ height: hp(1) }} />
        {renderFollowUpSection()}
        <View style={{ height: hp(1) }} />
        {renderNoteLengthSection()}
        <View style={{ height: hp(1) }} />
        {renderTranscriptionSection()}
        {renderGeneratedNotes()}
        {renderGenerateButton()}
      </ScrollView>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {t('mainContent.recording.renameSession')}
            </Text>

            <Input
              placeholder={t('mainContent.recording.sessionNamePlaceholder')}
              value={newSessionName}
              setValue={setNewSessionName}
              width={wp(80)}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text variant="bodyMedium" style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <PrimaryButton
                text={isRenaming ? t('common.saving') : t('common.save')}
                onPress={handleRename}
                loading={isRenaming}
                width={wp(35)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {t('mainContent.recording.deleteSession')}
            </Text>

            <Text variant="bodyMedium" style={styles.modalDescription}>
              {t('common.confirmDelete')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text variant="bodyMedium" style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                <Text variant="bodyMedium" style={styles.deleteButtonText}>
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
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {t('mainContent.recording.resetSession')}
            </Text>

            <Text variant="bodyMedium" style={styles.modalDescription}>
              {t('common.confirmReset')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowResetModal(false)}
              >
                <Text variant="bodyMedium" style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleReset}
                disabled={isResetting}
              >
                <Text variant="bodyMedium" style={styles.deleteButtonText}>
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
        onRequestClose={() => setShowSpecializationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {t('mainContent.transcriptionComplete.specialization.select')}
            </Text>

            <View style={styles.optionsList}>
              {[
                {
                  key: 'Psychiatry',
                  label: t(
                    'mainContent.transcriptionComplete.specialization.psychiatry',
                  ),
                },
                {
                  key: 'Child Psychiatry',
                  label: t(
                    'mainContent.transcriptionComplete.specialization.childPsychiatry',
                  ),
                },
                {
                  key: 'Surgery',
                  label: t(
                    'mainContent.transcriptionComplete.specialization.surgery',
                  ),
                },
                {
                  key: 'Smart Select',
                  label: t(
                    'mainContent.transcriptionComplete.specialization.smartSelect',
                  ),
                },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    selectedSpecialization === option.key &&
                    styles.selectedOptionItem,
                  ]}
                  onPress={() => {
                    setSelectedSpecialization(option.key);
                    setShowSpecializationModal(false);
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.optionText,
                      selectedSpecialization === option.key &&
                      styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedSpecialization === option.key && (
                    <Check size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ alignSelf: 'center' }}>
              <PrimaryButton
                width={wp(77)}
                text={t('common.cancel')}
                onPress={() => setShowSpecializationModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Visit Type Selection Modal */}
      <Modal
        visible={showVisitTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVisitTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {t('mainContent.transcriptionComplete.visitType.select')}
            </Text>

            <View style={styles.optionsList}>
              {[
                {
                  key: 'First Visit',
                  label: t(
                    'mainContent.transcriptionComplete.visitType.firstVisit',
                  ),
                },
                {
                  key: 'Follow-up',
                  label: t(
                    'mainContent.transcriptionComplete.visitType.followUp',
                  ),
                },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    visitType === option.key && styles.selectedOptionItem,
                  ]}
                  onPress={() => {
                    setVisitType(option.key);
                    setShowVisitTypeModal(false);
                  }}
                >
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.optionText,
                      visitType === option.key && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {visitType === option.key && (
                    <Check size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ alignSelf: 'center' }}>
              <PrimaryButton
                width={wp(77)}
                text={t('common.cancel')}
                onPress={() => setShowVisitTypeModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Follow-up Visits Selection Modal */}
      <Modal
        visible={showFollowUpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {t(
                'mainContent.transcriptionComplete.followUpVisits.selectDialog.title',
              )}
            </Text>

            {/* <Text variant="bodyMedium" style={styles.modalDescription}>
              {t(
                'mainContent.transcriptionComplete.followUpVisits.selectDialog.description',
              )} */}
            {/* </Text> */}

            <Text variant="bodySmall" style={styles.followUpInfoText}>
              Only patient visits with completed transcriptions are shown. These visits will be used as context for generating follow-up notes.
            </Text>

            <Input
              placeholder={t(
                'mainContent.transcriptionComplete.followUpVisits.selectDialog.searchPlaceholder',
              )}
              value={visitSearchQuery}
              setValue={setVisitSearchQuery}
              width={wp(80)}
              leftIcon={<Search size={16} color={colors.subText} />}
            />

            <ScrollView style={styles.visitsList} showsVerticalScrollIndicator={true}>
              {filteredFollowUpVisits.length === 0 ? (
                <Text variant="bodyMedium" style={styles.noVisitsText}>
                  {availableSessions.length === 0
                    ? t(
                      'mainContent.transcriptionComplete.followUpVisits.selectDialog.noVisitsAvailable',
                    )
                    : t(
                      'mainContent.transcriptionComplete.followUpVisits.selectDialog.noVisitsFound',
                    )}
                </Text>
              ) : (
                filteredFollowUpVisits.map(visit => (
                  <TouchableOpacity
                    key={visit._id}
                    style={[
                      styles.visitItem,
                      selectedFollowUpVisits.has(visit._id) &&
                      styles.selectedVisitItem,
                    ]}
                    onPress={() => handleFollowUpVisitSelect(visit._id)}
                  >
                    <View style={styles.visitInfo}>
                      <Text variant="bodyMedium" style={styles.visitTitle}>
                        {visit.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.visitDate}>
                        {new Date(visit.date).toLocaleDateString()}
                      </Text>
                    </View>
                    {selectedFollowUpVisits.has(visit._id) && (
                      <Check size={20} color={colors.lightGreen} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFollowUpModal(false)}
              >
                <Text variant="bodyMedium" style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <PrimaryButton
                text={t(
                  'mainContent.transcriptionComplete.followUpVisits.selectDialog.importButton',
                )}
                onPress={handleImportFollowUpVisits}
                width={wp(47)}
              />
            </View>
          </View>
        </View>
      </Modal>


      {/* Regenerate Note Modal */}
      <Modal
        visible={showRegenerateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRegenerateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.regenerateModalContent}>
            <TouchableOpacity
              onPress={() => setShowRegenerateModal(false)}
              style={styles.regenerateCloseButton}
            >
              <X size={20} color={colors.subText} />
            </TouchableOpacity>

            <Text variant="titleLarge" style={styles.regenerateModalTitle}>
              Regenerate Note
            </Text>

            <View style={styles.regenerateInputContainer}>
              <Input
                placeholder="Enter your instructions for regenerating the note..."
                value={regenerateInstructions}
                setValue={setRegenerateInstructions}
                width={wp(80)}
                multiline={true}
                height={hp(15)}
                numberOfLines={6}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                if (!regenerateInstructions.trim()) {
                  customToast('error', 'Error', 'Please enter regeneration instructions');
                  return;
                }
                // TODO: Implement regenerate logic here
                setShowRegenerateModal(false);
                setRegenerateInstructions('');
                customToast('success', 'Success', 'Regenerating note...');
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5DBBA6', '#44C2AD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.regenerateButton}
              >
                <Sparkles size={18} color="white" />
                <Text style={styles.regenerateButtonText}>Regenerate</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Prompt Modal */}
      <Modal
        visible={showCustomPromptModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomPromptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setShowCustomPromptModal(false)}
              style={{
                position: 'absolute',
                top: hp(2),
                right: wp(4),
                zIndex: 2,
              }}
            >
              <X size={20} color={colors.subText} />
            </TouchableOpacity>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Create Custom Prompt
            </Text>
            <Input
              placeholder="Prompt Title"
              value={customPromptTitle}
              setValue={setCustomPromptTitle}
              width={wp(80)}
              leftIcon={<FileText size={16} color={colors.subText} />}
            />
            <View style={{ height: hp(1.5) }} />
            <Input
              placeholder="Enter your custom prompt..."
              value={customNote}
              setValue={setCustomNote}
              width={wp(80)}
              // leftIcon={<Edit3 size={16} color={colors.subText} />}
              multiline={true}
              height={hp(20)}
              numberOfLines={8}
            />
            <View style={{ alignSelf: 'center', marginTop: hp(2) }}>
              <PrimaryButton
                text="Save Custom Prompt"
                onPress={async () => {
                  if (!customPromptTitle.trim() || !customNote.trim()) {
                    customToast('error', 'Error', 'Please add title and prompt');
                    return;
                  }

                  try {
                    // Call API to create custom prompt
                    const createdPrompt = await createNotesPrompt({
                      title: customPromptTitle.trim(),
                      content: customNote.trim(),
                      noteType: session.type as 'patient' | 'meeting' | 'lecture',
                    });

                    console.log('[TranscriptionComplete] Custom prompt created:', createdPrompt);

                    // Reload prompts list to show the new prompt
                    const updatedPrompts = await getNotesPrompts(session.type as 'patient' | 'meeting' | 'lecture');
                    setSavedPrompts(updatedPrompts);

                    setShowCustomPromptModal(false);
                    customToast('success', 'Success', 'Custom prompt saved successfully');

                    // Optionally set noteType to 'custom' after saving
                    setNoteType('custom');
                  } catch (error: any) {
                    console.error('[TranscriptionComplete] Failed to create custom prompt:', error);
                    customToast(
                      'error',
                      'Error',
                      error?.message || 'Failed to save custom prompt'
                    );
                  }
                }}
                width={wp(77)}
                iconComponent={Lock}
              />
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
    backgroundColor: 'white',
  },
  savedPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: 'white',
    width: wp(40),
  },
  selectedPromptCard: {
    borderColor: '#318bc0ff',
    backgroundColor: '#318bc0ff',
  },
  savedPromptTitle: {
    color: colors.onSurface,
    fontWeight: '500',
    flex: 1,

  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    gap: 8,
    backgroundColor: colors.surface,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  noteTypeContainer: {
    // marginVertical: hp(2),
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(2),
  },
  buttonGrid: {
    gap: hp(0.5),
  },
  disabledNoteTypeButton: {
    opacity: 0.35,
    backgroundColor: colors.surfaceDisabled,
  },
  customNotePreview: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: wp(4),
    marginTop: hp(0.7),
    width: wp(90), // Decreased width as requested
  },
  customNoteTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(1),
  },
  customNoteText: {
    color: colors.onSurface,
  },
  noteTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    minHeight: hp(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  selectedNoteTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    minHeight: hp(8),
  },
  noteTypeOverlayGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
  },
  noteTypeText: {
    color: colors.onSurface,
    flex: 1,
    marginLeft: wp(3),
  },
  selectedNoteTypeText: {
    color: 'white',
    marginLeft: wp(3),
  },
  selectionSection: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: wp(4),
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  selectionSectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(1),
    maxWidth: wp(45),
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
  },
  selectionButtonText: {
    color: colors.onSurface,
    flex: 1,
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    // marginTop:hp(2)
  },
  addVisitsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGreen,
  },
  addVisitsText: {
    marginLeft: wp(1),
    color: colors.lightGreen,
  },
  importedVisitsContainer: {
    marginTop: hp(1),
  },
  importedVisitsCount: {
    color: colors.subText,
    marginBottom: hp(1),
  },
  importedVisitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: wp(3),
    borderRadius: 8,
    marginBottom: hp(0.5),
  },
  importedVisitInfo: {
    flex: 1,
  },
  importedVisitTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  importedVisitDate: {
    color: colors.subText,
    marginTop: hp(0.25),
  },
  transcriptionSection: {
    marginVertical: hp(2),
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  transcriptionHeader: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  transcriptionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  transcriptionDuration: {
    color: colors.subText,
    marginTop: hp(0.5),
  },
  transcriptionContent: {
    maxHeight: hp(40),
  },
  emptyTranscriptionContent: {
    minHeight: hp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTranscriptionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(1),
  },
  emptyTranscriptionText: {
    color: colors.subText,
    textAlign: 'center',
  },
  utteranceItem: {
    padding: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  utteranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.5),
  },
  speakerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGreen,
    marginRight: wp(2),
  },
  speakerName: {
    color: colors.lightGreen,
    fontWeight: '600',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.25),
    borderRadius: 12,
  },
  timestamp: {
    color: colors.subText,
    marginLeft: wp(1),
  },
  utteranceText: {
    color: colors.onSurface,
    lineHeight: 20,
    paddingLeft: wp(3),
  },
  generateButtonContainer: {
    alignItems: 'center',
    marginVertical: hp(3),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: wp(6),
    width: wp(90),
    maxHeight: hp(80),
  },
  modalTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(0),
    textAlign: 'center',
  },
  modalDescription: {
    color: colors.subText,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  modalButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: wp(1),
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: colors.onSurface,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: 'white',
  },
  optionsList: {
    marginVertical: hp(1),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(3),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: hp(1),
    backgroundColor: 'white',
  },
  selectedOptionItem: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.lightGreen,
  },
  optionText: {
    color: colors.onSurface,
    flex: 1,
  },
  selectedOptionText: {
    color: 'white',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  pill: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    marginRight: wp(2),
    marginBottom: hp(1),
    overflow: 'hidden',
  },
  pillText: {
    color: colors.onSurface,
  },
  pillSelected: {
    borderColor: 'transparent',
  },
  pillOverlayGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
  },
  pillGradient: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
    marginBottom: hp(1),
    minHeight: 32,
  },
  pillSelectedText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledContainer: {
    opacity: 0.35,
  },
  visitsList: {
    marginVertical: hp(1),
    maxHeight: hp(25), // Height for approximately 3 items
  },
  followUpInfoText: {
    color: '#9333EA', // Light purple
    fontSize: 12,
    lineHeight: 16,
    marginTop: hp(1),
    marginBottom: hp(1.5),
    paddingHorizontal: wp(2),
    opacity: 0.85,
  },
  noVisitsText: {
    textAlign: 'center',
    color: colors.subText,
    paddingVertical: hp(2),
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(3),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: hp(1),
    backgroundColor: 'white',
  },
  selectedVisitItem: {
    borderColor: colors.lightGreen,
    backgroundColor: '#f0f9ff',
  },
  visitInfo: {
    flex: 1,
  },
  visitTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  visitDate: {
    color: colors.subText,
    marginTop: hp(0.25),
  },
  // Generated Notes Styles
  generatedNotesSection: {
    marginHorizontal: wp(5),
    marginVertical: hp(2),
  },
  notesToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  generateNoteButtonGradientSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    borderRadius: 8,
  },
  generateNoteButtonTextSmall: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  notesRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  customizeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: hp(4.1),
    width: wp(35),
    borderRadius: 8,
    justifyContent: 'center',
  },
  customizeButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  notesOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  notesOutlineButtonText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: 'white', // Solid background for efficient shadow rendering
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    width: wp(90),
    minHeight: hp(25),
    maxHeight: hp(70), // Increased for bigger display
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
    alignSelf: 'center',
  },
  notesScroll: {
    flex: 1,
  },
  notesScrollContent: {
    flexGrow: 1,
  },
  notesPadding: {
    padding: wp(4), // Increased padding for better spacing
    paddingBottom: hp(1),
  },
  notesHeaderLine: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A90E2', // Vibrant blue for headers
    lineHeight: 16, // Tighter line height
  },
  notesBodyLine: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20, // Tighter line height for readability
    // marginBottom: 1, // Reduced spacing between lines
  },
  // Regenerate Note Modal Styles
  regenerateModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: wp(6),
    width: wp(90),
    maxHeight: hp(50),
  },
  regenerateCloseButton: {
    position: 'absolute',
    top: hp(2),
    right: wp(4),
    zIndex: 2,
    padding: 8,
  },
  regenerateModalTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(2.5),
    fontSize: 20,
  },
  regenerateInputContainer: {
    alignSelf: 'center',
    width: wp(80),
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: hp(4),
    borderRadius: 8,
    width: '100%',
    marginTop: hp(2),
  },
  regenerateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
