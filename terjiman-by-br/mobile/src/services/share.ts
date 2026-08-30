import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

export interface ShareContent {
  sourceText: string;
  translatedText: string;
  labels: { original: string; translation: string; signature: string };
  includeSignature?: boolean;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds the shared message. The signature is opt-in so "copy" stays clean
 * plain text — branding never rides along when the user just wants the words.
 */
export function buildShareMessage(content: ShareContent): string {
  const parts = [
    `${content.labels.original}:`,
    content.sourceText,
    '',
    `${content.labels.translation}:`,
    content.translatedText,
  ];
  if (content.includeSignature) {
    parts.push('', content.labels.signature);
  }
  return parts.join('\n');
}

/**
 * Uses the OS share sheet. `Share` from react-native is the right API for
 * sharing text; expo-sharing only handles files.
 */
export async function shareTranslation(content: ShareContent): Promise<boolean> {
  try {
    const result = await Share.share({ message: buildShareMessage(content) });
    return result.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}
