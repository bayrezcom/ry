export type TextDirection = 'ltr' | 'rtl';

export interface Language {
  code: string;
  /** Endonym, shown in the language picker. */
  name: string;
  englishName: string;
  direction: TextDirection;
  /** Locale passed to expo-speech. */
  speechLocale: string;
  /** Localized "enter text" placeholder, shown when this is the source language. */
  placeholder: string;
}

export const AUTO_DETECT = 'auto';

/**
 * Mirrors backend/src/config/languages.ts. Adding a language means adding one
 * entry in both files; nothing else enumerates languages.
 */
export const LANGUAGES: readonly Language[] = [
  {
    code: 'ug',
    name: 'ئۇيغۇرچە',
    englishName: 'Uyghur',
    direction: 'rtl',
    speechLocale: 'ug',
    placeholder: 'تەرجىمە قىلىدىغان تېكىستنى كىرگۈزۈڭ...',
  },
  {
    code: 'tr',
    name: 'Türkçe',
    englishName: 'Turkish',
    direction: 'ltr',
    speechLocale: 'tr-TR',
    placeholder: 'Çevrilecek metni girin...',
  },
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    direction: 'ltr',
    speechLocale: 'en-US',
    placeholder: 'Enter text to translate...',
  },
  {
    code: 'ar',
    name: 'العربية',
    englishName: 'Arabic',
    direction: 'rtl',
    speechLocale: 'ar-SA',
    placeholder: 'أدخل النص المراد ترجمته...',
  },
  {
    code: 'zh-Hans',
    name: '简体中文',
    englishName: 'Simplified Chinese',
    direction: 'ltr',
    speechLocale: 'zh-CN',
    placeholder: '输入要翻译的文本...',
  },
  {
    code: 'zh-Hant',
    name: '繁體中文',
    englishName: 'Traditional Chinese',
    direction: 'ltr',
    speechLocale: 'zh-TW',
    placeholder: '輸入要翻譯的文字...',
  },
  {
    code: 'ur',
    name: 'اردو',
    englishName: 'Urdu',
    direction: 'rtl',
    speechLocale: 'ur-PK',
    placeholder: 'ترجمہ کرنے کے لیے متن درج کریں...',
  },
  {
    code: 'ru',
    name: 'Русский',
    englishName: 'Russian',
    direction: 'ltr',
    speechLocale: 'ru-RU',
    placeholder: 'Введите текст для перевода...',
  },
  {
    code: 'kk',
    name: 'Қазақша',
    englishName: 'Kazakh',
    direction: 'ltr',
    speechLocale: 'kk-KZ',
    placeholder: 'Аударатын мәтінді енгізіңіз...',
  },
  {
    code: 'uz',
    name: "O'zbekcha",
    englishName: 'Uzbek',
    direction: 'ltr',
    speechLocale: 'uz-UZ',
    placeholder: "Tarjima qilinadigan matnni kiriting...",
  },
  {
    code: 'fa',
    name: 'فارسی',
    englishName: 'Persian',
    direction: 'rtl',
    speechLocale: 'fa-IR',
    placeholder: 'متن مورد نظر برای ترجمه را وارد کنید...',
  },
  {
    code: 'fr',
    name: 'Français',
    englishName: 'French',
    direction: 'ltr',
    speechLocale: 'fr-FR',
    placeholder: 'Saisissez le texte à traduire...',
  },
  {
    code: 'de',
    name: 'Deutsch',
    englishName: 'German',
    direction: 'ltr',
    speechLocale: 'de-DE',
    placeholder: 'Text zum Übersetzen eingeben...',
  },
  {
    code: 'es',
    name: 'Español',
    englishName: 'Spanish',
    direction: 'ltr',
    speechLocale: 'es-ES',
    placeholder: 'Introduce el texto que quieres traducir...',
  },
];

const BY_CODE = new Map(LANGUAGES.map((language) => [language.code, language]));

export function getLanguage(code: string): Language | undefined {
  return BY_CODE.get(code);
}

export function getDirection(code: string): TextDirection {
  return BY_CODE.get(code)?.direction ?? 'ltr';
}

export function isRtlLanguage(code: string): boolean {
  return getDirection(code) === 'rtl';
}

export function getSpeechLocale(code: string): string | undefined {
  return BY_CODE.get(code)?.speechLocale;
}
