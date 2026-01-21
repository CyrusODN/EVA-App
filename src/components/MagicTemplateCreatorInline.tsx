import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { 
  FadeIn, 
  FadeInDown, 
} from 'react-native-reanimated';
import { Settings, Mic, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import VoiceInputButton from './VoiceInputButton';
import SimulationCard from './SimulationCard';
import {
  ONBOARDING_COLORS,
  ONBOARDING_SPACING,
  ONBOARDING_TYPOGRAPHY,
  ONBOARDING_SHADOWS,
  ONBOARDING_RADIUS,
  DURATIONS,
} from '../constants/onboardingTheme';
import { DUMMY_PATIENTS } from '../constants/dummyPatients';
import {
  refineTemplateInstructions,
  generateSimulatedNote,
} from '../services/templateRefinement';
import useOnboardingStore from '../store/onboarding';

interface MagicTemplateCreatorInlineProps {
  onSave: (template: {
    title: string;
    content: string;
    refinedPrompt: string;
  }) => void;
  onCancel: () => void;
}

type CreatorStep = 'input' | 'processing' | 'preview';

const MagicTemplateCreatorInline: React.FC<MagicTemplateCreatorInlineProps> = ({
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { defaultSpecialization } = useOnboardingStore();
  
  const [step, setStep] = useState<CreatorStep>('input');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [previewTab, setPreviewTab] = useState<'note' | 'prompt'>('note');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [templateTitle, setTemplateTitleInput] = useState('');
  
  // Results from AI processing
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [humanSummary, setHumanSummary] = useState('');
  const [sampleNote, setSampleNote] = useState('');
  const [patientName, setPatientName] = useState('');

  const handleVoicePress = () => {
    // Mock voice input - in production, this would use Whisper API
    if (isRecording) {
      setIsRecording(false);
      // Simulate transcription result
      setTextInput(prev => prev || 'Krótkie notatki skupione na lekach, bez historii rodzinnej');
    } else {
      setIsRecording(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Auto-stop after 5 seconds (mock)
      setTimeout(() => setIsRecording(false), 5000);
    }
  };

  const handleCreateTemplate = async () => {
    if (!textInput.trim()) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setStep('processing');
    
    try {
      // Step 1: Refine instructions
      setProcessingStatus(t('magicCreator.processing.analyzing'));
      const refinementResult = await refineTemplateInstructions(textInput);
      
      if (!refinementResult.success) {
        throw new Error('Refinement failed');
      }
      
      setRefinedPrompt(refinementResult.refinedPrompt);
      setHumanSummary(refinementResult.humanSummary);
      setEditedPrompt(refinementResult.refinedPrompt);
      
      // Auto-generate title from AI summary
      const autoTitle = refinementResult.humanSummary.split('.')[0].slice(0, 60);
      setTemplateTitleInput(autoTitle);
      
      // Step 2: Generate sample note
      setProcessingStatus(t('magicCreator.processing.generating'));
      const specialization = defaultSpecialization || 'Psychiatry';
      const patient = DUMMY_PATIENTS[specialization] || DUMMY_PATIENTS['Psychiatry'];
      
      const simulationResult = await generateSimulatedNote(
        refinementResult.refinedPrompt,
        patient
      );
      
      if (!simulationResult.success) {
        throw new Error('Simulation failed');
      }
      
      setSampleNote(simulationResult.note);
      setPatientName(patient.name);
      
      // Move to preview
      setStep('preview');
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Magic template creation error:', error);
      setProcessingStatus(t('magicCreator.processing.error'));
      setTimeout(() => setStep('input'), 2000);
    }
  };

  const handleStartOver = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStep('input');
    setTextInput('');
    setRefinedPrompt('');
    setHumanSummary('');
    setSampleNote('');
    setEditedPrompt('');
    setTemplateTitleInput('');
  };

  const handleSaveTemplate = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    onSave({
      title: templateTitle || humanSummary.split('.')[0].slice(0, 60),
      content: humanSummary,
      refinedPrompt,
    });
  };

  const handleRegenerateWithEdits = async () => {
    if (!editedPrompt.trim()) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setStep('processing');
    setProcessingStatus(t('magicCreator.processing.regenerating'));
    
    try {
      const specialization = defaultSpecialization || 'Psychiatry';
      const patient = DUMMY_PATIENTS[specialization] || DUMMY_PATIENTS['Psychiatry'];
      
      const simulationResult = await generateSimulatedNote(editedPrompt, patient);
      
      if (simulationResult.success) {
        setRefinedPrompt(editedPrompt);
        setSampleNote(simulationResult.note);
        setStep('preview');
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      setStep('preview');
    }
  };

  // --- RENDER: Input Step ---
  const renderInputStep = () => (
    <Animated.View entering={FadeIn} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>{t('magicCreator.input.title')}</Text>
          <Text style={styles.subtitle}>{t('magicCreator.input.subtitle')}</Text>
          
          <View style={styles.voiceSection}>
            <VoiceInputButton
              isRecording={isRecording}
              onPress={handleVoicePress}
            />
            <Text style={styles.voiceHint}>{t('magicCreator.input.voiceHint')}</Text>
          </View>
          
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TextInput
            style={styles.textInput}
            placeholder={t('magicCreator.input.placeholder')}
            placeholderTextColor={ONBOARDING_COLORS.textTertiary}
            value={textInput}
            onChangeText={setTextInput}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.buttonHalf]}
              onPress={onCancel}
            >
              <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.buttonHalf,
                !textInput.trim() && styles.buttonDisabled,
              ]}
              onPress={handleCreateTemplate}
              disabled={!textInput.trim()}
            >
              <Text style={[
                styles.primaryButtonText,
                !textInput.trim() && styles.buttonDisabledText,
              ]}>
                {t('magicCreator.input.createButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );

  // --- RENDER: Processing Step ---
  const renderProcessingStep = () => (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={ONBOARDING_COLORS.primary} />
        <Text style={styles.processingText}>{processingStatus}</Text>
      </View>
    </Animated.View>
  );

  // --- RENDER: Preview Step ---
  const renderPreviewStep = () => (
    <Animated.View entering={FadeInDown} style={styles.container}>
      <ScrollView contentContainerStyle={styles.previewScrollContent}>
        <View style={styles.previewContainer}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, previewTab === 'note' && styles.tabButtonActive]}
              onPress={() => setPreviewTab('note')}
            >
              <Text style={[styles.tabText, previewTab === 'note' && styles.tabTextActive]}>
                {t('magicCreator.preview.noteTab')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabButton, previewTab === 'prompt' && styles.tabButtonActive]}
              onPress={() => setPreviewTab('prompt')}
            >
              <Settings size={16} color={previewTab === 'prompt' ? ONBOARDING_COLORS.primary : ONBOARDING_COLORS.textSecondary} />
              <Text style={[styles.tabText, previewTab === 'prompt' && styles.tabTextActive]}>
                {t('magicCreator.preview.promptTab')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {previewTab === 'note' ? (
            <View style={styles.tabContent}>
              <Text style={styles.summaryLabel}>{t('magicCreator.preview.summaryLabel')}</Text>
              <Text style={styles.summaryText}>{humanSummary}</Text>
              
              <SimulationCard
                note={sampleNote}
                patientName={patientName}
              />
              
              {/* Editable Title */}
              <View style={styles.titleEditContainer}>
                <Text style={styles.titleEditLabel}>{t('magicCreator.preview.titleLabel')}</Text>
                <TextInput
                  style={styles.titleEditInput}
                  value={templateTitle}
                  onChangeText={setTemplateTitleInput}
                  placeholder={t('templates.titlePlaceholder')}
                  placeholderTextColor={ONBOARDING_COLORS.textTertiary}
                />
              </View>
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Text style={styles.promptEditLabel}>
                {t('magicCreator.preview.promptEditLabel')}
              </Text>
              <TextInput
                style={styles.promptEditInput}
                value={editedPrompt}
                onChangeText={setEditedPrompt}
                multiline
                numberOfLines={15}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleRegenerateWithEdits}
              >
                <Text style={styles.regenerateButtonText}>
                  {t('magicCreator.preview.regenerateButton')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.compactButton, styles.buttonOutline]}
              onPress={handleStartOver}
            >
              <RotateCcw size={16} color={ONBOARDING_COLORS.textSecondary} />
              <Text style={styles.compactButtonTextOutline}>
                {t('magicCreator.preview.startOverButton')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.compactButton, styles.buttonPrimary]}
              onPress={handleSaveTemplate}
            >
              <Text style={styles.compactButtonTextPrimary}>
                {t('magicCreator.preview.saveButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      {step === 'input' && renderInputStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'preview' && renderPreviewStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    padding: ONBOARDING_SPACING.xl,
  },
  title: {
    ...ONBOARDING_TYPOGRAPHY.h2,
    color: ONBOARDING_COLORS.text,
    textAlign: 'center',
    marginBottom: ONBOARDING_SPACING.sm,
  },
  subtitle: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: ONBOARDING_SPACING.xl,
  },
  voiceSection: {
    alignItems: 'center',
    marginVertical: ONBOARDING_SPACING.xl,
  },
  voiceHint: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textTertiary,
    marginTop: ONBOARDING_SPACING.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: ONBOARDING_SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ONBOARDING_COLORS.borderLight,
  },
  dividerText: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textTertiary,
    marginHorizontal: ONBOARDING_SPACING.md,
  },
  textInput: {
    ...ONBOARDING_TYPOGRAPHY.body,
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.lg,
    padding: ONBOARDING_SPACING.lg,
    minHeight: 120,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
    marginBottom: ONBOARDING_SPACING.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: ONBOARDING_SPACING.md,
  },
  buttonHalf: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    paddingVertical: ONBOARDING_SPACING.lg,
    borderRadius: ONBOARDING_RADIUS.lg,
    alignItems: 'center',
    ...ONBOARDING_SHADOWS.sm,
  },
  primaryButtonText: {
    ...ONBOARDING_TYPOGRAPHY.buttonLarge,
    color: ONBOARDING_COLORS.surface,
  },
  secondaryButton: {
    backgroundColor: ONBOARDING_COLORS.surface,
    paddingVertical: ONBOARDING_SPACING.lg,
    borderRadius: ONBOARDING_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
  },
  secondaryButtonText: {
    ...ONBOARDING_TYPOGRAPHY.buttonLarge,
    color: ONBOARDING_COLORS.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonDisabledText: {
    opacity: 0.6,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ONBOARDING_SPACING.xl,
  },
  processingText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    marginTop: ONBOARDING_SPACING.lg,
  },
  previewScrollContent: {
    padding: ONBOARDING_SPACING.lg,
  },
  previewContainer: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.lg,
    padding: 4,
    marginBottom: ONBOARDING_SPACING.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ONBOARDING_SPACING.sm,
    borderRadius: ONBOARDING_RADIUS.md,
    gap: ONBOARDING_SPACING.xs,
  },
  tabButtonActive: {
    backgroundColor: ONBOARDING_COLORS.primary,
  },
  tabText: {
    ...ONBOARDING_TYPOGRAPHY.button,
    color: ONBOARDING_COLORS.textSecondary,
  },
  tabTextActive: {
    color: ONBOARDING_COLORS.surface,
  },
  tabContent: {
    flex: 1,
  },
  summaryLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textTertiary,
    marginBottom: ONBOARDING_SPACING.xs,
  },
  summaryText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.text,
    marginBottom: ONBOARDING_SPACING.lg,
  },
  titleEditContainer: {
    marginTop: ONBOARDING_SPACING.lg,
  },
  titleEditLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textTertiary,
    marginBottom: ONBOARDING_SPACING.xs,
  },
  titleEditInput: {
    ...ONBOARDING_TYPOGRAPHY.body,
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.lg,
    padding: ONBOARDING_SPACING.md,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
  },
  promptEditLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textTertiary,
    marginBottom: ONBOARDING_SPACING.sm,
  },
  promptEditInput: {
    ...ONBOARDING_TYPOGRAPHY.body,
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.lg,
    padding: ONBOARDING_SPACING.md,
    minHeight: 300,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
    marginBottom: ONBOARDING_SPACING.md,
  },
  regenerateButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    paddingVertical: ONBOARDING_SPACING.md,
    borderRadius: ONBOARDING_RADIUS.lg,
    alignItems: 'center',
  },
  regenerateButtonText: {
    ...ONBOARDING_TYPOGRAPHY.button,
    color: ONBOARDING_COLORS.surface,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: ONBOARDING_SPACING.md,
    marginTop: ONBOARDING_SPACING.lg,
  },
  compactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ONBOARDING_SPACING.md,
    borderRadius: ONBOARDING_RADIUS.lg,
    gap: ONBOARDING_SPACING.xs,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
    backgroundColor: ONBOARDING_COLORS.surface,
  },
  buttonPrimary: {
    backgroundColor: ONBOARDING_COLORS.primary,
  },
  compactButtonTextOutline: {
    ...ONBOARDING_TYPOGRAPHY.button,
    color: ONBOARDING_COLORS.textSecondary,
  },
  compactButtonTextPrimary: {
    ...ONBOARDING_TYPOGRAPHY.button,
    color: ONBOARDING_COLORS.surface,
  },
});

export default MagicTemplateCreatorInline;
