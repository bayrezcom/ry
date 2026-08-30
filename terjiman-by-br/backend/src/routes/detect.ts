import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppConfig } from '../config/env.js';
import type { TranslationService } from '../services/TranslationService.js';
import { errors } from '../utils/errors.js';

const bodySchema = z.object({ text: z.string() });

export async function registerDetectRoute(
  app: FastifyInstance,
  config: AppConfig,
  getService: () => TranslationService,
): Promise<void> {
  app.post('/api/detect-language', async (request) => {
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) throw errors.invalidRequest('text is a required field.');
    if (parsed.data.text.length > config.maxTextLength) {
      throw errors.textTooLong(config.maxTextLength);
    }

    const result = await getService().detect(parsed.data.text);
    return {
      success: true as const,
      languageCode: result.languageCode,
      languageName: result.languageName,
      confidence: result.confidence,
    };
  });
}
