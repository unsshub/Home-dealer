# Multi-Strategy DSCR Engine Design

## Goal
Replace the current strategy-agnostic DSCR engine with a strategy-aware registry pattern where each investment strategy (`buy_and_hold`, `brrrr`, `fix_and_flip`, `str`) has its own calculator module with strategy-specific inputs, calculation logic, and output shape.

## Architecture: Strategy Registry Pattern

```
server/src/engine/
  calculator.ts          ← StrategyCalculator interface + registry (map[strategy] → instance)
  buy-and-hold.ts        ← existing DSCR formula, unchanged
  brrrr.ts               ← ARV-based refi loan amount
  fix-and-flip.ts        ← ROI/profit + DSCR dual output
  short-term-rental.ts   ← seasonal income + booking-based costs
```

Each module exports a class implementing:

```ts
interface StrategyCalculator<I extends z.ZodType, O> {
  inputSchema: I;
  calculate(input: z.infer<I>, params: AnalysisParams): O;
}
```

The route handler calls `registry[strategy].calculate()` instead of the current flat `calculateDSCR()`.

## Strategy-Specific Inputs

All strategies share these base financial params: `downPaymentPercent`, `interestRate`, `loanTermYears`, `propertyTaxRate`, `insuranceRate`.

### Buy & Hold
- No new inputs beyond current shared property fields
- Price field = "Purchase Price"

### BRRRR
- New field: `afterRepairValue` (required, positive number)
- Price field = "Purchase Price" (used for tax/insurance basis)
- ARV field only renders when strategy=brrrr

### Fix & Flip
- New fields:
  - `afterRepairValue` (required, positive) — estimated sale price after rehab
  - `rehabCosts` (required, positive) — total renovation costs
  - `holdingPeriodMonths` (required, integer, 1-36) — expected flip duration
  - `sellingCostsPercent` (required, 0-15) — realtor/closing costs as % of ARV
- Price field = "Purchase Price"
- All fields only render when strategy=fix_and_flip

### Short-Term Rental
- New fields:
  - `peakMonthlyRent` (required, positive) — monthly income in peak season
  - `offPeakMonthlyRent` (required, positive) — monthly income in off-peak
  - `peakMonths` (required, integer, 1-12) — how many months are peak
  - `bookingFeePercent` (required, 0-30) — Airbnb/VRBO platform fee
  - `cleaningCostPerBooking` (required, positive) — turnover cleaning cost
  - `monthlyUtilities` (required, positive) — utilities the owner pays
- Default vacancy: 25% (vs 5% for LTR)
- All fields only render when strategy=str

## Calculation Logic

### Buy & Hold
Identical to current `calculateDSCR()`:
- Loan = price × (1 - downPayment%/100)
- P&I = monthlyPayment(loan, rate, term)
- Debt service = P&I + tax + insurance + HOA
- NOI = grossRent - vacancy - operatingExpenses - mgmt - repairs - capex
- DSCR = NOI / debt service

### BRRRR
Same as Buy & Hold, but:
- `loanAmount = ARV × (1 - downPaymentPercent/100)` — the refi loan is based on after-repair value
- Property tax and insurance still based on purchase price
- Everything else (rent, expenses, HOA) identical

### Fix & Flip
Dual output:
1. **DSCR** — calculated as-if-held-as-rental using purchase price (not ARV):
   - Same formula as Buy & Hold
2. **Flip Metrics**:
   - `totalInvestment = purchasePrice + rehabCosts`
   - `netProceeds = ARV × (1 - sellingCostsPercent/100)`
   - `grossProfit = netProceeds - totalInvestment`
   - `roi = grossProfit / totalInvestment × 100`
   - `annualizedRoi = ((1 + roi/100)^(12/holdingPeriod) - 1) × 100`

