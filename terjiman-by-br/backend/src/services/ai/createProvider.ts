import type { AppConfig } from '../../config/env.js';
import type { AIProvider } from './AIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { MockProvider } from './MockProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';

/**
 * The only place that knows which concrete provider is in use. Adding a
 * provider means adding a class and one case here — routes, prompts and the
 * mobile app stay untouched.
 */
export function createProvider(config: AppConfig): AIProvider {
  switch (config.aiProvider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'mock':
      return new MockProvider();
  }
}
