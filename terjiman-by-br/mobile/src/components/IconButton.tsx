import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { RADIUS, TOUCH_TARGET } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Required: icon-only controls are invisible to screen readers without it. */
  accessibilityLabel: string;
  size?: number;
  color?: string;
  disabled?: boolean;
  active?: boolean;
  variant?: 'plain' | 'filled' | 'outlined';
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 22,
  color,
  disabled = false,
  active = false,
  variant = 'plain',
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const tint = color ?? (active ? theme.colors.primary : theme.colors.textMuted);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: active }}
      // Keeps the tap area at 44pt even when the glyph is small.
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        variant === 'filled' && { backgroundColor: theme.colors.surfaceMuted },
        variant === 'outlined' && {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
        },
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
