import { AUTO_DETECT, getDirection, isRtlLanguage } from '../src/constants/languages';
import { containsArabicScript, previewText, resolveTextDirection } from '../src/utils/text';

describe('RTL detection', () => {
  it('marks Uyghur, Arabic, Urdu and Persian as RTL', () => {
    for (const code of ['ug', 'ar', 'ur', 'fa']) {
      expect(isRtlLanguage(code)).toBe(true);
      expect(getDirection(code)).toBe('rtl');
    }
  });

  it('marks the other initial languages as LTR', () => {
    for (const code of ['en', 'tr', 'zh-Hans', 'zh-Hant', 'ru', 'kk', 'uz', 'fr', 'de', 'es']) {
      expect(isRtlLanguage(code)).toBe(false);
    }
  });

  it('detects Arabic script in Uyghur text', () => {
    expect(containsArabicScript('ياخشىمۇسىز؟ بۈگۈن قانداقراق؟')).toBe(true);
    expect(containsArabicScript('مەن دۇبەيدە ياشايمەن.')).toBe(true);
    expect(containsArabicScript('مرحبا بكم في دبي.')).toBe(true);
  });

  it('does not flag Latin, Cyrillic or CJK text', () => {
    expect(containsArabicScript('Welcome to Dubai.')).toBe(false);
    expect(containsArabicScript('Bugün hava çok güzel.')).toBe(false);
    expect(containsArabicScript('欢迎来到迪拜。')).toBe(false);
    expect(containsArabicScript('Добро пожаловать')).toBe(false);
  });

  it('handles mixed LTR/RTL content as RTL-capable', () => {
    expect(containsArabicScript('Dubai دۇبەي 2026')).toBe(true);
  });
});

describe('resolveTextDirection', () => {
  it('follows the selected language', () => {
    expect(resolveTextDirection('ug', 'anything')).toBe('rtl');
    expect(resolveTextDirection('en', 'ياخشىمۇسىز')).toBe('ltr');
  });

  it('falls back to the typed script under Auto Detect', () => {
    expect(resolveTextDirection(AUTO_DETECT, 'ياخشىمۇسىز؟')).toBe('rtl');
    expect(resolveTextDirection(AUTO_DETECT, 'Welcome to Dubai.')).toBe('ltr');
    expect(resolveTextDirection(AUTO_DETECT, '')).toBe('ltr');
  });
});

describe('previewText', () => {
  it('collapses whitespace and truncates long text', () => {
    expect(previewText('  hello \n  world  ')).toBe('hello world');
    expect(previewText('x'.repeat(200), 10)).toHaveLength(10);
    expect(previewText('short', 10)).toBe('short');
  });
});
