import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
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
  FileText,
  Plus,
  Search,
  Check,
  X,
  Eye,
  Download,
  Copy,
  Brain,
  Clock,
  Trash2,
  Upload,
  ClipboardList,
  FileCheck,
  FileSpreadsheet,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/textStyles';
import Gap from '../../components/gap';
import Header from '../../components/header';

type CertificateTypeId = 'ol9' | 'sick-leave' | 'medical-report' | 'specialist';
type CertificateTypeItem = {
  id: CertificateTypeId;
  nameKey: string;
  descriptionKey: string;
  icon: any;
};
type VisitNote = {
  type: string;
  content: string;
};
type Visit = {
  id: string;
  name: string;
  date: Date;
  type: string;
  specialization: string;
  duration: string;
  note: VisitNote;
};
type DocumentFile = {
  name: string;
  size: number;
  type: string;
};
type SourceItem = {
  type: string;
  title: string;
  confidence: number;
  details?: string;
};
type Certificate = {
  id: string;
  patientName: string;
  date: Date;
  visits: Visit[];
  sources: SourceItem[];
  certificateType: CertificateTypeId;
  certificateContent: string;
};

// Certificate types data
const CERTIFICATE_TYPES_DATA: CertificateTypeItem[] = [
  {
    id: 'ol9',
    nameKey: 'remediusReport.certificateType.ol9.name',
    descriptionKey: 'remediusReport.certificateType.ol9.description',
    icon: FileText,
  },
  {
    id: 'sick-leave',
    nameKey: 'remediusReport.certificateType.sickLeave.name',
    descriptionKey: 'remediusReport.certificateType.sickLeave.description',
    icon: FileCheck,
  },
  {
    id: 'medical-report',
    nameKey: 'remediusReport.certificateType.medicalReport.name',
    descriptionKey: 'remediusReport.certificateType.medicalReport.description',
    icon: ClipboardList,
  },
  {
    id: 'specialist',
    nameKey: 'remediusReport.certificateType.specialist.name',
    descriptionKey: 'remediusReport.certificateType.specialist.description',
    icon: FileSpreadsheet,
  },
];

// Mock visits data
const MOCK_VISITS: Visit[] = [
  {
    id: '1',
    name: 'JS45',
    date: new Date(2024, 1, 15),
    type: 'First Visit',
    specialization: 'Adult Psychiatry',
    duration: '45 min',
    note: {
      type: 'SOAP',
      content: `**Subjective:**\n- Patient reports persistent anxiety\n- Sleep disturbances noted\n- Decreased appetite\n\n**Objective:**\n- Alert and oriented\n- Appropriate affect\n- No acute distress\n\n**Assessment:**\n- Generalized Anxiety Disorder\n- Major Depressive Disorder\n\n**Plan:**\n1. Start SSRI therapy\n2. Weekly follow-up\n3. Sleep hygiene education`,
    },
  },
  {
    id: '2',
    name: 'AK78',
    date: new Date(2024, 1, 10),
    type: 'Follow-up',
    specialization: 'Child Psychiatry',
    duration: '30 min',
    note: {
      type: 'SOAP',
      content: `**Subjective:**\n- Improved sleep pattern\n- Reduced anxiety symptoms\n- Better appetite\n\n**Objective:**\n- Improved affect\n- Good eye contact\n- Relaxed demeanor\n\n**Assessment:**\n- GAD - improving\n- MDD - improving\n\n**Plan:**\n1. Continue current medication\n2. Maintain therapy sessions\n3. Review in 2 weeks`,
    },
  },
];

