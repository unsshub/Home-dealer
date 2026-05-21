# Decisions (Architectural Decision Records)

## ADR-001: Monorepo with npm Workspaces
- **Status**: Accepted
- **Context**: Full-stack app with shared TypeScript types between frontend and backend.
- **Decision**: Use npm workspaces (`/client`, `/server`, `/shared`) instead of turborepo/nx. Minimal tooling overhead for MVP.
- **Consequences**: Simple `npm install` at root. No build pipeline orchestration needed. Can migrate to nx later if monorepo grows.

## ADR-002: AI Scraping Server-Side Only
- **Status**: Accepted
- **Context**: OpenAI API keys must not leak to client. Cost control and rate limiting needed.
- **Decision**: All calls to OpenAI go through `/api/properties/scrape` on Express. ScrapingService handles URL validation, prompt construction, response parsing, and caching.
- **Consequences**: Slightly higher latency (extra roundtrip), but API key stays server-side. Caching repeated URLs avoids unnecessary API spend.

## ADR-003: DSCR Engine as Pure Function
- **Status**: Accepted
- **Context**: The DSCR calculation must be auditable, testable, and independent of any I/O.
- **Decision**: `calculateDSCR(property, strategy, params): DSCRResult` is a zero-dependency pure function in `/server/src/engine/dscr.engine.ts`. It takes normalized property data and strategy parameters, returns ratio, verdict, and itemized breakdown.
- **Consequences**: Trivial to unit test. Can be reused in webhook contexts, batch processing, or CLI tools later.

## ADR-004: Session-Based Auth with Passport.js
- **Status**: Accepted
- **Context**: Traditional server-rendered sessions are simpler for an Express + React SPA than JWT for MVP.
- **Decision**: Passport.js local strategy, express-session with connect-pg-simple store in Postgres.
- **Consequences**: Requires session cookie handling. CSRF protection needed. Can add JWT later for API-only clients.

## ADR-005: Tailwind v4 + shadcn/ui for Components
- **Status**: Accepted
- **Context**: Dark-mode requirement, rapid UI development, and consistency.
- **Decision**: Use shadcn/ui CLI to install components as local source files. Customize theme tokens for the DSCR brand. Tailwind v4 with CSS-first config.
- **Consequences**: Components are editable, not locked behind a package. Slightly larger initial bundle (tree-shakeable).

## ADR-006: Drizzle ORM with Neon PostgreSQL
- **Status**: Accepted
- **Context**: TypeScript-native ORM with minimal abstraction over SQL. Neon provides serverless Postgres with branching.
- **Decision**: Drizzle schema-first approach. Migrations via `drizzle-kit`. docker-compose Postgres for local dev.
- **Consequences**: Schema changes require migration files. No automatic migrations in production (use `drizzle-kit push` for dev only).

## ADR-007: Subscription Tiers as Database Entities
- **Status**: Accepted
- **Context**: Stripe manages payment lifecycle; our DB tracks the mapping between user, plan, and Stripe subscription ID.
- **Decision**: `subscription_plans` table (id, name, slug, price_monthly, features JSON). `subscriptions` table links user to plan with Stripe metadata. Stripe webhooks sync status changes.
- **Consequences**: Webhook endpoint must be idempotent. Free tier is a "null" subscription with a default limit.
