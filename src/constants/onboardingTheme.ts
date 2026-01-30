import { Platform, StyleSheet } from 'react-native';
import useThemeStore from '../store/themeStore';

// Premium Design System inspired by Things 3, Cron, Superhuman, Linear
// "Invisible luxury" - every pixel matters

// Light theme colors
export const ONBOARDING_COLORS_LIGHT = {
  // Brand Accent
  primary: '#46B7C6',
  primaryLight: '#E0F4F7',
  primarySubtle: 'rgba(70, 183, 198, 0.08)',

  // Neutrals (Linear-inspired)
  pureWhite: '#FFFFFF',
  background: '#FAFBFC',
  surface: '#F4F5F7',
  borderLight: '#E8EAED',
  border: '#D1D5DB',

  // Text hierarchy
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Dark theme colors
export const ONBOARDING_COLORS_DARK = {
  // Brand Accent
  primary: '#46B7C6',
  primaryLight: 'rgba(70, 183, 198, 0.25)',
  primarySubtle: 'rgba(70, 183, 198, 0.15)',
  
  // Neutrals (Dark mode - Deep Obsidian)
  pureWhite: '#FAFAFA',
  background: '#0A0E12',
  surface: '#141922',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.12)',
  
  // Text hierarchy
  textPrimary: '#FAFAFA',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textDisabled: '#475569',
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// Hook to get current theme colors
export const useOnboardingTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  return {
    colors: isDark ? ONBOARDING_COLORS_DARK : ONBOARDING_COLORS_LIGHT,
    isDark,
  };
};

// Legacy export for backward compatibility (use light theme as default)
export const ONBOARDING_COLORS = ONBOARDING_COLORS_LIGHT;

export const ONBOARDING_SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const ONBOARDING_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const ONBOARDING_FONTS = {
  display: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  text: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
};

export const ONBOARDING_TYPOGRAPHY = StyleSheet.create({
  display: {
    fontFamily: ONBOARDING_FONTS.display,
    fontWeight: '600',
    fontSize: 32,
    letterSpacing: -0.8,
  },
  headline: {
    fontFamily: ONBOARDING_FONTS.display,
    fontWeight: '600',
    fontSize: 24,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: ONBOARDING_FONTS.text,
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: ONBOARDING_FONTS.text,
    fontWeight: '400',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  caption: {
    fontFamily: ONBOARDING_FONTS.text,
    fontWeight: '400',
    fontSize: 13,
    letterSpacing: 0,
  },
  overline: {
    fontFamily: ONBOARDING_FONTS.text,
    fontWeight: '500',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
});

export const ONBOARDING_SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Dark mode shadows
export const ONBOARDING_SHADOWS_DARK = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#46B7C6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
};

// Spring configs for react-native-reanimated
export const SPRINGS = {
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  gentle: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.6,
  },
};

export const DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
};
