import type { AIProvider, CompletionRequest } from './AIProvider.js';

/**
 * Test/offline harness only — enabled exclusively by AI_PROVIDER=mock, never a
 * fallback. It returns clearly-marked placeholder text so a misconfigured
 * deployment can never be mistaken for a working translator.
 */
export class MockProvider implements AIProvider {
  readonly name = 'mock';
  readonly model = 'mock-translator';
  readonly supportsTranscription = true;

  async complete(request: CompletionRequest): Promise<string> {
    if (request.jsonMode) {
      return JSON.stringify({ languageCode: 'en', confidence: 0.5 });
    }
    return `[mock] ${request.userPrompt}`;
  }

  async transcribe(): Promise<string> {
    return '[mock transcript]';
  }
}