### Short-Term Rental
Structural formula changes:
- **Income**: `blendedMonthlyIncome = (peakRent × peakMonths + offPeakRent × (12 - peakMonths)) / 12`
- **Vacancy**: default 25% (was 5%), applied to blended income
- **Operating costs** use booking-based model instead of % of rent:
  - `bookingFees = blendedMonthlyIncome × bookingFeePercent / 100`
  - `cleaning = cleaningCostPerBooking × (occupancyDays / avgStayDays)` — occupancy days derived from occupancy rate; avgStayDays assumed 4
  - `utilities = monthlyUtilities`
- Remaining line items:
  - `operatingExpenseRate`: 15% (vs 10% — misc STR costs like supplies, permits)
  - `propertyManagementRate`: 10% (vs 6% — third-party STR managers charge more)
  - `repairsRate`: 8% (vs 5% — higher wear from guest turnover)
  - `capexRate`: 5% (vs 3% — faster furnishing refresh cycle)
- The three booking-based costs (`bookingFees`, `cleaning`, `utilities`) are summed into the existing `operatingExpenses` breakdown line (replaces the percentage-based calculation — STR `operatingExpenses` is absolute, not `grossRent × rate`).
- Debt service calculation: unchanged (P&I + tax + insurance + HOA)

## Result Shape

Common base found in all results:
```ts
interface AnalysisResult {
  dscrRatio: number;
  verdict: Verdict;
  breakdown: DSCRBreakdown;
}
```

`fix_and_flip` extends the base with:
```ts
interface FixAndFlipResult extends AnalysisResult {
  strategy: 'fix_and_flip';
  flipMetrics: {
    totalInvestment: number;
    netProceeds: number;
    grossProfit: number;
    roi: number;
    annualizedRoi: number;
  };
}
```

## API Changes

### Request — POST /api/analyze/manual

Strategy-specific fields nested under `property`:

```json
{
  "property": {
    "address": "123 Main St",
    "price": 200000,
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1400,
    "propertyType": "single_family",
    "yearBuilt": 2015,
    "estimatedRent": 2500,
    "hoa": 50,
    "afterRepairValue": 280000,
    "rehabCosts": 40000,
    "holdingPeriodMonths": 6,
    "sellingCostsPercent": 8,
    "peakMonthlyRent": 5000,
    "offPeakMonthlyRent": 3000,
    "peakMonths": 6,
    "bookingFeePercent": 15,
    "cleaningCostPerBooking": 150,
    "monthlyUtilities": 350
  },
  "strategy": "fix_and_flip",
  "params": { ... }
}
```

Only the fields relevant to the chosen strategy are validated (Zod `superRefine` or discriminated schema).

### Response

Same shape as today, but adds `flipMetrics` when strategy is `fix_and_flip`. The `strategy` field is present on all responses.

## Testing Plan

### Unit Tests (server/src/engine/)
- `buy-and-hold.test.ts` — existing 6 tests, unchanged
- `brrrr.test.ts` — ARV increases loan amount, lower debt service, higher DSCR
- `fix-and-flip.test.ts` — profit/ROI calculation, edge cases (zero profit, ARV < investment)
- `short-term-rental.test.ts` — blended income, booking costs, default vacancy

### Integration Tests
- `manual-analyze.test.ts` — per-strategy request/response validation
- Zod schema tests for conditional required fields (e.g., ARV required when strategy=brrrr)

### Client
- Existing AnalyzePage tests if any; manual smoke test for conditional field rendering

## Implementation Order

1. Server: Calculator interface + registry in `calculator.ts`
2. Server: Refactor `buy-and-hold.ts` from current `dscr.engine.ts`
3. Server: Implement `brrrr.ts` calculator
4. Server: Implement `short-term-rental.ts` calculator
5. Server: Implement `fix-and-flip.ts` calculator
6. Server: Update route handlers to use registry
7. Server: Update Zod schemas for conditional validation
8. Shared: Update types for strategy-specific inputs
9. Client: Strategy-conditional input fields on AnalyzePage
10. Client: Flip metrics display on result
11. Client: STR result display (contextual breakdown labels)

## Open Questions / Future
- STR estimated bookings: deriving from occupancy rate + average stay; if users want direct booking count input instead, easy to swap
