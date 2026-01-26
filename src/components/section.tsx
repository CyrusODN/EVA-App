import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/textStyles';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  showDivider?: boolean;
  marginBottom?: number;
}

const Section: React.FC<SectionProps> = ({
  title,
  children,
  style,
  showDivider = true,
  marginBottom = 24,
}) => {
  return (
    <View style={[styles.section, { marginBottom }, style]}>
      {title && (
        <Text variant="headlineMedium" style={textStyles.sectionTitle}>
          {title}
        </Text>
      )}
      {children}
      {showDivider && <Divider style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  divider: {
    marginTop: 16,
    backgroundColor: colors.borderColor,
  },
});

export default Section;
