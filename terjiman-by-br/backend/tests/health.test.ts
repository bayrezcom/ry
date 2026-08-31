import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { StubProvider, createTestApp } from './helpers.js';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /api/health', () => {
  it('reports ok and never exposes provider credentials', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('ok');
    expect(body.aiConfigured).toBe(true);
    expect(body.maxTextLength).toBe(5000);
    expect(body.languages).toBeGreaterThan(10);
    expect(response.body).not.toContain('test-key');
    expect(response.body).not.toContain('test-model');
  });
});

describe('GET /api/languages', () => {
  it('returns the full supported language list', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({ method: 'GET', url: '/api/languages' });

    expect(response.statusCode).toBe(200);
    const { languages } = response.json();
    const uyghur = languages.find((language: { code: string }) => language.code === 'ug');
    expect(uyghur).toMatchObject({ englishName: 'Uyghur', direction: 'rtl', name: 'ئۇيغۇرچە' });
  });
});

describe('unknown routes', () => {
  it('returns a structured 404', async () => {
    app = await createTestApp(new StubProvider());
    const response = await app.inject({ method: 'GET', url: '/api/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });
});
