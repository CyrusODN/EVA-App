/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import {
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
import LinearGradient from 'react-native-linear-gradient';
import { LinearGradientColors } from '../../constants/linearGradientColors';

interface ToolCardProps {
  tool: {
    id: string;
    title: string;
    description: string;
    icon: any;
    bgImage: string;
    features: string[];
    screenName: string;
  };
  index: number;
  isExpanded: boolean;
  onPress: () => void;
  onNavigate: () => void;
  t: (key: string) => string;
}

const AI_TOOLS = [
  {
    id: 'discharge',
    title: 'aiTools.discharge.title',
    description: 'aiTools.discharge.description',
    icon: Stethoscope,
    color: colors.primary,
    bgImage:
      'https://images.pexels.com/photos/3846005/pexels-photo-3846005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
    bgImage:
      'https://images.pexels.com/photos/4226264/pexels-photo-4226264.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
    bgImage:
      'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
    bgImage:
      'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.consult.features.0',
      'aiTools.consult.features.1',
      'aiTools.consult.features.2',
    ],
    screenName: 'consult',
  },
  {
    id: 'report',
    title: 'aiTools.report.title',
    description: 'aiTools.report.description',
    icon: ClipboardList,
    color: colors.primary,
    bgImage:
      'https://images.pexels.com/photos/4226264/pexels-photo-4226264.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
    bgImage:
      'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    features: [
      'aiTools.pathfinder.features.0',
      'aiTools.pathfinder.features.1',
      'aiTools.pathfinder.features.2',
    ],
    screenName: 'pathFinder',
  },
];

const ToolCard: React.FC<ToolCardProps> = ({
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
        { height: animatedHeight, overflow: 'hidden' },
        index > 0 && { marginTop: hp(1.5) },
      ]}
    >
      <Pressable onPress={onPress} style={styles.overlay}>
        <Image
          source={{ uri: tool.bgImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* <View style={styles.overlay} /> */}

        <LinearGradient
          colors={LinearGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.overlay}
        >
          <View style={styles.cardContent}>
            <View
              // activeOpacity={0.9}
              style={styles.cardHeaderTouchable}
            >
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
                    {t(tool.title)}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={styles.toolDescription}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {t(tool.description)}
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
                {tool.features.map((feature: string, featureIndex: number) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text variant="bodySmall" style={styles.featureText}>
                      {t(feature)}
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
                  {t('buttons.start')}
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

const AITools = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const handleToolPress = (tool: (typeof AI_TOOLS)[0]) => {
    // Toggle expansion: if already expanded, close it; otherwise expand it
    setExpandedTool(expandedTool === tool.id ? null : tool.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
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
            {AI_TOOLS.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                index={index}
                isExpanded={expandedTool === tool.id}
                onPress={() => handleToolPress(tool)}
                onNavigate={() => navigation.navigate(tool.screenName as never)}
                t={t}
              />
            ))}
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    color: colors.primary,
    fontWeight: '600',
    fontSize: hp(2.4),
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  headerSubtitle: {
    color: '#808080',
    marginTop: hp(0.5),
    fontSize: hp(1.6),
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: wp(5),
  },
  toolsGrid: {
    gap: 0,
  },
  toolCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
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
});
