import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError, errors, isAppError } from '../utils/errors.js';

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  const withCode = error as { statusCode?: number; code?: string; message?: string };

  if (withCode?.code === 'FST_ERR_VALIDATION' || withCode?.statusCode === 400) {
    return errors.invalidRequest('The request was not valid.');
  }
  if (withCode?.statusCode === 429) {
    return new AppError('RATE_LIMITED', 429, 'Too many requests. Please slow down.');
  }
  if (withCode?.statusCode === 404) return errors.notFound();
  if (withCode?.statusCode === 413 || withCode?.code === 'FST_REQ_FILE_TOO_LARGE') {
    return errors.audioTooLarge();
  }

  return errors.internal(withCode?.message);
}

/**
 * Single exit point for every failure. Stack traces, provider bodies and
 * credential-bearing messages stay in the server log; the client only ever
 * sees a stable code plus a safe sentence.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    const appError = toAppError(error);

    const logPayload = {
      code: appError.code,
      statusCode: appError.statusCode,
      detail: appError.logDetail,
      route: request.url,
      method: request.method,
      err: error instanceof Error ? error : undefined,
    };

    if (appError.statusCode >= 500) {
      request.log.error(logPayload, 'request failed');
    } else {
      request.log.warn(logPayload, 'request rejected');
    }

    const body: ApiErrorBody = {
      success: false,
      error: { code: appError.code, message: appError.message },
    };
    void reply.status(appError.statusCode).send(body);
  });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const body: ApiErrorBody = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
    };
    void reply.status(404).send(body);
  });
}
