import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  Check,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  Edit,
  Wand2,
  RefreshCcw,
} from 'lucide-react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
// @ts-ignore
import * as Haptics from 'expo-haptics';
import {
  createNotesPrompt,
  getNotesPrompts,
  updateNotesPrompt,
  deleteNotesPrompt,
  type NotesPrompt,
} from '../services/promptsApi';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import MagicTemplateCreatorInline from './MagicTemplateCreatorInline';
import { useTheme } from '../constants/theme';
import { templateStorage } from '../utils/templateStorage';

export type CustomTemplate = {
  id: string;
  title: string;
  content: string;
  lastUsed?: Date;
};

type CustomTemplateManagerProps = {
  onSelectTemplate: (template: CustomTemplate | null) => void;
  selectedTemplateId: string | null;
  noteType?: 'patient' | 'meeting' | 'lecture';
  savedPrompts?: NotesPrompt[];
  onRefresh?: () => void;
};

const INITIAL_TEMPLATES: CustomTemplate[] = [];

// Helper to normalized prompts to templates
const normalizePrompts = (prompts: NotesPrompt[]): CustomTemplate[] => {
  return prompts.map((p) => ({
    id: p._id, // Use _id from backend
    title: p.title,
    content: p.content,
    lastUsed: new Date(p.updatedAt || p.createdAt || Date.now()),
  }));
};

// Default Theme for StyleSheet (Light Mode Fallback)
const DEFAULT_THEME = {
  primary: '#46B7C6',
  primarySubtle: '#F0FDFA',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  bg: '#FFFFFF',
  bgAlt: '#F9FAFB',
  border: '#F3F4F6',
  borderDarker: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
};

// --- VIEW STATES (Single Modal Architecture) ---
type ViewState = 'closed' | 'library' | 'editor' | 'options';

