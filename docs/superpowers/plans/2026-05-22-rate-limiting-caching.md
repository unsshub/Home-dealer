# Rate Limiting & Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rate limiting middleware and scraped property caching to protect API endpoints and reduce redundant OpenAI calls.

**Architecture:** Custom DB-backed rate limit middleware querying the `analyses` table (zero new dependencies) + `page_cache` Drizzle table for transparent caching in the scraping service.

**Tech Stack:** Express, Drizzle ORM, PostgreSQL, Vitest, crypto (Node built-in)

---

## File Map

### Create:
- `server/src/db/schema/page_cache.ts` — cache table Drizzle schema
- `server/src/middleware/rate-limit.ts` — rate limit middleware
- `server/src/middleware/rate-limit.test.ts` — rate limit unit tests

### Modify:
- `server/src/db/schema/index.ts` — export page_cache
- `server/src/services/scraping.service.ts` — add cache logic to `scrape()` method
- `server/src/routes/analyze.routes.ts` — apply rate limit middleware

---

### Task 1: Create `page_cache` Drizzle Schema

**Files:**
- Create: `server/src/db/schema/page_cache.ts`
- Modify: `server/src/db/schema/index.ts`

- [ ] **Step 1: Create `server/src/db/schema/page_cache.ts`**

```ts
import { pgTable, uuid, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

export const pageCache = pgTable('page_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  cacheKey: text('cache_key').notNull().unique(),
  resultData: jsonb('result_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ttlSeconds: integer('ttl_seconds').notNull().default(86400),
});
```

- [ ] **Step 2: Add export to `server/src/db/schema/index.ts`**

```ts
export * from './page_cache';
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/src/db/schema/page_cache.ts server/src/db/schema/index.ts
git commit -m "feat: add page_cache Drizzle schema for scraped property caching"
```

---

### Task 2: Add Caching to Scraping Service

**Files:**
- Modify: `server/src/services/scraping.service.ts`

- [ ] **Step 1: Update `server/src/services/scraping.service.ts`**

Replace the file content with:

```ts
import crypto from 'node:crypto';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { pageCache } from '../db/schema/page_cache.js';
import type { ScrapeResult, PropertyData, PropertyType } from '@dscr/shared';

const SYSTEM_PROMPT = `You extract US real estate data from listing URLs. Return ONLY valid JSON with:
- address: full street address
- price: numeric listing price
- bedrooms: integer count
- bathrooms: number (supports .5)
- sqft: integer square footage
- propertyType: "single_family" | "condo" | "townhouse" | "multi_family" | "duplex" | "triplex" | "fourplex"
- yearBuilt: integer
- estimatedRent: numeric monthly rent estimate
- hoa: numeric monthly HOA fee (0 if none)
Use null for any field not found in the listing.`;

function extractState(address: string): string | null {
  const match = address.match(/\b([A-Z]{2})\s+\d{5}\b/);
  return match?.[1] ?? null;
}

export class ScrapingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const cacheKey = crypto.createHash('sha256').update(url).digest('hex');

    const [cached] = await db
      .select()
      .from(pageCache)
      .where(eq(pageCache.cacheKey, cacheKey))
      .limit(1);

    if (cached) {
      const age = Date.now() - new Date(cached.createdAt).getTime();
      if (age < cached.ttlSeconds * 1000) {
        return cached.resultData as ScrapeResult;
      }
      await db.delete(pageCache).where(eq(pageCache.cacheKey, cacheKey));
    }

    const result = await this._doScrape(url);

    try {
      await db.insert(pageCache).values({ cacheKey, resultData: result });
    } catch {
      // Cache insertion failure is non-fatal
    }

    return result;
  }

  private async _doScrape(url: string): Promise<ScrapeResult> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract property data from this listing URL: ${url}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const parsed = JSON.parse(content);

    const property: PropertyData = {
      address: parsed.address ?? 'Unknown address',
      price: parsed.price ?? 0,
      bedrooms: parsed.bedrooms ?? 0,
      bathrooms: parsed.bathrooms ?? 0,
      sqft: parsed.sqft ?? 0,
      propertyType: (parsed.propertyType as PropertyType) ?? 'single_family',
      yearBuilt: parsed.yearBuilt ?? 0,
      estimatedRent: parsed.estimatedRent ?? 0,
      hoa: parsed.hoa ?? 0,
    };

    return {
      property,
      confidence: 0.8,
      raw: parsed,
    };
  }

  extractStateFromAddress(address: string): string | null {
    return extractState(address);
  }
}

export const scrapingService = new ScrapingService();
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run existing tests**

Run: `npm run test`
Expected: All 26 PASS

- [ ] **Step 4: Create `server/src/services/scraping.service.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScrapingService } from './scraping.service';

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('openai', () => {
  const MockOpenAI = vi.fn();
  MockOpenAI.prototype.chat = {
    completions: {
      create: vi.fn(),
    },
  };
  return { default: MockOpenAI };
});

