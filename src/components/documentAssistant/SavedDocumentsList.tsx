import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import type { SavedSummary } from './types';
import { useTheme } from '../../constants/theme';

interface SavedDocumentsListProps {
  visible: boolean;
  onClose: () => void;
  items: SavedSummary[];
  onSelectItem: (item: SavedSummary) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string, title: string) => void;
  title: string;
  emptyText: string;
  renameText: string;
  deleteText: string;
  cancelText: string;
}

const SavedDocumentsList: React.FC<SavedDocumentsListProps> = ({
  visible,
  onClose,
  items,
  onSelectItem,
  onRename,
  onDelete,
  title,
  emptyText,
  renameText,
  deleteText,
  cancelText,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  // Dynamic theme
  const DYNAMIC_THEME = {
    background: isDark ? themeColors.canvas : '#FFFFFF',
    surface: isDark ? themeColors.layer1 : '#FFFFFF',
    border: isDark ? themeColors.borderSubtle : '#E5E5EA',
    text: isDark ? themeColors.textPrimary : '#111827',
    textSecondary: isDark ? themeColors.textSecondary : '#4B5563',
    textMuted: isDark ? themeColors.textMuted : '#8E8E93',
    iconColor: isDark ? themeColors.textPrimary : colors.onSurface,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView
        style={[
          styles.savedModalContainer,
          { backgroundColor: DYNAMIC_THEME.background },
        ]}>
        <View
          style={[
            styles.savedModalHeader,
            { borderBottomColor: DYNAMIC_THEME.border },
          ]}>
          <Text style={[styles.savedModalTitle, { color: DYNAMIC_THEME.text }]}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color={DYNAMIC_THEME.iconColor} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.savedList}>
          {items.length === 0 ? (
            <Text
              style={[
                styles.savedEmptyText,
                { color: DYNAMIC_THEME.textMuted },
              ]}>
              {emptyText}
            </Text>
          ) : (
            items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.savedCard,
                  {
                    backgroundColor: DYNAMIC_THEME.surface,
                    borderColor: DYNAMIC_THEME.border,
                    ...(isDark
                      ? {
                          shadowColor: '#46B7C6',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8,
                          elevation: 3,
                        }
                      : {}),
                  },
                ]}>
                <View style={styles.savedCardHeader}>
                  <TouchableOpacity
                    style={styles.savedCardContent}
                    onPress={() => onSelectItem(item)}>
                    <Text
                      style={[
                        styles.savedTitle,
                        { color: DYNAMIC_THEME.text },
                      ]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.savedMeta,
                        { color: DYNAMIC_THEME.textMuted },
                      ]}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.savedActions}>
                    <TouchableOpacity
                      onPress={() => onRename(item.id, item.title)}>
                      <Text style={styles.savedRename}>{renameText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDelete(item.id, item.title)}>
                      <Text style={[styles.savedRename, styles.savedDelete]}>
                        {deleteText}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text
                  style={[
                    styles.savedPreview,
                    { color: DYNAMIC_THEME.textSecondary },
                  ]}
                  numberOfLines={2}>
                  {item.content.replace(/\n/g, ' ')}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default SavedDocumentsList;

const styles = StyleSheet.create({
  savedModalContainer: {
    flex: 1,
  },
  savedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  savedModalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  savedList: {
    padding: 16,
    gap: 12,
  },
  savedEmptyText: {
    textAlign: 'center',
    marginTop: 40,
  },
  savedCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  savedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savedCardContent: {
    flex: 1,
    marginRight: 12,
  },
  savedActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  savedTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  savedMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  savedRename: {
    fontSize: 12,
    color: '#46B7C6',
    fontWeight: '600',
  },
  savedDelete: {
    color: '#EF4444',
  },
  savedPreview: {
    fontSize: 13,
    lineHeight: 18,
  },
});
