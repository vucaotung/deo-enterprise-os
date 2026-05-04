import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { buildApp } from '../app.js';

const SECRET = 'test-hook-secret-32chars-padding!';

const makeFakes = () => {
  const pool = {
    query: vi.fn().mockResolvedValue({ rows: [{ ok: 1 }] }),
    on: vi.fn(),
  } as unknown as import('pg').Pool;
  const redis = {
    ping: vi.fn().mockResolvedValue('PONG'),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  } as unknown as import('ioredis').Redis;
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  } as unknown as import('../lib/logger.js').Logger;
  return { pool, redis, logger };
};

const buildTestApp = (overrides: Partial<ReturnType<typeof makeFakes>> = {}) => {
  const fakes = { ...makeFakes(), ...overrides };
  return {
    app: buildApp({
      ...fakes,
      startedAt: new Date(),
      hookSecret: SECRET,
    }),
    fakes,
  };
};

describe('hook auth', () => {
  it('rejects request without X-Hook-Secret', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/hooks/before-chat').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects request with wrong secret', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/hooks/before-chat')
      .set('X-Hook-Secret', 'wrong-secret-123-padding-padding!')
      .send({});
    expect(res.status).toBe(401);
  });
});

const validBeforeChat = (overrides: Record<string, unknown> = {}) => ({
  hookType: 'before_chat',
  agentId: 'office-agent',
  userId: 'zl_12345',
  channel: 'zalo',
  message: 'soạn hợp đồng',
  timestamp: '2026-05-04T03:00:00Z',
  ...overrides,
});

describe('POST /hooks/before-chat', () => {
  it('returns block=false for unknown user during work hours', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T03:00:00Z')); // 10:00 VN, Mon
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/hooks/before-chat')
      .set('X-Hook-Secret', SECRET)
      .send(validBeforeChat());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.block).toBe(false);
    expect(res.body.data.inject).toBeUndefined();
    vi.useRealTimers();
  });

  it('blocks restricted agent during off-hours', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-03T15:00:00Z')); // 22:00 VN Sun = weekend
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/hooks/before-chat')
      .set('X-Hook-Secret', SECRET)
      .send(validBeforeChat({ agentId: 'hr-agent' }));
    expect(res.status).toBe(200);
    expect(res.body.data.block).toBe(true);
    expect(res.body.data.message).toContain('Ngoài giờ');
    vi.useRealTimers();
  });

  it('blocks when rate limit exceeded', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T03:00:00Z'));
    const fakes = makeFakes();
    (fakes.redis.incr as ReturnType<typeof vi.fn>).mockResolvedValue(999);
    const { app } = buildTestApp(fakes);
    const res = await request(app)
      .post('/hooks/before-chat')
      .set('X-Hook-Secret', SECRET)
      .send(validBeforeChat());
    expect(res.body.data.block).toBe(true);
    expect(res.body.data.message).toContain('giới hạn');
    vi.useRealTimers();
  });

  it('returns 400 on invalid payload', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/hooks/before-chat')
      .set('X-Hook-Secret', SECRET)
      .send({ hookType: 'before_chat' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('POST /hooks/after-chat', () => {
  it('returns ok ack and fires conversation insert', async () => {
    const fakes = makeFakes();
    const { app } = buildTestApp(fakes);
    const res = await request(app)
      .post('/hooks/after-chat')
      .set('X-Hook-Secret', SECRET)
      .send({
        hookType: 'after_chat',
        agentId: 'office-agent',
        userId: 'zl_12345',
        channel: 'zalo',
        userMessage: 'hi',
        agentResponse: 'hello',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        latencyMs: 230,
        timestamp: '2026-05-04T03:00:00Z',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
    // fire-and-forget — wait a tick
    await new Promise((r) => setImmediate(r));
    expect(fakes.pool.query).toHaveBeenCalled();
  });
});

describe('POST /hooks/on-error', () => {
  it('records error and acks', async () => {
    const fakes = makeFakes();
    const { app } = buildTestApp(fakes);
    const res = await request(app)
      .post('/hooks/on-error')
      .set('X-Hook-Secret', SECRET)
      .send({
        hookType: 'on_error',
        agentId: 'finance-agent',
        userId: 'zl_99',
        channel: 'zalo',
        errorMessage: 'model timeout',
        errorCode: 'TIMEOUT',
        timestamp: '2026-05-04T03:00:00Z',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
    expect(fakes.redis.incr).toHaveBeenCalledWith('agent:err:finance-agent');
    expect(fakes.logger.error).toHaveBeenCalled();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
