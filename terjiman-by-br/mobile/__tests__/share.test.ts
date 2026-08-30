import { buildShareMessage } from '../src/services/share';

const labels = {
  original: 'Original',
  translation: 'Translation',
  signature: 'Translated by Terjiman by BR',
};

describe('buildShareMessage', () => {
  it('labels the original and the translation', () => {
    const message = buildShareMessage({
      sourceText: 'Welcome to Dubai.',
      translatedText: 'دوبەيگە خۇش كەلدىڭىز.',
      labels,
    });

    expect(message).toBe(
      'Original:\nWelcome to Dubai.\n\nTranslation:\nدوبەيگە خۇش كەلدىڭىز.',
    );
  });

  it('appends the signature only when asked', () => {
    const withSignature = buildShareMessage({
      sourceText: 'Hello',
      translatedText: 'ياخشىمۇسىز',
      labels,
      includeSignature: true,
    });

    expect(withSignature.endsWith(labels.signature)).toBe(true);
  });

  it('uses localized labels', () => {
    const message = buildShareMessage({
      sourceText: 'Hello',
      translatedText: 'ياخشىمۇسىز',
      labels: { original: 'ئەسلى تېكىست', translation: 'تەرجىمە', signature: 'x' },
    });

    expect(message).toContain('ئەسلى تېكىست:');
    expect(message).toContain('تەرجىمە:');
  });
});
