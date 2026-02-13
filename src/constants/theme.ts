import useThemeStore from '../store/themeStore';

// Deep Obsidian Mode (Dark)
export const darkTheme = {
  // Backgrounds
  canvas: '#0D0D0D', // Main background
  layer1: 'rgba(250,250,250,0.03)', // 3% white - subtle layer
  layer2: 'rgba(250,250,250,0.05)', // 5% white - card backgrounds
  layer3: 'rgba(255,255,255,0.10)', // 10% white - hover states

  // Text
  textPrimary: '#FAFAFA', // Main text (white)
  textSecondary: '#A6A6A6', // Secondary text (gray)
  textMuted: 'rgba(166,166,166,0.6)', // Disabled/muted

  // Borders
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderNormal: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.20)',

  // Accents
  accentPrimary: '#46B7C6', // Neon Cyan
  accentGradientStart: '#3D97C5',
  accentGradientEnd: '#35ABC7',

  // Shadows (Simulated for React Native)
  shadowColor: '#46B7C6',
  shadowOpacity: 0.15,

  // Specifics
  inputBackground: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.10)',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

// Clinical Light Mode
export const lightTheme = {
  // Backgrounds
  canvas: '#FFFFFF', // Pure white or #F0F4F8 soft gray-blue
  layer1: 'rgba(255,255,255,0.7)',
  layer2: '#FFFFFF',
  layer3: '#F7F9FB',

  // Text
  textPrimary: '#1A202C', // Dark gray (almost black)
  textSecondary: '#718096', // Medium gray
  textMuted: 'rgba(113,128,150,0.6)',

  // Borders
  borderSubtle: 'rgba(0,0,0,0.06)',
  borderNormal: '#F0F0F0',
  borderStrong: 'rgba(0,0,0,0.20)',

  // Accents
  accentPrimary: '#46B7C6', // Clinical Turquoise (Original Brand Color)
  accentGradientStart: '#46B7C6',
  accentGradientEnd: '#35ABC7',

  // Shadows
  shadowColor: '#000000',
  shadowOpacity: 0.05,

  // Specifics
  inputBackground: '#FAFAFA',
  inputBorder: 'transparent',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark,
    colors,
  };
};