describe('ScrapingService', () => {
  let service: ScrapingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ScrapingService();
  });

  it('returns cached result when cache hit is fresh', async () => {
    const { db } = await import('../db/index');
    const cached = {
      id: '1',
      cacheKey: 'abc',
      resultData: { property: { address: '123 Main St' }, confidence: 0.9, raw: {} },
      createdAt: new Date(),
      ttlSeconds: 86400,
    };
    (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([cached]);

    const result = await service.scrape('https://example.com/listing');

    expect(result.property.address).toBe('123 Main St');
    expect(result.confidence).toBe(0.9);
  });

  it('calls OpenAI on cache miss and stores result', async () => {
    const { db } = await import('../db/index');
    (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            address: '456 Oak St',
            price: 300000,
            bedrooms: 3,
            bathrooms: 2,
            sqft: 1500,
            propertyType: 'single_family',
            yearBuilt: 2000,
            estimatedRent: 2500,
            hoa: 100,
          }),
        },
      }],
    });

    const openai = await import('openai');
    (openai.default.prototype.chat.completions.create as ReturnType<typeof vi.fn>) = mockCreate;

    const result = await service.scrape('https://example.com/listing2');

    expect(result.property.address).toBe('456 Oak St');
    expect(result.property.price).toBe(300000);
    expect(db.values).toHaveBeenCalled();
  });

  it('deletes expired cache and re-fetches', async () => {
    const { db } = await import('../db/index');
    const expired = {
      id: '1',
      cacheKey: 'abc',
      resultData: { property: { address: 'Old' }, confidence: 0.8, raw: {} },
      createdAt: new Date(Date.now() - 90000000),
      ttlSeconds: 86400,
    };
    (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([expired]);

    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            address: '789 Pine St',
            price: 500000,
            bedrooms: 4,
            bathrooms: 3,
            sqft: 2000,
            propertyType: 'single_family',
            yearBuilt: 2010,
            estimatedRent: 3000,
            hoa: 0,
          }),
        },
      }],
    });

    const openai = await import('openai');
    (openai.default.prototype.chat.completions.create as ReturnType<typeof vi.fn>) = mockCreate;

    const result = await service.scrape('https://example.com/listing3');

    expect(db.delete).toHaveBeenCalled();
    expect(result.property.address).toBe('789 Pine St');
    expect(db.values).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run scraping service tests**

Run: `npx vitest run server/src/services/scraping.service.test.ts`
Expected: 3 PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/services/scraping.service.ts server/src/services/scraping.service.test.ts
git commit -m "feat: add page_cache-backed caching to scraping service + tests"
```

---

### Task 3: Create Rate Limit Middleware

**Files:**
- Create: `server/src/middleware/rate-limit.ts`
- Create: `server/src/middleware/rate-limit.test.ts`

- [ ] **Step 1: Create `server/src/middleware/rate-limit.ts`**

```ts
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
    try {
      const [result] = await db
        .select({ value: count() })
        .from(analyses)
        .where(
          and(
            eq(analyses.userId, req.user!.id),
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
```

- [ ] **Step 2: Create `server/src/middleware/rate-limit.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from './rate-limit';
import type { Request, Response } from 'express';

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
  },
}));

describe('rateLimit', () => {
  it('calls next when count is under max', async () => {
    const { db } = await import('../db/index');
    (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([{ value: 3 }]);

    const middleware = rateLimit({ max: 5, windowMs: 3600000 });
    const req = { user: { id: 'u1' } } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 429 when count equals max', async () => {
    const { db } = await import('../db/index');
    (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([{ value: 5 }]);

    const middleware = rateLimit({ max: 5, windowMs: 3600000 });
    const req = { user: { id: 'u1' } } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RATE_LIMITED' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when no user is present', async () => {
    const middleware = rateLimit({ max: 5, windowMs: 3600000 });
    const req = {} as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run rate limit tests**

Run: `npx vitest run server/src/middleware/rate-limit.test.ts`
Expected: 3 PASS

- [ ] **Step 4: Commit**

```bash
git add server/src/middleware/rate-limit.ts server/src/middleware/rate-limit.test.ts
git commit -m "feat: add DB-backed rate limit middleware"
```

---

### Task 4: Wire Rate Limit into Route Handlers

**Files:**
- Modify: `server/src/routes/analyze.routes.ts`

- [ ] **Step 1: Add import for rateLimit**

At the top of `server/src/routes/analyze.routes.ts`, add:

```ts
import { rateLimit } from '../middleware/rate-limit.js';
```

- [ ] **Step 2: Apply rate limit middleware to both routes**

Replace:
```ts
analyzeRoutes.post('/analyze', requireAuth, checkAnalysisLimit, handler);
```
With:
```ts
analyzeRoutes.post('/analyze', requireAuth, rateLimit({ max: 10, windowMs: 3600000 }), checkAnalysisLimit, handler);
```

Replace:
```ts
analyzeRoutes.post('/analyze/manual', requireAuth, checkAnalysisLimit, handler);
```
With:
```ts
analyzeRoutes.post('/analyze/manual', requireAuth, rateLimit({ max: 30, windowMs: 3600000 }), checkAnalysisLimit, handler);
```

The full route definitions now look like:
```ts
analyzeRoutes.post('/analyze', requireAuth, rateLimit({ max: 10, windowMs: 3600000 }), checkAnalysisLimit, async (req, res, next) => {
```

```ts
analyzeRoutes.post('/analyze/manual', requireAuth, rateLimit({ max: 30, windowMs: 3600000 }), checkAnalysisLimit, async (req, res, next) => {
```

- [ ] **Step 3: Run full test suite**

Run: `npm run test`
Expected: All 29 PASS (26 existing + 3 new rate limit tests)

- [ ] **Step 4: Run typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/analyze.routes.ts
git commit -m "feat: apply rate limit middleware to analysis routes"
```
