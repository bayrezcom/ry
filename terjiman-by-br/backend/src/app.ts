import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config/env.js';
import { registerErrorHandler } from './middleware/errorHandler.js';
import { registerRateLimit } from './middleware/rateLimit.js';
import { registerDetectRoute } from './routes/detect.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerTranscribeRoute } from './routes/transcribe.js';
import { registerTranslateRoute } from './routes/translate.js';
import { TranslationService } from './services/TranslationService.js';
import type { AIProvider } from './services/ai/AIProvider.js';
import { createProvider } from './services/ai/createProvider.js';

export interface BuildAppOptions {
  config: AppConfig;
  /** Injected in tests; production builds the provider from config. */
  provider?: AIProvider;
}

function parseCorsOrigin(value: string): string[] | boolean {
  if (value === '*') return true;
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : false;
}

export async function buildApp({ config, provider }: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      // Keys can only ever appear in headers we set ourselves, but redact
      // defensively so a future logging change cannot leak one.
      redact: {
        paths: ['req.headers.authorization', 'req.headers["x-api-key"]'],
        censor: '[redacted]',
      },
    },
    trustProxy: config.trustProxy,
    bodyLimit: Math.max(config.maxTextLength * 4 + 4096, 1024 * 1024),
  });

  registerErrorHandler(app);

  await app.register(cors, {
    origin: parseCorsOrigin(config.corsOrigin),
    methods: ['GET', 'POST', 'OPTIONS'],
    maxAge: 86_400,
  });

  await app.register(multipart, {
    limits: { fileSize: config.maxAudioBytes, files: 1, fields: 4 },
  });

  await registerRateLimit(app, config);

  /**
   * The provider is created on first use rather than at boot: a server missing
   * AI_API_KEY still starts, serves /api/health as "degraded" and returns a
   * clean PROVIDER_NOT_CONFIGURED on translate calls.
   */
  let cachedProvider: AIProvider | undefined = provider;
  let cachedService: TranslationService | undefined;

  const getService = (): TranslationService => {
    if (!cachedService) {
      cachedProvider ??= createProvider(config);
      cachedService = new TranslationService(cachedProvider, config);
    }
    return cachedService;
  };

  const aiConfigured = provider !== undefined || config.aiApiKey !== '' || config.aiProvider === 'mock';
  const supportsVoiceInput = aiConfigured && config.aiProvider !== 'anthropic';

  await registerHealthRoutes(app, config, { aiConfigured, supportsVoiceInput });
  await registerTranslateRoute(app, config, getService);
  await registerDetectRoute(app, config, getService);
  await registerTranscribeRoute(app, config, getService);

  return app;
}
