import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { AppText } from './AppText';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceMuted }]}>
        <Ionicons name={icon} size={30} color={theme.colors.primary} />
      </View>
      <AppText variant="title" weight="semibold" style={styles.title}>
        {title}
      </AppText>
      {hint ? (
        <AppText variant="label" tone="muted" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl * 2,
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
  },
});
