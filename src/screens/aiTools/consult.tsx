import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Modal,
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
  Clock,
  Send,
  Database,
  BookOpen,
  FileText,
  Link,
  MessageSquare,
  FileSearch,
  X,
  Calendar,
  User,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [activeTab, setActiveTab] = useState('visits');
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
    <TouchableOpacity style={styles.visitCard}>
      <View style={styles.visitCardHeader}>
        <View style={styles.visitInfo}>
          <View style={styles.visitNameRow}>
            <View style={styles.patientAvatar}>
              <User size={16} color="white" />
            </View>
            <View style={styles.visitDetails}>
              <Text variant="titleMedium" style={styles.visitName}>{item.name}</Text>
              <View style={styles.visitMeta}>
                <Calendar size={12} color={colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={styles.visitMetaText}>
                  {item.date.toLocaleDateString()}
                </Text>
                <Clock size={12} color={colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={styles.visitMetaText}>
                  {item.duration}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {importedVisits.has(item.id) ? (
          <View style={styles.importedBadge}>
            <Check size={14} color="white" />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => handleImport(item)}
          >
            <Import size={14} color="white" />
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

      <View style={styles.visitActions}>
        <TouchableOpacity style={styles.actionButton}>
          <FileText size={16} color={colors.primary} />
          <Text variant="labelSmall" style={styles.actionButtonText}>View Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MessageSquare size={16} color={colors.lightGreen} />
          <Text variant="labelSmall" style={styles.actionButtonText}>Discuss</Text>
        </TouchableOpacity>
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
      <Text variant="bodySmall" style={styles.messageTime}>
        {item.timestamp.toLocaleTimeString()}
      </Text>
      {item.sources && (
        <View style={styles.sourcesContainer}>
          <Text variant="labelMedium" style={styles.sourcesLabel}>Sources:</Text>
          {item.sources.map((source, index) => (
            <TouchableOpacity key={index} style={styles.sourceItem}>
              <View style={styles.sourceHeader}>
                {source.type === 'graph' ? (
                  <Database size={14} color={colors.primary} />
                ) : source.type === 'literature' ? (
                  <BookOpen size={14} color={colors.lightGreen} />
                ) : (
                  <FileText size={14} color="#8B5CF6" />
                )}
                <Text variant="labelSmall" style={styles.sourceTitle}>
                  {source.title}
                </Text>
                <View style={styles.confidenceBadge}>
                  <Text variant="labelSmall" style={styles.confidenceText}>
                    {source.confidence}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderVisitsTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Filters */}
      <View style={styles.searchAndFilters}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('remediusConsult.visitHistory.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.onSurfaceVariant}
          />
        </View>
        
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, showFilters && styles.activeFilterChip]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} color={showFilters ? 'white' : colors.onSurface} />
            <Text variant="labelSmall" style={[
              styles.filterChipText,
              showFilters && styles.activeFilterChipText
            ]}>
              Filters
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => handleSort('date')}
          >
            <ArrowUpDown size={14} color={colors.onSurface} />
            <Text variant="labelSmall" style={styles.filterChipText}>
              Sort
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visits List */}
      <FlatList
        data={filteredAndSortedVisits}
        renderItem={renderVisitItem}
        keyExtractor={(item) => item.id}
        style={styles.visitsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.visitsListContent}
      />
    </View>
  );

  const renderChatTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.chatHeader}>
        <Text variant="titleMedium" style={styles.chatTitle}>
          AI Medical Consultation
        </Text>
        <Text variant="bodySmall" style={styles.chatSubtitle}>
          Ask questions about patient cases and get AI-powered insights
        </Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatMessages}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatMessagesContent}
      />

      <View style={styles.chatInputContainer}>
        <View style={styles.chatInput}>
          <TextInput
            style={styles.messageInput}
            placeholder="Ask about a patient case..."
            value={currentMessage}
            onChangeText={setCurrentMessage}
            multiline
            placeholderTextColor={colors.onSurfaceVariant}
          />
          <TouchableOpacity
            style={[styles.sendButton, !currentMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!currentMessage.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Medical Consultation
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            AI-powered case analysis
          </Text>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'visits' ? renderVisitsTab() : renderChatTab()}

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'visits' && styles.activeTab]}
          onPress={() => setActiveTab('visits')}
        >
          <FileSearch size={20} color={activeTab === 'visits' ? colors.lightGreen : colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={[
            styles.tabText,
            activeTab === 'visits' && styles.activeTabText
          ]}>
            Visit History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <MessageSquare size={20} color={activeTab === 'chat' ? colors.lightGreen : colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={[
            styles.tabText,
            activeTab === 'chat' && styles.activeTabText
          ]}>
            AI Consult
          </Text>
          {messages.length > 0 && (
            <View style={styles.messageBadge}>
              <Text variant="labelSmall" style={styles.messageBadgeText}>
                {messages.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.filtersModal}>
          <View style={styles.filtersHeader}>
            <Text variant="titleLarge" style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filtersContent}>
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterSectionTitle}>
                Visit Type
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
                    <Text variant="bodyMedium" style={[
                      styles.filterOptionText,
                      filters.type.has(type) && styles.activeFilterOptionText
                    ]}>
                      {type}
                    </Text>
                    {filters.type.has(type) && (
                      <Check size={16} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterSectionTitle}>
                Specialization
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
                    <Text variant="bodyMedium" style={[
                      styles.filterOptionText,
                      filters.specialization.has(spec) && styles.activeFilterOptionText
                    ]}>
                      {spec}
                    </Text>
                    {filters.specialization.has(spec) && (
                      <Check size={16} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: wp(3),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: colors.lightGreen,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  tabContent: {
    flex: 1,
  },
  
  // Visits Tab Styles
  searchAndFilters: {
    padding: wp(4),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.onSurface,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterChip: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.lightGreen,
  },
  filterChipText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
  },
  visitsList: {
    flex: 1,
  },
  visitsListContent: {
    padding: wp(4),
    gap: 16,
  },
  visitCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  visitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitInfo: {
    flex: 1,
  },
  visitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  visitDetails: {
    flex: 1,
  },
  visitName: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  visitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitMetaText: {
    color: colors.onSurfaceVariant,
    marginRight: 8,
  },
  importButton: {
    backgroundColor: colors.lightGreen,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
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
    fontSize: 12,
    fontWeight: '500',
  },
  visitActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.onSurface,
    fontWeight: '500',
  },

  // Chat Tab Styles
  chatHeader: {
    padding: wp(4),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  chatTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatSubtitle: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: wp(4),
    gap: 16,
  },
  messageContainer: {
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 4,
  },
  userMessageText: {
    backgroundColor: colors.lightGreen,
    color: 'white',
  },
  assistantMessageText: {
    backgroundColor: 'white',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageTime: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  sourcesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  sourcesLabel: {
    color: colors.onSurface,
    marginBottom: 8,
    fontWeight: '500',
  },
  sourceItem: {
    marginBottom: 6,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 12,
  },
  confidenceBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  chatInputContainer: {
    padding: wp(4),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    color: colors.onSurface,
    backgroundColor: '#F8FAFC',
  },
  sendButton: {
    backgroundColor: colors.lightGreen,
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },

  // Bottom Tabs
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: wp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#F0FDF4',
  },
  tabText: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.lightGreen,
  },
  messageBadge: {
    position: 'absolute',
    top: 0,
    right: '30%',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  // Filters Modal
  filtersModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filtersTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  filtersContent: {
    flex: 1,
    padding: wp(4),
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterOption: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.lightGreen,
  },
  filterOptionText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  activeFilterOptionText: {
    color: 'white',
  },
});

export default Consult;