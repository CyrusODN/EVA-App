import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
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
  BookOpen,
  Star,
  Clock,
  Upload,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import LinearGradient from 'react-native-linear-gradient';

type TabType = 'library' | 'favorites' | 'recent';

const ResearchProtocol = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [searchText, setSearchText] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const renderTabButton = (
    tab: TabType,
    icon: React.ReactNode,
    label: string,
  ) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}>
        {isActive && (
          <LinearGradient
            colors={['#53A0CD', '#44C2AD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabGradient}
          />
        )}
        <View style={styles.tabContent}>
          {icon}
          <Text
            variant="labelMedium"
            style={[styles.tabText, isActive && styles.activeTabText]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
              <BookOpen size={24} color="white" />
            </LinearGradient>
          </View>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Research Scholar
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Chat with scientific publications to enhance your medical
              knowledge
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
            placeholder="Search documents..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTabButton(
          'library',
          <BookOpen
            size={18}
            color={activeTab === 'library' ? 'white' : '#6B7280'}
          />,
          'Library',
        )}
        {renderTabButton(
          'favorites',
          <Star
            size={18}
            color={activeTab === 'favorites' ? 'white' : '#6B7280'}
          />,
          'Favorites',
        )}
        {renderTabButton(
          'recent',
          <Clock
            size={18}
            color={activeTab === 'recent' ? 'white' : '#6B7280'}
          />,
          'Recent',
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIconContainer}>
            <Upload size={48} color="#9CA3AF" strokeWidth={1.5} />
          </View>
          <Text variant="titleMedium" style={styles.uploadTitle}>
            Drop your documents here
          </Text>
          <Text variant="bodySmall" style={styles.uploadSubtitle}>
            PDF, DOC, DOCX
          </Text>
        </View>

        {/* Empty State Message */}
        <View style={styles.emptyStateContainer}>
          <Text variant="bodyMedium" style={styles.emptyStateText}>
            Upload your research documents to start exploring and chatting with
            scientific publications
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient
          colors={['#53A0CD', '#44C2AD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}>
          <Upload size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: 'white',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: 'transparent',
  },
  tabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    gap: 6,
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(5),
    paddingBottom: hp(10),
  },
  uploadArea: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingVertical: hp(8),
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
  },
  uploadSubtitle: {
    color: '#9CA3AF',
  },
  emptyStateContainer: {
    marginTop: hp(3),
    paddingHorizontal: wp(5),
  },
  emptyStateText: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: hp(3),
    right: wp(5),
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResearchProtocol;
