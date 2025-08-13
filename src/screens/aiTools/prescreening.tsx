import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
  Brain,
  Upload,
  FileText,
  BarChart3,
  Activity,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

const Prescreening = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // State management
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [specialistAnalysis, setSpecialistAnalysis] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Mock analysis results
  const mockResults = {
    patientData: {
      age: '45',
      mainDiagnosis: 'Major Depressive Disorder',
      comorbidities: ['Generalized Anxiety Disorder', 'Insomnia'],
    },
    criteriaAnalysis: {
      total: 24,
      positive: 18,
      problems: 3,
      verification: 3,
    },
    overallQualification: 'probablyQualifies',
    mainProblems: [
      'Requires assessment of hypertension control',
      'Verification of current alcohol use is necessary',
      'Assessment of anxiety disorder severity',
    ],
    qualificationProbability: 75,
    criticalInfo: [
      'Current medication adherence',
      'Recent blood pressure readings',
      'Alcohol consumption patterns',
    ],
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };

  const handleUploadPDF = () => {
    // Mock PDF upload
    const mockFile = {
      name: `medical_history_${Date.now()}.pdf`,
      size: 1024 * 1024 * 2.1, // 2.1MB
      type: 'application/pdf',
    };
    setPdfFiles(prev => [...prev, mockFile]);
  };

  const handleRemovePDF = (fileName) => {
    setPdfFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleLoadDemoData = () => {
    setMedicalHistory(`Patient: 45-year-old male
    
Primary Diagnosis: Major Depressive Disorder (F33.2)
Duration: Ongoing for 3 years

Medical History:
- Previous depressive episodes: 2010, 2015
- Hospitalization for severe depression: 2021
- Comorbid Generalized Anxiety Disorder
- Chronic insomnia

Current Medications:
- Sertraline 100mg daily (6 months)
- Lorazepam 0.5mg PRN
- Trazodone 50mg HS

Previous Treatments:
- Cognitive Behavioral Therapy (2021-2022)
- Escitalopram (discontinued due to side effects)
- Venlafaxine (partial response)

Current Symptoms:
- Persistent low mood
- Anhedonia
- Sleep disturbances
- Concentration difficulties
- Fatigue

Physical Health:
- Hypertension (controlled with medication)
- BMI: 28.5
- No cardiac contraindications identified
    
Social History:
- Employed full-time
- Married with 2 children
- Occasional alcohol use (1-2 drinks/week)
- No substance abuse history`);
  };

  const handleStartAnalysis = () => {
    if (!medicalHistory.trim() && pdfFiles.length === 0) {
      Alert.alert(
        t('common.error'),
        t('preScreening.messages.missingData')
      );
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);

    // Simulate analysis
    setTimeout(() => {
      setAnalysisResults(mockResults);
      setIsAnalyzing(false);
      setShowResults(true);
    }, 3000);
  };

  const handleClearHistory = () => {
    setMedicalHistory('');
    setPdfFiles([]);
    setAnalysisResults(null);
    setShowResults(false);
  };

  const getQualificationColor = (qualification) => {
    switch (qualification) {
      case 'probablyQualifies':
        return colors.lightGreen;
      case 'needsVerification':
        return '#F59E0B';
      case 'probablyNotQualified':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getQualificationIcon = (qualification) => {
    switch (qualification) {
      case 'probablyQualifies':
        return CheckCircle;
      case 'needsVerification':
        return AlertTriangle;
      case 'probablyNotQualified':
        return XCircle;
      default:
        return Clock;
    }
  };

  const renderPDFFile = (file, index) => (
    <View key={index} style={styles.pdfFileItem}>
      <View style={styles.pdfFileIcon}>
        <FileText size={16} color={colors.error} />
      </View>
      <View style={styles.pdfFileInfo}>
        <Text variant="labelMedium" style={styles.pdfFileName} numberOfLines={1}>
          {file.name}
        </Text>
        <Text variant="bodySmall" style={styles.pdfFileSize}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemovePDF(file.name)}
        style={styles.removePdfButton}
      >
        <Text variant="labelSmall" style={styles.removePdfText}>
          {t('common.delete')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('preScreening.title')}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {t('preScreening.subtitle')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.toggleButton, specialistAnalysis && styles.toggleButtonActive]}
            onPress={() => setSpecialistAnalysis(!specialistAnalysis)}
          >
            <Sparkles size={16} color={specialistAnalysis ? 'white' : colors.lightGreen} />
            <Text variant="labelSmall" style={[
              styles.toggleButtonText,
              specialistAnalysis && styles.toggleButtonTextActive
            ]}>
              {t('preScreening.specialistAnalysis.label')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showResults ? (
          // Input Screen
          <View style={styles.inputContainer}>
            {/* AI Model Selection */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('preScreening.aiModel.label')}
              </Text>
              <View style={styles.modelSelector}>
                <TouchableOpacity
                  style={[
                    styles.modelButton,
                    selectedModel === 'gemini' && styles.selectedModelButton
                  ]}
                  onPress={() => handleModelSelect('gemini')}
                >
                  <Brain size={20} color={selectedModel === 'gemini' ? 'white' : colors.lightGreen} />
                  <Text variant="labelMedium" style={[
                    styles.modelButtonText,
                    selectedModel === 'gemini' && styles.selectedModelButtonText
                  ]}>
                    {t('preScreening.aiModel.gemini')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modelButton,
                    selectedModel === 'claude' && styles.selectedModelButton
                  ]}
                  onPress={() => handleModelSelect('claude')}
                >
                  <Brain size={20} color={selectedModel === 'claude' ? 'white' : colors.lightGreen} />
                  <Text variant="labelMedium" style={[
                    styles.modelButtonText,
                    selectedModel === 'claude' && styles.selectedModelButtonText
                  ]}>
                    {t('preScreening.aiModel.claude')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Medical History Input */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('preScreening.labels.medicalHistory')}
                </Text>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={handleLoadDemoData}
                >
                  <Text variant="labelSmall" style={styles.demoButtonText}>
                    {t('preScreening.buttons.demoMode')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {pdfFiles.length > 0 && (
                <View style={styles.pdfFilesContainer}>
                  <Text variant="labelMedium" style={styles.pdfFilesTitle}>
                    {t('preScreening.labels.pdfFilesLoaded', { fileCount: pdfFiles.length })}
                  </Text>
                  {pdfFiles.map((file, index) => renderPDFFile(file, index))}
                </View>
              )}

              <TextInput
                style={styles.medicalHistoryInput}
                placeholder={t('preScreening.placeholders.medicalHistory')}
                value={medicalHistory}
                onChangeText={setMedicalHistory}
                multiline
                numberOfLines={8}
                placeholderTextColor={colors.placeholderColor}
              />
            </View>

            {/* PDF Upload */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.uploadArea} onPress={handleUploadPDF}>
                <Upload size={24} color={colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.uploadText}>
                  {t('preScreening.buttons.uploadPdf')}
                </Text>
                <Text variant="bodySmall" style={styles.uploadSubtext}>
                  {t('preScreening.pdfUpload.description')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
              >
                <Text variant="labelMedium" style={styles.clearButtonText}>
                  {t('preScreening.buttons.clearHistory')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.analyzeButton,
                  (!medicalHistory.trim() && pdfFiles.length === 0) && styles.analyzeButtonDisabled
                ]}
                onPress={handleStartAnalysis}
                disabled={isAnalyzing || (!medicalHistory.trim() && pdfFiles.length === 0)}
              >
                {isAnalyzing ? (
                  <>
                    <Text variant="labelMedium" style={styles.analyzeButtonText}>
                      {t('preScreening.loading.title')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Brain size={16} color="white" />
                    <Text variant="labelMedium" style={styles.analyzeButtonText}>
                      {t('preScreening.buttons.startAnalysis')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Results Screen
          <View style={styles.resultsContainer}>
            {/* Patient Data Overview */}
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <User size={20} color={colors.lightGreen} />
                <Text variant="titleLarge" style={styles.resultSectionTitle}>
                  {t('preScreening.mainContent.patientData')}
                </Text>
              </View>
              <View style={styles.patientDataGrid}>
                <View style={styles.patientDataItem}>
                  <Text variant="labelMedium" style={styles.patientDataLabel}>
                    {t('preScreening.mainContent.age')}
                  </Text>
                  <Text variant="bodyLarge" style={styles.patientDataValue}>
                    {analysisResults.patientData.age} {t('preScreening.mainContent.years')}
                  </Text>
                </View>
                <View style={styles.patientDataItem}>
                  <Text variant="labelMedium" style={styles.patientDataLabel}>
                    {t('preScreening.mainContent.mainDiagnosis')}
                  </Text>
                  <Text variant="bodyMedium" style={styles.patientDataValue}>
                    {analysisResults.patientData.mainDiagnosis}
                  </Text>
                </View>
                <View style={styles.patientDataItem}>
                  <Text variant="labelMedium" style={styles.patientDataLabel}>
                    {t('preScreening.mainContent.comorbidities')}
                  </Text>
                  <View style={styles.comorbiditiesList}>
                    {analysisResults.patientData.comorbidities.map((comorbidity, index) => (
                      <View key={index} style={styles.comorbidityItem}>
                        <Text variant="bodySmall" style={styles.comorbidityText}>
                          {comorbidity}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Criteria Analysis Visualization */}
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <BarChart3 size={20} color={colors.lightGreen} />
                <Text variant="titleLarge" style={styles.resultSectionTitle}>
                  {t('preScreening.sections.criteriaStatusAfterChanges')}
                </Text>
              </View>
              <View style={styles.criteriaStats}>
                <View style={styles.criteriaStatItem}>
                  <Text variant="headlineLarge" style={styles.criteriaStatNumber}>
                    {analysisResults.criteriaAnalysis.total}
                  </Text>
                  <Text variant="labelMedium" style={styles.criteriaStatLabel}>
                    {t('preScreening.sections.totalCriteria')}
                  </Text>
                </View>
                <View style={styles.criteriaStatItem}>
                  <Text variant="headlineLarge" style={[styles.criteriaStatNumber, { color: colors.lightGreen }]}>
                    {analysisResults.criteriaAnalysis.positive}
                  </Text>
                  <Text variant="labelMedium" style={styles.criteriaStatLabel}>
                    {t('preScreening.sections.positiveCriteria')}
                  </Text>
                </View>
                <View style={styles.criteriaStatItem}>
                  <Text variant="headlineLarge" style={[styles.criteriaStatNumber, { color: colors.error }]}>
                    {analysisResults.criteriaAnalysis.problems}
                  </Text>
                  <Text variant="labelMedium" style={styles.criteriaStatLabel}>
                    {t('preScreening.sections.problemCriteria')}
                  </Text>
                </View>
                <View style={styles.criteriaStatItem}>
                  <Text variant="headlineLarge" style={[styles.criteriaStatNumber, { color: '#F59E0B' }]}>
                    {analysisResults.criteriaAnalysis.verification}
                  </Text>
                  <Text variant="labelMedium" style={styles.criteriaStatLabel}>
                    {t('preScreening.sections.verificationNeeded')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Overall Qualification */}
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <Activity size={20} color={colors.lightGreen} />
                <Text variant="titleLarge" style={styles.resultSectionTitle}>
                  {t('preScreening.conclusion.overallQualification')}
                </Text>
              </View>
              <View style={styles.qualificationCard}>
                <View style={styles.qualificationHeader}>
                  {React.createElement(
                    getQualificationIcon(analysisResults.overallQualification),
                    { 
                      size: 24, 
                      color: getQualificationColor(analysisResults.overallQualification) 
                    }
                  )}
                  <Text variant="titleMedium" style={[
                    styles.qualificationText,
                    { color: getQualificationColor(analysisResults.overallQualification) }
                  ]}>
                    {t('preScreening.conclusion.probablyQualifies')}
                  </Text>
                </View>
                <View style={styles.probabilityContainer}>
                  <Text variant="labelMedium" style={styles.probabilityLabel}>
                    {t('preScreening.messages.estimatedQualificationProbability')}
                  </Text>
                  <Text variant="headlineMedium" style={[
                    styles.probabilityValue,
                    { color: getQualificationColor(analysisResults.overallQualification) }
                  ]}>
                    {analysisResults.qualificationProbability}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Main Problems */}
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <AlertTriangle size={20} color='#F59E0B' />
                <Text variant="titleLarge" style={styles.resultSectionTitle}>
                  {t('preScreening.messages.mainProblems')}
                </Text>
              </View>
              <View style={styles.problemsList}>
                {analysisResults.mainProblems.map((problem, index) => (
                  <View key={index} style={styles.problemItem}>
                    <View style={styles.problemBullet} />
                    <Text variant="bodyMedium" style={styles.problemText}>
                      {problem}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Critical Information */}
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <FileText size={20} color={colors.primary} />
                <Text variant="titleLarge" style={styles.resultSectionTitle}>
                  {t('preScreening.messages.criticalInfoToObtain')}
                </Text>
              </View>
              <View style={styles.criticalInfoList}>
                {analysisResults.criticalInfo.map((info, index) => (
                  <View key={index} style={styles.criticalInfoItem}>
                    <CheckCircle size={16} color={colors.lightGreen} />
                    <Text variant="bodyMedium" style={styles.criticalInfoText}>
                      {info}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.newAnalysisButton}
                onPress={() => {
                  setShowResults(false);
                  setAnalysisResults(null);
                }}
              >
                <Text variant="labelMedium" style={styles.newAnalysisButtonText}>
                  {t('preScreening.buttons.analyzeNewPatient')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.downloadButton}>
                <Download size={16} color="white" />
                <Text variant="labelMedium" style={styles.downloadButtonText}>
                  {t('preScreening.buttons.printReport')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerActions: {
    marginLeft: wp(2),
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.lightGreen,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  toggleButtonActive: {
    backgroundColor: colors.lightGreen,
  },
  toggleButtonText: {
    color: colors.lightGreen,
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  // Input Screen Styles
  inputContainer: {
    padding: wp(4),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  demoButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  demoButtonText: {
    color: colors.primary,
  },
  // AI Model Selection
  modelSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.lightGreen,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedModelButton: {
    backgroundColor: colors.lightGreen,
  },
  modelButtonText: {
    color: colors.lightGreen,
    fontWeight: '600',
  },
  selectedModelButtonText: {
    color: 'white',
  },
  // PDF Files
  pdfFilesContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGreen,
  },
  pdfFilesTitle: {
    color: colors.lightGreen,
    fontWeight: '600',
    marginBottom: 8,
  },
  pdfFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  pdfFileIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfFileInfo: {
    flex: 1,
  },
  pdfFileName: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  pdfFileSize: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  removePdfButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  removePdfText: {
    color: 'white',
  },
  // Medical History Input
  medicalHistoryInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: 'white',
    height: 200,
    textAlignVertical: 'top',
  },
  // Upload Area
  uploadArea: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  uploadText: {
    color: colors.onSurface,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  uploadSubtext: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: hp(2),
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  clearButtonText: {
    color: colors.onSurface,
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Results Screen Styles
  resultsContainer: {
    padding: wp(4),
  },
  resultSection: {
    marginBottom: hp(3),
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  resultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultSectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  // Patient Data
  patientDataGrid: {
    gap: 12,
  },
  patientDataItem: {
    gap: 4,
  },
  patientDataLabel: {
    color: colors.onSurfaceVariant,
  },
  patientDataValue: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  comorbiditiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  comorbidityItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
  },
  comorbidityText: {
    color: colors.onSurface,
  },
  // Criteria Stats
  criteriaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  criteriaStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  criteriaStatNumber: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  criteriaStatLabel: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  // Qualification
  qualificationCard: {
    gap: 16,
  },
  qualificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualificationText: {
    fontWeight: '600',
  },
  probabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  probabilityLabel: {
    color: colors.onSurfaceVariant,
  },
  probabilityValue: {
    fontWeight: '700',
  },
  // Problems List
  problemsList: {
    gap: 8,
  },
  problemItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  problemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 6,
  },
  problemText: {
    color: colors.onSurface,
    flex: 1,
  },
  // Critical Info List
  criticalInfoList: {
    gap: 8,
  },
  criticalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criticalInfoText: {
    color: colors.onSurface,
    flex: 1,
  },
  // Result Actions
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: hp(2),
  },
  newAnalysisButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.lightGreen,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  newAnalysisButtonText: {
    color: colors.lightGreen,
    fontWeight: '600',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default Prescreening;