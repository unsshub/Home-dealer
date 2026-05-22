import { pgTable, uuid, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

export const pageCache = pgTable('page_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  cacheKey: text('cache_key').notNull().unique(),
  resultData: jsonb('result_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ttlSeconds: integer('ttl_seconds').notNull().default(86400),
});
