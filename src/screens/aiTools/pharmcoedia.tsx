import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
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
  UserCircle2,
  Plus,
  X,
  Send,
  Check,
  Search,
  MessageSquare,
  Pill,
  AlertTriangle,
  Settings,
  User,
  FileText,
  Calendar,
  Trash2,
  Edit3,
  Shield,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import 'react-native-get-random-values';
import { nanoid } from 'nanoid';

const { width: screenWidth } = Dimensions.get('window');

// Mock data for visits
const MOCK_VISITS = [
  {
    id: '1',
    name: 'JS45',
    date: new Date(2024, 1, 15),
    type: 'First Visit',
    specialization: 'Adult Psychiatry',
    duration: '45 min',
    note: {
      type: 'SOAP',
      content: `**Subjective:**\n- Patient reports persistent anxiety\n- Sleep disturbances noted\n- Decreased appetite\n\n**Assessment:**\n- Generalized Anxiety Disorder\n- Major Depressive Disorder\n\n**Plan:**\n1. Start SSRI therapy\n2. Weekly follow-up\n3. Sleep hygiene education`,
    },
  },
  {
    id: '2',
    name: 'AK78',
    date: new Date(2024, 1, 10),
    type: 'Follow-up',
    specialization: 'Child Psychiatry',
    duration: '30 min',
    note: {
      type: 'SOAP',
      content: `**Subjective:**\n- Improved sleep pattern\n- Reduced anxiety symptoms\n- Better appetite\n\n**Assessment:**\n- GAD - improving\n- MDD - improving\n\n**Plan:**\n1. Continue current medication\n2. Maintain therapy sessions\n3. Review in 2 weeks`,
    },
  },
];

