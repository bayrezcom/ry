import type { UiLanguage } from '../types';
import ar from './ar';
import en, { type Translations } from './en';
import tr from './tr';
import ug from './ug';

export type UiLocale = 'en' | 'tr' | 'ug' | 'ar';

export const UI_LOCALES: readonly UiLocale[] = ['en', 'tr', 'ug', 'ar'];

const DICTIONARIES: Record<UiLocale, Translations> = { en, tr, ug, ar };

export const RTL_UI_LOCALES: readonly UiLocale[] = ['ug', 'ar'];

/** Dot-separated paths into the translation dictionary, checked at compile time. */
type PathsOf<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${PathsOf<T[K]>}`;
}[keyof T & string];

export type TranslationKey = PathsOf<Translations>;

export type TranslationParams = Record<string, string | number>;

function lookup(dictionary: Translations, key: string): string | undefined {
  let current: unknown = dictionary;
  for (const segment of key.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function getDictionary(locale: UiLocale): Translations {
  return DICTIONARIES[locale];
}

export function translate(
  locale: UiLocale,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  // Fall back to English rather than showing a raw key if a locale ever drifts.
  const template = lookup(DICTIONARIES[locale], key) ?? lookup(en, key) ?? key;
  return interpolate(template, params);
}

export function isRtlLocale(locale: UiLocale): boolean {
  return RTL_UI_LOCALES.includes(locale);
}

/**
 * Maps the stored setting plus the device locale onto a supported UI locale.
 * Device tags arrive as "ug-CN", "ar_SA", "tr" and similar.
 */
export function resolveUiLocale(setting: UiLanguage, deviceTags: readonly string[]): UiLocale {
  if (setting !== 'system') return setting;
  for (const tag of deviceTags) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    const match = UI_LOCALES.find((locale) => locale === base);
    if (match) return match;
  }
  return 'en';
}

export const UI_LOCALE_LABELS: Record<UiLocale, string> = {
  en: 'English',
  tr: 'Türkçe',
  ug: 'ئۇيغۇرچە',
  ar: 'العربية',
};
