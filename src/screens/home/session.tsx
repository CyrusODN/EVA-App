/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
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
  PermissionsAndroid,
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
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { useCallback } from 'react';
import PrimaryButton from '../../components/primaryButton';
import { colors } from '../../constants/colors';
import { customToast } from '../../utils/toastMessage';
import {
  sessionStorage,
  Session as SessionType,
  SessionType as SessionTypeEnum,
} from '../../utils/sessionStorage';
import { uploadRecording } from '../../services/authService';
import Sound, { PlayBackType, RecordBackType } from 'react-native-nitro-sound';
import { useTheme } from '../../constants/theme';

// const audioRecorderPlayer = new AudioRecorderPlayer();

type PickedAudioFile = DocumentPicker.DocumentPickerResponse;

const Session = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors: themeColors, isDark } = useTheme();

  // Get session data from route params
  const { sessionData, sessionType } = (route.params || {}) as {
    sessionData?: SessionType;
    sessionType?: SessionTypeEnum;
  };

  const isPausedRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [_uploadedFile, setUploadedFile] = useState<PickedAudioFile | null>(
    null,
  );
  const initialTitle =
    (sessionData && sessionData.title) || t('mainContent.recording.newSession');
  const [sessionTitle, setSessionTitle] = useState(initialTitle);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState(initialTitle);
  const [recordedPath, setRecordedPath] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionType | null>(
    null,
  );

  useEffect(() => {
    loadSessionData();
  }, [sessionData?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSessionData();
    }, []),
  );

  const getRNFS = async (): Promise<any | null> => {
    try {
      const mod: any = await import('react-native-fs');
      return mod?.default || mod;
    } catch {
      return null;
    }
  };

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

  const session = currentSession ||
    sessionData || {
      id: '1',
      title: t('mainContent.recording.newSession'),
      type: (sessionType as SessionTypeEnum) || 'patient',
      date: new Date().toISOString(),
      duration: null,
      hasRecording: false,
      hasTranscription: false,
      status: 'new',
    };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Recording Permission',
            message:
              'This app needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      } catch {
        return;
      }
    }
    setRecordingTime(0);
    try {
      Sound.addRecordBackListener((e: RecordBackType) => {
        if (isPausedRef.current) return;
        const pos = Number(e.currentPosition) || 0;
        setRecordingTime(Math.floor(pos / 1000));
      });
      await Sound.startRecorder();
      setIsRecording(true);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        'Audio module is not linked. Please run pod install and rebuild iOS.',
      );
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    isPausedRef.current = true;
    try {
      await Sound.pauseRecorder();
    } catch (err) {
      console.error('[Session] Error pausing recorder:', err);
    }

    Alert.alert(t('common.confirm'), t('session.stopRecordingConfirm'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
        onPress: async () => {
          console.log('[Session] Cancel stop recording - resuming timer');
          try {
            await Sound.resumeRecorder();
            isPausedRef.current = false;
          } catch (err) {
            console.error('[Session] Error resuming recorder:', err);
            // Fallback: unpause UI anyway so user sees active state
            isPausedRef.current = false;
          }
        },
      },
      {
        text: t('common.confirm'),
        onPress: async () => {
          try {
            console.log('[Session] Stopping recorder...');
            const result = await Sound.stopRecorder();

            const path = typeof result === 'string' ? result : null;
            console.log('[Session] Recording stopped, original path:', path);

            if (!path) {
              console.error('[Session] No path returned from stopRecorder');
              Alert.alert(
                t('common.error'),
                'Failed to get recording path. Please try again.',
              );
              return;
            }

            let persistedPath: string | null = null;
            const RNFS = await getRNFS();

            if (RNFS && path) {
              try {
                const dir = `${RNFS.DocumentDirectoryPath}/recordings`;
                console.log('[Session] Creating recordings directory:', dir);

                try {
                  await RNFS.mkdir(dir);
                  console.log('[Session] Directory created/verified');
                } catch (mkdirError) {
                  console.log(
                    '[Session] Directory may already exist:',
                    mkdirError,
                  );
                }

                const ext = path.includes('.')
                  ? `.${path.split('.').pop()}`
                  : '.m4a';
                const dest = `${dir}/${session.id}${ext}`;
                const src = path.startsWith('file://')
                  ? path.replace('file://', '')
                  : path;

                console.log('[Session] Preparing to copy audio file...');
                console.log('[Session] Source:', src);
                console.log('[Session] Destination:', dest);

                // Verify source file exists
                const sourceExists = await RNFS.exists(src);
                if (!sourceExists) {
                  console.error('[Session] Source file does not exist:', src);
                  throw new Error('Source audio file not found');
                }

                const sourceStats = await RNFS.stat(src);
                console.log(
                  '[Session] Source file size:',
                  sourceStats.size,
                  'bytes',
                );

                if (sourceStats.size === 0) {
                  console.error('[Session] Source file is empty');
                  throw new Error('Recorded audio file is empty');
                }

                // Check if destination file already exists and delete it
                const destExists = await RNFS.exists(dest);
                if (destExists) {
                  console.log(
                    '[Session] Destination file already exists, deleting...',
                  );
                  await RNFS.unlink(dest);
                }

                // Copy file
                console.log('[Session] Copying file...');
                await RNFS.copyFile(src, dest);

                // Verify copy succeeded
                const destExistsAfterCopy = await RNFS.exists(dest);
                if (!destExistsAfterCopy) {
                  console.error(
                    '[Session] Copy failed - destination file not created',
                  );
                  throw new Error('Failed to copy audio file');
                }

                const destStats = await RNFS.stat(dest);
                console.log('[Session] File copied successfully');
                console.log(
                  '[Session] Destination file size:',
                  destStats.size,
                  'bytes',
                );

                if (destStats.size === 0) {
                  console.error('[Session] Destination file is empty');
                  throw new Error('Copied audio file is empty');
                }

                persistedPath = dest;
                console.log(
                  '[Session] Audio file persisted at:',
                  persistedPath,
                );
              } catch (copyError: any) {
                console.error('[Session] File copy error:', copyError);
                console.error('[Session] Error message:', copyError?.message);
                // Don't set persistedPath if copy failed
                // Will use original path as fallback
              }
            }

            const finalPath = persistedPath || path;
            console.log('[Session] Final audio path to use:', finalPath);

            setRecordedPath(finalPath);
            const duration = formatTime(recordingTime);
            console.log('[Session] Recording duration:', duration);

            await sessionStorage.markSessionAsRecorded(
              session.id,
              duration,
              finalPath || undefined,
            );
            await loadSessionData();

            // Automatically transcribe the recorded audio
            console.log(
              '[Session] Recording saved. Starting automatic transcription...',
            );
            await transcribeAudio(finalPath);
          } catch (error: any) {
            console.error('[Session] Stop recording error:', error);
            Alert.alert(
              t('common.error'),
              `Failed to stop recording: ${error?.message || 'Unknown error'}`,
            );
          }
        },
      },
    ]);
  };

  const handleFileUpload = async () => {
    try {
      console.log('[Session] Opening file picker...');
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const pickedFile = result[0] as PickedAudioFile;
        console.log('[Session] File picked:', pickedFile.name);
        console.log('[Session] File URI:', pickedFile.uri);
        console.log('[Session] File type:', pickedFile.type);
        console.log('[Session] File size:', pickedFile.size);

        setUploadedFile(pickedFile);
        const uri = pickedFile.uri || null;

        if (!uri) {
          console.error('[Session] No URI in picked file');
          Alert.alert(
            t('session.error'),
            'Failed to get file path. Please try again.',
          );
          return;
        }

        let persistedPath: string | null = null;
        const RNFS = await getRNFS();

        if (RNFS && uri) {
          try {
            const dir = `${RNFS.DocumentDirectoryPath}/recordings`;
            console.log('[Session] Creating recordings directory:', dir);

            try {
              await RNFS.mkdir(dir);
              console.log('[Session] Directory created/verified');
            } catch (mkdirError) {
              console.log('[Session] Directory may already exist:', mkdirError);
            }

            const ext = uri.includes('.') ? `.${uri.split('.').pop()}` : '.m4a';
            const dest = `${dir}/${session.id}${ext}`;
            const src = uri.startsWith('file://')
              ? uri.replace('file://', '')
              : uri;

            console.log('[Session] Preparing to copy uploaded file...');
            console.log('[Session] Source:', src);
            console.log('[Session] Destination:', dest);

            // Verify source file exists
            const sourceExists = await RNFS.exists(src);
            if (!sourceExists) {
              console.error('[Session] Source file does not exist:', src);
              throw new Error('Selected audio file not found');
            }

            const sourceStats = await RNFS.stat(src);
            console.log(
              '[Session] Source file size:',
              sourceStats.size,
              'bytes',
            );

            if (sourceStats.size === 0) {
              console.error('[Session] Source file is empty');
              throw new Error('Selected audio file is empty');
            }

            // Check if destination file already exists and delete it
            const destExistsBefore = await RNFS.exists(dest);
            if (destExistsBefore) {
              console.log(
                '[Session] Destination file already exists, deleting...',
              );
              await RNFS.unlink(dest);
            }

            // Copy file
            console.log('[Session] Copying file...');
            await RNFS.copyFile(src, dest);

            // Verify copy succeeded
            const destExists = await RNFS.exists(dest);
            if (!destExists) {
              console.error(
                '[Session] Copy failed - destination file not created',
              );
              throw new Error('Failed to copy audio file');
            }

            const destStats = await RNFS.stat(dest);
            console.log('[Session] File copied successfully');
            console.log(
              '[Session] Destination file size:',
              destStats.size,
              'bytes',
            );

            if (destStats.size === 0) {
              console.error('[Session] Destination file is empty');
              throw new Error('Copied audio file is empty');
            }

            persistedPath = dest;
            console.log('[Session] Audio file persisted at:', persistedPath);
          } catch (copyError: any) {
            console.error('[Session] File copy error:', copyError);
            console.error('[Session] Error message:', copyError?.message);
            Alert.alert(
              t('session.error'),
              `Failed to copy audio file: ${
                copyError?.message || 'Unknown error'
              }`,
            );
            return;
          }
        }

        const finalPath = persistedPath || uri;
        console.log('[Session] Final audio path to use:', finalPath);

        setRecordedPath(finalPath);
        await sessionStorage.markSessionAsRecorded(
          session.id,
          '00:00',
          finalPath || undefined,
        );
        await loadSessionData();

        // Verify file exists before transcription
        if (finalPath) {
          const RNFS = await getRNFS();
          if (RNFS) {
            const normalizedPath = finalPath.startsWith('file://')
              ? finalPath.replace('file://', '')
              : finalPath;

            try {
              const exists = await RNFS.exists(normalizedPath);
              if (!exists) {
                console.error(
                  '[Session] Audio file does not exist for transcription:',
                  normalizedPath,
                );
                Alert.alert(
                  t('common.error'),
                  'Audio file not found. Please try selecting the file again.',
                );
                return;
              }

              const stats = await RNFS.stat(normalizedPath);
              console.log(
                '[Session] Audio file verified for transcription, size:',
                stats.size,
              );

              if (stats.size === 0) {
                console.error('[Session] Audio file is empty');
                Alert.alert(
                  t('common.error'),
                  'Audio file is empty. Please select a different file.',
                );
                return;
              }
            } catch (error) {
              console.error('[Session] Error verifying audio file:', error);
            }
          }

          console.log('[Session] Starting transcription...');
          await transcribeAudio(finalPath);
        } else {
          console.error('[Session] No audio path available for transcription');
          Alert.alert(
            t('session.error'),
            'Failed to process audio file. Please try again.',
          );
        }
      }
    } catch (err: any) {
      console.error('[Session] File upload error:', err);
      // Check if user cancelled (DocumentPicker returns specific error code)
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('[Session] User cancelled file picker');
      } else {
        Alert.alert(t('session.error'), t('session.failedToPickAudio'));
      }
    }
  };

  const transcribeAudio = async (path: string) => {
    console.log('[Session] Starting transcription for path:', path);

    // Check if we have a sessionId from the server
    if (!session.sessionId) {
      Alert.alert(
        t('common.error'),
        'Session ID not found. Please try creating a new session.',
      );
      return;
    }

    setIsTranscribing(true);
    try {
      console.log('[Session] Uploading audio to server...');
      console.log('[Session] Session ID:', session.sessionId);
      console.log('[Session] Audio path:', path);

      // Get file name and type
      const fileName = path.split('/').pop() || 'recording.m4a';
      const fileType = fileName.endsWith('.m4a') ? 'audio/m4a' : 'audio/mp4';

      // Upload the recording
      const response = await uploadRecording(session.sessionId, {
        uri: path,
        type: fileType,
        name: fileName,
      });

      console.log('[Session] ===== UPLOAD RESPONSE =====');
      console.log('[Session] Response status:', response.status);
      console.log(
        '[Session] Response data:',
        JSON.stringify(response.data, null, 2),
      );
      console.log('[Session] ===== END RESPONSE =====');

      // Check if the request was successful
      if (response.data?.success === true) {
        console.log('[Session] Upload successful!');

        // Extract event data from response
        const eventData = response.data.data?.event;

        if (eventData?.transcription) {
          const { text, utterances } = eventData.transcription;
          console.log('[Session] Transcription text:', text);
          console.log('[Session] Utterances:', utterances);

          // Save transcript to local storage
          if (text) {
            await sessionStorage.updateSessionTranscript(
              session.id,
              text,
              utterances || [],
            );
            await loadSessionData();

            // Navigate to transcription completed screen
            const updatedSession = await sessionStorage.getSessionById(
              session.id,
            );
            console.log('[Session] Navigating to transcription screen...');
            navigation.replace('transcriptionCompleted', {
              sessionData: updatedSession,
              sessionType: session.type,
            });
          } else {
            console.log('[Session] No transcription text in response');
            customToast(
              'error',
              'Warning',
              'Transcription completed but no text was returned.',
            );
          }
        } else {
          console.log(
            '[Session] No transcription data in response yet - will be processed asynchronously',
          );

          // Still navigate to transcription screen so user can wait for transcription
          const updatedSession = await sessionStorage.getSessionById(
            session.id,
          );
          console.log(
            '[Session] Navigating to transcription screen (processing)...',
          );

          customToast(
            'info',
            'Processing',
            'Audio uploaded successfully. Transcription is being processed.',
          );

          navigation.replace('transcriptionCompleted', {
            sessionData: updatedSession,
            sessionType: session.type,
          });
        }
      } else {
        // Handle unsuccessful response
        const errorMessage = response.data?.message || 'Upload failed';
        console.error('[Session] Upload failed:', errorMessage);
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (e: any) {
      console.error('[Session] Transcription error:', e);
      console.error('[Session] Error message:', e?.message);
      console.error('[Session] Error response:', e?.response?.data);

      const msg = String(e?.message || '');

      Alert.alert(
        t('common.error'),
        `Transcription failed: ${msg}\n\nPlease check your internet connection and try again.`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: 'Retry', onPress: () => transcribeAudio(path) },
        ],
      );
    } finally {
      setIsTranscribing(false);
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
    isPausedRef.current = false;
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
          <View
            style={[
              styles.processingCard,
              {
                backgroundColor: isDark ? themeColors.layer2 : '#FAFAFA',
                borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                shadowColor: themeColors.shadowColor,
              },
            ]}>
            <ActivityIndicator
              size="large"
              color={themeColors.accentPrimary}
              style={styles.loadingSpinner}
            />
            <Text
              variant="headlineSmall"
              style={[
                styles.processingTitle,
                { color: themeColors.textPrimary },
              ]}>
              {t('session.processingAudio')}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.processingDescription,
                { color: themeColors.textSecondary },
              ]}>
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
          <View
            style={[
              styles.recordingCard,
              {
                backgroundColor: isDark ? themeColors.layer2 : '#FAFAFA',
                borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                shadowColor: themeColors.shadowColor,
              },
            ]}>
            <View style={styles.recordingHeader}>
              <Text
                variant="titleLarge"
                style={[
                  styles.recordingTitle,
                  { color: themeColors.textPrimary },
                ]}>
                {isRecording
                  ? t('session.recordingInProgress')
                  : t('session.startRecording')}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                {
                  shadowColor: isRecording
                    ? themeColors.error
                    : themeColors.shadowColor,
                },
              ]}
              onPress={
                isRecording ? handleStopRecording : handleStartRecording
              }>
              <View
                style={[
                  styles.recordButtonContent,
                  {
                    backgroundColor: isRecording
                      ? themeColors.error
                      : themeColors.accentPrimary,
                  },
                ]}>
                {isRecording ? (
                  <Square size={32} color="white" fill="white" />
                ) : (
                  <Mic size={32} color="white" />
                )}
              </View>
            </TouchableOpacity>

            <View
              style={[
                styles.timerContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : '#FAFAFA',
                  borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                },
              ]}>
              <Clock
                size={16}
                color={
                  isRecording
                    ? themeColors.error
                    : isDark
                    ? themeColors.textMuted
                    : '#86868b'
                }
              />
              <Text
                variant="titleSmall"
                style={[
                  styles.timerText,
                  {
                    color: isRecording
                      ? themeColors.error
                      : isDark
                      ? themeColors.textMuted
                      : '#86868b',
                  },
                ]}>
                {formatTime(recordingTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={[
              styles.uploadCard,
              {
                backgroundColor: isDark ? themeColors.layer2 : '#FAFAFA',
                borderColor: isDark ? themeColors.borderSubtle : '#E5E5EA',
                shadowColor: themeColors.shadowColor,
              },
            ]}
            onPress={handleFileUpload}>
            <View style={styles.uploadContent}>
              <Upload
                size={32}
                color={isDark ? themeColors.textMuted : '#86868b'}
              />
              <Text
                variant="titleMedium"
                style={[
                  styles.uploadTitle,
                  { color: themeColors.textPrimary },
                ]}>
                {t('session.uploadAudioFile')}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.uploadDescription,
                  { color: themeColors.textSecondary },
                ]}>
                {t('session.selectAudioFile')}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.uploadFormats,
                  { color: themeColors.textMuted },
                ]}>
                {t('session.supportedFormats')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <TouchableOpacity
            style={[
              styles.qrCard,
              {
                backgroundColor: isDark ? themeColors.layer2 : '#FAFAFA',
                borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                shadowColor: themeColors.shadowColor,
              },
            ]}
            onPress={() => setShowQRCode(!showQRCode)}>
            <View style={styles.qrContent}>
              <QrCode size={32} color={themeColors.accentPrimary} />
              <Text
                variant="titleMedium"
                style={[styles.qrTitle, { color: themeColors.textPrimary }]}>
                {t('session.connectExternalDevice')}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.qrDescription,
                  { color: themeColors.textSecondary },
                ]}>
                {t('session.scanToConnect')}
              </Text>
            </View>
          </TouchableOpacity>

          {showQRCode && (
            <View style={styles.qrCodeContainer}>
              <View
                style={[
                  styles.qrCodeWrapper,
                  {
                    backgroundColor: '#FFFFFF', // QR Code needs white background for readability
                    borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                    shadowColor: themeColors.shadowColor,
                  },
                ]}>
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.canvas }]}
      edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.canvas}
      />

      {/* Compact Header - Pro Tool Style */}
      <View
        style={[
          styles.compactHeader,
          {
            backgroundColor: themeColors.canvas,
            borderBottomColor: isDark ? themeColors.borderSubtle : '#E5E5E5',
          },
        ]}>
        <View style={styles.compactHeaderLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <ChevronLeft
              size={20}
              color={isDark ? themeColors.textPrimary : '#000000'}
            />
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
                <IconComponent size={16} color={themeColors.accentPrimary} />
              </View>
            );
          })()}

          <View style={styles.compactTitleContainer}>
            <Text
              variant="titleMedium"
              style={[styles.compactTitle, { color: themeColors.textPrimary }]}>
              {sessionTitle}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.compactSubtitle,
                { color: themeColors.textSecondary },
              ]}>
              {getSessionTypeText()}
            </Text>
          </View>
        </View>

        {/* Action Icons - Minimal, In Header */}
        <View style={styles.compactHeaderRight}>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handleRenameOpen}>
            <Edit3
              size={20}
              color={isDark ? themeColors.textSecondary : '#A6A6A6'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handleRestart}>
            <RotateCcw
              size={20}
              color={isDark ? themeColors.textSecondary : '#A6A6A6'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => setShowDeleteDialog(true)}>
            <Trash2
              size={20}
              color={isDark ? themeColors.textSecondary : '#A6A6A6'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {renderRecordingState()}
      </ScrollView>

      <Modal
        transparent
        visible={showDeleteDialog}
        animationType="fade"
        onRequestClose={() => setShowDeleteDialog(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? themeColors.canvas : '#FFFFFF',
                shadowColor: themeColors.shadowColor,
              },
            ]}>
            <TouchableOpacity
              style={[
                styles.modalClose,
                {
                  backgroundColor: isDark ? themeColors.layer2 : '#FAFAFA',
                  borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                },
              ]}
              onPress={() => setShowDeleteDialog(false)}>
              <X size={18} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text
              variant="headlineLarge"
              style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
              Delete Session
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.modalDescription,
                { color: themeColors.textSecondary },
              ]}>
              Are you sure you want to delete this session? This action cannot
              be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.05)'
                      : '#FAFAFA',
                    borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                  },
                ]}
                onPress={() => setShowDeleteDialog(false)}>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.modalButtonText,
                    { color: themeColors.textPrimary },
                  ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDangerButton]}
                onPress={handleDeleteConfirm}>
                <Text variant="titleSmall" style={styles.modalDangerText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showRenameDialog}
        animationType="fade"
        onRequestClose={() => setShowRenameDialog(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? themeColors.canvas : '#FFFFFF',
                shadowColor: themeColors.shadowColor,
              },
            ]}>
            <TouchableOpacity
              style={[
                styles.modalClose,
                {
                  backgroundColor: isDark ? themeColors.layer2 : '#FAFAFA',
                  borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                },
              ]}
              onPress={() => setShowRenameDialog(false)}>
              <X size={18} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text
              variant="headlineLarge"
              style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
              Rename Session
            </Text>
            <View
              style={[
                styles.renameInputWrapper,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : '#FAFAFA',
                  borderColor: isDark ? themeColors.borderSubtle : '#E5E5EA',
                },
              ]}>
              <TextInput
                value={renameValue}
                onChangeText={setRenameValue}
                style={[styles.renameInput, { color: themeColors.textPrimary }]}
                placeholder="Session name"
                placeholderTextColor={
                  isDark ? themeColors.textMuted : colors.onSurfaceVariant
                }
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.05)'
                      : '#FAFAFA',
                    borderColor: isDark ? themeColors.borderSubtle : '#F0F0F0',
                  },
                ]}
                onPress={() => setShowRenameDialog(false)}>
                <Text
                  variant="titleSmall"
                  style={[
                    styles.modalButtonText,
                    { color: themeColors.textPrimary },
                  ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalPrimaryButton,
                  {
                    backgroundColor: themeColors.accentPrimary,
                    borderColor: themeColors.accentPrimary,
                  },
                ]}
                onPress={handleRenameSave}>
                <Text variant="titleSmall" style={styles.modalPrimaryText}>
                  Save
                </Text>
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
