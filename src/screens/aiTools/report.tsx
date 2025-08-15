import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
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

// Certificate types data
const CERTIFICATE_TYPES_DATA = [
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
const MOCK_VISITS = [
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
  const navigation = useNavigation();
  
  // State management
  const [selectedCertificateType, setSelectedCertificateType] = useState('ol9');
  const [importedVisitData, setImportedVisitData] = useState([]);
  const [observations, setObservations] = useState('');
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dialog states
  const [showVisitSelectDialog, setShowVisitSelectDialog] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedVisits, setSelectedVisits] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCertificateTypeSelect = (typeId) => {
    setSelectedCertificateType(typeId);
  };

  const handleVisitSelect = (visitId) => {
    setSelectedVisits(prev => {
      const next = new Set(prev);
      next.has(visitId) ? next.delete(visitId) : next.add(visitId);
      return next;
    });
  };

  const handleImportVisits = () => {
    const selectedVisitData = MOCK_VISITS.filter(visit => selectedVisits.has(visit.id));
    setImportedVisitData(selectedVisitData);
    setShowVisitSelectDialog(false);
  };

  const handleRemoveVisit = (visitId) => {
    setImportedVisitData(prev => prev.filter(visit => visit.id !== visitId));
    setSelectedVisits(prev => {
      const next = new Set(prev);
      next.delete(visitId);
      return next;
    });
  };

  const handleAddDocument = () => {
    // Mock document addition
    const mockFile = {
      name: `document_${Date.now()}.pdf`,
      size: 1024 * 1024 * 2.5, // 2.5MB
      type: 'application/pdf',
    };
    setPdfFiles(prev => [...prev, mockFile]);
  };

  const handleRemoveDocument = (fileName) => {
    setPdfFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handlePreviewDocument = (file) => {
    setPreviewFile(file);
    setShowDocumentPreview(true);
  };

  const handleGenerate = () => {
    if (!selectedCertificateType || 
        (importedVisitData.length === 0 && !observations.trim() && pdfFiles.length === 0)) {
      Alert.alert(
        t('common.error'),
        t('remediusReport.generate.requirementsTooltip')
      );
      return;
    }

    setIsGenerating(true);
    setSelectedCertificate(null);
    setShowPreview(false);

    // Mock generation
    setTimeout(() => {
      const newCertificate = {
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
            confidence: 75 
          },
        ],
        certificateType: selectedCertificateType,
        certificateContent: `# ${t(CERTIFICATE_TYPES_DATA.find(type => type.id === selectedCertificateType)?.nameKey || '')}\n\n**${t('common.date')}:** ${new Date().toLocaleDateString()}\n\n**${t('remediusReport.patientData.observations')}:**\n${observations || 'Generated based on imported data'}\n\n**${t('remediusReport.preview.visitHistory')}:**\n${importedVisitData.map(visit => `- ${visit.name} (${visit.date.toLocaleDateString()})`).join('\n')}\n\n**${t('remediusReport.preview.certificateContent')}:**\nThis is a mock generated certificate content that would be created by the AI system based on the provided patient data, observations, and imported visit information.`,
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
      t('remediusReport.export.success', { defaultValue: 'Certificate exported successfully' })
    );
  };

  const handleCopyCertificateContent = () => {
    if (!selectedCertificate?.certificateContent) return;
    // Mock copy functionality
    Alert.alert(
      t('success.copied'),
      t('success.copied', { defaultValue: 'Copied to clipboard' })
    );
  };

  const openVisitSelectDialog = () => {
    setShowVisitSelectDialog(true);
    setSelectedVisits(new Set(importedVisitData.map(visit => visit.id)));
  };

  const filteredVisits = MOCK_VISITS.filter(visit => 
    visit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCertificateType = ({ item }) => {
    const Icon = item.icon;
    const isSelected = selectedCertificateType === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.certificateTypeCard,
          isSelected && styles.selectedCertificateTypeCard
        ]}
        onPress={() => handleCertificateTypeSelect(item.id)}
      >
        <View style={styles.certificateTypeIcon}>
          <Icon size={20} color={isSelected ? colors.lightGreen : colors.onSurfaceVariant} />
        </View>
        <View style={styles.certificateTypeContent}>
          <Text variant="titleMedium" style={[
            styles.certificateTypeName,
            isSelected && styles.selectedCertificateTypeName
          ]}>
            {t(item.nameKey)}
          </Text>
          <Text variant="bodySmall" style={styles.certificateTypeDescription}>
            {t(item.descriptionKey)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderImportedVisit = ({ item }) => (
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
            <Text variant="labelSmall" style={styles.visitTagText}>{item.type}</Text>
          </View>
          <View style={styles.visitTag}>
            <Text variant="labelSmall" style={styles.visitTagText}>{item.specialization}</Text>
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

  const renderDocument = ({ item }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentIcon}>
        <FileText size={16} color={colors.error} />
      </View>
      <View style={styles.documentInfo}>
        <Text variant="labelMedium" style={styles.documentName} numberOfLines={1}>
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

  const renderVisitItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.visitSelectItem,
        selectedVisits.has(item.id) && styles.selectedVisitSelectItem
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
            <Text variant="labelSmall" style={styles.visitTagText}>{item.type}</Text>
          </View>
          <View style={styles.visitTag}>
            <Text variant="labelSmall" style={styles.visitTagText}>{item.specialization}</Text>
          </View>
        </View>
      </View>
      {selectedVisits.has(item.id) && (
        <Check size={20} color={colors.lightGreen} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('remediusReport.title')}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {t('remediusReport.subtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Main Content */}
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          {/* Certificate Type Selection */}
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {t('remediusReport.certificateType.title')}
            </Text>
            <FlatList
              data={CERTIFICATE_TYPES_DATA}
              renderItem={renderCertificateType}
              keyExtractor={(item) => item.id}
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
              >
                <Plus size={16} color="white" />
                <Text variant="labelMedium" style={styles.importButtonText}>
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
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Observations */}
            <View style={styles.observationsContainer}>
              <Text variant="labelMedium" style={styles.observationsLabel}>
                {t('remediusReport.patientData.observations')}
              </Text>
              <TextInput
                style={styles.observationsInput}
                placeholder={t('remediusReport.patientData.observationsPlaceholder')}
                value={observations}
                onChangeText={setObservations}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.placeholderColor}
              />
            </View>

            {/* Document Upload */}
            <View style={styles.documentUploadContainer}>
              <TouchableOpacity
                style={styles.uploadArea}
                onPress={handleAddDocument}
              >
                <Upload size={24} color={colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.uploadText}>
                  {t('remediusReport.patientData.dropDocuments')}
                </Text>
                <Text variant="bodySmall" style={styles.uploadSubtext}>
                  {t('remediusReport.patientData.supportedFormat')} • {t('remediusReport.patientData.maxDocuments', { count: 5 })}
                </Text>
              </TouchableOpacity>

              {/* Uploaded Documents */}
              {pdfFiles.length > 0 && (
                <View style={styles.uploadedDocumentsContainer}>
                  <Text variant="labelMedium" style={styles.uploadedDocumentsTitle}>
                    {t('remediusReport.patientData.uploadedDocuments', { count: pdfFiles.length })} ({pdfFiles.length})
                  </Text>
                  <FlatList
                    data={pdfFiles}
                    renderItem={renderDocument}
                    keyExtractor={(item, index) => index.toString()}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateButton,
                (!selectedCertificateType || 
                (importedVisitData.length === 0 && !observations.trim() && pdfFiles.length === 0)) && 
                styles.generateButtonDisabled
              ]}
              onPress={handleGenerate}
              disabled={isGenerating || (!selectedCertificateType || 
                (importedVisitData.length === 0 && !observations.trim() && pdfFiles.length === 0))}
            >
              {isGenerating ? (
                <>
                  <Text variant="labelMedium" style={styles.generateButtonText}>
                    {t('remediusReport.generate.generating')}
                  </Text>
                </>
              ) : (
                <>
                  <Brain size={16} color="white" />
                  <Text variant="labelMedium" style={styles.generateButtonText}>
                    {t('remediusReport.generate.button')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Preview Panel */}
        {showPreview && selectedCertificate && (
          <View style={styles.previewPanel}>
            <View style={styles.previewHeader}>
              <View>
                <Text variant="titleLarge" style={styles.previewTitle}>
                  {t('remediusReport.preview.title')}
                </Text>
                <Text variant="bodySmall" style={styles.previewSubtitle}>
                  {t(CERTIFICATE_TYPES_DATA.find(type => type.id === selectedCertificate.certificateType)?.nameKey || '')}
                </Text>
              </View>
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewActionButton}
                  onPress={handleCopyCertificateContent}
                >
                  <Copy size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.previewActionButton}
                  onPress={handleExport}
                >
                  <Download size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.previewActionButton}
                  onPress={() => setShowPreview(false)}
                >
                  <X size={16} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
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
                  <Text variant="labelMedium" style={styles.certificateContentTitle}>
                    {t('remediusReport.preview.certificateContent')}
                  </Text>
                  <View style={styles.certificateContentBox}>
                    <Text variant="bodySmall" style={styles.certificateContentText}>
                      {selectedCertificate.certificateContent}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Visit Select Dialog */}
      {showVisitSelectDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <Text variant="headlineSmall" style={styles.dialogTitle}>
                {t('remediusReport.visitSelectDialog.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowVisitSelectDialog(false)}>
                <X size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={16} color={colors.onSurfaceVariant} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('remediusReport.visitSelectDialog.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.placeholderColor}
              />
            </View>

            <FlatList
              data={filteredVisits}
              renderItem={renderVisitItem}
              keyExtractor={(item) => item.id}
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
              >
                <Text variant="labelMedium" style={styles.importVisitsButtonText}>
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
              <Text variant="headlineSmall" style={styles.dialogTitle}>
                {t('remediusReport.documentPreview.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowDocumentPreview(false)}>
                <X size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.documentPreviewContent}>
              <Text variant="bodySmall" style={styles.documentPreviewFileName}>
                {t('remediusReport.documentPreview.fileName')}: {previewFile.name}
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
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: wp(3),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: colors.lightGreen,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    padding: wp(4),
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
    color: colors.onSurface,
    fontWeight: '600',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.lightGreen,
    borderRadius: 6,
  },
  importButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Certificate Type Styles
  certificateTypeRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  certificateTypeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedCertificateTypeCard: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  certificateTypeIcon: {
    marginRight: 12,
  },
  certificateTypeContent: {
    flex: 1,
  },
  certificateTypeName: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  selectedCertificateTypeName: {
    color: colors.lightGreen,
  },
  certificateTypeDescription: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  // Imported Visits Styles
  importedVisitsContainer: {
    marginBottom: hp(2),
  },
  importedVisitCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  importedVisitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  importedVisitName: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  importedVisitDate: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  importedVisitTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
  },
  visitTagText: {
    color: colors.onSurface,
  },
  removeVisitButton: {
    padding: 4,
  },
  // Observations Styles
  observationsContainer: {
    marginBottom: hp(2),
  },
  observationsLabel: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: colors.surface,
  },
  // Document Upload Styles
  documentUploadContainer: {
    marginBottom: hp(2),
  },
  uploadArea: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  uploadText: {
    color: colors.onSurface,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadSubtext: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  uploadedDocumentsContainer: {
    marginTop: 16,
  },
  uploadedDocumentsTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  documentIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  documentSize: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  documentActionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  // Generate Button Styles
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
    marginTop: hp(2),
  },
  generateButtonDisabled: {
    backgroundColor: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Preview Panel Styles
  previewPanel: {
    width: wp(45),
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderLeftColor: colors.outline,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  previewTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  previewSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  previewContent: {
    flex: 1,
    padding: wp(4),
  },
  previewDateContainer: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    marginBottom: 16,
  },
  previewDateLabel: {
    color: colors.onSurfaceVariant,
  },
  previewDateValue: {
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },
  certificateContentContainer: {
    marginBottom: 16,
  },
  certificateContentTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  certificateContentBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: 16,
  },
  certificateContentText: {
    color: colors.onSurface,
    lineHeight: 20,
  },
  // Dialog Styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContainer: {
    width: wp(90),
    maxHeight: hp(80),
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  dialogTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: wp(4),
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
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
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedVisitSelectItem: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  visitSelectContent: {
    flex: 1,
  },
  visitSelectName: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  visitSelectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  visitSelectDate: {
    color: colors.onSurfaceVariant,
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
    borderTopColor: colors.outline,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: colors.onSurface,
  },
  importVisitsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightGreen,
    borderRadius: 6,
  },
  importVisitsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Document Preview Styles
  documentPreviewContent: {
    padding: wp(4),
  },
  documentPreviewFileName: {
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  documentPreviewContainer: {
    height: hp(50),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentPreviewText: {
    color: colors.onSurfaceVariant,
  },
});

export default Report;