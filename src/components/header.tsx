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
  textColor = colors.onSecondary,
  backgroundColor = colors.surface,
  showSubtitle = true,
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
        {/* Left Icon */}
        {leftIcon && (
          <TouchableOpacity onPress={onLeftPress} style={styles.leftButton}>
            <ChevronLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}

        {/* Title Container */}
        <View style={styles.headerTitleContainer}>
          {showIcon && Icon && (
            <View style={styles.headerIconContainer}>
              <Icon size={20} color="white" />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text
              variant="headlineLarge"
              style={[textStyles.headlineLarge, { color: textColor }]}>
              {title}
            </Text>
            {showSubtitle && subtitle && (
              <Text variant="bodySmall" style={styles.subtitle}>
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
    backgroundColor: colors.primary,
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
    color: colors.onSurfaceVariant,
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
