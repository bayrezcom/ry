import { describe, expect, it } from 'vitest';
import { findLanguage, isSupportedLanguage, supportedCodes } from '../src/config/languages.js';
import {
  buildTranslationSystemPrompt,
} from '../src/prompts/translator.js';
import { hasArabicScript, looksLikeUyghur, refineDetectedLanguage } from '../src/services/scriptHeuristics.js';
import { cleanTranslationOutput, extractJsonObject } from '../src/services/textCleanup.js';

describe('cleanTranslationOutput', () => {
  it('returns plain output unchanged', () => {
    expect(cleanTranslationOutput('Welcome to Dubai.', 'دوبەيگە خۇش كەلدىڭىز.')).toBe(
      'Welcome to Dubai.',
    );
  });

  it('removes a leading preamble', () => {
    expect(cleanTranslationOutput('Translation: Bugün hava çok güzel.', 'The weather is nice.')).toBe(
      'Bugün hava çok güzel.',
    );
  });

  it('removes code fences', () => {
    expect(cleanTranslationOutput('```\nمەن دۇبەيدە ياشايمەن.\n```', 'I live in Dubai.')).toBe(
      'مەن دۇبەيدە ياشايمەن.',
    );
  });

  it('strips wrapping quotes the model added', () => {
    expect(cleanTranslationOutput('"Welcome to Dubai."', 'دوبەيگە خۇش كەلدىڭىز.')).toBe(
      'Welcome to Dubai.',
    );
  });

  it('keeps quotes that exist in the source text', () => {
    expect(cleanTranslationOutput('"Welcome to Dubai."', '"دوبەيگە خۇش كەلدىڭىز."')).toBe(
      '"Welcome to Dubai."',
    );
  });

  it('keeps interior quotes intact', () => {
    const output = 'He said "hello" and left.';
    expect(cleanTranslationOutput(output, 'O "merhaba" dedi ve gitti.')).toBe(output);
  });

  it('preserves paragraph structure', () => {
    const multiline = 'First paragraph.\n\nSecond paragraph.';
    expect(cleanTranslationOutput(multiline, 'Birinci paragraf.\n\nİkinci paragraf.')).toBe(
      multiline,
    );
  });
});

describe('extractJsonObject', () => {
  it('parses bare JSON', () => {
    expect(extractJsonObject('{"languageCode":"ug"}')).toEqual({ languageCode: 'ug' });
  });

  it('parses JSON surrounded by prose', () => {
    expect(extractJsonObject('Sure: {"languageCode":"en","confidence":0.8} — done')).toEqual({
      languageCode: 'en',
      confidence: 0.8,
    });
  });

  it('returns undefined for unparsable output', () => {
    expect(extractJsonObject('definitely english')).toBeUndefined();
  });
});

describe('script heuristics', () => {
  it('recognizes Arabic script', () => {
    expect(hasArabicScript('ياخشىمۇسىز؟')).toBe(true);
    expect(hasArabicScript('Hello')).toBe(false);
  });

  it('identifies Uyghur by its explicit vowel letters', () => {
    expect(looksLikeUyghur('ياخشىمۇسىز؟ بۈگۈن قانداقراق؟')).toBe(true);
    expect(looksLikeUyghur('مەن دۇبەيدە ياشايمەن.')).toBe(true);
    expect(looksLikeUyghur('ئۇيغۇرچە')).toBe(true);
  });

  it('does not mistake Arabic for Uyghur', () => {
    expect(looksLikeUyghur('مرحبا بكم في دبي.')).toBe(false);
    expect(looksLikeUyghur('اللغة العربية جميلة.')).toBe(false);
  });

  it('does not mistake Urdu for Uyghur', () => {
    expect(looksLikeUyghur('میں ڈاکٹر ہوں۔')).toBe(false);
  });

  it('promotes a misdetected Arabic label to Uyghur', () => {
    expect(refineDetectedLanguage('ar', 'مەن دۇبەيدە ياشايمەن.')).toBe('ug');
  });

  it('never demotes a Uyghur detection', () => {
    expect(refineDetectedLanguage('ug', 'مرحبا بكم في دبي.')).toBe('ug');
  });

  it('leaves non-Arabic-script detections alone', () => {
    expect(refineDetectedLanguage('en', 'Welcome to Dubai.')).toBe('en');
    expect(refineDetectedLanguage('zh-Hans', '欢迎来到迪拜。')).toBe('zh-Hans');
  });
});

describe('language registry', () => {
  it('exposes every initial language', () => {
    expect(supportedCodes()).toEqual([
      'ug', 'tr', 'en', 'ar', 'zh-Hans', 'zh-Hant', 'ur', 'ru', 'kk', 'uz', 'fa', 'fr', 'de', 'es',
    ]);
  });

  it('marks the RTL languages', () => {
    for (const code of ['ug', 'ar', 'ur', 'fa']) {
      expect(findLanguage(code)?.direction).toBe('rtl');
    }
    for (const code of ['en', 'tr', 'zh-Hans', 'ru']) {
      expect(findLanguage(code)?.direction).toBe('ltr');
    }
  });

  it('rejects unknown codes', () => {
    expect(isSupportedLanguage('klingon')).toBe(false);
  });
});

describe('translator prompt', () => {
  it('names both languages for an explicit pair', () => {
    const prompt = buildTranslationSystemPrompt({ sourceLanguage: 'ug', targetLanguage: 'tr' });
    expect(prompt).toContain('from Uyghur into Turkish');
    expect(prompt).toContain('Never substitute Turkish or Uzbek vocabulary');
  });

  it('asks the model to detect the language when the source is auto', () => {
    const prompt = buildTranslationSystemPrompt({ sourceLanguage: 'auto', targetLanguage: 'en' });
    expect(prompt).toContain('Detect the language');
    expect(prompt).toContain('into English');
  });

  it('adds a register instruction only when requested', () => {
    const formal = buildTranslationSystemPrompt({
      sourceLanguage: 'en',
      targetLanguage: 'ug',
      formality: 'formal',
    });
    expect(formal).toContain('formal/polite register');
    const plain = buildTranslationSystemPrompt({ sourceLanguage: 'en', targetLanguage: 'ug' });
    expect(plain).not.toContain('formal/polite register');
  });
});