const CustomTemplateManager = ({
  onSelectTemplate,
  selectedTemplateId,
  noteType = 'patient',
  savedPrompts = [],
  onRefresh,
}: CustomTemplateManagerProps) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();

  // --- PREMIUM DESIGN TOKENS (Dynamic) ---
  const THEME = useMemo(
    () => ({
      primary: themeColors.accentPrimary,
      primarySubtle: isDark ? 'rgba(70, 183, 198, 0.1)' : '#F0FDFA',
      text: isDark ? themeColors.textPrimary : '#111827',
      textSecondary: isDark ? themeColors.textSecondary : '#6B7280',
      textTertiary: isDark ? themeColors.textMuted : '#9CA3AF',
      bg: isDark ? themeColors.canvas : '#FFFFFF',
      bgAlt: isDark ? '#141414' : '#F9FAFB', // Slightly lighter than canvas in dark
      border: isDark ? themeColors.borderNormal : '#F3F4F6',
      borderDarker: isDark ? themeColors.borderStrong : '#E5E7EB',
      danger: themeColors.error,
      success: themeColors.success,
      overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
      shadow: isDark
        ? {
            shadowColor: themeColors.accentPrimary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          },
    }),
    [themeColors, isDark],
  );

  // --- STATE ---
  const [templates, setTemplates] =
    useState<CustomTemplate[]>(INITIAL_TEMPLATES);
  const hasLoadedTemplates = useRef(false);
  const [viewState, setViewState] = useState<ViewState>('closed');
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(
    null,
  );
  const [optionsTarget, setOptionsTarget] = useState<CustomTemplate | null>(
    null,
  );

  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai' | null>(
    null,
  );

  const swipeableRefs = useRef(new Map()).current;
  const searchInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);

  // --- COMPUTED ---
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  );

  const filteredTemplates = useMemo(
    () =>
      templates.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [templates, searchQuery],
  );

  const isModalVisible = viewState !== 'closed';

  // Load and sync templates (Local + Backend)
  useEffect(() => {
    const loadTemplates = async () => {
      // 1. Get Local Templates
      const stored = await templateStorage.getTemplates();
      let localTemplates: CustomTemplate[] = [];

      if (stored.length > 0) {
        localTemplates = stored.map((template) => ({
          ...template,
          lastUsed: template.lastUsed ? new Date(template.lastUsed) : undefined,
        })) as CustomTemplate[];
      }

      // 2. Convert Backend Prompts to Templates
      const backendTemplates = normalizePrompts(savedPrompts);

      // 3. Merge: Prefer Backend IDs, keep Local ones if not in Backend
      const templateMap = new Map<string, CustomTemplate>();

      // Add local templates first
      localTemplates.forEach((t) => templateMap.set(t.id, t));

      // Add/Overwrite with backend templates (assuming backend is truth)
      backendTemplates.forEach((t) => templateMap.set(t.id, t));

      const mergedTemplates = Array.from(templateMap.values());

      // Sort by lastUsed descending
      mergedTemplates.sort((a, b) => {
        const timeA = a.lastUsed?.getTime() || 0;
        const timeB = b.lastUsed?.getTime() || 0;
        return timeB - timeA;
      });

      setTemplates(mergedTemplates);
      hasLoadedTemplates.current = true;
    };

    loadTemplates();
  }, [savedPrompts]); // Re-run when savedPrompts changes

  // Save local changes to storage
  useEffect(() => {
    if (!hasLoadedTemplates.current) return;
    const templatesToSave = templates.map((t) => ({
      ...t,
      lastUsed:
        t.lastUsed instanceof Date ? t.lastUsed.toISOString() : t.lastUsed,
    }));
    templateStorage.saveTemplates(templatesToSave);
  }, [templates]);

  // --- HANDLERS ---
  const openLibrary = useCallback(() => {
    Haptics.selectionAsync();
    setViewState('library');
  }, []);

  const openEditor = useCallback(
    (template?: CustomTemplate) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      swipeableRefs.forEach((ref: any) => ref?.close());

      if (template) {
        // Editing existing template - go straight to manual editor
        setEditingTemplate(template);
        setTitleInput(template.title);
        setContentInput(template.content);
        setCreationMethod('manual');
      } else {
        // Creating new template - show method selection
        setEditingTemplate(null);
        setTitleInput('');
        setContentInput('');
        setCreationMethod(null);
      }
      setViewState('editor');
    },
    [swipeableRefs],
  );

  const openOptions = useCallback((template: CustomTemplate) => {
    Haptics.selectionAsync();
    setOptionsTarget(template);
    setViewState('options');
  }, []);

  const closeModal = useCallback(() => {
    setViewState('closed');
    setSearchQuery('');
    setEditingTemplate(null);
    setOptionsTarget(null);
  }, []);

  const goBackToLibrary = useCallback(() => {
    setViewState('library');
    setEditingTemplate(null);
    setOptionsTarget(null);
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!titleInput.trim() || !contentInput.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('templates.errors.incompleteTitle'),
        t('templates.errors.incompleteMessage'),
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingTemplate) {
      try {
        console.log('[CustomTemplateManager] Updating prompt in backend...', {
          id: editingTemplate.id,
          title: titleInput.trim(),
          content: contentInput.trim(),
        });

        await updateNotesPrompt(editingTemplate.id, {
          title: titleInput.trim(),
          content: contentInput.trim(),
        });

        console.log(
          '[CustomTemplateManager] Prompt updated in backend successfully:',
          editingTemplate.id,
        );

        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingTemplate.id
              ? { ...t, title: titleInput.trim(), content: contentInput.trim() }
              : t,
          ),
        );
      } catch (error) {
        console.error(
          '[CustomTemplateManager] Failed to update prompt in backend:',
          error,
        );

        // Optimistic update fallback or alert?
        // For now, we update locally but warn user
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingTemplate.id
              ? { ...t, title: titleInput.trim(), content: contentInput.trim() }
              : t,
          ),
        );
        Alert.alert(
          'Warning',
          'Updated locally but failed to sync changes to cloud.',
        );
      }
    } else {
      try {
        console.log('[CustomTemplateManager] Creating prompt in backend...', {
          title: titleInput.trim(),
          content: contentInput.trim(),
          noteType: noteType,
        });

        // @ts-ignore
        const savedPrompt = await createNotesPrompt({
          title: titleInput.trim(),
          content: contentInput.trim(),
          noteType: noteType as any,
        });

        console.log(
          '[CustomTemplateManager] Prompt saved to backend successfully:',
          savedPrompt,
        );

        const newTemplate: CustomTemplate = {
          id: savedPrompt._id || Date.now().toString(),
          title: savedPrompt.title || titleInput.trim(),
          content: savedPrompt.content || contentInput.trim(),
          lastUsed: new Date(),
        };
        setTemplates((prev) => [newTemplate, ...prev]);
      } catch (error) {
        console.error(
          '[CustomTemplateManager] Failed to save prompt to backend:',
          error,
        );
        const newTemplate: CustomTemplate = {
          id: Date.now().toString(),
          title: titleInput.trim(),
          content: contentInput.trim(),
          lastUsed: new Date(),
        };
        setTemplates((prev) => [newTemplate, ...prev]);
        Alert.alert('Warning', 'Saved locally but failed to sync with cloud.');
      }
    }
    onRefresh?.();
    goBackToLibrary();
  }, [
    titleInput,
    contentInput,
    editingTemplate,
    goBackToLibrary,
    noteType,
    onRefresh,
  ]);

  // Delete Template function
  const handleDeleteTemplate = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Alert.alert(t('templates.deleteTitle'), t('templates.deleteMessage'), [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            swipeableRefs.get(id)?.close();
            if (viewState === 'options') goBackToLibrary();
          },
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(
                '[CustomTemplateManager] Attempting to delete prompt from backend:',
                id,
              );
              await deleteNotesPrompt(id);
              console.log(
                '[CustomTemplateManager] Prompt deleted from backend successfully:',
                id,
              );
            } catch (error) {
              console.error(
                '[CustomTemplateManager] Failed to delete from backend (might be local-only or network error):',
                error,
              );
            }

            setTemplates((prev) => prev.filter((t) => t.id !== id));
            if (selectedTemplateId === id) onSelectTemplate(null);
            goBackToLibrary();
          },
        },
      ]);
    },
    [
      swipeableRefs,
      viewState,
      selectedTemplateId,
      onSelectTemplate,
      goBackToLibrary,
    ],
  );

  const handleSelect = useCallback(
    (item: CustomTemplate) => {
      Haptics.selectionAsync();
      onSelectTemplate(item);
      closeModal();
    },
    [onSelectTemplate, closeModal],
  );

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTemplate(null);
  }, [onSelectTemplate]);

  // --- SWIPE ACTIONS ---
  const renderRightActions = useCallback(
    (id: string) => (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteTemplate(id)}>
        <Trash2 size={20} color="#FFFFFF" />
      </TouchableOpacity>
    ),
    [handleDeleteTemplate],
  );

  const renderLeftActions = useCallback(
    (item: CustomTemplate) => (
      <TouchableOpacity
        style={styles.editAction}
        onPress={() => openEditor(item)}>
        <Edit3 size={20} color="#FFFFFF" />
      </TouchableOpacity>
    ),
    [openEditor],
  );

  // --- RENDER: Library View ---
  const renderLibraryView = () => (
    <View style={[styles.modalContainer, { backgroundColor: THEME.bgAlt }]}>
      {/* Header */}
      <View
        style={[
          styles.modalHeader,
          { backgroundColor: THEME.bg, borderBottomColor: THEME.border },
        ]}>
        <TouchableOpacity
          onPress={closeModal}
          hitSlop={12}
          style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: THEME.textSecondary }]}>
            {t('common.close')}
          </Text>
        </TouchableOpacity>

        {onRefresh && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRefresh();
            }}
            hitSlop={12}
            style={[styles.headerBtn, { minWidth: 40, alignItems: 'center' }]}>
            <RefreshCcw size={18} color={THEME.textSecondary} />
          </TouchableOpacity>
        )}

        <Text style={[styles.modalTitle, { color: THEME.text }]}>
          {t('templates.title')}
        </Text>

        <TouchableOpacity
          onPress={() => openEditor()}
          hitSlop={12}
          style={styles.headerBtn}>
          <Plus size={24} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Native TextInput, No Wrapper Borders */}
      <View style={[styles.searchContainer, { backgroundColor: THEME.bgAlt }]}>
        <View
          style={[styles.searchBar, { backgroundColor: THEME.borderDarker }]}>
          <Search size={16} color={THEME.textTertiary} />
          <TextInput
            ref={searchInputRef}
            placeholder={t('templates.searchPlaceholder')}
            placeholderTextColor={THEME.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: THEME.text }]}
            selectionColor={THEME.primary}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <View
                style={[
                  styles.clearSearchCircle,
                  { backgroundColor: THEME.textTertiary },
                ]}>
                <X size={10} color={isDark ? '#000' : '#FFF'} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => {
          const isSelected = selectedTemplateId === item.id;
          return (
            <Swipeable
              ref={(ref) => {
                if (ref) swipeableRefs.set(item.id, ref);
              }}
              renderRightActions={() => renderRightActions(item.id)}
              renderLeftActions={() => renderLeftActions(item)}
              containerStyle={styles.swipeContainer}>
              <TouchableOpacity
                style={[
                  styles.cardItem,
                  { backgroundColor: THEME.bg, borderColor: 'transparent' }, // Reset border first
                  isSelected && {
                    borderColor: THEME.primary,
                    backgroundColor: THEME.primarySubtle,
                  },
                  !isSelected && { shadowColor: '#000', shadowOpacity: 0.03 }, // Keep shadow subtle
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.9}>
                <View style={styles.cardItemBody}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: THEME.text },
                          isSelected && { color: THEME.primary },
                        ]}
                        numberOfLines={1}>
                        {item.title}
                      </Text>
                      {isSelected && (
                        <Check
                          size={16}
                          color={THEME.primary}
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => openOptions(item)}
                      hitSlop={14}
                      style={styles.cardOptionBtn}>
                      <MoreHorizontal size={20} color={THEME.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[styles.cardPreview, { color: THEME.textSecondary }]}
                    numberOfLines={2}>
                    {item.content}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: THEME.borderDarker },
              ]}>
              <FileText size={32} color={THEME.textTertiary} />
            </View>
            <Text
              style={[styles.emptyStateText, { color: THEME.textSecondary }]}>
              {t('templates.empty')}
            </Text>
            <TouchableOpacity onPress={() => openEditor()}>
              <Text style={[styles.emptyStateLink, { color: THEME.primary }]}>
                {t('templates.createNew')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );

  // --- RENDER: Editor View ---
  const renderEditorView = () => {
    // Method Selection Screen (for new templates)
    if (!editingTemplate && creationMethod === null) {
      return (
        <View style={[styles.modalContainer, { backgroundColor: THEME.bgAlt }]}>
          <View
            style={[
              styles.editorHeader,
              { backgroundColor: THEME.bg, borderBottomColor: THEME.border },
            ]}>
            <TouchableOpacity
              onPress={goBackToLibrary}
              hitSlop={12}
              style={styles.backBtn}>
              <ChevronLeft size={24} color={THEME.textSecondary} />
              <Text
                style={[styles.backBtnText, { color: THEME.textSecondary }]}>
                {t('common.back')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.methodSelectionTitle, { color: THEME.text }]}>
              {t('templates.howToCreate')}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.methodSelectionContainer}>
            <Text
              style={[
                styles.methodSelectionSubtitle,
                { color: THEME.textSecondary },
              ]}>
              {t('templates.chooseMethod')}
            </Text>

            {/* Manual Method Card */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                { backgroundColor: THEME.bg, borderColor: THEME.border },
                THEME.shadow,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCreationMethod('manual');
              }}
              activeOpacity={0.9}>
              <View
                style={[
                  styles.methodIconContainer,
                  { backgroundColor: THEME.primarySubtle },
                ]}>
                <Edit size={28} color={THEME.primary} strokeWidth={2} />
              </View>
              <View style={styles.methodTextContainer}>
                <Text style={[styles.methodTitle, { color: THEME.text }]}>
                  {t('templates.manualMethod')}
                </Text>
                <Text
                  style={[
                    styles.methodDescription,
                    { color: THEME.textSecondary },
                  ]}>
                  {t('templates.manualDescription')}
                </Text>
              </View>
              <ChevronRight size={20} color={THEME.textTertiary} />
            </TouchableOpacity>

            {/* AI Assistant Method Card */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                {
                  backgroundColor: THEME.primarySubtle,
                  borderColor: THEME.primary + '40',
                },
                THEME.shadow,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCreationMethod('ai');
              }}
              activeOpacity={0.9}>
              <View
                style={[
                  styles.methodIconContainer,
                  { backgroundColor: THEME.bg },
                ]}>
                <Wand2 size={28} color={THEME.primary} strokeWidth={2} />
              </View>
              <View style={styles.methodTextContainer}>
                <Text style={[styles.methodTitle, { color: THEME.text }]}>
                  {t('templates.aiMethod')}
                  <Text style={styles.methodBadge}> ✨</Text>
                </Text>
                <Text
                  style={[
                    styles.methodDescription,
                    { color: THEME.textSecondary },
                  ]}>
                  {t('templates.aiDescription')}
                </Text>
              </View>
              <ChevronRight size={20} color={THEME.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Manual Editor (existing or after method selection)
    if (creationMethod === 'manual') {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: THEME.bg }]}>
          <View
            style={[
              styles.editorHeader,
              { backgroundColor: THEME.bg, borderBottomColor: THEME.border },
            ]}>
            <TouchableOpacity
              onPress={() => {
                if (editingTemplate) {
                  goBackToLibrary();
                } else {
                  setCreationMethod(null);
                }
              }}
              hitSlop={12}
              style={styles.backBtn}>
              <ChevronLeft size={24} color={THEME.textSecondary} />
              <Text
                style={[styles.backBtnText, { color: THEME.textSecondary }]}>
                {t('common.back')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveTemplate}
              style={[
                styles.saveBtn,
                { backgroundColor: THEME.primary },
                (!titleInput.trim() || !contentInput.trim()) && {
                  backgroundColor: THEME.borderDarker,
                },
              ]}
              disabled={!titleInput.trim() || !contentInput.trim()}>
              <Text
                style={[
                  styles.saveBtnText,
                  (!titleInput.trim() || !contentInput.trim()) && {
                    color: THEME.textTertiary,
                  },
                ]}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[styles.editorScroll, { backgroundColor: THEME.bg }]}
            contentContainerStyle={styles.editorContent}
            keyboardShouldPersistTaps="handled">
            <TextInput
              ref={titleInputRef}
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder={t('templates.titlePlaceholder')}
              placeholderTextColor={THEME.textTertiary}
              style={[styles.editorTitleInput, { color: THEME.text }]}
              selectionColor={THEME.primary}
              autoFocus={!editingTemplate}
              multiline={true}
              numberOfLines={3}
              maxLength={200}
            />

            <View style={[styles.divider, { backgroundColor: THEME.border }]} />

            <TextInput
              value={contentInput}
              onChangeText={setContentInput}
              placeholder={t('templates.contentPlaceholder')}
              placeholderTextColor={THEME.textTertiary}
              multiline
              style={[styles.editorBodyInput, { color: THEME.text }]}
              textAlignVertical="top"
              selectionColor={THEME.primary}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    // AI Assistant Flow
    if (creationMethod === 'ai') {
      return (
        <View style={[styles.modalContainer, { backgroundColor: THEME.bgAlt }]}>
          <View
            style={[
              styles.editorHeader,
              { backgroundColor: THEME.bg, borderBottomColor: THEME.border },
            ]}>
            <TouchableOpacity
              onPress={() => setCreationMethod(null)}
              hitSlop={12}
              style={styles.backBtn}>
              <ChevronLeft size={24} color={THEME.textSecondary} />
              <Text
                style={[styles.backBtnText, { color: THEME.textSecondary }]}>
                {t('common.back')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.methodSelectionTitle, { color: THEME.text }]}>
              {t('templates.aiMethod')}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <MagicTemplateCreatorInline
            visible={true}
            onSaveTemplate={(aiTemplate: any) => {
              // Create new template from AI result
              const newTemplate: CustomTemplate = {
                id: aiTemplate.serverPrompt?._id || Date.now().toString(),
                title: aiTemplate.serverPrompt?.title || aiTemplate.name,
                content:
                  aiTemplate.serverPrompt?.content || aiTemplate.refinedPrompt,
                lastUsed: new Date(),
              };

              setTemplates((prev) => [newTemplate, ...prev]);

              // Select the new template
              onSelectTemplate(newTemplate);

              // Reset and go back
              setCreationMethod(null);
              goBackToLibrary();

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }
              onRefresh?.();
            }}
            onClose={() => setCreationMethod(null)}
          />
        </View>
      );
    }

    return null;
  };

  // --- RENDER: Options View (Bottom Sheet Overlay) ---
  const renderOptionsView = () => (
    <View style={styles.optionsOverlay}>
      <TouchableOpacity
        style={[styles.optionsBackdrop, { backgroundColor: THEME.overlay }]}
        activeOpacity={1}
        onPress={goBackToLibrary}
      />

      <View style={[styles.bottomSheet, { backgroundColor: THEME.bg }]}>
        <View
          style={[
            styles.bottomSheetHandle,
            { backgroundColor: THEME.borderDarker },
          ]}
        />
        <Text style={[styles.bottomSheetTitle, { color: THEME.text }]}>
          {optionsTarget?.title}
        </Text>

        <TouchableOpacity
          style={styles.bottomSheetOption}
          onPress={() => optionsTarget && openEditor(optionsTarget)}>
          <Edit3 size={20} color={THEME.text} />
          <Text style={[styles.bottomSheetOptionText, { color: THEME.text }]}>
            {t('templates.edit')}
          </Text>
        </TouchableOpacity>

        <View
          style={[styles.bottomSheetDivider, { backgroundColor: THEME.border }]}
        />

        <TouchableOpacity
          style={styles.bottomSheetOption}
          onPress={() =>
            optionsTarget && handleDeleteTemplate(optionsTarget.id)
          }>
          <Trash2 size={20} color={THEME.danger} />
          <Text style={[styles.bottomSheetOptionText, { color: THEME.danger }]}>
            {t('templates.delete')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <TouchableOpacity
          style={[styles.bottomSheetCancel, { backgroundColor: THEME.border }]}
          onPress={goBackToLibrary}>
          <Text style={[styles.bottomSheetCancelText, { color: THEME.text }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- MAIN RENDER ---
  return (
    <>
      {/* TRIGGER COMPONENT */}
      <View style={styles.triggerContainer}>
        <Text style={[styles.sectionLabel, { color: THEME.textSecondary }]}>
          {t('templates.customNoteTemplate')}
        </Text>

        <TouchableOpacity
          style={[
            styles.triggerCard,
            { backgroundColor: THEME.bg, borderColor: THEME.border },
            selectedTemplate && {
              borderColor: THEME.primary,
              backgroundColor: THEME.primarySubtle,
            },
            THEME.shadow,
          ]}
          onPress={openLibrary}
          activeOpacity={0.8}>
          <View style={styles.triggerContent}>
            {!selectedTemplate && (
              <View
                style={[
                  styles.triggerIconBox,
                  { backgroundColor: THEME.border },
                ]}>
                <Search
                  size={18}
                  color={THEME.textSecondary}
                  strokeWidth={2.5}
                />
              </View>
            )}

            <View style={styles.triggerText}>
              <Text
                style={[
                  styles.triggerTitle,
                  { color: THEME.text },
                  !selectedTemplate && {
                    color: THEME.textSecondary,
                    fontStyle: 'italic',
                  },
                ]}
                numberOfLines={1}>
                {selectedTemplate
                  ? selectedTemplate.title
                  : t('templates.selectTemplate')}
              </Text>
              {selectedTemplate && (
                <Text
                  style={[
                    styles.triggerSubtitle,
                    { color: THEME.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {t('templates.tapToEdit')}
                </Text>
              )}
            </View>

            {selectedTemplate ? (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={14}
                style={styles.clearBtn}>
                <View
                  style={[
                    styles.clearBtnBg,
                    { backgroundColor: THEME.borderDarker },
                  ]}>
                  <X size={14} color={THEME.textSecondary} strokeWidth={3} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.chevronBox}>
                <ChevronRight size={18} color={THEME.textTertiary} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* SINGLE MODAL - View State Architecture */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={viewState === 'library' ? closeModal : goBackToLibrary}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: THEME.bgAlt }}>
            {viewState === 'library' && renderLibraryView()}
            {viewState === 'editor' && renderEditorView()}
            {viewState === 'options' && (
              <>
                {renderLibraryView()}
                {renderOptionsView()}
              </>
            )}
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};

export default CustomTemplateManager;

// --- STYLES ---
const styles = StyleSheet.create({
  // Trigger
  triggerContainer: {
    marginBottom: hp(2.5),
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DEFAULT_THEME.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  triggerCard: {
    backgroundColor: DEFAULT_THEME.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: DEFAULT_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  triggerCardActive: {
    borderColor: DEFAULT_THEME.primary,
    backgroundColor: '#F0FDFA',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  triggerText: {
    flex: 1,
    marginRight: 8,
  },
  triggerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: DEFAULT_THEME.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  triggerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: DEFAULT_THEME.textSecondary,
    flexShrink: 1,
  },
  placeholderText: {
    color: DEFAULT_THEME.textSecondary,
    fontStyle: 'italic',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnBg: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronBox: {
    opacity: 0.5,
  },

  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: DEFAULT_THEME.bgAlt,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: DEFAULT_THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: DEFAULT_THEME.border,
  },
  headerBtn: {
    padding: 4,
    minWidth: 60,
  },
  headerBtnText: {
    fontSize: 16,
    color: DEFAULT_THEME.textSecondary,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: DEFAULT_THEME.text,
  },

  // Search Bar - Native, No Border Issues
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: DEFAULT_THEME.bgAlt,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DEFAULT_THEME.borderDarker,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: DEFAULT_THEME.text,
    marginLeft: 10,
    height: 44,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 20,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearSearchCircle: {
    backgroundColor: DEFAULT_THEME.textTertiary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List & Cards
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  swipeContainer: {
    marginBottom: 12,
  },
  cardItem: {
    backgroundColor: DEFAULT_THEME.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 90,
    justifyContent: 'center',
  },
  cardItemActive: {
    borderColor: DEFAULT_THEME.primary,
    shadowColor: DEFAULT_THEME.primary,
    shadowOpacity: 0.1,
  },
  cardItemBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DEFAULT_THEME.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardTitleActive: {
    color: DEFAULT_THEME.primary,
  },
  cardPreview: {
    fontSize: 14,
    color: DEFAULT_THEME.textSecondary,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  cardOptionBtn: {
    padding: 4,
    marginRight: -4,
  },

  // Swipe Actions
  deleteAction: {
    backgroundColor: DEFAULT_THEME.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
  },
  editAction: {
    backgroundColor: DEFAULT_THEME.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginRight: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyStateText: {
    color: DEFAULT_THEME.textSecondary,
    fontSize: 16,
    marginBottom: 12,
  },
  emptyStateLink: {
    color: DEFAULT_THEME.primary,
    fontWeight: '600',
    fontSize: 16,
  },

  // Editor
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DEFAULT_THEME.border,
    backgroundColor: DEFAULT_THEME.bg,
  },
  methodSelectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: DEFAULT_THEME.text,
  },
  methodSelectionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  methodSelectionSubtitle: {
    fontSize: 15,
    color: DEFAULT_THEME.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DEFAULT_THEME.bg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: DEFAULT_THEME.border,
    ...DEFAULT_THEME.shadow,
  },
  methodCardAI: {
    borderColor: DEFAULT_THEME.primary + '40',
    backgroundColor: DEFAULT_THEME.primarySubtle,
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DEFAULT_THEME.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodIconContainerAI: {
    backgroundColor: DEFAULT_THEME.bg,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: DEFAULT_THEME.text,
    marginBottom: 4,
  },
  methodBadge: {
    fontSize: 14,
  },
  methodDescription: {
    fontSize: 14,
    color: DEFAULT_THEME.textSecondary,
    lineHeight: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: DEFAULT_THEME.textSecondary,
    marginLeft: 2,
  },
  saveBtn: {
    backgroundColor: DEFAULT_THEME.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtnTextDisabled: {
    color: '#9CA3AF',
  },
  editorScroll: {
    flex: 1,
    backgroundColor: DEFAULT_THEME.bg,
  },
  editorContent: {
    padding: 24,
    paddingBottom: 100,
  },
  editorTitleInput: {
    fontSize: 26,
    fontWeight: '700',
    color: DEFAULT_THEME.text,
    marginBottom: 20,
    letterSpacing: -0.5,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: DEFAULT_THEME.border,
    marginBottom: 24,
  },
  editorBodyInput: {
    fontSize: 17,
    lineHeight: 28,
    color: DEFAULT_THEME.text,
    minHeight: 250,
    textAlignVertical: 'top',
    paddingTop: 4,
  },

  // Options Bottom Sheet
  optionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  optionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DEFAULT_THEME.overlay,
  },
  bottomSheet: {
    backgroundColor: DEFAULT_THEME.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DEFAULT_THEME.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  bottomSheetOptionText: {
    fontSize: 17,
    color: DEFAULT_THEME.text,
    fontWeight: '500',
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: DEFAULT_THEME.border,
    marginVertical: 4,
  },
  bottomSheetCancel: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomSheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: DEFAULT_THEME.text,
  },
});
