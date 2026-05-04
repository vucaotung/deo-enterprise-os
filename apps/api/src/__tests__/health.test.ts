import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { buildApp } from '../app.js';

const fakePool = {
  query: vi.fn().mockResolvedValue({ rows: [{ ok: 1 }] }),
  on: vi.fn(),
} as unknown as import('pg').Pool;

const fakeRedis = {
  ping: vi.fn().mockResolvedValue('PONG'),
} as unknown as import('ioredis').Redis;

const fakeLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => fakeLogger),
} as unknown as import('../lib/logger.js').Logger;

const buildTestApp = () =>
  buildApp({
    logger: fakeLogger,
    pool: fakePool,
    redis: fakeRedis,
    startedAt: new Date(),
    hookSecret: 'test-hook-secret-32chars-padding!',
  });

describe('GET /health', () => {
  it('returns 200 with success envelope', async () => {
    const res = await request(buildTestApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptimeSec).toBe('number');
  });

  it('echoes correlation ID when provided', async () => {
    const res = await request(buildTestApp())
      .get('/health')
      .set('X-Correlation-ID', 'test-corr-1');
    expect(res.headers['x-correlation-id']).toBe('test-corr-1');
  });

  it('generates correlation ID when missing', async () => {
    const res = await request(buildTestApp()).get('/health');
    expect(res.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('GET /ready', () => {
  it('returns 200 when DB + Redis both ok', async () => {
    const res = await request(buildTestApp()).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ready');
    expect(res.body.data.checks).toEqual({ db: true, redis: true });
  });

  it('returns 503 when DB fails', async () => {
    const failPool = {
      query: vi.fn().mockRejectedValue(new Error('db down')),
      on: vi.fn(),
    } as unknown as import('pg').Pool;
    const app = buildApp({
      logger: fakeLogger,
      pool: failPool,
      redis: fakeRedis,
      startedAt: new Date(),
      hookSecret: 'test-hook-secret-32chars-padding!',
    });
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.checks.db).toBe(false);
  });
});
