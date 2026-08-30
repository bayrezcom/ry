import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AUTO_DETECT, getLanguage } from '../constants/languages';
import { RADIUS, SPACING, TOUCH_TARGET } from '../constants/theme';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { AppText } from './AppText';
import { LanguagePickerModal } from './LanguagePickerModal';

export interface LanguageBarProps {
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: string | undefined;
  onChangeSource: (code: string) => void;
  onChangeTarget: (code: string) => void;
  onSwap: () => void;
}

export function LanguageBar({
  sourceLanguage,
  targetLanguage,
  detectedLanguage,
  onChangeSource,
  onChangeTarget,
  onSwap,
}: LanguageBarProps) {
  const theme = useTheme();
  const { t, isRtl } = useI18n();
  const [picker, setPicker] = useState<'source' | 'target' | null>(null);

  const sourceLabel =
    sourceLanguage === AUTO_DETECT
      ? t('home.autoDetect')
      : (getLanguage(sourceLanguage)?.name ?? sourceLanguage);
  const targetLabel = getLanguage(targetLanguage)?.name ?? targetLanguage;
  const detectedName = detectedLanguage ? getLanguage(detectedLanguage)?.name : undefined;

  return (
    <>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.surfaceMuted,
            flexDirection: isRtl ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Chip
          label={sourceLabel}
          caption={
            sourceLanguage === AUTO_DETECT && detectedName
              ? t('home.detectedAs', { language: detectedName })
              : t('home.sourceLabel')
          }
          onPress={() => setPicker('source')}
          accessibilityLabel={`${t('home.sourceLabel')}: ${sourceLabel}`}
        />

        <Pressable
          onPress={onSwap}
          accessibilityRole="button"
          accessibilityLabel={t('home.swap')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.swap,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          {/* A horizontal swap glyph is symmetric, so it must not be mirrored in RTL. */}
          <Ionicons name="swap-horizontal" size={20} color={theme.colors.primary} />
        </Pressable>

        <Chip
          label={targetLabel}
          caption={t('home.targetLabel')}
          onPress={() => setPicker('target')}
          accessibilityLabel={`${t('home.targetLabel')}: ${targetLabel}`}
        />
      </View>

      <LanguagePickerModal
        visible={picker === 'source'}
        title={t('home.sourceLabel')}
        selectedCode={sourceLanguage}
        includeAutoDetect
        disabledCode={targetLanguage}
        onSelect={(code) => {
          onChangeSource(code);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <LanguagePickerModal
        visible={picker === 'target'}
        title={t('home.targetLabel')}
        selectedCode={targetLanguage}
        onSelect={(code) => {
          onChangeTarget(code);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </>
  );
}

interface ChipProps {
  label: string;
  caption: string;
  onPress: () => void;
  accessibilityLabel: string;
}

function Chip({ label, caption, onPress, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.6 : 1 }]}
    >
      <AppText variant="caption" tone="subtle" numberOfLines={1} style={styles.caption}>
        {caption}
      </AppText>
      <AppText variant="heading" weight="semibold" numberOfLines={1} style={styles.chipLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    gap: 1,
  },
  caption: {
    textAlign: 'center',
  },
  chipLabel: {
    textAlign: 'center',
  },
  swap: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
