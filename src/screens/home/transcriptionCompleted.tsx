/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
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
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import PrimaryButton from '../../components/primaryButton';
import Input from '../../components/input';
import Header from '../../components/header';
import { colors } from '../../constants/colors';
import { LinearGradientColors } from '../../constants/linearGradientColors';
import { customToast } from '../../utils/toastMessage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TranscriptionComplete = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  // Get session data from route params
  const { sessionData, sessionType } = route.params || {};

  // State management
  const [noteType, setNoteType] = useState(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [visitType, setVisitType] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [showVisitTypeModal, setShowVisitTypeModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedFollowUpVisits, setSelectedFollowUpVisits] = useState(
    new Set(),
  );
  const [importedFollowUpVisits, setImportedFollowUpVisits] = useState([]);
  const [visitSearchQuery, setVisitSearchQuery] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Mock session data if not provided
  const session = sessionData || {
    id: '1',
    title: t('mainContent.recording.newSession'),
    type: sessionType || 'patient',
    date: new Date().toISOString(),
    hasRecording: true,
    hasTranscription: true,
  };

  // Mock transcription data
  const mockTranscription = {
    duration: 180, // 3 minutes
    utterances: [
      {
        speaker: 'Speaker A',
        text: 'Dzień dobry, jak się Pan czuje?',
        start: 0,
        end: 3000,
      },
      {
        speaker: 'Speaker B',
        text: 'Dzień dobry doktorze, czuję się lepiej niż wczoraj.',
        start: 3500,
        end: 7000,
      },
      {
        speaker: 'Speaker A',
        text: 'To dobrze słyszeć. Czy przyjmuje Pan leki zgodnie z zaleceniami?',
        start: 7500,
        end: 12000,
      },
    ],
  };

  // Mock follow-up visits data
  const mockFollowUpVisits = [
    {
      _id: '1',
      title: 'Wizyta kontrolna - JS45',
      date: new Date('2024-01-15'),
    },
    { _id: '2', title: 'Konsultacja - JS45', date: new Date('2024-01-20') },
    {
      _id: '3',
      title: 'Badania kontrolne - JS45',
      date: new Date('2024-01-25'),
    },
  ];

  const filteredFollowUpVisits = mockFollowUpVisits.filter(visit =>
    visit.title.toLowerCase().includes(visitSearchQuery.toLowerCase()),
  );

  useEffect(() => {
    setNewSessionName(session.title);
  }, [session.title]);

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

  const formatTime = milliseconds => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const formatTimeFromSeconds = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleRename = async () => {
    if (!newSessionName.trim()) return;

    setIsRenaming(true);
    // Simulate API call
    setTimeout(() => {
      setIsRenaming(false);
      setShowRenameModal(false);
      customToast('success', t('common.success'), t('success.sessionRenamed'));
    }, 1000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteModal(false);
      customToast('success', t('common.success'), t('success.sessionDeleted'));
      navigation.goBack();
    }, 1000);
  };

  const handleReset = async () => {
    setIsResetting(true);
    // Simulate API call
    setTimeout(() => {
      setIsResetting(false);
      setShowResetModal(false);
      customToast('success', t('common.success'), t('success.sessionReset'));
    }, 1000);
  };

  const handleFollowUpVisitSelect = visitId => {
    setSelectedFollowUpVisits(prev => {
      const next = new Set(prev);
      next.has(visitId) ? next.delete(visitId) : next.add(visitId);
      return next;
    });
  };

  const handleImportFollowUpVisits = () => {
    const selectedVisitData = mockFollowUpVisits
      .filter(visit => selectedFollowUpVisits.has(visit._id))
      .map(visit => ({
        _id: visit._id,
        title: visit.title,
        date: visit.date,
      }));
    setImportedFollowUpVisits(selectedVisitData);
    setShowFollowUpModal(false);
    setVisitSearchQuery('');
  };

  const renderNoteTypeButtons = () => {
    if (session.type === 'lecture') {
      return (
        <View style={styles.noteTypeContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('mainContent.transcriptionComplete.noteOptions.soap')}
          </Text>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'medical' && { borderColor: 'transparent' },
              ]}
              onPress={() => setNoteType('medical')}
            >
              {noteType === 'medical' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <Brain size={24} color="white" />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.medicalLecture',
                    )}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <Brain size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.medicalLecture',
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'scientific' && { borderColor: 'transparent' },
              ]}
              onPress={() => setNoteType('scientific')}
            >
              {noteType === 'scientific' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <FileText size={24} color="white" />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.scientificResearch',
                    )}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <FileText size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.scientificResearch',
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'clinicalPractice' && {
                  borderColor: 'transparent',
                },
              ]}
              onPress={() => setNoteType('clinicalPractice')}
            >
              {noteType === 'clinicalPractice' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <Users size={24} color="white" />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.clinicalPractice',
                    )}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <Users size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.clinicalPractice',
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (session.type === 'meeting') {
      return (
        <View style={styles.noteTypeContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('mainContent.transcriptionComplete.noteOptions.soap')}
          </Text>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'general' && { borderColor: 'transparent' },
              ]}
              onPress={() => setNoteType('general')}
            >
              {noteType === 'general' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
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
              ]}
              onPress={() => setNoteType('detailed')}
            >
              {noteType === 'detailed' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
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
                  <Brain size={24} color={colors.subText} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.detailedReport',
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      // Patient session
      return (
        <View style={styles.noteTypeContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('mainContent.transcriptionComplete.noteOptions.soap')}
          </Text>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'SOAP' && { borderColor: 'transparent' },
              ]}
              onPress={() => setNoteType('SOAP')}
            >
              {noteType === 'SOAP' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(3) }} />
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
                  <View style={{ width: wp(3) }} />
                  <FileText size={24} color={colors.subText} />
                  <View style={{ width: wp(2) }} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t('mainContent.transcriptionComplete.noteOptions.soap')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.noteTypeButton,
                noteType === 'Clinical' && { borderColor: 'transparent' },
              ]}
              onPress={() => setNoteType('Clinical')}
            >
              {noteType === 'Clinical' ? (
                <LinearGradient
                  colors={LinearGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedNoteTypeButton}
                >
                  <View style={{ width: wp(3) }} />
                  <Brain size={24} color="white" />
                  <View style={{ width: wp(2) }} />
                  <Text
                    variant="bodyMedium"
                    style={styles.selectedNoteTypeText}
                  >
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.clinical',
                    )}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <View style={{ width: wp(3) }} />
                  <Brain size={24} color={colors.subText} />
                  <View style={{ width: wp(2) }} />
                  <Text variant="bodyMedium" style={styles.noteTypeText}>
                    {t(
                      'mainContent.transcriptionComplete.noteOptions.clinical',
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
      <View style={styles.selectionSection}>
        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => setShowSpecializationModal(true)}
        >
          <Text variant="titleMedium" style={styles.selectionButtonText}>
            {selectedSpecialization
              ? specializations.find(s => s.key === selectedSpecialization)
                  ?.label || selectedSpecialization
              : t('mainContent.transcriptionComplete.specialization.select')}
          </Text>
          <Plus size={20} color={colors.lightGreen} />
        </TouchableOpacity>
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
      <View style={styles.selectionSection}>
        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => setShowVisitTypeModal(true)}
        >
          <Text variant="titleMedium" style={styles.selectionButtonText}>
            {visitType
              ? visitTypes.find(v => v.key === visitType)?.label || visitType
              : t('mainContent.transcriptionComplete.visitType.select')}
          </Text>
          <Plus size={20} color={colors.lightGreen} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFollowUpSection = () => {
    if (session.type !== 'patient' || visitType !== 'Follow-up') return null;

    return (
      <View style={styles.selectionSection}>
        <View style={styles.followUpHeader}>
          <Text variant="titleMedium" style={styles.selectionSectionTitle}>
            {t('mainContent.transcriptionComplete.followUpVisits.select')}
          </Text>
          <TouchableOpacity
            style={styles.addVisitsButton}
            onPress={() => setShowFollowUpModal(true)}
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
    return (
      <View style={styles.transcriptionSection}>
        <View style={styles.transcriptionHeader}>
          <Text variant="titleMedium" style={styles.transcriptionTitle}>
            {t('mainContent.transcriptionComplete.transcriptionTitle')}
          </Text>
          <Text variant="bodySmall" style={styles.transcriptionDuration}>
            {t('mainContent.transcriptionComplete.totalDuration')}:{' '}
            {formatTimeFromSeconds(mockTranscription.duration)}
          </Text>
        </View>

        <ScrollView
          style={styles.transcriptionContent}
          showsVerticalScrollIndicator={false}
        >
          {mockTranscription.utterances.map((utterance, index) => (
            <View
              key={index}
              style={[
                styles.utteranceItem,
                {
                  backgroundColor:
                    index % 2 === 0 ? colors.background : 'white',
                },
              ]}
            >
              <View style={styles.utteranceHeader}>
                <View style={styles.speakerInfo}>
                  <View style={styles.speakerIndicator} />
                  <Text variant="bodyMedium" style={styles.speakerName}>
                    {utterance.speaker}
                  </Text>
                </View>
                <View style={styles.timestampContainer}>
                  <Clock size={12} color={colors.subText} />
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {formatTime(utterance.start)} - {formatTime(utterance.end)}
                  </Text>
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.utteranceText}>
                {utterance.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderGenerateButton = () => {
    const canGenerate =
      noteType &&
      (session.type !== 'patient' || (selectedSpecialization && visitType));

    return (
      <View style={styles.generateButtonContainer}>
        <PrimaryButton
          text={t('noteGenerator.generate')}
          onPress={() => {
            if (canGenerate) {
              customToast(
                'success',
                t('common.success'),
                t('noteGenerator.generate'),
              );
            } else {
              customToast(
                'error',
                t('common.error'),
                t('errors.noteTypeRequired'),
              );
            }
          }}
          disabled={!canGenerate}
          loading={false}
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderNoteTypeButtons()}
        <View style={{ height: hp(1) }} />
        {renderSpecializationSection()}
        <View style={{ height: hp(1) }} />
        {renderVisitTypeSection()}
        {renderFollowUpSection()}
        {renderTranscriptionSection()}
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

            <Text variant="bodyMedium" style={styles.modalDescription}>
              {t(
                'mainContent.transcriptionComplete.followUpVisits.selectDialog.description',
              )}
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

            <View style={styles.visitsList}>
              {filteredFollowUpVisits.length === 0 ? (
                <Text variant="bodyMedium" style={styles.noVisitsText}>
                  {mockFollowUpVisits.length === 0
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
            </View>

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
    </SafeAreaView>
  );
};

export default TranscriptionComplete;

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
    gap: hp(1.5),
  },
  noteTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    minHeight: hp(8),
    overflow: 'hidden',
  },
  selectedNoteTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    minHeight: hp(8),
  },
  noteTypeText: {
    color: colors.onSurface,
    flex: 1,
  },
  selectedNoteTypeText: {
    color: 'white',
  },
  selectionSection: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: wp(4),
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
    marginBottom: hp(1),
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
    marginBottom: hp(2),
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
  visitsList: {
    marginVertical: hp(1),
    maxHeight: hp(30),
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
});
