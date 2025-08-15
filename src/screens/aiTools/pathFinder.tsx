import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
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
  Upload,
  X,
  Eye,
  RefreshCw,
  Copy,
  BookOpen,
  Brain,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Share,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../../components/primaryButton';
import Input from '../../components/input';
import { colors } from '../../constants/colors';
import { customToast } from '../../utils/toastMessage';

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
  const [currentView, setCurrentView] = useState('projects'); // projects, project-detail, assistant, generated
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
  
  // Dialog states
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleBack = () => {
    if (currentView === 'projects') {
      navigation.goBack();
    } else if (currentView === 'project-detail') {
      setCurrentView('projects');
    } else {
      setCurrentView('project-detail');
    }
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
    setCurrentView('project-detail');
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
  };

  const handleAddDocument = () => {
    const mockDoc = {
      id: Math.random().toString(36).substring(7),
      name: `research_paper_${Date.now()}.pdf`,
      size: 1024 * 1024 * 3.2,
      uploadedAt: new Date(),
      status: 'pending',
    };
    
    setDocuments(prev => [...prev, mockDoc]);
    
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

  const handleGenerate = () => {
    if (!prompt.trim() || selectedDocuments.size === 0) {
      customToast('error', t('common.error'), 'Please add a prompt and select documents');
      return;
    }
    
    setIsGenerating(true);
    setCurrentView('generated');
    
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

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const translateDocStatus = (status) => {
    return t(`remediusPathfinder.docStatus.${status}`);
  };

  // Projects List View
  const renderProjectsView = () => (
    <View style={styles.viewContainer}>
      <View style={styles.searchSection}>
        <Input
          placeholder={t('remediusPathfinder.placeholders.searchProjects')}
          value={searchQuery}
          setValue={setSearchQuery}
          width={wp(90)}
          leftIcon={<Search size={16} color={colors.subText} />}
        />
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Folder size={80} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
            <Text variant="headlineSmall" style={styles.emptyStateTitle}>
              {t('remediusPathfinder.messages.noProjects')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyStateMessage}>
              Create your first research project to get started
            </Text>
          </View>
        ) : (
          <View style={styles.projectsGrid}>
            {filteredProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCardMobile}
                onPress={() => handleSelectProject(project)}
              >
                <View style={styles.projectCardHeader}>
                  <Folder size={24} color={colors.lightGreen} />
                  <TouchableOpacity style={styles.projectOptionsButton}>
                    <Settings size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <Text variant="titleMedium" style={styles.projectCardTitle}>
                  {project.name}
                </Text>
                {project.description && (
                  <Text variant="bodySmall" style={styles.projectCardDescription}>
                    {project.description}
                  </Text>
                )}
                <Text variant="labelSmall" style={styles.projectCardDate}>
                  {t('remediusPathfinder.project.updated', { 
                    date: project.updatedAt.toLocaleDateString() 
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={() => setShowNewProjectDialog(true)}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Project Detail View
  const renderProjectDetailView = () => (
    <View style={styles.viewContainer}>
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View style={styles.projectInfoCard}>
          <View style={styles.projectInfoHeader}>
            <View style={styles.projectInfoMain}>
              <Text variant="headlineSmall" style={styles.projectInfoTitle}>
                {selectedProject?.name}
              </Text>
              {selectedProject?.description && (
                <Text variant="bodyMedium" style={styles.projectInfoDescription}>
                  {selectedProject.description}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.projectInfoOptionsButton}>
              <Settings size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.projectStats}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {documents.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Documents
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {generatedContent ? '1' : '0'}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Generated
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {selectedDocuments.size}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Selected
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleAddDocument}
            >
              <Upload size={24} color={colors.lightGreen} />
              <Text variant="bodyMedium" style={styles.quickActionText}>
                Add Document
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setCurrentView('assistant')}
            >
              <Brain size={24} color={colors.lightGreen} />
              <Text variant="bodyMedium" style={styles.quickActionText}>
                AI Assistant
              </Text>
            </TouchableOpacity>
            {generatedContent && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setCurrentView('generated')}
              >
                <FileText size={24} color={colors.lightGreen} />
                <Text variant="bodyMedium" style={styles.quickActionText}>
                  View Generated
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.documentsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Documents ({documents.length})
            </Text>
            <TouchableOpacity onPress={handleAddDocument}>
              <Plus size={20} color={colors.lightGreen} />
            </TouchableOpacity>
          </View>

          {documents.length === 0 ? (
            <TouchableOpacity style={styles.emptyDocumentsCard} onPress={handleAddDocument}>
              <Upload size={32} color={colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={styles.emptyDocumentsText}>
                {t('remediusPathfinder.dropzone.prompt')}
              </Text>
              <Text variant="bodySmall" style={styles.emptyDocumentsSubtext}>
                {t('remediusPathfinder.dropzone.sizeLimit')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.documentsGrid}>
              {documents.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentCardMobile,
                    selectedDocuments.has(doc.id) && styles.selectedDocumentCardMobile
                  ]}
                  onPress={() => {
                    setSelectedDocuments(prev => {
                      const next = new Set(prev);
                      if (next.has(doc.id)) next.delete(doc.id);
                      else next.add(doc.id);
                      return next;
                    });
                  }}
                >
                  <View style={styles.documentCardHeader}>
                    <FileText size={20} color={selectedDocuments.has(doc.id) ? colors.lightGreen : colors.onSurfaceVariant} />
                    <View style={[
                      styles.documentStatusBadge,
                      styles[`status${doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}`]
                    ]}>
                      <Text variant="labelSmall" style={styles.documentStatusText}>
                        {translateDocStatus(doc.status)}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodyMedium" style={styles.documentCardTitle} numberOfLines={2}>
                    {doc.name}
                  </Text>
                  <View style={styles.documentCardFooter}>
                    <Text variant="bodySmall" style={styles.documentCardSize}>
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                    <Text variant="bodySmall" style={styles.documentCardDate}>
                      {doc.uploadedAt.toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  // AI Assistant View
  const renderAssistantView = () => (
    <View style={styles.viewContainer}>
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.assistantCard}>
          <Text variant="headlineSmall" style={styles.assistantTitle}>
            AI Research Assistant
          </Text>
          <Text variant="bodyMedium" style={styles.assistantSubtitle}>
            Generate research content using your documents
          </Text>

          {/* Selected Documents Summary */}
          {selectedDocuments.size > 0 && (
            <View style={styles.selectedDocumentsCard}>
              <Text variant="titleMedium" style={styles.selectedDocumentsTitle}>
                Selected Documents ({selectedDocuments.size})
              </Text>
              <View style={styles.selectedDocumentsList}>
                {Array.from(selectedDocuments).map(docId => {
                  const doc = documents.find(d => d.id === docId);
                  return doc ? (
                    <View key={docId} style={styles.selectedDocumentItem}>
                      <FileText size={16} color={colors.lightGreen} />
                      <Text variant="bodySmall" style={styles.selectedDocumentName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                    </View>
                  ) : null;
                })}
              </View>
            </View>
          )}

          {/* Content Type Selection */}
          <View style={styles.inputSection}>
            <Text variant="titleMedium" style={styles.inputLabel}>
              {t('remediusPathfinder.labels.contentType')}
            </Text>
            <View style={styles.contentTypeGrid}>
              {CONTENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.contentTypeButtonMobile,
                    selectedContentType === type.id && styles.selectedContentTypeButtonMobile
                  ]}
                  onPress={() => setSelectedContentType(type.id)}
                >
                  <Text variant="bodySmall" style={[
                    styles.contentTypeTextMobile,
                    selectedContentType === type.id && styles.selectedContentTypeTextMobile
                  ]}>
                    {t(`remediusPathfinder.contentTypes.${type.id}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Advanced Options Toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <Text variant="bodyMedium" style={styles.advancedToggleText}>
              Advanced Options
            </Text>
            {showAdvancedOptions ? (
              <ChevronUp size={20} color={colors.onSurfaceVariant} />
            ) : (
              <ChevronDown size={20} color={colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <View style={styles.advancedOptionsCard}>
              <View style={styles.inputSection}>
                <Text variant="titleMedium" style={styles.inputLabel}>
                  {t('remediusPathfinder.labels.citationStyle')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.citationStyleRow}>
                    {CITATION_STYLES.map((style) => (
                      <TouchableOpacity
                        key={style}
                        style={[
                          styles.citationStyleButtonMobile,
                          selectedCitationStyle === style && styles.selectedCitationStyleButtonMobile
                        ]}
                        onPress={() => setSelectedCitationStyle(style)}
                      >
                        <Text variant="bodySmall" style={[
                          styles.citationStyleTextMobile,
                          selectedCitationStyle === style && styles.selectedCitationStyleTextMobile
                        ]}>
                          {style}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={[styles.inputSection,{alignSelf:'center'}]}>
                <Input
                  placeholder={t('remediusPathfinder.placeholders.keywords')}
                  value={keywords}
                  setValue={setKeywords}
                  width={wp(80)}
                />
              </View>
            </View>
          )}

          {/* Research Prompt */}
          <View style={styles.inputSection}>
            <Text variant="titleMedium" style={styles.inputLabel}>
              {t('remediusPathfinder.labels.researchPrompt')}
            </Text>
            <TextInput
              style={styles.promptInputMobile}
              placeholder={t('remediusPathfinder.placeholders.researchPrompt')}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.placeholderColor}
            />
          </View>

          {/* Generate Button */}
          <View style={{alignSelf:'center'}}>
          <PrimaryButton
            text={isGenerating ? t('remediusPathfinder.buttons.generating') : t('remediusPathfinder.buttons.generate')}
            onPress={handleGenerate}
            disabled={isGenerating || !prompt.trim() || selectedDocuments.size === 0}
            loading={isGenerating}
            width={wp(80)}
          /></View>
        </View>
      </ScrollView>
    </View>
  );

  // Generated Content View
  const renderGeneratedView = () => (
    <View style={styles.viewContainer}>
      {generatedContent ? (
        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.generatedContentCard}>
            <View style={styles.generatedContentHeader}>
              <Text variant="headlineSmall" style={styles.generatedContentTitle}>
                Generated Content
              </Text>
              <View style={styles.generatedContentActions}>
                <TouchableOpacity style={styles.generatedActionButton}>
                  <Share size={16} color={colors.lightGreen} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.generatedActionButton}>
                  <Download size={16} color={colors.lightGreen} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.generatedActionButton}>
                  <Copy size={16} color={colors.lightGreen} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.generatedContentMeta}>
              <Text variant="bodySmall" style={styles.generatedContentDate}>
                Generated at {generatedContent.timestamp.toLocaleTimeString()}
              </Text>
              <Text variant="bodySmall" style={styles.generatedContentStyle}>
                {t(`remediusPathfinder.citationStyles.${generatedContent.citationStyle}`)} Style
              </Text>
            </View>

            <View style={styles.generatedContentBody}>
              <Text variant="bodyMedium" style={styles.generatedContentText}>
                {generatedContent.content}
              </Text>
            </View>

            <View style={styles.sourcesSection}>
              <Text variant="titleMedium" style={styles.sourcesTitle}>
                Sources Used ({generatedContent.sources.length})
              </Text>
              {generatedContent.sources.map(sourceId => {
                const doc = documents.find(d => d.id === sourceId);
                return doc ? (
                  <View key={sourceId} style={styles.sourceItem}>
                    <FileText size={16} color={colors.lightGreen} />
                    <Text variant="bodySmall" style={styles.sourceName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <TouchableOpacity style={styles.sourceViewButton}>
                      <Eye size={14} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                ) : null;
              })}
            </View>

            <View style={styles.regenerateSection}>
              <PrimaryButton
                text="Regenerate Section"
                onPress={() => {
                  setIsGenerating(true);
                  setTimeout(() => {
                    setGeneratedContent({
                      ...generatedContent,
                      content: generatedContent.content + "\n\nRegenerated content with updated analysis...",
                      timestamp: new Date(),
                    });
                    setIsGenerating(false);
                  }, 2000);
                }}
                loading={isGenerating}
                width={wp(90)}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyGeneratedState}>
          <Brain size={80} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
          <Text variant="headlineSmall" style={styles.emptyGeneratedTitle}>
            No Content Generated
          </Text>
          <Text variant="bodyMedium" style={styles.emptyGeneratedMessage}>
            Use the AI Assistant to generate research content
          </Text>
          <PrimaryButton
            text="Go to Assistant"
            onPress={() => setCurrentView('assistant')}
            width={wp(60)}
          />
        </View>
      )}
    </View>
  );

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'projects':
        return t('remediusPathfinder.header.title');
      case 'project-detail':
        return selectedProject?.name || 'Project';
      case 'assistant':
        return 'AI Assistant';
      case 'generated':
        return 'Generated Content';
      default:
        return t('remediusPathfinder.header.title');
    }
  };

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
            {getHeaderTitle()}
          </Text>
          {currentView === 'projects' && (
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {t('remediusPathfinder.header.subtitle')}
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      {currentView === 'projects' && renderProjectsView()}
      {currentView === 'project-detail' && renderProjectDetailView()}
      {currentView === 'assistant' && renderAssistantView()}
      {currentView === 'generated' && renderGeneratedView()}

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
              <Input
                placeholder={t('remediusPathfinder.placeholders.projectName')}
                value={newProjectName}
                setValue={setNewProjectName}
                width={wp(80)}
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
              <PrimaryButton
                text={t('remediusPathfinder.buttons.createProject')}
                onPress={handleCreateProject}
                disabled={!newProjectName.trim()}
                width={wp(80)}
              />
            </View>
          </View>
        </View>
      )}
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
  viewContainer: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  searchSection: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(15),
  },
  emptyStateTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: wp(8),
  },
  projectsGrid: {
    paddingVertical: hp(2),
  },
  projectCardMobile: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  projectOptionsButton: {
    padding: 4,
  },
  projectCardTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  projectCardDescription: {
    color: colors.onSurfaceVariant,
    marginBottom: hp(1),
  },
  projectCardDate: {
    color: colors.onSurfaceVariant,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: hp(3),
    right: wp(4),
  },
  floatingActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  projectInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: wp(4),
    marginVertical: hp(2),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  projectInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  projectInfoMain: {
    flex: 1,
  },
  projectInfoTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  projectInfoDescription: {
    color: colors.onSurfaceVariant,
  },
  projectInfoOptionsButton: {
    padding: 4,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: hp(2),
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.lightGreen,
    fontWeight: '600',
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  quickActionsSection: {
    marginVertical: hp(1),
  },
  sectionTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(1.5),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1.5),
  },
  quickActionButton: {
    flex: 1,
    minWidth: wp(25),
    alignItems: 'center',
    padding: wp(4),
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  quickActionText: {
    color: colors.onSurface,
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  documentsSection: {
    marginVertical: hp(1),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  emptyDocumentsCard: {
    alignItems: 'center',
    padding: wp(8),
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
  },
  emptyDocumentsText: {
    color: colors.onSurface,
    marginTop: hp(1),
    textAlign: 'center',
  },
  emptyDocumentsSubtext: {
    color: colors.onSurfaceVariant,
    marginTop: hp(0.5),
    textAlign: 'center',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1.5),
  },
  documentCardMobile: {
    flex: 1,
    minWidth: wp(40),
    backgroundColor: 'white',
    borderRadius: 12,
    padding: wp(3),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  selectedDocumentCardMobile: {
    borderColor: colors.lightGreen,
    backgroundColor: '#F0FDF4',
  },
  documentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  documentStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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
  documentStatusText: {
    color: colors.onSurface,
  },
  documentCardTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(1),
  },
  documentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  documentCardSize: {
    color: colors.onSurfaceVariant,
  },
  documentCardDate: {
    color: colors.onSurfaceVariant,
  },
  assistantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: wp(4),
    marginVertical: hp(2),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  assistantTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  assistantSubtitle: {
    color: colors.onSurfaceVariant,
    marginBottom: hp(2),
  },
  selectedDocumentsCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: wp(3),
    marginBottom: hp(2),
  },
  selectedDocumentsTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(1),
  },
  selectedDocumentsList: {
    gap: hp(0.5),
  },
  selectedDocumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  selectedDocumentName: {
    color: colors.onSurface,
    flex: 1,
  },
  inputSection: {
    marginBottom: hp(2),
  },
  inputLabel: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(1),
  },
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1),
  },
  contentTypeButtonMobile: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: hp(0.5),
  },
  selectedContentTypeButtonMobile: {
    borderColor: colors.lightGreen,
    backgroundColor: colors.lightGreen,
  },
  contentTypeTextMobile: {
    color: colors.onSurface,
    textAlign: 'center',
  },
  selectedContentTypeTextMobile: {
    color: 'white',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    marginTop: hp(1),
  },
  advancedToggleText: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  advancedOptionsCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: wp(3),
    marginTop: hp(1),
  },
  citationStyleRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  citationStyleButtonMobile: {
    paddingVertical: hp(0.75),
    paddingHorizontal: wp(3),
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  selectedCitationStyleButtonMobile: {
    borderColor: colors.lightGreen,
    backgroundColor: colors.lightGreen,
  },
  citationStyleTextMobile: {
    color: colors.onSurface,
  },
  selectedCitationStyleTextMobile: {
    color: 'white',
  },
  promptInputMobile: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: 14,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    height: hp(12),
    textAlignVertical: 'top',
  },
  generatedContentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: hp(2),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  generatedContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  generatedContentTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  generatedContentActions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  generatedActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  generatedContentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: colors.background,
  },
  generatedContentDate: {
    color: colors.onSurfaceVariant,
  },
  generatedContentStyle: {
    color: colors.onSurfaceVariant,
  },
  generatedContentBody: {
    padding: wp(4),
  },
  generatedContentText: {
    color: colors.onSurface,
    lineHeight: 22,
  },
  sourcesSection: {
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  sourcesTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: hp(1),
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.75),
    paddingHorizontal: wp(3),
    backgroundColor: colors.background,
    borderRadius: 6,
    marginBottom: hp(0.5),
  },
  sourceName: {
    color: colors.onSurface,
    flex: 1,
    marginLeft: wp(2),
  },
  sourceViewButton: {
    padding: 4,
  },
  regenerateSection: {
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    alignItems: 'center',
  },
  emptyGeneratedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emptyGeneratedTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyGeneratedMessage: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: hp(3),
  },
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
    gap: hp(2),
    alignItems: 'center',
  },
  projectDescriptionInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: 14,
    color: colors.onSurface,
    width: wp(80),
    height: hp(8),
    textAlignVertical: 'top',
  },
});

export default Pathfinder;