const Pharmcoedia = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // Main navigation state
  const [activeTab, setActiveTab] = useState('assistant');
  
  // Chat state
  const [chatTabs, setChatTabs] = useState([{
    id: nanoid(),
    title: 'Chat 1',
    messages: [],
    currentMessage: '',
    patientProfile: undefined,
  }]);
  const [activeTabId, setActiveTabId] = useState(chatTabs[0].id);
  
  // Dialog states
  const [showPatientProfileDialog, setShowPatientProfileDialog] = useState(false);
  const [showVisitSelectDialog, setShowVisitSelectDialog] = useState(false);
  const [showChatTabsModal, setShowChatTabsModal] = useState(false);
  const [profileDialogTab, setProfileDialogTab] = useState('import');
  const [selectedVisits, setSelectedVisits] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [manualProfileText, setManualProfileText] = useState('');
  
  // Drug interaction state
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [drugInput, setDrugInput] = useState('');
  const [drugInteractions, setDrugInteractions] = useState([]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSendMessage = (tabId) => {
    const tab = chatTabs.find(t => t.id === tabId);
    if (!tab || !tab.currentMessage.trim()) return;
    
    const userMessage = {
      id: nanoid(),
      role: 'user',
      content: tab.currentMessage,
      timestamp: new Date(),
    };
    
    const updatedTabs = chatTabs.map(t =>
      t.id === tabId
        ? { ...t, messages: [...t.messages, userMessage], currentMessage: '' }
        : t
    );
    setChatTabs(updatedTabs);
    
    setTimeout(() => {
      const assistantResponse = {
        id: nanoid(),
        role: 'assistant',
        content: 'Based on the patient profile and current medications, I recommend...',
        timestamp: new Date(),
      };
      const updatedTabsWithResponse = updatedTabs.map(t =>
        t.id === tabId 
          ? { ...t, messages: [...t.messages, assistantResponse] } 
          : t
      );
      setChatTabs(updatedTabsWithResponse);
    }, 1000);
  };

  const handleNewChatTab = () => {
    const newTab = {
      id: nanoid(),
      title: `Chat ${chatTabs.length + 1}`,
      messages: [],
      currentMessage: '',
    };
    setChatTabs([...chatTabs, newTab]);
    setActiveTabId(newTab.id);
    setShowChatTabsModal(false);
  };

  const handleCloseTab = (tabId) => {
    if (chatTabs.length === 1) return;
    const updatedTabs = chatTabs.filter(t => t.id !== tabId);
    setChatTabs(updatedTabs);
    if (activeTabId === tabId) setActiveTabId(updatedTabs[0].id);
  };

  const handleVisitSelect = (visitId) => {
    setSelectedVisits(prev => {
      const next = new Set(prev);
      next.has(visitId) ? next.delete(visitId) : next.add(visitId);
      return next;
    });
  };

  const handleImportVisits = () => {
    const selectedVisitData = MOCK_VISITS.filter(visit => selectedVisits.has(visit.id));
    const newProfile = {
      symptoms: [],
      history: [],
      medications: [],
      vitals: {},
      riskFactors: [],
      diagnosis: [],
    };
    
    selectedVisitData.forEach(visit => {
      if (visit.note?.content) {
        const lines = visit.note.content.split('\n');
        lines.forEach(line => {
          if (line.includes('Assessment:')) {
            const diagnosis = line.replace('- ', '').trim();
            if (diagnosis) newProfile.diagnosis.push({ name: diagnosis, confidence: 85 });
          }
        });
      }
    });
    
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, patientProfile: newProfile } : tab
    ));
    setShowVisitSelectDialog(false);
    setShowPatientProfileDialog(false);
  };

  const handleSaveManualProfile = () => {
    const lines = manualProfileText.split('\n');
    const newProfile = {
      symptoms: [],
      history: [],
      medications: [],
      vitals: {},
      riskFactors: [],
      diagnosis: [],
    };
    
    lines.forEach(line => {
      if (line.trim()) newProfile.symptoms.push({ name: line.trim(), severity: 'moderate' });
    });
    
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, patientProfile: newProfile } : tab
    ));
    setShowPatientProfileDialog(false);
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
          id: nanoid(),
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

  const activeChat = chatTabs.find(tab => tab.id === activeTabId);

  // Render functions for components
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
        {item.timestamp?.toLocaleTimeString()}
      </Text>
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
        </View>
        
        <View style={styles.interactionDetails}>
          <Text variant="labelMedium" style={styles.detailLabel}>Recommendation:</Text>
          <Text variant="bodySmall" style={styles.detailText}>{item.recommendation}</Text>
        </View>
      </View>
    );
  };

  const renderVisitItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.visitItem,
        selectedVisits.has(item.id) && styles.selectedVisitItem
      ]}
      onPress={() => handleVisitSelect(item.id)}
    >
      <View style={styles.visitItemHeader}>
        <View style={styles.patientAvatar}>
          <User size={16} color="white" />
        </View>
        <View style={styles.visitInfo}>
          <Text variant="titleMedium" style={styles.visitName}>{item.name}</Text>
          <View style={styles.visitMeta}>
            <Calendar size={12} color={colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.visitDate}>
              {item.date.toLocaleDateString()} • {item.duration}
            </Text>
          </View>
        </View>
        {selectedVisits.has(item.id) && (
          <Check size={20} color={colors.lightGreen} />
        )}
      </View>
      <View style={styles.visitTags}>
        <View style={styles.visitTag}>
          <Text variant="labelSmall" style={styles.visitTagText}>{item.type}</Text>
        </View>
        <View style={styles.visitTag}>
          <Text variant="labelSmall" style={styles.visitTagText}>{item.specialization}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Tab content renders
  const renderAssistantTab = () => (
    <View style={styles.tabContent}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <Text variant="titleLarge" style={styles.chatTitle}>
            AI Assistant
          </Text>
          <Text variant="bodySmall" style={styles.chatSubtitle}>
            {activeChat?.title || 'Chat 1'}
          </Text>
        </View>
        <View style={styles.chatHeaderActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowPatientProfileDialog(true)}
          >
            <UserCircle2 size={20} color={colors.lightGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowChatTabsModal(true)}
          >
            <Settings size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Patient Profile */}
      {activeChat?.patientProfile && (
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <UserCircle2 size={20} color={colors.lightGreen} />
            <Text variant="titleMedium" style={styles.profileTitle}>
              Active Patient Profile
            </Text>
          </View>
          
          {activeChat.patientProfile.symptoms.length > 0 && (
            <View style={styles.profileSection}>
              <Text variant="labelMedium" style={styles.profileLabel}>Symptoms</Text>
              <View style={styles.profileTags}>
                {activeChat.patientProfile.symptoms.slice(0, 3).map((symptom, index) => (
                  <View key={index} style={styles.symptomTag}>
                    <Text variant="labelSmall" style={styles.symptomTagText}>
                      {symptom.name}
                    </Text>
                  </View>
                ))}
                {activeChat.patientProfile.symptoms.length > 3 && (
                  <View style={styles.moreTag}>
                    <Text variant="labelSmall" style={styles.moreTagText}>
                      +{activeChat.patientProfile.symptoms.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Chat Messages */}
      <FlatList
        data={activeChat?.messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatMessages}
        contentContainerStyle={styles.chatMessagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Chat Input */}
      <View style={styles.chatInputContainer}>
        <View style={styles.chatInput}>
          <TextInput
            style={styles.messageInput}
            placeholder="Ask about medications, interactions, or patient care..."
            value={activeChat?.currentMessage || ''}
            onChangeText={(text) => {
              setChatTabs(prev => prev.map(tab => 
                tab.id === activeTabId ? { ...tab, currentMessage: text } : tab
              ));
            }}
            multiline
            placeholderTextColor={colors.onSurfaceVariant}
          />
          <TouchableOpacity
            style={[styles.sendButton, !activeChat?.currentMessage?.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage(activeTabId)}
            disabled={!activeChat?.currentMessage?.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderInteractionTab = () => (
    <View style={styles.tabContent}>
      {/* Drug Input Header */}
      <View style={styles.drugInputHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Drug Interaction Checker
        </Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          Add medications to check for interactions
        </Text>
        
        <View style={styles.drugInputContainer}>
          <TextInput
            style={styles.drugInput}
            placeholder="Enter medication name..."
            value={drugInput}
            onChangeText={setDrugInput}
            placeholderTextColor={colors.onSurfaceVariant}
          />
          <TouchableOpacity
            style={[styles.addDrugButton, !drugInput.trim() && styles.addDrugButtonDisabled]}
            onPress={handleAddDrug}
            disabled={!drugInput.trim()}
          >
            <Plus size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.interactionContent} showsVerticalScrollIndicator={false}>
        {/* Selected Drugs */}
        <View style={styles.selectedDrugsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Selected Medications ({selectedDrugs.length})
          </Text>
          {selectedDrugs.length > 0 ? (
            <FlatList
              data={selectedDrugs}
              renderItem={renderDrug}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.drugsGrid}
              numColumns={1}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Pill size={48} color={colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                No medications added yet
              </Text>
              <Text variant="bodySmall" style={styles.emptyStateSubtext}>
                Add medications above to check for interactions
              </Text>
            </View>
          )}
        </View>

        {/* Drug Interactions */}
        {drugInteractions.length > 0 && (
          <View style={styles.interactionsSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Detected Interactions ({drugInteractions.length})
            </Text>
            <FlatList
              data={drugInteractions}
              renderItem={renderInteraction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.interactionsList}
            />
          </View>
        )}
      </ScrollView>
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
            Pharmcoedia
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            AI-powered pharmaceutical assistant
          </Text>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'assistant' ? renderAssistantTab() : renderInteractionTab()}

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assistant' && styles.activeTab]}
          onPress={() => setActiveTab('assistant')}
        >
          <MessageSquare size={20} color={activeTab === 'assistant' ? colors.lightGreen : colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={[
            styles.tabText,
            activeTab === 'assistant' && styles.activeTabText
          ]}>
            Assistant
          </Text>
          {(activeChat?.messages?.length || 0) > 0 && (
            <View style={styles.messageBadge}>
              <Text variant="labelSmall" style={styles.messageBadgeText}>
                {activeChat.messages.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'interactions' && styles.activeTab]}
          onPress={() => setActiveTab('interactions')}
        >
          <Pill size={20} color={activeTab === 'interactions' ? colors.lightGreen : colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={[
            styles.tabText,
            activeTab === 'interactions' && styles.activeTabText
          ]}>
            Interactions
          </Text>
          {drugInteractions.length > 0 && (
            <View style={[styles.messageBadge, drugInteractions.some(i => i.severity === 'high') && styles.highSeverityBadge]}>
              <Text variant="labelSmall" style={styles.messageBadgeText}>
                {drugInteractions.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Chat Tabs Modal */}
      <Modal
        visible={showChatTabsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatTabsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>Chat Management</Text>
            <TouchableOpacity onPress={() => setShowChatTabsModal(false)}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {chatTabs.map((tab) => (
              <View key={tab.id} style={[styles.chatTabItem, tab.id === activeTabId && styles.activeChatTabItem]}>
                <View style={styles.chatTabInfo}>
                  <Text variant="titleMedium" style={styles.chatTabTitle}>{tab.title}</Text>
                  <Text variant="bodySmall" style={styles.chatTabMeta}>
                    {tab.messages.length} messages
                  </Text>
                </View>
                <View style={styles.chatTabActions}>
                  <TouchableOpacity
                    style={styles.tabActionButton}
                    onPress={() => {
                      setActiveTabId(tab.id);
                      setShowChatTabsModal(false);
                    }}
                  >
                    <MessageSquare size={16} color={colors.lightGreen} />
                  </TouchableOpacity>
                  {chatTabs.length > 1 && (
                    <TouchableOpacity
                      style={styles.tabActionButton}
                      onPress={() => handleCloseTab(tab.id)}
                    >
                      <X size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={styles.newChatButton} onPress={handleNewChatTab}>
              <Plus size={20} color="white" />
              <Text variant="labelMedium" style={styles.newChatButtonText}>
                New Chat
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Patient Profile Dialog */}
      <Modal
        visible={showPatientProfileDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientProfileDialog(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>Patient Profile</Text>
            <TouchableOpacity onPress={() => setShowPatientProfileDialog(false)}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.dialogTabs}>
            <TouchableOpacity
              style={[styles.dialogTab, profileDialogTab === 'import' && styles.activeDialogTab]}
              onPress={() => setProfileDialogTab('import')}
            >
              <Text variant="labelMedium" style={[
                styles.dialogTabText,
                profileDialogTab === 'import' && styles.activeDialogTabText
              ]}>
                Import from Visits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogTab, profileDialogTab === 'manual' && styles.activeDialogTab]}
              onPress={() => setProfileDialogTab('manual')}
            >
              <Text variant="labelMedium" style={[
                styles.dialogTabText,
                profileDialogTab === 'manual' && styles.activeDialogTabText
              ]}>
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {profileDialogTab === 'import' ? (
              <TouchableOpacity
                style={styles.selectVisitsButton}
                onPress={() => setShowVisitSelectDialog(true)}
              >
                <FileText size={20} color="white" />
                <Text variant="labelMedium" style={styles.selectVisitsButtonText}>
                  Select Patient Visits
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.manualProfileContainer}>
                <Text variant="bodyMedium" style={styles.inputLabel}>
                  Enter patient information (symptoms, conditions, medications):
                </Text>
                <TextInput
                  style={styles.manualProfileInput}
                  placeholder="e.g., Hypertension, Diabetes Type 2, Anxiety..."
                  value={manualProfileText}
                  onChangeText={setManualProfileText}
                  multiline
                  placeholderTextColor={colors.onSurfaceVariant}
                />
                <TouchableOpacity
                  style={[styles.saveProfileButton, !manualProfileText.trim() && styles.saveProfileButtonDisabled]}
                  onPress={handleSaveManualProfile}
                  disabled={!manualProfileText.trim()}
                >
                  <Text variant="labelMedium" style={styles.saveProfileButtonText}>
                    Save Profile
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Visit Select Dialog */}
      <Modal
        visible={showVisitSelectDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVisitSelectDialog(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>Select Patient Visits</Text>
            <TouchableOpacity onPress={() => setShowVisitSelectDialog(false)}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search visits..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>

          <FlatList
            data={MOCK_VISITS.filter(visit =>
              visit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              visit.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
              visit.specialization.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={renderVisitItem}
            keyExtractor={(item) => item.id}
            style={styles.visitsList}
            contentContainerStyle={styles.visitsListContent}
          />

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowVisitSelectDialog(false)}
            >
              <Text variant="labelMedium" style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importButton, selectedVisits.size === 0 && styles.importButtonDisabled]}
              onPress={handleImportVisits}
              disabled={selectedVisits.size === 0}
            >
              <Text variant="labelMedium" style={styles.importButtonText}>
                Import ({selectedVisits.size})
              </Text>
            </TouchableOpacity>
          </View>
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

  // Assistant Tab Styles
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chatHeaderLeft: {
    flex: 1,
  },
  chatTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  chatSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  profileCard: {
    margin: wp(4),
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profileTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  profileSection: {
    marginBottom: 8,
  },
  profileLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: 6,
    fontWeight: '500',
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  symptomTagText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  moreTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  moreTagText: {
    color: colors.onSurfaceVariant,
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
    textAlign: 'right',
    marginTop: 4,
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

  // Interaction Tab Styles
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
  },
  sectionSubtitle: {
    color: colors.onSurfaceVariant,
    marginBottom: 16,
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
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontWeight: '600',
  },
  drugPair: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  drugTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
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
    marginBottom: 8,
  },
  detailLabel: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailText: {
    color: colors.onSurfaceVariant,
    lineHeight: 18,
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
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highSeverityBadge: {
    backgroundColor: '#EF4444',
  },
  messageBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: wp(4),
  },
  chatTabItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    backgroundColor: 'white',
  },
  activeChatTabItem: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  chatTabInfo: {
    flex: 1,
  },
  chatTabTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  chatTabMeta: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  chatTabActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tabActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  newChatButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: colors.lightGreen,
    borderRadius: 12,
    marginTop: 8,
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dialogTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dialogTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  activeDialogTab: {
    backgroundColor: colors.lightGreen,
  },
  dialogTabText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  activeDialogTabText: {
    color: 'white',
  },
  selectVisitsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lightGreen,
    paddingVertical: 16,
    borderRadius: 12,
  },
  selectVisitsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  manualProfileContainer: {
    gap: 16,
  },
  inputLabel: {
    color: colors.onSurface,
    fontWeight: '500',
    marginBottom: 8,
  },
  manualProfileInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: colors.onSurface,
    backgroundColor: '#F8FAFC',
  },
  saveProfileButton: {
    backgroundColor: colors.lightGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveProfileButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveProfileButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: wp(4),
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.onSurface,
  },
  visitsList: {
    flex: 1,
  },
  visitsListContent: {
    padding: wp(4),
    gap: 12,
  },
  visitItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  selectedVisitItem: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  visitItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  visitInfo: {
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
  visitDate: {
    color: colors.onSurfaceVariant,
  },
  visitTags: {
    flexDirection: 'row',
    gap: 8,
  },
  visitTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
  },
  visitTagText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  importButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
  },
  importButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  importButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default Pharmcoedia;