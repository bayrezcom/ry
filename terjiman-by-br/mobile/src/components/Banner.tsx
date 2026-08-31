import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { AppText } from './AppText';

export interface BannerProps {
  tone: 'error' | 'info';
  message: string;
  hint?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Banner({
  tone,
  message,
  hint,
  onDismiss,
  dismissLabel = 'Close',
  actionLabel,
  onAction,
}: BannerProps) {
  const theme = useTheme();
  const background = tone === 'error' ? theme.colors.dangerSurface : theme.colors.warningSurface;
  const accent = tone === 'error' ? theme.colors.danger : theme.colors.info;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: background, borderColor: accent }]}
    >
      <Ionicons
        name={tone === 'error' ? 'alert-circle' : 'cloud-offline'}
        size={20}
        color={accent}
        style={styles.icon}
      />
      <View style={styles.body}>
        <AppText variant="label" weight="medium">
          {message}
        </AppText>
        {hint ? (
          <AppText variant="caption" tone="muted" style={styles.hint}>
            {hint}
          </AppText>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
            <AppText variant="label" weight="semibold" tone="primary" style={styles.action}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          hitSlop={10}
        >
          <Ionicons name="close" size={18} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  hint: {
    marginTop: 2,
  },
  action: {
    marginTop: SPACING.sm,
  },
});
