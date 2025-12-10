import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { colors } from '../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  borderRadius?: number;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
  elevation?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = wp(4),
  borderRadius = 12,
  backgroundColor = colors.surface,
  borderWidth = 0,
  borderColor = colors.borderColor,
  shadow = true,
  elevation: customElevation = 2,
}) => {
  const cardStyle: ViewStyle = {
    padding,
    borderRadius,
    backgroundColor,
    borderWidth,
    borderColor,
  };

  if (shadow) {
    cardStyle.shadowColor = '#000';
    cardStyle.shadowOffset = {
      width: 0,
      height: 1,
    };
    cardStyle.shadowOpacity = 0.1;
    cardStyle.shadowRadius = 2;
    cardStyle.elevation = customElevation;
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

export default Card;

