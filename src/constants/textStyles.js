import { Platform, StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Common text styles for use throughout the app
 * These styles can be combined with react-native-paper Text component variants
 */
export const textStyles = StyleSheet.create({
  // Headline Styles
  headlineMedium: {
    color: 'black',
    fontSize: 18,
    lineHeight: 22,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  headlineMediumBlack: {
    color: 'black',
    fontSize: 18,
    lineHeight: 22,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  headlineLarge: {
    color: colors.onSecondary,
    fontSize: 22,
    lineHeight: 28,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
  },
  headlineSmall: {
    color: 'black',
    fontSize: 14,
    lineHeight: 18,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },

  // Section Title Styles
  sectionTitle: {
    color: 'black',
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 16,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  sectionTitleWithMargin: {
    color: 'black',
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 16,
    marginTop: 8,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },

  // Button Text Styles
  buttonText: {
    color: 'white',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
  },
  buttonTextWhite: {
    color: 'white',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
  },
  buttonTextPrimary: {
    color: colors.primary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
  },
  buttonTextBlack: {
    color: 'black',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
  },
  buttonTextLabelLarge: {
    color: 'white',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
    letterSpacing: 0.1,
  },

  // Title Styles
  titleMedium: {
    color: colors.darkPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  titleMediumBlack: {
    color: 'black',
    fontSize: 16,
    lineHeight: 24,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },

  // Label Styles
  labelLarge: {
    color: 'white',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
    marginLeft: 0,
  },
  labelLargeWhite: {
    color: 'white',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
  },
  labelLargeBlack: {
    color: 'black',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Medium' : 'SFProDisplay-Medium',
  },
});

