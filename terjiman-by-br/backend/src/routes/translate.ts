import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppConfig } from '../config/env.js';
import type { TranslationService } from '../services/TranslationService.js';
import { errors } from '../utils/errors.js';

const bodySchema = z.object({
  sourceLanguage: z.string().min(1).max(16),
  targetLanguage: z.string().min(1).max(16),
  text: z.string(),
  formality: z.enum(['default', 'formal', 'informal']).optional(),
});

export async function registerTranslateRoute(
  app: FastifyInstance,
  config: AppConfig,
  getService: () => TranslationService,
): Promise<void> {
  app.post('/api/translate', async (request) => {
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw errors.invalidRequest(
        'sourceLanguage, targetLanguage and text are required fields.',
      );
    }

    // Guard the payload before it reaches the provider so oversized requests
    // never cost an upstream call.
    if (parsed.data.text.length > config.maxTextLength) {
      throw errors.textTooLong(config.maxTextLength);
    }

    const result = await getService().translate({
      sourceLanguage: parsed.data.sourceLanguage,
      targetLanguage: parsed.data.targetLanguage,
      text: parsed.data.text,
      ...(parsed.data.formality ? { formality: parsed.data.formality } : {}),
    });

    return {
      success: true as const,
      translation: result.translation,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      ...(result.detectedLanguage ? { detectedLanguage: result.detectedLanguage } : {}),
    };
  });
}
