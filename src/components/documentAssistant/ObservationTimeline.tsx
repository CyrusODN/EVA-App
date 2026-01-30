import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image as RNImage,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { AlignJustify, Monitor, File } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import type { Observation } from './types';

const CHATBOT_AVATAR = 'https://i.imgur.com/rCPznko.jpeg';

// Pulsing AI Logo for empty state
const PulsingAILogo: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      <Animated.View style={[styles.aiLogoInner, { transform: [{ scale: pulseAnim }] }]}>
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
}

const ObservationTimeline: React.FC<ObservationTimelineProps> = ({
  items,
  emptyState,
  primaryColor,
  scrollViewRef,
  statusTexts,
}) => {
  const renderTimelineItem = (item: Observation) => {
    const isImage = item.type === 'image';
    const isFile = item.type === 'file';

    return (
      <View key={item.id} style={styles.streamItemContainer}>
        {/* Left Icon */}
        <View style={styles.streamIconContainer}>
          {item.type === 'text' && <AlignJustify size={20} color={colors.onSurfaceVariant} />}
          {item.type === 'image' && <Monitor size={20} color={primaryColor} />}
          {item.type === 'file' && <File size={20} color={colors.primary} />}
        </View>

        {/* Content */}
        <View style={styles.streamContentContainer}>
          {item.type === 'text' && (
            <Text style={styles.streamText} numberOfLines={3} ellipsizeMode="tail">
              {item.content}
            </Text>
          )}

          {isImage && (
            <View>
              <View style={styles.thumbnailWrapper}>
                {item.uri ? (
                  <RNImage source={{ uri: item.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbnailImage, { backgroundColor: '#F0F0F0' }]} />
                )}
                {item.status === 'processing' && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator color="white" size="small" />
                  </View>
                )}
              </View>
              <Text style={styles.statusText}>
                {item.status === 'processing'
                  ? statusTexts.analyzingPixelData
                  : 'Monitor Screen • Captured'}
              </Text>
            </View>
          )}

          {isFile && (
            <View>
              <View style={styles.fileCard}>
                <File size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
              </View>
              <Text style={styles.statusText}>
                {item.status === 'processing'
                  ? statusTexts.analyzingDocument
                  : 'Document • Processed'}
              </Text>
            </View>
          )}
        </View>

        {/* Time */}
        <Text style={styles.streamTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
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
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <PulsingAILogo />
          <Text style={styles.emptyTitle}>{emptyState.title}</Text>
          <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
        </View>
      ) : (
        items.map(renderTimelineItem)
      )}
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
    marginTop: hp(15),
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: colors.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
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
    color: '#333333',
    lineHeight: 22,
  },
  streamTime: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  thumbnailWrapper: {
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  statusText: {
    fontSize: 11,
    color: '#8E8E93',
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
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 4,
    alignSelf: 'flex-start',
    gap: 8,
  },
  fileName: {
    fontSize: 13,
    color: '#333',
    maxWidth: wp(50),
  },
});