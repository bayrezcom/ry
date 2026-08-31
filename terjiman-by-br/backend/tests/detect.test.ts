import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { StubProvider, createTestApp } from './helpers.js';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('POST /api/detect-language', () => {
  it('returns the detected language with its English name', async () => {
    app = await createTestApp(
      new StubProvider({ completion: JSON.stringify({ languageCode: 'tr', confidence: 0.91 }) }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/detect-language',
      payload: { text: 'Bugün hava çok güzel.' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      languageCode: 'tr',
      languageName: 'Turkish',
      confidence: 0.91,
    });
  });

  it('parses JSON even when the model wraps it in a code fence', async () => {
    app = await createTestApp(
      new StubProvider({
        completion: '```json\n{"languageCode":"en","confidence":0.99}\n```',
      }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/detect-language',
      payload: { text: 'Welcome to Dubai.' },
    });

    expect(response.json().languageCode).toBe('en');
  });

  it('corrects Arabic to Uyghur when the script evidence is unambiguous', async () => {
    app = await createTestApp(
      new StubProvider({ completion: JSON.stringify({ languageCode: 'ar', confidence: 0.7 }) }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/detect-language',
      payload: { text: 'مەن دۇبەيدە ياشايمەن.' },
    });

    const body = response.json();
    expect(body.languageCode).toBe('ug');
    expect(body.languageName).toBe('Uyghur');
    expect(body.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('leaves genuine Arabic alone', async () => {
    app = await createTestApp(
      new StubProvider({ completion: JSON.stringify({ languageCode: 'ar', confidence: 0.95 }) }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/detect-language',
      payload: { text: 'مرحبا بكم في دبي.' },
    });

    expect(response.json().languageCode).toBe('ar');
  });

  it('rejects an unknown language code from the model', async () => {
    app = await createTestApp(
      new StubProvider({ completion: JSON.stringify({ languageCode: 'xx', confidence: 1 }) }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/detect-language',
      payload: { text: 'Hello' },
    });

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe('MALFORMED_AI_RESPONSE');
  });

  it('rejects unparsable model output', async () => {
    app = await createTestApp(new StubProvider({ completion: 'I think this is English!' }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/detect-language',
      payload: { text: 'Hello' },
    });

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe('MALFORMED_AI_RESPONSE');
  });

  it('rejects empty text', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({
      method: 'POST',
      url: '/api/detect-language',
      payload: { text: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('EMPTY_INPUT');
  });
});
