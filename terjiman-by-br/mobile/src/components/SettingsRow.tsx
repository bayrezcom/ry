import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { RADIUS, SPACING, TOUCH_TARGET } from '../constants/theme';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { AppText } from './AppText';

export interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const theme = useTheme();
  const { isRtl } = useI18n();
  return (
    <View style={styles.section}>
      <AppText
        variant="caption"
        weight="semibold"
        tone="subtle"
        style={[styles.sectionTitle, { textAlign: isRtl ? 'right' : 'left' }]}
      >
        {title.toUpperCase()}
      </AppText>
      <View
        style={[
          styles.sectionBody,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export interface SettingsRowProps {
  label: string;
  hint?: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (next: boolean) => void };
  showChevron?: boolean;
  destructive?: boolean;
}

export function SettingsRow({
  label,
  hint,
  value,
  onPress,
  toggle,
  showChevron = false,
  destructive = false,
}: SettingsRowProps) {
  const theme = useTheme();
  const { isRtl } = useI18n();
  const direction = isRtl ? 'row-reverse' : 'row';

  const content = (
    <View style={[styles.row, { flexDirection: direction, borderColor: theme.colors.border }]}>
      <View style={styles.rowLabel}>
        <AppText
          variant="body"
          weight="medium"
          tone={destructive ? 'danger' : 'default'}
          style={{ textAlign: isRtl ? 'right' : 'left' }}
        >
          {label}
        </AppText>
        {hint ? (
          <AppText variant="caption" tone="subtle" style={{ textAlign: isRtl ? 'right' : 'left' }}>
            {hint}
          </AppText>
        ) : null}
      </View>

      <View style={[styles.rowValue, { flexDirection: direction }]}>
        {value ? (
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
        {toggle ? (
          <Switch
            value={toggle.value}
            onValueChange={toggle.onChange}
            accessibilityLabel={label}
            trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
            thumbColor={theme.colors.surface}
          />
        ) : null}
        {showChevron ? (
          <Ionicons
            name={isRtl ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color={theme.colors.textSubtle}
          />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(value ? { accessibilityValue: { text: value } } : {})}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
    >
      {content}
    </Pressable>
  );
}

export interface SegmentedControlProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmented, { backgroundColor: theme.colors.surfaceMuted }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              selected && { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <AppText
              variant="label"
              weight={selected ? 'semibold' : 'regular'}
              tone={selected ? 'primary' : 'muted'}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    letterSpacing: 0.6,
    paddingHorizontal: SPACING.xs,
  },
  sectionBody: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    minHeight: TOUCH_TARGET + 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    flex: 1,
    gap: 2,
  },
  rowValue: {
    alignItems: 'center',
    gap: SPACING.sm,
    maxWidth: '45%',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: TOUCH_TARGET - 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
});
