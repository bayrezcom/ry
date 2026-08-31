import { useMemo } from 'react';
import {
  isRtlLocale,
  translate,
  type TranslationKey,
  type TranslationParams,
  type UiLocale,
} from '../i18n';
import { selectUiLocale, useSettingsStore } from '../store/settingsStore';

export interface I18n {
  locale: UiLocale;
  /** True when the interface language itself is right-to-left. */
  isRtl: boolean;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

export function useI18n(): I18n {
  const uiLanguage = useSettingsStore((state) => state.settings.uiLanguage);

  return useMemo(() => {
    const locale = selectUiLocale(useSettingsStore.getState());
    return {
      locale,
      isRtl: isRtlLocale(locale),
      t: (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params),
    };
    // uiLanguage is the only input that changes at runtime; the device locale
    // list is fixed for the lifetime of the process.
  }, [uiLanguage]);
}
