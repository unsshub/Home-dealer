import { pgTable, uuid, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { properties } from './properties';

export const analyses = pgTable('analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  strategy: text('strategy').notNull(),
  dscrRatio: numeric('dscr_ratio', { precision: 5, scale: 3 }),
  verdict: text('verdict'),
  monthlyIncome: numeric('monthly_income', { precision: 10, scale: 2 }),
  vacancy: numeric('vacancy', { precision: 10, scale: 2 }),
  operatingExpenses: numeric('operating_expenses', { precision: 10, scale: 2 }),
  propertyManagement: numeric('property_management', { precision: 10, scale: 2 }),
  repairs: numeric('repairs', { precision: 10, scale: 2 }),
  capex: numeric('capex', { precision: 10, scale: 2 }),
  noi: numeric('noi', { precision: 10, scale: 2 }),
  principalInterest: numeric('principal_interest', { precision: 10, scale: 2 }),
  taxes: numeric('taxes', { precision: 10, scale: 2 }),
  insurance: numeric('insurance', { precision: 10, scale: 2 }),
  hoaExpense: numeric('hoa_expense', { precision: 10, scale: 2 }),
  totalDebtService: numeric('total_debt_service', { precision: 10, scale: 2 }),
  downPaymentPct: numeric('down_payment_pct', { precision: 5, scale: 2 }),
  interestRate: numeric('interest_rate', { precision: 5, scale: 3 }),
  loanTermYears: integer('loan_term_years').default(30),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
