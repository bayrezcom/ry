import { AUTO_DETECT, LANGUAGES } from '../constants/languages';

export interface LanguagePair {
  source: string;
  target: string;
}

/** Used when a swap would otherwise leave both sides on the same language. */
const FALLBACK_TARGETS = ['en', 'ug', 'tr'];

function firstDifferent(from: string): string {
  const preferred = FALLBACK_TARGETS.find((code) => code !== from);
  if (preferred) return preferred;
  return LANGUAGES.find((language) => language.code !== from)?.code ?? 'en';
}

/**
 * Swaps the language pair.
 *
 * With an explicit source it is a plain exchange. Under Auto Detect there is
 * nothing to move into the target slot, so a detected language is used when one
 * is known; otherwise the target becomes the source and the target falls back
 * to a different language. The result never has source === target and never
 * puts Auto Detect in the target slot.
 */
export function swapLanguages(pair: LanguagePair, detectedLanguage?: string): LanguagePair {
  if (pair.source !== AUTO_DETECT) {
    return { source: pair.target, target: pair.source };
  }

  const candidate =
    detectedLanguage && detectedLanguage !== pair.target ? detectedLanguage : undefined;
  return {
    source: pair.target,
    target: candidate ?? firstDifferent(pair.target),
  };
}

/**
 * Keeps a pair valid after the user picks a language. Choosing the language
 * already on the other side swaps it rather than producing an impossible pair.
 */
export function selectSource(pair: LanguagePair, source: string): LanguagePair {
  if (source !== AUTO_DETECT && source === pair.target) {
    return { source, target: pair.source === AUTO_DETECT ? firstDifferent(source) : pair.source };
  }
  return { ...pair, source };
}

export function selectTarget(pair: LanguagePair, target: string): LanguagePair {
  if (target === pair.source) {
    return { source: AUTO_DETECT, target };
  }
  return { ...pair, target };
}

export function isValidPair(pair: LanguagePair): boolean {
  return pair.target !== AUTO_DETECT && pair.source !== pair.target;
}
