import { AUTO_DETECT } from '../src/constants/languages';
import {
  isValidPair,
  selectSource,
  selectTarget,
  swapLanguages,
} from '../src/utils/languagePair';

describe('swapLanguages', () => {
  it('exchanges an explicit pair', () => {
    expect(swapLanguages({ source: 'en', target: 'ug' })).toEqual({ source: 'ug', target: 'en' });
    expect(swapLanguages({ source: 'ug', target: 'tr' })).toEqual({ source: 'tr', target: 'ug' });
  });

  it('uses the detected language as the new target under Auto Detect', () => {
    expect(swapLanguages({ source: AUTO_DETECT, target: 'en' }, 'ug')).toEqual({
      source: 'en',
      target: 'ug',
    });
  });

  it('falls back to a different language when nothing was detected', () => {
    const result = swapLanguages({ source: AUTO_DETECT, target: 'ug' });
    expect(result.source).toBe('ug');
    expect(result.target).not.toBe('ug');
    expect(result.target).not.toBe(AUTO_DETECT);
  });

  it('never produces a nonsensical pair when the detection equals the target', () => {
    const result = swapLanguages({ source: AUTO_DETECT, target: 'en' }, 'en');
    expect(result.source).toBe('en');
    expect(result.target).not.toBe('en');
  });

  it('never leaves Auto Detect in the target slot', () => {
    for (const target of ['en', 'ug', 'ar', 'zh-Hans']) {
      const result = swapLanguages({ source: AUTO_DETECT, target });
      expect(result.target).not.toBe(AUTO_DETECT);
      expect(isValidPair(result)).toBe(true);
    }
  });
});

describe('selectSource', () => {
  it('sets the source when the pair stays valid', () => {
    expect(selectSource({ source: 'en', target: 'ug' }, 'tr')).toEqual({
      source: 'tr',
      target: 'ug',
    });
  });

  it('moves the old source across when picking the current target', () => {
    expect(selectSource({ source: 'en', target: 'ug' }, 'ug')).toEqual({
      source: 'ug',
      target: 'en',
    });
  });

  it('substitutes a target when the old source was Auto Detect', () => {
    const result = selectSource({ source: AUTO_DETECT, target: 'ug' }, 'ug');
    expect(result.source).toBe('ug');
    expect(result.target).not.toBe('ug');
  });

  it('always allows Auto Detect', () => {
    expect(selectSource({ source: 'en', target: 'ug' }, AUTO_DETECT)).toEqual({
      source: AUTO_DETECT,
      target: 'ug',
    });
  });
});

describe('selectTarget', () => {
  it('sets the target when the pair stays valid', () => {
    expect(selectTarget({ source: 'en', target: 'ug' }, 'tr')).toEqual({
      source: 'en',
      target: 'tr',
    });
  });

  it('switches the source to Auto Detect when the target takes its place', () => {
    expect(selectTarget({ source: 'en', target: 'ug' }, 'en')).toEqual({
      source: AUTO_DETECT,
      target: 'en',
    });
  });
});

describe('isValidPair', () => {
  it('rejects identical languages and Auto Detect as a target', () => {
    expect(isValidPair({ source: 'en', target: 'en' })).toBe(false);
    expect(isValidPair({ source: 'en', target: AUTO_DETECT })).toBe(false);
    expect(isValidPair({ source: AUTO_DETECT, target: 'ug' })).toBe(true);
  });
});
