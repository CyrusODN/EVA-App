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
import LinearGradient from 'react-native-linear-gradient';
import {
  ChevronLeft,
  FileText,
  Plus,
  Settings,
  Copy,
  Download,
  X,
  Save,
  Filter,
  History,
  Upload,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/textStyles';
import Header from '../../components/header';
import EmptyState from '../../components/emptyState';
import { LinearGradientColors } from '../../constants/linearGradientColors';
import PrimaryButton from '../../components/primaryButton';

interface Observation {
  id: string;
  content: string;
  timestamp: string;
}

const Discharge = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [observations, setObservations] = useState<Observation[]>([]);
  const [currentObservation, setCurrentObservation] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const addObservation = () => {
    if (currentObservation.trim()) {
      const newObservation = {
        id: Date.now().toString(),
        content: currentObservation,
        timestamp: new Date().toISOString(),
      };
      setObservations([...observations, newObservation]);
      setCurrentObservation('');
    }
  };

  const removeObservation = (id: string) => {
    setObservations(observations.filter(obs => obs.id !== id));
  };

  const generateSummary = () => {
    if (observations.length === 0) {
      Alert.alert(
        t('dischargeAssistant.errors.noObservations'),
        t('dischargeAssistant.summaryPanel.noSummarySubtitle'),
      );
      return;
    }

    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedSummary(`
**Patient Information**
Age: 45 years
Primary Diagnosis: Hypertension

**Admission Reason**
Patient presented with elevated blood pressure readings

**Course of Hospitalization**
Patient responded well to antihypertensive medication
Vital signs stabilized within 48 hours

**Discharge Status**
Stable condition, ready for outpatient management

**Follow-up Plan**
1. Continue prescribed medications
2. Follow up with primary care physician in 1 week
3. Monitor blood pressure daily
      `);
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    // Implementation would use Clipboard API
    Alert.alert(t('success.copied'));
  };

  const exportSummary = () => {
    // Implementation would handle PDF export
    Alert.alert('Export', 'Summary exported successfully');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <Header
          title={t('dischargeAssistant.headerTitle')}
          subtitle={t('dischargeAssistant.headerSubtitle')}
          onLeftPress={handleBackPress}
          icon={FileText}
          showIcon={true}
          backgroundColor={colors.surface}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Observations Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={textStyles.sectionTitle}>
                {t('dischargeAssistant.observationsPanel.title')}
              </Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity
                  style={styles.actionButtonWithText}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <LinearGradient
                    colors={LinearGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      height: '100%',
                    }}
                  >
                    <View style={{ width: wp(1) }} />
                    <Filter size={16} color={'white'} />
                    <Text variant="bodySmall" style={styles.actionButtonText}>
                      Filters
                    </Text>
                    <View style={{ width: wp(1) }} />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButtonWithText}
                  onPress={() => setShowHistory(!showHistory)}
                >
                  <LinearGradient
                    colors={LinearGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      height: '100%',
                    }}
                  >
                    <View style={{ width: wp(1) }} />
                    <History size={16} color={'white'} />
                    <Text variant="bodySmall" style={styles.actionButtonText}>
                      History
                    </Text>
                    <View style={{ width: wp(1) }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add category (press Enter to add)"
                placeholderTextColor="rgba(74, 69, 78, 0.5)"
                value={category}
                onChangeText={setCategory}
                onSubmitEditing={() => {
                  // Handle category addition
                  setCategory('');
                }}
              />
            </View>

            {/* Tags Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add tags (press Enter to add)"
                placeholderTextColor="rgba(74, 69, 78, 0.5)"
                value={tags}
                onChangeText={setTags}
                onSubmitEditing={() => {
                  // Handle tag addition
                  setTags('');
                }}
              />
            </View>

            {/* Observation Notes Text Area */}
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Add your observation notes here..."
                placeholderTextColor="rgba(74, 69, 78, 0.5)"
                value={currentObservation}
                onChangeText={setCurrentObservation}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Add Observation Button */}
            <TouchableOpacity
              style={[
                styles.addButton,
                { opacity: currentObservation.trim() ? 1 : 0.5 },
              ]}
              onPress={addObservation}
              disabled={!currentObservation.trim()}
            >
              <PrimaryButton
                iconComponent={Plus}
                text={t(
                  'dischargeAssistant.observationsPanel.addObservationButtonText',
                )}
                onPress={addObservation}
                disabled={!currentObservation.trim()}
              />
            </TouchableOpacity>

            {/* Document Upload Section */}
            <View style={styles.documentUploadContainer}>
              <TouchableOpacity
                style={styles.documentUploadArea}
                onPress={() => {
                  // Handle document upload
                  Alert.alert('Upload', 'Document upload functionality');
                }}
              >
                <Upload size={48} color={colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.documentUploadText}>
                  Drop documents here or click to select
                </Text>
                <Text variant="bodySmall" style={styles.documentUploadSubtext}>
                  Supports: PDF, TXT, DOC, DOCX (max 10MB)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Observations List */}
            <View style={styles.observationsList}>
              {observations.length === 0 ? (
                <EmptyState message="No observations added yet. Add one above or upload a document." />
              ) : (
                observations.map(obs => (
                  <View key={obs.id} style={styles.observationItem}>
                    <View style={styles.observationHeader}>
                      <Text
                        variant="bodySmall"
                        style={styles.observationTimestamp}
                      >
                        {formatTimestamp(obs.timestamp)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeObservation(obs.id)}
                        style={styles.removeButton}
                      >
                        <X size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={styles.observationContent}
                    >
                      {obs.content}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Summary Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={textStyles.sectionTitle}>
                {t('dischargeAssistant.summaryPanel.title')}
              </Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Settings size={16} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>

            {generatedSummary ? (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryActions}>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={copyToClipboard}
                  >
                    <LinearGradient
                      colors={LinearGradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.summaryActionButtonGradient}
                    >
                      <Copy size={16} color="white" />
                      <Text
                        variant="labelMedium"
                        style={styles.summaryActionTextWhite}
                      >
                        {t('dischargeAssistant.summaryPanel.copyButtonText')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={exportSummary}
                  >
                    <LinearGradient
                      colors={LinearGradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.summaryActionButtonGradient}
                    >
                      <Download size={16} color="white" />
                      <Text
                        variant="labelMedium"
                        style={styles.summaryActionTextWhite}
                      >
                        {t('dischargeAssistant.summaryPanel.exportButtonText')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.summaryContent}>
                  <Text variant="bodyMedium" style={styles.summaryText}>
                    {generatedSummary}
                  </Text>
                </ScrollView>
              </View>
            ) : (
              <View style={styles.noSummaryContainer}>
                <FileText size={48} color={colors.surfaceDisabled} />
                <Text variant="bodyMedium" style={styles.noSummaryText}>
                  {t('dischargeAssistant.summaryPanel.noSummaryPlaceholder')}
                </Text>
                <Text variant="bodySmall" style={styles.noSummarySubtext}>
                  {t('dischargeAssistant.summaryPanel.noSummarySubtitle')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Generate/Update Button */}
        {observations.length > 0 && (
          <View style={styles.generateButtonContainer}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                { opacity: isGenerating ? 0.7 : 1 },
              ]}
              onPress={generateSummary}
              disabled={isGenerating}
            >
              <LinearGradient
                colors={LinearGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateButtonGradient}
              >
                {isGenerating ? (
                  <>
                    <View style={styles.loadingSpinner} />
                    <Text
                      variant="labelMedium"
                      style={styles.generateButtonText}
                    >
                      {t(
                        'dischargeAssistant.summaryPanel.generatingButtonText',
                      )}
                    </Text>
                  </>
                ) : (
                  <>
                    <Save size={16} color="white" />
                    <Text
                      variant="labelMedium"
                      style={styles.generateButtonText}
                    >
                      {t('dischargeAssistant.summaryPanel.generateButtonText')}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Discharge;

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
    borderBottomColor: colors.outlineVariant,
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: wp(5),
    marginVertical: hp(1),
    borderRadius: 12,
    padding: wp(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.surfaceVariant,
  },
  actionButtonWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    height: hp(3.5),
    gap: 6,
    overflow: 'hidden',
  },
  actionButtonText: {
    color: 'white',
    fontSize: hp(1.6),
  },
  inputContainer: {
    marginBottom: hp(1.5),
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: wp(3),
    backgroundColor: 'white',
    fontSize: hp(1.7),
    color: colors.onSurface,
    fontFamily: 'SFProDisplay-Regular',
  },
  textAreaContainer: {
    marginBottom: hp(2),
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: wp(3),
    backgroundColor: 'white',
    fontSize: hp(1.7),
    color: colors.onSurface,
    minHeight: hp(12),
    fontFamily: 'SFProDisplay-Regular',
  },
  addButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(6),
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  documentUploadContainer: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  documentUploadArea: {
    borderWidth: 2,
    borderColor: colors.onSecondary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: hp(4),
    paddingHorizontal: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  documentUploadText: {
    color: colors.onSurface,
    marginTop: hp(2),
    marginBottom: hp(0.5),
    textAlign: 'center',
  },
  documentUploadSubtext: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  observationsList: {
    gap: hp(1),
  },
  observationItem: {
    backgroundColor: colors.surfaceVariant,
    padding: wp(3),
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.lightGreen,
  },
  observationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  observationTimestamp: {
    color: colors.onSurfaceVariant,
  },
  removeButton: {
    padding: 4,
  },
  observationContent: {
    color: colors.onSurface,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(5),
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    marginTop: hp(2),
    textAlign: 'center',
  },
  summaryContainer: {
    gap: hp(2),
  },
  summaryActions: {
    flexDirection: 'row',
    gap: wp(3),
  },
  summaryActionButton: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  summaryActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  summaryActionText: {
    color: colors.lightGreen,
  },
  summaryActionTextWhite: {
    color: 'white',
  },
  summaryContent: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: wp(3),
    maxHeight: hp(30),
  },
  summaryText: {
    color: colors.onSurface,
    lineHeight: 20,
  },
  noSummaryContainer: {
    alignItems: 'center',
    paddingVertical: hp(5),
  },
  noSummaryText: {
    color: colors.onSurfaceVariant,
    marginTop: hp(2),
    textAlign: 'center',
  },
  noSummarySubtext: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  generateButtonContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  generateButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: 'white',
    borderRadius: 8,
  },
});
