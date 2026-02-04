/* eslint-disable react-native/no-inline-styles */
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
  File,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  FileCheck,
  History,
  Camera,
  FolderOpen,
  Search,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import Markdown from 'react-native-markdown-display';
import userStore from '../../store/user';
import PromptLibrary from '../../components/PromptLibrary';
import { useTheme } from '../../constants/theme';

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const THEME = {
  pure: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceAlt: '#F3F4F6',
  userBubble: '#F3F4F6',
  navy: '#111827',
  secondary: '#6B7280',
  tertiary: '#9CA3AF',
  placeholder: '#9CA3AF',
  brand: '#46B7C6',
  brandLight: 'rgba(70, 183, 198, 0.08)',
  brandMedium: 'rgba(70, 183, 198, 0.15)',
  brandDark: '#3AA8B7',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  inactive: '#D1D5DB',
  success: '#10B981',
  error: '#EF4444',
};

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
  type: 'pdf' | 'image' | 'document' | 'visit';
  uri: string;
}

interface Visit {
  id: string;
  patientName: string;
  date: string;
  type: string;
  visitName: string;
}

interface CustomPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

// Mock visits data
const MOCK_VISITS: Visit[] = [
  { id: '1', patientName: 'John Doe', date: '2024-01-15', type: 'Follow-up', visitName: 'JD45' },
  { id: '2', patientName: 'Jane Smith', date: '2024-01-14', type: 'First Visit', visitName: 'JS32' },
  { id: '3', patientName: 'Bob Wilson', date: '2024-01-13', type: 'Follow-up', visitName: 'BW67' },
  { id: '4', patientName: 'Alice Brown', date: '2024-01-12', type: 'First Visit', visitName: 'AB89' },
  { id: '5', patientName: 'Charlie Davis', date: '2024-01-11', type: 'Follow-up', visitName: 'CD23' },
  { id: '6', patientName: 'Diana Evans', date: '2024-01-10', type: 'First Visit', visitName: 'DE56' },
];

// Default prompts for Remedius Consult
const DEFAULT_CONSULT_PROMPTS: CustomPrompt[] = [
  {
    id: 'p1',
    title: 'Differential Diagnosis',
    content: 'Provide a comprehensive differential diagnosis with clinical reasoning.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    title: 'Treatment Plan',
    content: 'Focus on evidence-based treatment recommendations and management strategies.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    title: 'Quick Consult',
    content: 'Brief clinical guidance with key actionable points.',
    createdAt: new Date().toISOString(),
  },
];

// ============================================================================
// HAPTICS
// ============================================================================
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  const duration = type === 'light' ? 5 : type === 'medium' ? 10 : 20;
  Vibration.vibrate(duration);
};

// ============================================================================
// MOCK RESPONSE
// ============================================================================
const getMockConsultResponse = (query: string): { content: string; citations: Citation[] } => {
  return {
    content: `Based on the clinical information provided, here's my assessment:

**Clinical Analysis:**

The presentation suggests a differential diagnosis that includes several possibilities. Based on the symptoms and clinical findings:

1. **Primary Consideration**: The symptom pattern is consistent with [condition], supported by [finding].

2. **Risk Stratification**: Using established clinical criteria, this patient falls into a [risk category] risk category.

3. **Recommended Workup**:
   - Laboratory: CBC, CMP, troponin, BNP
   - Imaging: Chest X-ray, consider CT if indicated
   - ECG for cardiac evaluation

4. **Management Approach**:
   - Initial stabilization with [intervention]
   - Consider consultation with [specialty]
   - Follow evidence-based guidelines for [condition]

**Red Flags to Monitor:**
- Watch for signs of clinical deterioration
- Re-evaluate if symptoms progress
- Consider admission criteria per institutional protocol

**Disposition Recommendation:**
Based on current presentation, would recommend [admission/observation/discharge with close follow-up].`,
    citations: [
      { id: '1', title: 'Clinical Practice Guidelines', source: 'American College of Physicians', page: 'Section 4.2' },
      { id: '2', title: 'Evidence-Based Diagnosis', source: 'JAMA', page: 'pp. 145-152' },
      { id: '3', title: 'Risk Stratification Protocol', source: 'UpToDate', page: 'Latest Review' },
    ],
  };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PulsingAILogo: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.aiLogoContainer}>
      <Animated.View style={[styles.aiLogoInner, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={{ uri: CHATBOT_AVATAR }} style={styles.avatarImage} />
      </Animated.View>
    </View>
  );
};

