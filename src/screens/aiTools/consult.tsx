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
  ChevronLeft,
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
  TestTube,
  Plus,
  Trash2,
  AlertTriangle,
  Shield,
  Brain,
  ChevronRight,
  Pill,
  FlaskConical,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { LinearGradientColors } from '../../constants/linearGradientColors';
import { textStyles } from '../../constants/textStyles';

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
  
  // Pharmacopedia state
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [drugInput, setDrugInput] = useState('');
  const [drugInteractions, setDrugInteractions] = useState([]);
  const [drugQueries, setDrugQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showQueriesModal, setShowQueriesModal] = useState(false);
  const [pharmacopediaMessage, setPharmacopediaMessage] = useState('');

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

  const handleAddDrug = () => {
    if (drugInput.trim() && !selectedDrugs.includes(drugInput.trim())) {
      const newDrug = drugInput.trim();
      setSelectedDrugs(prev => [...prev, newDrug]);
      setDrugInput('');
      
      // Mock interaction generation
      if (selectedDrugs.length >= 1) {
        const severities = ['high', 'moderate', 'low'];
        const newInteraction = {
          id: Date.now().toString(),
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: `Potential interaction between ${selectedDrugs[selectedDrugs.length - 1]} and ${newDrug}.`,
          mechanism: 'CYP450 enzyme inhibition/induction pathway competition.',
          recommendation: 'Monitor patient closely, consider dosage adjustment or alternative therapy.',
          drugs: [selectedDrugs[selectedDrugs.length - 1], newDrug],
        };
        setDrugInteractions(prev => [...prev, newInteraction]);
      }
    }
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

  const renderDrug = ({ item }) => (
    <View style={styles.drugCard}>
      <View style={styles.drugHeader}>
        <Pill size={18} color={colors.primary} />
        <Text variant="titleMedium" style={styles.drugName}>{item}</Text>
        <TouchableOpacity
          onPress={() => setSelectedDrugs(prev => prev.filter(d => d !== item))}
          style={styles.removeDrugButton}
        >
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInteraction = ({ item }) => {
    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'high': return '#EF4444';
        case 'moderate': return '#F59E0B';
        case 'low': return '#10B981';
        default: return colors.onSurfaceVariant;
      }
    };

    const getSeverityIcon = (severity) => {
      switch (severity) {
        case 'high': return <AlertTriangle size={16} color="white" />;
        case 'moderate': return <AlertTriangle size={16} color="white" />;
        case 'low': return <Shield size={16} color="white" />;
        default: return <AlertTriangle size={16} color="white" />;
      }
    };

    return (
      <View style={styles.interactionCard}>
        <View style={styles.interactionHeader}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            {getSeverityIcon(item.severity)}
            <Text variant="labelMedium" style={styles.severityText}>
              {item.severity.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.drugPair}>
          {item.drugs.map((drug, index) => (
            <View key={index} style={styles.drugTag}>
              <Text variant="labelSmall" style={styles.drugTagText}>{drug}</Text>
            </View>
          ))}
        </View>
        
        <Text variant="bodyMedium" style={styles.interactionDescription}>
          {item.description}
        </Text>
        
        <View style={styles.interactionDetails}>
          <Text variant="labelMedium" style={styles.detailLabel}>Mechanism:</Text>
          <Text variant="bodySmall" style={styles.detailText}>{item.mechanism}</Text>
          <Text variant="labelMedium" style={styles.detailLabel}>Recommendation:</Text>
          <Text variant="bodySmall" style={styles.detailText}>{item.recommendation}</Text>
        </View>
      </View>
    );
  };

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

  const handleStartNewQuery = () => {
    const newQuery = {
      id: Date.now().toString(),
      title: `Query ${drugQueries.length + 1}`,
      createdAt: new Date(),
      drugs: [],
      interactions: [],
    };
    setDrugQueries(prev => [...prev, newQuery]);
    setSelectedQuery(newQuery.id);
    setShowQueriesModal(false);
  };

  const renderPharmacopediaTab = () => (
    <View style={styles.pharmacopediaContainer}>
      {/* Header Section */}
      <View style={styles.pharmacopediaHeader}>
        <View style={styles.pharmacopediaHeaderContent}>
          <Text variant="titleLarge" style={styles.pharmacopediaHeaderTitle}>
            Drug Queries
          </Text>
          <View style={styles.pharmacopediaHeaderActions}>
            <TouchableOpacity
              style={styles.addQueryHeaderButton}
              onPress={handleStartNewQuery}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.queriesButton}
              onPress={() => setShowQueriesModal(true)}
            >
              <View style={styles.queriesButtonContent}>
                <Pill size={18} color={colors.primary} />
                <Text variant="labelMedium" style={styles.queriesButtonText}>
                  {drugQueries.length > 0 ? `${drugQueries.length} Queries` : 'View Queries'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView 
        style={styles.pharmacopediaMainContent}
        contentContainerStyle={styles.pharmacopediaContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {selectedQuery ? (
          <View style={styles.queryContent}>
            {/* Query details will go here */}
            <Text variant="bodyMedium">Query content</Text>
          </View>
        ) : (
          <View style={styles.pharmacopediaEmptyState}>
            <Pill size={hp(12)} color={colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={styles.pharmacopediaEmptyText}>
              Get evidence-based drug information from Stahl's Essential Psychopharmacology Prescriber's Guide with AI-powered search.
            </Text>
          </View>
        )}
          </ScrollView>

      {/* Input Section */}
      <View style={styles.chatInputContainer}>
        <View style={styles.chatInput}>
          <TextInput
            style={styles.messageInput}
            placeholder="Ask about drug info.."
            value={pharmacopediaMessage}
            onChangeText={setPharmacopediaMessage}
            multiline
            placeholderTextColor={colors.onSurfaceVariant}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !pharmacopediaMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={() => {
              if (pharmacopediaMessage.trim()) {
                handleStartNewQuery();
                setPharmacopediaMessage('');
              }
            }}
            disabled={!pharmacopediaMessage.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Queries Modal */}
      <Modal
        visible={showQueriesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQueriesModal(false)}
      >
        <SafeAreaView style={styles.queriesModalContainer}>
          <View style={styles.queriesModalHeader}>
            <Text variant="titleLarge" style={styles.queriesModalTitle}>
              Drug Queries
            </Text>
            <TouchableOpacity onPress={() => setShowQueriesModal(false)}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.queriesModalContent} showsVerticalScrollIndicator={false}>
            {drugQueries.length === 0 ? (
              <View style={styles.queriesModalEmptyState}>
                <Pill size={64} color={colors.onSurfaceVariant} />
                <Text variant="bodyLarge" style={styles.queriesModalEmptyText}>
                  No sessions yet
                </Text>
                <Text variant="bodyMedium" style={styles.queriesModalEmptySubtext}>
                  Start your first drug query
                </Text>
              </View>
            ) : (
              <View style={styles.queriesList}>
                {drugQueries.map((query) => (
                  <TouchableOpacity
                    key={query.id}
                    style={[
                      styles.queryCard,
                      selectedQuery === query.id && styles.queryCardActive
                    ]}
                    onPress={() => {
                      setSelectedQuery(query.id);
                      setShowQueriesModal(false);
                    }}
                  >
                    <View style={styles.queryCardContent}>
                      <Pill size={20} color={selectedQuery === query.id ? colors.primary : colors.onSurfaceVariant} />
                      <View style={styles.queryCardText}>
                        <Text variant="titleMedium" style={styles.queryCardTitle}>
                          {query.title}
                        </Text>
                        <Text variant="bodySmall" style={styles.queryCardDate}>
                          {query.createdAt.toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <LinearGradient
            colors={['#53A0CD', '#44C2AD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerIconContainer}
          >
            <Brain size={20} color="white" />
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineLarge" style={textStyles.headlineLarge}>
              {t('remediusConsult.title')}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {t('remediusConsult.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'visits' ? renderVisitsTab() : activeTab === 'chat' ? renderChatTab() : activeTab === 'pharmacopedia' ? renderPharmacopediaTab() : null}

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
          <Brain size={20} color={activeTab === 'chat' ? colors.lightGreen : colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={[
            styles.tabText,
            activeTab === 'chat' && styles.activeTabText
          ]}>
            {t('remediusConsult.chat.tabTitle')}
          </Text>
          {messages.length > 0 && (
            <View style={styles.messageBadge}>
              <Text variant="labelSmall" style={styles.messageBadgeText}>
                {messages.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pharmacopedia' && styles.activeTab]}
          onPress={() => setActiveTab('pharmacopedia')}
        >
          <FlaskConical size={20} color={activeTab === 'pharmacopedia' ? colors.lightGreen : colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={[
            styles.tabText,
            activeTab === 'pharmacopedia' && styles.activeTabText
          ]}>
            {t('aiTools.drugs.title')}
          </Text>
          {drugInteractions.length > 0 && (
            <View style={styles.messageBadge}>
              <Text variant="labelSmall" style={styles.messageBadgeText}>
                {drugInteractions.length}
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
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    borderRadius: 8,
    marginRight: wp(2),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
    alignSelf: 'flex-start',
    marginTop: hp(0.75),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.lightGreen,
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

  // Pharmacopedia Styles
  drugInputHeader: {
    padding: wp(4),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
    fontSize: hp(2),
  },
  sectionSubtitle: {
    color: colors.onSurfaceVariant,
    marginBottom: 16,
    fontSize: hp(1.6),
  },
  drugInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  drugInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.onSurface,
    backgroundColor: '#F8FAFC',
  },
  addDrugButton: {
    backgroundColor: colors.lightGreen,
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addDrugButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  interactionContent: {
    flex: 1,
  },
  selectedDrugsSection: {
    padding: wp(4),
    backgroundColor: 'white',
    borderBottomWidth: 8,
    borderBottomColor: '#F8FAFC',
  },
  drugsGrid: {
    gap: 12,
  },
  drugCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drugName: {
    flex: 1,
    color: colors.onSurface,
    fontWeight: '600',
  },
  removeDrugButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: colors.onSurfaceVariant,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  interactionsSection: {
    padding: wp(4),
    backgroundColor: 'white',
  },
  interactionsList: {
    gap: 12,
  },
  interactionCard: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  interactionHeader: {
    marginBottom: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },
  drugPair: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  drugTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  drugTagText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  interactionDescription: {
    color: colors.onSurface,
    marginBottom: 12,
    lineHeight: 20,
  },
  interactionDetails: {
    gap: 8,
  },
  detailLabel: {
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 4,
  },
  detailText: {
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },

  // Pharmacopedia Mobile-Friendly UI Styles
  pharmacopediaContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  pharmacopediaHeader: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pharmacopediaHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pharmacopediaHeaderTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: hp(2.2),
  },
  pharmacopediaHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addQueryHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queriesButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queriesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queriesButtonText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  pharmacopediaMainContent: {
    flex: 1,
  },
  pharmacopediaContentContainer: {
    flexGrow: 1,
  },
  pharmacopediaEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(8),
    minHeight: hp(60),
  },
  pharmacopediaEmptyText: {
    color: colors.onSurfaceVariant,
    marginTop: hp(3),
    textAlign: 'center',
    lineHeight: hp(2.8),
    fontSize: hp(1.9),
  },
  startNewQueryButton: {
    marginTop: hp(5),
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: wp(80),
  },
  startNewQueryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(8),
    gap: 10,
  },
  startNewQueryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: hp(2),
  },
  queryContent: {
    flex: 1,
    padding: wp(4),
  },
  // Queries Modal Styles
  queriesModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  queriesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  queriesModalTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  queriesModalContent: {
    flex: 1,
    padding: wp(4),
  },
  queriesModalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  queriesModalEmptyText: {
    color: colors.onSurfaceVariant,
    marginTop: hp(3),
    fontWeight: '500',
    textAlign: 'center',
  },
  queriesModalEmptySubtext: {
    color: colors.onSurfaceVariant,
    marginTop: hp(1),
    textAlign: 'center',
  },
  queriesList: {
    gap: 12,
  },
  queryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  queryCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  queryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queryCardText: {
    flex: 1,
  },
  queryCardTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  queryCardDate: {
    color: colors.onSurfaceVariant,
  },
});

export default Consult;