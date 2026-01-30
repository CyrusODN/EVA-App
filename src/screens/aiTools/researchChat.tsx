import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
  Vibration,
  KeyboardAvoidingView,
  Keyboard,
  ActionSheetIOS,
  Alert,
  Animated,
  Easing,
  Modal,
  Image,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Plus,
  ArrowUp,
  FileText,
  X,
  Sparkles,
  BookOpen,
  ClipboardList,
  Search,
  Beaker,
  AlertCircle,
  File,
  Image as ImageIcon,
  Camera,
  FolderOpen,
  ExternalLink,
  Copy,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import Markdown from 'react-native-markdown-display';
import userStore from '../../store/user';
import PromptLibrary from '../../components/PromptLibrary';
import { useTheme } from '../../constants/theme';

// ============================================================================
// DESIGN TOKENS - "Invisible Luxury" / Clinical Zen
// ============================================================================
const THEME = {
  // Backgrounds
  pure: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceAlt: '#F3F4F6',
  userBubble: '#F3F4F6',
  
  // Text
  navy: '#111827',
  secondary: '#6B7280',
  tertiary: '#9CA3AF',
  placeholder: '#9CA3AF',
  
  // Brand
  brand: '#46B7C6',
  brandLight: 'rgba(70, 183, 198, 0.08)',
  brandMedium: 'rgba(70, 183, 198, 0.15)',
  brandDark: '#3AA8B7',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // States
  inactive: '#D1D5DB',
  success: '#10B981',
  error: '#EF4444',
};

// Avatar chatbota
const CHATBOT_AVATAR = 'https://i.imgur.com/rCPznko.jpeg';

// ============================================================================
// TYPES
// ============================================================================
type MessageRole = 'user' | 'assistant';

interface Citation {
  id: string;
  title: string;
  source: string;
  page?: string;
}

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  timestamp: Date;
  isLoading?: boolean;
}

interface AttachedFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  uri: string;
}

interface CustomPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

type ResearchMode = 'general' | 'protocol';

// Default prompts for Remedius Research
const DEFAULT_RESEARCH_PROMPTS: CustomPrompt[] = [
  {
    id: 'p1',
    title: 'Executive Summary',
    content: 'Provide a concise executive summary of key findings with clinical implications.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    title: 'Methodology Analysis',
    content: 'Focus on study design, methodology, and statistical analysis.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    title: 'Clinical Protocol Review',
    content: 'Detailed review of trial protocol including eligibility criteria and endpoints.',
    createdAt: new Date().toISOString(),
  },
];

// ============================================================================
// HAPTICS HELPER
// ============================================================================
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  const duration = type === 'light' ? 5 : type === 'medium' ? 10 : 20;
  Vibration.vibrate(duration);
};

