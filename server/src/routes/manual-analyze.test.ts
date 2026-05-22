import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../app.js';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';
import { analyses } from '../db/schema/analyses.js';
import { properties } from '../db/schema/properties.js';

vi.mock('../services/scraping.service', () => ({
  scrapingService: {
    scrape: vi.fn(),
    extractStateFromAddress: vi.fn().mockReturnValue('TX'),
  },
}));

describe('POST /api/analyze/manual', () => {
  let app: ReturnType<typeof createApp>;
  let userId: string;

  beforeAll(async () => {
    const email = `test-manual-${Date.now()}@dscr.test`;
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: '$2b$10$test',
        name: 'Manual Test',
      })
      .returning();
    userId = user!.id;
    app = createApp({ authenticatedUserId: userId });
  });

  afterEach(async () => {
    await db.delete(analyses).where(eq(analyses.userId, userId));
    await db.delete(properties).where(eq(properties.userId, userId));
  });

  it('returns 201 with DSCR verdict for valid manual property input', async () => {
    const res = await request(app)
      .post('/api/analyze/manual')
      .send({
        property: {
          address: '456 Oak St, Austin, TX 78701',
          price: 300000,
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1400,
          propertyType: 'single_family',
          yearBuilt: 2015,
          estimatedRent: 2500,
          hoa: 75,
        },
        strategy: 'buy_and_hold',
        params: {
          downPaymentPercent: 20,
          interestRate: 6.5,
          loanTermYears: 30,
        },
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('property');
    expect(res.body.property.address).toBe('456 Oak St, Austin, TX 78701');
    expect(res.body.property.price).toBe(300000);
    expect(res.body.property.bedrooms).toBe(3);
    expect(res.body.strategy).toBe('buy_and_hold');
    expect(res.body.dscrRatio).toBeDefined();
    expect(res.body.verdict).toMatch(/^(pass|caution|fail)$/);
    expect(res.body).toHaveProperty('breakdown');
    expect(res.body).toHaveProperty('createdAt');
  });

  it('returns 400 when required property fields are missing', async () => {
    const res = await request(app)
      .post('/api/analyze/manual')
      .send({
        property: {
          address: '789 Pine St',
          price: -1,
          estimatedRent: 2000,
        },
        strategy: 'buy_and_hold',
        params: {
          downPaymentPercent: 20,
          interestRate: 6.5,
          loanTermYears: 30,
        },
      })
      .expect(400);

    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('persists manual analysis to the database', async () => {
    const res = await request(app)
      .post('/api/analyze/manual')
      .send({
        property: {
          address: '321 Elm St, Dallas, TX 75201',
          price: 250000,
          bedrooms: 2,
          bathrooms: 1,
          sqft: 900,
          propertyType: 'condo',
          yearBuilt: 2020,
          estimatedRent: 1800,
          hoa: 200,
        },
        strategy: 'brrrr',
        params: {
          downPaymentPercent: 25,
          interestRate: 7,
          loanTermYears: 30,
        },
      })
      .expect(201);

    const [saved] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, res.body.id))
      .limit(1);

    expect(saved).toBeDefined();
    expect(saved.strategy).toBe('brrrr');
    expect(saved.verdict).toBeDefined();
    expect(Number(saved.dscrRatio)).toBeGreaterThan(0);
  });

  it('returns flipMetrics for fix_and_flip strategy', async () => {
    const res = await request(app)
      .post('/api/analyze/manual')
      .send({
        property: {
          address: '555 Flip St, Austin, TX 78701',
          price: 200000,
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1200,
          propertyType: 'single_family',
          yearBuilt: 2000,
          estimatedRent: 2000,
          hoa: 0,
          afterRepairValue: 280000,
          rehabCosts: 40000,
          holdingPeriodMonths: 6,
          sellingCostsPercent: 8,
        },
        strategy: 'fix_and_flip',
        params: {
          downPaymentPercent: 20,
          interestRate: 6.5,
          loanTermYears: 30,
        },
      })
      .expect(201);

    expect(res.body.strategy).toBe('fix_and_flip');
    expect(res.body.flipMetrics).toBeDefined();
    expect(res.body.flipMetrics.grossProfit).toBeGreaterThan(0);
    expect(res.body.flipMetrics.roi).toBeGreaterThan(0);
    expect(res.body.flipMetrics.annualizedRoi).toBeGreaterThan(0);
    expect(res.body.dscrRatio).toBeGreaterThan(0);
  });

  it('returns standard DSCR response for brrrr strategy', async () => {
    const res = await request(app)
      .post('/api/analyze/manual')
      .send({
        property: {
          address: '666 Brrrr Ln, Dallas, TX 75201',
          price: 200000,
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1300,
          propertyType: 'single_family',
          yearBuilt: 2010,
          estimatedRent: 2200,
          hoa: 0,
          afterRepairValue: 260000,
        },
        strategy: 'brrrr',
        params: {
          downPaymentPercent: 20,
          interestRate: 6.5,
          loanTermYears: 30,
        },
      })
      .expect(201);

    expect(res.body.strategy).toBe('brrrr');
    expect(res.body.flipMetrics).toBeUndefined();
    expect(res.body.dscrRatio).toBeGreaterThan(0);
    expect(res.body.verdict).toMatch(/^(pass|caution|fail)$/);
    expect(res.body.breakdown).toHaveProperty('noi');
    expect(res.body.breakdown).toHaveProperty('totalDebtService');
  });
});
