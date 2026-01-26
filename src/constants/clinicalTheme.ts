/**
 * Clinical Theme - Unified Design System
 *
 * Based on "Invisible Luxury" aesthetic from Research/Discharge screens.
 * Eliminates borders, uses surfaces and subtle shadows for depth.
 */

import { Platform } from 'react-native';

// Remedius AI Avatar
export const REMEDIUS_AVATAR = 'https://i.imgur.com/rCPznko.jpeg';

export const ClinicalTheme = {
  // ===== BACKGROUNDS =====
  pure: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceAlt: '#F3F4F6',

  // ===== TEXT HIERARCHY =====
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
  },

  // ===== BRAND COLORS =====
  brand: {
    primary: '#46B7C6',
    light: 'rgba(70, 183, 198, 0.08)',
    medium: 'rgba(70, 183, 198, 0.15)',
    dark: '#3A9AA8',
  },

  // ===== SEMANTIC COLORS =====
  semantic: {
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },

  // ===== BORDERS (Minimal Use) =====
  border: {
    light: '#F3F4F6',
    default: '#E5E7EB',
    dark: '#D1D5DB',
  },

  // ===== SHADOWS (Invisible Luxury) =====
  shadow: {
    // Subtle card elevation (ultra minimal)
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    // Floating elements (slightly more pronounced)
    floating: {
      shadowColor: '#46B7C6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    // Input bar (iMessage style)
    input: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  },

  // ===== INPUT BAR (iMessage Style) =====
  inputBar: {
    background: '#F3F4F6',
    border: '#F3F4F6',
    plusButton: {
      background: '#FFFFFF',
      icon: '#6B7280',
    },
    sendButton: {
      background: '#46B7C6',
      icon: '#FFFFFF',
    },
    input: {
      text: '#111827',
      placeholder: 'rgba(74, 69, 78, 0.5)',
    },
  },

  // ===== BADGES =====
  badge: {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },

  // ===== TYPOGRAPHY =====
  typography: {
    fontFamily: {
      ios: {
        display: 'SF Pro Display',
        text: 'SF Pro Text',
      },
      android: {
        display: 'System',
        text: 'System',
      },
    },
    get family() {
      return Platform.OS === 'ios'
        ? this.fontFamily.ios
        : this.fontFamily.android;
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },

  // ===== SPACING =====
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // ===== RADIUS =====
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },

  // ===== LAYOUT =====
  layout: {
    // Header dimensions
    headerHeight: 60,
    // Input bar
    inputBarHeight: 56,
    // Bottom tabs
    tabBarHeight: 56,
    // Avatar sizes
    avatar: {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
    },
    // Icon sizes
    icon: {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },
  },
};

export type ClinicalThemeType = typeof ClinicalTheme;
