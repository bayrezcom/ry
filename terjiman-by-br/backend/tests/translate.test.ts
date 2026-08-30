import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { errors } from '../src/utils/errors.js';
import { StubProvider, createTestApp } from './helpers.js';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('POST /api/translate', () => {
  it('translates valid input and echoes the language pair', async () => {
    const provider = new StubProvider({ completion: 'دوبەيگە خۇش كەلدىڭىز.' });
    app = await createTestApp(provider);

    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'ug', text: 'Welcome to Dubai.' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      translation: 'دوبەيگە خۇش كەلدىڭىز.',
      sourceLanguage: 'en',
      targetLanguage: 'ug',
    });
    // One call only: an explicit source language must not trigger detection.
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]?.systemPrompt).toContain('from English into Uyghur');
  });

  it('strips a model preamble and wrapping quotes from the output', async () => {
    app = await createTestApp(
      new StubProvider({ completion: 'Here is the translation: "Welcome to Dubai."' }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'ug', targetLanguage: 'en', text: 'دوبەيگە خۇش كەلدىڭىز.' },
    });

    expect(response.json().translation).toBe('Welcome to Dubai.');
  });

  it('detects the source language when sourceLanguage is "auto"', async () => {
    const provider = new StubProvider({
      completion: (request) =>
        request.jsonMode
          ? JSON.stringify({ languageCode: 'ug', confidence: 0.96 })
          : 'How are you? How is today going?',
    });
    app = await createTestApp(provider);

    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: {
        sourceLanguage: 'auto',
        targetLanguage: 'en',
        text: 'ياخشىمۇسىز؟ بۈگۈن قانداقراق؟',
      },
    });

    const body = response.json();
    expect(response.statusCode).toBe(200);
    expect(body.sourceLanguage).toBe('ug');
    expect(body.detectedLanguage).toEqual({ code: 'ug', confidence: 0.96 });
    expect(provider.calls).toHaveLength(2);
  });

  it('rejects empty input', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'ug', text: '   ' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('EMPTY_INPUT');
  });

  it('rejects an unsupported language', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'klingon', text: 'Hello' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('UNSUPPORTED_LANGUAGE');
  });

  it('rejects identical source and target languages', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'en', text: 'Hello' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('SAME_LANGUAGE');
  });

  it('rejects text beyond MAX_TEXT_LENGTH', async () => {
    app = await createTestApp(new StubProvider(), { maxTextLength: 20 });
    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'ug', text: 'x'.repeat(50) },
    });

    expect(response.statusCode).toBe(413);
    expect(response.json().error.code).toBe('TEXT_TOO_LONG');
  });

  it('rejects a malformed body', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { text: 'Hello' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');
  });

  it('maps a provider failure to a safe message without leaking detail', async () => {
    app = await createTestApp(
      new StubProvider({
        completionError: errors.providerUnauthorized('openai responded 401: bad api key sk-live-123'),
      }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'ug', text: 'Hello' },
    });

    expect(response.statusCode).toBe(502);
    const body = response.json();
    expect(body.error.code).toBe('PROVIDER_UNAUTHORIZED');
    expect(body.error.message).toBe('The translation service is temporarily unavailable.');
    expect(response.body).not.toContain('sk-live-123');
  });

  it('maps an unexpected crash to a generic 500', async () => {
    app = await createTestApp(
      new StubProvider({ completionError: new Error('ECONNRESET at /internal/path.ts:42') }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'ug', text: 'Hello' },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    });
  });

  it('rejects an empty completion as a malformed AI response', async () => {
    app = await createTestApp(new StubProvider({ completion: '   ' }));
    const response = await app.inject({
      method: 'POST',
      url: '/api/translate',
      payload: { sourceLanguage: 'en', targetLanguage: 'ug', text: 'Hello' },
    });

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe('MALFORMED_AI_RESPONSE');
  });
});
