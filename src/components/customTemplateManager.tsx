import React, { useMemo, useState, useRef, useCallback } from 'react';
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
} from 'lucide-react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
// @ts-ignore
import * as Haptics from 'expo-haptics';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import MagicTemplateCreatorInline from './MagicTemplateCreatorInline';

export type CustomTemplate = {
  id: string;
  title: string;
  content: string;
  lastUsed?: Date;
};

type CustomTemplateManagerProps = {
  onSelectTemplate: (template: CustomTemplate | null) => void;
  selectedTemplateId: string | null;
};

// --- PREMIUM DESIGN TOKENS (Linear/Things3 Style) ---
const THEME = {
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

const INITIAL_TEMPLATES: CustomTemplate[] = [
  {
    id: '1',
    title: 'Psychiatry - First Visit',
    content: 'Focus on history, affective symptoms, and suicidality risk. Format as SOAP.',
  },
  {
    id: '2',
    title: 'Cardiology - Follow-up',
    content: 'Assess blood pressure, medication tolerance, dyspnea, and edema.',
  },
  {
    id: '3',
    title: 'General - Brief',
    content: 'Include only key diagnoses and treatment plan. Keep the note concise.',
  },
];

// --- VIEW STATES (Single Modal Architecture) ---
type ViewState = 'closed' | 'library' | 'editor' | 'options';

const CustomTemplateManager = ({
  onSelectTemplate,
  selectedTemplateId,
}: CustomTemplateManagerProps) => {
  const { t } = useTranslation();
  
  // --- STATE ---
  const [templates, setTemplates] = useState<CustomTemplate[]>(INITIAL_TEMPLATES);
  const [viewState, setViewState] = useState<ViewState>('closed');
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [optionsTarget, setOptionsTarget] = useState<CustomTemplate | null>(null);
  
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai' | null>(null);

  const swipeableRefs = useRef(new Map()).current;
  const searchInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);

  // --- COMPUTED ---
  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  );

  const filteredTemplates = useMemo(
    () => templates.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [templates, searchQuery],
  );

  const isModalVisible = viewState !== 'closed';

  // --- HANDLERS ---
  const openLibrary = useCallback(() => {
    Haptics.selectionAsync();
    setViewState('library');
  }, []);

  const openEditor = useCallback((template?: CustomTemplate) => {
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
  }, [swipeableRefs]);

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

  const handleSaveTemplate = useCallback(() => {
    if (!titleInput.trim() || !contentInput.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('templates.errors.incompleteTitle'), t('templates.errors.incompleteMessage'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (editingTemplate) {
      setTemplates(prev =>
        prev.map(t =>
          t.id === editingTemplate.id
            ? { ...t, title: titleInput.trim(), content: contentInput.trim() }
            : t,
        ),
      );
    } else {
      const newTemplate: CustomTemplate = {
        id: Date.now().toString(),
        title: titleInput.trim(),
        content: contentInput.trim(),
        lastUsed: new Date(),
      };
      setTemplates(prev => [newTemplate, ...prev]);
    }

    goBackToLibrary();
  }, [titleInput, contentInput, editingTemplate, goBackToLibrary]);

  const handleDeleteTemplate = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(t('templates.deleteTitle'), t('templates.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel', onPress: () => {
        swipeableRefs.get(id)?.close();
        if (viewState === 'options') goBackToLibrary();
      }},
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setTemplates(prev => prev.filter(t => t.id !== id));
          if (selectedTemplateId === id) onSelectTemplate(null);
          goBackToLibrary();
        },
      },
    ]);
  }, [swipeableRefs, viewState, selectedTemplateId, onSelectTemplate, goBackToLibrary]);

  const handleSelect = useCallback((item: CustomTemplate) => {
    Haptics.selectionAsync();
    onSelectTemplate(item);
    closeModal();
  }, [onSelectTemplate, closeModal]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTemplate(null);
  }, [onSelectTemplate]);

  // --- SWIPE ACTIONS ---
  const renderRightActions = useCallback((id: string) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDeleteTemplate(id)}>
      <Trash2 size={20} color="#FFFFFF" />
    </TouchableOpacity>
  ), [handleDeleteTemplate]);

  const renderLeftActions = useCallback((item: CustomTemplate) => (
    <TouchableOpacity style={styles.editAction} onPress={() => openEditor(item)}>
      <Edit3 size={20} color="#FFFFFF" />
    </TouchableOpacity>
  ), [openEditor]);

  // --- RENDER: Library View ---
  const renderLibraryView = () => (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={closeModal} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{t('common.close')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.modalTitle}>{t('templates.title')}</Text>
        
        <TouchableOpacity onPress={() => openEditor()} hitSlop={12} style={styles.headerBtn}>
          <Plus size={24} color={THEME.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar - Native TextInput, No Wrapper Borders */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={THEME.textTertiary} />
          <TextInput
            ref={searchInputRef}
            placeholder={t('templates.searchPlaceholder')}
            placeholderTextColor={THEME.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            selectionColor={THEME.primary}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <View style={styles.clearSearchCircle}>
                <X size={10} color="#FFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => {
          const isSelected = selectedTemplateId === item.id;
          return (
            <Swipeable
              ref={ref => { if (ref) swipeableRefs.set(item.id, ref); }}
              renderRightActions={() => renderRightActions(item.id)}
              renderLeftActions={() => renderLeftActions(item)}
              containerStyle={styles.swipeContainer}
            >
              <TouchableOpacity
                style={[styles.cardItem, isSelected && styles.cardItemActive]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.9}
              >
                <View style={styles.cardItemBody}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {isSelected && <Check size={16} color={THEME.primary} style={{marginLeft: 6}} />}
                    </View>
                    
                    <TouchableOpacity onPress={() => openOptions(item)} hitSlop={14} style={styles.cardOptionBtn}>
                      <MoreHorizontal size={20} color={THEME.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.cardPreview} numberOfLines={2}>
                    {item.content}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <FileText size={32} color={THEME.textTertiary} />
            </View>
            <Text style={styles.emptyStateText}>{t('templates.empty')}</Text>
            <TouchableOpacity onPress={() => openEditor()}>
              <Text style={styles.emptyStateLink}>{t('templates.createNew')}</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={goBackToLibrary} hitSlop={12} style={styles.backBtn}>
              <ChevronLeft size={24} color={THEME.textSecondary} />
              <Text style={styles.backBtnText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.methodSelectionTitle}>{t('templates.howToCreate')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.methodSelectionContainer}>
            <Text style={styles.methodSelectionSubtitle}>
              {t('templates.chooseMethod')}
            </Text>

            {/* Manual Method Card */}
            <TouchableOpacity
              style={styles.methodCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCreationMethod('manual');
              }}
              activeOpacity={0.9}
            >
              <View style={styles.methodIconContainer}>
                <Edit size={28} color={THEME.primary} strokeWidth={2} />
              </View>
              <View style={styles.methodTextContainer}>
                <Text style={styles.methodTitle}>{t('templates.manualMethod')}</Text>
                <Text style={styles.methodDescription}>
                  {t('templates.manualDescription')}
                </Text>
              </View>
              <ChevronRight size={20} color={THEME.textTertiary} />
            </TouchableOpacity>

            {/* AI Assistant Method Card */}
            <TouchableOpacity
              style={[styles.methodCard, styles.methodCardAI]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCreationMethod('ai');
              }}
              activeOpacity={0.9}
            >
              <View style={[styles.methodIconContainer, styles.methodIconContainerAI]}>
                <Wand2 size={28} color={THEME.primary} strokeWidth={2} />
              </View>
              <View style={styles.methodTextContainer}>
                <Text style={styles.methodTitle}>
                  {t('templates.aiMethod')}
                  <Text style={styles.methodBadge}> ✨</Text>
                </Text>
                <Text style={styles.methodDescription}>
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
          style={styles.modalContainer}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity 
              onPress={() => {
                if (editingTemplate) {
                  goBackToLibrary();
                } else {
                  setCreationMethod(null);
                }
              }} 
              hitSlop={12} 
              style={styles.backBtn}
            >
              <ChevronLeft size={24} color={THEME.textSecondary} />
              <Text style={styles.backBtnText}>{t('common.back')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSaveTemplate} 
              style={[styles.saveBtn, (!titleInput.trim() || !contentInput.trim()) && styles.saveBtnDisabled]}
              disabled={!titleInput.trim() || !contentInput.trim()}
            >
              <Text style={[styles.saveBtnText, (!titleInput.trim() || !contentInput.trim()) && styles.saveBtnTextDisabled]}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.editorScroll} 
            contentContainerStyle={styles.editorContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              ref={titleInputRef}
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder={t('templates.titlePlaceholder')}
              placeholderTextColor={THEME.textTertiary}
              style={styles.editorTitleInput}
              selectionColor={THEME.primary}
              autoFocus={!editingTemplate}
              multiline={true}
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.divider} />

            <TextInput
              value={contentInput}
              onChangeText={setContentInput}
              placeholder={t('templates.contentPlaceholder')}
              placeholderTextColor={THEME.textTertiary}
              multiline
              style={styles.editorBodyInput}
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
        <View style={styles.modalContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity 
              onPress={() => setCreationMethod(null)} 
              hitSlop={12} 
              style={styles.backBtn}
            >
              <ChevronLeft size={24} color={THEME.textSecondary} />
              <Text style={styles.backBtnText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.methodSelectionTitle}>{t('templates.aiMethod')}</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <MagicTemplateCreatorInline
            onSave={(aiTemplate) => {
              // Create new template from AI result
              const newTemplate: CustomTemplate = {
                id: Date.now().toString(),
                title: aiTemplate.title,
                content: aiTemplate.content,
                lastUsed: new Date(),
              };
              
              setTemplates(prev => [newTemplate, ...prev]);
              
              // Reset and go back
              setCreationMethod(null);
              goBackToLibrary();
              
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
            onCancel={() => setCreationMethod(null)}
          />
        </View>
      );
    }

    return null;
  };

  // --- RENDER: Options View (Bottom Sheet Overlay) ---
  const renderOptionsView = () => (
    <View style={styles.optionsOverlay}>
      <TouchableOpacity style={styles.optionsBackdrop} activeOpacity={1} onPress={goBackToLibrary} />
      
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        <Text style={styles.bottomSheetTitle}>{optionsTarget?.title}</Text>
        
        <TouchableOpacity 
          style={styles.bottomSheetOption} 
          onPress={() => optionsTarget && openEditor(optionsTarget)}
        >
          <Edit3 size={20} color={THEME.text} />
          <Text style={styles.bottomSheetOptionText}>{t('templates.edit')}</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomSheetDivider} />
        
        <TouchableOpacity 
          style={styles.bottomSheetOption} 
          onPress={() => optionsTarget && handleDeleteTemplate(optionsTarget.id)}
        >
          <Trash2 size={20} color={THEME.danger} />
          <Text style={[styles.bottomSheetOptionText, {color: THEME.danger}]}>{t('templates.delete')}</Text>
        </TouchableOpacity>
        
        <View style={{height: 20}} />
        
        <TouchableOpacity style={styles.bottomSheetCancel} onPress={goBackToLibrary}>
          <Text style={styles.bottomSheetCancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- MAIN RENDER ---
  return (
    <>
      {/* TRIGGER COMPONENT */}
      <View style={styles.triggerContainer}>
        <Text style={styles.sectionLabel}>{t('templates.customNoteTemplate')}</Text>
        
        <TouchableOpacity
          style={[styles.triggerCard, selectedTemplate && styles.triggerCardActive]}
          onPress={openLibrary}
          activeOpacity={0.8}
        >
          <View style={styles.triggerContent}>
            {!selectedTemplate && (
              <View style={styles.triggerIconBox}>
                <Search size={18} color={THEME.textSecondary} strokeWidth={2.5} />
              </View>
            )}

            <View style={styles.triggerText}>
              <Text
                style={[styles.triggerTitle, !selectedTemplate && styles.placeholderText]}
                numberOfLines={1}
              >
                {selectedTemplate ? selectedTemplate.title : t('templates.selectTemplate')}
              </Text>
              {selectedTemplate && (
                <Text style={styles.triggerSubtitle} numberOfLines={1}>
                  {t('templates.tapToEdit')}
                </Text>
              )}
            </View>
            
            {selectedTemplate ? (
              <TouchableOpacity onPress={handleClear} hitSlop={14} style={styles.clearBtn}>
                <View style={styles.clearBtnBg}>
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
        onRequestClose={viewState === 'library' ? closeModal : goBackToLibrary}
      >
        <GestureHandlerRootView style={{flex: 1}}>
          <SafeAreaView style={{flex: 1, backgroundColor: THEME.bgAlt}}>
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
    color: THEME.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  triggerCard: {
    backgroundColor: THEME.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  triggerCardActive: {
    borderColor: THEME.primary,
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
    color: THEME.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  triggerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: THEME.textSecondary,
    flexShrink: 1,
  },
  placeholderText: {
    color: THEME.textSecondary,
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
    backgroundColor: THEME.bgAlt,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerBtn: {
    padding: 4,
    minWidth: 60,
  },
  headerBtnText: {
    fontSize: 16,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },

  // Search Bar - Native, No Border Issues
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: THEME.bgAlt,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.borderDarker,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
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
    backgroundColor: THEME.textTertiary,
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
    backgroundColor: THEME.bg,
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
    borderColor: THEME.primary,
    shadowColor: THEME.primary,
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
    color: THEME.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardTitleActive: {
    color: THEME.primary,
  },
  cardPreview: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  cardOptionBtn: {
    padding: 4,
    marginRight: -4,
  },

  // Swipe Actions
  deleteAction: {
    backgroundColor: THEME.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
  },
  editAction: {
    backgroundColor: THEME.textSecondary,
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
    color: THEME.textSecondary,
    fontSize: 16,
    marginBottom: 12,
  },
  emptyStateLink: {
    color: THEME.primary,
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
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  methodSelectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  methodSelectionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  methodSelectionSubtitle: {
    fontSize: 15,
    color: THEME.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: THEME.border,
    ...THEME.shadow,
  },
  methodCardAI: {
    borderColor: THEME.primary + '40',
    backgroundColor: THEME.primarySubtle,
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodIconContainerAI: {
    backgroundColor: THEME.bg,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  methodBadge: {
    fontSize: 14,
  },
  methodDescription: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginLeft: 2,
  },
  saveBtn: {
    backgroundColor: THEME.primary,
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
    backgroundColor: THEME.bg,
  },
  editorContent: {
    padding: 24,
    paddingBottom: 100,
  },
  editorTitleInput: {
    fontSize: 26,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 20,
    letterSpacing: -0.5,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginBottom: 24,
  },
  editorBodyInput: {
    fontSize: 17,
    lineHeight: 28,
    color: THEME.text,
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
    backgroundColor: THEME.overlay,
  },
  bottomSheet: {
    backgroundColor: THEME.bg,
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
    color: THEME.text,
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
    color: THEME.text,
    fontWeight: '500',
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: THEME.border,
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
    color: THEME.text,
  },
});
