import { AUTO_DETECT, getDirection, type TextDirection } from '../constants/languages';

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const CJK = /[　-〿぀-ヿ一-鿿豈-﫿]/;

/** True when the string contains Arabic-script characters (Uyghur, Arabic, Urdu, Persian). */
export function containsArabicScript(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}

export function containsCjk(text: string): boolean {
  return CJK.test(text);
}

/**
 * Direction for a block of text. The selected language decides, except under
 * Auto Detect where the script of what the user actually typed is the only
 * evidence available before the request completes.
 */
export function resolveTextDirection(languageCode: string, text = ''): TextDirection {
  if (languageCode === AUTO_DETECT) {
    return containsArabicScript(text) ? 'rtl' : 'ltr';
  }
  return getDirection(languageCode);
}

export function isEmptyText(text: string): boolean {
  return text.trim().length === 0;
}

/** Collapses whitespace for one-line previews without touching stored text. */
export function previewText(text: string, maxLength = 140): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length <= maxLength ? collapsed : `${collapsed.slice(0, maxLength - 1)}…`;
}
