# Important State

## Project: DSCR Verdict SaaS
**Tagline**: Lender-grade DSCR verdict on any US rental property in seconds.

## Current Status: BUILDER PHASE — ALL SLICES COMPLETE
- [x] Slice 1: DSCR engine, scraping, POST /api/analyze (6 tests passing)
- [x] Slice 2: Passport.js auth, register/login/logout, dashboard, detail page
- [x] Slice 3: Share links (token-based), public share view, print/PDF
- [x] Slice 4: Stripe checkout, webhooks, plan gating, subscription UI
- [x] Frontend: Auth context, protected routes, all pages connected
- [x] TypeScript clean on server and client

## Active Decisions Pending
- None.

## Known Bugs
- None reported.

## System Status
| Service     | Status  | Notes                        |
|-------------|---------|------------------------------|
| Neon/DB     | Needs `docker compose up -d` + `drizzle-kit push` to initialize |
| OpenAI API  | Needs `OPENAI_API_KEY` in server/.env |
| Stripe      | Needs keys + price IDs in server/.env |
| Auth        | Configured via Passport.js local strategy |
| Seed Data   | Run `npm run db:seed` to populate subscription_plans |

## MVP Complete — Ready for Deployment
1. Start Postgres: `docker compose up -d`
2. Push schema: `npm run db:push`
3. Seed plans: `npm run db:seed`
4. Start server: `npm run dev --workspace=server`
5. Start client: `npm run dev --workspace=client`
