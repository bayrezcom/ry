import type { AppConfig } from '../config/env.js';
import { AUTO_DETECT_CODE, findLanguage, isSupportedLanguage } from '../config/languages.js';
import {
  DETECTION_SYSTEM_PROMPT,
  buildTranslationSystemPrompt,
  buildTranslationUserPrompt,
} from '../prompts/translator.js';
import { errors } from '../utils/errors.js';
import type { AIProvider } from './ai/AIProvider.js';
import { refineDetectedLanguage } from './scriptHeuristics.js';
import { cleanTranslationOutput, extractJsonObject } from './textCleanup.js';

export interface TranslateInput {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
  formality?: 'default' | 'formal' | 'informal';
  signal?: AbortSignal;
}

export interface TranslateResult {
  translation: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: { code: string; confidence: number };
}

export interface DetectResult {
  languageCode: string;
  languageName: string;
  confidence: number;
}

/** Detection is short and cheap; cap it so a runaway model cannot bill us. */
const DETECTION_MAX_TOKENS = 64;
const DETECTION_SAMPLE_LENGTH = 600;

export class TranslationService {
  constructor(
    private readonly provider: AIProvider,
    private readonly config: AppConfig,
  ) {}

  private assertText(text: string): string {
    const trimmed = text.trim();
    if (trimmed === '') throw errors.emptyInput();
    if (trimmed.length > this.config.maxTextLength) {
      throw errors.textTooLong(this.config.maxTextLength);
    }
    return trimmed;
  }

  async detect(text: string, signal?: AbortSignal): Promise<DetectResult> {
    const trimmed = this.assertText(text);
    const sample = trimmed.slice(0, DETECTION_SAMPLE_LENGTH);

    const raw = await this.provider.complete({
      systemPrompt: DETECTION_SYSTEM_PROMPT,
      userPrompt: sample,
      temperature: 0,
      maxOutputTokens: DETECTION_MAX_TOKENS,
      jsonMode: true,
      signal,
    });

    const parsed = extractJsonObject(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      throw errors.malformedAiResponse(`detection returned unparsable output: ${raw.slice(0, 200)}`);
    }

    const candidate = (parsed as { languageCode?: unknown }).languageCode;
    if (typeof candidate !== 'string' || !isSupportedLanguage(candidate)) {
      throw errors.malformedAiResponse(
        `detection returned an unknown language code: ${String(candidate)}`,
      );
    }

    const rawConfidence = (parsed as { confidence?: unknown }).confidence;
    const confidence =
      typeof rawConfidence === 'number' && Number.isFinite(rawConfidence)
        ? Math.min(1, Math.max(0, rawConfidence))
        : 0.5;

    const code = refineDetectedLanguage(candidate, trimmed);
    const language = findLanguage(code);
    return {
      languageCode: code,
      languageName: language?.englishName ?? code,
      // Script evidence overrode the model, so report the corrected result confidently.
      confidence: code === candidate ? confidence : Math.max(confidence, 0.9),
    };
  }

  async translate(input: TranslateInput): Promise<TranslateResult> {
    const text = this.assertText(input.text);

    if (input.sourceLanguage !== AUTO_DETECT_CODE && !isSupportedLanguage(input.sourceLanguage)) {
      throw errors.unsupportedLanguage(input.sourceLanguage);
    }
    if (!isSupportedLanguage(input.targetLanguage)) {
      throw errors.unsupportedLanguage(input.targetLanguage);
    }
    if (input.sourceLanguage === input.targetLanguage) {
      throw errors.sameLanguage();
    }

    let detected: DetectResult | undefined;
    let effectiveSource = input.sourceLanguage;

    if (input.sourceLanguage === AUTO_DETECT_CODE) {
      detected = await this.detect(text, input.signal);
      // Detecting the target language itself would make the translation a no-op;
      // keep "auto" in the prompt and let the model handle the mixed case.
      effectiveSource =
        detected.languageCode === input.targetLanguage ? AUTO_DETECT_CODE : detected.languageCode;
    }

    const raw = await this.provider.complete({
      systemPrompt: buildTranslationSystemPrompt({
        sourceLanguage: effectiveSource,
        targetLanguage: input.targetLanguage,
        formality: input.formality,
      }),
      userPrompt: buildTranslationUserPrompt(text),
      temperature: 0.2,
      signal: input.signal,
    });

    const translation = cleanTranslationOutput(raw, text);
    if (translation === '') {
      throw errors.malformedAiResponse('translation was empty after cleanup.');
    }

    return {
      translation,
      sourceLanguage: detected?.languageCode ?? input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      ...(detected
        ? { detectedLanguage: { code: detected.languageCode, confidence: detected.confidence } }
        : {}),
    };
  }

  async transcribe(params: {
    audio: Uint8Array;
    fileName: string;
    mimeType: string;
    languageHint?: string;
    signal?: AbortSignal;
  }): Promise<{ text: string }> {
    if (!this.provider.supportsTranscription) throw errors.transcriptionUnsupported();
    if (params.audio.byteLength === 0) throw errors.audioMissing();
    if (params.audio.byteLength > this.config.maxAudioBytes) throw errors.audioTooLarge();

    const hint =
      params.languageHint && params.languageHint !== AUTO_DETECT_CODE
        ? params.languageHint
        : undefined;

    const text = await this.provider.transcribe({
      audio: params.audio,
      fileName: params.fileName,
      mimeType: params.mimeType,
      ...(hint ? { languageHint: hint } : {}),
      ...(params.signal ? { signal: params.signal } : {}),
    });

    return { text: text.trim() };
  }
}
