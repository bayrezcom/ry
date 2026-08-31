import 'dotenv/config';

export type AiProviderName = 'openai' | 'anthropic' | 'mock';

function readString(key: string, fallback: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') return fallback;
  return value.trim();
}

function readInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer, received "${raw}".`);
  }
  return parsed;
}

function readBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

function readProvider(): AiProviderName {
  const raw = readString('AI_PROVIDER', 'openai').toLowerCase();
  if (raw === 'openai' || raw === 'anthropic' || raw === 'mock') return raw;
  throw new Error(`Unsupported AI_PROVIDER "${raw}". Use one of: openai, anthropic, mock.`);
}

/**
 * Default model per provider. Kept out of the mobile app on purpose: the client
 * never learns which model or provider serves a translation.
 */
const DEFAULT_MODELS: Record<AiProviderName, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-5',
  mock: 'mock-translator',
};

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  aiProvider: AiProviderName;
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string | undefined;
  aiTranscribeModel: string;
  aiTimeoutMs: number;
  maxTextLength: number;
  maxAudioBytes: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  corsOrigin: string;
  logLevel: string;
  trustProxy: boolean;
}

export function loadConfig(): AppConfig {
  const aiProvider = readProvider();
  return {
    port: readInt('PORT', 3000),
    host: readString('HOST', '0.0.0.0'),
    nodeEnv: readString('NODE_ENV', 'development'),
    aiProvider,
    aiModel: readString('AI_MODEL', DEFAULT_MODELS[aiProvider]),
    aiApiKey: readString('AI_API_KEY', ''),
    aiBaseUrl: process.env.AI_BASE_URL?.trim() || undefined,
    aiTranscribeModel: readString('AI_TRANSCRIBE_MODEL', 'whisper-1'),
    aiTimeoutMs: readInt('AI_TIMEOUT_MS', 60_000),
    maxTextLength: readInt('MAX_TEXT_LENGTH', 5000),
    maxAudioBytes: readInt('MAX_AUDIO_BYTES', 10 * 1024 * 1024),
    rateLimitMax: readInt('RATE_LIMIT_MAX', 60),
    rateLimitWindowMs: readInt('RATE_LIMIT_WINDOW_MS', 60_000),
    corsOrigin: readString('CORS_ORIGIN', '*'),
    logLevel: readString('LOG_LEVEL', 'info'),
    trustProxy: readBool('TRUST_PROXY', true),
  };
}
