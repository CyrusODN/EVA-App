import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  Import,
  ChevronRight,
  Clock,
  Send,
  Database,
  BookOpen,
  FileText,
  Link,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

// Mock data for visits
const MOCK_VISITS = [
  {
    id: '1',
    name: 'JS45',
    date: new Date(2024, 1, 15),
    type: 'First Visit',
    specialization: 'Adult Psychiatry',
    transcription: 'Initial consultation with patient...',
    duration: '45 min',
    note: {
      type: 'SOAP',
      content: `**Subjective:**\n- Patient reports persistent anxiety\n- Sleep disturbances noted\n- Decreased appetite\n\n**Objective:**\n- Alert and oriented\n- Appropriate affect\n- No acute distress\n\n**Assessment:**\n- Generalized Anxiety Disorder\n- Major Depressive Disorder\n\n**Plan:**\n1. Start SSRI therapy\n2. Weekly follow-up\n3. Sleep hygiene education`,
    },
  },
  {
    id: '2',
    name: 'AK78',
    date: new Date(2024, 1, 10),
    type: 'Follow-up',
    specialization: 'Child Psychiatry',
    transcription: 'Follow-up visit...',
    duration: '30 min',
    note: {
      type: 'SOAP',
      content: `**Subjective:**\n- Improved sleep pattern\n- Reduced anxiety symptoms\n- Better appetite\n\n**Objective:**\n- Improved affect\n- Good eye contact\n- Relaxed demeanor\n\n**Assessment:**\n- GAD - improving\n- MDD - improving\n\n**Plan:**\n1. Continue current medication\n2. Maintain therapy sessions\n3. Review in 2 weeks`,
    },
  },
];

