import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  ChevronLeft,
  Search,
  FlaskConical,
  Plus,
  Trash2,
  ImageIcon,
  FileText,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import LinearGradient from 'react-native-linear-gradient';

interface Study {
  id: string;
  name: string;
  status: 'draft' | 'active';
  createdAt: Date;
}

const ResearchProtocolPro = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [newStudyName, setNewStudyName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddStudy = () => {
    if (newStudyName.trim()) {
      const newStudy: Study = {
        id: Date.now().toString(),
        name: newStudyName.trim(),
        status: 'draft',
        createdAt: new Date(),
      };
      setStudies([newStudy, ...studies]);
      setSelectedStudy(newStudy);
      setNewStudyName('');
      setShowAddStudy(false);
    }
  };

  const handleDeleteStudy = (studyId: string) => {
    Alert.alert('Delete Study', 'Are you sure you want to delete this study?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setStudies(studies.filter((s) => s.id !== studyId));
          if (selectedStudy?.id === studyId) {
            setSelectedStudy(null);
          }
        },
      },
    ]);
  };

  const handleUploadProtocol = () => {
    // Simulate file upload
    Alert.alert('Upload Protocol', 'Select file type to upload', [
      {
        text: 'Images',
        onPress: () => {
          // Simulate image upload
          setUploadedFiles([...uploadedFiles, 'protocol_image.png']);
          Alert.alert('Success', 'Image uploaded successfully');
        },
      },
      {
        text: 'Document',
        onPress: () => {
          // Simulate document upload
          setUploadedFiles([...uploadedFiles, 'protocol.pdf']);
          Alert.alert('Success', 'Document uploaded successfully');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderStudyItem = (study: Study) => {
    const isSelected = selectedStudy?.id === study.id;
    return (
      <Pressable
        key={study.id}
        style={[styles.studyItem, isSelected && styles.selectedStudyItem]}
        onPress={() => setSelectedStudy(study)}>
        <View style={styles.studyItemContent}>
          <View style={styles.studyIconContainer}>
            <FlaskConical size={18} color="#53A0CD" />
          </View>
          <View style={styles.studyInfo}>
            <Text variant="bodyMedium" style={styles.studyName}>
              {study.name}
            </Text>
            <View style={styles.studyStatusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  study.status === 'draft'
                    ? styles.draftBadge
                    : styles.activeBadge,
                ]}>
                <Text variant="labelSmall" style={styles.statusText}>
                  {study.status === 'draft' ? 'Draft' : 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={(e: any) => {
            e?.stopPropagation?.();
            handleDeleteStudy(study.id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Trash2 size={18} color="#EF4444" />
        </Pressable>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <FileText size={64} color="#D1D5DB" strokeWidth={1.5} />
      </View>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Select a study from the sidebar to start exploring
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Create a new study to begin uploading protocol documents
      </Text>
    </View>
  );

  const renderUploadArea = () => (
    <View style={styles.uploadSection}>
      <TouchableOpacity
        style={styles.uploadArea}
        onPress={handleUploadProtocol}
        activeOpacity={0.7}>
        <View style={styles.uploadIconContainer}>
          <ImageIcon size={48} color="#53A0CD" strokeWidth={1.5} />
        </View>
        <Text variant="titleMedium" style={styles.uploadTitle}>
          Upload Protocol Images
        </Text>
        <Text variant="bodySmall" style={styles.uploadSubtitle}>
          Drag & drop images here, or click to select
        </Text>
        <Text variant="bodySmall" style={styles.uploadFormats}>
          PNG, JPG, JPEG, GIF, BMP, WEBP (max 10MB each)
        </Text>
      </TouchableOpacity>

      {uploadedFiles.length > 0 && (
        <View style={styles.uploadedFilesContainer}>
          <Text variant="titleSmall" style={styles.uploadedFilesTitle}>
            Uploaded Files ({uploadedFiles.length})
          </Text>
          {uploadedFiles.map((file, index) => (
            <View key={index} style={styles.uploadedFileItem}>
              <FileText size={20} color="#53A0CD" />
              <Text variant="bodyMedium" style={styles.uploadedFileName}>
                {file}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                }}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text variant="bodySmall" style={styles.uploadNote}>
        Upload protocol images to enable features
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#53A0CD', '#44C2AD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.iconGradient}>
              <FlaskConical size={24} color="white" />
            </LinearGradient>
          </View>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Research Protocol Pro
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Manage and analyze your research protocols
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search protocols..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Study Name Section */}
      <View style={styles.studyNameSection}>
        <View style={styles.studyNameHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Study Name
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddStudy(!showAddStudy)}
            activeOpacity={0.7}>
            <Plus size={20} color="#53A0CD" />
          </TouchableOpacity>
        </View>

        {showAddStudy && (
          <View style={styles.addStudyContainer}>
            <TextInput
              style={styles.studyNameInput}
              placeholder="Enter study name..."
              placeholderTextColor="#9CA3AF"
              value={newStudyName}
              onChangeText={setNewStudyName}
              autoFocus
            />
            <View style={styles.addStudyActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddStudy(false);
                  setNewStudyName('');
                }}>
                <Text variant="labelMedium" style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddStudy}
                disabled={!newStudyName.trim()}>
                <LinearGradient
                  colors={['#53A0CD', '#44C2AD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}>
                  <Text variant="labelMedium" style={styles.saveButtonText}>
                    Add Study
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Studies List */}
        <ScrollView
          style={styles.studiesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.studiesListContent}>
          {studies.map(renderStudyItem)}
          {studies.length === 0 && !showAddStudy && (
            <Text variant="bodySmall" style={styles.noStudiesText}>
              No studies yet. Click + to create one.
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {selectedStudy ? (
          <>
            {/* Selected Study Header */}
            <View style={styles.selectedStudyHeader}>
              <Text variant="headlineSmall" style={styles.selectedStudyTitle}>
                {selectedStudy.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  selectedStudy.status === 'draft'
                    ? styles.draftBadge
                    : styles.activeBadge,
                ]}>
                <Text variant="labelMedium" style={styles.statusText}>
                  {selectedStudy.status === 'draft' ? 'Draft' : 'Active'}
                </Text>
              </View>
            </View>

            {renderUploadArea()}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: wp(3),
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    paddingTop: hp(0.5),
  },
  headerTitle: {
    color: '#53A0CD',
    fontWeight: '700',
    marginBottom: hp(0.5),
  },
  headerSubtitle: {
    color: '#6B7280',
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: 16,
    color: '#1F2937',
    ...Platform.select({
      ios: {
        fontFamily: 'SFProText-Regular',
      },
    }),
  },
  studyNameSection: {
    backgroundColor: 'white',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: hp(35),
  },
  studyNameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStudyContainer: {
    marginBottom: hp(2),
  },
  studyNameInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: '#53A0CD',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: hp(1),
  },
  addStudyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: hp(1.2),
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    // paddingVertical: hp(1.2),
    height: hp(4),
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    marginTop: hp(1),
  },
  studiesList: {
    flex: 1,
  },
  studiesListContent: {
    paddingBottom: hp(1),
  },
  studyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: wp(3),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedStudyItem: {
    backgroundColor: '#EFF6FF',
    borderColor: '#53A0CD',
  },
  studyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  studyInfo: {
    flex: 1,
  },
  studyName: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: hp(0.3),
  },
  studyStatusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: 6,
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  deleteButton: {
    padding: wp(2),
  },
  noStudiesText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: hp(2),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(5),
    paddingBottom: hp(3),
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  emptyIconContainer: {
    marginBottom: hp(3),
  },
  emptyTitle: {
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: hp(1),
    paddingHorizontal: wp(10),
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  selectedStudyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(3),
  },
  selectedStudyTitle: {
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
  },
  uploadSection: {
    marginTop: hp(1),
  },
  uploadArea: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#53A0CD',
    borderStyle: 'dashed',
    paddingVertical: hp(6),
    paddingHorizontal: wp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    marginBottom: hp(2),
  },
  uploadTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: hp(0.5),
    textAlign: 'center',
  },
  uploadSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: hp(0.3),
  },
  uploadFormats: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 12,
  },
  uploadedFilesContainer: {
    marginTop: hp(2),
    backgroundColor: 'white',
    borderRadius: 12,
    padding: wp(4),
  },
  uploadedFilesTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: hp(1),
  },
  uploadedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  uploadedFileName: {
    flex: 1,
    color: '#4B5563',
    marginLeft: wp(2),
  },
  uploadNote: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: hp(2),
  },
});

export default ResearchProtocolPro;
