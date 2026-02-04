import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Copy, Save, Share } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface SummaryViewProps {
  visible: boolean;
  onClose: () => void;
  summary: string;
  onSave: () => void;
  onCopy: () => void;
  onExport: () => void;
  title: string;
  primaryColor: string;
  saveLabel: string;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  visible,
  onClose,
  summary,
  onSave,
  onCopy,
  onExport,
  title,
  primaryColor,
  saveLabel,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  // Dynamic theme
  const DYNAMIC_THEME = {
    background: isDark ? themeColors.canvas : '#F5F5F7',
    headerBg: isDark ? themeColors.layer1 : '#FFFFFF',
    text: isDark ? themeColors.textPrimary : colors.onSurface,
    textSecondary: isDark ? themeColors.textSecondary : '#6B7280',
    border: isDark ? themeColors.borderSubtle : '#E5E5EA',
    card: isDark ? themeColors.layer2 : '#FFFFFF',
    docText: isDark ? '#E5E5E5' : '#333333',
    actionIcon: isDark ? themeColors.textPrimary : colors.onSurface,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.resultContainer, { backgroundColor: DYNAMIC_THEME.background }]}>
        <View style={[styles.resultHeader, { backgroundColor: DYNAMIC_THEME.headerBg, borderBottomColor: DYNAMIC_THEME.border }]}>
          <View style={{ width: 24 }} />
          <Text style={[styles.resultTitle, { color: DYNAMIC_THEME.text }]}>{title}</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onClose}
          >
            <Text style={[styles.saveButtonText, { color: primaryColor }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.documentCard, { backgroundColor: DYNAMIC_THEME.card }]}>
            <Text style={[styles.documentText, { color: DYNAMIC_THEME.docText }]}>{summary}</Text>
          </View>
          <View style={{ height: hp(5) }} />
        </ScrollView>

        {/* Action Bar */}
        <View style={[styles.resultActions, { backgroundColor: DYNAMIC_THEME.headerBg, borderTopColor: DYNAMIC_THEME.border }]}>
          <TouchableOpacity style={styles.resultActionBtn} onPress={onSave}>
            <Save size={20} color={DYNAMIC_THEME.actionIcon} />
            <Text style={[styles.resultActionLabel, { color: DYNAMIC_THEME.actionIcon }]}>{saveLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultActionBtn} onPress={onCopy}>
            <Copy size={20} color={DYNAMIC_THEME.actionIcon} />
            <Text style={[styles.resultActionLabel, { color: DYNAMIC_THEME.actionIcon }]}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultActionBtn} onPress={onExport}>
            <Share size={20} color={DYNAMIC_THEME.actionIcon} />
            <Text style={[styles.resultActionLabel, { color: DYNAMIC_THEME.actionIcon }]}>Export</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default SummaryView;

const styles = StyleSheet.create({
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  resultContent: {
    flex: 1,
    padding: 16,
  },
  documentCard: {
    borderRadius: 4, // A4 style
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: hp(60),
  },
  documentText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  resultActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  resultActionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  resultActionLabel: {
    fontSize: 12,
  },
});