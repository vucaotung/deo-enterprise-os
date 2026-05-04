import { describe, expect, it } from 'vitest';
import { err, ok } from '../envelope.js';

describe('envelope', () => {
  it('ok wraps data with success=true', () => {
    const r = ok({ id: 1 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ id: 1 });
  });

  it('err wraps code+message with success=false', () => {
    const r = err('NOT_FOUND', 'project missing', { id: 'abc' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.code).toBe('NOT_FOUND');
      expect(r.error.message).toBe('project missing');
      expect(r.error.details).toEqual({ id: 'abc' });
    }
  });

  it('ok with meta passes meta through', () => {
    const r = ok([1, 2], { correlationId: 'corr-1' });
    expect(r.meta?.correlationId).toBe('corr-1');
  });
});
