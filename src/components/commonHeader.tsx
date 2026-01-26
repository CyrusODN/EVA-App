import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { ChevronLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/textStyles';
import { LinearGradientColors } from '../constants/linearGradientColors';

interface CommonHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress: () => void;
  icon?: React.ComponentType<any>;
  showIcon?: boolean;
  backgroundColor?: string;
  showBorder?: boolean;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  icon: Icon,
  showIcon = false,
  backgroundColor = colors.surface,
  showBorder = true,
}) => {
  return (
    <View
      style={[
        styles.headerContainer,
        { backgroundColor },
        !showBorder && styles.noBorder,
      ]}>
      <View style={styles.headerContent}>
        {/* Back Button */}
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>

        {/* Title Container */}
        <View style={styles.headerTitleContainer}>
          {showIcon && Icon && (
            <LinearGradient
              colors={LinearGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerIconContainer}>
              <Icon size={20} color="white" />
            </LinearGradient>
          )}
          <View style={styles.headerTextContainer}>
            <Text variant="headlineLarge" style={textStyles.headlineLarge}>
              {title}
            </Text>
            {subtitle && (
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: wp(100),
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    borderRadius: 8,
    marginRight: wp(2),
    padding: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
    alignSelf: 'flex-start',
    marginTop: hp(0.75),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
});

export default CommonHeader;
