import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from './rate-limit.js';
import type { Request, Response } from 'express';

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn(),
}));

vi.mock('../db/index', () => ({
  db: mockDb,
}));

describe('rateLimit', () => {
  it('calls next when count is under max', async () => {
    mockDb.where.mockResolvedValue([{ value: 3 }]);

    const middleware = rateLimit({ max: 5, windowMs: 3600000 });
    const req = { user: { id: 'u1' } } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 429 when count equals max', async () => {
    mockDb.where.mockResolvedValue([{ value: 5 }]);

    const middleware = rateLimit({ max: 5, windowMs: 3600000 });
    const req = { user: { id: 'u1' } } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RATE_LIMITED', retryAfterMs: 3600000 })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when no user is present', async () => {
    const middleware = rateLimit({ max: 5, windowMs: 3600000 });
    const req = {} as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
