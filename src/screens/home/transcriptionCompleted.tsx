/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socketService';
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
  Clipboard,
  LayoutAnimation,
  UIManager,
  TextInput,
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

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

Dimensions.get('window');

// Design System Constants
const DESIGN_TOKENS = {
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

const TranscriptionComplete = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  // Get onboarding defaults
  const {
    defaultSpecialization,
    defaultNoteLength,
    defaultVisitType,
  } = useOnboardingStore();

  // Get session data from route params
  const { sessionData, sessionType } = ((route as any).params || {}) as {
    sessionData?: any;
    sessionType?: string;
  };

  // --- NEW ARCHITECTURE STATE ---
  const [generationMode, setGenerationMode] = useState<'standard' | 'custom'>('standard');
  // ------------------------------

  // State management - initialized with onboarding defaults
  const [noteType, setNoteType] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>(
    defaultSpecialization || ''
  );
  const [visitType, setVisitType] = useState<string>(defaultVisitType || '');
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
  const [manualFollowUpText, setManualFollowUpText] = useState<string>('');
  const [showManualTextModal, setShowManualTextModal] = useState<boolean>(false);
  const [tempManualText, setTempManualText] = useState<string>('');
  // removed unused followUpPhoto state
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<string>('');
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
  const [noteLength, setNoteLength] = useState<'Small' | 'Medium' | 'Large'>(
    defaultNoteLength || 'Medium',
  );

  // Custom Template State
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedTemplateTitle, setSelectedTemplateTitle] = useState<string>('');

  const noteLengthOptions: Array<'Small' | 'Medium' | 'Large'> = [
    'Small',
    'Medium',
    'Large',
  ];
  const specializationOptions = [
    { key: 'Psychiatry', label: t('mainContent.transcriptionComplete.specialization.psychiatry') },
    { key: 'Child Psychiatry', label: t('mainContent.transcriptionComplete.specialization.childPsychiatry') },
    { key: 'Surgery', label: t('mainContent.transcriptionComplete.specialization.surgery') },
    { key: 'Smart Select', label: t('mainContent.transcriptionComplete.specialization.smartSelect') },
  ];
  const visitTypeOptions = [
    { key: 'First Visit', label: t('mainContent.transcriptionComplete.visitType.firstVisit') },
    { key: 'Follow-up', label: t('mainContent.transcriptionComplete.visitType.followUp') },
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
    setNoteType(null);
    customToast('success', t('common.success'), 'Custom prompt cleared');
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

  const isNoteReady = generatedNote.trim().length > 0;

  // Mock follow-up visits data
  const mockFollowUpVisits = [
    {
      _id: '1',
      title: 'Wizyta kontrolna - JS45',
      date: new Date('2024-01-15'),
      mode: 'standard',
      label: 'Psychiatry • First Visit',
    },
    {
      _id: '2',
      title: 'Konsultacja - JS45',
      date: new Date('2024-01-20'),
      mode: 'custom',
      label: 'Custom • Psychiatry - First Visit',
    },
    {
      _id: '3',
      title: 'Badania kontrolne - JS45',
      date: new Date('2024-01-25'),
      mode: 'standard',
      label: 'Cardiology • Follow-up',
    },
  ];

  const filteredFollowUpVisits = mockFollowUpVisits.filter(visit =>
    visit.title.toLowerCase().includes(visitSearchQuery.toLowerCase()),
  );

  useEffect(() => {
    setNewSessionName(session.title);
    if (session.type === 'patient') {
      setNoteType('SOAP');
    }
  }, [session.title, session.type]);

  const getSessionIcon = () => {
    switch (session.type) {
      case 'patient': return Users;
      case 'meeting': return FileText;
      case 'lecture': return Brain;
      default: return FileText;
    }
  };

  const getSessionTypeText = () => {
    switch (session.type) {
      case 'patient': return t('tabs.patients');
      case 'meeting': return t('tabs.meetings');
      case 'lecture': return t('tabs.lectures');
      default: return t('tabs.patients');
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
      await sessionStorage.updateSessionTitle(session.id, newSessionName.trim());
      setShowRenameModal(false);
      customToast('success', t('common.success'), t('success.sessionRenamed'));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await sessionStorage.deleteSession(session.id);
      setShowDeleteModal(false);
      customToast('success', t('common.success'), t('success.sessionDeleted'));
      (navigation as any).goBack();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await sessionStorage.resetSession(session.id);
      setShowResetModal(false);
      customToast('success', t('common.success'), t('success.sessionReset'));
      (navigation as any).replace('session', {
        sessionData: session,
        sessionType: session.type,
      });
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

  // --- NEW RENDER: Mode Switcher (The Segmented Control) ---
  const renderModeSwitch = () => {
    if (session.type !== 'patient') return null;
    return (
      <View style={styles.modeSwitchContainer}>
        <Text variant="labelMedium" style={styles.sectionLabel}>
          {t('mainContent.transcriptionComplete.generationMode')}
        </Text>
        <View style={styles.compactSegmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, generationMode === 'standard' && styles.segmentBtnActive]}
            onPress={() => handleModeChange('standard')}
          >
            <Text style={generationMode === 'standard' ? styles.segmentTextActive : styles.segmentTextInactive}>
              {t('mainContent.transcriptionComplete.modes.standard')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, generationMode === 'custom' && styles.segmentBtnActive]}
            onPress={() => handleModeChange('custom')}
          >
            <Text style={generationMode === 'custom' ? styles.segmentTextActive : styles.segmentTextInactive}>
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
        <Text variant="labelMedium" style={styles.sectionLabel}>{t('mainContent.transcriptionComplete.noteType')}</Text>
        <View style={styles.compactSegmentedControl}>
          <TouchableOpacity style={[styles.compactSegmentButton, styles.compactSegmentButtonSelected]}><Text style={styles.compactSegmentTextSelected}>{t('mainContent.transcriptionComplete.noteOptions.general')}</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSpecializationSection = () => {
    return (
      <View style={styles.selectionSection}>
        <Text variant="labelMedium" style={styles.sectionLabel}>
          {t('mainContent.transcriptionComplete.specialization.select')}
        </Text>
        <TouchableOpacity
          style={styles.compactDropdownField}
          onPress={() => setShowSpecializationModal(true)}
        >
          <Text variant="bodySmall" style={selectedSpecialization ? styles.compactDropdownValue : styles.compactDropdownPlaceholder}>
            {selectedSpecialization ? specializationOptions.find(s => s.key === selectedSpecialization)?.label : t('mainContent.transcriptionComplete.specialization.select')}
          </Text>
          <ChevronRight size={18} color="#A6A6A6" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderVisitTypeSection = () => {
    return (
      <View style={styles.selectionSection}>
        <Text variant="labelMedium" style={styles.sectionLabel}>
          {t('mainContent.transcriptionComplete.visitType.select')}
        </Text>
        <TouchableOpacity
          style={styles.compactDropdownField}
          onPress={() => setShowVisitTypeModal(true)}
        >
          <Text variant="bodySmall" style={visitType ? styles.compactDropdownValue : styles.compactDropdownPlaceholder}>
            {visitType ? visitTypeOptions.find(v => v.key === visitType)?.label : t('mainContent.transcriptionComplete.visitType.select')}
          </Text>
          <ChevronRight size={18} color="#A6A6A6" />
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
        <Text variant="labelMedium" style={styles.sectionLabel}>
          {t('mainContent.transcriptionComplete.noteLength.select')}
        </Text>
        <View style={styles.compactSegmentedControl}>
          {noteLengthOptions.map(length => (
            <TouchableOpacity
              key={length}
              style={[
                styles.compactSegmentButton,
                noteLength === length && styles.compactSegmentButtonSelected,
              ]}
              onPress={() => setNoteLength(length)}
            >
              <Text
                variant="bodySmall"
                style={[
                  styles.compactSegmentText,
                  noteLength === length && styles.compactSegmentTextSelected,
                ]}
              >
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
        <Text variant="labelMedium" style={styles.sectionLabel}>
          {t('mainContent.transcriptionComplete.followUpVisits.previousVisitContext')}
        </Text>

        <View style={styles.followUpOptionsRow}>
          <TouchableOpacity
            style={styles.followUpOptionButton}
            onPress={() => setShowFollowUpModal(true)}
          >
            <Plus size={14} color={DESIGN_TOKENS.colors.primary} />
            <Text variant="bodySmall" style={styles.followUpOptionText}>
              {t('mainContent.transcriptionComplete.followUpVisits.fromHistory')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.followUpOptionButton}
            onPress={() => {
              setTempManualText(manualFollowUpText);
              setShowManualTextModal(true);
            }}
          >
            <Type size={14} color={DESIGN_TOKENS.colors.primary} />
            <Text variant="bodySmall" style={styles.followUpOptionText}>
              {t('mainContent.transcriptionComplete.followUpVisits.typeText')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.followUpOptionButton}
            onPress={() => {
              customToast('info', t('common.comingSoon'), t('mainContent.transcriptionComplete.followUpVisits.photoComingSoon'));
            }}
          >
            <Camera size={14} color={DESIGN_TOKENS.colors.primary} />
            <Text variant="bodySmall" style={styles.followUpOptionText}>
              {t('mainContent.transcriptionComplete.followUpVisits.takePhoto')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual Text Preview */}
        {manualFollowUpText.trim() && (
          <View style={styles.manualTextPreview}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" style={styles.customNoteLabel}>
                  {t('mainContent.transcriptionComplete.followUpVisits.manualContext')}
                </Text>
                <Text variant="bodySmall" style={styles.manualTextSnippet} numberOfLines={2}>
                  {manualFollowUpText}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: wp(2) }}>
                <TouchableOpacity
                  style={styles.customNoteActionButton}
                  onPress={() => {
                    setTempManualText(manualFollowUpText);
                    setShowManualTextModal(true);
                  }}
                >
                  <Edit3 size={16} color="#46B7C6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customNoteActionButton}
                  onPress={() => setManualFollowUpText('')}
                >
                  <X size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Imported Visits from History */}
        {importedFollowUpVisits.length > 0 && (
          <View style={styles.importedVisitsContainer}>
            <Text variant="bodySmall" style={styles.importedVisitsCount}>
              {t('mainContent.transcriptionComplete.followUpVisits.selectedVisits', {
                count: importedFollowUpVisits.length,
              })}
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
                  <X size={16} color="#86868b" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const generateMockNote = () => {
    return `${t('mainContent.transcriptionComplete.noteGenerated', { mode: generationMode === 'standard' ? t('mainContent.transcriptionComplete.modes.standardSOAP') : t('mainContent.transcriptionComplete.modes.custom') })}...\n\n${t('mainContent.transcriptionComplete.noteSubjective')}:\n${t('mainContent.transcriptionComplete.patientPresents')}...`;
  };

  const getGeneratedSummary = () => {
    if (session.type !== 'patient') {
      return t('mainContent.transcriptionComplete.generatedUsing.general');
    }
    if (generationMode === 'standard') {
      const specializationLabel =
        specializationOptions.find(s => s.key === selectedSpecialization)?.label ||
        t('mainContent.transcriptionComplete.modes.standard');
      return t('mainContent.transcriptionComplete.generatedUsing.standardMode', { specialization: specializationLabel });
    }
    return t('mainContent.transcriptionComplete.generatedUsing.customMode', { template: selectedTemplateTitle || t('mainContent.transcriptionComplete.customTemplate') });
  };

  const renderGenerateButton = () => {
    // LOGIC UPDATE: Validation depends on Mode
    let canGenerate = false;

    if (session.type !== 'patient') {
      canGenerate = true;
    } else {
      if (generationMode === 'standard') {
        // Standard Mode Requirements
        canGenerate = !!selectedSpecialization && !!visitType;
      } else {
        // Custom Mode Requirements
        canGenerate = !!selectedTemplateId;
      }
    }

    return (
      <TouchableOpacity
        style={[
          styles.floatingGenerateButton,
          (!canGenerate || isGenerating) && styles.floatingGenerateButtonDisabled,
        ]}
        onPress={async () => {
          if (canGenerate) {
            setIsGenerating(true);
            setTimeout(() => {
              const note = generateMockNote();
              const specializationLabel =
                specializationOptions.find(s => s.key === selectedSpecialization)?.label;
              const visitTypeLabel =
                visitTypeOptions.find(v => v.key === visitType)?.label;
              setGeneratedNote(note);
              setIsGenerating(false);
              sessionStorage.updateSessionNoteMeta(session.id, {
                generationMode,
                specializationLabel: generationMode === 'standard' ? specializationLabel : undefined,
                visitTypeLabel: generationMode === 'standard' ? visitTypeLabel : undefined,
                customTemplateTitle: generationMode === 'custom' ? selectedTemplateTitle : undefined,
              });
              handleCollapseConfig();
            }, 1500);
          } else {
            const errorMsg = generationMode === 'standard'
              ? 'Please select Specialization and Visit Type'
              : 'Please select a Custom Template';
            customToast(
              'error',
              t('common.error'),
              errorMsg,
            );
          }
        }}
        disabled={!canGenerate || isGenerating}
        activeOpacity={0.85}
      >
        <Text variant="bodyMedium" style={styles.floatingGenerateButtonText}>
          {isGenerating ? t('common.generating') : t('mainContent.transcriptionComplete.generateNote')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Compact Header */}
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
              {session.title}
            </Text>
            <Text variant="bodySmall" style={styles.compactSubtitle}>
              {getSessionTypeText()}
            </Text>
          </View>
        </View>

        <View style={styles.compactHeaderRight}>
          {session.type === 'patient' && (
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => (navigation as any).navigate('consult')}
            >
              <MessageSquare size={20} color="#A6A6A6" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => setShowRenameModal(true)}
          >
            <Edit3 size={20} color="#A6A6A6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Trash2 size={20} color="#A6A6A6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={() => setShowResetModal(true)}
          >
            <RotateCcw size={20} color="#A6A6A6" />
          </TouchableOpacity>
        </View>
      </View>

      {isNoteReady && isConfigCollapsed ? (
        <TouchableOpacity
          style={styles.generatedSummaryBar}
          onPress={handleExpandConfig}
          activeOpacity={0.85}
        >
          <View style={styles.generatedSummaryTextGroup}>
            <Text variant="bodyMedium" style={styles.generatedSummaryTitle}>
              {getGeneratedSummary()}
            </Text>
            <Text variant="bodySmall" style={styles.generatedSummarySubtitle}>
              {t('mainContent.transcriptionComplete.tapToEdit')}
            </Text>
          </View>
          <ChevronRight size={18} color={DESIGN_TOKENS.colors.textTertiary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.settingsSection}>
          {isNoteReady && (
            <View style={styles.settingsHeaderRow}>
              <Text variant="labelMedium" style={styles.settingsHeaderTitle}>
                {t('mainContent.transcriptionComplete.configuration')}
              </Text>
              <TouchableOpacity
                onPress={handleCollapseConfig}
                style={styles.settingsHeaderAction}
              >
                <Text variant="bodySmall" style={styles.settingsHeaderActionText}>
                  {t('mainContent.transcriptionComplete.hide')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 1. SWITCHER (New) */}
          {renderModeSwitch()}
          {renderLegacyNoteButtons()}

          {/* 2. STANDARD MODE */}
          {session.type === 'patient' && generationMode === 'standard' && (
            <View>
              <View style={{ height: hp(1) }} />
              <View style={styles.twoColumnGrid}>
                <View style={styles.gridColumn}>{renderSpecializationSection()}</View>
                <View style={styles.gridColumn}>{renderVisitTypeSection()}</View>
              </View>
              <View style={{ height: hp(1) }} />
              {renderNoteLengthSection()}

              {visitType === 'Follow-up' && <View style={{ height: hp(0.6) }} />}
              {renderFollowUpSection()}
            </View>
          )}

          {/* 3. CUSTOM MODE */}
          {session.type === 'patient' && generationMode === 'custom' && (
            <View style={{ marginTop: hp(1) }}>
              <CustomTemplateManager
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.noteDocumentContainer}>
        {isNoteReady ? (
          <>
            <ScrollView
              style={styles.noteDocumentContent}
              contentContainerStyle={styles.noteDocumentScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text variant="bodyMedium" style={styles.noteDocumentText}>
                {generatedNote}
              </Text>
            </ScrollView>
            <View style={styles.noteDocumentFooter}>
              <TouchableOpacity
                style={styles.noteCopyButton}
                onPress={async () => {
                  if (!generatedNote.trim()) return;
                  await Clipboard.setString(generatedNote);
                  customToast('success', 'Copied', 'Note copied to clipboard');
                }}
              >
                <ClipboardIcon size={16} color={DESIGN_TOKENS.colors.primary} />
                <Text variant="bodySmall" style={styles.noteCopyButtonText}>
                  {t('common.copy')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noteEmptyState}>
            <Text variant="titleSmall" style={styles.noteEmptyTitle}>
              {t('mainContent.transcriptionComplete.noNote')}
            </Text>
            <Text variant="bodySmall" style={styles.noteEmptySubtitle}>
              {t('mainContent.transcriptionComplete.generateToSee')}
            </Text>
          </View>
        )}
      </View>

      {!isNoteReady || !isConfigCollapsed ? (
        <View style={styles.stickyFooter}>{renderGenerateButton()}</View>
      ) : null}

      {/* --- ALL MODALS RESTORED BELOW --- */}

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
            <View style={styles.renameButtonsRow}>
              <TouchableOpacity
                style={[styles.renameButton, styles.renameCancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text variant="bodyMedium" style={styles.renameCancelText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.renameButton,
                  styles.renameSaveButton,
                  isRenaming && styles.renameSaveButtonDisabled,
                ]}
                onPress={handleRename}
                disabled={isRenaming}
              >
                {isRenaming ? (
                  <ActivityIndicator
                    size="small"
                    color={DESIGN_TOKENS.colors.background}
                  />
                ) : (
                  <Text variant="bodyMedium" style={styles.renameSaveText}>
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
              {specializationOptions.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    selectedSpecialization === option.key && styles.selectedOptionItem,
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
                      selectedSpecialization === option.key && styles.selectedOptionText,
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
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { width: '100%' }]}
              onPress={() => setShowSpecializationModal(false)}
            >
              <Text variant="bodyMedium" style={styles.cancelButtonText}>
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
        onRequestClose={() => setShowVisitTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {t('mainContent.transcriptionComplete.visitType.select')}
            </Text>
            <View style={styles.optionsList}>
              {visitTypeOptions.map(option => (
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
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { width: '100%' }]}
              onPress={() => setShowVisitTypeModal(false)}
            >
              <Text variant="bodyMedium" style={styles.cancelButtonText}>
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
        onRequestClose={() => setShowFollowUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.followUpModalCard}>
            <View style={styles.followUpModalHeader}>
              <Text variant="titleLarge" style={styles.followUpModalTitle}>
                {t('mainContent.transcriptionComplete.followUpVisits.selectDialog.title')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFollowUpModal(false)}
                style={styles.followUpCloseButton}
              >
                <X size={18} color="#A6A6A6" />
              </TouchableOpacity>
            </View>

            <View style={styles.followUpSearchBar}>
              <Search size={18} color={DESIGN_TOKENS.colors.textSecondary} />
              <TextInput
                placeholder={t('mainContent.transcriptionComplete.followUpVisits.selectDialog.searchPlaceholder')}
                placeholderTextColor={DESIGN_TOKENS.colors.textSecondary}
                value={visitSearchQuery}
                onChangeText={setVisitSearchQuery}
                style={styles.followUpSearchInput}
                returnKeyType="search"
              />
            </View>

            <View style={styles.visitsList}>
              {filteredFollowUpVisits.length === 0 ? (
                <Text variant="bodyMedium" style={styles.noVisitsText}>
                  {mockFollowUpVisits.length === 0
                    ? t('mainContent.transcriptionComplete.followUpVisits.selectDialog.noVisitsAvailable')
                    : t('mainContent.transcriptionComplete.followUpVisits.selectDialog.noVisitsFound')}
                </Text>
              ) : (
                filteredFollowUpVisits.map(visit => {
                  const isSelected = selectedFollowUpVisits.has(visit._id);
                  return (
                    <TouchableOpacity
                      key={visit._id}
                      style={[
                        styles.visitCard,
                        isSelected && styles.visitCardSelected,
                      ]}
                      onPress={() => handleFollowUpVisitSelect(visit._id)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.visitCardLeft}>
                        <View style={styles.visitIconCircle}>
                          <PhoneCall size={15} color={DESIGN_TOKENS.colors.primary} />
                        </View>
                        <View style={styles.visitInfo}>
                          <Text
                            variant="bodyMedium"
                            style={styles.visitTitle}
                            numberOfLines={1}
                          >
                            {visit.title}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={styles.visitSubtitle}
                            numberOfLines={1}
                          >
                            {visit.label}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.visitCardRight}>
                        <View style={styles.visitDateTag}>
                          <Text style={styles.visitDateTagText}>
                            {new Date(visit.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.visitCheckbox,
                            isSelected && styles.visitCheckboxSelected,
                          ]}
                        >
                          {isSelected && (
                            <Check size={14} color={DESIGN_TOKENS.colors.background} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.followUpImportButton,
                selectedFollowUpVisits.size === 0 && styles.followUpImportButtonDisabled,
              ]}
              onPress={handleImportFollowUpVisits}
              disabled={selectedFollowUpVisits.size === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.followUpImportButtonText}>
                {t('mainContent.transcriptionComplete.followUpVisits.selectDialog.importButton', { count: selectedFollowUpVisits.size })}
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
        onRequestClose={() => setShowManualTextModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.slimModalContent}>
            <TouchableOpacity
              onPress={() => setShowManualTextModal(false)}
              style={styles.slimModalClose}
            >
              <X size={18} color="#A6A6A6" />
            </TouchableOpacity>

            <Text variant="titleMedium" style={styles.slimModalTitle}>
              {t('mainContent.transcriptionComplete.followUpVisits.manualContextTitle')}
            </Text>

            <TouchableOpacity
              style={styles.slimPasteButton}
              onPress={async () => {
                try {
                  const text = await Clipboard.getString();
                  if (text) {
                    setTempManualText(text);
                    customToast('success', t('mainContent.transcriptionComplete.followUpVisits.pastedTitle'), t('mainContent.transcriptionComplete.followUpVisits.pastedMessage'));
                  }
                } catch (error) {
                  customToast('error', t('common.error'), t('mainContent.transcriptionComplete.followUpVisits.pasteFailed'));
                }
              }}
            >
              <ClipboardIcon size={14} color="#46B7C6" />
              <Text variant="bodySmall" style={styles.slimPasteButtonText}>
                {t('mainContent.transcriptionComplete.followUpVisits.paste')}
              </Text>
            </TouchableOpacity>

            <Input
              placeholder={t('mainContent.transcriptionComplete.followUpVisits.typePlaceholder')}
              value={tempManualText}
              setValue={setTempManualText}
              width={wp(80)}
              multiline={true}
              height={hp(20)}
              numberOfLines={8}
            />

            <View style={styles.slimModalActions}>
              <TouchableOpacity
                style={styles.slimCancelButton}
                onPress={() => setShowManualTextModal(false)}
              >
                <Text variant="bodySmall" style={styles.slimCancelText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.slimSaveButton}
                onPress={() => {
                  setManualFollowUpText(tempManualText);
                  setShowManualTextModal(false);
                  if (tempManualText.trim()) {
                    customToast('success', t('mainContent.transcriptionComplete.followUpVisits.savedTitle'), t('mainContent.transcriptionComplete.followUpVisits.savedMessage'));
                  }
                }}
              >
                <Text variant="bodySmall" style={styles.slimSaveText}>
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