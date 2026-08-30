import type { AppConfig } from '../../config/env.js';
import { errors } from '../../utils/errors.js';
import type { AIProvider, CompletionRequest, TranscriptionRequest } from './AIProvider.js';
import { fetchWithTimeout, mapProviderHttpError, mapProviderNetworkError } from './httpErrors.js';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

interface TranscriptionResponse {
  text?: string;
}

/**
 * Talks to the OpenAI REST API directly. Using fetch rather than the SDK keeps
 * the image small and means switching providers never drags an unused SDK in.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly model: string;
  readonly supportsTranscription = true;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly transcribeModel: string;

  constructor(config: AppConfig) {
    if (!config.aiApiKey) throw errors.providerNotConfigured();
    this.apiKey = config.aiApiKey;
    this.model = config.aiModel;
    this.baseUrl = (config.aiBaseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.timeoutMs = config.aiTimeoutMs;
    this.transcribeModel = config.aiTranscribeModel;
  }

  async complete(request: CompletionRequest): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxOutputTokens ?? 4096,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
    };
    if (request.jsonMode) body.response_format = { type: 'json_object' };

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        },
        this.timeoutMs,
        request.signal,
      );
    } catch (error) {
      throw mapProviderNetworkError(this.name, error);
    }

    if (!response.ok) {
      throw mapProviderHttpError(this.name, response.status, await safeText(response));
    }

    let parsed: ChatCompletionResponse;
    try {
      parsed = (await response.json()) as ChatCompletionResponse;
    } catch (error) {
      throw errors.malformedAiResponse(`openai returned non-JSON: ${String(error)}`);
    }

    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      throw errors.malformedAiResponse('openai returned an empty completion.');
    }
    return content;
  }

  async transcribe(request: TranscriptionRequest): Promise<string> {
    const form = new FormData();
    form.append('model', this.transcribeModel);
    form.append(
      'file',
      new Blob([new Uint8Array(request.audio)], { type: request.mimeType }),
      request.fileName,
    );
    if (request.languageHint) form.append('language', request.languageHint);

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${this.baseUrl}/audio/transcriptions`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${this.apiKey}` },
          body: form,
        },
        this.timeoutMs,
        request.signal,
      );
    } catch (error) {
      throw mapProviderNetworkError(this.name, error);
    }

    if (!response.ok) {
      throw mapProviderHttpError(this.name, response.status, await safeText(response));
    }

    let parsed: TranscriptionResponse;
    try {
      parsed = (await response.json()) as TranscriptionResponse;
    } catch (error) {
      throw errors.malformedAiResponse(`openai transcription returned non-JSON: ${String(error)}`);
    }

    if (typeof parsed.text !== 'string') {
      throw errors.malformedAiResponse('openai transcription returned no text.');
    }
    return parsed.text;
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable body>';
  }
}
