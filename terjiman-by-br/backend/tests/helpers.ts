import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';
import type { AIProvider, CompletionRequest, TranscriptionRequest } from '../src/services/ai/AIProvider.js';

export const testConfig: AppConfig = {
  port: 0,
  host: '127.0.0.1',
  nodeEnv: 'test',
  aiProvider: 'openai',
  aiModel: 'test-model',
  aiApiKey: 'test-key',
  aiBaseUrl: undefined,
  aiTranscribeModel: 'whisper-1',
  aiTimeoutMs: 5_000,
  maxTextLength: 5000,
  maxAudioBytes: 1024 * 1024,
  rateLimitMax: 1000,
  rateLimitWindowMs: 60_000,
  corsOrigin: '*',
  logLevel: 'silent',
  trustProxy: false,
};

export interface StubOptions {
  completion?: string | ((request: CompletionRequest) => string);
  completionError?: Error;
  transcript?: string;
  supportsTranscription?: boolean;
}

export class StubProvider implements AIProvider {
  readonly name = 'stub';
  readonly model = 'stub-model';
  readonly supportsTranscription: boolean;
  readonly calls: CompletionRequest[] = [];

  constructor(private readonly options: StubOptions = {}) {
    this.supportsTranscription = options.supportsTranscription ?? true;
  }

  async complete(request: CompletionRequest): Promise<string> {
    this.calls.push(request);
    if (this.options.completionError) throw this.options.completionError;
    const value = this.options.completion ?? 'stub translation';
    return typeof value === 'function' ? value(request) : value;
  }

  async transcribe(_request: TranscriptionRequest): Promise<string> {
    return this.options.transcript ?? 'stub transcript';
  }
}

export async function createTestApp(
  provider: AIProvider,
  overrides: Partial<AppConfig> = {},
): Promise<FastifyInstance> {
  return buildApp({ config: { ...testConfig, ...overrides }, provider });
}
