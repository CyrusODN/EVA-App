import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
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
  ChevronLeft,
  GraduationCap,
  Microscope,
  Brain,
  ArrowRight,
  X,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

// Research tools data with translation keys
const RESEARCH_TOOLS_DATA = [
  {
    id: 'scholar',
    titleKey: 'remediusResearch.main.scholar.title',
    descriptionKey: 'remediusResearch.main.scholar.description',
    icon: GraduationCap,
    color: colors.lightGreen,
    bgImage: 'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    featureKeys: [
      'remediusResearch.main.scholar.features.0',
      'remediusResearch.main.scholar.features.1',
      'remediusResearch.main.scholar.features.2',
      'remediusResearch.main.scholar.features.3',
    ],
    screenName: 'ScholarScreen',
  },
  {
    id: 'protocol',
    titleKey: 'remediusResearch.main.protocol.title',
    descriptionKey: 'remediusResearch.main.protocol.description',
    icon: Microscope,
    color: colors.lightGreen,
    bgImage: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    featureKeys: [
      'remediusResearch.main.protocol.features.0',
      'remediusResearch.main.protocol.features.1',
      'remediusResearch.main.protocol.features.2',
      'remediusResearch.main.protocol.features.3',
    ],
    screenName: 'ProtocolScreen',
  },
  {
    id: 'pro',
    titleKey: 'remediusResearch.main.pro.title',
    descriptionKey: 'remediusResearch.main.pro.description',
    icon: Brain,
    color: colors.lightGreen,
    bgImage: 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    featureKeys: [
      'remediusResearch.main.pro.features.0',
      'remediusResearch.main.pro.features.1',
      'remediusResearch.main.pro.features.2',
      'remediusResearch.main.pro.features.3',
    ],
    screenName: 'ProtocolProScreen',
  },
];

const Research = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [expandedTool, setExpandedTool] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleToolPress = (tool) => {
    if (expandedTool === tool.id) {
      // Navigate to the respective screen
      // For now, we'll just show an alert since these screens aren't implemented
      // navigation.navigate(tool.screenName);
      console.log(`Navigate to ${tool.screenName}`);
    } else {
      // Expand/collapse the tool card
      setExpandedTool(expandedTool === tool.id ? null : tool.id);
    }
  };

  const handleStartExploring = (tool) => {
    // navigation.navigate(tool.screenName);
    console.log(`Start exploring ${tool.screenName}`);
  };

  const renderToolCard = (tool) => {
    const Icon = tool.icon;
    const isExpanded = expandedTool === tool.id;

    return (
      <TouchableOpacity
        key={tool.id}
        style={[
          styles.toolCard,
          { height: isExpanded ? hp(45) : hp(20) },
        ]}
        onPress={() => handleToolPress(tool)}
        activeOpacity={0.8}
      >
        {/* Background Image with Overlay */}
        <View style={styles.backgroundImageContainer}>
          <View style={styles.backgroundOverlay} />
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Icon size={24} color="white" />
            </View>
            <View style={styles.titleContainer}>
              <Text variant="titleLarge" style={styles.toolTitle}>
                {t(tool.titleKey)}
              </Text>
              <Text variant="bodyMedium" style={styles.toolDescription}>
                {t(tool.descriptionKey)}
              </Text>
            </View>
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.featuresContainer}>
                {tool.featureKeys.map((featureKey, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text variant="bodyMedium" style={styles.featureText}>
                      {t(featureKey)}
                    </Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleStartExploring(tool)}
                activeOpacity={0.8}
              >
                <Text variant="labelLarge" style={styles.startButtonText}>
                  {t('remediusResearch.main.startExploring')}
                </Text>
                <ArrowRight size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
            <GraduationCap size={20} color="white" />
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineLarge" style={styles.headerTitle}>
              {t('remediusResearch.main.title')}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {t('remediusResearch.main.subtitle')}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
          <X size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.toolsContainer}>
          {RESEARCH_TOOLS_DATA.map((tool) => renderToolCard(tool))}
        </View>
        
        {/* Additional Information */}
        <View style={styles.infoContainer}>
          <Text variant="titleMedium" style={styles.infoTitle}>
            Advanced Research Tools
          </Text>
          <Text variant="bodyMedium" style={styles.infoDescription}>
            Our comprehensive research suite provides everything you need for medical research, 
            from literature analysis to protocol management. Each tool is designed to enhance 
            your research workflow and improve outcomes.
          </Text>
        </View>
      </ScrollView>
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
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(5),
  },
  toolsContainer: {
    gap: hp(3),
    marginBottom: hp(4),
  },
  toolCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: hp(1),
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.lightGreen,
    opacity: 0.9,
  },
  cardContent: {
    flex: 1,
    padding: wp(5),
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
  },
  toolTitle: {
    color: 'white',
    fontWeight: '700',
    marginBottom: 6,
  },
  toolDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  expandedContent: {
    marginTop: hp(3),
  },
  featuresContainer: {
    marginBottom: hp(3),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 12,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.95)',
    flex: 1,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: wp(5),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  infoTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoDescription: {
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
});

export default Research;