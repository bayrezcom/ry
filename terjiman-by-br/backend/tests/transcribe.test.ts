import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { StubProvider, createTestApp } from './helpers.js';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

const BOUNDARY = '----terjimantest';

function multipartBody(parts: {
  audio?: Buffer;
  fileName?: string;
  mimeType?: string;
  language?: string;
}): Buffer {
  const chunks: Buffer[] = [];
  if (parts.audio) {
    chunks.push(
      Buffer.from(
        `--${BOUNDARY}\r\n` +
          `Content-Disposition: form-data; name="audio"; filename="${parts.fileName ?? 'recording.m4a'}"\r\n` +
          `Content-Type: ${parts.mimeType ?? 'audio/m4a'}\r\n\r\n`,
      ),
      parts.audio,
      Buffer.from('\r\n'),
    );
  }
  if (parts.language) {
    chunks.push(
      Buffer.from(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${parts.language}\r\n`,
      ),
    );
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));
  return Buffer.concat(chunks);
}

describe('POST /api/transcribe', () => {
  it('returns the transcript for an uploaded recording', async () => {
    app = await createTestApp(new StubProvider({ transcript: '  ياخشىمۇسىز؟  ' }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody({ audio: Buffer.alloc(2048, 1), language: 'ug' }),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true, text: 'ياخشىمۇسىز؟' });
  });

  it('rejects a request with no audio part', async () => {
    app = await createTestApp(new StubProvider());

    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody({ language: 'ug' }),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('AUDIO_MISSING');
  });

  it('rejects a non-multipart request', async () => {
    app = await createTestApp(new StubProvider());

    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      payload: { audio: 'not-a-file' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_REQUEST');
  });

  it('answers 501 when the configured provider cannot transcribe', async () => {
    app = await createTestApp(new StubProvider({ supportsTranscription: false }));

    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody({ audio: Buffer.alloc(512, 1) }),
    });

    expect(response.statusCode).toBe(501);
    expect(response.json().error.code).toBe('TRANSCRIPTION_UNSUPPORTED');
  });

  it('rejects a recording over the size limit', async () => {
    app = await createTestApp(new StubProvider(), { maxAudioBytes: 1024 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: multipartBody({ audio: Buffer.alloc(4096, 1) }),
    });

    expect(response.statusCode).toBe(413);
    expect(response.json().error.code).toBe('AUDIO_TOO_LARGE');
  });
});
