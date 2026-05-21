# Sprint Pack 001 — Core DSCR Flow (Vertical Slice 1)

---

## 1. Requirements

### Business Problem
A real estate investor finds a property on Zillow/Redfin and wants to know in seconds whether it cash-flows under DSCR lending criteria. Currently they build spreadsheets or wait for a lender — both are slow and error-prone.

### User Story
> As a property investor, I paste a Zillow URL, see the property data extracted automatically, adjust any numbers, pick my strategy (Buy & Hold), and get an instant DSCR verdict (Pass / Caution / Fail) with a full breakdown so I know whether to pursue the deal.

### Functional Requirements
1. **FR1**: User pastes a major US listing URL (Zillow, Redfin, Realtor.com).
2. **FR2**: System calls OpenAI to extract: address, price, beds, baths, sqft, year built, property type, estimated rent, HOA.
3. **FR3**: User sees extracted data in an editable form, pre-loaded with US state-average tax rate and insurance cost.
4. **FR4**: User selects "Buy & Hold" strategy and adjusts loan parameters (down payment %, interest rate, loan term).
5. **FR5**: System calculates DSCR = NOI / Total Debt Service. Returns verdict:
   - **Green (PASS)**: DSCR ≥ 1.25×
   - **Amber (CAUTION)**: DSCR 1.0–1.25×
   - **Red (FAIL)**: DSCR < 1.0×
6. **FR6**: User sees an itemized breakdown of all inputs and calculated fields.

### Non-Functional Requirements
- DSCR engine must be a pure function with zero I/O.
- AI scraping must handle URL validation failure gracefully (show manual form).
- All monetary values displayed in USD with 2 decimal places.
- All percentages displayed to 1 decimal place.
- Loading state required during AI extraction.
- Error state if AI extraction fails.

---

## 2. Blueprint — File Paths & Structure

```
dscr-verdict/
├── package.json                  # Root: npm workspaces config
├── .gitignore
├── .env.example
├── docker-compose.yml            # Local Postgres
├── tsconfig.base.json            # Shared TS config
│
├── shared/                       # Shared types & constants
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── types/
│       │   ├── property.ts       # PropertyData, ScrapeResult
│       │   ├── analysis.ts       # DSCRInput, DSCRResult, Strategy, Verdict
│       │   └── api.ts            # API request/response shapes
│       └── constants/
│           ├── strategies.ts     # Strategy enums, labels
│           ├── verdict.ts        # DSCR thresholds, Verdict type
│           └── states.ts         # US state tax/insurance defaults
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                      # DB_URL, OPENAI_KEY, SESSION_SECRET
│   ├── drizzle.config.ts
│   ├── src/
│   │   ├── index.ts              # Express app bootstrap
│   │   ├── app.ts                # Express app creation (for testing)
│   │   ├── db/
│   │   │   ├── index.ts          # Drizzle client init
│   │   │   └── schema/
│   │   │       ├── index.ts      # Re-export all tables
│   │   │       ├── users.ts
│   │   │       ├── properties.ts
│   │   │       ├── analyses.ts
│   │   │       ├── subscriptionPlans.ts
│   │   │       └── subscriptions.ts
│   │   ├── engine/
│   │   │   ├── dscr.engine.ts     # PURE FUNCTION: calculateDSCR()
│   │   │   └── dscr.engine.test.ts
│   │   ├── services/
│   │   │   ├── scraping.service.ts # URL validation, OpenAI call, parse response
│   │   │   └── state-defaults.ts   # US state tax/insurance lookup
│   │   ├── middleware/
│   │   │   ├── auth.ts            # Passport.js session guard
│   │   │   ├── rate-limit.ts      # Rate limiter for scrape endpoint
│   │   │   └── error-handler.ts   # Global error handler
│   │   ├── routes/
│   │   │   ├── index.ts           # Router aggregation
│   │   │   ├── auth.routes.ts
│   │   │   ├── property.routes.ts # POST /scrape, POST /save
│   │   │   └── analysis.routes.ts # POST /analyze, GET /:id
│   │   └── cli/
│   │       └── seed-plans.ts      # Seed subscription_plans table
│   └── drizzle/                   # Auto-generated migration files
│
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── postcss.config.js          # Tailwind v4
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css              # Tailwind imports + shadcn theme vars
│   │   ├── lib/
│   │   │   ├── api.ts             # Axios/fetch wrapper
│   │   │   └── utils.ts           # cn() helper, formatters
│   │   ├── hooks/
│   │   │   └── use-analysis.ts    # React Query mutation for analysis
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── ThemeToggle.tsx
│   │   │   ├── property/
│   │   │   │   ├── UrlInput.tsx        # URL paste input + submit
│   │   │   │   ├── PropertyForm.tsx    # Editable extracted data form
│   │   │   │   └── StateSelector.tsx   # State dropdown for defaults
│   │   │   ├── analysis/
│   │   │   │   ├── StrategySelector.tsx
│   │   │   │   ├── LoanParamsForm.tsx
│   │   │   │   ├── DSCRVerdict.tsx     # Color-coded verdict card
│   │   │   │   └── BreakdownTable.tsx  # Itemized calculation table
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorAlert.tsx
│   │   ├── pages/
│   │   │   ├── AnalyzePage.tsx         # MAIN: the DSCR flow page
│   │   │   ├── DashboardPage.tsx
│   │   │   └── LoginPage.tsx
│   │   └── routes.tsx
```

