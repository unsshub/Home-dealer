import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../app.js';
import { db } from '../db/index.js';
import { analyses } from '../db/schema/analyses.js';
import { users } from '../db/schema/users.js';
import type { ScrapeResult } from '@dscr/shared';

const { mockScrape, mockExtractState } = vi.hoisted(() => ({
  mockScrape: vi.fn(),
  mockExtractState: vi.fn().mockReturnValue('TX'),
}));

vi.mock('../services/scraping.service', () => ({
  scrapingService: {
    scrape: mockScrape,
    extractStateFromAddress: mockExtractState,
  },
}));

const MOCK_PROPERTY: ScrapeResult = {
  property: {
    address: '123 Main St, Austin, TX 78701',
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    propertyType: 'single_family',
    yearBuilt: 2010,
    estimatedRent: 2800,
    hoa: 50,
  },
  confidence: 0.85,
  raw: {},
};

describe('POST /api/analyze — Core DSCR Flow', () => {
  let app: ReturnType<typeof createApp>;
  let userId: string;

  beforeAll(async () => {
    const email = `test-int-${Date.now()}@dscr.test`;
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: '$2b$10$test',
        name: 'Integration Test',
      })
      .returning();
    userId = user!.id;

    mockScrape.mockResolvedValue(MOCK_PROPERTY);
    app = createApp({ authenticatedUserId: userId });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('accepts a Zillow URL, extracts property data (mocked AI), calculates DSCR, returns verdict', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        url: 'https://www.zillow.com/homedetails/123-Main-St/12345_zpid/',
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
    expect(res.body.strategy).toBe('buy_and_hold');
    expect(res.body.dscrRatio).toBeLessThan(1.0);
    expect(res.body.verdict).toBe('fail');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body.property.address).toBe('123 Main St, Austin, TX 78701');
    expect(res.body.property.price).toBe(350000);

    const b = res.body.breakdown;
    expect(b.grossRent).toBe(2800);
    expect(b.vacancy).toBe(-140);
    expect(b.effectiveIncome).toBe(2660);
    expect(b.operatingExpenses).toBe(-280);
    expect(b.propertyManagement).toBe(-168);
    expect(b.repairs).toBe(-140);
    expect(b.capex).toBe(-84);
    expect(b.noi).toBeCloseTo(1988, 0);
    expect(b.principalInterest).toBeLessThan(0);
    expect(b.propertyTax).toBeLessThan(0);
    expect(b.insurance).toBeLessThan(0);
    expect(b.hoaExpense).toBe(-50);
    expect(b.totalDebtService).toBeGreaterThan(0);

    const [saved] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, res.body.id))
      .limit(1);
    expect(saved).toBeDefined();
    expect(saved.verdict).toBe('fail');
    expect(Number(saved.dscrRatio)).toBeLessThan(1.0);
  });
});
