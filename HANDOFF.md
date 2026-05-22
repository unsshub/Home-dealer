# DSCR Verdict — Handoff

## Status: Deployed to Netlify (missing env vars)

**Live site:** https://beautiful-tarsier-f259a0.netlify.app

## What's Built

### Slice 1 — Core DSCR Flow ✅
- `calculateDSCR()` pure function in `server/src/engine/dscr.engine.ts` (6 unit tests passing)
- `ScrapingService` — OpenAI GPT-4o-mini extracts property data from listing URLs
- `POST /api/analyze` — Zod validation, plan-gating middleware, DB persistence
- App factory with DI for testability

### Slice 2 — Auth & Workspace ✅
- Passport.js local strategy (register/login/logout/me)
- Auth context (`use-auth.tsx`), ProtectedRoute, Header with user state
- Dashboard lists user's analyses, detail page shows full DSCR breakdown
- CRUD routes: list, detail, delete

### Slice 3 — Export ✅
- Share token generation (`POST /analyses/:id/share`)
- Public share view (`GET /shares/:token`)
- Print/PDF via `window.print()`
- SharePage with verdict card and property summary

### Slice 4 — Stripe Monetization ✅ (code complete, needs keys)
- Checkout session + Customer Portal + webhook handler
- `checkAnalysisLimit` middleware (free=3, starter=50, pro/lifetime=∞)
- `seed-plans.ts` script for subscription_plans table
- PricingPage wired to Stripe, `useSubscription` hook

### UI Polish ✅
- Unified component library: Button, Card, Input, Badge, LoadingSpinner, ErrorAlert, EmptyState
- OKLCH theme system — dark mode first with `.light` toggle via ThemeToggle in header
- Inter font via Google Fonts
- All 8 pages use consistent components: LandingPage, LoginPage, RegisterPage, DashboardPage, AnalyzePage, AnalysisDetailPage, SharePage, PricingPage

### Deployment ✅ (needs env vars)
- `netlify.toml` — build config, API redirect, SPA fallback
- `server/src/netlify.ts` — Express wrapped with `serverless-http`
- `server/src/db/session-store.ts` — connect-pg-simple session store (Neon-backed)
- Production build pipeline: shared → server → client
- Neon database created, schema pushed, plans seeded

## Architecture

```
home-dealer/
├── shared/       — @dscr/shared: types, constants (states, verdict thresholds)
├── server/       — Express + Passport + Drizzle + Neon + OpenAI + Stripe
│   └── src/
│       ├── engine/        — calculateDSCR()
│       ├── routes/        — analyze, auth, analyses (CRUD), shares, webhooks
│       ├── services/      — scraping, stripe
│       ├── middleware/    — auth, plan-gate
│       ├── db/            — schema (5 tables), migrations
│       └── __tests__/     — 6 unit tests + 1 integration test
├── client/       — Vite + React + Tailwind v4 + shadcn-style components
│   └── src/
│       ├── components/ui/     — Button, Card, Input, Badge, etc.
│       ├── components/layout/ — Header, ThemeToggle
│       ├── components/shared/ — ProtectedRoute
│       ├── hooks/             — use-auth, use-subscription
│       ├── lib/               — api, utils (cn)
│       └── pages/             — 8 route pages
└── docker-compose.yml — Postgres 16 on port 5433
```

## How to Run (Local Dev)

```bash
# Start DB
docker-compose up -d

# Start dev servers (both)
npm run dev

# Or individually:
npm run dev --workspace=server   # API at :3001
npm run dev --workspace=client   # Vite at :5175

# Migrate & seed on first run
npm run db:push && npm run db:seed

# Tests
npm run test --workspace=server
```

## Running Servers
- API: **http://localhost:3001**
- Client: **http://localhost:5175**

## Key Config
- DATABASE_URL=postgres://dscr:dscr@localhost:5433/dscr_verdict (port 5433 — system Postgres on 5432)
- Ports drift: Vite is on 5175 (5173/5174 occupied)
- Docker: use `docker-compose` (v1), not `docker compose` (v2)

## Deployment

**Netlify site:** https://beautiful-tarsier-f259a0.netlify.app
**GitHub:** https://github.com/unsshub/Home-dealer

### Env vars already set in Netlify:
- `DATABASE_URL` — Neon connection string
- `NODE_ENV` = `production`
- `SESSION_SECRET` — random hex string
- `CLIENT_URL` = `https://beautiful-tarsier-f259a0.netlify.app`

### Env vars still needed (set in Netlify UI):
1. **`OPENAI_API_KEY`** — Get from https://platform.openai.com/api-keys (free credits available)
2. **`STRIPE_SECRET_KEY`** — `sk_test_...` from Stripe dashboard
3. **`STRIPE_WEBHOOK_SECRET`** — `whsec_...` from Stripe CLI
4. **`STRIPE_PRICE_STARTER`** — Stripe price ID for $19/mo plan
5. **`STRIPE_PRICE_PRO`** — Stripe price ID for $49/mo plan
6. **`STRIPE_PRICE_LIFETIME`** — Stripe price ID for lifetime plan

### Steps to finish deployment:
1. Set the missing env vars in Netlify dashboard (Site settings → Environment variables)
2. Trigger a re-deploy (Deploys → Trigger deploy → Clear cache and deploy site)
3. After deploy, configure Stripe webhook endpoint at `https://beautiful-tarsier-f259a0.netlify.app/api/webhooks/stripe`

### Database (Neon)
- Already created and migrated
- Connection: `postgresql://neondb_owner:npg_iV7ouBzO5nWL@ep-dawn-feather-apjyeq3e-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Tables: users, analyses, subscription_plans, subscriptions, session
- Plans seeded: Free, Starter ($19/mo), Pro ($49/mo), Lifetime

## Next Steps (pick one)
1. **Add OpenAI key** — enables property scraping from Zillow URLs (blocker for core flow)
2. **Add Stripe keys** — enables subscription/payment features
3. **Manual property input** — skip OpenAI entirely, let users type property details
4. **Google OAuth** — Additional Passport.js strategy for social login
5. **Multi-strategy UI** — Let users pick Buy & Hold / BRRRR / Fix & Flip / Short-Term Rental on AnalyzePage
