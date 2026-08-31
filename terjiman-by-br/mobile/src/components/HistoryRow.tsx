import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AUTO_DETECT, getLanguage, isRtlLanguage } from '../constants/languages';
import { RADIUS, SPACING } from '../constants/theme';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import type { TranslationRecord } from '../types';
import { previewText } from '../utils/text';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

export interface HistoryRowProps {
  record: TranslationRecord;
  onOpen: (record: TranslationRecord) => void;
  onToggleFavorite: (record: TranslationRecord) => void;
  onCopy: (record: TranslationRecord) => void;
  onShare: (record: TranslationRecord) => void;
  onDelete: (record: TranslationRecord) => void;
}

function languageLabel(code: string): string {
  if (code === AUTO_DETECT) return 'Auto';
  return getLanguage(code)?.name ?? code;
}

export function HistoryRow({
  record,
  onOpen,
  onToggleFavorite,
  onCopy,
  onShare,
  onDelete,
}: HistoryRowProps) {
  const theme = useTheme();
  const { t, isRtl } = useI18n();

  const sourceRtl = isRtlLanguage(record.detectedLanguage ?? record.sourceLanguage);
  const targetRtl = isRtlLanguage(record.targetLanguage);
  const rowDirection = isRtl ? 'row-reverse' : 'row';

  return (
    <Pressable
      onPress={() => onOpen(record)}
      accessibilityRole="button"
      accessibilityLabel={`${languageLabel(record.sourceLanguage)} → ${languageLabel(record.targetLanguage)}: ${previewText(record.translatedText, 60)}`}
      accessibilityHint={t('history.openHint')}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <View style={[styles.pair, { flexDirection: rowDirection }]}>
          <AppText variant="caption" weight="medium" tone="muted">
            {languageLabel(record.detectedLanguage ?? record.sourceLanguage)}
          </AppText>
          <Ionicons
            name={isRtl ? 'arrow-back' : 'arrow-forward'}
            size={12}
            color={theme.colors.textSubtle}
          />
          <AppText variant="caption" weight="medium" tone="muted">
            {languageLabel(record.targetLanguage)}
          </AppText>
        </View>
        <IconButton
          icon={record.isFavorite ? 'star' : 'star-outline'}
          size={18}
          color={record.isFavorite ? theme.colors.favorite : theme.colors.textSubtle}
          onPress={() => onToggleFavorite(record)}
          accessibilityLabel={
            record.isFavorite ? t('home.removeFavorite') : t('home.addFavorite')
          }
          style={styles.star}
        />
      </View>

      <AppText
        variant="label"
        tone="muted"
        numberOfLines={2}
        style={{ textAlign: sourceRtl ? 'right' : 'left', writingDirection: sourceRtl ? 'rtl' : 'ltr' }}
      >
        {previewText(record.sourceText)}
      </AppText>
      <AppText
        variant="body"
        weight="medium"
        numberOfLines={3}
        style={[
          styles.translation,
          { textAlign: targetRtl ? 'right' : 'left', writingDirection: targetRtl ? 'rtl' : 'ltr' },
        ]}
      >
        {previewText(record.translatedText, 220)}
      </AppText>

      <View style={[styles.actions, { flexDirection: rowDirection }]}>
        <IconButton
          icon="copy-outline"
          size={18}
          onPress={() => onCopy(record)}
          accessibilityLabel={t('home.copy')}
        />
        <IconButton
          icon="share-outline"
          size={18}
          onPress={() => onShare(record)}
          accessibilityLabel={t('home.share')}
        />
        <IconButton
          icon="trash-outline"
          size={18}
          color={theme.colors.danger}
          onPress={() => onDelete(record)}
          accessibilityLabel={t('common.delete')}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pair: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  star: {
    minWidth: 36,
    minHeight: 36,
  },
  translation: {
    marginTop: 2,
  },
  actions: {
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
});
