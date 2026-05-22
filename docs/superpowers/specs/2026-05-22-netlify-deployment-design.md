# DSCR Verdict — Netlify Deployment Design

## Status: Draft

## Goal

Deploy DSCR Verdict (Express API + React SPA) to **Netlify** with **Neon** PostgreSQL.

## Architecture

```
Browser ──► Netlify CDN ──► /api/* ──► Netlify Function (Express via serverless-http)
                           └── assets/*, /* ──► static files from client/dist/
```

- Single Netlify site serves both client and server from same origin.
- No CORS issues in production (same-origin).
- Client build: `vite build` → `client/dist/`
- Server build: `tsc` → `server/dist/`, then invoked as Netlify Function.

## Files to Create

### `netlify.toml` (project root)

```toml
[build]
  command = "npm run build"
  publish = "client/dist"
  functions = "server/dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/netlify/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### `server/src/netlify.ts`

Single Netlify Function entry point that wraps the Express app:

```ts
import { createApp } from './app.js';
import serverless from 'serverless-http';

const app = createApp();
export const handler = serverless(app);
```

### `server/src/db/session-store.ts`

Wires `connect-pg-simple` for production session persistence (serverless has no in-memory):

```ts
import PgSession from 'connect-pg-simple';
import session from 'express-session';
import pg from 'pg';

const PgStore = PgSession(session);

export function createPgSessionStore() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return new PgStore({ pool });
}
```

## Files to Modify

### `server/src/app.ts`

- In production (`NODE_ENV === 'production'`), use `connect-pg-simple` store with a new Postgres pool instead of default in-memory store.
- Import `connect-pg-simple` factory and create the store when in production.
- Keep in-memory store for dev/test (no change to test behavior).

### `server/package.json`

Add dependencies:
- `serverless-http` — wraps Express for Netlify Functions
- `pg` — Postgres client for connect-pg-simple pool

Build script compiles to `server/dist/`.

### `client/vite.config.ts`

- Add `base: '/'` (default, explicit for clarity)
- Set `outDir: 'dist'` relative to client (default)

## Session Handling

- Dev: in-memory store (current behavior, unchanged)
- Production: `connect-pg-simple` store backed by Neon Postgres
- Cookie: `secure: true` (already gated on `NODE_ENV === 'production'`)
- Netlify serves HTTPS, so secure cookies work

## CORS

- Production: same-origin, no CORS issues. CORS middleware still applies but is a no-op for same-origin.
- Keep `cors({ origin: process.env.CLIENT_URL, credentials: true })` but set `CLIENT_URL` to the Netlify site URL in production env vars.

## Environment Variables (Netlify)

| Key | Source |
|-----|--------|
| `DATABASE_URL` | Neon dashboard |
| `OPENAI_API_KEY` | OpenAI |
| `SESSION_SECRET` | Generate strong random string |
| `STRIPE_SECRET_KEY` | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI/webhook config |
| `STRIPE_PRICE_STARTER` | Stripe product |
| `STRIPE_PRICE_PRO` | Stripe product |
| `STRIPE_PRICE_LIFETIME` | Stripe product |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Netlify site URL (e.g. `https://dscr-verdict.netlify.app`) |

## Database

- Neon Postgres (serverless, already in ADRs)
- Migrations: run `drizzle-kit push` against production URL once, or generate migration SQL and apply manually
- Netlify Function connects via standard `DATABASE_URL`

## Out of Scope

- Custom domain (manual DNS setup, not in spec)
- CI/CD pipeline (Netlify auto-deploys from Git, no config needed)
- Server-side rate limiting / DDOS (Netlify provides edge-level protection)
- Staging/PR previews (Netlify supports these out of box via branch deploys)
