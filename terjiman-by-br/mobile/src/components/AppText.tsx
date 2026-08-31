import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { FONTS, TYPE_SCALE, type FontWeightName } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { containsArabicScript } from '../utils/text';

export type TextVariant = keyof typeof TYPE_SCALE;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  weight?: FontWeightName;
  color?: string;
  /** 'muted' and 'subtle' resolve against the active theme. */
  tone?: 'default' | 'muted' | 'subtle' | 'primary' | 'danger' | 'onPrimary';
  children?: ReactNode;
}

function collectText(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(collectText).join(' ');
  return '';
}

/**
 * Every piece of text in the app goes through here so Arabic-script content
 * (Uyghur, Arabic, Urdu, Persian) always renders in Noto Sans Arabic while
 * Latin and Cyrillic text renders in Inter. Mixed strings pick the Arabic
 * face, which carries Latin glyphs too.
 */
export function AppText({
  variant = 'body',
  weight = 'regular',
  color,
  tone = 'default',
  style,
  children,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const content = collectText(children);
  const family = containsArabicScript(content) ? FONTS.arabic[weight] : FONTS.latin[weight];

  const toneColor: Record<NonNullable<AppTextProps['tone']>, string> = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    subtle: theme.colors.textSubtle,
    primary: theme.colors.primary,
    danger: theme.colors.danger,
    onPrimary: theme.colors.onPrimary,
  };

  const base: TextStyle = {
    ...TYPE_SCALE[variant],
    fontFamily: family,
    color: color ?? toneColor[tone],
  };

  return (
    <Text {...rest} style={StyleSheet.compose(base, style)}>
      {children}
    </Text>
  );
}
