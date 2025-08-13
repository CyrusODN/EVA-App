import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
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
  Plus,
  Folder,
  Settings,
  Download,
  Save,
  Upload,
  X,
  Eye,
  RefreshCw,
  Copy,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Brain,
  FileText,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

// Content types and citation styles
const CONTENT_TYPES = [
  { id: 'literature_review' },
  { id: 'introduction' },
  { id: 'methodology' },
  { id: 'discussion' },
  { id: 'summary' },
  { id: 'full_article' },
];

const CITATION_STYLES = ['APA', 'MLA', 'Chicago', 'Harvard', 'Vancouver', 'BibTeX'];

const Pathfinder = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // State management
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('literature_review');
  const [selectedCitationStyle, setSelectedCitationStyle] = useState('APA');
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Dialog states
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: Math.random().toString(36).substring(7),
      name: newProjectName,
      description: newProjectDescription,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
    setNewProjectName('');
    setNewProjectDescription('');
    setShowNewProjectDialog(false);
  };

  const handleAddDocument = () => {
    // Mock document addition
    const mockDoc = {
      id: Math.random().toString(36).substring(7),
      name: `research_paper_${Date.now()}.pdf`,
      size: 1024 * 1024 * 3.2, // 3.2MB
      uploadedAt: new Date(),
      status: 'pending',
      file: { name: `research_paper_${Date.now()}.pdf` },
    };
    
    setDocuments(prev => [...prev, mockDoc]);
    
    // Simulate processing
    setTimeout(() => {
      setDocuments(prev => prev.map(d => 
        d.id === mockDoc.id ? { ...d, status: 'processing' } : d
      ));
      setTimeout(() => {
        setDocuments(prev => prev.map(d => 
          d.id === mockDoc.id ? { ...d, status: 'indexed' } : d
        ));
      }, 3000);
    }, 1000);
  };

  const handlePreviewPDF = (file) => {
    setSelectedPDF(file);
    setShowPDFPreview(true);
  };

  const handleGenerate = () => {
    if (!prompt.trim() || selectedDocuments.size === 0) {
      Alert.alert(
        t('common.error'),
        'Please add a prompt and select at least one document'
      );
      return;
    }
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const contentTypeLabel = t(`remediusPathfinder.contentTypes.${selectedContentType}`);
      const simulatedResponse = t('remediusPathfinder.generation.simulatedResponse');
      
      const newContent = {
        id: Math.random().toString(36).substring(7),
        content: `# ${t('remediusPathfinder.generation.generatedTitlePrefix')} ${contentTypeLabel}\n\n${prompt}\n\n${simulatedResponse}`,
        timestamp: new Date(),
        type: selectedContentType,
        citationStyle: selectedCitationStyle,
        sources: Array.from(selectedDocuments),
      };
      
      setGeneratedContent(newContent);
      setIsGenerating(false);
    }, 3000);
  };

  const handleRegenerateSection = () => {
    setIsGenerating(true);
    setTimeout(() => {
      if (generatedContent) {
        setGeneratedContent({
          ...generatedContent,
          content: generatedContent.content + `\n\n${t('remediusPathfinder.generation.regeneratedSection')}`,
          timestamp: new Date(),
        });
      }
      setIsGenerating(false);
    }, 2000);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const translateDocStatus = (status) => {
    return t(`remediusPathfinder.docStatus.${status}`);
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.projectCard,
        selectedProject?.id === item.id && styles.selectedProjectCard
      ]}
      onPress={() => setSelectedProject(item)}
    >
      <Text variant="titleMedium" style={styles.projectName} numberOfLines={1}>
        {item.name}
      </Text>
      {item.description && (
        <Text variant="bodySmall" style={styles.projectDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <Text variant="labelSmall" style={styles.projectDate}>
        {t('remediusPathfinder.project.updated', { date: item.updatedAt.toLocaleDateString() })}
      </Text>
    </TouchableOpacity>
  );

  const renderDocument = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.documentCard,
        selectedDocuments.has(item.id) && styles.selectedDocumentCard
      ]}
      onPress={() => {
        setSelectedDocuments(prev => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
      }}
    >
      <View style={styles.documentHeader}>
        <Text variant="labelMedium" style={styles.documentName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.documentActions}>
          <View style={[
            styles.statusBadge,
            styles[`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]
          ]}>
            <Text variant="labelSmall" style={styles.statusText}>
              {translateDocStatus(item.status)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handlePreviewPDF(item.file)}
            style={styles.documentActionButton}
          >
            <Eye size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setDocuments(prev => prev.filter(d => d.id !== item.id));
              setSelectedDocuments(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
              });
            }}
            style={styles.documentActionButton}
          >
            <X size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.documentMeta}>
        <Text variant="bodySmall" style={styles.documentSize}>
          {(item.size / 1024 / 1024).toFixed(2)} MB
        </Text>
        <Text variant="bodySmall" style={styles.documentDate}>
          {item.uploadedAt.toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContentType = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.contentTypeButton,
        selectedContentType === item.id && styles.selectedContentTypeButton
      ]}
      onPress={() => setSelectedContentType(item.id)}
    >
      <Text variant="labelSmall" style={[
        styles.contentTypeText,
        selectedContentType === item.id && styles.selectedContentTypeText
      ]}>
        {t(`remediusPathfinder.contentTypes.${item.id}`)}
      </Text>
    </TouchableOpacity>
  );

  const renderCitationStyle = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.citationStyleButton,
        selectedCitationStyle === item && styles.selectedCitationStyleButton
      ]}
      onPress={() => setSelectedCitationStyle(item)}
    >
      <Text variant="labelSmall" style={[
        styles.citationStyleText,
        selectedCitationStyle === item && styles.selectedCitationStyleText
      ]}>
        {t(`remediusPathfinder.citationStyles.${item}`)}
      </Text>
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
            {t('remediusPathfinder.header.title')}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {t('remediusPathfinder.header.subtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Sidebar */}
        {!isSidebarCollapsed && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.searchContainer}>
                <Search size={16} color={colors.onSurfaceVariant} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('remediusPathfinder.placeholders.searchProjects')}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={colors.placeholderColor}
                />
              </View>
              <TouchableOpacity
                style={styles.newProjectButton}
                onPress={() => setShowNewProjectDialog(true)}
              >
                <Plus size={16} color="white" />
                <Text variant="labelMedium" style={styles.newProjectButtonText}>
                  {t('remediusPathfinder.buttons.newProject')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.projectsList}>
              {projects.length === 0 ? (
                <View style={styles.emptyState}>
                  <Folder size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
                  <Text variant="bodySmall" style={styles.emptyStateText}>
                    {t('remediusPathfinder.messages.noProjects')}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredProjects}
                  renderItem={renderProject}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={[styles.mainContent, isSidebarCollapsed && styles.fullWidthContent]}>
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={20} color={colors.onSurfaceVariant} />
            ) : (
              <ChevronLeft size={20} color={colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>

          {selectedProject ? (
            <ScrollView style={styles.projectContent} showsVerticalScrollIndicator={false}>
              {/* Project Header */}
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <Text variant="headlineSmall" style={styles.projectTitle} numberOfLines={1}>
                    {selectedProject.name}
                  </Text>
                  {selectedProject.description && (
                    <Text variant="bodySmall" style={styles.projectDescription}>
                      {selectedProject.description}
                    </Text>
                  )}
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity style={styles.projectActionButton}>
                    <Settings size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.projectActionButton}>
                    <Download size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.projectActionButton}>
                    <Save size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Document Upload Area */}
              <TouchableOpacity style={styles.uploadArea} onPress={handleAddDocument}>
                <Upload size={24} color={colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={styles.uploadText}>
                  {t('remediusPathfinder.dropzone.prompt')}
                </Text>
                <Text variant="bodySmall" style={styles.uploadSubtext}>
                  {t('remediusPathfinder.dropzone.sizeLimit')}
                </Text>
              </TouchableOpacity>

              <View style={styles.projectGrid}>
                {/* Left Column: Documents and Assistant */}
                <View style={styles.leftColumn}>
                  {/* Research Documents */}
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {t('remediusPathfinder.sections.researchDocuments')}
                    </Text>
                    {documents.length === 0 ? (
                      <View style={styles.emptyDocuments}>
                        <FileText size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
                        <Text variant="bodySmall" style={styles.emptyDocumentsText}>
                          {t('remediusPathfinder.messages.noDocuments')}
                        </Text>
                      </View>
                    ) : (
                      <FlatList
                        data={documents}
                        renderItem={renderDocument}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                      />
                    )}
                  </View>

                  {/* Research Assistant */}
                  <View style={styles.section}>
                    <View style={styles.assistantHeader}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        {t('remediusPathfinder.sections.researchAssistant')}
                      </Text>
                      <TouchableOpacity
                        style={styles.advancedButton}
                        onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      >
                        <Text variant="labelSmall" style={styles.advancedButtonText}>
                          {showAdvancedOptions
                            ? t('remediusPathfinder.buttons.hideAdvanced')
                            : t('remediusPathfinder.buttons.showAdvanced')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Content Type */}
                    <View style={styles.inputSection}>
                      <Text variant="labelMedium" style={styles.inputLabel}>
                        {t('remediusPathfinder.labels.contentType')}
                      </Text>
                      <FlatList
                        data={CONTENT_TYPES}
                        renderItem={renderContentType}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.contentTypeRow}
                      />
                    </View>

                    {/* Advanced Options */}
                    {showAdvancedOptions && (
                      <View style={styles.advancedOptions}>
                        {/* Citation Style */}
                        <View style={styles.inputSection}>
                          <Text variant="labelMedium" style={styles.inputLabel}>
                            {t('remediusPathfinder.labels.citationStyle')}
                          </Text>
                          <FlatList
                            data={CITATION_STYLES}
                            renderItem={renderCitationStyle}
                            keyExtractor={(item) => item}
                            numColumns={3}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.citationStyleRow}
                          />
                        </View>

                        {/* Keywords */}
                        <View style={styles.inputSection}>
                          <Text variant="labelMedium" style={styles.inputLabel}>
                            {t('remediusPathfinder.labels.keywords')}
                          </Text>
                          <TextInput
                            style={styles.keywordsInput}
                            placeholder={t('remediusPathfinder.placeholders.keywords')}
                            value={keywords}
                            onChangeText={setKeywords}
                            placeholderTextColor={colors.placeholderColor}
                          />
                        </View>
                      </View>
                    )}

                    {/* Research Prompt */}
                    <View style={styles.inputSection}>
                      <Text variant="labelMedium" style={styles.inputLabel}>
                        {t('remediusPathfinder.labels.researchPrompt')}
                      </Text>
                      <TextInput
                        style={styles.promptInput}
                        placeholder={t('remediusPathfinder.placeholders.researchPrompt')}
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor={colors.placeholderColor}
                      />
                    </View>

                    {/* Generate Button */}
                    <TouchableOpacity
                      style={[
                        styles.generateButton,
                        (isGenerating || !prompt.trim() || selectedDocuments.size === 0) && 
                        styles.generateButtonDisabled
                      ]}
                      onPress={handleGenerate}
                      disabled={isGenerating || !prompt.trim() || selectedDocuments.size === 0}
                    >
                      {isGenerating ? (
                        <>
                          <Text variant="labelMedium" style={styles.generateButtonText}>
                            {t('remediusPathfinder.buttons.generating')}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Brain size={16} color="white" />
                          <Text variant="labelMedium" style={styles.generateButtonText}>
                            {t('remediusPathfinder.buttons.generate')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Right Column: Generated Content */}
                <View style={styles.rightColumn}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    {t('remediusPathfinder.sections.generatedContent')}
                  </Text>
                  
                  {generatedContent ? (
                    <View style={styles.generatedContentContainer}>
                      <View style={styles.generatedContentHeader}>
                        <Text variant="bodySmall" style={styles.generatedContentMeta}>
                          {t('remediusPathfinder.generation.generatedAt', {
                            time: generatedContent.timestamp.toLocaleTimeString(),
                            style: t(`remediusPathfinder.citationStyles.${generatedContent.citationStyle}`),
                          })}
                        </Text>
                        <View style={styles.generatedContentActions}>
                          <TouchableOpacity
                            style={styles.contentActionButton}
                            onPress={handleRegenerateSection}
                            disabled={isGenerating}
                          >
                            <RefreshCw size={12} color={colors.primary} />
                            <Text variant="labelSmall" style={styles.contentActionText}>
                              {t('remediusPathfinder.buttons.regenerate')}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.contentActionButton}
                            onPress={() => {
                              // Mock copy functionality
                              Alert.alert(t('success.copied'));
                            }}
                          >
                            <Copy size={12} color={colors.primary} />
                            <Text variant="labelSmall" style={styles.contentActionText}>
                              {t('remediusPathfinder.buttons.copy')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <ScrollView style={styles.generatedContentScroll} showsVerticalScrollIndicator={false}>
                        <Text variant="bodySmall" style={styles.generatedContentText}>
                          {generatedContent.content}
                        </Text>
                      </ScrollView>
                      
                      {/* Sources Used */}
                      <View style={styles.sourcesContainer}>
                        <Text variant="labelMedium" style={styles.sourcesTitle}>
                          {t('remediusPathfinder.generation.sourcesUsed')}:
                        </Text>
                        {generatedContent.sources.map(sourceId => {
                          const doc = documents.find(d => d.id === sourceId);
                          return doc ? (
                            <View key={sourceId} style={styles.sourceItem}>
                              <Text variant="labelSmall" style={styles.sourceName} numberOfLines={1}>
                                {doc.name}
                              </Text>
                              <TouchableOpacity
                                onPress={() => handlePreviewPDF(doc.file)}
                                style={styles.sourcePreviewButton}
                              >
                                <BookOpen size={12} color={colors.primary} />
                              </TouchableOpacity>
                            </View>
                          ) : null;
                        })}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyContent}>
                      <FileText size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
                      <Text variant="bodySmall" style={styles.emptyContentText}>
                        {t('remediusPathfinder.messages.noContentGenerated')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : (
            // No Project Selected
            <View style={styles.noProjectSelected}>
              <Folder size={80} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
              <Text variant="headlineSmall" style={styles.noProjectTitle}>
                {t('remediusPathfinder.messages.noProjectSelectedTitle')}
              </Text>
              <Text variant="bodyMedium" style={styles.noProjectMessage}>
                {t('remediusPathfinder.messages.noProjectSelectedMessage')}
              </Text>
              <TouchableOpacity
                style={styles.createProjectButton}
                onPress={() => setShowNewProjectDialog(true)}
              >
                <Plus size={16} color="white" />
                <Text variant="labelMedium" style={styles.createProjectButtonText}>
                  {t('remediusPathfinder.buttons.createProject')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <Text variant="headlineSmall" style={styles.dialogTitle}>
                {t('remediusPathfinder.newProjectDialog.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowNewProjectDialog(false)}>
                <X size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dialogContent}>
              <TextInput
                style={styles.projectNameInput}
                placeholder={t('remediusPathfinder.placeholders.projectName')}
                value={newProjectName}
                onChangeText={setNewProjectName}
                placeholderTextColor={colors.placeholderColor}
              />
              <TextInput
                style={styles.projectDescriptionInput}
                placeholder={t('remediusPathfinder.placeholders.projectDescription')}
                value={newProjectDescription}
                onChangeText={setNewProjectDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.placeholderColor}
              />
              <TouchableOpacity
                style={[
                  styles.createButton,
                  !newProjectName.trim() && styles.createButtonDisabled
                ]}
                onPress={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                <Text variant="labelMedium" style={styles.createButtonText}>
                  {t('remediusPathfinder.buttons.createProject')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* PDF Preview Dialog */}
      {showPDFPreview && selectedPDF && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <Text variant="headlineSmall" style={styles.dialogTitle}>
                {t('remediusPathfinder.pdfPreview.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowPDFPreview(false)}>
                <X size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pdfPreviewContent}>
              <Text variant="bodySmall" style={styles.pdfPreviewFileName}>
                {t('remediusPathfinder.pdfPreview.fileName')}: {selectedPDF.name}
              </Text>
              <View style={styles.pdfPreviewContainer}>
                <Text variant="bodyMedium" style={styles.pdfPreviewText}>
                  PDF preview would be displayed here
                </Text>
              </View>
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
  // Sidebar Styles
  sidebar: {
    width: wp(25),
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: colors.outline,
  },
  sidebarHeader: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
  },
  newProjectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  projectsList: {
    flex: 1,
    padding: wp(4),
  },
  projectCard: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedProjectCard: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  projectName: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectDescription: {
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  projectDate: {
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  emptyStateText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 12,
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },
  fullWidthContent: {
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
  projectContent: {
    flex: 1,
    padding: wp(4),
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  projectInfo: {
    flex: 1,
    marginRight: 16,
  },
  projectTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  projectActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  uploadArea: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: hp(3),
  },
  uploadText: {
    color: colors.onSurface,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadSubtext: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  projectGrid: {
    flexDirection: 'row',
    gap: wp(4),
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 12,
  },
  // Document Styles
  documentCard: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedDocumentCard: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  documentName: {
    color: colors.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusProcessing: {
    backgroundColor: '#DBEAFE',
  },
  statusIndexed: {
    backgroundColor: '#DCFCE7',
  },
  statusError: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    color: colors.onSurface,
  },
  documentActionButton: {
    padding: 4,
    borderRadius: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  documentSize: {
    color: colors.onSurfaceVariant,
  },
  documentDate: {
    color: colors.onSurfaceVariant,
  },
  emptyDocuments: {
    alignItems: 'center',
    paddingVertical: hp(6),
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyDocumentsText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 12,
  },
  // Assistant Styles
  assistantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  advancedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
  },
  advancedButtonText: {
    color: colors.onSurface,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  contentTypeRow: {
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  contentTypeButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  selectedContentTypeButton: {
    borderColor: colors.lightGreen,
    backgroundColor: colors.lightGreen,
  },
  contentTypeText: {
    color: colors.onSurface,
    textAlign: 'center',
  },
  selectedContentTypeText: {
    color: 'white',
  },
  advancedOptions: {
    marginBottom: 16,
  },
  citationStyleRow: {
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  citationStyleButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  selectedCitationStyleButton: {
    borderColor: colors.lightGreen,
    backgroundColor: colors.lightGreen,
  },
  citationStyleText: {
    color: colors.onSurface,
    textAlign: 'center',
  },
  selectedCitationStyleText: {
    color: 'white',
  },
  keywordsInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: colors.surface,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    height: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
  },
  generateButtonDisabled: {
    backgroundColor: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Generated Content Styles
  generatedContentContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  generatedContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  generatedContentMeta: {
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  generatedContentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  contentActionText: {
    color: colors.primary,
  },
  generatedContentScroll: {
    flex: 1,
    maxHeight: hp(30),
  },
  generatedContentText: {
    color: colors.onSurface,
    padding: 12,
    lineHeight: 20,
  },
  sourcesContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  sourcesTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  sourceName: {
    color: colors.onSurface,
    flex: 1,
  },
  sourcePreviewButton: {
    padding: 4,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyContentText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 12,
  },
  // No Project Selected Styles
  noProjectSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(8),
  },
  noProjectTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noProjectMessage: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  createProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
  },
  createProjectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Dialog Styles
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
    width: wp(85),
    maxHeight: hp(70),
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
  dialogContent: {
    padding: wp(4),
    gap: 16,
  },
  projectNameInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.onSurface,
  },
  projectDescriptionInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    paddingVertical: 12,
    backgroundColor: colors.lightGreen,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // PDF Preview Styles
  pdfPreviewContent: {
    padding: wp(4),
  },
  pdfPreviewFileName: {
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  pdfPreviewContainer: {
    height: hp(50),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPreviewText: {
    color: colors.onSurfaceVariant,
  },
});

export default Pathfinder;