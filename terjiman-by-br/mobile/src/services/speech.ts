import * as Speech from 'expo-speech';
import { getSpeechLocale } from '../constants/languages';

export interface SpeakOptions {
  onDone?: () => void;
  onError?: () => void;
}

/**
 * Device text-to-speech. Availability is per-device and per-language — Uyghur
 * in particular is rarely installed — so failures are reported to the caller
 * rather than thrown, and the UI shows a friendly note.
 */
export async function speak(
  text: string,
  languageCode: string,
  options: SpeakOptions = {},
): Promise<void> {
  const locale = getSpeechLocale(languageCode);
  try {
    await stopSpeaking();
    Speech.speak(text, {
      ...(locale ? { language: locale } : {}),
      rate: 1.0,
      pitch: 1.0,
      onDone: options.onDone,
      onStopped: options.onDone,
      onError: options.onError,
    });
  } catch {
    options.onError?.();
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    if (await Speech.isSpeakingAsync()) await Speech.stop();
  } catch {
    // Nothing was speaking, or the platform refused — safe to ignore.
  }
}

/**
 * Best-effort check that the platform has a voice for this language. Android
 * reports installed voices; iOS returns a full list, so a missing entry is a
 * strong signal but never blocks the attempt.
 */
export async function hasVoiceFor(languageCode: string): Promise<boolean> {
  const locale = getSpeechLocale(languageCode);
  if (!locale) return false;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (voices.length === 0) return true;
    const base = locale.split('-')[0]?.toLowerCase() ?? locale.toLowerCase();
    return voices.some((voice) => voice.language?.toLowerCase().startsWith(base));
  } catch {
    return true;
  }
}
