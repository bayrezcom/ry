import { API_URL, REQUEST_TIMEOUT_MS } from '../constants/config';
import type { TranslationKey } from '../i18n';

/** Mirrors backend/src/utils/errors.ts. */
export type ApiErrorCode =
  | 'EMPTY_INPUT'
  | 'TEXT_TOO_LONG'
  | 'UNSUPPORTED_LANGUAGE'
  | 'SAME_LANGUAGE'
  | 'INVALID_REQUEST'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAUTHORIZED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_TIMEOUT'
  | 'MALFORMED_AI_RESPONSE'
  | 'AUDIO_TOO_LARGE'
  | 'AUDIO_MISSING'
  | 'TRANSCRIPTION_UNSUPPORTED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  // Client-side conditions that never reach the network.
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'CANCELLED';

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Every server and transport failure maps to a friendly, localized sentence.
 * Nothing from the provider or the server's internals is ever displayed.
 */
const ERROR_MESSAGE_KEYS: Record<ApiErrorCode, TranslationKey> = {
  EMPTY_INPUT: 'errors.emptyInput',
  TEXT_TOO_LONG: 'errors.textTooLong',
  UNSUPPORTED_LANGUAGE: 'errors.unsupportedLanguage',
  SAME_LANGUAGE: 'errors.sameLanguage',
  INVALID_REQUEST: 'errors.server',
  PROVIDER_NOT_CONFIGURED: 'errors.notConfigured',
  PROVIDER_UNAUTHORIZED: 'errors.unavailable',
  PROVIDER_RATE_LIMITED: 'errors.rateLimited',
  PROVIDER_UNAVAILABLE: 'errors.unavailable',
  PROVIDER_TIMEOUT: 'errors.timeout',
  MALFORMED_AI_RESPONSE: 'errors.malformed',
  AUDIO_TOO_LARGE: 'errors.recordingFailed',
  AUDIO_MISSING: 'errors.recordingFailed',
  TRANSCRIPTION_UNSUPPORTED: 'errors.transcriptionUnsupported',
  RATE_LIMITED: 'errors.rateLimited',
  NOT_FOUND: 'errors.server',
  INTERNAL_ERROR: 'errors.server',
  OFFLINE: 'errors.offline',
  TIMEOUT: 'errors.timeout',
  NETWORK: 'errors.offline',
  CANCELLED: 'errors.server',
};

export function errorMessageKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) return ERROR_MESSAGE_KEYS[error.code];
  return 'errors.server';
}

export interface TranslateRequest {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
  signal?: AbortSignal;
}

export interface TranslateResponse {
  translation: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: { code: string; confidence: number };
}

export interface DetectResponse {
  languageCode: string;
  languageName: string;
  confidence: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  aiConfigured: boolean;
  supportsVoiceInput: boolean;
  maxTextLength: number;
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && value in ERROR_MESSAGE_KEYS;
}

async function request<T>(
  path: string,
  init: RequestInit,
  externalSignal?: AbortSignal,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch (error) {
    // An abort is either the caller cancelling or our own timeout firing.
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(externalSignal?.aborted ? 'CANCELLED' : 'TIMEOUT');
    }
    throw new ApiError('NETWORK');
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }

  if (!response.ok) {
    let code: ApiErrorCode = 'INTERNAL_ERROR';
    try {
      const body = (await response.json()) as ErrorBody;
      if (isApiErrorCode(body.error?.code)) code = body.error.code;
    } catch {
      // A non-JSON error body means a proxy or gateway answered, not our API.
      code = response.status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR';
    }
    throw new ApiError(code);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('MALFORMED_AI_RESPONSE');
  }
}

export async function translateText(input: TranslateRequest): Promise<TranslateResponse> {
  return request<TranslateResponse>(
    '/api/translate',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        text: input.text,
      }),
    },
    input.signal,
  );
}

export async function detectLanguage(text: string, signal?: AbortSignal): Promise<DetectResponse> {
  return request<DetectResponse>(
    '/api/detect-language',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ text }),
    },
    signal,
  );
}

export interface TranscribeInput {
  uri: string;
  mimeType: string;
  fileName: string;
  languageHint?: string;
  signal?: AbortSignal;
}

export async function transcribeAudio(input: TranscribeInput): Promise<{ text: string }> {
  const form = new FormData();
  // React Native's FormData takes a file descriptor object rather than a Blob.
  form.append('audio', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob);
  if (input.languageHint) form.append('language', input.languageHint);

  return request<{ text: string }>(
    '/api/transcribe',
    { method: 'POST', body: form, headers: { accept: 'application/json' } },
    input.signal,
  );
}

export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health', { method: 'GET' }, signal, 10_000);
}