### Database Schema (Drizzle)

```sql
-- users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  stripe_customer_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- properties
CREATE TABLE properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  url           TEXT,
  address       TEXT NOT NULL,
  price         NUMERIC(12,2) NOT NULL,
  beds          INT,
  baths         NUMERIC(3,1),
  sqft          INT,
  property_type TEXT,        -- 'single_family','condo','townhouse','multi_family'
  year_built    INT,
  estimated_rent NUMERIC(10,2),
  hoa           NUMERIC(8,2) DEFAULT 0,
  property_tax_rate NUMERIC(6,4),
  insurance_rate   NUMERIC(6,4),
  scrape_raw    JSONB,       -- raw OpenAI response for audit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- analyses
CREATE TABLE analyses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  property_id    UUID NOT NULL REFERENCES properties(id),
  strategy       TEXT NOT NULL,  -- 'buy_and_hold' | 'brrrr' | 'fix_and_flip' | 'str'
  dscr_ratio     NUMERIC(5,3),
  verdict        TEXT,           -- 'pass' | 'caution' | 'fail'
  monthly_income      NUMERIC(10,2),
  vacancy             NUMERIC(10,2),
  operating_expenses  NUMERIC(10,2),
  property_management NUMERIC(10,2),
  repairs             NUMERIC(10,2),
  capex               NUMERIC(10,2),
  noi                 NUMERIC(10,2),
  principal_interest  NUMERIC(10,2),
  taxes               NUMERIC(10,2),
  insurance           NUMERIC(10,2),
  hoa_expense         NUMERIC(10,2),
  total_debt_service  NUMERIC(10,2),
  down_payment_pct    NUMERIC(5,2),
  interest_rate       NUMERIC(5,3),
  loan_term_years     INT DEFAULT 30,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- subscription_plans
CREATE TABLE subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC(8,2) NOT NULL,
  features      JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- subscriptions
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  plan_id             UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  status              TEXT NOT NULL DEFAULT 'active',  -- active|past_due|canceled|incomplete
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Key Data Flow (Vertical Slice 1)

```
[Browser]                   [Server]                    [OpenAI]       [DB]
   |                           |                           |              |
   |-- POST /api/analyze ----->|                           |              |
   |   { url, strategy,        |                           |              |
   |     downPayment, rate,    |                           |              |
   |     term }                |                           |              |
   |                           |-- Check cache (URL hash)->|              |
   |                           |-- (miss) POST chat ------->|             |
   |                           |   "Extract: {url}"        |              |
   |                           |<-- JSON property data ----|              |
   |                           |                           |              |
   |                           |-- Upsert properties ----->|              |
   |                           |-- calculateDSCR() ------->| (pure fn)    |
   |                           |                           |              |
   |                           |-- INSERT analyses ------->|              |
   |<-- 201 { dscrRatio,       |                           |              |
   |      verdict, breakdown } |                           |              |
   |                           |                           |              |
```

---

## 3. Core API Endpoints (Vertical Slice 1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/analyze` | Required | Accept URL + strategy params, scrape property, calculate DSCR, return verdict |
| `GET` | `/api/analyze/:id` | Required | Retrieve a saved analysis |
| `GET` | `/api/properties/:id` | Required | Get property details |
| `POST` | `/api/auth/register` | No | Create account (name, email, password) |
| `POST` | `/api/auth/login` | No | Login, establish session |
| `POST` | `/api/auth/logout` | Required | Destroy session |

### POST /api/analyze — Request

```json
{
  "url": "https://www.zillow.com/homedetails/123-Main-St/...",
  "strategy": "buy_and_hold",
  "params": {
    "downPaymentPercent": 20,
    "interestRate": 6.5,
    "loanTermYears": 30,
    "propertyTaxRate": null,
    "insuranceRate": null
  },
  "overrides": {
    "price": null,
    "estimatedRent": null,
    "hoa": null
  }
}
```

### POST /api/analyze — Response (201)

```json
{
  "id": "uuid",
  "property": {
    "id": "uuid",
    "address": "123 Main St, Austin, TX 78701",
    "price": 350000,
    "beds": 3,
    "baths": 2,
    "sqft": 1500,
    "propertyType": "single_family",
    "yearBuilt": 2010,
    "estimatedRent": 2800,
    "hoa": 50
  },
  "strategy": "buy_and_hold",
  "dscrRatio": 1.35,
  "verdict": "pass",
  "breakdown": {
    "income": {
      "grossRent": 2800,
      "vacancy": -140,
      "effectiveIncome": 2660
    },
    "expenses": {
      "operating": -280,
      "propertyManagement": -168,
      "repairs": -140,
      "capex": -84
    },
    "noi": 1988,
    "debtService": {
      "principalInterest": -1325.67,
      "propertyTax": -291.67,
      "insurance": -87.50,
      "hoa": -50,
      "total": -1754.84
    },
    "dscrRatio": 1.35,
    "verdict": "pass"
  },
  "createdAt": "2026-05-21T..."
}
```