// ============================================================================
// MOCK DATA & HELPERS
// ============================================================================
const getMockResponse = (mode: ResearchMode, query: string): { content: string; citations: Citation[] } => {
  if (mode === 'general') {
    return {
      content: `Based on my analysis of the relevant medical literature, here's what I found regarding "${query.slice(0, 50)}...":

**Key Findings:**

1. **Clinical Evidence**: Multiple randomized controlled trials have demonstrated significant efficacy in the treatment approach. The meta-analysis by Smith et al. (2023) showed a pooled effect size of 0.67 (95% CI: 0.52-0.82).

2. **Mechanism of Action**: The underlying pathophysiology involves modulation of the inflammatory cascade, particularly through inhibition of pro-inflammatory cytokines including IL-6 and TNF-α.

3. **Dosing Recommendations**: Current guidelines recommend initiating therapy at low doses with gradual titration. The optimal therapeutic range has been established through pharmacokinetic studies.

4. **Safety Profile**: The most commonly reported adverse effects include mild gastrointestinal disturbances (12%) and transient headache (8%). Serious adverse events are rare (<1%).

**Clinical Implications:**
This evidence supports the use of this therapeutic approach in appropriate patient populations, with careful monitoring for adverse effects.`,
      citations: [
        { id: '1', title: 'Meta-analysis of Treatment Efficacy', source: 'JAMA Internal Medicine', page: 'pp. 234-241' },
        { id: '2', title: 'Pathophysiology and Mechanisms', source: 'Nature Reviews', page: 'pp. 112-128' },
        { id: '3', title: 'Clinical Practice Guidelines 2024', source: 'ACC/AHA', page: 'Section 4.2' },
      ],
    };
  } else {
    return {
      content: `I've analyzed the clinical trial protocol. Here's a structured summary:

**Study Design:**
This is a Phase III, randomized, double-blind, placebo-controlled, multicenter trial.

**Inclusion Criteria:**
- Age 18-75 years
- Confirmed diagnosis via validated biomarkers
- ECOG performance status 0-2
- Adequate organ function (defined laboratory parameters)
- Written informed consent

**Exclusion Criteria:**
- Prior treatment with similar mechanism agents
- Active autoimmune disease requiring systemic therapy
- Uncontrolled comorbidities
- Pregnancy or lactation

**Primary Endpoint:**
Overall Response Rate (ORR) at Week 24, assessed by independent central review using RECIST 1.1 criteria.

**Secondary Endpoints:**
- Progression-free survival (PFS)
- Duration of response (DOR)
- Quality of life (EORTC QLQ-C30)
- Safety and tolerability

**Sample Size:**
N=450 (randomized 2:1), providing 85% power to detect a 15% absolute improvement in ORR.`,
      citations: [
        { id: '1', title: 'Study Protocol v3.2', source: 'ClinicalTrials.gov NCT04XXXXXX', page: 'Section 6' },
        { id: '2', title: 'Statistical Analysis Plan', source: 'Protocol Appendix B', page: 'pp. 45-52' },
      ],
    };
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Pulsing AI Logo for empty state
const PulsingAILogo: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  return (
    <View style={styles.aiLogoContainer}>
      <Animated.View style={[styles.aiLogoInner, { transform: [{ scale: pulseAnim }] }]}>
        <Image 
          source={{ uri: CHATBOT_AVATAR }} 
          style={styles.avatarImage}
        />
      </Animated.View>
    </View>
  );
};

// Suggestion Chip
const SuggestionChip: React.FC<{
  icon: React.ComponentType<any>;
  text: string;
  onPress: () => void;
  dynamicTheme: any;
}> = ({ icon: Icon, text, onPress, dynamicTheme }) => (
  <TouchableOpacity
    style={[styles.suggestionChip, { 
      backgroundColor: dynamicTheme.pure,
      borderColor: dynamicTheme.borderLight
    }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Icon size={14} color={dynamicTheme.brand} strokeWidth={2} />
    <Text style={[styles.suggestionChipText, { color: dynamicTheme.navy }]}>{text}</Text>
  </TouchableOpacity>
);

// Markdown styles for chat messages - now a function
const getMarkdownStyles = (dynamicTheme: any) => ({
  body: {
    fontSize: 15,
    color: dynamicTheme.navy,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  heading1: {
    fontSize: 18,
    fontWeight: '700' as '700',
    color: dynamicTheme.navy,
    marginTop: 8,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: dynamicTheme.navy,
    marginTop: 6,
    marginBottom: 6,
  },
  strong: {
    fontWeight: '600' as '600',
    color: dynamicTheme.navy,
  },
  em: {
    fontStyle: 'italic' as 'italic',
  },
  bullet_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  ordered_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  list_item: {
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: dynamicTheme.surfaceAlt,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  code_block: {
    backgroundColor: dynamicTheme.surfaceAlt,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  link: {
    color: dynamicTheme.brand,
  },
});

// Message Bubble
const MessageBubble: React.FC<{
  message: Message;
  onCitationPress?: (citation: Citation) => void;
  dynamicTheme: any;
}> = ({ message, onCitationPress, dynamicTheme }) => {
  const handleCopy = () => {
    Clipboard.setString(message.content);
    triggerHaptic('light');
    Alert.alert('Copied', 'Message copied to clipboard');
  };
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (message.isLoading) {
    return (
      <Animated.View
        style={[
          styles.messageBubbleWrapper,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: CHATBOT_AVATAR }} style={styles.assistantAvatar} />
        </View>
        <View style={styles.bubbleContent}>
          <ThinkingIndicator />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.messageBubbleWrapper,
        isUser && styles.userBubbleWrapper,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: CHATBOT_AVATAR }} style={styles.assistantAvatar} />
        </View>
      )}
      
      <View
        style={[
          styles.messageBubble,
          isUser ? [styles.userBubble, { backgroundColor: dynamicTheme.userBubble }] : [
            styles.assistantBubble, 
            { 
              backgroundColor: dynamicTheme.pure,
              borderColor: dynamicTheme.borderLight,
              shadowColor: '#000'
            }
          ],
        ]}
      >
        {/* Copy button for assistant messages */}
        {!isUser && (
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: dynamicTheme.brandMedium }]}
            onPress={handleCopy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Copy size={14} color={dynamicTheme.brand} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {isUser ? (
          <Text style={[styles.messageText, styles.userMessageText, { color: dynamicTheme.navy }]}>
            {message.content}
          </Text>
        ) : (
          <Markdown style={getMarkdownStyles(dynamicTheme)}>{message.content}</Markdown>
        )}

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <View style={[styles.citationsContainer, { borderTopColor: dynamicTheme.borderLight }]}>
            <Text style={[styles.citationsLabel, { color: dynamicTheme.tertiary }]}>Sources</Text>
            {message.citations.map((citation, index) => (
              <TouchableOpacity
                key={citation.id}
                style={[styles.citationChip, { backgroundColor: dynamicTheme.surfaceAlt }]}
                onPress={() => onCitationPress?.(citation)}
                activeOpacity={0.7}
              >
                <View style={[styles.citationNumber, { backgroundColor: dynamicTheme.brandMedium }]}>
                  <Text style={[styles.citationNumberText, { color: dynamicTheme.brand }]}>{index + 1}</Text>
                </View>
                <View style={styles.citationContent}>
                  <Text style={[styles.citationTitle, { color: dynamicTheme.navy }]} numberOfLines={1}>
                    {citation.title}
                  </Text>
                  <Text style={[styles.citationSource, { color: dynamicTheme.tertiary }]} numberOfLines={1}>
                    {citation.source} {citation.page && `• ${citation.page}`}
                  </Text>
                </View>
                <ExternalLink size={14} color={dynamicTheme.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// Thinking Indicator
const ThinkingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    animateDot(dot1, 0).start();
    animateDot(dot2, 150).start();
    animateDot(dot3, 300).start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, []);

  return (
    <View style={styles.thinkingContainer}>
      <View style={styles.thinkingDots}>
        <Animated.View style={[styles.thinkingDot, { opacity: dot1 }]} />
        <Animated.View style={[styles.thinkingDot, { opacity: dot2 }]} />
        <Animated.View style={[styles.thinkingDot, { opacity: dot3 }]} />
      </View>
    </View>
  );
};

// File Chip
const FileChip: React.FC<{
  file: AttachedFile;
  onRemove: () => void;
  dynamicTheme: any;
}> = ({ file, onRemove, dynamicTheme }) => {
  const getIcon = () => {
    switch (file.type) {
      case 'pdf':
        return FileText;
      case 'image':
        return ImageIcon;
      default:
        return File;
    }
  };
  const Icon = getIcon();

  return (
    <View style={[styles.fileChip, { backgroundColor: dynamicTheme.brandLight }]}>
      <Icon size={14} color={dynamicTheme.brand} />
      <Text style={[styles.fileChipName, { color: dynamicTheme.navy }]} numberOfLines={1}>
        {file.name}
      </Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={14} color={dynamicTheme.secondary} />
      </TouchableOpacity>
    </View>
  );
};

// Custom Modal for Context Files
const ContextFilesModal: React.FC<{
  visible: boolean;
  files: AttachedFile[];
  onClose: () => void;
  dynamicTheme: any;
}> = ({ visible, files, onClose, dynamicTheme }) => {
  const { t } = useTranslation();
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: dynamicTheme.pure }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalHeader, { borderBottomColor: dynamicTheme.borderLight }]}>
            <Text style={[styles.modalTitle, { color: dynamicTheme.navy }]}>
              {t('researchChat.contextFiles')}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={dynamicTheme.navy} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalFilesList}>
            {files.length > 0 ? (
              files.map((file, index) => {
                const Icon = file.type === 'pdf' ? FileText : file.type === 'image' ? ImageIcon : File;
                return (
                  <View key={file.id} style={styles.modalFileItem}>
                    <Icon size={18} color={dynamicTheme.brand} />
                    <Text style={[styles.modalFileName, { color: dynamicTheme.navy }]}>{file.name}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.modalEmptyState}>
                <FolderOpen size={32} color={dynamicTheme.tertiary} />
                <Text style={[styles.modalEmptyText, { color: dynamicTheme.tertiary }]}>
                  {t('researchChat.noFilesUploaded')}
                </Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Input Bar
const InputBar: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  attachedFiles: AttachedFile[];
  onRemoveFile: (id: string) => void;
  placeholder: string;
  isLoading: boolean;
  dynamicTheme: any;
}> = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  attachedFiles,
  onRemoveFile,
  placeholder,
  isLoading,
  dynamicTheme,
}) => {
  const canSend = (value.trim().length > 0 || attachedFiles.length > 0) && !isLoading;

  const handleSend = () => {
    if (canSend) {
      triggerHaptic('medium');
      onSend();
    }
  };

  const handleAttach = () => {
    triggerHaptic('light');
    onAttach();
  };

  return (
    <View style={[styles.inputBarWrapper, { 
      backgroundColor: dynamicTheme.pure,
      borderTopColor: dynamicTheme.borderLight
    }]}>
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <View style={styles.attachedFilesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachedFiles.map((file) => (
              <FileChip
                key={file.id}
                file={file}
                onRemove={() => onRemoveFile(file.id)}
                dynamicTheme={dynamicTheme}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.inputBarContainer, { 
        backgroundColor: dynamicTheme.surfaceAlt,
        borderColor: dynamicTheme.borderLight
      }]}>
        {/* Attach button */}
        <TouchableOpacity
          style={[styles.attachButton, { backgroundColor: dynamicTheme.pure }]}
          onPress={handleAttach}
          activeOpacity={0.7}
        >
          <Plus size={22} color={dynamicTheme.secondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          style={[styles.textInput, { color: dynamicTheme.navy }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dynamicTheme.placeholder}
          multiline
          maxLength={4000}
          textAlignVertical="center"
        />

        {/* Send button - visible only when can send */}
        {value.trim().length > 0 && (
          <TouchableOpacity
            style={[styles.sendButton, styles.sendButtonActive, { backgroundColor: dynamicTheme.brand }]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <ArrowUp
              size={18}
              color={dynamicTheme.pure}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ResearchChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();
  
  const mode: ResearchMode = route.params?.mode || 'general';
  const scrollViewRef = useRef<ScrollView>(null);

  // Dynamic theme
  const DYNAMIC_THEME = {
    pure: isDark ? themeColors.canvas : THEME.pure,
    surface: isDark ? themeColors.layer1 : THEME.surface,
    surfaceAlt: isDark ? themeColors.layer2 : THEME.surfaceAlt,
    userBubble: isDark ? themeColors.layer2 : THEME.userBubble,
    navy: isDark ? themeColors.textPrimary : THEME.navy,
    secondary: isDark ? themeColors.textSecondary : THEME.secondary,
    tertiary: isDark ? themeColors.textMuted : THEME.tertiary,
    placeholder: isDark ? themeColors.textMuted : THEME.placeholder,
    brand: themeColors.accentPrimary,
    brandLight: isDark ? 'rgba(70, 183, 198, 0.15)' : THEME.brandLight,
    brandMedium: isDark ? 'rgba(70, 183, 198, 0.2)' : THEME.brandMedium,
    brandDark: isDark ? themeColors.accentPrimary : THEME.brandDark,
    border: isDark ? themeColors.borderNormal : THEME.border,
    borderLight: isDark ? themeColors.borderSubtle : THEME.borderLight,
    inactive: isDark ? themeColors.textMuted : THEME.inactive,
    success: THEME.success,
    error: THEME.error,
  };

  // Get user name from store
  const loggedInUser = userStore((state: any) => state.loggedInUser);
  const userName = loggedInUser?.firstName || loggedInUser?.name?.split(' ')[0] || 'Doctor';

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState<AttachedFile[]>([]);
  const [showContextModal, setShowContextModal] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>(DEFAULT_RESEARCH_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);

  const isEmptyState = messages.length === 0;

  // Suggestion chips based on mode
  const suggestionChips = mode === 'general'
    ? [
        { icon: FileText, text: t('researchChat.suggestions.general.executiveSummary') },
        { icon: Sparkles, text: t('researchChat.suggestions.general.clinicalImplications') },
        { icon: Beaker, text: t('researchChat.suggestions.general.methodologyAnalysis') },
        { icon: AlertCircle, text: t('researchChat.suggestions.general.evidenceGrading') },
      ]
    : [
        { icon: FileText, text: t('researchChat.suggestions.protocol.synopsis') },
        { icon: ClipboardList, text: t('researchChat.suggestions.protocol.eligibility') },
        { icon: BookOpen, text: t('researchChat.suggestions.protocol.schedule') },
        { icon: AlertCircle, text: t('researchChat.suggestions.protocol.safetyEndpoints') },
      ];

  // Handlers
  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewFiles = () => {
    triggerHaptic('light');
    setShowContextModal(true);
  };

  const addMessage = useCallback((role: MessageRole, content: string, citations?: Citation[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      citations,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    return newMessage.id;
  }, []);

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query && attachedFiles.length === 0) return;

    const userContent = attachedFiles.length > 0
      ? `${query}\n\n[${t('researchChat.attached')}: ${attachedFiles.map(f => f.name).join(', ')}]`
      : query;
    addMessage('user', userContent);

    if (attachedFiles.length > 0) {
      setContextFiles((prev) => [...prev, ...attachedFiles]);
    }

    setInputText('');
    setAttachedFiles([]);
    Keyboard.dismiss();

    setIsLoading(true);
    const loadingId = Date.now().toString() + '-loading';
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '', timestamp: new Date(), isLoading: true },
    ]);

    setTimeout(() => {
      const { content, citations } = getMockResponse(mode, query);
      
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      addMessage('assistant', content, citations);
      setIsLoading(false);
    }, 2000 + Math.random() * 1500);
  };

  const handleSuggestionPress = (suggestion: string) => {
    triggerHaptic('light');
    setInputText(suggestion);
  };

  const handleAttach = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('researchChat.attachOptions.cancel'),
            t('researchChat.attachOptions.uploadPdf'),
            t('researchChat.attachOptions.scan'),
            t('researchChat.attachOptions.gallery'),
          ],
          cancelButtonIndex: 0,
          tintColor: THEME.brand,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleFilePick();
          else if (buttonIndex === 2) handleScan();
          else if (buttonIndex === 3) handleGallery();
        }
      );
    } else {
      Alert.alert(
        t('researchChat.attachTitle'),
        '',
        [
          { text: t('researchChat.attachOptions.uploadPdf'), onPress: handleFilePick },
          { text: t('researchChat.attachOptions.scan'), onPress: handleScan },
          { text: t('researchChat.attachOptions.gallery'), onPress: handleGallery },
          { text: t('researchChat.attachOptions.cancel'), style: 'cancel' },
        ]
      );
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await pick({
        type: [types.pdf, types.docx, types.plainText],
      });

      if (result && result[0]) {
        const newFile: AttachedFile = {
          id: Date.now().toString(),
          name: result[0].name || 'document.pdf',
          type: 'pdf',
          uri: result[0].uri || '',
        };
        setAttachedFiles((prev) => [...prev, newFile]);
        triggerHaptic('light');
      }
    } catch (error) {
      console.log('File picker error:', error);
    }
  };

  const handleScan = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        const newFile: AttachedFile = {
          id: Date.now().toString(),
          name: result.assets[0].fileName || 'scanned_document.jpg',
          type: 'image',
          uri: result.assets[0].uri || '',
        };
        setAttachedFiles((prev) => [...prev, newFile]);
        triggerHaptic('light');
      }
    } catch (error) {
      console.log('Camera error:', error);
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        const newFile: AttachedFile = {
          id: Date.now().toString(),
          name: result.assets[0].fileName || 'image.jpg',
          type: 'image',
          uri: result.assets[0].uri || '',
        };
        setAttachedFiles((prev) => [...prev, newFile]);
        triggerHaptic('light');
      }
    } catch (error) {
      console.log('Gallery error:', error);
    }
  };

  const handleRemoveFile = (id: string) => {
    triggerHaptic('light');
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCitationPress = (citation: Citation) => {
    triggerHaptic('light');
    // Could open in browser or show details
  };

  const handleSaveMagicTemplate = (template: {
    name: string;
    instructions: string;
    refinedPrompt: string;
  }) => {
    const newPrompt: CustomPrompt = {
      id: Date.now().toString(),
      title: template.name,
      content: template.refinedPrompt,
      createdAt: new Date().toISOString(),
    };
    setCustomPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newPrompt.id);
    triggerHaptic('medium');
  };

  const handleSelectPrompt = (prompt: CustomPrompt) => {
    setSelectedPromptId(prompt.id);
    setShowPromptLibrary(false);
  };

  const handleDeletePrompt = (id: string) => {
    setCustomPrompts(prev => prev.filter(p => p.id !== id));
    if (selectedPromptId === id) setSelectedPromptId(null);
  };

  const selectedPrompt = customPrompts.find(p => p.id === selectedPromptId);

  const screenTitle = mode === 'general' 
    ? t('researchChat.title.general') 
    : t('researchChat.title.protocol');
  const placeholderText = mode === 'general'
    ? t('researchChat.placeholder.general')
    : t('researchChat.placeholder.protocol');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: DYNAMIC_THEME.pure }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: DYNAMIC_THEME.pure,
          borderBottomColor: DYNAMIC_THEME.borderLight
        }]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <ChevronLeft size={24} color={DYNAMIC_THEME.navy} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: DYNAMIC_THEME.brand }]}>{screenTitle}</Text>
            {contextFiles.length > 0 && (
              <Text style={[styles.headerSubtitle, { color: DYNAMIC_THEME.secondary }]}>
                {contextFiles.length} {t('researchChat.filesLoaded', { count: contextFiles.length })}
              </Text>
            )}
            {selectedPrompt && (
              <Text style={[styles.headerPromptBadge, { 
                color: DYNAMIC_THEME.brand,
                backgroundColor: DYNAMIC_THEME.brandLight
              }]} numberOfLines={1}>
                {selectedPrompt.title}
              </Text>
            )}
          </View>

          <View style={styles.headerRightButtons}>
            <TouchableOpacity onPress={() => setShowPromptLibrary(true)} style={styles.headerButton}>
              <Sparkles size={20} color={DYNAMIC_THEME.brand} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleViewFiles} style={styles.headerButton}>
              <FolderOpen size={22} color={DYNAMIC_THEME.navy} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content area */}
        <View style={[styles.contentArea, { backgroundColor: DYNAMIC_THEME.pure }]}>
          {isEmptyState ? (
            /* Empty State - przekażę DYNAMIC_THEME jako context */
            <View style={styles.emptyState}>
              <PulsingAILogo />
              
              <Text style={[styles.emptyStateGreeting, { color: DYNAMIC_THEME.navy }]}>
                {mode === 'general'
                  ? t('researchChat.greeting.general')
                  : t('researchChat.greeting.protocol')}
              </Text>
              
              <Text style={[styles.emptyStateSubtext, { color: DYNAMIC_THEME.secondary }]}>
                {mode === 'general'
                  ? t('researchChat.subtitle.general')
                  : t('researchChat.subtitle.protocol')}
              </Text>

              {/* Suggestion chips */}
              <View style={styles.suggestionsContainer}>
                {suggestionChips.map((chip, index) => (
                  <SuggestionChip
                    key={index}
                    icon={chip.icon}
                    text={chip.text}
                    onPress={() => handleSuggestionPress(chip.text)}
                    dynamicTheme={DYNAMIC_THEME}
                  />
                ))}
              </View>
            </View>
          ) : (
            /* Chat Stream */
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatStream}
              contentContainerStyle={styles.chatStreamContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCitationPress={handleCitationPress}
                  dynamicTheme={DYNAMIC_THEME}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Input Bar */}
        <InputBar
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onAttach={handleAttach}
          attachedFiles={attachedFiles}
          onRemoveFile={handleRemoveFile}
          placeholder={placeholderText}
          isLoading={isLoading}
          dynamicTheme={DYNAMIC_THEME}
        />
      </KeyboardAvoidingView>

      {/* Context Files Modal */}
      <ContextFilesModal
        visible={showContextModal}
        files={contextFiles}
        onClose={() => setShowContextModal(false)}
        dynamicTheme={DYNAMIC_THEME}
      />

      <PromptLibrary
        visible={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        prompts={customPrompts}
        selectedPromptId={selectedPromptId}
        onSelectPrompt={handleSelectPrompt}
        onDeletePrompt={handleDeletePrompt}
        onSavePrompt={handleSaveMagicTemplate}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  headerPromptBadge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    maxWidth: wp(60),
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 4,
  },

  // Content area
  contentArea: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingBottom: hp(10),
  },
  aiLogoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  aiLogoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.pure,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // Estetyczny cień zamiast obwódki
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyStateGreeting: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  emptyStateSubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: hp(1),
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: hp(4),
    gap: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Chat Stream
  chatStream: {
    flex: 1,
  },
  chatStreamContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    paddingBottom: hp(4),
  },

  // Message Bubbles
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: hp(2),
    maxWidth: '88%',
  },
  userBubbleWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginRight: 8,
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubbleContent: {
    flex: 1,
  },
  messageBubble: {
    flex: 1,
  },
  userBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  assistantBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 28, // Space for copy button
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  copyButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  userMessageText: {
  },

  // Citations
  citationsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  citationsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  citationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  citationNumber: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  citationNumberText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  citationContent: {
    flex: 1,
  },
  citationTitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  citationSource: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Thinking Indicator
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280', // Keep static as it's subtle
  },

  // Input Bar
  inputBarWrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 0 : hp(1),
  },
  attachedFilesContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(0.5),
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: wp(3),
    marginTop: hp(1),
    marginBottom: hp(1),
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  attachButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
  },

  // File Chip
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    gap: 6,
    maxWidth: 180,
  },
  fileChipName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Custom Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalContent: {
    borderRadius: 20,
    width: '100%',
    maxHeight: hp(60),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  modalFilesList: {
    padding: 20,
  },
  modalFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  modalFileName: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  modalEmptyState: {
    alignItems: 'center',
    paddingVertical: hp(4),
  },
  modalEmptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});

export default ResearchChatScreen;
