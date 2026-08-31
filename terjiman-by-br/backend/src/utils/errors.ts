/**
 * Error codes are part of the public API contract: the mobile app maps them to
 * localized, friendly messages. Provider detail never crosses this boundary.
 */
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
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  /** Free-form detail for server logs only — never serialized to the client. */
  readonly logDetail?: string;

  constructor(code: ApiErrorCode, statusCode: number, message: string, logDetail?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.logDetail = logDetail;
  }
}

export const errors = {
  emptyInput: () => new AppError('EMPTY_INPUT', 400, 'Text to translate is empty.'),
  textTooLong: (max: number) =>
    new AppError('TEXT_TOO_LONG', 413, `Text exceeds the ${max} character limit.`),
  unsupportedLanguage: (code: string) =>
    new AppError('UNSUPPORTED_LANGUAGE', 400, `Language "${code}" is not supported.`),
  sameLanguage: () =>
    new AppError('SAME_LANGUAGE', 400, 'Source and target languages are the same.'),
  invalidRequest: (message: string) => new AppError('INVALID_REQUEST', 400, message),
  providerNotConfigured: () =>
    new AppError(
      'PROVIDER_NOT_CONFIGURED',
      503,
      'The translation service is not configured yet.',
      'AI_API_KEY is missing or empty.',
    ),
  providerUnauthorized: (detail?: string) =>
    new AppError(
      'PROVIDER_UNAUTHORIZED',
      502,
      'The translation service is temporarily unavailable.',
      detail,
    ),
  providerRateLimited: (detail?: string) =>
    new AppError(
      'PROVIDER_RATE_LIMITED',
      429,
      'Too many translations right now. Please try again in a moment.',
      detail,
    ),
  providerUnavailable: (detail?: string) =>
    new AppError(
      'PROVIDER_UNAVAILABLE',
      502,
      'The translation service is temporarily unavailable.',
      detail,
    ),
  providerTimeout: (detail?: string) =>
    new AppError('PROVIDER_TIMEOUT', 504, 'The translation took too long. Please try again.', detail),
  malformedAiResponse: (detail?: string) =>
    new AppError(
      'MALFORMED_AI_RESPONSE',
      502,
      'The translation could not be read. Please try again.',
      detail,
    ),
  audioTooLarge: () => new AppError('AUDIO_TOO_LARGE', 413, 'The recording is too large.'),
  audioMissing: () => new AppError('AUDIO_MISSING', 400, 'No audio file was received.'),
  transcriptionUnsupported: () =>
    new AppError(
      'TRANSCRIPTION_UNSUPPORTED',
      501,
      'Voice input is not available on this server.',
    ),
  notFound: () => new AppError('NOT_FOUND', 404, 'Endpoint not found.'),
  internal: (detail?: string) =>
    new AppError('INTERNAL_ERROR', 500, 'Something went wrong. Please try again.', detail),
};

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
