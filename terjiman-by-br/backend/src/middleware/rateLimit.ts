import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/env.js';

/**
 * In-memory limiter keyed by client IP. Adequate for a single-container
 * deployment; swap in the plugin's Redis store when the backend is scaled out.
 */
export async function registerRateLimit(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    // Health checks come from uptime monitors and must never be throttled.
    allowList: (request) => request.url === '/api/health' || request.url === '/api/languages',
    keyGenerator: (request) => request.ip,
    addHeadersOnExceeding: { 'x-ratelimit-remaining': true },
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down and try again shortly.',
      },
    }),
  });
}
