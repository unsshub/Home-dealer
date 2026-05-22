# Rate Limiting & Caching Design

## Goal
Add rate limiting to protect analysis endpoints from abuse and cache scraped property data to reduce redundant OpenAI calls.

## Architecture

Two independent but complementary systems:
1. **Rate Limiting** — custom middleware backed by `analyses` DB table (no new dependencies)
2. **Caching** — `page_cache` DB table for scraped property data, transparently integrated into scraping service

## 1. Rate Limiting

### Middleware: `server/src/middleware/rate-limit.ts`

Custom middleware that queries the existing `analyses` table for request count within a configurable sliding window.

```ts
export function rateLimit(opts: { max: number; windowMs: number }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const [result] = await db
      .select({ value: count() })
      .from(analyses)
      .where(
        and(
          eq(analyses.userId, req.user!.id),
          gte(analyses.createdAt, new Date(Date.now() - opts.windowMs))
        )
      );
    if (Number(result?.value ?? 0) >= opts.max) {
      return res.status(429).json({
        error: `Too many requests. Limit: ${opts.max} per ${opts.windowMs / 60000}min`,
        code: 'RATE_LIMITED',
        retryAfterMs: opts.windowMs,
      });
    }
    next();
  };
}
```

### Configuration

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/api/analyze` | 10 | 1 hour | URL scraping uses OpenAI (expensive) |
| `/api/analyze/manual` | 30 | 1 hour | Manual input is cheap (no OpenAI) |

### Placement

Applied as route-level middleware in `analyze.routes.ts`, after `requireAuth` but before `checkAnalysisLimit`:

```ts
analyzeRoutes.post('/analyze', requireAuth, rateLimit({ max: 10, windowMs: 3600000 }), checkAnalysisLimit, handler);
analyzeRoutes.post('/analyze/manual', requireAuth, rateLimit({ max: 30, windowMs: 3600000 }), checkAnalysisLimit, handler);
```

### Error Response

```json
{
  "error": "Too many requests. Limit: 10 per 60min",
  "code": "RATE_LIMITED",
  "retryAfterMs": 3600000
}
```

## 2. Caching

### Table: `page_cache` (new Drizzle schema)

```ts
// server/src/db/schema/page_cache.ts
import { pgTable, uuid, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

export const pageCache = pgTable('page_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  cacheKey: text('cache_key').notNull().unique(),
  resultData: jsonb('result_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ttlSeconds: integer('ttl_seconds').notNull().default(86400),
});
```

### Integration: `server/src/services/scraping.service.ts`

The `scrape()` method gains transparent caching:

1. Compute `cacheKey = sha256(url)`
2. Query `page_cache` by cacheKey
3. If hit AND within TTL: return cached result (skip OpenAI)
4. If expired: delete stale entry, fall through to scrape
5. If miss: call OpenAI, store result in `page_cache`, return

The public `scrape()` method now wraps the actual logic:

```ts
async scrape(url: string): Promise<ScrapeResult> {
  const cacheKey = crypto.createHash('sha256').update(url).digest('hex');
  const [cached] = await db.select().from(pageCache).where(eq(pageCache.cacheKey, cacheKey)).limit(1);
  if (cached) {
    const age = Date.now() - new Date(cached.createdAt).getTime();
    if (age < cached.ttlSeconds * 1000) {
      return cached.resultData as ScrapeResult;
    }
    await db.delete(pageCache).where(eq(pageCache.cacheKey, cacheKey));
  }
  const result = await this._doScrape(url);
  await db.insert(pageCache).values({ cacheKey, resultData: result });
  return result;
}

private async _doScrape(url: string): Promise<ScrapeResult> {
  // existing OpenAI scraping logic (unchanged)
}
```

### TTL
- Default: 24 hours (86400 seconds)
- Configurable per cache entry if needed in future

## Testing Plan

### Rate Limiting
- Unit test: middleware returns 429 when user exceeds limit
- Unit test: middleware calls next() when under limit
- Integration test: hitting limit then waiting (skip waiting — just verify 429)

### Caching
- Unit test: cache hit returns cached data (mock DB)
- Unit test: cache miss calls OpenAI and stores result
- Unit test: expired cache is deleted and re-fetched

## Files

### Create
- `server/src/middleware/rate-limit.ts` — rate limit middleware
- `server/src/middleware/rate-limit.test.ts` — rate limit tests
- `server/src/db/schema/page_cache.ts` — cache table Drizzle schema

### Modify
- `server/src/services/scraping.service.ts` — add cache logic
- `server/src/services/scraping.service.test.ts` — add cache tests
- `server/src/routes/analyze.routes.ts` — apply rate limit middleware
- `server/src/db/schema/index.ts` — export page_cache

## Implementation Order

1. Create `page_cache` schema
2. Add cache logic to scraping service
3. Create rate limit middleware + tests
4. Wire rate limit into routes
5. Full test suite verification
