# DSCR Verdict — Handoff

## Status: All core slices complete

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

### Slice 4 — Stripe Monetization ✅
- Checkout session + Customer Portal + webhook handler
- `checkAnalysisLimit` middleware (free=3, starter=50, pro/lifetime=∞)
- `seed-plans.ts` script for subscription_plans table
- PricingPage wired to Stripe, `useSubscription` hook

### UI Polish ✅
- Unified component library: Button, Card, Input, Badge, LoadingSpinner, ErrorAlert, EmptyState
- OKLCH theme system — dark mode first with `.light` toggle via ThemeToggle in header
- Inter font via Google Fonts
- All 8 pages use consistent components: LandingPage, LoginPage, RegisterPage, DashboardPage, AnalyzePage, AnalysisDetailPage, SharePage, PricingPage

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

## How to Run

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

## Next Steps (pick one)
1. **Deployment** — Dockerfile for server, Neon production DB, Vercel/Railway for client
2. **Google OAuth** — Additional Passport.js strategy for social login
3. **Stripe end-to-end test** — Verify recurring checkout, webhook, subscription state transitions
4. **UI enhancements** — Page transitions, sidebar nav, loading skeletons
5. **Multi-strategy UI** — Let users pick Buy & Hold / BRRRR / Fix & Flip / Short-Term Rental on AnalyzePage
