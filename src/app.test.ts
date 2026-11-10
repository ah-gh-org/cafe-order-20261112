import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { fixedClock } from './domain/clock.js';
import { createInMemoryRepositories } from './repositories/index.js';
import { createTestApp } from './testing/testApp.js';

describe('GET /health', () => {
  it('200 { status: "ok" } を返す', async () => {
    const res = await request(createTestApp().app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('エラー処理', () => {
  it('未定義の API は 404 NOT_FOUND（JSON）', async () => {
    const res = await request(createTestApp().app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route not found: GET /api/unknown', details: {} },
    });
  });

  it('不正な JSON は 400 VALIDATION_ERROR', async () => {
    const res = await request(createTestApp().app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send('{"items": [');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('静的ファイル配信', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cafe-order-static-'));
  writeFileSync(join(dir, 'index.html'), '<h1>Bean &amp; Byte Café</h1>');
  const app = createApp({
    clock: fixedClock('2026-04-01T01:00:00.000Z'),
    repositories: createInMemoryRepositories(),
    staticDir: dir,
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('staticDir の index.html を配信する', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Bean &amp; Byte Café');
  });

  it('存在しないファイルは 404 NOT_FOUND', async () => {
    const res = await request(app).get('/missing.txt');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
