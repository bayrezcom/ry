export interface TranslationRecord {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  createdAt: number;
  isFavorite: boolean;
  /** Set when the source language was auto-detected. */
  detectedLanguage?: string;
}

export type Appearance = 'system' | 'light' | 'dark';

/** 'system' follows the device locale, falling back to English. */
export type UiLanguage = 'system' | 'en' | 'tr' | 'ug' | 'ar';

export interface Settings {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  appearance: Appearance;
  uiLanguage: UiLanguage;
  hapticsEnabled: boolean;
  voiceInputEnabled: boolean;
}

export type TranslationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DetectedLanguage {
  code: string;
  confidence: number;
}
