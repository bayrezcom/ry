import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/env.js';
import { LANGUAGES } from '../config/languages.js';

const startedAt = Date.now();

export interface HealthBody {
  success: true;
  status: 'ok' | 'degraded';
  version: string;
  uptimeSeconds: number;
  /** Whether an AI key is present. The key, provider and model are never exposed. */
  aiConfigured: boolean;
  supportsVoiceInput: boolean;
  maxTextLength: number;
  languages: number;
}

export async function registerHealthRoutes(
  app: FastifyInstance,
  config: AppConfig,
  status: { aiConfigured: boolean; supportsVoiceInput: boolean },
): Promise<void> {
  app.get('/api/health', async (): Promise<HealthBody> => {
    return {
      success: true,
      status: status.aiConfigured ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '1.0.0',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      aiConfigured: status.aiConfigured,
      supportsVoiceInput: status.supportsVoiceInput,
      maxTextLength: config.maxTextLength,
      languages: LANGUAGES.length,
    };
  });

  // Lets the mobile app discover server-side language support without shipping
  // a second copy of the list in an update.
  app.get('/api/languages', async () => ({ success: true as const, languages: LANGUAGES }));
}
