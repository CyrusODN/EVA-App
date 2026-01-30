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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <View style={{ width: 24 }} />
          <Text style={styles.resultTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onClose}
          >
            <Text style={[styles.saveButtonText, { color: primaryColor }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultContent} showsVerticalScrollIndicator={false}>
          <View style={styles.documentCard}>
            <Text style={styles.documentText}>{summary}</Text>
          </View>
          <View style={{ height: hp(5) }} />
        </ScrollView>

        {/* Action Bar */}
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.resultActionBtn} onPress={onSave}>
            <Save size={20} color={colors.onSurface} />
            <Text style={styles.resultActionLabel}>{saveLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultActionBtn} onPress={onCopy}>
            <Copy size={20} color={colors.onSurface} />
            <Text style={styles.resultActionLabel}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultActionBtn} onPress={onExport}>
            <Share size={20} color={colors.onSurface} />
            <Text style={styles.resultActionLabel}>Export</Text>
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
    backgroundColor: '#F5F5F7',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
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
    backgroundColor: 'white',
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
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  resultActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  resultActionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  resultActionLabel: {
    fontSize: 12,
    color: colors.onSurface,
  },
});