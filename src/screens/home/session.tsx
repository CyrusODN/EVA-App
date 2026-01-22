/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  Square,
  Upload,
  QrCode,
  Clock,
  FileText,
  Users,
  Brain,
  Trash2,
  Edit3,
  RotateCcw,
  X,
  ChevronLeft,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from '@react-native-documents/picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import PrimaryButton from '../../components/primaryButton';
import { colors } from '../../constants/colors';
import { customToast } from '../../utils/toastMessage';
import { sessionStorage, Session as SessionType, SessionType as SessionTypeEnum } from '../../utils/sessionStorage';
import { uploadRecording } from '../../services/authService';
import audioService from '../../services/audioService';

type PickedAudioFile = DocumentPicker.DocumentPickerResponse;


const Session = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Get session data from route params
  const { sessionData, sessionType } = (route.params || {}) as {
    sessionData?: SessionType;
    sessionType?: SessionTypeEnum;
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [_uploadedFile, setUploadedFile] = useState<PickedAudioFile | null>(null);
  const initialTitle =
    (sessionData && sessionData.title) || t('mainContent.recording.newSession');
  const [sessionTitle, setSessionTitle] = useState(initialTitle);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState(initialTitle);
  const [currentSession, setCurrentSession] = useState<SessionType | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionData?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSessionData();
    }, [])
  );

  const loadSessionData = async () => {
    if (sessionData?.id) {
      const latestSession = await sessionStorage.getSessionById(sessionData.id);
      if (latestSession) {
        setCurrentSession(latestSession);
        setSessionTitle(latestSession.title);
        setRenameValue(latestSession.title);
        if (latestSession.hasRecording && latestSession.duration) {
          const [mins, secs] = latestSession.duration.split(':').map(Number);
          setRecordingTime(mins * 60 + secs);
        }
      }
    }
  };


  const session = currentSession || sessionData || {
    id: '1',
    title: t('mainContent.recording.newSession'),
    type: (sessionType as SessionTypeEnum) || 'patient',
    date: new Date().toISOString(),
    duration: null,
    hasRecording: false,
    hasTranscription: false,
    status: 'new',
  };

  // Timer effect for recording
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await audioService.startRecorder();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(t('common.error'), t('session.failedToStartRecording'));
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioUri = await audioService.stopRecorder();
      console.log('[Session] Recording stopped, path:', audioUri);

      setIsRecording(false);
      setIsTranscribing(true);
      const duration = formatTime(recordingTime);

      // Mark session as recorded locally
      await sessionStorage.markSessionAsRecorded(session.id, duration, audioUri);
      await loadSessionData();



      // Upload the recording to backend if we have a sessionId
      const currentSession = await sessionStorage.getSessionById(session.id);
      if (currentSession?.sessionId) {
        console.log('[Session] Uploading recording to backend...');

        const audioFile = {
          uri: audioUri,
          type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
          name: `recording_${currentSession.sessionId}.${Platform.OS === 'ios' ? 'm4a' : 'mp4'}`,
        };

        const uploadResponse = await uploadRecording(currentSession.sessionId, audioFile);
        console.log('[Session] Upload response:', uploadResponse.data);

        // Store transcription data if available
        if (uploadResponse.data?.transcription) {
          await sessionStorage.updateSessionTranscript(
            session.id,
            uploadResponse.data.transcription.text,
            uploadResponse.data.transcription.utterances
          );
        }

        customToast('success', t('common.success'), 'Recording uploaded successfully');
      } else {
        console.warn('[Session] No sessionId available, skipping upload');
      }

      // Navigate to transcription completed screen
      setTimeout(async () => {
        await sessionStorage.updateSessionStatus(session.id, 'transcribed');
        setIsTranscribing(false);
        navigation.replace('transcriptionCompleted', {
          sessionData: session,
          sessionType: session.type,
        });
      }, 3000);
    } catch (error) {
      console.error('[Session] Error uploading recording:', error);
      setIsTranscribing(false);
      customToast('error', t('common.error'), 'Failed to upload recording');

      // Still navigate to transcription screen even if upload fails
      setTimeout(async () => {
        await sessionStorage.updateSessionStatus(session.id, 'transcribed');
        navigation.replace('transcriptionCompleted', {
          sessionData: session,
          sessionType: session.type,
        });
      }, 1000);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const pickedFile = result[0] as PickedAudioFile;
        setUploadedFile(pickedFile);
        setIsTranscribing(true);

        // Mark session as recorded locally
        await sessionStorage.markSessionAsRecorded(session.id, '0:00', pickedFile.uri);
        await loadSessionData();

        // Upload the file to backend if we have a sessionId
        const currentSession = await sessionStorage.getSessionById(session.id);
        if (currentSession?.sessionId) {
          console.log('[Session] Uploading selected file to backend...');

          const audioFile = {
            uri: pickedFile.uri,
            type: pickedFile.type || 'audio/m4a',
            name: pickedFile.name || `upload_${currentSession.sessionId}.m4a`,
          };

          try {
            const uploadResponse = await uploadRecording(currentSession.sessionId, audioFile);
            console.log('[Session] Upload response:', uploadResponse.data);

            // Store transcription data if available
            if (uploadResponse.data?.transcription) {
              await sessionStorage.updateSessionTranscript(
                session.id,
                uploadResponse.data.transcription.text,
                uploadResponse.data.transcription.utterances
              );
            }

            customToast('success', t('common.success'), 'File uploaded successfully');
          } catch (uploadError) {
            console.error('[Session] Error uploading file:', uploadError);
            customToast('error', t('common.error'), 'Failed to upload file');
          }
        } else {
          console.warn('[Session] No sessionId available, skipping upload');
        }

        // Navigate to transcription completed screen
        setTimeout(async () => {
          await sessionStorage.updateSessionStatus(session.id, 'transcribed');
          setIsTranscribing(false);
          navigation.replace('transcriptionCompleted', {
            sessionData: session,
            sessionType: session.type,
          });
        }, 3000);
      }
    } catch (err: any) {
      console.error('[Session] Error picking file:', err);
      // Only show alert if it's not a user cancellation
      if (err?.message && !err.message.includes('cancel')) {
        Alert.alert(t('session.error'), t('session.failedToPickAudio'));
      }
    }
  };



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

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false);
    await sessionStorage.deleteSession(session.id);
    customToast('success', t('common.success'), 'Session deleted');
    navigation.goBack();
  };
  const handleRenameOpen = () => {
    setRenameValue(sessionTitle);
    setShowRenameDialog(true);
  };
  const handleRenameSave = async () => {
    const newTitle = renameValue.trim() || sessionTitle;
    setSessionTitle(newTitle);
    setShowRenameDialog(false);
    await sessionStorage.updateSessionTitle(session.id, newTitle);
    customToast('success', t('common.success'), 'Session renamed');
  };

  const handleRestart = async () => {
    // Reset local state first
    setIsRecording(false);
    setRecordingTime(0);
    setIsTranscribing(false);
    setUploadedFile(null);
    setShowQRCode(false);

    // Reset session in storage
    await sessionStorage.resetSession(session.id);

    // Reload session data
    await loadSessionData();

    customToast('success', t('common.success'), 'Session restarted');
  };

  const renderRecordingState = () => {
    if (isTranscribing) {
      return (
        <View style={styles.processingSection}>
          <View style={styles.processingCard}>
            <ActivityIndicator
              size="large"
              color="#46B7C6"
              style={styles.loadingSpinner}
            />
            <Text variant="headlineSmall" style={styles.processingTitle}>
              {t('session.processingAudio')}
            </Text>
            <Text variant="bodyMedium" style={styles.processingDescription}>
              {t('session.processingDescription')}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <>
        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <View style={styles.recordingCard}>
            <View style={styles.recordingHeader}>
              <Text variant="titleLarge" style={styles.recordingTitle}>
                {isRecording
                  ? t('session.recordingInProgress')
                  : t('session.startRecording')}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
            >
              <View style={[
                styles.recordButtonContent,
                { backgroundColor: isRecording ? '#ef4444' : '#46B7C6' }
              ]}>
                {isRecording ? (
                  <Square size={32} color="white" fill="white" />
                ) : (
                  <Mic size={32} color="white" />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.timerContainer}>
              <Clock size={16} color={isRecording ? '#ef4444' : '#86868b'} />
              <Text
                variant="titleSmall"
                style={[styles.timerText, { color: isRecording ? '#ef4444' : '#86868b' }]}
              >
                {formatTime(recordingTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={handleFileUpload}
          >
            <View style={styles.uploadContent}>
              <Upload size={32} color="#86868b" />
              <Text variant="titleMedium" style={styles.uploadTitle}>
                {t('session.uploadAudioFile')}
              </Text>
              <Text variant="bodySmall" style={styles.uploadDescription}>
                {t('session.selectAudioFile')}
              </Text>
              <Text variant="bodySmall" style={styles.uploadFormats}>
                {t('session.supportedFormats')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <TouchableOpacity
            style={styles.qrCard}
            onPress={() => setShowQRCode(!showQRCode)}
          >
            <View style={styles.qrContent}>
              <QrCode size={32} color="#46B7C6" />
              <Text variant="titleMedium" style={styles.qrTitle}>
                {t('session.connectExternalDevice')}
              </Text>
              <Text variant="bodySmall" style={styles.qrDescription}>
                {t('session.scanToConnect')}
              </Text>
            </View>
          </TouchableOpacity>

          {showQRCode && (
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={`https://app.remedius.com/connect/${session.id}`}
                  size={120}
                  color="#000"
                  backgroundColor="#fff"
                />
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Compact Header - Pro Tool Style */}
      <View style={styles.compactHeader}>
        <View style={styles.compactHeaderLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={20} color="#000000" />
          </TouchableOpacity>

          {(() => {
            const IconComponent = getSessionIcon();
            return (
              <View style={styles.compactIconContainer}>
                <IconComponent size={16} color="white" />
              </View>
            );
          })()}

          <View style={styles.compactTitleContainer}>
            <Text variant="titleMedium" style={styles.compactTitle}>
              {sessionTitle}
            </Text>
            <Text variant="bodySmall" style={styles.compactSubtitle}>
              {getSessionTypeText()}
            </Text>
          </View>
        </View>

        {/* Action Icons - Minimal, In Header */}
        <View style={styles.compactHeaderRight}>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handleRenameOpen}
          >
            <Edit3 size={20} color="#A6A6A6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handleRestart}
          >
            <RotateCcw size={20} color="#A6A6A6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={20} color="#A6A6A6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderRecordingState()}
      </ScrollView>

      <Modal transparent visible={showDeleteDialog} animationType="fade" onRequestClose={() => setShowDeleteDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowDeleteDialog(false)}>
              <X size={18} color={colors.onSurface} />
            </TouchableOpacity>
            <Text variant="headlineLarge" style={styles.modalTitle}>Delete Session</Text>
            <Text variant="bodyMedium" style={styles.modalDescription}>
              Are you sure you want to delete this session? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowDeleteDialog(false)}>
                <Text variant="titleSmall" style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalDangerButton]} onPress={handleDeleteConfirm}>
                <Text variant="titleSmall" style={styles.modalDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showRenameDialog} animationType="fade" onRequestClose={() => setShowRenameDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowRenameDialog(false)}>
              <X size={18} color={colors.onSurface} />
            </TouchableOpacity>
            <Text variant="headlineLarge" style={styles.modalTitle}>Rename Session</Text>
            <View style={styles.renameInputWrapper}>
              <TextInput
                value={renameValue}
                onChangeText={setRenameValue}
                style={styles.renameInput}
                placeholder="Session name"
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowRenameDialog(false)}>
                <Text variant="titleSmall" style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalPrimaryButton]} onPress={handleRenameSave}>
                <Text variant="titleSmall" style={styles.modalPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Session;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Compact Pro Tool Header (All in one line)
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
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
    borderRadius: 8,
    backgroundColor: '#46B7C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTitleContainer: {
    flex: 1,
  },
  compactTitle: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: -0.3,
  },
  compactSubtitle: {
    color: '#A6A6A6',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    marginTop: 1,
  },
  compactHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactActionButton: {
    padding: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(4),
  },
  scrollContent: {
    paddingBottom: hp(15),
    flexGrow: 1,
  },
  recordingSection: {
    marginBottom: hp(4),
  },
  recordingCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    height: hp(30),
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recordingHeader: {
    alignItems: 'center',
  },
  recordingTitle: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
    letterSpacing: -0.5,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  timerText: {
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
    fontWeight: '500',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  recordButton: {
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  recordButtonActive: {
    shadowColor: '#ef4444',
    shadowOpacity: 0.15,
    elevation: 6,
  },
  recordButtonContent: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadSection: {
    marginBottom: hp(4),
  },
  uploadCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  uploadContent: {
    padding: wp(6),
    alignItems: 'center',
  },
  uploadTitle: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 17,
    marginTop: hp(1.5),
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: -0.3,
  },
  uploadDescription: {
    color: '#86868b',
    marginTop: hp(0.8),
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  uploadFormats: {
    color: '#86868b',
    marginTop: hp(0.5),
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  qrSection: {
    marginBottom: hp(4),
  },
  qrCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  qrContent: {
    padding: wp(6),
    alignItems: 'center',
  },
  qrTitle: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 17,
    marginTop: hp(1.5),
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: -0.3,
  },
  qrDescription: {
    color: '#86868b',
    marginTop: hp(0.8),
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: hp(2),
    paddingBottom: hp(2),
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  processingSection: {
    marginBottom: hp(3),
  },
  processingCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: hp(4),
    paddingHorizontal: wp(5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingSpinner: {
    marginBottom: hp(2.5),
  },
  processingTitle: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
    letterSpacing: -0.4,
    marginBottom: hp(1),
  },
  processingDescription: {
    color: '#86868b',
    textAlign: 'center',
    fontSize: 14,
    marginTop: hp(1),
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  completedSection: {
    marginBottom: hp(3),
  },
  completedCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: wp(8),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedTitle: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 22,
    textAlign: 'center',
    marginTop: hp(2),
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
    letterSpacing: -0.5,
  },
  completedDescription: {
    color: '#86868b',
    textAlign: 'center',
    marginTop: hp(1),
    marginBottom: hp(3),
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: wp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: hp(1.5),
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
    letterSpacing: -0.5,
  },
  modalDescription: {
    color: '#86868b',
    fontSize: 15,
    marginBottom: hp(2),
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: hp(2),
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  modalButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
    letterSpacing: -0.2,
  },
  modalDangerButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  modalDangerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: -0.2,
  },
  modalPrimaryButton: {
    backgroundColor: '#46B7C6',
    borderColor: '#46B7C6',
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: -0.2,
  },
  renameInputWrapper: {
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  renameInput: {
    color: '#000000',
    fontSize: 17,
    height: 40,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    letterSpacing: -0.3,
  },
});
