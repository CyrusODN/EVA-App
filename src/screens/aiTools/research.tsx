import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
  Image,
  Platform,
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
import { LinearGradientColors } from '../../constants/linearGradientColors';

interface ResearchToolCardProps {
  tool: {
    id: string;
    titleKey: string;
    descriptionKey: string;
    icon: any;
    color: string;
    bgImage: string;
    featureKeys: string[];
    screenName: string;
  };
  index: number;
  isExpanded: boolean;
  onPress: () => void;
  onNavigate: () => void;
  t: (key: string) => string;
}

const ResearchToolCard: React.FC<ResearchToolCardProps> = ({
  tool,
  index,
  isExpanded,
  onPress,
  onNavigate,
  t,
}) => {
  const Icon = tool.icon;
  const animatedHeight = React.useRef(new Animated.Value(hp(15))).current;
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Stop any ongoing animations
    animatedHeight.stopAnimation();
    animatedOpacity.stopAnimation();

    // Start new animation
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? hp(35) : hp(15),
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  return (
    <Animated.View
      style={[
        styles.toolCard,
        styles.animatedCard,
        { height: animatedHeight },
        index > 0 && styles.cardSpacing,
      ]}
    >
      <Pressable onPress={onPress} style={styles.overlay}>
        <Image
          source={{ uri: tool.bgImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={LinearGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.overlay}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeaderTouchable}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Icon size={22} color="white" />
                </View>
                <View style={styles.titleContainer}>
                  <Text
                    variant="titleMedium"
                    style={styles.toolTitle}
                    numberOfLines={isExpanded ? undefined : 1}
                  >
                    {t(tool.titleKey)}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={styles.toolDescription}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {t(tool.descriptionKey)}
                  </Text>
                </View>
              </View>
            </View>

            <Animated.View
              style={[
                styles.expandedContent,
                {
                  opacity: animatedOpacity,
                },
              ]}
              pointerEvents={isExpanded ? 'auto' : 'none'}
            >
              <View style={styles.featuresContainer}>
                {tool.featureKeys.map((featureKey, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text variant="bodySmall" style={styles.featureText}>
                      {t(featureKey)}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={onNavigate}
                activeOpacity={0.8}
              >
                <Text variant="labelMedium" style={styles.startButtonText}>
                  {t('remediusResearch.main.startExploring')}
                </Text>
                <ArrowRight size={18} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// Research tools data with translation keys
const RESEARCH_TOOLS_DATA = [
  {
    id: 'scholar',
    titleKey: 'remediusResearch.main.scholar.title',
    descriptionKey: 'remediusResearch.main.scholar.description',
    icon: GraduationCap,
    color: colors.lightGreen,
    bgImage:
      'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
    bgImage:
      'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
    bgImage:
      'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleToolPress = (tool: (typeof RESEARCH_TOOLS_DATA)[0]) => {
    // Toggle expansion: if already expanded, close it; otherwise expand it
    setExpandedTool(expandedTool === tool.id ? null : tool.id);
  };

  const handleStartExploring = (tool: (typeof RESEARCH_TOOLS_DATA)[0]) => {
    // navigation.navigate(tool.screenName);
    console.log(`Start exploring ${tool.screenName}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
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
            {RESEARCH_TOOLS_DATA.map((tool, index) => (
              <ResearchToolCard
                key={tool.id}
                tool={tool}
                index={index}
                isExpanded={expandedTool === tool.id}
                onPress={() => handleToolPress(tool)}
                onNavigate={() => handleStartExploring(tool)}
                t={t}
              />
            ))}
          </View>

          {/* Additional Information */}
          <View style={[styles.infoContainer, { marginTop: hp(2) }]}>
            <Text variant="titleMedium" style={styles.infoTitle}>
              Advanced Research Tools
            </Text>
            <Text variant="bodyMedium" style={styles.infoDescription}>
              Our comprehensive research suite provides everything you need for
              medical research, from literature analysis to protocol management.
              Each tool is designed to enhance your research workflow and
              improve outcomes.
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
    padding: wp(5),
    paddingBottom: hp(5),
  },
  toolsContainer: {
    gap: 0,
    marginBottom: hp(1),
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolCard: {
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  animatedCard: {
    overflow: 'hidden',
  },
  cardSpacing: {
    marginTop: hp(1.5),
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
    backgroundColor: colors.primary,
    opacity: 0.88,
  },
  cardContent: {
    padding: wp(5),
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeaderTouchable: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleContainer: {
    flex: 1,
  },
  toolTitle: {
    color: 'white',
    fontWeight: '700',
    marginBottom: hp(0.5),
    fontSize: hp(1.9),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  toolDescription: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: hp(1.5),
    lineHeight: hp(2.1),
  },
  expandedContent: {
    marginTop: hp(2.5),
    alignSelf: 'flex-end',
    width: '100%',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: wp(2.5),
    marginTop: hp(0.8),
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.95)',
    flex: 1,
    fontSize: hp(1.6),
    lineHeight: hp(2.2),
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(5),
    borderRadius: 12,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: hp(1),
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: wp(2),
    fontSize: hp(1.8),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProText-Semibold' : 'SFProText-Semibold',
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
