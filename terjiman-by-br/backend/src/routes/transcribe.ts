import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/env.js';
import { isSupportedLanguage } from '../config/languages.js';
import type { TranslationService } from '../services/TranslationService.js';
import { errors } from '../utils/errors.js';

const DEFAULT_MIME = 'audio/m4a';

/**
 * Accepts multipart/form-data with a single `audio` file part and an optional
 * `language` field. Audio is streamed into memory, forwarded to the provider
 * and dropped — nothing is written to disk.
 */
export async function registerTranscribeRoute(
  app: FastifyInstance,
  config: AppConfig,
  getService: () => TranslationService,
): Promise<void> {
  app.post('/api/transcribe', async (request) => {
    if (!request.isMultipart()) {
      throw errors.invalidRequest('Send the recording as multipart/form-data with an "audio" file.');
    }

    let audio: Buffer | undefined;
    let fileName = 'recording.m4a';
    let mimeType = DEFAULT_MIME;
    let languageHint: string | undefined;

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (part.fieldname !== 'audio') {
          // Drain unexpected file parts so the request stream can finish.
          await part.toBuffer();
          continue;
        }
        audio = await part.toBuffer();
        if (part.filename) fileName = part.filename;
        if (part.mimetype) mimeType = part.mimetype;
      } else if (part.fieldname === 'language' && typeof part.value === 'string') {
        languageHint = part.value;
      }
    }

    if (!audio || audio.byteLength === 0) throw errors.audioMissing();
    if (languageHint && languageHint !== 'auto' && !isSupportedLanguage(languageHint)) {
      throw errors.unsupportedLanguage(languageHint);
    }
    if (audio.byteLength > config.maxAudioBytes) throw errors.audioTooLarge();

    const result = await getService().transcribe({
      audio: new Uint8Array(audio),
      fileName,
      mimeType,
      ...(languageHint ? { languageHint } : {}),
    });

    return { success: true as const, text: result.text };
  });
}
