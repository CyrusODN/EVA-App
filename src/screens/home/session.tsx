/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
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
  Play,
  Pause,
  FileText,
  Users,
  Brain,
  Settings,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import DocumentPicker from '@react-native-documents/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import PrimaryButton from '../../components/primaryButton';
import Input from '../../components/input';
import Header from '../../components/header';
import { colors } from '../../constants/colors';
import LinearGradient from 'react-native-linear-gradient';
import { LinearGradientColors } from '../../constants/linearGradientColors';

const { width: screenWidth } = Dimensions.get('window');

const Session = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  // Get session data from route params
  const { sessionData, sessionType } = route.params || {};

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasTranscription, setHasTranscription] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Mock session data if not provided
  const session = sessionData || {
    id: '1',
    title: t('mainContent.recording.newSession'),
    type: sessionType || 'patient',
    date: new Date().toISOString(),
    hasRecording: false,
    hasTranscription: false,
  };

  // Timer effect for recording
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = seconds => {
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
        onPress: () => {
          setIsTranscribing(true);
          // Simulate transcription process
          setTimeout(() => {
            setIsTranscribing(false);
            setHasTranscription(true);
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
        setUploadedFile(result[0]);
        setIsTranscribing(true);
        // Simulate transcription process
        setTimeout(() => {
          setIsTranscribing(false);
          setHasTranscription(true);
        }, 3000);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert(t('session.error'), t('session.failedToPickAudio'));
      }
    }
  };

  const handleViewTranscription = () => {
    navigation.navigate('transcriptionCompleted', {
      sessionData: session,
      sessionType: session.type,
    });
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

  const renderRecordingState = () => {
    if (hasTranscription) {
      return (
        <View style={styles.completedSection}>
          <View style={styles.completedCard}>
            <FileText size={58} color={colors.onSecondary} />
            <Text variant="headlineMedium" style={styles.completedTitle}>
              {t('session.transcriptionComplete')}
            </Text>
            <Text variant="bodyMedium" style={styles.completedDescription}>
              {t('session.transcriptionCompleteDescription')}
            </Text>
            <PrimaryButton
              text={t('session.viewTranscription')}
              onPress={handleViewTranscription}
              width={wp(75)}
            />
          </View>
        </View>
      );
    }

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
        <TouchableOpacity style={styles.actionButton}>
          <Edit3 size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderRecordingState()}
      </ScrollView>
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
});