---

## 4. Acceptance Criteria

| # | Criterion | Test Method |
|---|-----------|-------------|
| AC1 | User pastes valid Zillow URL → system extracts property data (address, price, beds, baths, sqft, estimated rent) | Tracer Bullet test (mocked AI) |
| AC2 | AI extraction fails or URL invalid → system shows manual entry form with state-average defaults | Unit test on scraping service error path |
| AC3 | User adjusts any field in the property form → system uses override values | Integration test |
| AC4 | User selects Buy & Hold with 20% down, 6.5% rate, 30yr → DSCR calculated correctly | Unit test on dscr.engine |
| AC5 | DSCR ≥ 1.25 → green PASS badge displayed | Unit test |
| AC6 | DSCR 1.0–1.25 → amber CAUTION badge displayed | Unit test |
| AC7 | DSCR < 1.0 → red FAIL badge displayed | Unit test |
| AC8 | Itemized breakdown shows all line items matching user inputs | Integration test |
| AC9 | Analysis is saved to DB and retrievable by ID | Integration test |
| AC10 | Loading spinner shown during AI extraction | Frontend component test |
| AC11 | Error state shown if server returns 5xx | Frontend component test |

---

## 5. Handoff Prompt (for Builder AI)

```
You are the Builder under the Architect/Builder Framework. Your job is to implement Sprint Pack 001 (Core DSCR Flow) from the architectural specification in sprint-001-dscr-flow.md.

## CRITICAL: Dry Run First
Before writing a single line of code, output a "Dry Run" plan that:
1. Lists every file you will create, in order
2. For each file, states the exact imports it needs and which other files depend on it
3. Identifies any missing assumptions or ambiguities in the spec
4. Estimates test pass/fail expectations before code exists

Wait for my approval of the Dry Run before writing code.

## Implementation Rules
- TDD FIRST: Write the Tracer Bullet test (defined below and in important_state.md) before any implementation code.
- Install all npm dependencies as you go (no deferred package installs).
- Use Drizzle schema file for migrations (run `drizzle-kit push` in dev).
- Every new file must have a corresponding test file.
- Pure functions must have 100% line coverage.
- Routes must be tested with supertest.
- No speculative exports, no unused imports.
- Run `npx tsc --noEmit` after every meaningful change.
- Do NOT commit code — leave it unstaged.

## Tracer Bullet Test (RED)
Write this FIRST as a single integration test:

```typescript
// server/src/routes/analyze.integration.test.ts
describe('POST /api/analyze — Core DSCR Flow', () => {
  it('accepts a Zillow URL, extracts property data (mocked AI), calculates DSCR, returns verdict', async () => {
    // Arrange: mock OpenAI ScrapingService to return known property data
    // Arrange: authenticated user session via test helper
    // Act: POST /api/analyze with { url, strategy: 'buy_and_hold', params }
    // Assert: 201 response
    // Assert: response.dscrRatio === expected value (pre-calculated manually)
    // Assert: response.verdict === 'pass' | 'caution' | 'fail'
    // Assert: response.breakdown contains all line items
    // Assert: analysis row exists in test DB
  });
});
```

Before this test can be written, you need:
1. Express app factory (`app.ts`) that does NOT call `app.listen()`
2. Test database setup (docker-compose Postgres)
3. Supertest and vitest/jest installed
4. Mock for ScrapingService

## Reference Documents
- agents.md — role definitions
- decisions.md — ADRs (especially ADR-003: pure DSCR engine)
- risks.md — rate limiting and error handling to remember
- important_state.md — project tracking
```

---

## 6. Tracer Bullet Test (Standalone Reference)

The single integration test that proves the end-to-end path:

**File**: `server/src/routes/analyze.integration.test.ts`

**What it proves**:
1. HTTP layer works (Express + supertest)
2. Auth middleware works (session established)
3. ScrapingService callable and mockable (mocked to return known data)
4. DSCR engine returns correct ratio (pre-calculated manually: $2,660 NOI / $1,754.84 debt = 1.52× → PASS)
5. Response shape matches `DSCRResult` type
6. Analysis persisted to database
7. Full breakdown returned

**Pre-calculated expected values**:
- Property: $350,000, 20% down ($70,000), loan $280,000 @ 6.5% / 30yr
- P&I: $1,770.62 (monthly)
- Gross rent: $2,800
- Vacancy 5%: -$140 → $2,660 effective
- OpEx 10%: -$280
- PM 6%: -$168
- Repairs 5%: -$140
- CapEx 3%: -$84
- NOI: $1,988
- Prop tax (1.0% annual): $291.67/mo
- Insurance ($1,050/yr): $87.50/mo
- HOA: $50/mo
- Total debt: $2,199.79
- DSCR: 1,988 / 2,199.79 = 0.90 → **FAIL (Red)**

**State needed**: Authenticated user session (seeded or created in test `beforeAll`).
