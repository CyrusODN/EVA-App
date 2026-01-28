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
  Modal,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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

interface MagicTemplateCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSaveTemplate: (template: {
    name: string;
    instructions: string;
    refinedPrompt: string;
  }) => void;
}

type CreatorStep = 'input' | 'processing' | 'preview' | 'refining';

const MagicTemplateCreator: React.FC<MagicTemplateCreatorProps> = ({
  visible,
  onClose,
  onSaveTemplate,
}) => {
  const { t } = useTranslation();
  const { defaultSpecialization } = useOnboardingStore();

  const [step, setStep] = useState<CreatorStep>('input');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [refinementInput, setRefinementInput] = useState('');
  const [isRecordingRefinement, setIsRecordingRefinement] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [previewTab, setPreviewTab] = useState<'note' | 'prompt'>('note');
  const [editedPrompt, setEditedPrompt] = useState('');
  const [showCurrentPrompt, setShowCurrentPrompt] = useState(false);
  const translateX = useSharedValue(0);

  // Results from AI processing
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [humanSummary, setHumanSummary] = useState('');
  const [sampleNote, setSampleNote] = useState('');
  const [patientName, setPatientName] = useState('');

  const resetState = useCallback(() => {
    setStep('input');
    setIsRecording(false);
    setTextInput('');
    setRefinementInput('');
    setIsRecordingRefinement(false);
    setProcessingStatus('');
    setRefinedPrompt('');
    setHumanSummary('');
    setSampleNote('');
    setPatientName('');
    setPreviewTab('note');
    setEditedPrompt('');
    setShowCurrentPrompt(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleVoicePress = () => {
    // Mock voice input - in production, this would use Whisper API
    if (isRecording) {
      setIsRecording(false);
      // Simulate transcription result
      setTextInput(
        (prev) =>
          prev || 'Krótkie notatki skupione na lekach, bez historii rodzinnej',
      );
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

      // Step 2: Generate sample note
      setProcessingStatus(t('magicCreator.processing.generating'));
      const specialization = defaultSpecialization || 'Psychiatry';
      const patient =
        DUMMY_PATIENTS[specialization] || DUMMY_PATIENTS['Psychiatry'];

      const simulationResult = await generateSimulatedNote(
        refinementResult.refinedPrompt,
        patient,
      );

      if (!simulationResult.success) {
        throw new Error('Simulation failed');
      }

      setSampleNote(simulationResult.sampleNote);
      setPatientName(simulationResult.patientName);

      // Move to preview
      setStep('preview');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Template creation error:', error);
      setStep('input');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleRefine = () => {
    // Open refinement mode - user can speak additional feedback
    setStep('refining');
    setRefinementInput('');
  };

  const handleStartOver = () => {
    // Completely restart from scratch
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetState();
  };

  const handleVoiceRefinementPress = () => {
    // Mock voice input for refinement
    if (isRecordingRefinement) {
      setIsRecordingRefinement(false);
      // Simulate transcription result
      setRefinementInput((prev) => prev || 'Dodaj więcej szczegółów o lekach');
    } else {
      setIsRecordingRefinement(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Auto-stop after 5 seconds (mock)
      setTimeout(() => setIsRecordingRefinement(false), 5000);
    }
  };

  const handleApplyRefinement = async () => {
    if (!refinementInput.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setStep('processing');

    try {
      // Apply refinement to existing template
      setProcessingStatus(
        t('magicCreator.processing.refining') || 'Dostosuję szablon...',
      );

      // Combine original prompt with refinement feedback
      const refinementResult = await refineTemplateInstructions(
        textInput + '\n\nDodatkowe uwagi: ' + refinementInput,
      );

      if (!refinementResult.success) {
        throw new Error('Refinement failed');
      }

      setRefinedPrompt(refinementResult.refinedPrompt);
      setHumanSummary(refinementResult.humanSummary);

      // Generate new sample note with refinements
      setProcessingStatus(t('magicCreator.processing.generating'));
      const specialization = defaultSpecialization || 'Psychiatry';
      const patient =
        DUMMY_PATIENTS[specialization] || DUMMY_PATIENTS['Psychiatry'];

      const simulationResult = await generateSimulatedNote(
        refinementResult.refinedPrompt,
        patient,
      );

      if (!simulationResult.success) {
        throw new Error('Simulation failed');
      }

      setSampleNote(simulationResult.sampleNote);
      setPatientName(simulationResult.patientName);

      // Move back to preview
      setStep('preview');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Refinement error:', error);
      setStep('preview');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleSaveTemplate = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Use edited prompt if user modified it, otherwise use original refined prompt
    const finalPrompt = editedPrompt.trim() || refinedPrompt;

    onSaveTemplate({
      name: `Magic Template - ${new Date().toLocaleDateString()}`,
      instructions: textInput,
      refinedPrompt: finalPrompt,
    });

    handleClose();
  };

  const handleApplyManualEdit = async () => {
    if (!editedPrompt.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setStep('processing');

    try {
      // Generate new sample note with manually edited prompt
      setProcessingStatus(t('magicCreator.processing.generating'));
      const specialization = defaultSpecialization || 'Psychiatry';
      const patient =
        DUMMY_PATIENTS[specialization] || DUMMY_PATIENTS['Psychiatry'];

      const simulationResult = await generateSimulatedNote(
        editedPrompt,
        patient,
      );

      if (!simulationResult.success) {
        throw new Error('Simulation failed');
      }

      setSampleNote(simulationResult.sampleNote);
      setPatientName(simulationResult.patientName);
      setRefinedPrompt(editedPrompt); // Update refined prompt with edited version

      // Move back to preview, note tab
      setStep('preview');
      setPreviewTab('note');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Manual edit application error:', error);
      setStep('preview');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Swipe gesture for tab switching
  const switchToTab = (tab: 'note' | 'prompt') => {
    setPreviewTab(tab);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    if (tab === 'prompt' && !editedPrompt) {
      setEditedPrompt(refinedPrompt);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = 50;
      if (e.translationX > threshold && previewTab === 'prompt') {
        // Swipe right - go to note tab
        runOnJS(switchToTab)('note');
      } else if (e.translationX < -threshold && previewTab === 'note') {
        // Swipe left - go to prompt tab
        runOnJS(switchToTab)('prompt');
      }
      translateX.value = withTiming(0, { duration: 200 });
    });

  const renderInputStep = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.inputContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {/* Title */}
      <Animated.Text
        entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
        style={styles.stepTitle}>
        {t('magicCreator.voicePrompt')}
      </Animated.Text>

      {/* Voice Input Button */}
      <Animated.View
        entering={FadeIn.delay(200).duration(DURATIONS.normal)}
        style={styles.voiceContainer}>
        <VoiceInputButton
          isRecording={isRecording}
          onPress={handleVoicePress}
        />
      </Animated.View>

      {/* Or divider */}
      <Animated.View
        entering={FadeIn.delay(300).duration(DURATIONS.normal)}
        style={styles.orDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>{t('common.or') || 'lub'}</Text>
        <View style={styles.dividerLine} />
      </Animated.View>

      {/* Text Input */}
      <Animated.View
        entering={FadeInDown.delay(350).duration(DURATIONS.normal)}
        style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={t('magicCreator.textPlaceholder')}
          placeholderTextColor={ONBOARDING_COLORS.textTertiary}
          value={textInput}
          onChangeText={setTextInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Animated.View>

      {/* Create Button */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(DURATIONS.normal)}
        style={styles.createButtonContainer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            !textInput.trim() && styles.createButtonDisabled,
          ]}
          onPress={handleCreateTemplate}
          disabled={!textInput.trim()}
          activeOpacity={0.9}>
          <Text
            style={[
              styles.createButtonText,
              !textInput.trim() && styles.createButtonTextDisabled,
            ]}>
            {t('magicCreator.createButton')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContent}>
      <Animated.View
        entering={FadeIn.duration(DURATIONS.normal)}
        style={styles.processingSpinner}>
        <ActivityIndicator size="large" color={ONBOARDING_COLORS.primary} />
      </Animated.View>
      <Animated.Text
        entering={FadeIn.delay(100).duration(DURATIONS.normal)}
        style={styles.processingTitle}>
        {t('magicCreator.processing.title')}
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.delay(200).duration(DURATIONS.normal)}
        style={styles.processingStatus}>
        {processingStatus}
      </Animated.Text>
    </View>
  );

  const renderRefiningStep = () => (
    <View style={styles.refiningContainer}>
      {/* Header - Always visible */}
      <View style={styles.refiningHeader}>
        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
          style={styles.stepTitle}>
          {t('magicCreator.refine.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(150).duration(DURATIONS.normal)}
          style={styles.refineSubtitle}>
          {t('magicCreator.refine.subtitle')}
        </Animated.Text>

        {/* Voice Input Button */}
        <Animated.View
          entering={FadeIn.delay(200).duration(DURATIONS.normal)}
          style={styles.voiceContainer}>
          <VoiceInputButton
            isRecording={isRecordingRefinement}
            onPress={handleVoiceRefinementPress}
          />
        </Animated.View>

        {/* Or divider */}
        <Animated.View
          entering={FadeIn.delay(250).duration(DURATIONS.normal)}
          style={styles.orDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>{t('common.or') || 'lub'}</Text>
          <View style={styles.dividerLine} />
        </Animated.View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.refiningScroll}
        contentContainerStyle={styles.refiningContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Text Input */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(DURATIONS.normal)}
          style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={t('magicCreator.refine.placeholder')}
            placeholderTextColor={ONBOARDING_COLORS.textTertiary}
            value={refinementInput}
            onChangeText={setRefinementInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Collapsible Current Prompt Preview - For Advanced Users */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(DURATIONS.normal)}
          style={styles.collapsiblePromptContainer}>
          <TouchableOpacity
            style={styles.collapsiblePromptHeader}
            onPress={() => {
              setShowCurrentPrompt(!showCurrentPrompt);
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
              }
            }}
            activeOpacity={0.7}>
            <View style={styles.collapsiblePromptHeaderLeft}>
              <Text style={styles.collapsiblePromptTitle}>
                {t('magicCreator.refine.viewTechnicalPrompt')}
              </Text>
            </View>
            <Text style={styles.collapsiblePromptArrow}>
              {showCurrentPrompt ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {showCurrentPrompt && (
            <View style={styles.collapsiblePromptContent}>
              <ScrollView
                style={styles.currentPromptScroll}
                contentContainerStyle={styles.currentPromptContentInner}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled>
                <Text style={styles.currentPromptText}>
                  {refinedPrompt || humanSummary}
                </Text>
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Apply Button */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(DURATIONS.normal)}
          style={styles.createButtonContainer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              !refinementInput.trim() && styles.createButtonDisabled,
            ]}
            onPress={handleApplyRefinement}
            disabled={!refinementInput.trim()}
            activeOpacity={0.9}>
            <Text
              style={[
                styles.createButtonText,
                !refinementInput.trim() && styles.createButtonTextDisabled,
              ]}>
              {t('magicCreator.refine.applyButton')}
            </Text>
          </TouchableOpacity>

          {/* Back to preview button */}
          <TouchableOpacity
            style={styles.backToPreviewButton}
            onPress={() => setStep('preview')}
            activeOpacity={0.8}>
            <Text style={styles.backToPreviewText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.previewContainer}>
      {/* Summary Card - Compact */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
        style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {t('magicCreator.preview.understood')}
        </Text>
        <Text style={styles.summaryText} numberOfLines={2}>
          {humanSummary}
        </Text>
      </Animated.View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, previewTab === 'note' && styles.tabActive]}
          onPress={() => {
            setPreviewTab('note');
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          }}>
          <Text
            style={[
              styles.tabText,
              previewTab === 'note' && styles.tabTextActive,
            ]}>
            {t('magicCreator.preview.noteTab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, previewTab === 'prompt' && styles.tabActive]}
          onPress={() => {
            setPreviewTab('prompt');
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
            // Initialize edited prompt if empty
            if (!editedPrompt) {
              setEditedPrompt(refinedPrompt);
            }
          }}>
          <View style={styles.tabWithIcon}>
            <Settings
              size={14}
              color={
                previewTab === 'prompt'
                  ? ONBOARDING_COLORS.pureWhite
                  : ONBOARDING_COLORS.textSecondary
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabText,
                previewTab === 'prompt' && styles.tabTextActive,
              ]}>
              {t('magicCreator.preview.promptTab')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Swipe hint */}
      <Text style={styles.swipeHint}>
        ← {t('magicCreator.preview.swipeHint')} →
      </Text>

      {/* Tab Content - Takes majority of screen */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.tabContentContainer}>
          {previewTab === 'note' ? (
            // Note Preview Tab
            <SimulationCard sampleNote={sampleNote} patientName={patientName} />
          ) : (
            // Prompt Edit Tab
            <View style={styles.promptEditContainer}>
              <Text style={styles.promptEditLabel}>
                {t('magicCreator.preview.promptEditLabel')}
              </Text>
              <ScrollView
                style={styles.promptEditScroll}
                contentContainerStyle={styles.promptEditContent}
                showsVerticalScrollIndicator={true}>
                <TextInput
                  style={styles.promptEditInput}
                  value={editedPrompt}
                  onChangeText={setEditedPrompt}
                  multiline
                  placeholder={t('magicCreator.preview.promptEditPlaceholder')}
                  placeholderTextColor={ONBOARDING_COLORS.textTertiary}
                />
              </ScrollView>

              {/* Apply button for manual edits */}
              <TouchableOpacity
                style={styles.applyEditButton}
                onPress={handleApplyManualEdit}
                activeOpacity={0.9}>
                <Text style={styles.applyEditButtonText}>
                  {t('magicCreator.preview.regenerateWithEdits')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GestureDetector>

      {/* Action Buttons - Compact, 3 buttons */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(DURATIONS.normal)}
        style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButtonSmall}
          onPress={handleRefine}
          activeOpacity={0.8}>
          <Mic
            size={16}
            color={ONBOARDING_COLORS.textSecondary}
            strokeWidth={2.5}
          />
          <Text style={styles.actionButtonTextSmall}>
            {t('magicCreator.preview.refineButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonSmall}
          onPress={handleStartOver}
          activeOpacity={0.8}>
          <RotateCcw
            size={16}
            color={ONBOARDING_COLORS.textSecondary}
            strokeWidth={2.5}
          />
          <Text style={styles.actionButtonTextSmall}>
            {t('magicCreator.preview.startOverButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButtonCompact}
          onPress={handleSaveTemplate}
          activeOpacity={0.9}>
          <Text style={styles.saveButtonTextCompact}>
            {t('magicCreator.preview.saveButton')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('magicCreator.title')}</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            {step === 'input' && renderInputStep()}
            {step === 'processing' && renderProcessingStep()}
            {step === 'preview' && renderPreviewStep()}
            {step === 'refining' && renderRefiningStep()}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingVertical: ONBOARDING_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: ONBOARDING_COLORS.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: ONBOARDING_COLORS.textSecondary,
  },
  headerTitle: {
    ...ONBOARDING_TYPOGRAPHY.title,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  inputContent: {
    padding: ONBOARDING_SPACING.lg,
    alignItems: 'center',
  },
  stepTitle: {
    ...ONBOARDING_TYPOGRAPHY.headline,
    textAlign: 'center',
    marginBottom: ONBOARDING_SPACING.xl,
  },
  voiceContainer: {
    marginBottom: ONBOARDING_SPACING.xl,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: ONBOARDING_SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ONBOARDING_COLORS.border,
  },
  orText: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textTertiary,
    marginHorizontal: ONBOARDING_SPACING.md,
  },
  textInputContainer: {
    width: '100%',
    marginBottom: ONBOARDING_SPACING.xl,
  },
  textInput: {
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.md,
    padding: ONBOARDING_SPACING.md,
    ...ONBOARDING_TYPOGRAPHY.body,
    minHeight: 120,
    color: ONBOARDING_COLORS.textPrimary,
  },
  createButtonContainer: {
    width: '100%',
  },
  createButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    height: 56,
    borderRadius: ONBOARDING_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...ONBOARDING_SHADOWS.glow,
  },
  createButtonDisabled: {
    backgroundColor: ONBOARDING_COLORS.border,
    ...ONBOARDING_SHADOWS.sm,
  },
  createButtonText: {
    ...ONBOARDING_TYPOGRAPHY.title,
    color: ONBOARDING_COLORS.pureWhite,
  },
  createButtonTextDisabled: {
    color: ONBOARDING_COLORS.textTertiary,
  },
  processingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ONBOARDING_SPACING.lg,
  },
  processingSpinner: {
    marginBottom: ONBOARDING_SPACING.lg,
  },
  processingTitle: {
    ...ONBOARDING_TYPOGRAPHY.headline,
    textAlign: 'center',
    marginBottom: ONBOARDING_SPACING.sm,
  },
  processingStatus: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textSecondary,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    padding: ONBOARDING_SPACING.md,
  },
  previewContent: {
    padding: ONBOARDING_SPACING.lg,
  },
  summaryCard: {
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
    borderRadius: ONBOARDING_RADIUS.md,
    padding: ONBOARDING_SPACING.sm,
    marginBottom: ONBOARDING_SPACING.sm,
  },
  summaryLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 11,
    color: ONBOARDING_COLORS.primary,
    marginBottom: 2,
    fontWeight: '600',
  },
  summaryText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    fontSize: 13,
    color: ONBOARDING_COLORS.textPrimary,
    lineHeight: 18,
  },
  simulationContainer: {
    flex: 1,
    marginBottom: ONBOARDING_SPACING.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.md,
    padding: 4,
    marginBottom: ONBOARDING_SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: ONBOARDING_SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ONBOARDING_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: ONBOARDING_COLORS.primary,
  },
  tabText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: '600',
    color: ONBOARDING_COLORS.textSecondary,
  },
  tabTextActive: {
    color: ONBOARDING_COLORS.pureWhite,
  },
  tabWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swipeHint: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 10,
    color: ONBOARDING_COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: ONBOARDING_SPACING.xs,
  },
  tabContentContainer: {
    flex: 1,
    marginBottom: ONBOARDING_SPACING.sm,
  },
  promptEditContainer: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.pureWhite,
    borderRadius: ONBOARDING_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: ONBOARDING_COLORS.primary,
    overflow: 'hidden',
    ...ONBOARDING_SHADOWS.md,
  },
  promptEditLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 11,
    color: ONBOARDING_COLORS.primary,
    fontWeight: '600',
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingTop: ONBOARDING_SPACING.sm,
    paddingBottom: ONBOARDING_SPACING.xs,
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
  },
  promptEditScroll: {
    flex: 1,
  },
  promptEditContent: {
    padding: ONBOARDING_SPACING.md,
  },
  promptEditInput: {
    ...ONBOARDING_TYPOGRAPHY.body,
    fontSize: 14,
    color: ONBOARDING_COLORS.textPrimary,
    lineHeight: 22,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  applyEditButton: {
    backgroundColor: ONBOARDING_COLORS.primary,
    marginHorizontal: ONBOARDING_SPACING.md,
    marginVertical: ONBOARDING_SPACING.sm,
    paddingVertical: ONBOARDING_SPACING.sm,
    borderRadius: ONBOARDING_RADIUS.md,
    alignItems: 'center',
  },
  applyEditButtonText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: '600',
    color: ONBOARDING_COLORS.pureWhite,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: ONBOARDING_SPACING.xs,
    paddingBottom: ONBOARDING_SPACING.xs,
  },
  actionButtonSmall: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: ONBOARDING_RADIUS.md,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.borderLight,
    backgroundColor: ONBOARDING_COLORS.pureWhite,
    paddingHorizontal: ONBOARDING_SPACING.xs,
    gap: 4,
  },
  actionButtonTextSmall: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 11,
    color: ONBOARDING_COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButtonCompact: {
    flex: 1,
    height: 48,
    borderRadius: ONBOARDING_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ONBOARDING_COLORS.primary,
    ...ONBOARDING_SHADOWS.glow,
  },
  saveButtonTextCompact: {
    ...ONBOARDING_TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: '600',
    color: ONBOARDING_COLORS.pureWhite,
  },
  refineSubtitle: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    color: ONBOARDING_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: ONBOARDING_SPACING.sm,
    marginBottom: ONBOARDING_SPACING.lg,
    lineHeight: 18,
  },
  refiningContainer: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  refiningHeader: {
    paddingHorizontal: ONBOARDING_SPACING.lg,
    paddingTop: ONBOARDING_SPACING.lg,
    alignItems: 'center',
    backgroundColor: ONBOARDING_COLORS.background,
  },
  refiningScroll: {
    flex: 1,
  },
  refiningContent: {
    paddingHorizontal: ONBOARDING_SPACING.lg,
    paddingBottom: ONBOARDING_SPACING.xl,
  },
  collapsiblePromptContainer: {
    width: '100%',
    backgroundColor: ONBOARDING_COLORS.surface,
    borderRadius: ONBOARDING_RADIUS.md,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.border,
    marginTop: ONBOARDING_SPACING.md,
    marginBottom: ONBOARDING_SPACING.lg,
    overflow: 'hidden',
  },
  collapsiblePromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingVertical: ONBOARDING_SPACING.sm,
    backgroundColor: ONBOARDING_COLORS.surface,
  },
  collapsiblePromptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsiblePromptTitle: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '500',
    color: ONBOARDING_COLORS.textTertiary,
    fontStyle: 'italic',
  },
  collapsiblePromptArrow: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 10,
    color: ONBOARDING_COLORS.textTertiary,
    marginLeft: ONBOARDING_SPACING.sm,
  },
  collapsiblePromptContent: {
    backgroundColor: ONBOARDING_COLORS.pureWhite,
  },
  currentPromptScroll: {
    maxHeight: 200,
  },
  currentPromptContentInner: {
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingVertical: ONBOARDING_SPACING.sm,
  },
  currentPromptText: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 12,
    color: ONBOARDING_COLORS.textSecondary,
    lineHeight: 18,
  },
  currentPromptContainer: {
    width: '100%',
    backgroundColor: ONBOARDING_COLORS.primarySubtle,
    borderRadius: ONBOARDING_RADIUS.md,
    borderWidth: 1,
    borderColor: ONBOARDING_COLORS.primary,
    marginBottom: ONBOARDING_SPACING.lg,
    overflow: 'hidden',
  },
  currentPromptLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    fontSize: 11,
    color: ONBOARDING_COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingTop: ONBOARDING_SPACING.sm,
    paddingBottom: ONBOARDING_SPACING.xs,
  },
  currentPromptContent: {
    paddingHorizontal: ONBOARDING_SPACING.md,
    paddingBottom: ONBOARDING_SPACING.sm,
  },
  backToPreviewButton: {
    marginTop: ONBOARDING_SPACING.md,
    padding: ONBOARDING_SPACING.sm,
    alignItems: 'center',
  },
  backToPreviewText: {
    ...ONBOARDING_TYPOGRAPHY.body,
    color: ONBOARDING_COLORS.textTertiary,
  },
});

export default MagicTemplateCreator;
