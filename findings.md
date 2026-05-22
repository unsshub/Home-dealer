# Findings

## HANDOFF.md Summary
- **Project**: DSCR Verdict — lender-grade DSCR analysis SaaS
- **Deployed to**: https://beautiful-tarsier-f259a0.netlify.app (Netlify)
- **Stack**: Express + Passport + Drizzle + Neon + OpenAI + Stripe / Vite + React + Tailwind v4 + shadcn-style
- **Status**: All 4 original slices code-complete, plus 2 new features added

## Missing Env Vars (Netlify)
1. OPENAI_API_KEY
2. STRIPE_SECRET_KEY
3. STRIPE_WEBHOOK_SECRET
4. STRIPE_PRICE_STARTER
5. STRIPE_PRICE_PRO
6. STRIPE_PRICE_LIFETIME
7. GOOGLE_CLIENT_ID
8. GOOGLE_CLIENT_SECRET

## Env Vars Already Set in Netlify
- DATABASE_URL (Neon), NODE_ENV, SESSION_SECRET, CLIENT_URL

## Features Built Since Handoff

### Manual Property Input
- `POST /api/analyze/manual` — accepts property fields directly, no OpenAI needed
- AnalyzePage has URL/Manual toggle with full property form
- Financial params (down payment, rate, term, strategy) configurable in both modes
- 3 server tests, all passing

### Google OAuth
- Passport.js Google OAuth20 strategy (graceful skip if env vars missing)
- `createOrLinkGoogle` — creates new user or links to existing email
- Routes: GET /auth/google, GET /auth/google/callback
- Google sign-in buttons on LoginPage + RegisterPage
- 2 service tests, all passing

### PRODUCT.md (via impeccable/teach)
- Product register: real estate investors, confident/precise/trustworthy brand
- Anti-reference: NOT generic SaaS cream
- Design principles: verdict is hero, precision without friction, confidence through clarity

### AnalysisDetailPage Redesign (via impeccable/shape)
- Verdict hero with contextual description text
- Structured property metric grid (4-col)
- Breakdown: sectioned with uppercase headers, indented line items
- DSCR ratio as capstone in verdict-framed panel

### Validation Error Display Fix
- ApiError type exposes `details` field with per-field validation errors
- ErrorAlert renders multi-line messages
- Both URL and manual submit handlers display field-level errors to user

### Multi-Strategy DSCR Engine
- Strategy Registry pattern: `registry[strategy](input)` dispatches to strategy-specific calculator
- Buy & Hold: standard DSCR formula (extracted from legacy engine)
- BRRRR: ARV-based loan amount via `afterRepairValue`
- Fix & Flip: dual DSCR + profit/ROI output with `flipMetrics`
- Short-Term Rental: seasonal blended income + booking-based operating costs
- Client form shows strategy-specific fields conditionally
- Strategy selector now visible in both URL and Manual modes
- 26 server tests, typecheck + build clean

## Files Created/Modified (this session)
`server/src/engine/calculator.ts`, `buy-and-hold.ts`, `brrrr.ts`, `fix-and-flip.ts`, `short-term-rental.ts` (new calculators)
`shared/src/types/analysis.ts`, `api.ts` — strategy-specific input fields + FlipMetrics
`server/src/routes/analyze.routes.ts` — dispatch via registry + strategy-aware defaults
`client/src/pages/AnalyzePage.tsx` — conditional fields + flip metrics results
`server/src/engine/*.test.ts` — 10 new unit tests
`server/src/routes/manual-analyze.test.ts` — 2 new integration tests
`docs/superpowers/specs/2026-05-22-multi-strategy-dscr-engine-design.md`
`docs/superpowers/plans/2026-05-22-multi-strategy-dscr-engine.md`

## Remaining Next Steps
1. Add OpenAI key — enables property scraping from Zillow URLs
2. Add Stripe keys — enables subscription/payment features
3. Rate limiting & caching — from risks.md

## Known Issues
- OpenAI API key is a placeholder (sk-place**lder) — URL scraping fails with 401

## Rate Limiting & Caching — Implementation 2026-05-22

### Files Created
- `server/src/db/schema/page_cache.ts` — page_cache Drizzle table
- `server/src/middleware/rate-limit.ts` — DB-backed rate limit middleware
- `server/src/middleware/rate-limit.test.ts` — 3 unit tests
- `server/src/services/scraping.service.test.ts` — 3 cache tests
- `docs/superpowers/plans/2026-05-22-rate-limiting-caching.md`

### Files Modified
- `server/src/db/schema/index.ts` — added page_cache export
- `server/src/services/scraping.service.ts` — cache logic in scrape()
- `server/src/routes/analyze.routes.ts` — rate limit middleware wired in

### Architecture Decisions
- DB-backed (no in-memory state) — works serverless (Netlify lambda cold starts)
- Rate limit queries analyses table — zero new dependencies
- page_cache with SHA-256 key, 24h TTL, fails open on insert error
- Middleware after requireAuth, before checkAnalysisLimit — correct ordering
- Explicit req.user guard in rate limiter (not relying on SQL null semantics)
- Project uses drizzle-kit push (no migration files) — consistent with all existing tables
