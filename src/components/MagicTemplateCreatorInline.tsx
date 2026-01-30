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
  Alert,
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
import { useTheme } from '../constants/theme';

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
  const { colors: themeColors, isDark } = useTheme();
  
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
  const [templateName, setTemplateName] = useState('');
  const [templateNameError, setTemplateNameError] = useState('');

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
    setTemplateName('');
    setTemplateNameError('');
  }, []);

  const getDefaultTemplateName = useCallback((summary: string) => {
    const candidate = summary.split('.').find(Boolean)?.trim();
    return candidate || `Magic Template - ${new Date().toLocaleDateString()}`;
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
      setTemplateName((prev) => prev || getDefaultTemplateName(refinementResult.humanSummary));
      setEditedPrompt(refinementResult.refinedPrompt);
      
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
      setRefinementInput(prev => prev || 'Dodaj więcej szczegółów o lekach');
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
      setProcessingStatus(t('magicCreator.processing.refining') || 'Dostosuję szablon...');
      
      // Combine original prompt with refinement feedback
      const refinementResult = await refineTemplateInstructions(
        textInput + '\n\nDodatkowe uwagi: ' + refinementInput
      );
      
      if (!refinementResult.success) {
        throw new Error('Refinement failed');
      }
      
      setRefinedPrompt(refinementResult.refinedPrompt);
      setHumanSummary(refinementResult.humanSummary);
      setTemplateName((prev) => prev || getDefaultTemplateName(refinementResult.humanSummary));
      
      // Generate new sample note with refinements
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
    // Use edited prompt if user modified it, otherwise use original refined prompt
    const finalPrompt = editedPrompt.trim() || refinedPrompt;

    if (!templateName.trim()) {
      setTemplateNameError(t('templates.errors.incompleteMessage'));
      Alert.alert(t('templates.errors.incompleteTitle'), t('templates.errors.incompleteMessage'));
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTemplateNameError('');
    
    onSaveTemplate({
      name: templateName.trim(),
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
      const patient = DUMMY_PATIENTS[specialization] || DUMMY_PATIENTS['Psychiatry'];
      
      const simulationResult = await generateSimulatedNote(
        editedPrompt,
        patient
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
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <Animated.Text
        entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
        style={[styles.stepTitle, { color: themeColors.textPrimary }]}
      >
        {t('magicCreator.voicePrompt')}
      </Animated.Text>

      {/* Voice Input Button */}
      <Animated.View
        entering={FadeIn.delay(200).duration(DURATIONS.normal)}
        style={styles.voiceContainer}
      >
        <VoiceInputButton
          isRecording={isRecording}
          onPress={handleVoicePress}
        />
      </Animated.View>

      {/* Or divider */}
      <Animated.View
        entering={FadeIn.delay(300).duration(DURATIONS.normal)}
        style={styles.orDivider}
      >
        <View style={[styles.dividerLine, { backgroundColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.border }]} />
        <Text style={[styles.orText, { color: themeColors.textMuted }]}>{t('common.or') || 'lub'}</Text>
        <View style={[styles.dividerLine, { backgroundColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.border }]} />
      </Animated.View>

      {/* Text Input */}
      <Animated.View
        entering={FadeInDown.delay(350).duration(DURATIONS.normal)}
        style={styles.textInputContainer}
      >
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.surface,
            color: themeColors.textPrimary
          }]}
          placeholder={t('magicCreator.textPlaceholder')}
          placeholderTextColor={themeColors.textMuted}
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
        style={styles.createButtonContainer}
      >
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: themeColors.accentPrimary },
            !textInput.trim() && [styles.createButtonDisabled, { backgroundColor: isDark ? themeColors.borderNormal : ONBOARDING_COLORS.border }],
          ]}
          onPress={handleCreateTemplate}
          disabled={!textInput.trim()}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.createButtonText,
              { color: '#FFF' },
              !textInput.trim() && [styles.createButtonTextDisabled, { color: themeColors.textMuted }],
            ]}
          >
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
        style={styles.processingSpinner}
      >
        <ActivityIndicator
          size="large"
          color={themeColors.accentPrimary}
        />
      </Animated.View>
      <Animated.Text
        entering={FadeIn.delay(100).duration(DURATIONS.normal)}
        style={[styles.processingTitle, { color: themeColors.textPrimary }]}
      >
        {t('magicCreator.processing.title')}
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.delay(200).duration(DURATIONS.normal)}
        style={[styles.processingStatus, { color: themeColors.textSecondary }]}
      >
        {processingStatus}
      </Animated.Text>
    </View>
  );

  const renderRefiningStep = () => (
    <View style={[styles.refiningContainer, { backgroundColor: themeColors.canvas }]}>
      {/* Header - Always visible */}
      <View style={[styles.refiningHeader, { backgroundColor: themeColors.canvas }]}>
        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
          style={[styles.stepTitle, { color: themeColors.textPrimary }]}
        >
          {t('magicCreator.refine.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(150).duration(DURATIONS.normal)}
          style={[styles.refineSubtitle, { color: themeColors.textSecondary }]}
        >
          {t('magicCreator.refine.subtitle')}
        </Animated.Text>

        {/* Voice Input Button */}
        <Animated.View
          entering={FadeIn.delay(200).duration(DURATIONS.normal)}
          style={styles.voiceContainer}
        >
          <VoiceInputButton
            isRecording={isRecordingRefinement}
            onPress={handleVoiceRefinementPress}
          />
        </Animated.View>

        {/* Or divider */}
        <Animated.View
          entering={FadeIn.delay(250).duration(DURATIONS.normal)}
          style={styles.orDivider}
        >
          <View style={[styles.dividerLine, { backgroundColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.border }]} />
          <Text style={[styles.orText, { color: themeColors.textMuted }]}>{t('common.or') || 'lub'}</Text>
          <View style={[styles.dividerLine, { backgroundColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.border }]} />
        </Animated.View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.refiningScroll}
        contentContainerStyle={styles.refiningContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Text Input */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(DURATIONS.normal)}
          style={styles.textInputContainer}
        >
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.surface,
              color: themeColors.textPrimary
            }]}
            placeholder={t('magicCreator.refine.placeholder')}
            placeholderTextColor={themeColors.textMuted}
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
          style={[styles.collapsiblePromptContainer, { 
            backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.surface,
            borderColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.border
          }]}
        >
          <TouchableOpacity
            style={[styles.collapsiblePromptHeader, { backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.surface }]}
            onPress={() => {
              setShowCurrentPrompt(!showCurrentPrompt);
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.collapsiblePromptHeaderLeft}>
              <Text style={[styles.collapsiblePromptTitle, { color: themeColors.textMuted }]}>
                {t('magicCreator.refine.viewTechnicalPrompt')}
              </Text>
            </View>
            <Text style={[styles.collapsiblePromptArrow, { color: themeColors.textMuted }]}>
              {showCurrentPrompt ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {showCurrentPrompt && (
            <View style={[styles.collapsiblePromptContent, { backgroundColor: isDark ? themeColors.canvas : ONBOARDING_COLORS.pureWhite }]}>
              <ScrollView 
                style={styles.currentPromptScroll}
                contentContainerStyle={styles.currentPromptContentInner}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
              >
                <Text style={[styles.currentPromptText, { color: themeColors.textSecondary }]}>
                  {refinedPrompt || humanSummary}
                </Text>
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Apply Button */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(DURATIONS.normal)}
          style={styles.createButtonContainer}
        >
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: themeColors.accentPrimary },
              !refinementInput.trim() && [styles.createButtonDisabled, { backgroundColor: isDark ? themeColors.borderNormal : ONBOARDING_COLORS.border }],
            ]}
            onPress={handleApplyRefinement}
            disabled={!refinementInput.trim()}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.createButtonText,
                { color: '#FFF' },
                !refinementInput.trim() && [styles.createButtonTextDisabled, { color: themeColors.textMuted }],
              ]}
            >
              {t('magicCreator.refine.applyButton')}
            </Text>
          </TouchableOpacity>

          {/* Back to preview button */}
          <TouchableOpacity
            style={styles.backToPreviewButton}
            onPress={() => setStep('preview')}
            activeOpacity={0.8}
          >
            <Text style={[styles.backToPreviewText, { color: themeColors.textMuted }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );

  const renderPreviewStep = () => (
    <View style={[styles.previewContainer, { backgroundColor: themeColors.canvas }]}>
      {/* Summary Card - Compact */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(DURATIONS.normal)}
        style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(70, 183, 198, 0.1)' : ONBOARDING_COLORS.primarySubtle }]}
      >
        <Text style={[styles.summaryLabel, { color: themeColors.accentPrimary }]}>
          {t('magicCreator.preview.understood')}
        </Text>
        <Text style={[styles.summaryText, { color: themeColors.textPrimary }]} numberOfLines={2}>{humanSummary}</Text>
      </Animated.View>

      {/* Template name */}
      <View style={styles.templateNameContainer}>
        <Text style={[styles.templateNameLabel, { color: themeColors.textSecondary }]}>
          {t('templates.nameLabel')}
        </Text>
        <TextInput
          style={[
            styles.templateNameInput,
            {
              color: themeColors.textPrimary,
              backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.pureWhite,
              borderColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.borderLight,
            },
          ]}
          placeholder={t('templates.titlePlaceholder')}
          placeholderTextColor={themeColors.textMuted}
          value={templateName}
          onChangeText={(value) => {
            setTemplateName(value);
            if (templateNameError) setTemplateNameError('');
          }}
        />
        {templateNameError ? (
          <Text style={[styles.templateNameError, { color: themeColors.error }]}>
            {templateNameError}
          </Text>
        ) : null}
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? themeColors.borderNormal : ONBOARDING_COLORS.surface }]}>
        <TouchableOpacity
          style={[styles.tab, previewTab === 'note' && [styles.tabActive, { backgroundColor: themeColors.accentPrimary }]]}
          onPress={() => {
            setPreviewTab('note');
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          }}
        >
          <Text style={[styles.tabText, { color: themeColors.textSecondary }, previewTab === 'note' && [styles.tabTextActive, { color: '#FFF' }]]}>
            {t('magicCreator.preview.noteTab')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, previewTab === 'prompt' && [styles.tabActive, { backgroundColor: themeColors.accentPrimary }]]}
          onPress={() => {
            setPreviewTab('prompt');
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
            // Initialize edited prompt if empty
            if (!editedPrompt) {
              setEditedPrompt(refinedPrompt);
            }
          }}
        >
          <View style={styles.tabWithIcon}>
            <Settings 
              size={14} 
              color={previewTab === 'prompt' ? '#FFF' : themeColors.textSecondary}
              strokeWidth={2.5}
            />
            <Text style={[styles.tabText, { color: themeColors.textSecondary }, previewTab === 'prompt' && [styles.tabTextActive, { color: '#FFF' }]]}>
              {t('magicCreator.preview.promptTab')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Swipe hint */}
      <Text style={[styles.swipeHint, { color: themeColors.textMuted }]}>
        ← {t('magicCreator.preview.swipeHint')} →
      </Text>

      {/* Tab Content - Takes majority of screen */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.tabContentContainer}>
          {previewTab === 'note' ? (
            // Note Preview Tab
            <SimulationCard
              sampleNote={sampleNote}
              patientName={patientName}
            />
          ) : (
            // Prompt Edit Tab
            <View style={[styles.promptEditContainer, { 
              backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.pureWhite,
              borderColor: themeColors.accentPrimary,
              shadowColor: isDark ? themeColors.accentPrimary : ONBOARDING_SHADOWS.md.shadowColor
            }]}>
              <Text style={[styles.promptEditLabel, { 
                color: themeColors.accentPrimary,
                backgroundColor: isDark ? 'rgba(70, 183, 198, 0.1)' : ONBOARDING_COLORS.primarySubtle
              }]}>
                {t('magicCreator.preview.promptEditLabel')}
              </Text>
              <ScrollView
                style={styles.promptEditScroll}
                contentContainerStyle={styles.promptEditContent}
                showsVerticalScrollIndicator={true}
              >
                <TextInput
                  style={[styles.promptEditInput, { color: themeColors.textPrimary }]}
                  value={editedPrompt}
                  onChangeText={setEditedPrompt}
                  multiline
                  placeholder={t('magicCreator.preview.promptEditPlaceholder')}
                  placeholderTextColor={themeColors.textMuted}
                />
              </ScrollView>
              
              {/* Apply button for manual edits */}
              <TouchableOpacity
                style={[styles.applyEditButton, { backgroundColor: themeColors.accentPrimary }]}
                onPress={handleApplyManualEdit}
                activeOpacity={0.9}
              >
                <Text style={[styles.applyEditButtonText, { color: '#FFF' }]}>
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
        style={styles.actionButtons}
      >
        <TouchableOpacity
          style={[styles.actionButtonSmall, {
            backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.pureWhite,
            borderColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.borderLight
          }]}
          onPress={handleRefine}
          activeOpacity={0.8}
        >
          <Mic size={16} color={themeColors.textSecondary} strokeWidth={2.5} />
          <Text style={[styles.actionButtonTextSmall, { color: themeColors.textSecondary }]}>
            {t('magicCreator.preview.refineButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButtonSmall, {
            backgroundColor: isDark ? themeColors.layer2 : ONBOARDING_COLORS.pureWhite,
            borderColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.borderLight
          }]}
          onPress={handleStartOver}
          activeOpacity={0.8}
        >
          <RotateCcw size={16} color={themeColors.textSecondary} strokeWidth={2.5} />
          <Text style={[styles.actionButtonTextSmall, { color: themeColors.textSecondary }]}>
            {t('magicCreator.preview.startOverButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButtonCompact, { backgroundColor: themeColors.accentPrimary }]}
          onPress={handleSaveTemplate}
          activeOpacity={0.9}
        >
          <Text style={[styles.saveButtonTextCompact, { color: '#FFF' }]}>
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
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.canvas }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={[styles.header, { 
            borderBottomColor: isDark ? themeColors.borderSubtle : ONBOARDING_COLORS.borderLight,
            backgroundColor: themeColors.canvas
          }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, { color: themeColors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>{t('magicCreator.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          {step === 'input' && renderInputStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'refining' && renderRefiningStep()}
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  templateNameContainer: {
    marginBottom: ONBOARDING_SPACING.sm,
  },
  templateNameLabel: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    marginBottom: ONBOARDING_SPACING.xs,
    fontWeight: '600',
  },
  templateNameInput: {
    borderWidth: 1,
    borderRadius: ONBOARDING_RADIUS.md,
    paddingHorizontal: ONBOARDING_SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? ONBOARDING_SPACING.sm : ONBOARDING_SPACING.xs,
    fontSize: 14,
  },
  templateNameError: {
    ...ONBOARDING_TYPOGRAPHY.caption,
    marginTop: ONBOARDING_SPACING.xs,
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