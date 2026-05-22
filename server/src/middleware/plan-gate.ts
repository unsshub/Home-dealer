import type { Request, Response, NextFunction } from 'express';
import { eq, count } from 'drizzle-orm';
import { db } from '../db/index.js';
import { analyses } from '../db/schema/analyses.js';
import { subscriptions } from '../db/schema/subscriptions.js';

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 50,
  pro: Infinity,
  lifetime: Infinity,
};

export async function checkAnalysisLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, req.user!.id))
      .limit(1);

    const planTier = sub?.status === 'active' ? (sub.planId as string) : 'free';
    const limit = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.free;
    if (limit === Infinity) return next();

    const [result] = await db
      .select({ value: count() })
      .from(analyses)
      .where(eq(analyses.userId, req.user!.id));

    const analysisCount = Number(result?.value ?? 0);
    if (analysisCount >= limit) {
      res.status(403).json({
        error: `Analysis limit reached (${limit}). Upgrade to continue.`,
        code: 'LIMIT_REACHED',
        limit,
      });
      return;
    }

    next();
  } catch {
    next();
  }
}