const Consult = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // State management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedVisits, setSelectedVisits] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: new Set(),
    specialization: new Set(),
    imported: false,
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [importedVisits, setImportedVisits] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Get unique values for filters
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(MOCK_VISITS.map(visit => visit.type))), 
    []
  );
  const uniqueSpecializations = useMemo(() => 
    Array.from(new Set(MOCK_VISITS.map(visit => visit.specialization))), 
    []
  );

  // Filter and sort visits
  const filteredAndSortedVisits = useMemo(() => {
    return MOCK_VISITS.filter(visit => {
      const matchesSearch = visit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filters.type.size === 0 || filters.type.has(visit.type);
      const matchesSpecialization = filters.specialization.size === 0 || 
        filters.specialization.has(visit.specialization);
      const matchesImported = !filters.imported || importedVisits.has(visit.id);
      return matchesSearch && matchesType && matchesSpecialization && matchesImported;
    }).sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'date':
          return (a.date.getTime() - b.date.getTime()) * order;
        case 'name':
          return a.name.localeCompare(b.name) * order;
        case 'type':
          return a.type.localeCompare(b.type) * order;
        case 'specialization':
          return a.specialization.localeCompare(b.specialization) * order;
        default:
          return 0;
      }
    });
  }, [searchQuery, filters, sortBy, sortOrder, importedVisits]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleImport = (visit) => {
    setImportedVisits(prev => new Set([...prev, visit.id]));
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const set = new Set(prev[type]);
      set.has(value) ? set.delete(value) : set.add(value);
      newFilters[type] = set;
      return newFilters;
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('remediusConsult.chat.aiDefaultResponse'),
        timestamp: new Date(),
        sources: [
          {
            type: 'graph',
            title: t('remediusConsult.chat.sources.graph'),
            confidence: 92,
            details: t('remediusConsult.chat.aiAnalysisDetails'),
          },
          { 
            type: 'literature', 
            title: t('remediusConsult.chat.sources.literature'), 
            confidence: 85 
          },
          { 
            type: 'guideline', 
            title: t('remediusConsult.chat.sources.guideline'), 
            confidence: 78 
          },
        ],
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const renderVisitItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.visitCard,
        importedVisits.has(item.id) && styles.importedVisitCard
      ]}
      onPress={() => handleImport(item)}
    >
      <View style={styles.visitHeader}>
        <View>
          <Text variant="titleMedium" style={styles.visitName}>{item.name}</Text>
          <View style={styles.visitMeta}>
            <Clock size={12} color={colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.visitMetaText}>
              {item.date.toLocaleDateString()} • {item.duration}
            </Text>
          </View>
        </View>
        {importedVisits.has(item.id) ? (
          <View style={styles.importedBadge}>
            <Check size={16} color={colors.lightGreen} />
            <Text variant="labelSmall" style={styles.importedText}>
              {t('common.imported')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => handleImport(item)}
          >
            <Import size={14} color="white" />
            <Text variant="labelMedium" style={styles.importButtonText}>
              {t('common.import')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.visitTags}>
        <View style={[styles.tag, styles.typeTag]}>
          <Text variant="labelSmall" style={styles.tagText}>{item.type}</Text>
        </View>
        <View style={[styles.tag, styles.specializationTag]}>
          <Text variant="labelSmall" style={styles.tagText}>{item.specialization}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text variant="bodyMedium" style={[
        styles.messageText,
        item.role === 'user' ? styles.userMessageText : styles.assistantMessageText
      ]}>
        {item.content}
      </Text>
      {item.sources && (
        <View style={styles.sourcesContainer}>
          {item.sources.map((source, index) => (
            <View key={index} style={styles.sourceItem}>
              <View style={styles.sourceHeader}>
                {source.type === 'graph' ? (
                  <Database size={16} color={colors.primary} />
                ) : source.type === 'literature' ? (
                  <BookOpen size={16} color={colors.lightGreen} />
                ) : (
                  <FileText size={16} color="#8B5CF6" />
                )}
                <Text variant="labelMedium" style={styles.sourceTitle}>
                  {source.title}
                </Text>
                <Text variant="labelSmall" style={styles.sourceConfidence}>
                  {source.confidence}% {t('remediusConsult.chat.confidenceSuffix')}
                </Text>
              </View>
              {source.details && (
                <Text variant="bodySmall" style={styles.sourceDetails}>
                  {source.details}
                </Text>
              )}
              {source.link && (
                <TouchableOpacity style={styles.sourceLink}>
                  <Link size={12} color={colors.primary} />
                  <Text variant="labelSmall" style={styles.sourceLinkText}>
                    {t('remediusConsult.chat.viewSource')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('remediusConsult.title')}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {t('remediusConsult.subtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Left Panel - Visit History */}
        {!isSidebarCollapsed && (
          <View style={styles.leftPanel}>
            <View style={styles.leftPanelHeader}>
              <Text variant="titleLarge" style={styles.panelTitle}>
                {t('remediusConsult.visitHistory.title')}
              </Text>
              <View style={styles.filterControls}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} color={colors.onSurface} />
                  <Text variant="labelMedium">{t('common.filters')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => handleSort('date')}
                >
                  <ArrowUpDown size={16} color={colors.onSurface} />
                  <Text variant="labelMedium">{t('common.sortBy')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Search size={16} color={colors.onSurfaceVariant} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('remediusConsult.visitHistory.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.placeholderColor}
              />
            </View>

            {showFilters && (
              <View style={styles.filtersContainer}>
                <Text variant="labelMedium" style={styles.filterLabel}>
                  {t('remediusConsult.filters.visitType')}
                </Text>
                <View style={styles.filterOptions}>
                  {uniqueTypes.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filters.type.has(type) && styles.activeFilterOption
                      ]}
                      onPress={() => toggleFilter('type', type)}
                    >
                      <Text variant="labelSmall" style={[
                        styles.filterOptionText,
                        filters.type.has(type) && styles.activeFilterOptionText
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text variant="labelMedium" style={styles.filterLabel}>
                  {t('remediusConsult.filters.specialization')}
                </Text>
                <View style={styles.filterOptions}>
                  {uniqueSpecializations.map(spec => (
                    <TouchableOpacity
                      key={spec}
                      style={[
                        styles.filterOption,
                        filters.specialization.has(spec) && styles.activeFilterOption
                      ]}
                      onPress={() => toggleFilter('specialization', spec)}
                    >
                      <Text variant="labelSmall" style={[
                        styles.filterOptionText,
                        filters.specialization.has(spec) && styles.activeFilterOptionText
                      ]}>
                        {spec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <FlatList
              data={filteredAndSortedVisits}
              renderItem={renderVisitItem}
              keyExtractor={(item) => item.id}
              style={styles.visitsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Right Panel - Chat */}
        <View style={[styles.rightPanel, isSidebarCollapsed && styles.fullWidthPanel]}>
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <ChevronRight size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderContent}>
              <Text variant="titleLarge" style={styles.chatTitle}>
                {t('remediusConsult.chat.title')}
              </Text>
              <Text variant="bodySmall" style={styles.chatSubtitle}>
                {t('remediusConsult.chat.subtitle')}
              </Text>
            </View>
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatMessages}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.chatInput}>
            <TextInput
              style={styles.messageInput}
              placeholder={t('remediusConsult.chat.placeholder')}
              value={currentMessage}
              onChangeText={setCurrentMessage}
              multiline
              placeholderTextColor={colors.placeholderColor}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!currentMessage.trim()}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: wp(3),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: colors.lightGreen,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: wp(45),
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: colors.outline,
  },
  leftPanelHeader: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  panelTitle: {
    color: colors.onSurface,
    marginBottom: hp(1),
  },
  filterControls: {
    flexDirection: 'row',
    gap: wp(2),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: wp(4),
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
  },
  filtersContainer: {
    padding: wp(4),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  filterLabel: {
    color: colors.onSurface,
    marginBottom: 8,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  activeFilterOption: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.lightGreen,
  },
  filterOptionText: {
    color: colors.onSurface,
  },
  activeFilterOptionText: {
    color: 'white',
  },
  visitsList: {
    flex: 1,
    padding: wp(4),
  },
  visitCard: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  importedVisitCard: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  visitName: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  visitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  visitMetaText: {
    color: colors.onSurfaceVariant,
  },
  importedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
  },
  importedText: {
    color: colors.lightGreen,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.lightGreen,
    borderRadius: 6,
  },
  importButtonText: {
    color: 'white',
  },
  visitTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeTag: {
    backgroundColor: '#DBEAFE',
  },
  specializationTag: {
    backgroundColor: '#F3E8FF',
  },
  tagText: {
    color: colors.onSurface,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },
  fullWidthPanel: {
    width: '100%',
  },
  collapseButton: {
    position: 'absolute',
    top: hp(2),
    left: -15,
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chatHeader: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  chatHeaderContent: {
    alignItems: 'center',
  },
  chatTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  chatSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  chatMessages: {
    flex: 1,
    padding: wp(4),
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    padding: 12,
    borderRadius: 12,
  },
  userMessageText: {
    backgroundColor: colors.lightGreen,
    color: 'white',
  },
  assistantMessageText: {
    backgroundColor: colors.surface,
    color: colors.onSurface,
  },
  sourcesContainer: {
    marginTop: 8,
    gap: 8,
  },
  sourceItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sourceTitle: {
    flex: 1,
    color: colors.onSurface,
  },
  sourceConfidence: {
    color: colors.primary,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceDetails: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  sourceLinkText: {
    color: colors.primary,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    gap: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: colors.onSurface,
  },
  sendButton: {
    backgroundColor: colors.lightGreen,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Consult;