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

/**
 * Renders markdown text with bold sections and headers in blue color
 */
const renderMarkdown = (text: string, textColor: string, primaryColor: string) => {
  const lines = text.split('\n');
  
  return (
    <View>
      {lines.map((line, lineIndex) => {
        // Skip completely empty lines
        if (line.trim() === '') {
          return null;
        }
        
        // Check if line starts with # (markdown header)
        const headerMatch = line.match(/^(#+)\s*(.+)$/);
        
        if (headerMatch) {
          // Render header without # symbols in blue
          const headerText = headerMatch[2];
          return (
            <Text 
              key={lineIndex} 
              style={[
                styles.documentText,
                { 
                  fontWeight: '700',
                  color: primaryColor,
                  marginTop: 8,
                }
              ]}
            >
              {headerText}{'\n'}
            </Text>
          );
        }
        
        // Parse bold text wrapped in **
        const parts = line.split(/(\*\*.*?\*\*)/g);
        
        return (
          <Text 
            key={lineIndex} 
            style={[
              styles.documentText,
              { color: textColor }
            ]}
          >
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                // Render bold text in blue without ** symbols
                return (
                  <Text
                    key={partIndex}
                    style={{
                      fontWeight: '700',
                      color: primaryColor,
                    }}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return <Text key={partIndex}>{part}</Text>;
            })}
            {'\n'}
          </Text>
        );
      })}
    </View>
  );
};


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

  // Dynamic theme with improved contrast
  const DYNAMIC_THEME = {
    background: isDark ? '#1a1919ff' : '#F5F5F7',
    headerBg: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1C1C1E',
    textSecondary: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E5EA',
    card: isDark ? '#fdfdfeff' : '#FFFFFF',
    docText: isDark ? '#E5E5EA' : '#1C1C1E',
    actionIcon: isDark ? '#FFFFFF' : '#1C1C1E',
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
            {renderMarkdown(summary, DYNAMIC_THEME.docText, primaryColor)}
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
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minHeight: hp(60),
  },
  documentText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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