const Report = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  // State management
  const [selectedCertificateType, setSelectedCertificateType] =
    useState<CertificateTypeId>('ol9');
  const [importedVisitData, setImportedVisitData] = useState<Visit[]>([]);
  const [observations, setObservations] = useState<string>('');
  const [pdfFiles, setPdfFiles] = useState<DocumentFile[]>([]);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Dialog states
  const [showVisitSelectDialog, setShowVisitSelectDialog] =
    useState<boolean>(false);
  const [showDocumentPreview, setShowDocumentPreview] =
    useState<boolean>(false);
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCertificateTypeSelect = (typeId: CertificateTypeId) => {
    setSelectedCertificateType(typeId);
  };

  const handleVisitSelect = (visitId: string) => {
    setSelectedVisits(prev => {
      const next = new Set(prev);
      next.has(visitId) ? next.delete(visitId) : next.add(visitId);
      return next;
    });
  };

  const handleImportVisits = () => {
    const selectedVisitData = MOCK_VISITS.filter(visit =>
      selectedVisits.has(visit.id),
    );
    setImportedVisitData(selectedVisitData);
    setShowVisitSelectDialog(false);
  };

  const handleRemoveVisit = (visitId: string) => {
    setImportedVisitData(prev => prev.filter(visit => visit.id !== visitId));
    setSelectedVisits(prev => {
      const next = new Set(prev);
      next.delete(visitId);
      return next;
    });
  };

  const handleAddDocument = () => {
    // Mock document addition
    const mockFile: DocumentFile = {
      name: `document_${Date.now()}.pdf`,
      size: 1024 * 1024 * 2.5, // 2.5MB
      type: 'application/pdf',
    };
    setPdfFiles(prev => [...prev, mockFile]);
  };

  const handleRemoveDocument = (fileName: string) => {
    setPdfFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handlePreviewDocument = (file: DocumentFile) => {
    setPreviewFile(file);
    setShowDocumentPreview(true);
  };

  const handleGenerate = () => {
    if (
      !selectedCertificateType ||
      (importedVisitData.length === 0 &&
        !observations.trim() &&
        pdfFiles.length === 0)
    ) {
      Alert.alert(
        t('common.error'),
        t('remediusReport.generate.requirementsTooltip'),
      );
      return;
    }

    setIsGenerating(true);
    setSelectedCertificate(null);
    setShowPreview(false);

    // Mock generation
    setTimeout(() => {
      const newCertificate: Certificate = {
        id: Date.now().toString(),
        patientName: '',
        date: new Date(),
        visits: importedVisitData,
        sources: [
          {
            type: 'record',
            title: t('remediusReport.preview.sourceTypes.record'),
            confidence: 94,
            details: t('remediusReport.preview.sourcesDetails'),
          },
          {
            type: 'analysis',
            title: t('remediusReport.preview.sourceTypes.analysis'),
            confidence: 75,
          },
        ],
        certificateType: selectedCertificateType,
        certificateContent: `# ${t(
          CERTIFICATE_TYPES_DATA.find(
            type => type.id === selectedCertificateType,
          )?.nameKey || '',
        )}\n\n**${t(
          'common.date',
        )}:** ${new Date().toLocaleDateString()}\n\n**${t(
          'remediusReport.patientData.observations',
        )}:**\n${observations || 'Generated based on imported data'}\n\n**${t(
          'remediusReport.preview.visitHistory',
        )}:**\n${importedVisitData
          .map(visit => `- ${visit.name} (${visit.date.toLocaleDateString()})`)
          .join('\n')}\n\n**${t(
          'remediusReport.preview.certificateContent',
        )}:**\nThis is a mock generated certificate content that would be created by the AI system based on the provided patient data, observations, and imported visit information.`,
      };
      setSelectedCertificate(newCertificate);
      setShowPreview(true);
      setIsGenerating(false);
    }, 2000);
  };

  const handleExport = () => {
    if (!selectedCertificate) return;
    Alert.alert(
      t('remediusReport.preview.export'),
      t('remediusReport.export.success', {
        defaultValue: 'Certificate exported successfully',
      }),
    );
  };

  const handleCopyCertificateContent = () => {
    if (!selectedCertificate?.certificateContent) return;
    // Mock copy functionality
    Alert.alert(
      t('success.copied'),
      t('success.copied', { defaultValue: 'Copied to clipboard' }),
    );
  };

  const openVisitSelectDialog = () => {
    setShowVisitSelectDialog(true);
    setSelectedVisits(new Set(importedVisitData.map(visit => visit.id)));
  };

  const filteredVisits: Visit[] = MOCK_VISITS.filter(visit =>
    visit.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderCertificateType = ({ item }: { item: CertificateTypeItem }) => {
    const Icon = item.icon;
    const isSelected = selectedCertificateType === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.certificateTypeCard,
          isSelected && styles.selectedCertificateTypeCard,
        ]}
        onPress={() => handleCertificateTypeSelect(item.id)}
      >
        <View style={styles.certificateTypeIcon}>
          <Icon
            size={20}
            color={isSelected ? '#46B7C6' : '#64748B'}
          />
        </View>
        <View style={styles.certificateTypeContent}>
          <Text
            variant="titleMedium"
            style={[
              styles.certificateTypeName,
              isSelected && styles.selectedCertificateTypeName,
            ]}
          >
            {t(item.nameKey)}
          </Text>
          <Text variant="bodySmall" style={styles.certificateTypeDescription}>
            {t(item.descriptionKey)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderImportedVisit = ({ item }: { item: Visit }) => (
    <View style={styles.importedVisitCard}>
      <View style={styles.importedVisitHeader}>
        <View>
          <Text variant="titleMedium" style={styles.importedVisitName}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={styles.importedVisitDate}>
            {item.date.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.importedVisitTags}>
          <View style={styles.visitTag}>
            <Text variant="labelSmall" style={styles.visitTagText}>
              {item.type}
            </Text>
          </View>
          <View style={styles.visitTag}>
            <Text variant="labelSmall" style={styles.visitTagText}>
              {item.specialization}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRemoveVisit(item.id)}
            style={styles.removeVisitButton}
          >
            <X size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderDocument = ({ item }: { item: DocumentFile }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentIcon}>
        <FileText size={16} color={colors.error} />
      </View>
      <View style={styles.documentInfo}>
        <Text
          variant="labelMedium"
          style={styles.documentName}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text variant="bodySmall" style={styles.documentSize}>
          {(item.size / 1024 / 1024).toFixed(2)} MB
        </Text>
      </View>
      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.documentActionButton}
          onPress={() => handlePreviewDocument(item)}
        >
          <Eye size={14} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.documentActionButton}
          onPress={() => handleRemoveDocument(item.name)}
        >
          <Trash2 size={14} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVisitItem = ({ item }: { item: Visit }) => (
    <TouchableOpacity
      style={[
        styles.visitSelectItem,
        selectedVisits.has(item.id) && styles.selectedVisitSelectItem,
      ]}
      onPress={() => handleVisitSelect(item.id)}
    >
      <View style={styles.visitSelectContent}>
        <Text variant="titleMedium" style={styles.visitSelectName}>
          {item.name}
        </Text>
        <View style={styles.visitSelectMeta}>
          <Clock size={12} color={colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={styles.visitSelectDate}>
            {item.date.toLocaleDateString()} • {item.duration}
          </Text>
        </View>
        <View style={styles.visitSelectTags}>
          <View style={styles.visitTag}>
            <Text variant="labelSmall" style={styles.visitTagText}>
              {item.type}
            </Text>
          </View>
          <View style={styles.visitTag}>
            <Text variant="labelSmall" style={styles.visitTagText}>
              {item.specialization}
            </Text>
          </View>
        </View>
      </View>
      {selectedVisits.has(item.id) && (
        <Check size={20} color="#46B7C6" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <Header
          title={t('remediusReport.title')}
          subtitle={t('remediusReport.subtitle')}
          onLeftPress={handleBack}
          showIcon={false}
          backgroundColor="#FFFFFF"
          showBorder={true}
        />

        <View style={styles.content}>
          {/* Main Content */}
          <ScrollView
            style={styles.mainContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Certificate Type Selection */}
            <View style={[styles.section, styles.certificateTypeSection]}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                {t('remediusReport.certificateType.title')}
              </Text>
              <Gap height={hp(1)} />
              <FlatList
                data={CERTIFICATE_TYPES_DATA}
                renderItem={renderCertificateType}
                keyExtractor={item => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.certificateTypeRow}
              />
            </View>

            {/* Patient Data */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  {t('remediusReport.patientData.title')}
                </Text>
                <TouchableOpacity
                  style={styles.importButton}
                  onPress={openVisitSelectDialog}
                  activeOpacity={0.85}
                  >
                    <Plus size={16} color="white" />
                    <Text variant="titleMedium" style={styles.importButtonText}>
                      {t('remediusReport.patientData.importButton')}
                    </Text>
                </TouchableOpacity>
              </View>

              {/* Imported Visits */}
              {importedVisitData.length > 0 && (
                <View style={styles.importedVisitsContainer}>
                  <FlatList
                    data={importedVisitData}
                    renderItem={renderImportedVisit}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Observations */}
              <View style={styles.observationsContainer}>
                <Text variant="titleMedium" style={styles.observationsLabel}>
                  {t('remediusReport.patientData.observations')}
                </Text>
                <TextInput
                  style={styles.observationsInput}
                  placeholder={t(
                    'remediusReport.patientData.observationsPlaceholder',
                  )}
                  value={observations}
                  onChangeText={setObservations}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="rgba(74, 69, 78, 0.5)"
                />
              </View>

              {/* Document Upload */}
              <View style={styles.documentUploadContainer}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleAddDocument}
                  activeOpacity={0.85}
                >
                  <Upload size={20} color="white" />
                  <Text variant="labelLarge" style={styles.uploadButtonText}>
                    {t('remediusReport.patientData.uploadDocuments')}
                  </Text>
                </TouchableOpacity>

                {/* Uploaded Documents */}
                {pdfFiles.length > 0 && (
                  <View style={styles.uploadedDocumentsContainer}>
                    <Text
                      variant="labelMedium"
                      style={styles.uploadedDocumentsTitle}
                    >
                      {t('remediusReport.patientData.uploadedDocuments', {
                        count: pdfFiles.length,
                      })}{' '}
                      ({pdfFiles.length})
                    </Text>
                    <FlatList
                      data={pdfFiles}
                      renderItem={renderDocument}
                      keyExtractor={(_, index) => index.toString()}
                      scrollEnabled={false}
                    />
                  </View>
                )}
              </View>

              {/* Generate and Preview Buttons */}
              <View style={styles.generateButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    (!selectedCertificateType ||
                      (importedVisitData.length === 0 &&
                        !observations.trim() &&
                        pdfFiles.length === 0)) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    if (selectedCertificate) {
                      setShowPreview(true);
                    } else {
                      handleGenerate();
                      setTimeout(() => setShowPreview(true), 500);
                    }
                  }}
                  disabled={
                    isGenerating ||
                    !selectedCertificateType ||
                    (importedVisitData.length === 0 &&
                      !observations.trim() &&
                      pdfFiles.length === 0)
                  }
                  activeOpacity={0.85}
                  >
                    <Text variant="labelLarge" style={styles.previewButtonText}>
                      {t('remediusReport.preview.title')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    (isGenerating ||
                    !selectedCertificateType ||
                    (importedVisitData.length === 0 &&
                      !observations.trim() &&
                        pdfFiles.length === 0)) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleGenerate}
                  disabled={
                      isGenerating ||
                      !selectedCertificateType ||
                      (importedVisitData.length === 0 &&
                        !observations.trim() &&
                        pdfFiles.length === 0)
                    }
                  activeOpacity={0.85}
                  >
                    <Text
                      variant="labelLarge"
                      style={styles.generateButtonText}
                    >
                      {isGenerating
                        ? t('remediusReport.generate.generating')
                        : t('remediusReport.generate.button')}
                    </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Preview Panel */}
          {showPreview && selectedCertificate && (
            <View style={styles.previewOverlay}>
              <View style={styles.previewPanel}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewHeaderContent}>
                    <Text variant="titleLarge" style={styles.previewTitle}>
                      {t('remediusReport.preview.title')}
                    </Text>
                    <Text variant="bodySmall" style={styles.previewSubtitle}>
                      {t(
                        CERTIFICATE_TYPES_DATA.find(
                          type =>
                            type.id === selectedCertificate.certificateType,
                        )?.nameKey || '',
                      )}
                    </Text>
                  </View>
                  <View style={styles.previewActions}>
                    <TouchableOpacity
                      style={styles.previewActionButton}
                      onPress={handleCopyCertificateContent}
                    >
                      <Copy size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.previewActionButton}
                      onPress={handleExport}
                    >
                      <Download size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.previewActionButton}
                      onPress={() => setShowPreview(false)}
                    >
                      <X size={18} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={styles.previewContent}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.previewContentContainer}
                >
                  <View style={styles.previewDateContainer}>
                    <Text variant="bodySmall" style={styles.previewDateLabel}>
                      {t('common.date')}
                    </Text>
                    <Text variant="bodyMedium" style={styles.previewDateValue}>
                      {selectedCertificate.date.toLocaleDateString()}
                    </Text>
                  </View>

                  {selectedCertificate.certificateContent && (
                    <View style={styles.certificateContentContainer}>
                      <Text
                        variant="labelMedium"
                        style={styles.certificateContentTitle}
                      >
                        {t('remediusReport.preview.certificateContent')}
                      </Text>
                      <View style={styles.certificateContentBox}>
                        <Text
                          variant="bodySmall"
                          style={styles.certificateContentText}
                        >
                          {selectedCertificate.certificateContent}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* Visit Select Dialog */}
        {showVisitSelectDialog && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogContainer}>
              <View style={styles.dialogHeader}>
                <Text variant="headlineSmall" style={textStyles.headlineSmall}>
                  {t('remediusReport.visitSelectDialog.title')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowVisitSelectDialog(false)}
                >
                  <X size={24} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Search
                  size={16}
                  color={colors.onSurfaceVariant}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t(
                    'remediusReport.visitSelectDialog.searchPlaceholder',
                  )}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="rgba(74, 69, 78, 0.5)"
                />
              </View>

              <FlatList
                data={filteredVisits}
                renderItem={renderVisitItem}
                keyExtractor={item => item.id}
                style={styles.visitSelectList}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowVisitSelectDialog(false)}
                >
                  <Text variant="labelMedium" style={styles.cancelButtonText}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.importVisitsButton}
                  onPress={handleImportVisits}
                  activeOpacity={0.85}
                  >
                    <Text
                      variant="labelMedium"
                      style={styles.importVisitsButtonText}
                    >
                      {t('remediusReport.visitSelectDialog.importButton')}
                    </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Document Preview Dialog */}
        {showDocumentPreview && previewFile && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogContainer}>
              <View style={styles.dialogHeader}>
                <Text variant="headlineSmall" style={textStyles.headlineSmall}>
                  {t('remediusReport.documentPreview.title')}
                </Text>
                <TouchableOpacity onPress={() => setShowDocumentPreview(false)}>
                  <X size={24} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              <View style={styles.documentPreviewContent}>
                <Text
                  variant="bodySmall"
                  style={styles.documentPreviewFileName}
                >
                  {t('remediusReport.documentPreview.fileName')}:{' '}
                  {previewFile.name}
                </Text>
                <View style={styles.documentPreviewContainer}>
                  <Text variant="bodyMedium" style={styles.documentPreviewText}>
                    Document preview would be displayed here
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: wp(4),
    backgroundColor: '#F8FAFC',
  },
  section: {
    marginBottom: hp(3),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  importButton: {
    backgroundColor: '#46B7C6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  importButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  // Certificate Type Styles
  certificateTypeSection: {
    marginBottom: hp(4),
  },
  certificateTypeRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  certificateTypeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCertificateTypeCard: {
    backgroundColor: 'rgba(70, 183, 198, 0.08)',
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  certificateTypeIcon: {
    marginRight: 12,
  },
  certificateTypeContent: {
    flex: 1,
  },
  certificateTypeName: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  selectedCertificateTypeName: {
    color: '#46B7C6',
  },
  certificateTypeDescription: {
    color: '#64748B',
    marginTop: 2,
    fontSize: 12,
    letterSpacing: 0,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  // Imported Visits Styles
  importedVisitsContainer: {
    marginBottom: hp(2),
  },
  importedVisitCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  importedVisitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  importedVisitName: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  importedVisitDate: {
    color: '#64748B',
    marginTop: 2,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  importedVisitTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(70, 183, 198, 0.1)',
    borderRadius: 6,
  },
  visitTagText: {
    color: '#46B7C6',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  removeVisitButton: {
    padding: 4,
  },
  // Observations Styles
  observationsContainer: {
    marginBottom: hp(2),
  },
  observationsLabel: {
    color: '#1A1A1A',
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#F9FAFB',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    letterSpacing: -0.2,
  },
  // Document Upload Styles
  documentUploadContainer: {
    marginBottom: hp(2),
  },
  uploadButton: {
    backgroundColor: '#46B7C6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  uploadedDocumentsContainer: {
    marginTop: 16,
  },
  uploadedDocumentsTitle: {
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  documentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  documentSize: {
    color: '#64748B',
    marginTop: 2,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  documentActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  // Generate Button Styles
  generateButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: hp(2),
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#46B7C6',
    borderRadius: 12,
    height: 48,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  previewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#46B7C6',
    borderRadius: 12,
    height: 48,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  // Preview Panel Styles
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewPanel: {
    width: wp(95),
    maxHeight: hp(85),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  previewHeaderContent: {
    flex: 1,
    marginRight: wp(2),
  },
  previewTitle: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  previewSubtitle: {
    color: '#64748B',
    marginTop: 4,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewActionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  previewContent: {
    flex: 1,
  },
  previewContentContainer: {
    padding: wp(4),
  },
  previewDateContainer: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  previewDateLabel: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  previewDateValue: {
    color: '#1A1A1A',
    fontWeight: '600',
    marginTop: 2,
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  certificateContentContainer: {
    marginBottom: 16,
  },
  certificateContentTitle: {
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  certificateContentBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 0,
    borderRadius: 10,
    padding: 16,
  },
  certificateContentText: {
    color: '#1A1A1A',
    lineHeight: 22,
    fontSize: 14,
    letterSpacing: -0.1,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  // Dialog Styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContainer: {
    width: wp(90),
    maxHeight: hp(80),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dialogTitle: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: wp(4),
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  visitSelectList: {
    maxHeight: hp(50),
    paddingHorizontal: wp(4),
  },
  visitSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedVisitSelectItem: {
    backgroundColor: 'rgba(70, 183, 198, 0.08)',
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
  },
  visitSelectContent: {
    flex: 1,
  },
  visitSelectName: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  visitSelectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  visitSelectDate: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  visitSelectTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  importVisitsButton: {
    backgroundColor: '#46B7C6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  importVisitsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  // Document Preview Styles
  documentPreviewContent: {
    padding: wp(4),
  },
  documentPreviewFileName: {
    color: '#64748B',
    marginBottom: 12,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  documentPreviewContainer: {
    height: hp(50),
    backgroundColor: '#F9FAFB',
    borderWidth: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentPreviewText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
});

export default Report;
