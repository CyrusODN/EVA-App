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
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
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
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import Markdown from 'react-native-markdown-display';
import userStore from '../../store/user';
import PromptLibrary from '../../components/PromptLibrary';
import { useTheme } from '../../constants/theme';
import { customToast } from '../../utils/toastMessage';
import { getChatbotServiceToken } from '../../services/authService';
import {
  getPastConsultSessions,
  deleteConsultSession,
  getConsultSessionHistory,
  createConsultSession,
  sendConsultMessage,
  ConsultSession,
} from '../../services/clinicalToolService';
import { sessionStorage, Session } from '../../utils/sessionStorage';

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

// Note: MOCK_VISITS is replaced by real patient sessions from sessionStorage

// Default prompts for Remedius Consult
const DEFAULT_CONSULT_PROMPTS: CustomPrompt[] = [
  {
    id: 'p1',
    title: 'Differential Diagnosis',
    content:
      'Provide a comprehensive differential diagnosis with clinical reasoning.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    title: 'Treatment Plan',
    content:
      'Focus on evidence-based treatment recommendations and management strategies.',
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
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.aiLogoContainer}>
      <Animated.View
        style={[styles.aiLogoInner, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={{ uri: CHATBOT_AVATAR }} style={styles.avatarImage} />
      </Animated.View>
    </View>
  );
};

// Pulsing Import Button
const PulsingImportButton: React.FC<{
  onPress: () => void;
  dynamicTheme: any;
}> = ({ onPress, dynamicTheme }) => {
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
      ]),
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
        style={styles.pulsingButtonWrapper}>
        <Animated.View
          style={[styles.pulsingCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Plus size={36} color={THEME.pure} strokeWidth={2.5} />
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.importVisitText, { color: dynamicTheme.secondary }]}>
        {t('consultChat.importVisitPrompt')}
      </Text>
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
    customToast('success', 'Copied', 'Message copied to clipboard');
  };

  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
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
        ]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: CHATBOT_AVATAR }}
            style={styles.assistantAvatar}
          />
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
      ]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: CHATBOT_AVATAR }}
            style={styles.assistantAvatar}
          />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: dynamicTheme.userBubble }]
            : [
                styles.assistantBubble,
                {
                  backgroundColor: dynamicTheme.pure,
                  borderColor: dynamicTheme.borderLight,
                  shadowColor: '#000',
                },
              ],
        ]}>
        {!isUser && (
          <TouchableOpacity
            style={[
              styles.copyButton,
              { backgroundColor: dynamicTheme.brandMedium },
            ]}
            onPress={handleCopy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}>
            <Copy size={14} color={dynamicTheme.brand} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {isUser ? (
          <Text
            style={[
              styles.messageText,
              styles.userMessageText,
              { color: dynamicTheme.navy },
            ]}>
            {message.content}
          </Text>
        ) : (
          <Markdown style={markdownStyles(dynamicTheme)}>
            {message.content}
          </Markdown>
        )}

        {message.citations && message.citations.length > 0 && (
          <View
            style={[
              styles.citationsContainer,
              { borderTopColor: dynamicTheme.borderLight },
            ]}>
            <Text
              style={[styles.citationsLabel, { color: dynamicTheme.tertiary }]}>
              Sources
            </Text>
            {message.citations.map((citation, index) => (
              <TouchableOpacity
                key={citation.id}
                style={[
                  styles.citationChip,
                  { backgroundColor: dynamicTheme.surfaceAlt },
                ]}
                onPress={() => onCitationPress?.(citation)}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.citationNumber,
                    { backgroundColor: dynamicTheme.brandMedium },
                  ]}>
                  <Text
                    style={[
                      styles.citationNumberText,
                      { color: dynamicTheme.brand },
                    ]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.citationContent}>
                  <Text
                    style={[styles.citationTitle, { color: dynamicTheme.navy }]}
                    numberOfLines={1}>
                    {citation.title}
                  </Text>
                  <Text
                    style={[
                      styles.citationSource,
                      { color: dynamicTheme.tertiary },
                    ]}
                    numberOfLines={1}>
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
        ]),
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
      case 'visit':
        return FileCheck;
      default:
        return File;
    }
  };
  const Icon = getIcon();

  return (
    <View
      style={[styles.fileChip, { backgroundColor: dynamicTheme.brandLight }]}>
      <Icon size={14} color={dynamicTheme.brand} />
      <Text
        style={[styles.fileChipName, { color: dynamicTheme.navy }]}
        numberOfLines={1}>
        {file.name}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
}> = ({
  visible,
  onClose,
  onImportVisit,
  onUploadPdf,
  onScan,
  onGallery,
  dynamicTheme,
}) => {
  const { t } = useTranslation();

  const options = [
    {
      icon: FileCheck,
      label: t('consultChat.attachOptions.importVisit'),
      onPress: onImportVisit,
      color: dynamicTheme.brand,
    },
    {
      icon: FileText,
      label: t('consultChat.attachOptions.uploadPdf'),
      onPress: onUploadPdf,
      color: '#8B5CF6',
    },
    {
      icon: Camera,
      label: t('consultChat.attachOptions.scan'),
      onPress: onScan,
      color: '#10B981',
      disabled: true,
    },
    {
      icon: FolderOpen,
      label: t('consultChat.attachOptions.gallery'),
      onPress: onGallery,
      color: '#F59E0B',
      disabled: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.attachmentModalContent,
            { backgroundColor: dynamicTheme.pure },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.attachmentModalHeader}>
            <View
              style={[
                styles.attachmentModalHandle,
                { backgroundColor: dynamicTheme.inactive },
              ]}
            />
          </View>

          <View style={styles.attachmentOptionsContainer}>
            {options.map((option, index) => {
              const Icon = option.icon;
              const isDisabled = (option as any).disabled;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.attachmentOption,
                    { backgroundColor: dynamicTheme.surface },
                    isDisabled && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    option.onPress();
                    onClose();
                  }}
                  activeOpacity={isDisabled ? 1 : 0.7}
                  disabled={isDisabled}>
                  <View
                    style={[
                      styles.attachmentOptionIcon,
                      {
                        backgroundColor: isDisabled
                          ? dynamicTheme.borderLight || '#E5E7EB'
                          : `${option.color}15`,
                      },
                    ]}>
                    <Icon
                      size={24}
                      color={
                        isDisabled
                          ? dynamicTheme.inactive || '#9CA3AF'
                          : option.color
                      }
                      strokeWidth={2}
                    />
                  </View>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={[
                        styles.attachmentOptionLabel,
                        {
                          color: isDisabled
                            ? dynamicTheme.inactive || '#9CA3AF'
                            : dynamicTheme.navy,
                        },
                      ]}>
                      {option.label}
                    </Text>
                    {isDisabled && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: dynamicTheme.brand,
                          fontWeight: '600',
                        }}>
                        Coming soon
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.attachmentCancelButton,
              { backgroundColor: dynamicTheme.surfaceAlt },
            ]}
            onPress={onClose}>
            <Text
              style={[
                styles.attachmentCancelText,
                { color: dynamicTheme.secondary },
              ]}>
              {t('consultChat.attachOptions.cancel')}
            </Text>
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
  onSelectVisit: (session: Session) => void;
  dynamicTheme: any;
}> = ({ visible, onClose, onSelectVisit, dynamicTheme }) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientSessions, setPatientSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load patient sessions when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadPatientSessions();
    }
  }, [visible]);

  const loadPatientSessions = async () => {
    setIsLoading(true);
    try {
      const sessions = await sessionStorage.getSessionsByType('patient');
      // Filter to only show transcribed and completed sessions
      const filteredByStatus = sessions.filter(
        (s) => s.status === 'transcribed' || s.status === 'completed',
      );
      // Sort by date descending (most recent first)
      filteredByStatus.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setPatientSessions(filteredByStatus);
    } catch (error) {
      console.error('[VisitSelectionModal] Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = patientSessions.filter((session) => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.status.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const locale = i18n.language || 'en-US';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('status.completed') || 'Completed';
      case 'transcribed':
        return t('status.transcribed') || 'Transcribed';
      case 'recorded':
        return t('status.recorded') || 'Recorded';
      case 'new':
        return t('status.new') || 'New';
      default:
        return status;
    }
  };

  const handleSelectSession = (session: Session) => {
    onSelectVisit(session);
    onClose();
    setSearchQuery('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView
        style={[
          styles.visitModalContainer,
          { backgroundColor: dynamicTheme.pure },
        ]}
        edges={['top']}>
        <View
          style={[
            styles.visitModalHeader,
            { borderBottomColor: dynamicTheme.borderLight },
          ]}>
          <Text style={[styles.visitModalTitle, { color: dynamicTheme.navy }]}>
            {t('consultChat.visitSelection.title')}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={dynamicTheme.navy} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.visitSearchContainer,
            { backgroundColor: dynamicTheme.surface },
          ]}>
          <Search size={20} color={dynamicTheme.tertiary} />
          <TextInput
            style={[styles.visitSearchInput, { color: dynamicTheme.navy }]}
            placeholder={t('consultChat.visitSelection.searchPlaceholder')}
            placeholderTextColor={dynamicTheme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={dynamicTheme.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View
            style={{
              padding: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ActivityIndicator color={dynamicTheme.brand} size="large" />
          </View>
        ) : (
          <ScrollView
            style={styles.visitsList}
            contentContainerStyle={styles.visitsListContent}>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.visitItem,
                    { backgroundColor: dynamicTheme.surface },
                  ]}
                  onPress={() => handleSelectSession(session)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.visitIconContainer,
                      { backgroundColor: dynamicTheme.brandLight },
                    ]}>
                    <FileCheck size={20} color={dynamicTheme.brand} />
                  </View>
                  <View style={styles.visitInfo}>
                    <Text
                      style={[
                        styles.visitPatientName,
                        { color: dynamicTheme.navy },
                      ]}>
                      {session.title}
                    </Text>
                    <Text
                      style={[
                        styles.visitDetails,
                        { color: dynamicTheme.secondary },
                      ]}>
                      {formatDate(session.date)} •{' '}
                      {getStatusLabel(session.status)}
                      {session.duration ? ` • ${session.duration}` : ''}
                    </Text>
                  </View>
                  <View style={styles.visitArrow}>
                    <ChevronRight size={18} color={dynamicTheme.tertiary} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noVisitsContainer}>
                <FileCheck size={48} color={dynamicTheme.inactive} />
                <Text
                  style={[
                    styles.noVisitsText,
                    { color: dynamicTheme.tertiary },
                  ]}>
                  {t('consultChat.visitSelection.noVisits')}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const PastSessionsModal: React.FC<{
  visible: boolean;
  sessions: ConsultSession[];
  onClose: () => void;
  onSelectSession: (session: ConsultSession) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading: boolean;
  dynamicTheme: any;
}> = ({
  visible,
  sessions,
  onClose,
  onSelectSession,
  onDeleteSession,
  isLoading,
  dynamicTheme,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: dynamicTheme.pure }]}
          onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: dynamicTheme.borderLight },
            ]}>
            <Text style={[styles.modalTitle, { color: dynamicTheme.navy }]}>
              {t('consultChat.pastConversations') || 'Past Conversations'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={dynamicTheme.navy} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View
              style={{
                padding: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ActivityIndicator color={dynamicTheme.brand} size="large" />
            </View>
          ) : (
            <ScrollView style={styles.modalFilesList}>
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <View
                    key={session._id}
                    style={[
                      styles.modalFileItem,
                      {
                        borderBottomWidth: 1,
                        borderBottomColor: dynamicTheme.borderLight,
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                      },
                    ]}>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                      }}
                      onPress={() => onSelectSession(session)}
                      activeOpacity={0.7}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: dynamicTheme.brandLight,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <History size={18} color={dynamicTheme.brand} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            styles.modalFileName,
                            { color: dynamicTheme.navy, fontWeight: '600' },
                          ]}
                          numberOfLines={1}>
                          {session.title || 'Untitled Conversation'}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 2,
                          }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: dynamicTheme.brand,
                              fontWeight: '500',
                            }}>
                            #{session._id.substring(0, 7)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: dynamicTheme.tertiary,
                              marginLeft: 8,
                            }}>
                            {new Date(session.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeleteSession(session.sessionId)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ padding: 8, marginRight: 4 }}>
                      <Trash2 size={18} color={dynamicTheme.error} />
                    </TouchableOpacity>
                    <ChevronRight size={18} color={dynamicTheme.tertiary} />
                  </View>
                ))
              ) : (
                <View style={[styles.modalEmptyState, { padding: 40 }]}>
                  <History size={32} color={dynamicTheme.tertiary} />
                  <Text
                    style={[
                      styles.modalEmptyText,
                      {
                        color: dynamicTheme.tertiary,
                        marginTop: 12,
                        textAlign: 'center',
                      },
                    ]}>
                    No past conversations found
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Specialty options for new consultation session
const getSpecialtyOptions = (t: any) => [
  {
    id: 'childPsychiatry',
    label: t('consultChat.specialtySelection.specialties.childPsychiatry'),
  },
  {
    id: 'adultPsychiatry',
    label: t('consultChat.specialtySelection.specialties.adultPsychiatry'),
  },
  {
    id: 'internalMedicine',
    label: t('consultChat.specialtySelection.specialties.internalMedicine'),
  },
];

// Specialty Selection Modal
const SpecialtySelectionModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectSpecialty: (specialtyId: string) => void;
  isLoading: boolean;
  dynamicTheme: any;
}> = ({ visible, onClose, onSelectSpecialty, isLoading, dynamicTheme }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<string>('adultPsychiatry');

  const handleStartConsultation = () => {
    onSelectSpecialty(selectedSpecialty);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View
        style={[
          styles.modalOverlay,
          { justifyContent: 'center', alignItems: 'center' },
        ]}>
        <View
          style={[
            styles.specialtyModalContent,
            { backgroundColor: dynamicTheme.pure },
          ]}>
          {/* Header */}
          <View style={styles.specialtyModalHeader}>
            <Text
              style={[
                styles.specialtyModalTitle,
                { color: dynamicTheme.navy },
              ]}>
              {t('consultChat.specialtySelection.title')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={dynamicTheme.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text
            style={[
              styles.specialtyModalSubtitle,
              { color: dynamicTheme.secondary },
            ]}>
            {t('consultChat.specialtySelection.subtitle')}
          </Text>

          {/* Dropdown/Picker Label */}
          <Text style={[styles.specialtyLabel, { color: dynamicTheme.navy }]}>
            {t('consultChat.specialtySelection.label')}
          </Text>

          {/* Specialty List */}
          <View
            style={[
              styles.specialtyDropdown,
              {
                backgroundColor: dynamicTheme.borderLight,
                borderColor: dynamicTheme.borderLight,
              },
            ]}>
            <ScrollView
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 1 }}>
              {getSpecialtyOptions(t).map((specialty) => (
                <TouchableOpacity
                  key={specialty.id}
                  style={[
                    styles.specialtyOption,
                    { backgroundColor: dynamicTheme.pure },
                    selectedSpecialty === specialty.id && {
                      backgroundColor: isDark
                        ? dynamicTheme.brandLight
                        : '#F0F9FA',
                    },
                  ]}
                  onPress={() => setSelectedSpecialty(specialty.id)}
                  activeOpacity={0.7}>
                  <View style={styles.specialtyOptionRow}>
                    {selectedSpecialty === specialty.id && (
                      <Text
                        style={[
                          styles.specialtyCheckmark,
                          { color: dynamicTheme.brand },
                        ]}>
                        ✓
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.specialtyOptionText,
                        { color: dynamicTheme.navy },
                        selectedSpecialty === specialty.id && {
                          fontWeight: '600',
                        },
                      ]}>
                      {specialty.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.specialtyButtonRow}>
            <TouchableOpacity
              style={[
                styles.specialtyCancelButton,
                { borderColor: dynamicTheme.borderLight },
              ]}
              onPress={onClose}
              disabled={isLoading}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.specialtyCancelText,
                  { color: dynamicTheme.navy },
                ]}>
                {t('consultChat.specialtySelection.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.specialtyStartButton,
                { backgroundColor: dynamicTheme.brand },
              ]}
              onPress={handleStartConsultation}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.specialtyStartText}>
                  {t('consultChat.specialtySelection.start')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: dynamicTheme.pure }]}
          onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: dynamicTheme.borderLight },
            ]}>
            <Text style={[styles.modalTitle, { color: dynamicTheme.navy }]}>
              {t('consultChat.contextFiles')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={dynamicTheme.navy} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalFilesList}>
            {files.length > 0 ? (
              files.map((file) => {
                const Icon =
                  file.type === 'pdf'
                    ? FileText
                    : file.type === 'image'
                    ? ImageIcon
                    : file.type === 'visit'
                    ? FileCheck
                    : File;
                return (
                  <View key={file.id} style={styles.modalFileItem}>
                    <Icon size={18} color={dynamicTheme.brand} />
                    <Text
                      style={[
                        styles.modalFileName,
                        { color: dynamicTheme.navy },
                      ]}>
                      {file.name}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.modalEmptyState}>
                <FolderOpen size={32} color={dynamicTheme.tertiary} />
                <Text
                  style={[
                    styles.modalEmptyText,
                    { color: dynamicTheme.tertiary },
                  ]}>
                  No files uploaded
                </Text>
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
  const inputRef = useRef<TextInput>(null);
  const canSend =
    (value.trim().length > 0 || attachedFiles.length > 0) && !isLoading;

  const handleSend = () => {
    if (canSend) {
      triggerHaptic('medium');
      onSend();
      // Re-focus input to keep keyboard open
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <View
      style={[
        styles.inputBarWrapper,
        {
          backgroundColor: dynamicTheme.pure,
          borderTopColor: dynamicTheme.borderLight,
        },
      ]}>
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

      <View
        style={[
          styles.inputBarContainer,
          {
            backgroundColor: dynamicTheme.surfaceAlt,
            borderColor: dynamicTheme.borderLight,
          },
        ]}>
        <TouchableOpacity
          style={[styles.attachButton, { backgroundColor: dynamicTheme.pure }]}
          onPress={onAttach}
          activeOpacity={0.7}>
          <Plus size={22} color={dynamicTheme.secondary} strokeWidth={2} />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
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
            style={[
              styles.sendButton,
              styles.sendButtonActive,
              {
                backgroundColor: canSend
                  ? dynamicTheme.brand
                  : dynamicTheme.inactive,
              },
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}>
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
  const route = useRoute<any>();
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
  const [inputText, setInputText] = useState(route.params?.transcription || '');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState<AttachedFile[]>([]);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>(
    DEFAULT_CONSULT_PROMPTS,
  );
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [chatbotToken, setChatbotToken] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ConsultSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null,
  );
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch chatbot service token on mount
  useEffect(() => {
    const fetchChatbotToken = async () => {
      try {
        console.log('[ConsultChat] Fetching chatbot service token...');
        const response = await getChatbotServiceToken();

        if (response.data?.success && response.data?.data?.serviceToken) {
          setChatbotToken(response.data.data.serviceToken);
          console.log('[ConsultChat] Chatbot token fetched successfully');
        } else {
          console.error('[ConsultChat] Invalid token response:', response.data);
        }
      } catch (error: any) {
        console.error('[ConsultChat] Error fetching chatbot token:', error);
        console.error(
          '[ConsultChat] Error details:',
          error.response?.data || error.message,
        );
      }
    };

    fetchChatbotToken();
  }, []);

  const isEmptyState = messages.length === 0;

  const handleBack = () => navigation.goBack();
  const handleViewFiles = () => {
    triggerHaptic('light');
    setShowContextModal(true);
  };

  const handleNewSession = () => {
    triggerHaptic('light');
    setShowSpecialtyModal(true);
  };

  const handleCreateSession = async (specialtyId: string) => {
    if (!loggedInUser || !chatbotToken) {
      customToast(
        'error',
        'Authentication Error',
        'Please login again to create a session.',
      );
      return;
    }

    setIsCreatingSession(true);
    try {
      const userId = loggedInUser.id || loggedInUser._id;
      console.log(
        '[ConsultChat] Creating session with specialty:',
        specialtyId,
      );

      const response = await createConsultSession(
        userId,
        specialtyId,
        chatbotToken,
      );

      if (response.data?.success && response.data?.data?.sessionId) {
        setCurrentSessionId(response.data.data.sessionId);
        setSelectedSpecialty(specialtyId);
        const specialtyLabel =
          getSpecialtyOptions(t).find((s: any) => s.id === specialtyId)
            ?.label || specialtyId;

        // Start the chat with a greeting
        setMessages([
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: t('consultChat.defaultMessage', {
              specialty: specialtyLabel,
            }),
            timestamp: new Date(),
          },
        ]);

        setShowSpecialtyModal(false);
        customToast(
          'success',
          t('consultChat.toast.sessionCreated'),
          t('consultChat.toast.startedConsultation', {
            specialty: specialtyLabel,
          }),
        );
        console.log(
          '[ConsultChat] Session created:',
          response.data.data.sessionId,
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('[ConsultChat] Error creating session:', error);
      customToast(
        'error',
        t('common.error'),
        t('consultChat.toast.createError'),
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const addMessage = useCallback(
    (role: MessageRole, content: string, citations?: Citation[]) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role,
        content,
        citations,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
      return newMessage.id;
    },
    [],
  );

  const handleSelectSession = async (session: ConsultSession) => {
    if (!chatbotToken) {
      customToast('error', 'Authentication Error', 'Please try again.');
      return;
    }

    try {
      setShowSessionsModal(false);
      setIsLoading(true);

      console.log(
        '[ConsultChat] Fetching session history for:',
        session.sessionId,
      );
      const response = await getConsultSessionHistory(
        session.sessionId,
        chatbotToken,
      );

      if (response.data?.success && response.data?.data?.messages) {
        const fetchedMessages = response.data.data.messages;
        const formattedMessages: Message[] = fetchedMessages.map(
          (msg: any) => ({
            id: msg._id || Math.random().toString(),
            role: msg.role as MessageRole,
            content: msg.content,
            timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()),
          }),
        );

        setMessages(formattedMessages);
        setCurrentSessionId(session.sessionId);

        // Set specialty from metadata if available
        if (response.data.data.metadata?.speciality) {
          setSelectedSpecialty(response.data.data.metadata.speciality);
        }

        console.log(
          '[ConsultChat] Loaded',
          formattedMessages.length,
          'messages from session:',
          session.sessionId,
        );
        customToast(
          'success',
          'Conversation Loaded',
          'History has been successfully loaded',
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('[ConsultChat] Error fetching session history:', error);
      console.error('[ConsultChat] Error details:', error.response?.data);
      customToast('error', 'Error', 'Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    console.log(
      '[ConsultChat] handleDeleteSession called with sessionId:',
      sessionId,
    );
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log(
              '[ConsultChat] Delete confirmed for sessionId:',
              sessionId,
            );
            if (!chatbotToken) {
              console.error(
                '[ConsultChat] No chatbot token available for delete',
              );
              customToast(
                'error',
                'Authentication Error',
                'Session token not found.',
              );
              return;
            }
            try {
              console.log('[ConsultChat] Calling deleteConsultSession API...');
              const response = await deleteConsultSession(
                sessionId,
                chatbotToken,
              );
              console.log(
                '[ConsultChat] Delete API response:',
                JSON.stringify(response.data),
              );
              setPastSessions((prev) =>
                prev.filter((s) => s.sessionId !== sessionId),
              );
              customToast(
                'success',
                'Deleted',
                'Conversation has been deleted',
              );
              triggerHaptic('light');
            } catch (error: any) {
              console.error('[ConsultChat] Error deleting session:', error);
              console.error(
                '[ConsultChat] Delete error status:',
                error.response?.status,
              );
              console.error(
                '[ConsultChat] Delete error data:',
                JSON.stringify(error.response?.data),
              );
              customToast(
                'error',
                'Error',
                error.response?.data?.message ||
                  'Failed to delete conversation',
              );
            }
          },
        },
      ],
    );
  };

  const handleViewHistory = async () => {
    triggerHaptic('light');
    if (!loggedInUser || !chatbotToken) {
      customToast('error', 'Authentication Error', 'Please try again.');
      return;
    }

    setShowSessionsModal(true);
    setIsLoadingSessions(true);

    try {
      const userId = loggedInUser.id || loggedInUser._id;
      console.log('[ConsultChat] Fetching past sessions for user:', userId);
      const response = await getPastConsultSessions(userId, chatbotToken);

      if (response.data?.success) {
        setPastSessions(response.data.data);
        console.log(
          '[ConsultChat] Fetched sessions count:',
          response.data.data.length,
        );
      } else {
        console.error('[ConsultChat] Failed to fetch sessions:', response.data);
      }
    } catch (error: any) {
      console.error('[ConsultChat] Error fetching history:', error);
      customToast(
        'error',
        'Connection Error',
        'Failed to load past conversations',
      );
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query && attachedFiles.length === 0) return;

    if (!currentSessionId) {
      customToast(
        'info',
        'New Session',
        'Please start a new consultation session first.',
      );
      setShowSpecialtyModal(true);
      return;
    }

    if (!chatbotToken) {
      customToast('error', 'Authentication Error', 'Session token not found.');
      return;
    }

    const userContent =
      attachedFiles.length > 0
        ? `${query}\n\n[Attached: ${attachedFiles
            .map((f) => f.name)
            .join(', ')}]`
        : query;
    addMessage('user', userContent);

    if (attachedFiles.length > 0) {
      setContextFiles((prev) => [...prev, ...attachedFiles]);
    }

    setInputText('');
    setAttachedFiles([]);

    setIsLoading(true);
    const loadingId = Date.now().toString() + '-loading';
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      // Map existing messages to history format (excluding current message)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendConsultMessage(
        currentSessionId,
        query || '[Attached Files]',
        chatbotToken,
        {
          history,
          // You can add additional fields like symptoms or patientInfo if you have them in state
        },
      );

      setMessages((prev) => prev.filter((m) => m.id !== loadingId));

      if (response.data?.success) {
        addMessage(
          'assistant',
          response.data.data.message,
          response.data.data.sources,
        );
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('[ConsultChat] Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      customToast('error', 'Error', 'Failed to get response from assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttach = () => {
    triggerHaptic('light');
    setShowAttachmentModal(true);
  };

  const handleImportVisit = () => {
    setShowVisitModal(true);
  };

  const handleSelectVisit = (session: Session) => {
    const visitFile: AttachedFile = {
      id: Date.now().toString(),
      name: `Visit: ${session.title} - ${new Date(
        session.date,
      ).toLocaleDateString()}`,
      type: 'visit',
      uri: `session://${session.id}`,
    };
    setAttachedFiles((prev) => [...prev, visitFile]);

    // If session has transcription, add it to context
    if (session.transcriptText) {
      addMessage(
        'user',
        `Based on the following patient visit transcription, please provide clinical insights:\n\n${session.transcriptText}`,
      );
    }

    customToast(
      'success',
      'Visit Imported',
      `${session.title} has been imported`,
    );
    triggerHaptic('light');
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
    setCustomPrompts((prev) => [newPrompt, ...prev]);
    setSelectedPromptId(newPrompt.id);
    triggerHaptic('medium');
  };

  const handleSelectPrompt = (prompt: CustomPrompt) => {
    setSelectedPromptId((prev) => (prev === prompt.id ? null : prompt.id));
    setShowPromptLibrary(false);
  };

  const handleDeletePrompt = (id: string) => {
    setCustomPrompts((prev) => prev.filter((p) => p.id !== id));
    if (selectedPromptId === id) setSelectedPromptId(null);
  };

  const selectedPrompt = customPrompts.find((p) => p.id === selectedPromptId);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: DYNAMIC_THEME.pure }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: DYNAMIC_THEME.pure,
              borderBottomColor: DYNAMIC_THEME.borderLight,
            },
          ]}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <ChevronLeft size={24} color={DYNAMIC_THEME.navy} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: DYNAMIC_THEME.brand }]}>
              {t('consultChat.title')}
            </Text>
            {contextFiles.length > 0 && (
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: DYNAMIC_THEME.secondary },
                ]}>
                {t('consultChat.filesLoaded', { count: contextFiles.length })}
              </Text>
            )}
            {selectedPrompt && (
              <Text
                style={[
                  styles.headerPromptBadge,
                  {
                    color: DYNAMIC_THEME.brand,
                    backgroundColor: DYNAMIC_THEME.brandLight,
                  },
                ]}
                numberOfLines={1}>
                {selectedPrompt.title}
              </Text>
            )}
          </View>

          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              onPress={handleNewSession}
              style={styles.headerButton}>
              <Plus size={22} color={DYNAMIC_THEME.navy} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPromptLibrary(true)}
              style={styles.headerButton}>
              <Sparkles size={20} color={DYNAMIC_THEME.brand} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleViewHistory}
              style={styles.headerButton}>
              <History size={22} color={DYNAMIC_THEME.navy} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content area */}
        <View
          style={[styles.contentArea, { backgroundColor: DYNAMIC_THEME.pure }]}>
          {isEmptyState ? (
            <ScrollView
              contentContainerStyle={styles.emptyState}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <PulsingAILogo />
              <Text
                style={[
                  styles.emptyStateGreeting,
                  { color: DYNAMIC_THEME.navy },
                ]}>
                {t('consultChat.greeting')}
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: DYNAMIC_THEME.secondary },
                ]}>
                {t('consultChat.subtitle')}
              </Text>
              <PulsingImportButton
                onPress={handleImportVisit}
                dynamicTheme={DYNAMIC_THEME}
              />
            </ScrollView>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatStream}
              contentContainerStyle={styles.chatStreamContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
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

      <PastSessionsModal
        visible={showSessionsModal}
        sessions={pastSessions}
        onClose={() => setShowSessionsModal(false)}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        isLoading={isLoadingSessions}
        dynamicTheme={DYNAMIC_THEME}
      />

      <ContextFilesModal
        visible={showContextModal}
        files={contextFiles}
        onClose={() => setShowContextModal(false)}
        dynamicTheme={DYNAMIC_THEME}
      />

      <SpecialtySelectionModal
        visible={showSpecialtyModal}
        onClose={() => setShowSpecialtyModal(false)}
        onSelectSpecialty={handleCreateSession}
        isLoading={isCreatingSession}
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
  userMessageText: {},
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
  sendButtonActive: {},
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
  // Specialty Modal Styles
  specialtyModalContent: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  specialtyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specialtyModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  specialtyModalSubtitle: {
    fontSize: 15,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  specialtyLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  specialtyDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  specialtyOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  specialtyOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialtyCheckmark: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  specialtyOptionText: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  specialtyButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  specialtyCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialtyCancelText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'center',
  },
  specialtyStartButton: {
    flex: 1.5, // Give more room to the action button
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialtyStartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'center',
  },
});

export default ConsultChat;
