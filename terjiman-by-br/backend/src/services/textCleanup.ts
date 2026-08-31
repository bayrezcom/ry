const FENCE_RE = /^```[a-zA-Z0-9-]*\r?\n([\s\S]*?)\r?\n?```$/;

/**
 * Preambles models add despite being told not to. Matched only at the very
 * start of the output and only when followed by the actual translation.
 */
const PREAMBLE_RE =
  /^\s*(?:here(?:'s| is| are)[^\n:]{0,40}:|translation(?:\s+into\s+[^\n:]{1,30})?:|translated(?:\s+text)?:|sure[,!]?\s*here[^\n:]{0,40}:)\s*/i;

const QUOTE_PAIRS: Array<[string, string]> = [
  ['"', '"'],
  ["'", "'"],
  ['“', '”'],
  ['‘', '’'],
  ['«', '»'],
  ['「', '」'],
];

/**
 * Normalizes a raw model completion into deliverable translation text.
 * Deliberately conservative: it only removes wrappers the model added, never
 * punctuation that plausibly belongs to the translation itself.
 */
export function cleanTranslationOutput(raw: string, sourceText: string): string {
  let text = raw.replace(/^﻿/, '').trim();

  const fenced = FENCE_RE.exec(text);
  if (fenced?.[1] !== undefined) text = fenced[1].trim();

  const withoutPreamble = text.replace(PREAMBLE_RE, '');
  // Only accept preamble removal when something is actually left over.
  if (withoutPreamble.trim() !== '') text = withoutPreamble.trim();

  text = stripMatchingQuotes(text, sourceText);
  return text.trim();
}

function stripMatchingQuotes(text: string, sourceText: string): string {
  const source = sourceText.trim();
  for (const [open, close] of QUOTE_PAIRS) {
    if (!text.startsWith(open) || !text.endsWith(close) || text.length <= open.length + close.length)
      continue;
    // The source was quoted too, so the quotes are part of the content.
    if (source.startsWith(open) || source.startsWith('"') || source.startsWith('“')) return text;
    const inner = text.slice(open.length, text.length - close.length);
    // A quote in the middle means the outer pair is not a wrapper.
    if (inner.includes(close)) return text;
    return inner.trim();
  }
  return text;
}

/** Extracts the first JSON object from a model response that may carry noise. */
export function extractJsonObject(raw: string): unknown {
  const text = raw.trim().replace(FENCE_RE, '$1').trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return undefined;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}
