export type TextDirection = 'ltr' | 'rtl';

export interface Language {
  /** BCP-47 style short code used across the API and the mobile client. */
  code: string;
  /** Endonym — the language name written in the language itself. */
  name: string;
  /** English name, used inside AI prompts so the model is never ambiguous. */
  englishName: string;
  direction: TextDirection;
  /** Locale hint for device text-to-speech. */
  speechLocale: string;
}

/**
 * Adding a language is a one-line change here plus the same line in
 * mobile/src/constants/languages.ts. Nothing else in the codebase enumerates
 * languages.
 */
export const LANGUAGES: readonly Language[] = [
  { code: 'ug', name: 'ئۇيغۇرچە', englishName: 'Uyghur', direction: 'rtl', speechLocale: 'ug' },
  { code: 'tr', name: 'Türkçe', englishName: 'Turkish', direction: 'ltr', speechLocale: 'tr-TR' },
  { code: 'en', name: 'English', englishName: 'English', direction: 'ltr', speechLocale: 'en-US' },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', direction: 'rtl', speechLocale: 'ar-SA' },
  {
    code: 'zh-Hans',
    name: '简体中文',
    englishName: 'Simplified Chinese',
    direction: 'ltr',
    speechLocale: 'zh-CN',
  },
  {
    code: 'zh-Hant',
    name: '繁體中文',
    englishName: 'Traditional Chinese',
    direction: 'ltr',
    speechLocale: 'zh-TW',
  },
  { code: 'ur', name: 'اردو', englishName: 'Urdu', direction: 'rtl', speechLocale: 'ur-PK' },
  { code: 'ru', name: 'Русский', englishName: 'Russian', direction: 'ltr', speechLocale: 'ru-RU' },
  { code: 'kk', name: 'Қазақша', englishName: 'Kazakh', direction: 'ltr', speechLocale: 'kk-KZ' },
  { code: 'uz', name: "O'zbekcha", englishName: 'Uzbek', direction: 'ltr', speechLocale: 'uz-UZ' },
  { code: 'fa', name: 'فارسی', englishName: 'Persian', direction: 'rtl', speechLocale: 'fa-IR' },
  { code: 'fr', name: 'Français', englishName: 'French', direction: 'ltr', speechLocale: 'fr-FR' },
  { code: 'de', name: 'Deutsch', englishName: 'German', direction: 'ltr', speechLocale: 'de-DE' },
  { code: 'es', name: 'Español', englishName: 'Spanish', direction: 'ltr', speechLocale: 'es-ES' },
];

export const AUTO_DETECT_CODE = 'auto';

const BY_CODE = new Map(LANGUAGES.map((language) => [language.code, language]));

export function findLanguage(code: string): Language | undefined {
  return BY_CODE.get(code);
}

export function isSupportedLanguage(code: string): boolean {
  return BY_CODE.has(code);
}

export function languageEnglishName(code: string): string {
  return BY_CODE.get(code)?.englishName ?? code;
}

export function supportedCodes(): string[] {
  return LANGUAGES.map((language) => language.code);
}
