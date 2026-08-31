import en from '../src/i18n/en';
import ar from '../src/i18n/ar';
import tr from '../src/i18n/tr';
import ug from '../src/i18n/ug';
import { UI_LOCALES, isRtlLocale, resolveUiLocale, translate } from '../src/i18n';

function flatten(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('locale completeness', () => {
  const expected = flatten(en).sort();

  it.each([
    ['tr', tr],
    ['ug', ug],
    ['ar', ar],
  ])('%s defines every English key with a non-empty string', (_name, dictionary) => {
    expect(flatten(dictionary).sort()).toEqual(expected);
    for (const key of expected) {
      const value = key
        .split('.')
        .reduce<unknown>((node, segment) => (node as Record<string, unknown>)[segment], dictionary);
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    }
  });
});

describe('translate', () => {
  it('returns the localized string', () => {
    expect(translate('en', 'home.translate')).toBe('Translate');
    expect(translate('ug', 'home.translate')).toBe('تەرجىمە قىلىش');
    expect(translate('ug', 'tabs.history')).toBe('تارىخ');
    expect(translate('ug', 'tabs.settings')).toBe('تەڭشەكلەر');
    expect(translate('ug', 'history.empty')).toBe('ھازىرچە تەرجىمە يوق');
    expect(translate('ug', 'history.favoritesEmpty')).toBe('ياقتۇرغان تەرجىمىلەر يوق');
  });

  it('interpolates parameters', () => {
    expect(translate('en', 'home.characters', { count: 12, max: 5000 })).toBe('12 / 5000');
    expect(translate('en', 'errors.textTooLong', { max: 5000 })).toContain('5000');
  });

  it('leaves an unknown placeholder untouched', () => {
    expect(translate('en', 'home.detectedAs', {})).toContain('{{language}}');
  });
});

describe('locale resolution', () => {
  it('honours an explicit choice', () => {
    expect(resolveUiLocale('ug', ['en-US'])).toBe('ug');
  });

  it('follows the device locale under "system"', () => {
    expect(resolveUiLocale('system', ['ug-CN', 'en-US'])).toBe('ug');
    expect(resolveUiLocale('system', ['ar_SA'])).toBe('ar');
    expect(resolveUiLocale('system', ['tr'])).toBe('tr');
  });

  it('falls back to English for an unsupported device locale', () => {
    expect(resolveUiLocale('system', ['ja-JP'])).toBe('en');
    expect(resolveUiLocale('system', [])).toBe('en');
  });

  it('knows which interface locales are RTL', () => {
    expect(UI_LOCALES.filter(isRtlLocale)).toEqual(['ug', 'ar']);
  });
});
