import { pgTable, uuid, text, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  priceMonthly: numeric('price_monthly', { precision: 8, scale: 2 }).notNull(),
  features: jsonb('features').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
