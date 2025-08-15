import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView as RNSafeAreaView,
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
  FileText,
  Pill,
  Brain,
  BookOpen,
  Stethoscope,
  ClipboardList,
  GraduationCap,
  ListChecks,
  ArrowRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

const AI_TOOLS = [
  {
    id: 'discharge',
    title: 'aiTools.discharge.title',
    description: 'aiTools.discharge.description',
    icon: Stethoscope,
    color: colors.primary,
    bgImage: 'https://images.pexels.com/photos/3846005/pexels-photo-3846005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.discharge.features.0',
      'aiTools.discharge.features.1',
      'aiTools.discharge.features.2',
    ],
    screenName: 'discharge',
  },
  {
    id: 'prescreening',
    title: 'aiTools.prescreening.title',
    description: 'aiTools.prescreening.description',
    icon: ListChecks,
    color: colors.primary,
    bgImage: 'https://images.pexels.com/photos/4226264/pexels-photo-4226264.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.prescreening.features.0',
      'aiTools.prescreening.features.1',
      'aiTools.prescreening.features.2',
    ],
    screenName: 'prescreening',
  },
  {
    id: 'research',
    title: 'aiTools.research.title',
    description: 'aiTools.research.description',
    icon: GraduationCap,
    color: colors.primary,
    bgImage: 'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.research.features.0',
      'aiTools.research.features.1',
      'aiTools.research.features.2',
    ],
    screenName: 'research',
  },
  {
    id: 'consult',
    title: 'aiTools.consult.title',
    description: 'aiTools.consult.description',
    icon: Brain,
    color: colors.primary,
    bgImage: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.consult.features.0',
      'aiTools.consult.features.1',
      'aiTools.consult.features.2',
    ],
    screenName: 'consult',
  },
  {
    id: 'drugs',
    title: 'aiTools.drugs.title',
    description: 'aiTools.drugs.description',
    icon: Pill,
    color: colors.primary,
    bgImage: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.drugs.features.0',
      'aiTools.drugs.features.1',
      'aiTools.drugs.features.2',
    ],
    screenName: 'pharmcoedia',
  },
  {
    id: 'report',
    title: 'aiTools.report.title',
    description: 'aiTools.report.description',
    icon: ClipboardList,
    color: colors.primary,
    bgImage: 'https://images.pexels.com/photos/4226264/pexels-photo-4226264.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.report.features.0',
      'aiTools.report.features.1',
      'aiTools.report.features.2',
    ],
    screenName: 'report',
  },
  {
    id: 'pathfinder',
    title: 'aiTools.pathfinder.title',
    description: 'aiTools.pathfinder.description',
    icon: BookOpen,
    color: colors.primary,
    bgImage: 'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.pathfinder.features.0',
      'aiTools.pathfinder.features.1',
      'aiTools.pathfinder.features.2',
    ],
    screenName: 'pathFinder',
  },
];

const AITools = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [expandedTool, setExpandedTool] = useState(null);

  const handleToolPress = (tool) => {
    if (expandedTool === tool.id) {
      // Navigate to the respective screen
      navigation.navigate(tool.screenName);
    } else {
      // Expand/collapse the tool card
      setExpandedTool(expandedTool === tool.id ? null : tool.id);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderToolCard = (tool) => {
    const Icon = tool.icon;
    const isExpanded = expandedTool === tool.id;

    return (
      <TouchableOpacity
        key={tool.id}
        style={[
          styles.toolCard,
          { height: isExpanded ? hp(35) : hp(15) },
        ]}
        onPress={() => handleToolPress(tool)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: tool.bgImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Icon size={20} color="white" />
            </View>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.toolTitle}>
                {t(tool.title)}
              </Text>
              <Text variant="bodySmall" style={styles.toolDescription}>
                {t(tool.description)}
              </Text>
            </View>
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.featuresContainer}>
                {tool.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text variant="bodySmall" style={styles.featureText}>
                      {t(feature)}
                    </Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate(tool.screenName)}
                activeOpacity={0.8}
              >
                <Text variant="labelMedium" style={styles.startButtonText}>
                  {t('buttons.start')}
                </Text>
                <ArrowRight size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{flex:1,backgroundColor:colors.background}}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity> */}
        
        <View style={styles.headerTitleContainer}>
          <Text variant="headlineLarge" style={styles.headerTitle}>
            {t('aiTools.title')}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {t('aiTools.description')}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.toolsGrid}>
          {AI_TOOLS.map((tool) => renderToolCard(tool))}
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AITools;

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
    borderBottomColor: colors.outline,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: wp(4),
  },
  headerTitleContainer: {
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
  },
  scrollContent: {
    padding: wp(5),
    paddingBottom: hp(5),
  },
  toolsGrid: {
    gap: hp(2),
  },
  toolCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: hp(2),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.lightGreen,
    opacity: 0.85,
  },
  cardContent: {
    flex: 1,
    padding: wp(4),
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  titleContainer: {
    flex: 1,
  },
  toolTitle: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  expandedContent: {
    marginTop: hp(2),
  },
  featuresContainer: {
    marginBottom: hp(2),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginRight: 8,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
});