// Pulsing Import Button
const PulsingImportButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
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

    pulse.start();
    return () => {
      pulse.stop();
    };
  }, []);

  return (
    <View style={styles.importVisitPromptContainer}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.pulsingButtonWrapper}
      >
        <Animated.View style={[styles.pulsingCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Plus size={36} color={THEME.pure} strokeWidth={2.5} />
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.importVisitText}>{t('consultChat.importVisitPrompt')}</Text>
    </View>
  );
};

const markdownStyles = (dynamicTheme: any) => ({
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
});

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
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  if (message.isLoading) {
    return (
      <Animated.View style={[styles.messageBubbleWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
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
      
      <View style={[
        styles.messageBubble, 
        isUser ? [styles.userBubble, { backgroundColor: dynamicTheme.userBubble }] : [
          styles.assistantBubble,
          { 
            backgroundColor: dynamicTheme.pure,
            borderColor: dynamicTheme.borderLight,
            shadowColor: '#000'
          }
        ]
      ]}>
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
          <Text style={[styles.messageText, styles.userMessageText, { color: dynamicTheme.navy }]}>{message.content}</Text>
        ) : (
          <Markdown style={markdownStyles(dynamicTheme)}>{message.content}</Markdown>
        )}

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
                  <Text style={[styles.citationTitle, { color: dynamicTheme.navy }]} numberOfLines={1}>{citation.title}</Text>
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

const ThinkingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );

    animateDot(dot1, 0).start();
    animateDot(dot2, 150).start();
    animateDot(dot3, 300).start();
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

const FileChip: React.FC<{ file: AttachedFile; onRemove: () => void; dynamicTheme: any }> = ({ file, onRemove, dynamicTheme }) => {
  const getIcon = () => {
    switch (file.type) {
      case 'pdf': return FileText;
      case 'image': return ImageIcon;
      case 'visit': return FileCheck;
      default: return File;
    }
  };
  const Icon = getIcon();

  return (
    <View style={[styles.fileChip, { backgroundColor: dynamicTheme.brandLight }]}>
      <Icon size={14} color={dynamicTheme.brand} />
      <Text style={[styles.fileChipName, { color: dynamicTheme.navy }]} numberOfLines={1}>{file.name}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={14} color={dynamicTheme.secondary} />
      </TouchableOpacity>
    </View>
  );
};

// Custom Attachment Modal
const AttachmentModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onImportVisit: () => void;
  onUploadPdf: () => void;
  onScan: () => void;
  onGallery: () => void;
  dynamicTheme: any;
}> = ({ visible, onClose, onImportVisit, onUploadPdf, onScan, onGallery, dynamicTheme }) => {
  const { t } = useTranslation();

  const options = [
    { icon: FileCheck, label: t('consultChat.attachOptions.importVisit'), onPress: onImportVisit, color: dynamicTheme.brand },
    { icon: FileText, label: t('consultChat.attachOptions.uploadPdf'), onPress: onUploadPdf, color: '#8B5CF6' },
    { icon: Camera, label: t('consultChat.attachOptions.scan'), onPress: onScan, color: '#10B981' },
    { icon: FolderOpen, label: t('consultChat.attachOptions.gallery'), onPress: onGallery, color: '#F59E0B' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.attachmentModalContent, { backgroundColor: dynamicTheme.pure }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.attachmentModalHeader}>
            <View style={[styles.attachmentModalHandle, { backgroundColor: dynamicTheme.inactive }]} />
          </View>
          
          <View style={styles.attachmentOptionsContainer}>
            {options.map((option, index) => {
              const Icon = option.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.attachmentOption, { backgroundColor: dynamicTheme.surface }]}
                  onPress={() => {
                    option.onPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.attachmentOptionIcon, { backgroundColor: `${option.color}15` }]}>
                    <Icon size={24} color={option.color} strokeWidth={2} />
                  </View>
                  <Text style={[styles.attachmentOptionLabel, { color: dynamicTheme.navy }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.attachmentCancelButton, { backgroundColor: dynamicTheme.surfaceAlt }]} onPress={onClose}>
            <Text style={[styles.attachmentCancelText, { color: dynamicTheme.secondary }]}>{t('consultChat.attachOptions.cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Visit Selection Modal
const VisitSelectionModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectVisit: (visit: Visit) => void;
  dynamicTheme: any;
}> = ({ visible, onClose, onSelectVisit, dynamicTheme }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>(MOCK_VISITS);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVisits(MOCK_VISITS);
    } else {
      const filtered = MOCK_VISITS.filter(visit =>
        visit.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.visitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVisits(filtered);
    }
  }, [searchQuery]);

  const handleSelectVisit = (visit: Visit) => {
    onSelectVisit(visit);
    onClose();
    setSearchQuery('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.visitModalContainer, { backgroundColor: dynamicTheme.pure }]} edges={['top']}>
        <View style={[styles.visitModalHeader, { borderBottomColor: dynamicTheme.borderLight }]}>
          <Text style={[styles.visitModalTitle, { color: dynamicTheme.navy }]}>{t('consultChat.visitSelection.title')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={dynamicTheme.navy} />
          </TouchableOpacity>
        </View>

        <View style={[styles.visitSearchContainer, { backgroundColor: dynamicTheme.surface }]}>
          <Search size={20} color={dynamicTheme.tertiary} />
          <TextInput
            style={[styles.visitSearchInput, { color: dynamicTheme.navy }]}
            placeholder={t('consultChat.visitSelection.searchPlaceholder')}
            placeholderTextColor={dynamicTheme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={dynamicTheme.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.visitsList} contentContainerStyle={styles.visitsListContent}>
          {filteredVisits.length > 0 ? (
            filteredVisits.map((visit) => (
              <TouchableOpacity
                key={visit.id}
                style={[styles.visitItem, { backgroundColor: dynamicTheme.surface }]}
                onPress={() => handleSelectVisit(visit)}
                activeOpacity={0.7}
              >
                <View style={[styles.visitIconContainer, { backgroundColor: dynamicTheme.brandLight }]}>
                  <FileCheck size={20} color={dynamicTheme.brand} />
                </View>
                <View style={styles.visitInfo}>
                  <Text style={[styles.visitPatientName, { color: dynamicTheme.navy }]}>{visit.patientName}</Text>
                  <Text style={[styles.visitDetails, { color: dynamicTheme.secondary }]}>
                    {visit.visitName} • {visit.type} • {visit.date}
                  </Text>
                </View>
                <View style={styles.visitArrow}>
                  <X size={16} color={dynamicTheme.tertiary} style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noVisitsContainer}>
              <FileCheck size={48} color={dynamicTheme.inactive} />
              <Text style={[styles.noVisitsText, { color: dynamicTheme.tertiary }]}>{t('consultChat.visitSelection.noVisits')}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const ContextFilesModal: React.FC<{
  visible: boolean;
  files: AttachedFile[];
  onClose: () => void;
  dynamicTheme: any;
}> = ({ visible, files, onClose, dynamicTheme }) => {
  const { t } = useTranslation();
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: dynamicTheme.pure }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalHeader, { borderBottomColor: dynamicTheme.borderLight }]}>
            <Text style={[styles.modalTitle, { color: dynamicTheme.navy }]}>{t('consultChat.contextFiles')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={dynamicTheme.navy} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalFilesList}>
            {files.length > 0 ? (
              files.map((file) => {
                const Icon = file.type === 'pdf' ? FileText : file.type === 'image' ? ImageIcon : file.type === 'visit' ? FileCheck : File;
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
                <Text style={[styles.modalEmptyText, { color: dynamicTheme.tertiary }]}>No files uploaded</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

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
}> = ({ value, onChangeText, onSend, onAttach, attachedFiles, onRemoveFile, placeholder, isLoading, dynamicTheme }) => {
  const canSend = (value.trim().length > 0 || attachedFiles.length > 0) && !isLoading;

  const handleSend = () => {
    if (canSend) {
      triggerHaptic('medium');
      onSend();
    }
  };

  return (
    <View style={[styles.inputBarWrapper, { 
      backgroundColor: dynamicTheme.pure,
      borderTopColor: dynamicTheme.borderLight
    }]}>
      {attachedFiles.length > 0 && (
        <View style={styles.attachedFilesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachedFiles.map((file) => (
              <FileChip key={file.id} file={file} onRemove={() => onRemoveFile(file.id)} dynamicTheme={dynamicTheme} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.inputBarContainer, { 
        backgroundColor: dynamicTheme.surfaceAlt,
        borderColor: dynamicTheme.borderLight
      }]}>
        <TouchableOpacity style={[styles.attachButton, { backgroundColor: dynamicTheme.pure }]} onPress={onAttach} activeOpacity={0.7}>
          <Plus size={22} color={dynamicTheme.secondary} strokeWidth={2} />
        </TouchableOpacity>

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

        {value.trim().length > 0 && (
          <TouchableOpacity
            style={[styles.sendButton, styles.sendButtonActive, { backgroundColor: dynamicTheme.brand }]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <ArrowUp size={18} color={dynamicTheme.pure} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ConsultChat: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const loggedInUser = userStore((state: any) => state.loggedInUser);

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState<AttachedFile[]>([]);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>(DEFAULT_CONSULT_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);

  const isEmptyState = messages.length === 0;

  const handleBack = () => navigation.goBack();
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
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    return newMessage.id;
  }, []);

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query && attachedFiles.length === 0) return;

    const userContent = attachedFiles.length > 0
      ? `${query}\n\n[Attached: ${attachedFiles.map(f => f.name).join(', ')}]`
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
      const { content, citations } = getMockConsultResponse(query);
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      addMessage('assistant', content, citations);
      setIsLoading(false);
    }, 2000 + Math.random() * 1500);
  };

  const handleAttach = () => {
    triggerHaptic('light');
    setShowAttachmentModal(true);
  };

  const handleImportVisit = () => {
    setShowVisitModal(true);
  };

  const handleSelectVisit = (visit: Visit) => {
    const visitFile: AttachedFile = {
      id: Date.now().toString(),
      name: `Visit: ${visit.patientName} - ${visit.date}`,
      type: 'visit',
      uri: `mock://visit/${visit.id}`,
    };
    setAttachedFiles((prev) => [...prev, visitFile]);
    triggerHaptic('light');
  };

  const handleFilePick = async () => {
    try {
      const result = await pick({ type: [types.pdf, types.docx, types.plainText] });
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
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
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
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
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
            <Text style={[styles.headerTitle, { color: DYNAMIC_THEME.brand }]}>{t('consultChat.title')}</Text>
            {contextFiles.length > 0 && (
              <Text style={[styles.headerSubtitle, { color: DYNAMIC_THEME.secondary }]}>
                {t('consultChat.filesLoaded', { count: contextFiles.length })}
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
              <History size={22} color={DYNAMIC_THEME.navy} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content area */}
        <View style={[styles.contentArea, { backgroundColor: DYNAMIC_THEME.pure }]}>
          {isEmptyState ? (
            <ScrollView
              contentContainerStyle={styles.emptyState}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <PulsingAILogo />
              <Text style={[styles.emptyStateGreeting, { color: DYNAMIC_THEME.navy }]}>{t('consultChat.greeting')}</Text>
              <Text style={[styles.emptyStateSubtext, { color: DYNAMIC_THEME.secondary }]}>{t('consultChat.subtitle')}</Text>
              <PulsingImportButton onPress={handleImportVisit} />
            </ScrollView>
          ) : (
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
          placeholder={t('consultChat.placeholder')}
          isLoading={isLoading}
          dynamicTheme={DYNAMIC_THEME}
        />
      </KeyboardAvoidingView>

      {/* Modals */}
      <AttachmentModal
        visible={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onImportVisit={handleImportVisit}
        onUploadPdf={handleFilePick}
        onScan={handleScan}
        onGallery={handleGallery}
        dynamicTheme={DYNAMIC_THEME}
      />

      <VisitSelectionModal
        visible={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        onSelectVisit={handleSelectVisit}
        dynamicTheme={DYNAMIC_THEME}
      />

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
  contentArea: {
    flex: 1,
  },
  emptyState: {
    flexGrow: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  importVisitPromptContainer: {
    alignItems: 'center',
    marginTop: hp(4),
  },
  pulsingButtonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#46B7C6', // Static brand color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  importVisitText: {
    fontSize: 15,
    marginTop: hp(2),
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  chatStream: {
    flex: 1,
  },
  chatStreamContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    paddingBottom: hp(4),
  },
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
    paddingTop: 28,
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
    backgroundColor: '#6B7280', // Static gray
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(2),
  },
  attachmentModalHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  attachmentModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  attachmentOptionsContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    gap: 12,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  attachmentOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  attachmentCancelButton: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  attachmentCancelText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  visitModalContainer: {
    flex: 1,
  },
  visitModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  visitModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  visitSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  visitSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  visitsList: {
    flex: 1,
  },
  visitsListContent: {
    padding: 16,
    paddingTop: 8,
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  visitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitInfo: {
    flex: 1,
  },
  visitPatientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  visitDetails: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  visitArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVisitsContainer: {
    alignItems: 'center',
    paddingVertical: hp(8),
  },
  noVisitsText: {
    fontSize: 15,
    marginTop: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  modalContent: {
    borderRadius: 20,
    width: '90%',
    maxHeight: hp(60),
    overflow: 'hidden',
    alignSelf: 'center',
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

export default ConsultChat;