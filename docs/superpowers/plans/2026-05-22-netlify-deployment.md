# Netlify Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy DSCR Verdict (Express API + React SPA) to Netlify with Neon PostgreSQL.

**Architecture:** Netlify Function wraps Express via `serverless-http`, session persistence via `connect-pg-simple` backed by Neon Postgres, static client assets served from Vite build output. Production build compiles shared package before server.

**Tech Stack:** Netlify Functions, serverless-http, connect-pg-simple, Neon (Postgres), Vite

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `shared/tsconfig.json` | Create | Compile shared types/constants to JS for production |
| `shared/package.json` | Modify | Add build script, update exports for production |
| `server/package.json` | Modify | Add `serverless-http`, `pg` dependencies |
| `server/src/db/session-store.ts` | Create | connect-pg-simple store factory |
| `server/src/app.ts` | Modify | Use pg session store in production |
| `server/src/netlify.ts` | Create | Netlify Function entry point |
| `netlify.toml` | Create | Site config, redirects, build commands |

---

### Task 1: Add production build to shared package

**Files:**
- Create: `shared/tsconfig.json`
- Modify: `shared/package.json`

- [ ] **Step 1: Create shared/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Update shared/package.json**

Current `shared/package.json`:

```json
{
  "name": "@dscr/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

Replace `main`, `types`, and `exports` to point to compiled output, and add `build` script:

```json
{
  "name": "@dscr/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Verify shared compiles**

Run: `npm run build --workspace=shared`

Expected: `shared/dist/` directory created with `.js` and `.d.ts` files mirroring `shared/src/` structure.

---

### Task 2: Add production dependencies to server

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Install serverless-http and pg**

Run: `npm install --workspace=server serverless-http pg`

Also install `@types/pg` as dev dependency:

Run: `npm install --save-dev --workspace=server @types/pg`

- [ ] **Step 2: Verify dependencies added**

Check `server/package.json` contains:
- `"serverless-http": "^..."` in dependencies
- `"pg": "^..."` in dependencies
- `"@types/pg": "^..."` in devDependencies

---

### Task 3: Wire connect-pg-simple session store

**Files:**
- Create: `server/src/db/session-store.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create server/src/db/session-store.ts**

```ts
import PgSession from 'connect-pg-simple';
import session from 'express-session';
import pg from 'pg';

const PgStore = PgSession(session);

export function createPgSessionStore() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return new PgStore({ pool, createTableIfMissing: true });
}
```

- [ ] **Step 2: Modify server/src/app.ts**

Current session setup (lines 22-30):

```ts
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production' },
    })
  );
```

Replace with:

```ts
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      store: isProduction ? createPgSessionStore() : undefined,
      cookie: { secure: isProduction },
    })
  );
```

Also add the import at top of file:

```ts
import { createPgSessionStore } from './db/session-store.js';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run typecheck --workspace=server`

Expected: No type errors.

---

### Task 4: Create Netlify Function entry point

**Files:**
- Create: `server/src/netlify.ts`

- [ ] **Step 1: Create server/src/netlify.ts**

```ts
import { createApp } from './app.js';
import serverless from 'serverless-http';

const app = createApp();
export const handler = serverless(app);
```

- [ ] **Step 2: Verify file compiles**

Run: `npm run build --workspace=server`

Expected: `server/dist/netlify.js` exists and exports `handler`.

---

### Task 5: Create netlify.toml

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Create netlify.toml at project root**

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

---

### Task 6: Verify full build pipeline

- [ ] **Step 1: Run full build**

Run: `npm run build`

Expected:
- `shared/dist/` — compiled JS + declarations
- `server/dist/` — compiled JS including `netlify.js`
- `client/dist/` — Vite static output

- [ ] **Step 2: Verify Netlify function structure**

Check: `ls server/dist/netlify.js`

Expected: file exists, is a valid ESM module exporting `handler`.

- [ ] **Step 3: Run existing tests**

Run: `npm run test --workspace=server`

Expected: All existing tests pass (session store change is production-only, tests use in-memory store).

- [ ] **Step 4: Verify netlify.toml**

Run: `npx netlify-cli build --dry` (if netlify-cli available) or manual review of `netlify.toml` structure.

Expected: Build config is valid TOML, redirects are correctly ordered (API redirect before SPA fallback).
