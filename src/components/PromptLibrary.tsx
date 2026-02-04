import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  Check,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  MoreHorizontal,
  ChevronLeft,
} from 'lucide-react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import * as Haptics from 'expo-haptics';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import MagicTemplateCreatorInline from './MagicTemplateCreatorInline';
import { useTheme } from '../constants/theme';

export type CustomPrompt = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type PromptLibraryProps = {
  visible: boolean;
  onClose: () => void;
  prompts: CustomPrompt[];
  selectedPromptId: string | null;
  onSelectPrompt: (prompt: CustomPrompt) => void;
  onDeletePrompt: (id: string) => void;
  onSavePrompt: (prompt: { name: string; instructions: string; refinedPrompt: string }) => void;
};

// View states (single modal architecture like customTemplateManager)
type ViewState = 'library' | 'creator';

const PromptLibrary: React.FC<PromptLibraryProps> = ({
  visible,
  onClose,
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onDeletePrompt,
  onSavePrompt,
}) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useTheme();
  
  // Dynamic theme tokens
  const THEME = useMemo(() => ({
    primary: themeColors.accentPrimary,
    primarySubtle: isDark ? 'rgba(70, 183, 198, 0.1)' : '#F0FDFA',
    text: isDark ? themeColors.textPrimary : '#111827',
    textSecondary: isDark ? themeColors.textSecondary : '#6B7280',
    textTertiary: isDark ? themeColors.textMuted : '#9CA3AF',
    bg: isDark ? themeColors.canvas : '#FFFFFF',
    bgAlt: isDark ? themeColors.layer1 : '#F9FAFB',
    border: isDark ? themeColors.borderSubtle : '#F3F4F6',
    borderDarker: isDark ? themeColors.borderNormal : '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
    shadow: isDark ? {
      shadowColor: themeColors.accentPrimary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
  }), [themeColors, isDark]);
  
  // State
  const [viewState, setViewState] = useState<ViewState>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [optionsTarget, setOptionsTarget] = useState<CustomPrompt | null>(null);
  
  const swipeableRefs = useRef(new Map()).current;
  const searchInputRef = useRef<TextInput>(null);

  // Computed
  const filteredPrompts = useMemo(
    () => prompts.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [prompts, searchQuery],
  );

  // Handlers
  const handleClose = useCallback(() => {
    setSearchQuery('');
    setViewState('library');
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((prompt: CustomPrompt) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectPrompt(prompt);
    swipeableRefs.forEach((ref: any) => ref?.close());
  }, [onSelectPrompt, swipeableRefs]);

  const handleDelete = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      t('dischargeAssistant.prompts.deleteTitle'),
      t('dischargeAssistant.prompts.deleteMessage'),
      [
        { text: t('dischargeAssistant.actions.cancel'), style: 'cancel' },
        {
          text: t('dischargeAssistant.prompts.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            onDeletePrompt(id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ],
    );
  }, [onDeletePrompt, t]);

  const handleOpenMagicCreator = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setViewState('creator');
  }, []);

  const handleSaveFromMagic = useCallback((template: {
    name: string;
    instructions: string;
    refinedPrompt: string;
  }) => {
    const magicTemplate = {
      name: template.name,
      instructions: template.instructions,
      refinedPrompt: template.refinedPrompt,
    };
    onSavePrompt(magicTemplate);
    setViewState('library');
  }, [onSavePrompt]);

  const handleCancelMagic = useCallback(() => {
    setViewState('library');
  }, []);

  const handleOpenOptions = useCallback((prompt: CustomPrompt) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setOptionsTarget(prompt);
  }, []);

  // Swipe actions
  const renderRightActions = useCallback((id: string) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(id)}>
      <Trash2 size={20} color="#FFFFFF" />
    </TouchableOpacity>
  ), [handleDelete]);

  // Render library view
  const renderLibraryView = () => (
    <View style={[styles.modalContainer, { backgroundColor: THEME.bg }]}>
      {/* Header */}
      <View style={[styles.modalHeader, { borderBottomColor: THEME.border }]}>
        <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: THEME.textSecondary }]}>{t('common.close')}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.modalTitle, { color: THEME.text }]}>{t('dischargeAssistant.prompts.title')}</Text>
        
        <TouchableOpacity onPress={handleOpenMagicCreator} hitSlop={12} style={styles.headerBtn}>
          <Plus size={24} color={THEME.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: THEME.bgAlt }]}>
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
              <View style={[styles.clearSearchCircle, { backgroundColor: THEME.textTertiary }]}>
                <X size={10} color="#FFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredPrompts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => {
          const isSelected = selectedPromptId === item.id;
          return (
            <Swipeable
              ref={ref => { if (ref) swipeableRefs.set(item.id, ref); }}
              renderRightActions={() => renderRightActions(item.id)}
              containerStyle={styles.swipeContainer}
            >
              <TouchableOpacity
                style={[
                  styles.cardItem, 
                  { 
                    backgroundColor: THEME.bg,
                    borderColor: THEME.border,
                    ...THEME.shadow
                  },
                  isSelected && { 
                    borderColor: THEME.primary,
                    backgroundColor: THEME.primarySubtle
                  }
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.9}
              >
                <View style={styles.cardItemBody}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[
                        styles.cardTitle, 
                        { color: THEME.text },
                        isSelected && { color: THEME.primary }
                      ]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {isSelected && <Check size={16} color={THEME.primary} style={{marginLeft: 6}} />}
                    </View>
                    
                    <TouchableOpacity onPress={() => handleOpenOptions(item)} hitSlop={14} style={styles.cardOptionBtn}>
                      <MoreHorizontal size={20} color={THEME.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={[styles.cardPreview, { color: THEME.textSecondary }]} numberOfLines={2}>
                    {item.content}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: THEME.bgAlt }]}>
              <FileText size={32} color={THEME.textTertiary} />
            </View>
            <Text style={[styles.emptyStateText, { color: THEME.textSecondary }]}>{t('dischargeAssistant.prompts.empty')}</Text>
            <TouchableOpacity onPress={handleOpenMagicCreator}>
              <Text style={[styles.emptyStateLink, { color: THEME.primary }]}>{t('dischargeAssistant.prompts.createNew')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Options Modal */}
      {optionsTarget && (
        <Modal
          visible={!!optionsTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setOptionsTarget(null)}
        >
          <TouchableOpacity 
            style={[styles.optionsOverlay, { backgroundColor: THEME.overlay }]}
            activeOpacity={1}
            onPress={() => setOptionsTarget(null)}
          >
            <View style={[styles.optionsCard, { backgroundColor: THEME.bg }]}>
              <Text style={[styles.optionsTitle, { color: THEME.text }]}>{optionsTarget.title}</Text>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  setOptionsTarget(null);
                  handleDelete(optionsTarget.id);
                }}
              >
                <Trash2 size={18} color={THEME.danger} />
                <Text style={[styles.optionText, { color: THEME.danger }]}>
                  {t('dischargeAssistant.prompts.delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );

  // Render creator view
  const renderCreatorView = () => (
    <View style={[styles.modalContainer, { backgroundColor: THEME.bg }]}>
      <View style={[styles.creatorHeader, { borderBottomColor: THEME.border }]}>
        <TouchableOpacity onPress={handleCancelMagic} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={THEME.textSecondary} />
          <Text style={[styles.backBtnText, { color: THEME.textSecondary }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={{ width: 60 }} />
      </View>
      
      <MagicTemplateCreatorInline
        visible={true}
        onSaveTemplate={handleSaveFromMagic}
        onClose={handleCancelMagic}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]} edges={['top']}>
          {viewState === 'library' ? renderLibraryView() : renderCreatorView()}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
  },
  headerBtn: {
    minWidth: 60,
  },
  headerBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  clearSearchCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(3),
  },
  swipeContainer: {
    marginBottom: 8,
  },
  cardItem: {
    borderRadius: 16,
    borderWidth: 1,
  },
  cardItemActive: {
    // Removed - now inline
  },
  cardItemBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardTitleActive: {
    // Removed - now inline
  },
  cardOptionBtn: {
    padding: 4,
  },
  cardPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(12),
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 12,
  },
  emptyStateLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  optionsCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: hp(5),
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PromptLibrary;