// Kids & Family Mobile App - Design System & Theme (Matching Figma Mockup)

export const Colors = {
  primary: '#4c1d95',        // Royal Deep Purple from Figma design
  primaryDark: '#3b0764',
  primaryLight: '#7c3aed',
  primaryMuted: '#f5f3ff',
  primarySurface: '#ede9fe',

  accent: '#f59e0b',         // Amber / Warm Gold
  accentDark: '#b45309',
  accentLight: '#fef3c7',

  sale: '#e11d48',           // Rose Red for discount tags (-24%, -27%)
  saleLight: '#ffe4e6',

  success: '#10b981',        // Delivered green
  successLight: '#d1fae5',

  warning: '#f59e0b',        // Processing yellow
  warningLight: '#fef3c7',

  error: '#ef4444',
  errorLight: '#fee2e2',

  // Pastel Category Backgrounds (from Figma design)
  pastelBlue: '#eff6ff',
  pastelPink: '#fdf2f8',
  pastelGreen: '#f0fdf4',
  pastelPurple: '#faf5ff',
  pastelAmber: '#fffbeb',

  background: '#faf9fd',
  surface: '#ffffff',
  surfaceMuted: '#f8f7fc',
  card: '#ffffff',

  text: '#1e1b4b',           // Deep Indigo for high-contrast crisp typography
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textLight: '#cbd5e1',

  border: '#ede9fe',
  borderLight: '#f5f3ff',
  borderDark: '#ddd6fe',

  white: '#ffffff',
  black: '#000000',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  xxl: 32,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

export const theme = {
  colors: Colors,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  typography: Typography,
};

export default theme;
