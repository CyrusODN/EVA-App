/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  Image,
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
  FileText,
  ClipboardList,
  GraduationCap,
  ListChecks,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { images } from '../../constants/images';
import { textStyles } from '../../constants/textStyles';

const AI_TOOLS = [
  {
    id: 'discharge',
    title: 'aiTools.discharge.title',
    description: 'aiTools.discharge.description',
    icon: FileText,
    screenName: 'discharge',
  },
  // NOTE: Temporarily hidden from AI Tools Suite — do not remove.
  // {
  //   id: 'prescreening',
  //   title: 'aiTools.prescreening.title',
  //   description: 'aiTools.prescreening.description',
  //   icon: ListChecks,
  //   screenName: 'prescreening',
  // },
  {
    id: 'research',
    title: 'aiTools.research.title',
    description: 'aiTools.research.description',
    icon: GraduationCap,
    screenName: 'research',
  },
  {
    id: 'consult',
    title: 'aiTools.consult.title',
    description: 'aiTools.consult.description',
    icon: Brain,
    screenName: 'consult',
  },
  {
    id: 'report',
    title: 'aiTools.report.title',
    description: 'aiTools.report.description',
    icon: ClipboardList,
    screenName: 'report',
  },
  // NOTE: Temporarily hidden from AI Tools Suite — do not remove.
  // {
  //   id: 'pathfinder',
  //   title: 'aiTools.pathfinder.title',
  //   description: 'aiTools.pathfinder.description',
  //   icon: BookOpen,
  //   screenName: 'pathFinder',
  // },
];

const AITools = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const renderToolItem = ({ item }: { item: (typeof AI_TOOLS)[0] }) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        style={styles.toolItem}
        onPress={() => navigation.navigate(item.screenName as never)}
        activeOpacity={0.7}>
        <View style={styles.toolRow}>
          <View style={styles.iconContainer}>
            <Icon size={24} color={colors.primary} strokeWidth={2} />
          </View>

          <View style={styles.textContainer}>
            <Text variant="titleMedium" style={styles.toolTitle}>
              {t(item.title)}
            </Text>
            <Text
              variant="bodySmall"
              style={styles.toolDescription}
              numberOfLines={1}>
              {t(item.description)}
            </Text>
          </View>

          <ChevronRight size={20} color="#C7C7CC" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={images.logo}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerSeparator} />
            <Text variant="headlineLarge" style={styles.aiToolsTitle}>
              {t('aiTools.title')}
            </Text>
          </View>
        </View>
        <View style={styles.headerDivider} />

        {/* Tools List */}
        <FlatList
          data={AI_TOOLS}
          renderItem={renderToolItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
};

export default AITools;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
    backgroundColor: '#F8FAFC',
    marginBottom: 0,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: wp(5),
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D1D6',
    marginHorizontal: wp(3.5),
  },
  logo: {
    width: wp(40),
    height: hp(4.5),
  },
  aiToolsTitle: {
    color: '#3C3C43',
    fontSize: 20,
    lineHeight: 25,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'System',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  listContent: {
    paddingBottom: hp(12), // Increased padding for bottom tab bar
    paddingTop: 8,
  },
  toolItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: wp(4),
    marginHorizontal: wp(4),
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(70, 183, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  textContainer: {
    flex: 1,
    marginRight: wp(2),
  },
  toolTitle: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  toolDescription: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    lineHeight: 18,
  },
});
