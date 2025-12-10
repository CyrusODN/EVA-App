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
import { colors } from '../constants/colors';
import { textStyles } from '../constants/textStyles';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onLeftPress: () => void;
  onRightPress?: () => void;
  rightIcon?: boolean;
  leftIcon?: React.ComponentType<any> | ImageSourcePropType;
  rightIconSource?: React.ComponentType<any> | ImageSourcePropType;
  textColor?: string;
  backgroundColor?: string;
  showSubtitle?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onLeftPress,
  onRightPress,
  rightIcon = false,
  leftIcon = true,
  rightIconSource = 'bell',
  textColor = colors.lightGreen,
  backgroundColor = colors.surface,
  showSubtitle = true,
}) => {
  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      <View style={styles.headerContent}>
        {/* Left Icon */}
        {leftIcon && (
          <TouchableOpacity onPress={onLeftPress} style={styles.leftButton}>
            <ChevronLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}

        {/* Title and Subtitle */}
        <View style={styles.titleContainer}>
          <Text
            variant="headlineMedium"
            style={[textStyles.headlineMedium, styles.title, { color: textColor }]}
          >
            {title}
          </Text>
          {showSubtitle && subtitle && (
            <Text variant="bodySmall" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
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
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  headerContent: {
    width: wp(90),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
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
  title: {
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
    textAlign: 'left',
  },
  subtitle: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginTop: 2,
    textAlign: 'left',
  },
  iconImage: {
    width: 24,
    height: 24,
  },
});

export default Header;
