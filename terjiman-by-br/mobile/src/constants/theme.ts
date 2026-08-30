import type { TextStyle } from 'react-native';

/**
 * BR brand palette. Purple/blue family only — no yellow, no pink, and
 * gradients are limited to the header wordmark accent.
 */
export const BRAND = {
  primary: '#4A2461',
  secondary: '#7D2C94',
  purple400: '#82509A',
  purple300: '#AA72B4',
  blue700: '#0B3F70',
  blue600: '#2760AB',
  blue500: '#3171B3',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  accent: string;
  info: string;
  danger: string;
  dangerSurface: string;
  warningSurface: string;
  favorite: string;
  overlay: string;
  tabInactive: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F3F8',
  border: '#E7E3EE',
  borderStrong: '#D6CFE0',
  text: '#191223',
  textMuted: '#5F5870',
  textSubtle: '#8A8397',
  primary: BRAND.primary,
  primaryPressed: '#3A1B4D',
  onPrimary: '#FFFFFF',
  accent: BRAND.secondary,
  info: BRAND.blue600,
  danger: '#B3261E',
  dangerSurface: '#FDECEA',
  warningSurface: '#F3EEF7',
  favorite: BRAND.secondary,
  overlay: 'rgba(25, 18, 35, 0.45)',
  tabInactive: '#9089A0',
};

/**
 * Dark mode is a designed palette, not an inversion: surfaces stay in the
 * brand's violet family and the primary lightens so it keeps contrast on a
 * dark ground.
 */
const darkColors: ThemeColors = {
  background: '#100C15',
  surface: '#1A1522',
  surfaceMuted: '#221B2C',
  border: '#302739',
  borderStrong: '#40354C',
  text: '#F4F1F8',
  textMuted: '#B4ABC0',
  textSubtle: '#8F87A0',
  primary: '#B27FC4',
  primaryPressed: '#9C6BAE',
  onPrimary: '#1A0F22',
  accent: '#C79AD6',
  info: '#6FA3DC',
  danger: '#F2B8B5',
  dangerSurface: '#3B1F22',
  warningSurface: '#2A2033',
  favorite: '#C79AD6',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabInactive: '#7E7590',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Minimum interactive size, per platform accessibility guidance. */
export const TOUCH_TARGET = 44;

export const FONTS = {
  latin: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  arabic: {
    regular: 'NotoSansArabic_400Regular',
    medium: 'NotoSansArabic_500Medium',
    semibold: 'NotoSansArabic_600SemiBold',
    bold: 'NotoSansArabic_700Bold',
  },
} as const;

export type FontWeightName = keyof typeof FONTS.latin;

export const TYPE_SCALE: Record<string, TextStyle> = {
  display: { fontSize: 26, lineHeight: 34 },
  title: { fontSize: 20, lineHeight: 28 },
  heading: { fontSize: 17, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  input: { fontSize: 18, lineHeight: 28 },
  result: { fontSize: 19, lineHeight: 30 },
  label: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
};

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing: SPACING,
  radius: RADIUS,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing: SPACING,
  radius: RADIUS,
};
