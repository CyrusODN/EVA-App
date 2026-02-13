import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { ChevronLeft, Bell } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/textStyles';
import { LinearGradientColors } from '../constants/linearGradientColors';
import { useTheme } from '../constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onLeftPress: () => void;
  onRightPress?: () => void;
  rightIcon?: boolean;
  leftIcon?: boolean | React.ComponentType<any> | ImageSourcePropType;
  rightIconSource?: React.ComponentType<any> | ImageSourcePropType;
  icon?: React.ComponentType<any>;
  showIcon?: boolean;
  textColor?: string;
  backgroundColor?: string;
  showSubtitle?: boolean;
  showBorder?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onLeftPress,
  onRightPress,
  rightIcon = false,
  leftIcon = true,
  rightIconSource = 'bell',
  icon: Icon,
  showIcon = false,
  textColor,
  backgroundColor,
  showSubtitle = true,
  showBorder = true,
}) => {
  const { colors: themeColors, isDark } = useTheme();

  // Use props if provided, otherwise use theme colors
  const finalTextColor =
    textColor || (isDark ? themeColors.textPrimary : colors.onSecondary);
  const finalBackgroundColor =
    backgroundColor || (isDark ? themeColors.layer2 : colors.surface);
  const finalBorderColor = isDark
    ? themeColors.borderNormal
    : colors.borderColor;
  const finalSubtitleColor = isDark
    ? themeColors.textSecondary
    : colors.onSurfaceVariant;
  const finalIconColor = isDark ? themeColors.textPrimary : colors.onSurface;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: finalBackgroundColor,
          borderBottomColor: finalBorderColor,
        },
        !showBorder && styles.noBorder,
      ]}>
      <View style={styles.headerContent}>
        {/* Left Icon */}
        {leftIcon && (
          <TouchableOpacity onPress={onLeftPress} style={styles.leftButton}>
            <ChevronLeft size={24} color={finalIconColor} />
          </TouchableOpacity>
        )}

        {/* Title Container */}
        <View style={styles.headerTitleContainer}>
          {showIcon && Icon && (
            <View
              style={[
                styles.headerIconContainer,
                { backgroundColor: themeColors.accentPrimary },
              ]}>
              <Icon size={20} color="white" />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text
              variant="headlineLarge"
              style={[textStyles.headlineLarge, { color: finalTextColor }]}>
              {title}
            </Text>
            {showSubtitle && subtitle && (
              <Text
                variant="bodySmall"
                style={[styles.subtitle, { color: finalSubtitleColor }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Icon */}
        <View style={styles.rightContainer}>
          {rightIcon && onRightPress && (
            <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
              <Image
                source={rightIconSource as ImageSourcePropType}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: wp(100),
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftButton: {
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
    alignSelf: 'flex-start',
    marginTop: hp(0.75),
  },
  headerTextContainer: {
    flex: 1,
  },
  rightContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
});

export default Header;
