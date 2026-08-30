import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { haptic } from '../services/feedback';
import { copyToClipboard, shareTranslation } from '../services/share';
import { useHistoryStore } from '../store/historyStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslationStore } from '../store/translationStore';
import type { TranslationRecord } from '../types';
import { useI18n } from './useI18n';

export interface RecordActions {
  open: (record: TranslationRecord) => void;
  copy: (record: TranslationRecord) => void;
  share: (record: TranslationRecord) => void;
  remove: (record: TranslationRecord) => void;
  toggleFavorite: (record: TranslationRecord) => void;
  clearAll: (count: number) => void;
}

/** Shared row behaviour for the History and Favorites screens. */
export function useRecordActions(): RecordActions {
  const router = useRouter();
  const { t } = useI18n();
  const hapticsEnabled = useSettingsStore((state) => state.settings.hapticsEnabled);

  const open = useCallback(
    (record: TranslationRecord) => {
      useTranslationStore.getState().applyRecord(record);
      // Always land on Home so the record opens in the main editor.
      router.navigate('/');
    },
    [router],
  );

  const copy = useCallback(
    (record: TranslationRecord) => {
      void haptic('light', hapticsEnabled);
      void copyToClipboard(record.translatedText);
    },
    [hapticsEnabled],
  );

  const share = useCallback(
    (record: TranslationRecord) => {
      void shareTranslation({
        sourceText: record.sourceText,
        translatedText: record.translatedText,
        includeSignature: true,
        labels: {
          original: t('share.original'),
          translation: t('share.translation'),
          signature: t('share.signature'),
        },
      });
    },
    [t],
  );

  const remove = useCallback(
    (record: TranslationRecord) => {
      Alert.alert(t('history.deleteItemTitle'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void haptic('warning', hapticsEnabled);
            useHistoryStore.getState().remove(record.id);
          },
        },
      ]);
    },
    [hapticsEnabled, t],
  );

  const toggleFavorite = useCallback(
    (record: TranslationRecord) => {
      void haptic('light', hapticsEnabled);
      useHistoryStore.getState().toggleFavorite(record.id);
    },
    [hapticsEnabled],
  );

  const clearAll = useCallback(
    (count: number) => {
      Alert.alert(t('history.clearAllTitle'), t('history.clearAllMessage', { count }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('history.clearAll'),
          style: 'destructive',
          onPress: () => {
            void haptic('warning', hapticsEnabled);
            useHistoryStore.getState().clearAll();
          },
        },
      ]);
    },
    [hapticsEnabled, t],
  );

  return { open, copy, share, remove, toggleFavorite, clearAll };
}
