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
import Sound, {
  PlayBackType,
  RecordBackType,
} from 'react-native-nitro-sound';
import { uploadRecording } from '../../services/authService';

const getRNFS = async (): Promise<any | null> => {
  try {
    const mod: any = await import('react-native-fs');
    return mod?.default || mod;
  } catch {
    return null;
  }
};

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
  const [recordedPath, setRecordedPath] = useState<string | null>(null);
  const [isPlaybackStarted, setIsPlaybackStarted] = useState(false);
  const initialTitle =
    (sessionData && sessionData.title) || t('mainContent.recording.newSession');
  const [sessionTitle, setSessionTitle] = useState(initialTitle);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState(initialTitle);
  const [currentSession, setCurrentSession] = useState<SessionType | null>(null);

  const loadSessionData = useCallback(async () => {
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
        if (latestSession.audioPath) {
          setRecordedPath(latestSession.audioPath);
          setIsPlaybackStarted(false);
          setIsPlaying(false);
          setPlaybackTime(0);
        }
      }
    }
  }, [sessionData?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSessionData();
    }, [loadSessionData])
  );

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  const handlePlayPause = async () => {
    if (!recordedPath) {
      return;
    }
    if (!isPlaying) {
      try {
        Sound.removePlayBackListener();
        Sound.removePlaybackEndListener();
        Sound.addPlayBackListener((e: PlayBackType) => {
          const pos = Number(e.currentPosition) || 0;
          setPlaybackTime(Math.floor(pos / 1000));
        });
        Sound.addPlaybackEndListener(() => {
          setIsPlaying(false);
          setIsPlaybackStarted(false);
          setPlaybackTime(0);
        });
        if (isPlaybackStarted) {
          await Sound.resumePlayer();
        } else {
          await Sound.startPlayer(recordedPath);
          setIsPlaybackStarted(true);
        }
        setIsPlaying(true);
      } catch {
        Alert.alert(
          t('common.error'),
          'Audio playback module is not linked. Please run pod install and rebuild.'
        );
      }
    } else {
      try {
        await Sound.pausePlayer();
        setIsPlaying(false);
      } catch {
        Alert.alert(
          t('common.error'),
          'Failed to pause playback. Please ensure pods are installed.'
        );
      }
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

  useEffect(() => {
    return () => {
      Sound.removeRecordBackListener();
      Sound.removePlayBackListener();
      Sound.removePlaybackEndListener();
    };
  }, []);

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
            message: 'This app needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
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
        const pos = Number(e.currentPosition) || 0;
        setRecordingTime(Math.floor(pos / 1000));
      });
      await Sound.startRecorder();
      setIsRecording(true);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        'Audio module is not linked. Please run pod install and rebuild iOS.'
      );
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    Alert.alert(t('common.confirm'), t('session.stopRecordingConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          try {
            console.log('[Session] Stopping recorder...');
            const result = await Sound.stopRecorder();
            Sound.removeRecordBackListener();

            const path = typeof result === 'string' ? result : null;
            console.log('[Session] Recording stopped, original path:', path);

            if (!path) {
              console.error('[Session] No path returned from stopRecorder');
              Alert.alert(
                t('common.error'),
                'Failed to get recording path. Please try again.'
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
                  console.log('[Session] Directory may already exist:', mkdirError);
                }

                const ext = path.includes('.') ? `.${path.split('.').pop()}` : '.m4a';
                const dest = `${dir}/${session.id}${ext}`;
                const src = path.startsWith('file://') ? path.replace('file://', '') : path;

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
                console.log('[Session] Source file size:', sourceStats.size, 'bytes');

                if (sourceStats.size === 0) {
                  console.error('[Session] Source file is empty');
                  throw new Error('Recorded audio file is empty');
                }

                // Check if destination file already exists and delete it
                const destExists = await RNFS.exists(dest);
                if (destExists) {
                  console.log('[Session] Destination file already exists, deleting...');
                  await RNFS.unlink(dest);
                }

                // Copy file
                console.log('[Session] Copying file...');
                await RNFS.copyFile(src, dest);

                // Verify copy succeeded
                const destExistsAfterCopy = await RNFS.exists(dest);
                if (!destExistsAfterCopy) {
                  console.error('[Session] Copy failed - destination file not created');
                  throw new Error('Failed to copy audio file');
                }

                const destStats = await RNFS.stat(dest);
                console.log('[Session] File copied successfully');
                console.log('[Session] Destination file size:', destStats.size, 'bytes');

                if (destStats.size === 0) {
                  console.error('[Session] Destination file is empty');
                  throw new Error('Copied audio file is empty');
                }

                persistedPath = dest;
                console.log('[Session] Audio file persisted at:', persistedPath);
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

            await sessionStorage.markSessionAsRecorded(session.id, duration, finalPath || undefined);
            await loadSessionData();

            // Don't auto-transcribe - let user listen first and manually trigger transcription
            console.log('[Session] Recording saved. User can now listen and transcribe manually.');
          } catch (error: any) {
            console.error('[Session] Stop recording error:', error);
            Alert.alert(
              t('common.error'),
              `Failed to stop recording: ${error?.message || 'Unknown error'}`
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
            'Failed to get file path. Please try again.'
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
            const src = uri.startsWith('file://') ? uri.replace('file://', '') : uri;

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
            console.log('[Session] Source file size:', sourceStats.size, 'bytes');

            if (sourceStats.size === 0) {
              console.error('[Session] Source file is empty');
              throw new Error('Selected audio file is empty');
            }

            // Check if destination file already exists and delete it
            const destExistsBefore = await RNFS.exists(dest);
            if (destExistsBefore) {
              console.log('[Session] Destination file already exists, deleting...');
              await RNFS.unlink(dest);
            }

            // Copy file
            console.log('[Session] Copying file...');
            await RNFS.copyFile(src, dest);

            // Verify copy succeeded
            const destExists = await RNFS.exists(dest);
            if (!destExists) {
              console.error('[Session] Copy failed - destination file not created');
              throw new Error('Failed to copy audio file');
            }

            const destStats = await RNFS.stat(dest);
            console.log('[Session] File copied successfully');
            console.log('[Session] Destination file size:', destStats.size, 'bytes');

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
              `Failed to copy audio file: ${copyError?.message || 'Unknown error'}`
            );
            return;
          }
        }

        const finalPath = persistedPath || uri;
        console.log('[Session] Final audio path to use:', finalPath);

        setRecordedPath(finalPath);
        await sessionStorage.markSessionAsRecorded(session.id, '00:00', finalPath || undefined);
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
                console.error('[Session] Audio file does not exist for transcription:', normalizedPath);
                Alert.alert(
                  t('common.error'),
                  'Audio file not found. Please try selecting the file again.'
                );
                return;
              }

              const stats = await RNFS.stat(normalizedPath);
              console.log('[Session] Audio file verified for transcription, size:', stats.size);

              if (stats.size === 0) {
                console.error('[Session] Audio file is empty');
                Alert.alert(
                  t('common.error'),
                  'Audio file is empty. Please select a different file.'
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
            'Failed to process audio file. Please try again.'
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
        'Session ID not found. Please try creating a new session.'
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
      console.log('[Session] Response data:', JSON.stringify(response.data, null, 2));
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
            await sessionStorage.updateSessionTranscript(session.id, text, utterances || []);
            await loadSessionData();

            // Navigate to transcription completed screen
            const updatedSession = await sessionStorage.getSessionById(session.id);
            console.log('[Session] Navigating to transcription screen...');
            navigation.replace('transcriptionCompleted', {
              sessionData: updatedSession,
              sessionType: session.type,
            });
          } else {
            console.log('[Session] No transcription text in response');
            customToast('error', 'Warning', 'Transcription completed but no text was returned.');
          }
        } else {
          console.log('[Session] No transcription data in response yet - will be processed asynchronously');

          // Still navigate to transcription screen so user can wait for transcription
          const updatedSession = await sessionStorage.getSessionById(session.id);
          console.log('[Session] Navigating to transcription screen (processing)...');

          customToast('info', 'Processing', 'Audio uploaded successfully. Transcription is being processed.');

          navigation.replace('transcriptionCompleted', {
            sessionData: updatedSession,
            sessionType: session.type,
          });
        }
      } else {
        // Handle unsuccessful response
        const errorMessage = response.data?.message || 'Upload failed';
        console.error('[Session] Upload failed:', errorMessage);
        Alert.alert(
          t('common.error'),
          errorMessage
        );
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
          { text: 'Retry', onPress: () => transcribeAudio(path) }
        ]
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

            {/* Transcribe Audio Button - only show if not transcribed yet */}
            {!session.hasTranscription && recordedPath && (
              <PrimaryButton
                text={isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
                onPress={async () => {
                  if (recordedPath && !isTranscribing) {
                    // Verify file before transcription
                    const RNFS = await getRNFS();
                    if (RNFS) {
                      const normalizedPath = recordedPath.startsWith('file://')
                        ? recordedPath.replace('file://', '')
                        : recordedPath;

                      try {
                        const exists = await RNFS.exists(normalizedPath);
                        if (!exists) {
                          Alert.alert(
                            t('common.error'),
                            'Audio file not found. Please try recording again.'
                          );
                          return;
                        }

                        const stats = await RNFS.stat(normalizedPath);
                        if (stats.size === 0) {
                          Alert.alert(
                            t('common.error'),
                            'Audio file is empty. Please try recording again.'
                          );
                          return;
                        }
                      } catch (error) {
                        console.error('[Session] Error verifying audio file:', error);
                      }
                    }

                    await transcribeAudio(recordedPath);
                  }
                }}
                width={wp(75)}
                iconComponent={FileText}
                disabled={isTranscribing}
              />
            )}
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
