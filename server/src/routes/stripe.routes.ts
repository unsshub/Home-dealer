import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { stripeService } from '../services/stripe.service.js';
import { requireAuth } from '../middleware/auth.js';
import { subscriptions } from '../db/schema/subscriptions.js';

export const stripeRoutes = Router();

stripeRoutes.post('/stripe/checkout', requireAuth, async (req, res, next) => {
  try {
    const { plan } = req.body as { plan?: string };
    if (!plan || !['starter', 'pro', 'lifetime'].includes(plan)) {
      res.status(400).json({ error: 'Invalid plan', code: 'INVALID_PLAN' });
      return;
    }
    const result = await stripeService.createCheckoutSession(req.user!.id, plan);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

stripeRoutes.post('/stripe/portal', requireAuth, async (req, res, next) => {
  try {
    const result = await stripeService.createPortalSession(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

stripeRoutes.get('/subscription', requireAuth, async (req, res, next) => {
  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, req.user!.id))
      .limit(1);
    res.json(sub ?? null);
  } catch (err) {
    next(err);
  }
});

stripeRoutes.post('/webhooks/stripe', async (req, res, next) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['stripe-signature'] as string;
    const result = await stripeService.handleWebhook(rawBody, signature);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
