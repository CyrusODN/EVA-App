import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image as RNImage,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { AlignJustify, Monitor, File, Trash2 } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import type { Observation } from './types';

const CHATBOT_AVATAR = 'https://i.imgur.com/rCPznko.jpeg';

// Pulsing AI Logo for empty state
const PulsingAILogo: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { colors: themeColors, isDark } = useTheme();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, []);

  return (
    <View style={styles.aiLogoContainer}>
      <Animated.View 
        style={[
          styles.aiLogoInner, 
          { 
            backgroundColor: isDark ? themeColors.layer1 : '#FFFFFF',
            transform: [{ scale: pulseAnim }],
            shadowColor: isDark ? themeColors.textPrimary : '#000', 
            shadowOpacity: isDark ? 0.2 : 0.1
          }
        ]}
      >
        <RNImage 
          source={{ uri: CHATBOT_AVATAR }} 
          style={styles.avatarImage}
        />
      </Animated.View>
    </View>
  );
};

interface ObservationTimelineProps {
  items: Observation[];
  emptyState: {
    title: string;
    subtitle: string;
  };
  primaryColor: string;
  scrollViewRef: React.RefObject<ScrollView>;
  statusTexts: {
    analyzingPixelData: string;
    analyzingDocument: string;
  };
  onDelete?: (id: string) => void;
  HeaderComponent?: React.ReactNode;
  FooterComponent?: React.ReactNode;
}

const ObservationTimeline: React.FC<ObservationTimelineProps> = ({
  items,
  emptyState,
  primaryColor,
  scrollViewRef,
  statusTexts,
  onDelete,
  HeaderComponent,
  FooterComponent,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  // Dynamic Theme Colors
  const DYNAMIC_THEME = {
    text: isDark ? themeColors.textPrimary : '#333333',
    textSecondary: isDark ? themeColors.textSecondary : '#8E8E93',
    iconDefault: isDark ? themeColors.textSecondary : colors.onSurfaceVariant,
    thumbnailBg: isDark ? themeColors.layer2 : '#F2F2F7',
    thumbnailBorder: isDark ? themeColors.borderSubtle : '#E5E5EA',
    fileCardBg: isDark ? themeColors.layer1 : '#F9FAFB',
    fileCardBorder: isDark ? themeColors.borderSubtle : '#F0F0F0',
    fileCardText: isDark ? themeColors.textPrimary : '#333',
  };

  const renderTimelineItem = (item: Observation) => {
    const isImage = item.type === 'image';
    const isFile = item.type === 'file';

    return (
      <View key={item.id} style={styles.streamItemContainer}>
        {/* Left Icon */}
        <View style={styles.streamIconContainer}>
          {item.type === 'text' && <AlignJustify size={20} color={DYNAMIC_THEME.iconDefault} />}
          {item.type === 'image' && <Monitor size={20} color={primaryColor} />}
          {item.type === 'file' && <File size={20} color={primaryColor} />}
        </View>

        {/* Content */}
        <View style={styles.streamContentContainer}>
          {item.type === 'text' && (
            <Text style={[styles.streamText, { color: DYNAMIC_THEME.text }]} numberOfLines={3} ellipsizeMode="tail">
              {item.content}
            </Text>
          )}

          {isImage && (
            <View>
              <View style={[styles.thumbnailWrapper, { backgroundColor: DYNAMIC_THEME.thumbnailBg, borderColor: DYNAMIC_THEME.thumbnailBorder }]}>
                {item.uri ? (
                  <RNImage source={{ uri: item.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbnailImage, { backgroundColor: DYNAMIC_THEME.thumbnailBg }]} />
                )}
                {item.status === 'processing' && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator color="white" size="small" />
                  </View>
                )}
              </View>
              <Text style={[styles.statusText, { color: DYNAMIC_THEME.textSecondary }]}>
                {item.status === 'processing'
                  ? statusTexts.analyzingPixelData
                  : 'Monitor Screen • Captured'}
              </Text>
            </View>
          )}

          {isFile && (
            <View>
              <View style={[styles.fileCard, { backgroundColor: DYNAMIC_THEME.fileCardBg, borderColor: DYNAMIC_THEME.fileCardBorder }]}>
                <File size={16} color={DYNAMIC_THEME.iconDefault} />
                <Text style={[styles.fileName, { color: DYNAMIC_THEME.fileCardText }]} numberOfLines={1}>{item.fileName}</Text>
              </View>
              <Text style={[styles.statusText, { color: DYNAMIC_THEME.textSecondary }]}>
                {item.status === 'processing'
                  ? statusTexts.analyzingDocument
                  : 'Document • Processed'}
              </Text>
            </View>
          )}
        </View>

        {/* Time & Delete */}
        <View style={styles.rightContainer}>
          <Text style={[styles.streamTime, { color: DYNAMIC_THEME.textSecondary }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {onDelete && (
            <TouchableOpacity 
              onPress={() => onDelete(item.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color={isDark ? themeColors.error : '#FF3B30'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.streamContainer}
      contentContainerStyle={styles.streamContent}
      showsVerticalScrollIndicator={false}
    >
      {HeaderComponent}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <PulsingAILogo />
          <Text style={[styles.emptyTitle, { color: DYNAMIC_THEME.text }]}>{emptyState.title}</Text>
          <Text style={[styles.emptySubtitle, { color: DYNAMIC_THEME.textSecondary }]}>{emptyState.subtitle}</Text>
        </View>
      ) : (
        items.map(renderTimelineItem)
      )}
      {FooterComponent}
      <View style={{ height: hp(10) }} />
    </ScrollView>
  );
};

export default ObservationTimeline;

const styles = StyleSheet.create({
  streamContainer: {
    flex: 1,
  },
  streamContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  emptyState: {
    marginTop: hp(4),
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  aiLogoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  aiLogoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Stream Items
  streamItemContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  streamIconContainer: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 2,
  },
  streamContentContainer: {
    flex: 1,
    marginRight: 8,
  },
  streamText: {
    fontSize: 15,
    lineHeight: 22,
  },
  streamTime: {
    fontSize: 11,
  },
  rightContainer: {
    alignItems: 'flex-end',
    minHeight: 40,
  },
  deleteButton: {
    marginTop: 8,
  },
  thumbnailWrapper: {
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    alignSelf: 'flex-start',
    gap: 8,
  },
  fileName: {
    fontSize: 13,
    maxWidth: wp(50),
  },
});