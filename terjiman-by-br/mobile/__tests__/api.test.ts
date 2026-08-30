import { ApiError, detectLanguage, errorMessageKey, translateText } from '../src/services/api';

const originalFetch = global.fetch;

function mockFetch(response: {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
}): jest.Mock {
  const fn = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: response.json ?? (async () => ({})),
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('translateText', () => {
  it('posts the language pair and returns the parsed translation', async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: async () => ({
        success: true,
        translation: 'دوبەيگە خۇش كەلدىڭىز.',
        sourceLanguage: 'en',
        targetLanguage: 'ug',
      }),
    });

    const result = await translateText({
      sourceLanguage: 'en',
      targetLanguage: 'ug',
      text: 'Welcome to Dubai.',
    });

    expect(result.translation).toBe('دوبەيگە خۇش كەلدىڭىز.');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/translate');
    expect(JSON.parse(init.body as string)).toEqual({
      sourceLanguage: 'en',
      targetLanguage: 'ug',
      text: 'Welcome to Dubai.',
    });
  });

  it('surfaces the server error code', async () => {
    mockFetch({
      ok: false,
      status: 429,
      json: async () => ({ success: false, error: { code: 'PROVIDER_RATE_LIMITED' } }),
    });

    await expect(
      translateText({ sourceLanguage: 'en', targetLanguage: 'ug', text: 'Hello' }),
    ).rejects.toMatchObject({ code: 'PROVIDER_RATE_LIMITED' });
  });

  it('falls back to a generic code when the body is not our JSON', async () => {
    mockFetch({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('gateway returned HTML');
      },
    });

    await expect(
      translateText({ sourceLanguage: 'en', targetLanguage: 'ug', text: 'Hello' }),
    ).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('maps a transport failure to a network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(
      translateText({ sourceLanguage: 'en', targetLanguage: 'ug', text: 'Hello' }),
    ).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('reports a caller-initiated abort as CANCELLED', async () => {
    const controller = new AbortController();
    global.fetch = jest.fn().mockImplementation(() => {
      controller.abort();
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(
      translateText({
        sourceLanguage: 'en',
        targetLanguage: 'ug',
        text: 'Hello',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ code: 'CANCELLED' });
  });
});

describe('detectLanguage', () => {
  it('returns the detected language', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        success: true,
        languageCode: 'ug',
        languageName: 'Uyghur',
        confidence: 0.97,
      }),
    });

    await expect(detectLanguage('ياخشىمۇسىز؟')).resolves.toMatchObject({
      languageCode: 'ug',
      confidence: 0.97,
    });
  });
});

describe('errorMessageKey', () => {
  it('maps every API error code to a user-facing message key', () => {
    const codes = [
      'EMPTY_INPUT',
      'TEXT_TOO_LONG',
      'UNSUPPORTED_LANGUAGE',
      'SAME_LANGUAGE',
      'PROVIDER_NOT_CONFIGURED',
      'PROVIDER_UNAVAILABLE',
      'PROVIDER_RATE_LIMITED',
      'MALFORMED_AI_RESPONSE',
      'TRANSCRIPTION_UNSUPPORTED',
      'OFFLINE',
      'TIMEOUT',
      'NETWORK',
    ] as const;

    for (const code of codes) {
      const key = errorMessageKey(new ApiError(code));
      expect(key).toMatch(/^errors\./);
    }
  });

  it('falls back to the generic message for unknown failures', () => {
    expect(errorMessageKey(new Error('boom'))).toBe('errors.server');
  });
});
