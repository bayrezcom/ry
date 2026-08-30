export interface CompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  /** Low for translation/detection: this is not a creative task. */
  temperature?: number;
  maxOutputTokens?: number;
  /** Ask the provider for strict JSON where it supports a JSON mode. */
  jsonMode?: boolean;
  signal?: AbortSignal;
}

export interface TranscriptionRequest {
  audio: Uint8Array;
  fileName: string;
  mimeType: string;
  /** Optional ISO hint; improves accuracy when the user already picked a language. */
  languageHint?: string;
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  /** False when the provider cannot transcribe audio; routes answer 501 instead of failing late. */
  readonly supportsTranscription: boolean;
  complete(request: CompletionRequest): Promise<string>;
  transcribe(request: TranscriptionRequest): Promise<string>;
}
