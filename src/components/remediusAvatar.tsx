/**
 * Remedius Avatar Component
 *
 * Animated avatar for empty states and AI assistant identity.
 * Subtle pulsing animation for "alive" feel without distraction.
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StyleSheet } from 'react-native';
import { REMEDIUS_AVATAR, ClinicalTheme } from '../constants/clinicalTheme';

interface RemediusAvatarProps {
  size?: number;
  pulsing?: boolean;
}

export const RemediusAvatar: React.FC<RemediusAvatarProps> = ({
  size = 60,
  pulsing = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulsing) return;

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
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [pulsing, pulseAnim]);

  return (
    <View style={[styles.container, { width: size + 20, height: size + 20 }]}>
      <Animated.View
        style={[
          styles.innerContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}>
        <Image
          source={{ uri: REMEDIUS_AVATAR }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    backgroundColor: ClinicalTheme.pure,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...ClinicalTheme.shadow.card,
  },
  avatar: {
    resizeMode: 'cover',
  },
});

export default RemediusAvatar;
