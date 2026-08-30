import { AppError, errors } from '../../utils/errors.js';

/**
 * Maps a provider HTTP failure onto our own error vocabulary. The provider's
 * body is kept as log detail only, so upstream messages (which can echo key
 * fragments or account information) never reach the client.
 */
export function mapProviderHttpError(
  providerName: string,
  status: number,
  body: string,
): AppError {
  const detail = `${providerName} responded ${status}: ${body.slice(0, 500)}`;
  if (status === 401 || status === 403) return errors.providerUnauthorized(detail);
  if (status === 429) return errors.providerRateLimited(detail);
  if (status === 408 || status === 504) return errors.providerTimeout(detail);
  return errors.providerUnavailable(detail);
}

export function mapProviderNetworkError(providerName: string, error: unknown): AppError {
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return errors.providerTimeout(`${providerName} request aborted after timeout.`);
  }
  const message = error instanceof Error ? error.message : String(error);
  return errors.providerUnavailable(`${providerName} network error: ${message}`);
}

/** Fetch with a hard timeout that also honours a caller-supplied abort signal. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
