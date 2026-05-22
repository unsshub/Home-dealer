import Stripe from 'stripe';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { eq } from 'drizzle-orm';

const stripeKey = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' }) : null;

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

export class StripeService {
  async createCheckoutSession(userId: string, planSlug: string) {
    if (!stripe) throw new Error('Stripe not configured');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new Error('User not found');

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
    }

    const priceId = PRICE_IDS[planSlug];
    if (!priceId) throw new Error(`Invalid plan: ${planSlug}`);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: planSlug === 'lifetime' ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?checkout=canceled`,
      metadata: { userId, planSlug },
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    if (!stripe) throw new Error('Stripe not configured');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.stripeCustomerId) throw new Error('No subscription found');

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/settings`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: string, signature: string) {
    if (!stripe) throw new Error('Stripe not configured');

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planSlug = session.metadata?.planSlug;
        if (userId && planSlug) {
          await this.activateSubscription(userId, planSlug, session);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const custId = sub.customer as string;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, custId))
          .limit(1);
        if (user) {
          await db
            .update(subscriptions)
            .set({ status: sub.status === 'active' ? 'active' : 'canceled' })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        }
        break;
      }
    }

    return { received: true };
  }

  private async activateSubscription(userId: string, planSlug: string, session: Stripe.Checkout.Session) {
    const planMap: Record<string, string> = {
      starter: 'starter',
      pro: 'pro',
      lifetime: 'lifetime',
    };

    const planName = planMap[planSlug];
    if (!planName) return;

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    const planIdFromSlug = planSlug;

    if (existing) {
      await db
        .update(subscriptions)
        .set({
          status: 'active',
          stripeSubscriptionId: session.subscription as string ?? null,
          currentPeriodStart: new Date(),
        })
        .where(eq(subscriptions.userId, userId));
    } else {
      await db.insert(subscriptions).values({
        userId,
        planId: planIdFromSlug,
        stripeSubscriptionId: session.subscription as string ?? null,
        status: 'active',
        currentPeriodStart: new Date(),
      });
    }
  }
}

export const stripeService = new StripeService();
