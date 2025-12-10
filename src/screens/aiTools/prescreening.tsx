/* eslint-disable react-native/no-inline-styles */
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
  Brain,
  FileText,
  BarChart3,
  Activity,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FolderOpen,
  ChevronUp,
  RotateCcw,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/textStyles';
import Header from '../../components/header';

const Prescreening = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // State management
  const [medicalHistory, setMedicalHistory] = useState('');
  const [pdfFiles, setPdfFiles] = useState<
    Array<{ name: string; size: number; type: string }>
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
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

  const handleSavedAnalyses = () => {
    // Navigate to saved analyses screen or show modal
    // This can be implemented based on your navigation structure
    Alert.alert(
      t('preScreening.buttons.savedAnalyses'),
      'Saved analyses feature',
    );
  };

  const handleUploadPDF = () => {
    // Mock TXT upload
    const mockFile = {
      name: `medical_history_${Date.now()}.txt`,
      size: 1024 * 2.1, // 2.1KB
      type: 'text/plain',
    };
    setPdfFiles(prev => [...prev, mockFile]);
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
      Alert.alert(t('common.error'), t('preScreening.messages.missingData'));
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

  const getQualificationColor = (qualification: string) => {
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

  const getQualificationIcon = (qualification: string) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header
          title={t('preScreening.title')}
          subtitle={t('preScreening.subtitle')}
          onLeftPress={handleBack}
          icon={Brain}
          showIcon={true}
          backgroundColor={colors.surface}
        />
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.savedAnalysisButton}
            onPress={handleSavedAnalyses}
          >
            <LinearGradient
              colors={['#53A0CD', '#44C2AD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.savedAnalysisButtonGradient}
            >
              <View style={{ width: wp(1) }} />
              <FolderOpen size={16} color="white" />
              <Text
                variant="labelMedium"
                style={styles.savedAnalysisButtonText}
              >
                {t('preScreening.buttons.savedAnalyses')}
              </Text>
              <View style={{ width: wp(1) }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!showResults ? (
            // Input Screen
            <View style={styles.inputContainer}>
              {/* Select Study Protocol Section */}
              <View style={styles.section}>
                <Text variant="headlineSmall" style={textStyles.sectionTitle}>
                  {t('preScreening.protocolSelector.title')}
                </Text>
                <TouchableOpacity style={styles.protocolCard}>
                  <View style={styles.protocolCardContent}>
                    <FileText size={20} color={colors.lightGreen} />
                    <View style={styles.protocolCardText}>
                      <Text
                        variant="titleMedium"
                        style={styles.protocolCardTitle}
                      >
                        {t('preScreening.studyProtocol.title')}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={styles.protocolCardDescription}
                      >
                        {t('preScreening.studyProtocol.description')}
                      </Text>
                    </View>
                  </View>
                  <ChevronUp size={20} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* Medical History Input */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    variant="headlineMedium"
                    style={textStyles.sectionTitle}
                  >
                    {t('preScreening.labels.medicalHistory')}
                  </Text>
                  <View style={styles.medicalHistoryActions}>
                    <TouchableOpacity
                      style={styles.uploadTxtButton}
                      onPress={handleUploadPDF}
                    >
                      <LinearGradient
                        colors={['#53A0CD', '#44C2AD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.uploadTxtButtonGradient}
                      >
                        <View style={{ width: wp(1) }} />
                        <FileText size={16} color="white" />
                        <Text
                          variant="labelMedium"
                          style={styles.uploadTxtButtonText}
                        >
                          {t('preScreening.buttons.uploadTxt')}
                        </Text>
                        <View style={{ width: wp(1) }} />
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.patientHistoryButton}
                      onPress={handleLoadDemoData}
                    >
                      <LinearGradient
                        colors={['#53A0CD', '#44C2AD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.patientHistoryButtonGradient}
                      >
                        <View style={{ width: wp(1) }} />
                        <RotateCcw size={16} color="white" />
                        <Text
                          variant="labelMedium"
                          style={styles.patientHistoryButtonText}
                        >
                          {t('preScreening.buttons.patientHistory')}
                        </Text>
                        <View style={{ width: wp(1) }} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  style={styles.medicalHistoryInput}
                  placeholder={t('preScreening.placeholders.medicalHistory')}
                  value={medicalHistory}
                  onChangeText={setMedicalHistory}
                  multiline
                  numberOfLines={8}
                  placeholderTextColor={colors.placeholderColor}
                />
                <View style={styles.dataSourceInfo}>
                  <FileText size={14} color={colors.onSurfaceVariant} />
                  <Text variant="bodySmall" style={styles.dataSourceText}>
                    {t('preScreening.labels.manualOrTxtData')}
                  </Text>
                </View>
              </View>

              {/* Start Analysis Button */}
              <View style={styles.startAnalysisContainer}>
                <TouchableOpacity
                  style={[
                    styles.startAnalysisButton,
                    !medicalHistory.trim() && pdfFiles.length === 0 && {},
                  ]}
                  onPress={handleStartAnalysis}
                  disabled={
                    isAnalyzing ||
                    (!medicalHistory.trim() && pdfFiles.length === 0)
                  }
                >
                  <LinearGradient
                    colors={['#53A0CD', '#44C2AD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startAnalysisButtonGradient}
                  >
                    {isAnalyzing ? (
                      <Text
                        variant="labelLarge"
                        style={styles.startAnalysisButtonText}
                      >
                        {t('preScreening.loading.title')}
                      </Text>
                    ) : (
                      <Text
                        variant="labelLarge"
                        style={styles.startAnalysisButtonText}
                      >
                        {t('preScreening.buttons.startAnalysis')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : analysisResults ? (
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
                      {analysisResults.patientData.age}{' '}
                      {t('preScreening.mainContent.years')}
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
                      {analysisResults.patientData.comorbidities.map(
                        (comorbidity: string, index: number) => (
                          <View key={index} style={styles.comorbidityItem}>
                            <Text
                              variant="bodySmall"
                              style={styles.comorbidityText}
                            >
                              {comorbidity}
                            </Text>
                          </View>
                        ),
                      )}
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
                    <Text
                      variant="headlineLarge"
                      style={styles.criteriaStatNumber}
                    >
                      {analysisResults.criteriaAnalysis.total}
                    </Text>
                    <Text
                      variant="labelMedium"
                      style={styles.criteriaStatLabel}
                    >
                      {t('preScreening.sections.totalCriteria')}
                    </Text>
                  </View>
                  <View style={styles.criteriaStatItem}>
                    <Text
                      variant="headlineLarge"
                      style={[
                        styles.criteriaStatNumber,
                        { color: colors.lightGreen },
                      ]}
                    >
                      {analysisResults.criteriaAnalysis.positive}
                    </Text>
                    <Text
                      variant="labelMedium"
                      style={styles.criteriaStatLabel}
                    >
                      {t('preScreening.sections.positiveCriteria')}
                    </Text>
                  </View>
                  <View style={styles.criteriaStatItem}>
                    <Text
                      variant="headlineLarge"
                      style={[
                        styles.criteriaStatNumber,
                        { color: colors.error },
                      ]}
                    >
                      {analysisResults.criteriaAnalysis.problems}
                    </Text>
                    <Text
                      variant="labelMedium"
                      style={styles.criteriaStatLabel}
                    >
                      {t('preScreening.sections.problemCriteria')}
                    </Text>
                  </View>
                  <View style={styles.criteriaStatItem}>
                    <Text
                      variant="headlineLarge"
                      style={[styles.criteriaStatNumber, { color: '#F59E0B' }]}
                    >
                      {analysisResults.criteriaAnalysis.verification}
                    </Text>
                    <Text
                      variant="labelMedium"
                      style={styles.criteriaStatLabel}
                    >
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
                      getQualificationIcon(
                        analysisResults.overallQualification,
                      ),
                      {
                        size: 24,
                        color: getQualificationColor(
                          analysisResults.overallQualification,
                        ),
                      },
                    )}
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.qualificationText,
                        {
                          color: getQualificationColor(
                            analysisResults.overallQualification,
                          ),
                        },
                      ]}
                    >
                      {t('preScreening.conclusion.probablyQualifies')}
                    </Text>
                  </View>
                  <View style={styles.probabilityContainer}>
                    <Text variant="labelMedium" style={styles.probabilityLabel}>
                      {t(
                        'preScreening.messages.estimatedQualificationProbability',
                      )}
                    </Text>
                    <Text
                      variant="headlineMedium"
                      style={[
                        styles.probabilityValue,
                        {
                          color: getQualificationColor(
                            analysisResults.overallQualification,
                          ),
                        },
                      ]}
                    >
                      {analysisResults.qualificationProbability}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Main Problems */}
              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <AlertTriangle size={20} color="#F59E0B" />
                  <Text variant="titleLarge" style={styles.resultSectionTitle}>
                    {t('preScreening.messages.mainProblems')}
                  </Text>
                </View>
                <View style={styles.problemsList}>
                  {analysisResults.mainProblems.map(
                    (problem: string, index: number) => (
                      <View key={index} style={styles.problemItem}>
                        <View style={styles.problemBullet} />
                        <Text variant="bodyMedium" style={styles.problemText}>
                          {problem}
                        </Text>
                      </View>
                    ),
                  )}
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
                  {analysisResults.criticalInfo.map(
                    (info: string, index: number) => (
                      <View key={index} style={styles.criticalInfoItem}>
                        <CheckCircle size={16} color={colors.lightGreen} />
                        <Text
                          variant="bodyMedium"
                          style={styles.criticalInfoText}
                        >
                          {info}
                        </Text>
                      </View>
                    ),
                  )}
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
                  <Text
                    variant="labelMedium"
                    style={styles.newAnalysisButtonText}
                  >
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
          ) : null}
        </ScrollView>
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
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  backButton: {
    borderRadius: 8,
    marginRight: wp(2),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
    alignSelf: 'flex-start',
    marginTop: hp(0.75),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.lightGreen,
  },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  headerActions: {
    marginTop: hp(1),
    alignSelf: 'flex-end',
    marginRight: wp(4),
    alignItems: 'center',
  },
  savedAnalysisButton: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  savedAnalysisButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: hp(4),
  },
  savedAnalysisButtonText: {
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
  },
  medicalHistoryActions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  uploadTxtButton: {
    borderRadius: 8,
    overflow: 'hidden',
    height: hp(4),
  },
  uploadTxtButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  uploadTxtButtonText: {
    color: 'white',
  },
  patientHistoryButton: {
    borderRadius: 8,
    overflow: 'hidden',
    height: hp(4),
  },
  patientHistoryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  patientHistoryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  protocolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(4),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B3E5FC',
    backgroundColor: '#E1F5FE',
    marginTop: hp(1),
  },
  protocolCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: wp(3),
  },
  protocolCardText: {
    flex: 1,
  },
  protocolCardTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  protocolCardDescription: {
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  dataSourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: hp(1),
  },
  dataSourceText: {
    color: colors.onSurfaceVariant,
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
  // Start Analysis Button
  startAnalysisContainer: {
    alignItems: 'center',
  },
  startAnalysisButton: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    height: hp(5),
  },
  startAnalysisButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  startAnalysisButtonDisabled: {
    // opacity: 0.6,
  },
  startAnalysisButtonText: {
    color: 'white',
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
