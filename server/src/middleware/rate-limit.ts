import type { Request, Response, NextFunction } from 'express';
import { eq, gte, count, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { analyses } from '../db/schema/analyses.js';

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next();
    try {
      const [result] = await db
        .select({ value: count() })
        .from(analyses)
        .where(
          and(
            eq(analyses.userId, req.user.id),
            gte(analyses.createdAt, new Date(Date.now() - opts.windowMs))
          )
        );

      const count_ = Number(result?.value ?? 0);
      if (count_ >= opts.max) {
        res.status(429).json({
          error: `Too many requests. Limit: ${opts.max} per ${opts.windowMs / 60000}min`,
          code: 'RATE_LIMITED',
          retryAfterMs: opts.windowMs,
        });
        return;
      }

      next();
    } catch {
      next();
    }
  };
}
