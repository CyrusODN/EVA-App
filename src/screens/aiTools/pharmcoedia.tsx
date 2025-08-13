import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
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
  UserCircle2,
  Plus,
  X,
  ChevronRight,
  Send,
  Check,
  Search,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
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
  
  // Chat state
  const [chatTabs, setChatTabs] = useState([{
    id: nanoid(),
    title: t('remediusPharmcopedia.defaultChatTitle', { number: 1 }),
    messages: [],
    currentMessage: '',
    patientProfile: undefined,
  }]);
  const [activeTabId, setActiveTabId] = useState(chatTabs[0].id);
  
  // Dialog states
  const [showPatientProfileDialog, setShowPatientProfileDialog] = useState(false);
  const [showVisitSelectDialog, setShowVisitSelectDialog] = useState(false);
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
    
    const userMessage = tab.currentMessage;
    const updatedTabs = chatTabs.map(t =>
      t.id === tabId
        ? { ...t, messages: [...t.messages, { role: 'user', content: userMessage }], currentMessage: '' }
        : t
    );
    setChatTabs(updatedTabs);
    
    setTimeout(() => {
      const assistantResponse = t('remediusPharmcopedia.aiDefaultResponse');
      const updatedTabsWithResponse = updatedTabs.map(t =>
        t.id === tabId 
          ? { ...t, messages: [...t.messages, { role: 'assistant', content: assistantResponse }] } 
          : t
      );
      setChatTabs(updatedTabsWithResponse);
    }, 1000);
  };

  const handleNewChatTab = () => {
    const newTab = {
      id: nanoid(),
      title: t('remediusPharmcopedia.defaultChatTitle', { number: chatTabs.length + 1 }),
      messages: [],
      currentMessage: '',
    };
    setChatTabs([...chatTabs, newTab]);
    setActiveTabId(newTab.id);
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
      setSelectedDrugs(prev => [...prev, drugInput.trim()]);
      setDrugInput('');
      
      // Mock interaction generation
      if (selectedDrugs.length >= 1) {
        const severities = ['high', 'moderate', 'low'];
        const newInteraction = {
          id: nanoid(),
          severity: severities[Math.floor(Math.random() * severities.length)],
          description: `Potential interaction between ${selectedDrugs[selectedDrugs.length - 1]} and ${drugInput.trim()}.`,
          mechanism: 'CYP450 enzyme inhibition/induction pathway competition.',
          recommendation: 'Monitor patient closely, consider dosage adjustment or alternative therapy.',
          drugs: [selectedDrugs[selectedDrugs.length - 1], drugInput.trim()],
        };
        setDrugInteractions(prev => [...prev, newInteraction]);
      }
    }
  };

  const activeTab = chatTabs.find(tab => tab.id === activeTabId);

  const renderChatTab = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatTab, activeTabId === item.id && styles.activeChatTab]}
      onPress={() => setActiveTabId(item.id)}
    >
      <Text variant="labelMedium" style={[
        styles.chatTabText,
        activeTabId === item.id && styles.activeChatTabText
      ]}>
        {item.title}
      </Text>
      {chatTabs.length > 1 && (
        <TouchableOpacity
          onPress={() => handleCloseTab(item.id)}
          style={styles.closeTabButton}
        >
          <X size={14} color={activeTabId === item.id ? 'white' : colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
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
    </View>
  );

  const renderDrug = ({ item }) => (
    <View style={styles.drugItem}>
      <Text variant="bodyMedium" style={styles.drugName}>{item}</Text>
      <TouchableOpacity
        onPress={() => setSelectedDrugs(prev => prev.filter(d => d !== item))}
        style={styles.removeDrugButton}
      >
        <X size={16} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderInteraction = ({ item }) => (
    <View style={styles.interactionCard}>
      <View style={styles.interactionHeader}>
        <View style={[
          styles.severityBadge,
          styles[`severity${item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}`]
        ]}>
          <Text variant="labelSmall" style={styles.severityText}>
            {t(`remediusPharmcopedia.interactionChecker.severity.${item.severity}`)}
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
      
      <Text variant="bodySmall" style={styles.interactionDescription}>
        {item.description}
      </Text>
      
      <View style={styles.interactionDetails}>
        <Text variant="labelMedium" style={styles.detailLabel}>
          {t('remediusPharmcopedia.interactionChecker.mechanism')}
        </Text>
        <Text variant="bodySmall" style={styles.detailText}>{item.mechanism}</Text>
      </View>
      
      <View style={styles.interactionDetails}>
        <Text variant="labelMedium" style={styles.detailLabel}>
          {t('remediusPharmcopedia.interactionChecker.recommendation')}
        </Text>
        <Text variant="bodySmall" style={styles.detailText}>{item.recommendation}</Text>
      </View>
    </View>
  );

  const renderVisitItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.visitItem,
        selectedVisits.has(item.id) && styles.selectedVisitItem
      ]}
      onPress={() => handleVisitSelect(item.id)}
    >
      <View style={styles.visitItemContent}>
        <Text variant="titleMedium" style={styles.visitName}>{item.name}</Text>
        <Text variant="bodySmall" style={styles.visitDate}>
          {item.date.toLocaleDateString()} • {item.duration}
        </Text>
      </View>
      {selectedVisits.has(item.id) && (
        <Check size={20} color={colors.lightGreen} />
      )}
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('remediusPharmcopedia.title')}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {t('remediusPharmcopedia.subtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Left Panel - Assistant */}
        <View style={styles.leftPanel}>
          <View style={styles.assistantHeader}>
            <Text variant="titleLarge" style={styles.assistantTitle}>
              {t('remediusPharmcopedia.assistantTitle')}
            </Text>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowPatientProfileDialog(true)}
            >
              <UserCircle2 size={16} color={colors.lightGreen} />
              <Text variant="labelMedium" style={styles.profileButtonText}>
                {t('remediusPharmcopedia.patientProfileButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chat Tabs */}
          <View style={styles.chatTabsContainer}>
            <FlatList
              data={chatTabs}
              renderItem={renderChatTab}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chatTabsList}
            />
            <TouchableOpacity
              style={styles.newTabButton}
              onPress={handleNewChatTab}
            >
              <Plus size={16} color={colors.lightGreen} />
            </TouchableOpacity>
          </View>

          {/* Active Patient Profile */}
          {activeTab?.patientProfile && (
            <View style={styles.profileContainer}>
              <Text variant="labelMedium" style={styles.profileTitle}>
                {t('remediusPharmcopedia.activeProfileTitle')}
              </Text>
              {activeTab.patientProfile.symptoms.length > 0 && (
                <View style={styles.profileSection}>
                  <Text variant="labelSmall" style={styles.profileLabel}>
                    {t('remediusPharmcopedia.profileLabels.symptoms')}
                  </Text>
                  <View style={styles.profileTags}>
                    {activeTab.patientProfile.symptoms.map((symptom, index) => (
                      <View key={index} style={[
                        styles.profileTag,
                        styles[`severity${symptom.severity.charAt(0).toUpperCase() + symptom.severity.slice(1)}`]
                      ]}>
                        <Text variant="labelSmall" style={styles.profileTagText}>
                          {symptom.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {activeTab.patientProfile.medications.length > 0 && (
                <View style={styles.profileSection}>
                  <Text variant="labelSmall" style={styles.profileLabel}>
                    {t('remediusPharmcopedia.profileLabels.medications')}
                  </Text>
                  <View style={styles.profileTags}>
                    {activeTab.patientProfile.medications.map((med, index) => (
                      <View key={index} style={styles.medicationTag}>
                        <Text variant="labelSmall" style={styles.medicationTagText}>
                          {med.name} {med.dosage}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Chat Messages */}
          <FlatList
            data={activeTab?.messages || []}
            renderItem={renderMessage}
            keyExtractor={(item, index) => index.toString()}
            style={styles.chatMessages}
            showsVerticalScrollIndicator={false}
          />

          {/* Chat Input */}
          <View style={styles.chatInput}>
            <TextInput
              style={styles.messageInput}
              placeholder={t('remediusPharmcopedia.chatPlaceholder')}
              value={activeTab?.currentMessage || ''}
              onChangeText={(text) => {
                setChatTabs(prev => prev.map(tab => 
                  tab.id === activeTabId ? { ...tab, currentMessage: text } : tab
                ));
              }}
              multiline
              placeholderTextColor={colors.placeholderColor}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleSendMessage(activeTabId)}
              disabled={!activeTab?.currentMessage?.trim()}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Panel - Drug Interaction Checker */}
        <View style={styles.rightPanel}>
          <View style={styles.interactionHeader}>
            <Text variant="titleLarge" style={styles.interactionTitle}>
              {t('remediusPharmcopedia.interactionChecker.title')}
            </Text>
            <View style={styles.drugInputContainer}>
              <TextInput
                style={styles.drugInput}
                placeholder={t('remediusPharmcopedia.interactionChecker.addPlaceholder')}
                value={drugInput}
                onChangeText={setDrugInput}
                placeholderTextColor={colors.placeholderColor}
              />
              <TouchableOpacity
                style={styles.addDrugButton}
                onPress={handleAddDrug}
              >
                <Text variant="labelMedium" style={styles.addDrugButtonText}>
                  {t('common.add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.interactionContent} showsVerticalScrollIndicator={false}>
            {/* Selected Drugs */}
            <View style={styles.selectedDrugsContainer}>
              <Text variant="labelMedium" style={styles.sectionTitle}>
                {t('remediusPharmcopedia.interactionChecker.selectedTitle')}
              </Text>
              <FlatList
                data={selectedDrugs}
                renderItem={renderDrug}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.drugsList}
              />
            </View>

            {/* Drug Interactions */}
            <View style={styles.interactionsContainer}>
              <FlatList
                data={drugInteractions}
                renderItem={renderInteraction}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Patient Profile Dialog */}
      {showPatientProfileDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <Text variant="headlineSmall" style={styles.dialogTitle}>
                {t('remediusPharmcopedia.profileDialog.title')}
              </Text>
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
                  {t('remediusPharmcopedia.profileDialog.importTab')}
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
                  {t('remediusPharmcopedia.profileDialog.manualTab')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dialogContent}>
              {profileDialogTab === 'import' ? (
                <TouchableOpacity
                  style={styles.selectVisitsButton}
                  onPress={() => setShowVisitSelectDialog(true)}
                >
                  <Text variant="labelMedium" style={styles.selectVisitsButtonText}>
                    {t('remediusPharmcopedia.profileDialog.selectVisitsButton')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.manualProfileContainer}>
                  <TextInput
                    style={styles.manualProfileInput}
                    placeholder={t('remediusPharmcopedia.profileDialog.manualPlaceholder')}
                    value={manualProfileText}
                    onChangeText={setManualProfileText}
                    multiline
                    placeholderTextColor={colors.placeholderColor}
                  />
                  <TouchableOpacity
                    style={styles.saveProfileButton}
                    onPress={handleSaveManualProfile}
                  >
                    <Text variant="labelMedium" style={styles.saveProfileButtonText}>
                      {t('remediusPharmcopedia.profileDialog.saveButton')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Visit Select Dialog */}
      {showVisitSelectDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <Text variant="headlineSmall" style={styles.dialogTitle}>
                {t('remediusPharmcopedia.visitSelectDialog.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowVisitSelectDialog(false)}>
                <X size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={16} color={colors.onSurfaceVariant} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('remediusPharmcopedia.visitSelectDialog.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.placeholderColor}
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
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowVisitSelectDialog(false)}
              >
                <Text variant="labelMedium" style={styles.cancelButtonText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportVisits}
                disabled={selectedVisits.size === 0}
              >
                <Text variant="labelMedium" style={styles.importButtonText}>
                  {t('remediusPharmcopedia.visitSelectDialog.importButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    width: wp(50),
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: colors.outline,
  },
  assistantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  assistantTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.lightGreen,
    borderRadius: 6,
  },
  profileButtonText: {
    color: colors.lightGreen,
  },
  chatTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  chatTabsList: {
    flex: 1,
  },
  chatTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  activeChatTab: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.lightGreen,
  },
  chatTabText: {
    color: colors.onSurface,
  },
  activeChatTabText: {
    color: 'white',
  },
  closeTabButton: {
    marginLeft: 8,
    padding: 2,
  },
  newTabButton: {
    padding: 8,
  },
  profileContainer: {
    margin: wp(4),
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  profileTitle: {
    color: colors.onSurface,
    marginBottom: 8,
    fontWeight: '600',
  },
  profileSection: {
    marginBottom: 8,
  },
  profileLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  profileTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityMild: {
    backgroundColor: '#DCFCE7',
  },
  severityModerate: {
    backgroundColor: '#FEF3C7',
  },
  severitySevere: {
    backgroundColor: '#FEE2E2',
  },
  profileTagText: {
    color: colors.onSurface,
  },
  medicationTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
  },
  medicationTagText: {
    color: colors.onSurface,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  messageContainer: {
    marginBottom: 12,
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
  rightPanel: {
    flex: 1,
    backgroundColor: 'white',
  },
  interactionHeader: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  interactionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 12,
  },
  drugInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  drugInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.onSurface,
  },
  addDrugButton: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addDrugButtonText: {
    color: 'white',
  },
  interactionContent: {
    flex: 1,
  },
  selectedDrugsContainer: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  drugsList: {
    maxHeight: 50,
  },
  drugItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  drugName: {
    color: colors.onSurface,
  },
  removeDrugButton: {
    marginLeft: 8,
    padding: 2,
  },
  interactionsContainer: {
    padding: wp(4),
  },
  interactionCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  interactionHeader: {
    marginBottom: 8,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityHigh: {
    backgroundColor: '#FEE2E2',
  },
  severityModerate: {
    backgroundColor: '#FEF3C7',
  },
  severityLow: {
    backgroundColor: '#DCFCE7',
  },
  severityText: {
    color: colors.onSurface,
  },
  drugPair: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  drugTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
  },
  drugTagText: {
    color: colors.onSurface,
  },
  interactionDescription: {
    color: colors.onSurface,
    marginBottom: 8,
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
  },
  // Dialog styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContainer: {
    width: wp(90),
    maxHeight: hp(80),
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  dialogTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  dialogTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  dialogTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  activeDialogTab: {
    backgroundColor: colors.lightGreen,
  },
  dialogTabText: {
    color: colors.onSurface,
  },
  activeDialogTabText: {
    color: 'white',
  },
  dialogContent: {
    padding: wp(4),
  },
  selectVisitsButton: {
    backgroundColor: colors.lightGreen,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectVisitsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  manualProfileContainer: {
    gap: 16,
  },
  manualProfileInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.onSurface,
  },
  saveProfileButton: {
    backgroundColor: colors.lightGreen,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveProfileButtonText: {
    color: 'white',
    fontWeight: '600',
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
  visitsList: {
    maxHeight: hp(40),
    paddingHorizontal: wp(4),
  },
  visitItem: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedVisitItem: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  visitItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitName: {
    color: colors.onSurface,
    fontWeight: '600',
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
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: colors.onSurface,
  },
  importButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightGreen,
    borderRadius: 6,
  },
  importButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default Pharmcoedia;