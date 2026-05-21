import { pgTable, uuid, text, numeric, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const properties = pgTable('properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  url: text('url'),
  address: text('address').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  beds: integer('beds'),
  baths: numeric('baths', { precision: 3, scale: 1 }),
  sqft: integer('sqft'),
  propertyType: text('property_type'),
  yearBuilt: integer('year_built'),
  estimatedRent: numeric('estimated_rent', { precision: 10, scale: 2 }),
  hoa: numeric('hoa', { precision: 8, scale: 2 }).default('0'),
  propertyTaxRate: numeric('property_tax_rate', { precision: 6, scale: 4 }),
  insuranceRate: numeric('insurance_rate', { precision: 6, scale: 4 }),
  scrapeRaw: jsonb('scrape_raw'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
