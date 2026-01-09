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
    Play,
    Pause,
  } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from '@react-native-documents/picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import PrimaryButton from '../../components/primaryButton';
import Header from '../../components/header';
import { colors } from '../../constants/colors';
import LinearGradient from 'react-native-linear-gradient';
import { LinearGradientColors } from '../../constants/linearGradientColors';
import { customToast } from '../../utils/toastMessage';
import { sessionStorage, Session as SessionType, SessionType as SessionTypeEnum } from '../../utils/sessionStorage';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= recordingTime) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleGenerateNotes = () => {
    sessionStorage.updateSessionStatus(session.id, 'transcribed');
    navigation.replace('transcriptionCompleted', {
      sessionData: session,
      sessionType: session.type,
    });
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

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    Alert.alert(t('common.confirm'), t('session.stopRecordingConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          setIsTranscribing(true);
          const duration = formatTime(recordingTime);
          await sessionStorage.markSessionAsRecorded(session.id, duration);
          await loadSessionData();
          setTimeout(async () => {
            setIsTranscribing(false);
          }, 3000);
        },
      },
    ]);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        setUploadedFile(result[0] as PickedAudioFile);
        setIsTranscribing(true);
        await sessionStorage.markSessionAsRecorded(session.id, '0:00');
        await loadSessionData();
        setTimeout(async () => {
          setIsTranscribing(false);
        }, 3000);
      }
    } catch (err: any) {
      Alert.alert(t('session.error'), t('session.failedToPickAudio'));
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
    await sessionStorage.resetSession(session.id);
    await loadSessionData();
    setIsRecording(false);
    setRecordingTime(0);
    setIsTranscribing(false);
    setUploadedFile(null);
    customToast('success', t('common.success'), 'Session restarted');
  };

  const renderRecordingState = () => {
    if (isTranscribing) {
      return (
        <View style={styles.processingSection}>
          <View style={styles.processingCard}>
            <View style={styles.loadingSpinner}>
              <Text variant="headlineSmall" style={styles.processingTitle}>
                {t('session.processingAudio')}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.processingDescription}>
              {t('session.processingDescription')}
            </Text>
          </View>
        </View>
      );
    }

    if (session.status === 'recorded') {
      return (
        <View style={styles.completedSection}>
          <View style={styles.completedCard}>
            <Mic size={58} color="#f59e0b" />
            <Text variant="headlineMedium" style={styles.completedTitle}>
              {t('session.recordingComplete')}
            </Text>
            <Text variant="bodyMedium" style={styles.completedDescription}>
              {t('session.recordingCompleteDescription')}
            </Text>
            
            <View style={styles.timerContainer}>
              <Clock size={20} color={colors.onSecondary} />
              <Text variant="titleMedium" style={{ color: colors.onSecondary }}>
                {isPlaying ? formatTime(playbackTime) : session.duration}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={handlePlayPause}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706', '#b45309']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playPauseButtonGradient}
              >
                {isPlaying ? (
                  <Pause size={28} color="white" />
                ) : (
                  <Play size={28} color="white" fill="white" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <PrimaryButton
              text={t('session.generateNotes')}
              onPress={handleGenerateNotes}
              width={wp(75)}
              iconComponent={FileText}
            />
          </View>
        </View>
      );
    }

    return (
      <>
        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <View
            style={[
              styles.recordingCard,
              { backgroundColor: isRecording ? '#fef2f2' : '#f0f9ff' },
            ]}
          >
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
              <LinearGradient
                colors={
                  isRecording
                    ? ['#ef4444', '#dc2626', '#b91c1c']
                    : LinearGradientColors
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recordButtonGradient}
              >
                {isRecording ? (
                  <Square size={32} color="white" fill="white" />
                ) : (
                  <Mic size={32} color="white" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            {
              <View style={styles.timerContainer}>
                <Clock size={16} color={isRecording ? '#ef4444' : '#64748b'} />
                <Text
                  variant="titleSmall"
                  style={{ color: isRecording ? '#ef4444' : '#64748b' }}
                >
                  {formatTime(recordingTime)}
                </Text>
              </View>
            }
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={handleFileUpload}
          >
            <View style={styles.uploadContent}>
              <Upload size={32} color="#64748b" />
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
              <QrCode size={32} color="#d97706" />
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title={sessionTitle}
        subtitle={getSessionTypeText()}
        onLeftPress={() => navigation.goBack()}
        icon={getSessionIcon()}
        showIcon={true}
        backgroundColor={colors.surface}
        textColor={colors.onSurface}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleRenameOpen}>
          <Edit3 size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleRestart}>
          <RotateCcw size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowDeleteDialog(true)}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
    backgroundColor: 'white',
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
    paddingTop: hp(2),
  },
  recordingSection: {
    marginBottom: hp(3),
  },
  recordingCard: {
    borderRadius: 16,
    height: hp(25),
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  recordingHeader: {
    alignItems: 'center',
  },
  recordingTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  timer: {
    marginLeft: 6,
    color: '#ef4444',
    // fontWeight: '600',
  },
  recordButton: {
    borderRadius: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonActive: {
    elevation: 12,
    shadowOpacity: 0.4,
  },
  recordButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  playPauseButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadSection: {
    marginBottom: hp(3),
  },
  uploadCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.onSecondary,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadContent: {
    padding: wp(5),
    alignItems: 'center',
  },
  uploadTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: hp(1),
  },
  uploadDescription: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  uploadFormats: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.5),
    fontSize: 11,
    fontStyle: 'italic',
  },
  qrSection: {
    marginBottom: hp(3),
  },
  qrCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  qrContent: {
    padding: wp(5),
    alignItems: 'center',
    backgroundColor: '#fefce8',
  },
  qrTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: hp(1),
  },
  qrDescription: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  qrCodeWrapper: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  processingSection: {
    // marginVertical: hp(5),
  },
  processingCard: {
    borderRadius: 16,
    padding: wp(8),
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
  },
  loadingSpinner: {
    marginBottom: hp(2),
  },
  processingTitle: {
    color: colors.onSurface,
    // fontWeight: '600',
    textAlign: 'center',
  },
  processingDescription: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  completedSection: {
    // marginVertical: hp(5),
  },
  completedCard: {
    borderRadius: 16,
    padding: wp(8),
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
  },
  completedTitle: {
    color: colors.onSurface,
    // fontWeight: '600',
    textAlign: 'center',
    marginTop: hp(2),
  },
  completedDescription: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: hp(1),
    marginBottom: hp(3),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: wp(6),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  modalTitle: {
    color: colors.onSurface,
    marginBottom: hp(1),
  },
  modalDescription: {
    color: colors.onSurfaceVariant,
    marginBottom: hp(2),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: hp(1),
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: colors.surface,
  },
  modalButtonText: {
    color: colors.onSurface,
  },
  modalDangerButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  modalDangerText: {
    color: colors.surface,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalPrimaryText: {
    color: colors.surface,
    fontWeight: '600',
  },
  renameInputWrapper: {
    borderWidth: 1.5,
    borderColor: colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: hp(1),
  },
  renameInput: {
    color: colors.onSurface,
    height: 40,
  },
});
