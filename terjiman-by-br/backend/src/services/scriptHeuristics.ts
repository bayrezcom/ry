/**
 * Letters that carry Uyghur's explicit vowels and do not occur in standard
 * Arabic, Persian or Urdu orthography: ە (U+06D5), ۇ (U+06C7), ۆ (U+06C6),
 * ۈ (U+06C8), ې (U+06D0), plus ڭ (U+06AD) for the velar nasal.
 */
const UYGHUR_ONLY_LETTERS = /[ەۇۆۈېڭ]/;
const UYGHUR_HAMZA_VOWEL = /ئ[اەېىوۇۆۈ]/;
/** Letters that rule Uyghur out: Arabic ta marbuta / Urdu retroflexes / Persian-only forms. */
const NON_UYGHUR_LETTERS = /[ةٹڈڑںژ]/;

const ARABIC_SCRIPT_RANGE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

export function hasArabicScript(text: string): boolean {
  return ARABIC_SCRIPT_RANGE.test(text);
}

/**
 * Cheap, deterministic check for "this Arabic-script text is Uyghur". Used to
 * correct the model when it labels Uyghur as Arabic — the single most common
 * detection failure for this app's main language.
 */
export function looksLikeUyghur(text: string): boolean {
  if (!hasArabicScript(text)) return false;
  if (NON_UYGHUR_LETTERS.test(text)) return false;
  return UYGHUR_ONLY_LETTERS.test(text) || UYGHUR_HAMZA_VOWEL.test(text);
}

const ARABIC_SCRIPT_LANGUAGES = new Set(['ar', 'fa', 'ur', 'ug']);

/**
 * Overrides a detected language code when the script evidence is unambiguous.
 * Only ever promotes another Arabic-script language to Uyghur; it never
 * demotes a Uyghur result and never touches non-Arabic scripts.
 */
export function refineDetectedLanguage(detectedCode: string, text: string): string {
  if (detectedCode === 'ug') return detectedCode;
  if (!ARABIC_SCRIPT_LANGUAGES.has(detectedCode)) return detectedCode;
  return looksLikeUyghur(text) ? 'ug' : detectedCode;
}
