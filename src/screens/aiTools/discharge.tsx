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
  Stethoscope,
  Plus,
  FileText,
  Settings,
  Copy,
  Download,
  X,
  Save,
  Filter,
  History,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

const Discharge = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  const [observations, setObservations] = useState([]);
  const [currentObservation, setCurrentObservation] = useState('');
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

  const removeObservation = (id) => {
    setObservations(observations.filter(obs => obs.id !== id));
  };

  const generateSummary = () => {
    if (observations.length === 0) {
      Alert.alert(
        t('dischargeAssistant.errors.noObservations'),
        t('dischargeAssistant.summaryPanel.noSummarySubtitle')
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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={{backgroundColor:colors.background, flex:1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerIconContainer}>
            <Stethoscope size={20} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text variant="titleMedium" style={styles.headerTitle}>
              {t('dischargeAssistant.headerTitle')}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {t('dischargeAssistant.headerSubtitle')}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Observations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('dischargeAssistant.observationsPanel.title')}
            </Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowHistory(!showHistory)}
              >
                <History size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Observation */}
          <View style={styles.addObservationContainer}>
            <TextInput
              style={styles.observationInput}
              placeholder={t('dischargeAssistant.observationsPanel.observationTextareaPlaceholder')}
              value={currentObservation}
              onChangeText={setCurrentObservation}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                { opacity: currentObservation.trim() ? 1 : 0.5 }
              ]}
              onPress={addObservation}
              disabled={!currentObservation.trim()}
            >
              <Plus size={16} color="white" />
              <Text variant="labelMedium" style={styles.addButtonText}>
                {t('dischargeAssistant.observationsPanel.addObservationButtonText')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Observations List */}
          <View style={styles.observationsList}>
            {observations.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={48} color={colors.surfaceDisabled} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {t('dischargeAssistant.observationsPanel.noObservationsYet')}
                </Text>
              </View>
            ) : (
              observations.map((obs) => (
                <View key={obs.id} style={styles.observationItem}>
                  <View style={styles.observationHeader}>
                    <Text variant="bodySmall" style={styles.observationTimestamp}>
                      {formatTimestamp(obs.timestamp)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeObservation(obs.id)}
                      style={styles.removeButton}
                    >
                      <X size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <Text variant="bodyMedium" style={styles.observationContent}>
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
            <Text variant="titleMedium" style={styles.sectionTitle}>
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
                  <Copy size={16} color={colors.bluish} />
                  <Text variant="labelMedium" style={styles.summaryActionText}>
                    {t('dischargeAssistant.summaryPanel.copyButtonText')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.summaryActionButton}
                  onPress={exportSummary}
                >
                  <Download size={16} color={colors.bluish} />
                  <Text variant="labelMedium" style={styles.summaryActionText}>
                    {t('dischargeAssistant.summaryPanel.exportButtonText')}
                  </Text>
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
              { opacity: isGenerating ? 0.7 : 1 }
            ]}
            onPress={generateSummary}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <View style={styles.loadingSpinner} />
                <Text variant="labelMedium" style={styles.generateButtonText}>
                  {t('dischargeAssistant.summaryPanel.generatingButtonText')}
                </Text>
              </>
            ) : (
              <>
                <Save size={16} color="white" />
                <Text variant="labelMedium" style={styles.generateButtonText}>
                  {t('dischargeAssistant.summaryPanel.generateButtonText')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}</View>
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
    borderBottomColor: colors.outline,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: wp(4),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  headerTextContainer: {
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
  addObservationContainer: {
    marginBottom: hp(2),
  },
  observationInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: wp(3),
    backgroundColor: colors.surface,
    fontSize: 14,
    marginBottom: hp(1),
    minHeight: hp(10),
    fontFamily: 'SFProDisplay-Regular',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceVariant,
    gap: 6,
  },
  summaryActionText: {
    color: colors.lightGreen,
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
    borderTopColor: colors.outline,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
    paddingVertical: hp(2),
    borderRadius: 8,
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