import type { AppConfig } from '../../config/env.js';
import { errors } from '../../utils/errors.js';
import type { AIProvider, CompletionRequest } from './AIProvider.js';
import { fetchWithTimeout, mapProviderHttpError, mapProviderNetworkError } from './httpErrors.js';

interface MessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
}

const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly model: string;
  /** The Messages API has no audio input; /api/transcribe answers 501 instead. */
  readonly supportsTranscription = false;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: AppConfig) {
    if (!config.aiApiKey) throw errors.providerNotConfigured();
    this.apiKey = config.aiApiKey;
    this.model = config.aiModel;
    this.baseUrl = (config.aiBaseUrl ?? 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    this.timeoutMs = config.aiTimeoutMs;
  }

  async complete(request: CompletionRequest): Promise<string> {
    // Anthropic has no JSON response mode; prefilling the assistant turn with
    // "{" is the documented way to force a bare JSON object.
    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: request.userPrompt },
    ];
    if (request.jsonMode) messages.push({ role: 'assistant', content: '{' });

    const body = {
      model: this.model,
      system: request.systemPrompt,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxOutputTokens ?? 4096,
      messages,
    };

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${this.baseUrl}/messages`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
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
      let text = '<unreadable body>';
      try {
        text = await response.text();
      } catch {
        /* keep placeholder */
      }
      throw mapProviderHttpError(this.name, response.status, text);
    }

    let parsed: MessagesResponse;
    try {
      parsed = (await response.json()) as MessagesResponse;
    } catch (error) {
      throw errors.malformedAiResponse(`anthropic returned non-JSON: ${String(error)}`);
    }

    const text = (parsed.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('');

    if (text.trim() === '') {
      throw errors.malformedAiResponse('anthropic returned an empty completion.');
    }
    // Re-attach the prefilled brace so the caller receives a complete JSON object.
    return request.jsonMode ? `{${text}` : text;
  }

  async transcribe(): Promise<string> {
    throw errors.transcriptionUnsupported();
  }
}
