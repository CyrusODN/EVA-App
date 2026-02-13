import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import researchService from '../../services/researchService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from '../../services/socketService';
import { customToast } from '../../utils/toastMessage';

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

// ============================================================================
// HAPTICS HELPER
// ============================================================================
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  const duration = type === 'light' ? 5 : type === 'medium' ? 10 : 20;
  Vibration.vibrate(duration);
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
      ]),
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
      ]),
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
      <Animated.View
        style={[styles.aiLogoInner, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={{ uri: CHATBOT_AVATAR }} style={styles.avatarImage} />
      </Animated.View>
    </View>
  );
};

// Pulsing Upload Button
const PulsingUploadButton: React.FC<{
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
    <View style={styles.uploadPromptContainer}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.pulsingButtonWrapper}>
        <Animated.View
          style={[
            styles.pulsingCircle,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: dynamicTheme.brand,
            },
          ]}>
          <Plus size={36} color="#FFFFFF" strokeWidth={2.5} />
        </Animated.View>
      </TouchableOpacity>
      <Text
        style={[styles.uploadPromptText, { color: dynamicTheme.secondary }]}>
        {t('researchChat.noFilesUploaded')}
      </Text>
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
    style={[
      styles.suggestionChip,
      {
        backgroundColor: dynamicTheme.pure,
        borderColor: dynamicTheme.borderLight,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Icon size={14} color={dynamicTheme.brand} strokeWidth={2} />
    <Text style={[styles.suggestionChipText, { color: dynamicTheme.navy }]}>
      {text}
    </Text>
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
        {/* Copy button for assistant messages */}
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
          <Markdown style={getMarkdownStyles(dynamicTheme)}>
            {message.content}
          </Markdown>
        )}

        {/* Citations */}
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
        ]),
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
  onPress?: () => void;
  dynamicTheme: any;
}> = ({ file, onRemove, onPress, dynamicTheme }) => {
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
    <TouchableOpacity
      style={[styles.fileChip, { backgroundColor: dynamicTheme.brandLight }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
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
    </TouchableOpacity>
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
              {t('researchChat.contextFiles')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={dynamicTheme.navy} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalFilesList}>
            {files.length > 0 ? (
              files.map((file, index) => {
                const Icon =
                  file.type === 'pdf'
                    ? FileText
                    : file.type === 'image'
                    ? ImageIcon
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

// Attachment Modal with styled options
const AttachmentModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onUploadPdf: () => void;
  onScan: () => void;
  onGallery: () => void;
  dynamicTheme: any;
}> = ({ visible, onClose, onUploadPdf, onScan, onGallery, dynamicTheme }) => {
  const { t } = useTranslation();

  const options = [
    {
      icon: FileText,
      label: t('researchChat.attachOptions.uploadPdf'),
      onPress: onUploadPdf,
      color: '#8B5CF6',
    },
    {
      icon: Camera,
      label: t('researchChat.attachOptions.scan'),
      onPress: onScan,
      color: '#10B981',
      disabled: true,
    },
    {
      icon: FolderOpen,
      label: t('researchChat.attachOptions.gallery'),
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.attachmentModalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.attachmentModalContent,
                { backgroundColor: dynamicTheme.pure },
              ]}>
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
                        onClose();
                        setTimeout(() => option.onPress(), 300);
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
                  {t('researchChat.attachOptions.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  contextFiles: AttachedFile[];
  onRemoveFile: (id: string) => void;
  onRemoveContextFile: (id: string) => void;
  onPreviewFile: (file: AttachedFile) => void;
  placeholder: string;
  isLoading: boolean;
  dynamicTheme: any;
  hasContextFiles: boolean;
  isDark: boolean;
  isEmptyState: boolean;
}> = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  attachedFiles,
  contextFiles,
  onRemoveFile,
  onRemoveContextFile,
  onPreviewFile,
  placeholder,
  isLoading,
  dynamicTheme,
  hasContextFiles,
  isDark,
  isEmptyState,
}) => {
  const inputRef = useRef<TextInput>(null);
  const hasDocument = hasContextFiles || attachedFiles.length > 0;
  const isAttachDisabled = !hasDocument || isEmptyState;
  const canSend =
    hasDocument &&
    (value.trim().length > 0 || attachedFiles.length > 0) &&
    !isLoading;

  const handleSend = () => {
    if (canSend) {
      triggerHaptic('medium');
      onSend();
      // Re-focus input to keep keyboard open
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleAttach = () => {
    triggerHaptic('light');
    onAttach();
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
      {/* Attached and Context files preview */}
      {(attachedFiles.length > 0 || contextFiles.length > 0) && (
        <View style={styles.attachedFilesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Show uploaded context files first */}
            {contextFiles.map((file) => (
              <FileChip
                key={file.id}
                file={file}
                onRemove={() => onRemoveContextFile(file.id)}
                onPress={() => onPreviewFile(file)}
                dynamicTheme={dynamicTheme}
              />
            ))}
            {/* Show local attached files */}
            {attachedFiles.map((file) => (
              <FileChip
                key={file.id}
                file={file}
                onRemove={() => onRemoveFile(file.id)}
                onPress={() => onPreviewFile(file)}
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
            backgroundColor: hasDocument
              ? dynamicTheme.surfaceAlt
              : dynamicTheme.surface,
            borderColor: hasDocument
              ? dynamicTheme.borderLight
              : isDark
              ? dynamicTheme.border
              : '#E2E8F0',
            opacity: hasDocument ? 1 : 0.9,
            borderStyle: hasDocument ? 'solid' : 'dashed',
          },
        ]}>
        {/* Attach button */}
        <TouchableOpacity
          style={[styles.attachButton, { backgroundColor: dynamicTheme.pure }]}
          onPress={onAttach}
          activeOpacity={0.7}>
          <Plus
            size={22}
            color={hasDocument ? dynamicTheme.secondary : dynamicTheme.brand}
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            { color: dynamicTheme.navy, opacity: hasDocument ? 1 : 0.7 },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dynamicTheme.placeholder}
          multiline
          maxLength={4000}
          textAlignVertical="center"
          editable={hasDocument}
        />

        {/* Send button */}
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
const ResearchChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();

  const mode: ResearchMode = route.params?.mode || 'general';
  const toolType = mode === 'protocol' ? 'protocol' : 'scholar';
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
  const userName =
    loggedInUser?.firstName || loggedInUser?.name?.split(' ')[0] || 'Doctor';

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState<AttachedFile[]>([]);
  const [showContextModal, setShowContextModal] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  // Ref to track accumulated streaming content to avoid closure issues in socket callbacks
  const streamingContentRef = useRef<string>('');
  const lastUpdateRef = useRef<number>(0);
  const [serviceToken, setServiceToken] = useState<string | null>(null);

  // Fetch main auth token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('[ResearchChat] Retrieving auth token...');
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          setServiceToken(token);
          console.log('[ResearchChat] Auth token retrieved successfully');
        } else {
          console.error('[ResearchChat] No auth token found in storage');
        }
      } catch (error) {
        console.error('[ResearchChat] Error retrieving auth token:', error);
      }
    };
    fetchToken();
  }, []);

  // Fetch prompts from API
  useEffect(() => {
    const fetchPrompts = async () => {
      if (!serviceToken) return;

      setIsLoadingPrompts(true);
      console.log(
        `[ResearchChat] Fetching prompts for toolType: ${toolType}...`,
      );

      try {
        const response = await researchService.getPrompts(
          toolType,
          serviceToken,
        );
        console.log(
          '[ResearchChat] Prompts API Response:',
          JSON.stringify(response.data, null, 2),
        );

        if (response.data.success) {
          let promptsData = [];

          if (response.data.data?.docs) {
            promptsData = response.data.data.docs;
          } else if (Array.isArray(response.data.data)) {
            promptsData = response.data.data;
          }

          if (promptsData.length > 0) {
            const formatted: CustomPrompt[] = promptsData.map((p: any) => ({
              id: p._id || p.id,
              title: p.title || 'Untitled Prompt',
              content: p.content || p.instructions || '',
              createdAt: p.createdAt || new Date().toISOString(),
            }));
            console.log(
              `[ResearchChat] Successfully loaded ${formatted.length} prompts`,
            );
            setCustomPrompts(formatted);
          } else {
            console.log('[ResearchChat] No prompts found in response');
            setCustomPrompts([]);
          }
        } else {
          console.error(
            '[ResearchChat] Failed to fetch prompts:',
            response.data.message,
          );
        }
      } catch (error) {
        console.error('[ResearchChat] Error fetching prompts:', error);
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, [serviceToken, toolType]);

  // Handle socket connection
  useEffect(() => {
    const userId = loggedInUser?.id || loggedInUser?._id;
    if (userId && serviceToken) {
      console.log(
        '[ResearchChat] Connecting socket for user:',
        userId,
        'with token',
      );
      connectSocket(userId, serviceToken);
    }

    return () => {
      // Clean up listeners if any were active
      const socket = getSocket();
      if (socket) {
        socket.off('assistant_message_chunk');
        socket.off('assistant_message_completed');
        socket.off('assistant_message_error');
      }
    };
  }, [loggedInUser, serviceToken]);

  const isEmptyState = messages.length === 0;

  // Suggestion chips based on mode
  const suggestionChips =
    mode === 'general'
      ? [
          {
            icon: FileText,
            text: t('researchChat.suggestions.general.executiveSummary'),
          },
          {
            icon: Sparkles,
            text: t('researchChat.suggestions.general.clinicalImplications'),
          },
          {
            icon: Beaker,
            text: t('researchChat.suggestions.general.methodologyAnalysis'),
          },
          {
            icon: AlertCircle,
            text: t('researchChat.suggestions.general.evidenceGrading'),
          },
        ]
      : [
          {
            icon: FileText,
            text: t('researchChat.suggestions.protocol.synopsis'),
          },
          {
            icon: ClipboardList,
            text: t('researchChat.suggestions.protocol.eligibility'),
          },
          {
            icon: BookOpen,
            text: t('researchChat.suggestions.protocol.schedule'),
          },
          {
            icon: AlertCircle,
            text: t('researchChat.suggestions.protocol.safetyEndpoints'),
          },
        ];

  // Handlers
  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewFiles = () => {
    triggerHaptic('light');
    setShowContextModal(true);
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

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      return newMessage.id;
    },
    [],
  );

  const _extractIdFromToken = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Simple base64 decoding logic for React Native
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let out = '';
      let str = String(base64).replace(/=+$/, '');
      for (
        let bc = 0, bs = 0, buffer, idx = 0;
        (buffer = str.charAt(idx++));
        ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
          ? (out += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
          : 0
      ) {
        buffer = chars.indexOf(buffer);
      }

      const parsed = JSON.parse(out);
      return parsed.id || parsed._id || parsed.userId || null;
    } catch (e) {
      console.error('[ResearchChat] Token parsing failed:', e);
      return null;
    }
  };

  const handleSend = async () => {
    const query = inputText.trim();
    if (!query && attachedFiles.length === 0) return;

    // Check if at least one document is present
    if (contextFiles.length === 0 && attachedFiles.length === 0) {
      Alert.alert(
        t('researchChat.uploadRequired'),
        t('researchChat.uploadToProceed'),
      );
      return;
    }

    const userContent =
      attachedFiles.length > 0
        ? `${query}\n\n[${t('researchChat.attached')}: ${attachedFiles
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
      if (!serviceToken) {
        throw new Error('No service token available');
      }

      let convId = currentConversationId;
      const docIds = [
        ...contextFiles.map((f) => f.id),
        ...attachedFiles.map((f) => f.id),
      ];

      // 1. Create conversation if not exists
      if (!convId) {
        console.log('[ResearchChat] Creating new conversation...');
        const title = `Discussion about "${
          contextFiles[0]?.name || 'document'
        }"`;
        const createRes = await researchService.createConversation(
          docIds,
          title,
          toolType,
          serviceToken,
        );

        if (createRes.data.success) {
          convId = createRes.data.data._id;
          setCurrentConversationId(convId);
          console.log('[ResearchChat] Conversation created:', convId);
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      // 2. Setup Socket Listeners
      let socket = getSocket();

      if (!socket) {
        let userId =
          loggedInUser?.id ||
          loggedInUser?._id ||
          loggedInUser?.userId ||
          loggedInUser?._id;
        if (!userId) {
          try {
            const storedUser = await AsyncStorage.getItem('auth_user');
            if (storedUser) {
              const user = JSON.parse(storedUser);
              userId = user.id || user._id || user.userId;
            }
          } catch (e) {}
        }

        // Final fallback: Extract from token
        if (!userId && serviceToken) {
          userId = _extractIdFromToken(serviceToken);
        }

        if (!userId && loggedInUser?.token) {
          userId = _extractIdFromToken(loggedInUser.token);
        }

        if (userId && serviceToken) {
          console.log(
            '[ResearchChat] Attempting connectSocket with userId:',
            userId,
          );
          socket = connectSocket(userId, serviceToken) || null;
        } else {
          console.error(
            '[ResearchChat] Missing credentials for connectSocket:',
            { hasUserId: !!userId, hasToken: !!serviceToken },
          );
        }
      }

      // Ensure socket is connected, wait up to 3 seconds if needed
      if (socket && !socket.connected) {
        console.log(
          '[ResearchChat] Socket not connected, waiting for connection...',
        );
        socket.connect();

        // Polling wait for connection (max 3 seconds)
        let attempts = 0;
        while (!socket.connected && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
      }

      console.log(
        '[ResearchChat] Socket instance status:',
        !!socket,
        'Connected:',
        socket?.connected,
      );

      streamingContentRef.current = '';

      if (socket && socket.connected && convId) {
        console.log(
          '[ResearchChat] Setting up socket listeners for convId:',
          convId,
        );

        socket.off('assistant_message_chunk');
        socket.off('assistant_message_completed');
        socket.off('assistant_message_error');

        socket.on('assistant_message_chunk', (event: any) => {
          const payload = event.payload || event;

          if (payload.conversationId === convId) {
            const chunk =
              payload.content || payload.text || payload.chunk || '';
            console.log(
              '[ResearchChat] 📥 Received chunk. Total length:',
              chunk.length,
            );

            // The backend sends the full accumulated string in each event, so we replace instead of append.
            streamingContentRef.current = chunk;
            console.log(
              '[ResearchChat] 📥 Content received. Total length:',
              streamingContentRef.current.length,
            );

            setMessages((prev) =>
              prev.map((m) =>
                m.id === loadingId
                  ? {
                      ...m,
                      content: streamingContentRef.current,
                      isLoading: false,
                    }
                  : m,
              ),
            );
          } else {
            console.warn(
              '[ResearchChat] ⚠️ Chunk conversationId mismatch. Expected:',
              convId,
              'Got:',
              payload.conversationId,
            );
          }
        });

        socket.on('assistant_message_completed', (event: any) => {
          const payload = event.payload || event;
          if (payload.conversationId === convId) {
            console.log('[ResearchChat] ✅ Streaming finish confirmed.');
            setIsLoading(false);

            socket.off('assistant_message_chunk');
            socket.off('assistant_message_completed');
            socket.off('assistant_message_error');
          }
        });

        socket.on('assistant_message_error', (event: any) => {
          console.error(
            '[ResearchChat] ❌ assistant_message_error received:',
            JSON.stringify(event),
          );
          const payload = event.payload || event;
          if (payload.conversationId === convId) {
            console.error(
              '[ResearchChat] Error message:',
              payload.message || payload.error,
            );
            setIsLoading(false);
            setMessages((prev) => prev.filter((m) => m.id !== loadingId));
            Alert.alert(
              t('common.error'),
              payload.message || 'Error while receiving response.',
            );

            socket.off('assistant_message_chunk');
            socket.off('assistant_message_completed');
            socket.off('assistant_message_error');
          }
        });
      } else {
        console.error(
          '[ResearchChat] ❌ Cannot setup listeners: Socket or ConvId missing.',
          { hasSocket: !!socket, convId },
        );
      }

      // 3. Send message
      if (convId) {
        console.log('[ResearchChat] Sending message to conversation:', convId);
        const sendRes = await researchService.sendMessage(
          convId,
          docIds,
          query || 'Analysis',
          serviceToken,
        );

        if (!sendRes.data.success) {
          throw new Error('Failed to send message');
        }

        console.log(
          '[ResearchChat] Message sent successfully. Waiting for socket chunks...',
        );
      }
    } catch (error) {
      console.error('[ResearchChat] Chat error:', error);
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      setIsLoading(false);
      Alert.alert(
        t('common.error'),
        'Failed to communicate with the assistant.',
      );
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    triggerHaptic('light');
    if (contextFiles.length === 0 && attachedFiles.length === 0) {
      Alert.alert(
        t('researchChat.uploadRequired'),
        t('researchChat.uploadToProceed'),
      );
      return;
    }
    setInputText(suggestion);
  };

  const handleAttach = () => {
    setShowAttachmentModal(true);
  };

  const handleUpload = async (file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  }) => {
    if (!serviceToken) {
      console.error('[ResearchChat] Missing service token. Cannot upload.');
      Alert.alert(
        t('common.error'),
        'Authentication token not ready. Please try again in a moment.',
      );
      return;
    }

    setIsLoading(true);
    const title =
      file.name ||
      (file.type.startsWith('image/') ? 'image.jpg' : 'document.pdf');
    const fileType =
      title.split('.').pop()?.toLowerCase() ||
      (file.type.startsWith('image/') ? 'jpg' : 'pdf');

    try {
      // 1. Initiate Upload
      const initiatePayload = { title, fileType, toolType };
      console.log(
        '[ResearchChat] Step 1: Initiating upload payload:',
        JSON.stringify(initiatePayload),
      );
      const initiateRes = await researchService.initiateUpload(
        title,
        fileType,
        toolType,
        serviceToken,
      );

      if (initiateRes.data.success) {
        const { uploadId, key } = initiateRes.data.data;
        console.log(
          '[ResearchChat] Step 1 Success. uploadId:',
          uploadId,
          'key:',
          key,
        );

        // 2. Upload Part
        console.log(
          '[ResearchChat] Step 2: Uploading part 1 payload:',
          JSON.stringify({ uploadId, key, partNumber: 1 }),
        );
        const uploadRes = await researchService.uploadPart(
          file.uri,
          file.type || 'application/octet-stream',
          title,
          uploadId,
          key,
          1,
          serviceToken,
        );

        if (uploadRes.data.success) {
          const { ETag, PartNumber } = uploadRes.data.data;
          console.log(
            '[ResearchChat] Step 2 Success. ETag:',
            ETag,
            'PartNumber:',
            PartNumber,
          );

          // 3. Complete Upload
          const completePayload = {
            fileSize: file.size || 0,
            fileType,
            key,
            parts: [{ ETag, PartNumber }],
            title,
            toolType,
            uploadId,
          };
          console.log(
            '[ResearchChat] Step 3: Completing upload payload:',
            JSON.stringify(completePayload),
          );
          const completeRes = await researchService.completeUpload(
            completePayload,
            serviceToken,
          );

          if (completeRes.data.success) {
            const uploadedDoc = completeRes.data.data;
            console.log(
              '[ResearchChat] Step 3 Success. Final Document ID:',
              uploadedDoc._id,
            );
            const newFile: AttachedFile = {
              id: uploadedDoc._id,
              name: uploadedDoc.title,
              type:
                fileType === 'pdf'
                  ? 'pdf'
                  : file.type.startsWith('image/')
                  ? 'image'
                  : 'document',
              uri: uploadedDoc.fileUrl,
            };
            setContextFiles((prev) => [...prev, newFile]);
            triggerHaptic('medium');
          } else {
            console.error(
              '[ResearchChat] Step 3 failed:',
              completeRes.data.message,
            );
          }
        } else {
          console.error(
            '[ResearchChat] Step 2 failed:',
            uploadRes.data.message,
          );
        }
      } else {
        console.error(
          '[ResearchChat] Step 1 failed:',
          initiateRes.data.message,
        );
      }
    } catch (uploadError: any) {
      console.error('[ResearchChat] Upload sequence error:', uploadError);
      Alert.alert(t('common.error'), 'Failed to upload document.');
    } finally {
      setIsLoading(false);
      console.log('[ResearchChat] Upload process finished.');
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await pick({
        type: [types.pdf, types.doc, types.docx],
      });

      if (result && result[0]) {
        await handleUpload(result[0] as any);
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
        const asset = result.assets[0];
        await handleUpload({
          uri: asset.uri || '',
          name: asset.fileName || 'scanned_document.jpg',
          type: asset.type || 'image/jpeg',
          size: asset.fileSize,
        });
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
        const asset = result.assets[0];
        await handleUpload({
          uri: asset.uri || '',
          name: asset.fileName || 'image.jpg',
          type: asset.type || 'image/jpeg',
          size: asset.fileSize,
        });
      }
    } catch (error) {
      console.log('Gallery error:', error);
    }
  };

  const handleRemoveFile = (id: string) => {
    triggerHaptic('light');
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRemoveContextFile = (id: string) => {
    triggerHaptic('light');
    setContextFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePreviewFile = (file: AttachedFile) => {
    triggerHaptic('light');
    setShowContextModal(true);
  };

  const handleCitationPress = (citation: Citation) => {
    triggerHaptic('light');
    // Could open in browser or show details
  };

  const handleSaveMagicTemplate = async (template: {
    name: string;
    instructions: string;
    refinedPrompt: string;
  }) => {
    if (!serviceToken) {
      Alert.alert(t('common.error'), 'Authentication token not ready.');
      return;
    }

    const payload = {
      title: template.name,
      content: template.refinedPrompt,
      toolType: toolType,
    };

    console.log(
      '[ResearchChat] Creating prompt with payload:',
      JSON.stringify(payload, null, 2),
    );
    setIsLoadingPrompts(true);

    try {
      const response = await researchService.savePrompt(payload, serviceToken);
      console.log(
        '[ResearchChat] Prompt creation response:',
        JSON.stringify(response.data, null, 2),
      );

      if (response.data.success) {
        const p = response.data.data;
        const newPrompt: CustomPrompt = {
          id: p._id || p.id,
          title: p.title || template.name,
          content: p.content || template.refinedPrompt,
          createdAt: p.createdAt || new Date().toISOString(),
        };
        setCustomPrompts((prev) => [newPrompt, ...prev]);
        setSelectedPromptId(newPrompt.id);
        triggerHaptic('medium');
        customToast(
          'success',
          t('common.success'),
          'Prompt template saved successfully',
        );
      } else {
        throw new Error(response.data.message || 'Failed to save prompt');
      }
    } catch (error: any) {
      console.error('[ResearchChat] Error creating prompt:', error);
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to save prompt template.',
      );
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleSelectPrompt = (prompt: CustomPrompt) => {
    setSelectedPromptId(prompt.id);
    setShowPromptLibrary(false);
  };

  const handleDeletePrompt = async (id: string) => {
    if (!serviceToken) return;

    console.log('[ResearchChat] Deleting prompt with ID:', id);
    try {
      const response = await researchService.deletePrompt(id, serviceToken);
      if (response.data.success) {
        console.log('[ResearchChat] Prompt deleted successfully');
        setCustomPrompts((prev) => prev.filter((p) => p.id !== id));
        if (selectedPromptId === id) setSelectedPromptId(null);
        customToast(
          'success',
          t('common.success'),
          'Template deleted successfully',
        );
      } else {
        throw new Error(response.data.message || 'Failed to delete prompt');
      }
    } catch (error) {
      console.error('[ResearchChat] Error deleting prompt:', error);
      Alert.alert(t('common.error'), 'Failed to delete template.');
    }
  };

  const selectedPrompt = customPrompts.find((p) => p.id === selectedPromptId);

  const screenTitle =
    mode === 'general'
      ? t('researchChat.title.general')
      : t('researchChat.title.protocol');
  const hasDocument = contextFiles.length > 0 || attachedFiles.length > 0;

  const placeholderText = !hasDocument
    ? t('researchChat.uploadToProceed')
    : mode === 'general'
    ? t('researchChat.placeholder.general')
    : t('researchChat.placeholder.protocol');

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
              {screenTitle}
            </Text>
            {contextFiles.length > 0 && (
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: DYNAMIC_THEME.secondary },
                ]}>
                {t('researchChat.filesLoaded', { count: contextFiles.length })}
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
              onPress={() => {
                if (!hasDocument) {
                  Alert.alert(
                    t('researchChat.uploadRequired'),
                    t('researchChat.uploadToProceed'),
                  );
                  return;
                }
                setShowPromptLibrary(true);
              }}
              style={styles.headerButton}>
              <Sparkles size={20} color={DYNAMIC_THEME.brand} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleViewFiles}
              style={styles.headerButton}>
              <FolderOpen size={22} color={DYNAMIC_THEME.navy} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content area */}
        <View
          style={[styles.contentArea, { backgroundColor: DYNAMIC_THEME.pure }]}>
          {isEmptyState ? (
            /* Empty State - przekażę DYNAMIC_THEME jako context */
            <ScrollView
              contentContainerStyle={styles.emptyState}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* <PulsingAILogo /> */}

              <Text
                style={[
                  styles.emptyStateGreeting,
                  { color: DYNAMIC_THEME.navy },
                ]}>
                {mode === 'general'
                  ? t('researchChat.greeting.general')
                  : t('researchChat.greeting.protocol')}
              </Text>

              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: DYNAMIC_THEME.secondary },
                ]}>
                {mode === 'general'
                  ? t('researchChat.subtitle.general')
                  : t('researchChat.subtitle.protocol')}
              </Text>

              {/* Document Required Badge if none loaded */}
              {isLoading ? (
                <View
                  style={[
                    styles.uploadPromptContainer,
                    { paddingVertical: hp(5) },
                  ]}>
                  <ActivityIndicator size="large" color={DYNAMIC_THEME.brand} />
                  <Text
                    style={[
                      styles.uploadPromptText,
                      { color: DYNAMIC_THEME.secondary, marginTop: 12 },
                    ]}>
                    Uploading document...
                  </Text>
                </View>
              ) : !hasDocument ? (
                <PulsingUploadButton
                  onPress={handleFilePick}
                  dynamicTheme={DYNAMIC_THEME}
                />
              ) : (
                /* Suggestion chips */
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
              )}
            </ScrollView>
          ) : (
            /* Chat Stream */
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
          contextFiles={contextFiles}
          onRemoveFile={handleRemoveFile}
          onRemoveContextFile={handleRemoveContextFile}
          onPreviewFile={handlePreviewFile}
          placeholder={placeholderText}
          isLoading={isLoading}
          dynamicTheme={DYNAMIC_THEME}
          hasContextFiles={contextFiles.length > 0}
          isDark={isDark}
          isEmptyState={isEmptyState}
        />
      </KeyboardAvoidingView>

      {/* Context Files Modal */}
      <ContextFilesModal
        visible={showContextModal}
        files={contextFiles}
        onClose={() => setShowContextModal(false)}
        dynamicTheme={DYNAMIC_THEME}
      />

      {/* Attachment Modal */}
      <AttachmentModal
        visible={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onUploadPdf={handleFilePick}
        onScan={handleScan}
        onGallery={handleGallery}
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
        isLoading={isLoadingPrompts}
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
  userMessageText: {},

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
    alignItems: 'center',
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

  // Attachment Modal styles
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  requirementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: hp(3),
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(70, 183, 198, 0.2)',
  },
  requirementText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'center',
  },
  uploadPromptContainer: {
    alignItems: 'center',
    marginTop: hp(4),
  },
  pulsingButtonWrapper: {
    padding: 10,
  },
  pulsingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  uploadPromptText: {
    fontSize: 15,
    marginTop: hp(2),
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});

export default ResearchChatScreen;
