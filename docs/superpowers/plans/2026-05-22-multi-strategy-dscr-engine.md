# Multi-Strategy DSCR Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the strategy-agnostic DSCR engine with a registry pattern where each strategy (`buy_and_hold`, `brrrr`, `fix_and_flip`, `str`) has its own calculator with strategy-specific inputs, logic, and output.

**Architecture:** A `registry: Record<Strategy, DSCRCalculator>` maps strategy types to calculator functions. Each calculator accepts `DSCRInput` (with new optional strategy-specific fields) and returns `DSCRResult` (with optional `flipMetrics` for fix_and_flip). Route handlers dispatch via `registry[strategy](input)`.

**Tech Stack:** Express, Zod, Vitest, React, TypeScript

---

## File Map

### Create:
- `server/src/engine/calculator.ts` — calculator type + registry
- `server/src/engine/buy-and-hold.ts` — Buy & Hold calculator (current logic extracted here)
- `server/src/engine/brrrr.ts` — BRRRR calculator
- `server/src/engine/fix-and-flip.ts` — Fix & Flip calculator
- `server/src/engine/short-term-rental.ts` — STR calculator
- `server/src/engine/brrrr.test.ts` — BRRRR unit tests
- `server/src/engine/fix-and-flip.test.ts` — Fix & Flip unit tests
- `server/src/engine/short-term-rental.test.ts` — STR unit tests

### Modify:
- `shared/src/types/analysis.ts` — add optional strategy-specific fields to `DSCRInput`, add `FlipMetrics` type, add `flipMetrics` to `DSCRResult`
- `shared/src/types/api.ts` — add optional `flipMetrics` to `AnalyzeResponse`
- `shared/src/index.ts` — export `FlipMetrics` (re-exported from analysis)
- `server/src/engine/dscr.engine.ts` — re-export Buy & Hold from new location (backward compat)
- `server/src/engine/dscr.engine.test.ts` — move to buy-and-hold.test.ts
- `server/src/routes/analyze.routes.ts` — use `registry[strategy]` instead of `calculateDSCR`
- `client/src/pages/AnalyzePage.tsx` — conditional strategy-specific input fields
- `client/src/pages/AnalysisDetailPage.tsx` — show flip metrics when present

---

### Task 1: Tracer Bullet — Calculator Registry + Buy & Hold

**Files:**
- Create: `server/src/engine/calculator.ts`
- Create: `server/src/engine/buy-and-hold.ts`
- Modify: `server/src/engine/dscr.engine.ts`

- [ ] **Step 1: Write the tracer bullet test in calculator.ts**

```ts
// server/src/engine/calculator.ts
import type { DSCRInput, DSCRResult, Strategy } from '@dscr/shared';
import { buyAndHoldCalculate } from './buy-and-hold';

export type DSCRCalculator = (input: DSCRInput) => DSCRResult;

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: buyAndHoldCalculate,       // placeholder — replaced in Task 3
  fix_and_flip: buyAndHoldCalculate, // placeholder — replaced in Task 4
  str: buyAndHoldCalculate,          // placeholder — replaced in Task 5
};
```

Write a test to prove the redirection works by adding it to a new file alongside this one (we'll name it later):

Actually, the tracer bullet needs ONE test to prove the path works. Let me integrate by writing a simpler test first:

- [ ] **Step 1: Create `server/src/engine/calculator.ts`**

```ts
import type { DSCRInput, DSCRResult, Strategy } from '@dscr/shared';

export type DSCRCalculator = (input: DSCRInput) => DSCRResult;

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: undefined as unknown as DSCRCalculator,
  brrrr: undefined as unknown as DSCRCalculator,
  fix_and_flip: undefined as unknown as DSCRCalculator,
  str: undefined as unknown as DSCRCalculator,
};
```

- [ ] **Step 2: Write a tracer bullet test — registry returns Buy & Hold result**

```ts
// server/src/engine/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { registry } from './calculator';
import type { DSCRInput } from '@dscr/shared';

function makeInput(overrides?: Partial<DSCRInput>): DSCRInput {
  return {
    price: 350000,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    monthlyGrossRent: 2800,
    monthlyHoa: 50,
    annualPropertyTaxRate: 1.0,
    annualInsuranceRate: 0.3,
    vacancyRate: 5,
    operatingExpenseRate: 10,
    propertyManagementRate: 6,
    repairsRate: 5,
    capexRate: 3,
    ...overrides,
  };
}

describe('registry', () => {
  it('dispatches buy_and_hold to a calculator that returns DSCR result', () => {
    const result = registry['buy_and_hold'](makeInput());
    expect(result).toHaveProperty('dscrRatio');
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('breakdown');
  });
});
```

- [ ] **Step 3: Run test to see it fail**

Run: `npx vitest run server/src/engine/calculator.test.ts`
Expected: TypeError — `registry[fn] is not a function`

- [ ] **Step 4: Create `server/src/engine/buy-and-hold.ts`**

```ts
import type { DSCRInput, DSCRResult, DSCRBreakdown } from '@dscr/shared';
import { getVerdict } from '@dscr/shared';

function monthlyPayment(principal: number, annualRate: number, termYears: number): number {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return principal * (r * factor) / (factor - 1);
}

export function buyAndHoldCalculate(input: DSCRInput): DSCRResult {
  const price = input.price;
  const downPayment = price * (input.downPaymentPercent / 100);
  const loanAmount = price - downPayment;

  const pAndI = monthlyPayment(loanAmount, input.interestRate, input.loanTermYears);
  const propertyTax = (price * (input.annualPropertyTaxRate / 100)) / 12;
  const insurance = (price * (input.annualInsuranceRate / 100)) / 12;
  const hoaExpense = input.monthlyHoa;

  const totalDebtService = pAndI + propertyTax + insurance + hoaExpense;

  const grossRent = input.monthlyGrossRent;
  const vacancy = grossRent * (input.vacancyRate / 100);
  const operatingExpenses = grossRent * (input.operatingExpenseRate / 100);
  const propertyManagement = grossRent * (input.propertyManagementRate / 100);
  const repairs = grossRent * (input.repairsRate / 100);
  const capex = grossRent * (input.capexRate / 100);

  const effectiveIncome = grossRent - vacancy;
  const noi = effectiveIncome - operatingExpenses - propertyManagement - repairs - capex;

  const dscrRatio = totalDebtService > 0 ? Math.round((noi / totalDebtService) * 1000) / 1000 : 0;

  const breakdown: DSCRBreakdown = {
    grossRent: Math.round(grossRent * 100) / 100,
    vacancy: -Math.round(vacancy * 100) / 100,
    effectiveIncome: Math.round(effectiveIncome * 100) / 100,
    operatingExpenses: -Math.round(operatingExpenses * 100) / 100,
    propertyManagement: -Math.round(propertyManagement * 100) / 100,
    repairs: -Math.round(repairs * 100) / 100,
    capex: -Math.round(capex * 100) / 100,
    noi: Math.round(noi * 100) / 100,
    principalInterest: -Math.round(pAndI * 100) / 100,
    propertyTax: -Math.round(propertyTax * 100) / 100,
    insurance: -Math.round(insurance * 100) / 100,
    hoaExpense: -Math.round(hoaExpense * 100) / 100,
    totalDebtService: Math.round(totalDebtService * 100) / 100,
  };

  return { dscrRatio, verdict: getVerdict(dscrRatio), breakdown, input };
}
```

- [ ] **Step 5: Wire registry to buy_and_hold**

```ts
// server/src/engine/calculator.ts
import type { DSCRInput, DSCRResult, Strategy } from '@dscr/shared';
import { buyAndHoldCalculate } from './buy-and-hold';

export type DSCRCalculator = (input: DSCRInput) => DSCRResult;

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: buyAndHoldCalculate,
  fix_and_flip: buyAndHoldCalculate,
  str: buyAndHoldCalculate,
};
```

- [ ] **Step 6: Run test to confirm green**

Run: `npx vitest run server/src/engine/calculator.test.ts`
Expected: PASS

- [ ] **Step 7: Update `dscr.engine.ts` to re-export from buy-and-hold (backward compat)**

```ts
// server/src/engine/dscr.engine.ts
export { buyAndHoldCalculate as calculateDSCR } from './buy-and-hold';
```

- [ ] **Step 8: Run existing engine tests to confirm they still pass**

Run: `npx vitest run server/src/engine/dscr.engine.test.ts`
Expected: 6 PASS

- [ ] **Step 9: Commit**

```bash
git add server/src/engine/calculator.ts server/src/engine/calculator.test.ts server/src/engine/buy-and-hold.ts server/src/engine/dscr.engine.ts
git commit -m "feat: strategy calculator registry with buy_and_hold"
```

---

### Task 2: Update Shared Types

**Files:**
- Modify: `shared/src/types/analysis.ts`
- Modify: `shared/src/types/api.ts`
- Modify: `shared/src/index.ts`

- [ ] **Step 1: Add strategy-specific fields to DSCRInput and add FlipMetrics**

```ts
// shared/src/types/analysis.ts
export type Strategy = 'buy_and_hold' | 'brrrr' | 'fix_and_flip' | 'str';

export type Verdict = 'pass' | 'caution' | 'fail';

export interface DSCRInput {
  price: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  monthlyGrossRent: number;
  monthlyHoa: number;
  annualPropertyTaxRate: number;
  annualInsuranceRate: number;
  vacancyRate: number;
  operatingExpenseRate: number;
  propertyManagementRate: number;
  repairsRate: number;
  capexRate: number;
  // BRRRR & Fix & Flip
  afterRepairValue?: number;
  // Fix & Flip only
  rehabCosts?: number;
  holdingPeriodMonths?: number;
  sellingCostsPercent?: number;
  // STR only
  peakMonthlyRent?: number;
  offPeakMonthlyRent?: number;
  peakMonths?: number;
  bookingFeePercent?: number;
  cleaningCostPerBooking?: number;
  monthlyUtilities?: number;
}

export interface DSCRBreakdown {
  grossRent: number;
  vacancy: number;
  effectiveIncome: number;
  operatingExpenses: number;
  propertyManagement: number;
  repairs: number;
  capex: number;
  noi: number;
  principalInterest: number;
  propertyTax: number;
  insurance: number;
  hoaExpense: number;
  totalDebtService: number;
}

export interface FlipMetrics {
  totalInvestment: number;
  netProceeds: number;
  grossProfit: number;
  roi: number;
  annualizedRoi: number;
}

export interface DSCRResult {
  dscrRatio: number;
  verdict: Verdict;
  breakdown: DSCRBreakdown;
  flipMetrics?: FlipMetrics;
  input: DSCRInput;
}

export interface AnalysisParams {
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate?: number | null;
  insuranceRate?: number | null;
}
```

- [ ] **Step 2: Add optional flipMetrics to AnalyzeResponse**

```ts
// shared/src/types/api.ts
export interface AnalyzeResponse {
  id: string;
  property: PropertyData & { id: string };
  strategy: Strategy;
  dscrRatio: number;
  verdict: Verdict;
  breakdown: DSCRBreakdown;
  flipMetrics?: FlipMetrics;
  createdAt: string;
}
```

- [ ] **Step 3: Export FlipMetrics**

```ts
// shared/src/index.ts
export * from './types/property';
export * from './types/analysis';
export * from './types/api';
export * from './constants/strategies';
export * from './constants/verdict';
export * from './constants/states';
```

(no change needed — `FlipMetrics` is in `types/analysis.ts` which is already re-exported)

- [ ] **Step 4: Run typecheck to confirm**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared/src/types/analysis.ts shared/src/types/api.ts
git commit -m "feat: add strategy-specific input fields and FlipMetrics to shared types"
```

---

### Task 3: BRRRR Calculator

**Files:**
- Create: `server/src/engine/brrrr.ts`
- Create: `server/src/engine/brrrr.test.ts`
- Modify: `server/src/engine/calculator.ts` — wire brrrr

- [ ] **Step 1: Write failing BRRRR test**

```ts
// server/src/engine/brrrr.test.ts
import { describe, it, expect } from 'vitest';
import { brrrrCalculate } from './brrrr';
import type { DSCRInput } from '@dscr/shared';

function makeInput(overrides?: Partial<DSCRInput>): DSCRInput {
  return {
    price: 200000,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    monthlyGrossRent: 2500,
    monthlyHoa: 0,
    annualPropertyTaxRate: 1.0,
    annualInsuranceRate: 0.3,
    vacancyRate: 5,
    operatingExpenseRate: 10,
    propertyManagementRate: 6,
    repairsRate: 5,
    capexRate: 3,
    afterRepairValue: 280000,
    ...overrides,
  };
}

describe('brrrrCalculate', () => {
  it('uses ARV for loan amount instead of purchase price', () => {
    const result = brrrrCalculate(makeInput());
    // ARV=280000, down=20%, loan=224000 → higher loan, lower DSCR than buy-and-hold
    expect(result.flipMetrics).toBeUndefined();
    expect(result.dscrRatio).toBeGreaterThan(0);
    // Compare: buy-and-hold with same price but no ARV would have loan=160000
    // BRRRR with ARV=280000 has loan=224000, so DSCR should be lower
    const buyAndHoldInput = makeInput({ afterRepairValue: undefined });
    const { buyAndHoldCalculate } = await import('./buy-and-hold');
    const bhResult = buyAndHoldCalculate(buyAndHoldInput);
    expect(result.dscrRatio).toBeLessThan(bhResult.dscrRatio);
  });

  it('returns verdict and breakdown like buy-and-hold', () => {
    const result = brrrrCalculate(makeInput());
    expect(result.verdict).toMatch(/^(pass|caution|fail)$/);
    expect(result.breakdown).toHaveProperty('noi');
    expect(result.breakdown).toHaveProperty('totalDebtService');
  });
});
```

Wait, I can't use dynamic `await import` at the top of a describe block in the same way. Let me restructure:

```ts
import { describe, it, expect } from 'vitest';
import { brrrrCalculate } from './brrrr';
import { buyAndHoldCalculate } from './buy-and-hold';
import type { DSCRInput } from '@dscr/shared';

function makeInput(overrides?: Partial<DSCRInput>): DSCRInput {
  return {
    price: 200000,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    monthlyGrossRent: 2500,
    monthlyHoa: 0,
    annualPropertyTaxRate: 1.0,
    annualInsuranceRate: 0.3,
    vacancyRate: 5,
    operatingExpenseRate: 10,
    propertyManagementRate: 6,
    repairsRate: 5,
    capexRate: 3,
    afterRepairValue: 280000,
    ...overrides,
  };
}

describe('brrrrCalculate', () => {
  it('uses ARV for loan amount instead of purchase price', () => {
    const result = brrrrCalculate(makeInput());
    const bhResult = buyAndHoldCalculate(makeInput({ afterRepairValue: undefined }));
    // BRRRR uses ARV for loan: 280000 * 0.8 = 224000
    // Buy&Hold uses purchase: 200000 * 0.8 = 160000
    // Higher loan → lower DSCR
    expect(result.dscrRatio).toBeLessThan(bhResult.dscrRatio);
  });

  it('returns standard result shape', () => {
    const result = brrrrCalculate(makeInput());
    expect(result.verdict).toMatch(/^(pass|caution|fail)$/);
    expect(result.breakdown).toHaveProperty('noi');
    expect(result.breakdown).toHaveProperty('totalDebtService');
  });
});
```

- [ ] **Step 2: Run test to see it fail**

Run: `npx vitest run server/src/engine/brrrr.test.ts`
Expected: Module not found error

- [ ] **Step 3: Implement BRRRR calculator**

```ts
// server/src/engine/brrrr.ts
import { buyAndHoldCalculate } from './buy-and-hold';
import type { DSCRInput, DSCRResult } from '@dscr/shared';

export function brrrrCalculate(input: DSCRInput): DSCRResult {
  const brrrrInput: DSCRInput = {
    ...input,
    price: input.afterRepairValue ?? input.price,
  };
  return buyAndHoldCalculate(brrrrInput);
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run server/src/engine/brrrr.test.ts`
Expected: PASS

- [ ] **Step 5: Wire brrrr in registry**

```ts
// server/src/engine/calculator.ts
import { buyAndHoldCalculate } from './buy-and-hold';
import { brrrrCalculate } from './brrrr';

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: brrrrCalculate,
  fix_and_flip: buyAndHoldCalculate,
  str: buyAndHoldCalculate,
};
```

- [ ] **Step 6: Run full engine test suite**

Run: `npx vitest run server/src/engine/`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/engine/brrrr.ts server/src/engine/brrrr.test.ts server/src/engine/calculator.ts
git commit -m "feat: BRRRR calculator with ARV-based loan"
```

---

### Task 4: Fix & Flip Calculator

**Files:**
- Create: `server/src/engine/fix-and-flip.ts`
- Create: `server/src/engine/fix-and-flip.test.ts`
- Modify: `server/src/engine/calculator.ts` — wire fix_and_flip

- [ ] **Step 1: Write Fix & Flip test**

```ts
// server/src/engine/fix-and-flip.test.ts
import { describe, it, expect } from 'vitest';
import { fixAndFlipCalculate } from './fix-and-flip';
import type { DSCRInput } from '@dscr/shared';

function makeInput(overrides?: Partial<DSCRInput>): DSCRInput {
  return {
    price: 200000,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    monthlyGrossRent: 2500,
    monthlyHoa: 0,
    annualPropertyTaxRate: 1.0,
    annualInsuranceRate: 0.3,
    vacancyRate: 5,
    operatingExpenseRate: 10,
    propertyManagementRate: 6,
    repairsRate: 5,
    capexRate: 3,
    afterRepairValue: 280000,
    rehabCosts: 40000,
    holdingPeriodMonths: 6,
    sellingCostsPercent: 8,
    ...overrides,
  };
}

describe('fixAndFlipCalculate', () => {
  it('returns flipMetrics with profit and ROI', () => {
    const result = fixAndFlipCalculate(makeInput());
    expect(result.flipMetrics).toBeDefined();
    // totalInvestment = 200000 + 40000 = 240000
    // netProceeds = 280000 * (1 - 0.08) = 257600
    // grossProfit = 257600 - 240000 = 17600
    // roi = 17600 / 240000 * 100 = 7.33%
    // annualizedRoi = (1 + 0.0733)^(12/6) - 1 = 15.2%
    expect(result.flipMetrics!.totalInvestment).toBe(240000);
    expect(result.flipMetrics!.grossProfit).toBeCloseTo(17600, 0);
    expect(result.flipMetrics!.netProceeds).toBeCloseTo(257600, 0);
    expect(result.flipMetrics!.roi).toBeCloseTo(7.33, 1);
  });

  it('returns DSCR alongside flip metrics', () => {
    const result = fixAndFlipCalculate(makeInput());
    expect(result.dscrRatio).toBeGreaterThan(0);
    expect(result.verdict).toMatch(/^(pass|caution|fail)$/);
    expect(result.breakdown).toHaveProperty('noi');
  });

  it('handles unprofitable flip', () => {
    const result = fixAndFlipCalculate(makeInput({
      price: 250000,
      rehabCosts: 60000,
      afterRepairValue: 280000,
    }));
    // totalInvestment = 310000, netProceeds = 257600, loss
    expect(result.flipMetrics!.grossProfit).toBeLessThan(0);
    expect(result.flipMetrics!.roi).toBeLessThan(0);
  });
});
```

- [ ] **Step 2: Run test to see it fail**

Run: `npx vitest run server/src/engine/fix-and-flip.test.ts`
Expected: Module not found

- [ ] **Step 3: Implement Fix & Flip calculator**

```ts
// server/src/engine/fix-and-flip.ts
import { buyAndHoldCalculate } from './buy-and-hold';
import type { DSCRInput, DSCRResult } from '@dscr/shared';

export function fixAndFlipCalculate(input: DSCRInput): DSCRResult {
  const dscrResult = buyAndHoldCalculate(input);

  const totalInvestment = input.price + (input.rehabCosts ?? 0);
  const netProceeds = (input.afterRepairValue ?? 0) * (1 - (input.sellingCostsPercent ?? 8) / 100);
  const grossProfit = netProceeds - totalInvestment;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  const holdingPeriod = input.holdingPeriodMonths ?? 6;
  const annualizedRoi = holdingPeriod > 0 && roi > -100
    ? (Math.pow(1 + roi / 100, 12 / holdingPeriod) - 1) * 100
    : roi > -100 ? roi : -100;

  return {
    ...dscrResult,
    flipMetrics: {
      totalInvestment,
      netProceeds: Math.round(netProceeds * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      annualizedRoi: Math.round(annualizedRoi * 100) / 100,
    },
  };
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run server/src/engine/fix-and-flip.test.ts`
Expected: PASS

Wait, the math: ROI = 17600/240000 * 100 = 7.333... and annualized ROI = (1 + 0.07333)^(12/6) - 1 = (1.07333)^2 - 1 = 1.152 - 1 = 0.152 = 15.2%.

Rounded to 2 decimal places: roi = 7.33, annualizedRoi = 15.20.

But my test says `expect(result.flipMetrics!.roi).toBeCloseTo(7.33, 1)`. With `toBeCloseTo(7.33, 1)`, this checks to 1 decimal place, i.e., 7.3. That should work.

Actually, `toBeCloseTo(7.33, 1)` checks precision to 1 decimal place, meaning it accepts values from 7.25-7.34. The actual value would be 7.333... rounded to 2 decimal places = 7.33. So it passes.

But wait, the actual calculation: 17600 / 240000 = 0.073333... * 100 = 7.3333... Then `Math.round(7.3333 * 100) / 100 = 7.33`. So `result.flipMetrics!.roi` = 7.33. `toBeCloseTo(7.33, 1)` checks if the value is within 0.05 of 7.33. That passes.

Let me double-check the test expectation for the unprofitable flip.
- price = 250000, rehabCosts = 60000, ARV = 280000, sellingCostsPercent = 8
- totalInvestment = 310000
- netProceeds = 280000 * 0.92 = 257600
- grossProfit = 257600 - 310000 = -52400
- roi = -52400 / 310000 * 100 = -16.90%

That should work. Let me continue.

- [ ] **Step 5: Wire fix_and_flip in registry**

```ts
// server/src/engine/calculator.ts
import { buyAndHoldCalculate } from './buy-and-hold';
import { brrrrCalculate } from './brrrr';
import { fixAndFlipCalculate } from './fix-and-flip';

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: brrrrCalculate,
  fix_and_flip: fixAndFlipCalculate,
  str: buyAndHoldCalculate,
};
```

- [ ] **Step 6: Run full engine test suite**

Run: `npx vitest run server/src/engine/`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/engine/fix-and-flip.ts server/src/engine/fix-and-flip.test.ts server/src/engine/calculator.ts
git commit -m "feat: Fix & Flip calculator with profit/ROI + DSCR dual output"
```

---

### Task 5: Short-Term Rental Calculator

**Files:**
- Create: `server/src/engine/short-term-rental.ts`
- Create: `server/src/engine/short-term-rental.test.ts`
- Modify: `server/src/engine/calculator.ts` — wire str

- [ ] **Step 1: Write STR test**

```ts
// server/src/engine/short-term-rental.test.ts
import { describe, it, expect } from 'vitest';
import { strCalculate } from './short-term-rental';
import type { DSCRInput } from '@dscr/shared';

function makeInput(overrides?: Partial<DSCRInput>): DSCRInput {
  return {
    price: 300000,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    monthlyGrossRent: 3000,
    monthlyHoa: 0,
    annualPropertyTaxRate: 1.0,
    annualInsuranceRate: 0.3,
    vacancyRate: 25,
    operatingExpenseRate: 10,
    propertyManagementRate: 10,
    repairsRate: 8,
    capexRate: 5,
    peakMonthlyRent: 6000,
    offPeakMonthlyRent: 3000,
    peakMonths: 6,
    bookingFeePercent: 15,
    cleaningCostPerBooking: 150,
    monthlyUtilities: 350,
    ...overrides,
  };
}

describe('strCalculate', () => {
  it('uses blended seasonal income instead of single rent', () => {
    const result = strCalculate(makeInput());
    // blended = (6000*6 + 3000*6) / 12 = 4500
    // vacancy = 4500 * 0.25 = 1125
    // effectiveIncome = 4500 - 1125 = 3375
    // bookingFees = 4500 * 0.15 = 675
    // cleaning: occupancy days estimate = 30 * (1 - 0.25) = 22.5; avg stay assumed 4; bookings = 22.5/4 ≈ 5.625 → 5.625 * 150 = 843.75
    // utilities = 350
    // operatingExpenses total = 675 + 843.75 + 350 = 1868.75
    // mgmt = 3375 * 0.10 = 337.5
    // repairs = 3375 * 0.08 = 270
    // capex = 3375 * 0.05 = 168.75
    // noi = 3375 - 1868.75 - 337.5 - 270 - 168.75 = 730
    // DSCR should be lower than buy-and-hold with same inputs due to higher costs
    expect(result.dscrRatio).toBeGreaterThan(0);
    expect(result.verdict).toMatch(/^(pass|caution|fail)$/);
  });

  it('reports higher operating costs than buy-and-hold for same property', () => {
    const result = strCalculate(makeInput());
    // operatingExpenses includes booking fees + cleaning + utilities
    // should be significantly higher than 10% of blended income
    expect(result.breakdown.operatingExpenses).toBeLessThan(0);
    expect(Math.abs(result.breakdown.operatingExpenses)).toBeGreaterThan(500);
  });
});
```

Hmm wait, the estimate for cleaning is getting complex. Let me simplify: the `operatingExpenses` for STR is the sum of `bookingFees + cleaning + utilities`. Instead of estimating bookings from occupancy, let me use a simpler model.

Actually, let me think about this differently. The current `operatingExpenses` line in the breakdown is `grossRent * (operatingExpenseRate / 100)`. For STR, I want to replace this with absolute costs. So instead of the rate-based approach, I calculate:

```
operatingExpenses = blendedIncome * bookingFeePercent / 100 + cleaningCostPerBooking + monthlyUtilities
```

Wait, but cleaningCostPerBooking is per booking, not per month. I need to estimate bookings per month.

Let me simplify: I'll estimate bookings per month as `(1 - vacancyRate/100) * 30 / 4` = occupied days / avg stay. With vacancyRate = 25%, that's `0.75 * 30 / 4 ≈ 5.6 bookings/month`. But that's an assumption.

Actually, let me make it even simpler. Instead of deriving bookings from occupancy, I'll make bookings-per-month an optional input with a reasonable default. Or... I'll keep it simple in the calculator and just use a flat monthly estimate.

Actually, looking at the spec again:

> - `cleaning = cleaningCostPerBooking × (occupancyDays / avgStayDays)` — occupancy days derived from occupancy rate; avgStayDays assumed 4

So the formula is:
```
occupancyDays = 30 * (1 - vacancyRate / 100)
avgStayDays = 4
bookingsPerMonth = occupancyDays / avgStayDays
cleaningCost = cleaningCostPerBooking * bookingsPerMonth
```

Let me keep this. It's reasonable. Let me adjust my test expectations.

With the default input:
- blendedIncome = (6000*6 + 3000*6) / 12 = 4500
- vacancy = 4500 * 0.25 = 1125
- effectiveIncome = 3375
- operatingExpenses = bookingFees + cleaning + utilities
  - bookingFees = 4500 * 0.15 = 675
  - cleaning: occupancyDays = 30 * 0.75 = 22.5, avgStayDays = 4, bookings = 22.5/4 = 5.625, cleaning = 5.625 * 150 = 843.75
  - utilities = 350
  - total = 675 + 843.75 + 350 = 1868.75
- mgmt = 3375 * 0.10 = 337.5
- repairs = 3375 * 0.08 = 270
- capex = 3375 * 0.05 = 168.75
- noi = 3375 - 1868.75 - 337.5 - 270 - 168.75 = 730

Let me update the test to verify specific numbers.

Actually, the test is getting too complex with the specific value assertions. Let me keep it simple — just test behavior:

1. STR produces valid DSCR result
2. STR has higher operating costs than LTR (vacancy rate higher, etc.)
3. STR operating expenses include booking-based costs

Let me rewrite the test more cleanly.

- [ ] **Step 2: Run test to see it fail**

Run: `npx vitest run server/src/engine/short-term-rental.test.ts`
Expected: Module not found

- [ ] **Step 3: Implement STR calculator**

```ts
// server/src/engine/short-term-rental.ts
import type { DSCRInput, DSCRResult } from '@dscr/shared';
import { getVerdict } from '@dscr/shared';

function monthlyPayment(principal: number, annualRate: number, termYears: number): number {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return principal * (r * factor) / (factor - 1);
}

export function strCalculate(input: DSCRInput): DSCRResult {
  const price = input.price;
  const downPayment = price * (input.downPaymentPercent / 100);
  const loanAmount = price - downPayment;

  const pAndI = monthlyPayment(loanAmount, input.interestRate, input.loanTermYears);
  const propertyTax = (price * (input.annualPropertyTaxRate / 100)) / 12;
  const insurance = (price * (input.annualInsuranceRate / 100)) / 12;
  const totalDebtService = pAndI + propertyTax + insurance + (input.monthlyHoa ?? 0);

  // Blended seasonal income
  const peakRent = input.peakMonthlyRent ?? input.monthlyGrossRent;
  const offPeakRent = input.offPeakMonthlyRent ?? input.monthlyGrossRent;
  const peakMonths = input.peakMonths ?? 6;
  const blendedIncome = (peakRent * peakMonths + offPeakRent * (12 - peakMonths)) / 12;

  const vacancy = blendedIncome * (input.vacancyRate / 100);
  const effectiveIncome = blendedIncome - vacancy;

  // Booking-based operating costs
  const bookingFees = blendedIncome * ((input.bookingFeePercent ?? 15) / 100);
  const occupancyDays = 30 * (1 - input.vacancyRate / 100);
  const avgStayDays = 4;
  const bookingsPerMonth = occupancyDays / avgStayDays;
  const cleaning = (input.cleaningCostPerBooking ?? 150) * bookingsPerMonth;
  const utilities = input.monthlyUtilities ?? 0;
  const totalOperatingCosts = bookingFees + cleaning + utilities;

  // Standard percentage-based line items
  const repairs = effectiveIncome * ((input.repairsRate ?? 8) / 100);
  const capex = effectiveIncome * ((input.capexRate ?? 5) / 100);
  const mgmt = effectiveIncome * ((input.propertyManagementRate ?? 10) / 100);

  const noi = effectiveIncome - totalOperatingCosts - repairs - capex - mgmt;

  const dscrRatio = totalDebtService > 0 ? Math.round((noi / totalDebtService) * 1000) / 1000 : 0;

  const breakdown = {
    grossRent: Math.round(blendedIncome * 100) / 100,
    vacancy: -Math.round(vacancy * 100) / 100,
    effectiveIncome: Math.round(effectiveIncome * 100) / 100,
    operatingExpenses: -Math.round(totalOperatingCosts * 100) / 100,
    propertyManagement: -Math.round(mgmt * 100) / 100,
    repairs: -Math.round(repairs * 100) / 100,
    capex: -Math.round(capex * 100) / 100,
    noi: Math.round(noi * 100) / 100,
    principalInterest: -Math.round(pAndI * 100) / 100,
    propertyTax: -Math.round(propertyTax * 100) / 100,
    insurance: -Math.round(insurance * 100) / 100,
    hoaExpense: -Math.round((input.monthlyHoa ?? 0) * 100) / 100,
    totalDebtService: Math.round(totalDebtService * 100) / 100,
  };

  return {
    dscrRatio,
    verdict: getVerdict(dscrRatio),
    breakdown,
    input,
  };
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run server/src/engine/short-term-rental.test.ts`
Expected: PASS

- [ ] **Step 5: Wire str in registry**

```ts
// server/src/engine/calculator.ts
import { buyAndHoldCalculate } from './buy-and-hold';
import { brrrrCalculate } from './brrrr';
import { fixAndFlipCalculate } from './fix-and-flip';
import { strCalculate } from './short-term-rental';

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: brrrrCalculate,
  fix_and_flip: fixAndFlipCalculate,
  str: strCalculate,
};
```

- [ ] **Step 6: Run full engine test suite**

Run: `npx vitest run server/src/engine/`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/engine/short-term-rental.ts server/src/engine/short-term-rental.test.ts server/src/engine/calculator.ts
git commit -m "feat: Short-Term Rental calculator with seasonal income + booking costs"
```

---

### Task 6: Update Route Handlers to Use Registry

**Files:**
- Modify: `server/src/routes/analyze.routes.ts`

- [ ] **Step 1: Update both route handlers**

Replace:
```ts
import { calculateDSCR } from '../engine/dscr.engine.js';
```
With:
```ts
import { registry } from '../engine/calculator.js';
import type { Strategy } from '@dscr/shared';
```

Replace the `calculateDSCR(dscrInput)` calls in both `/analyze` and `/analyze/manual`:

```ts
const result = registry[body.strategy](dscrInput);
```

Update response to include `flipMetrics` when present:

For the `/analyze` route, update the response object (around line 162-181):
```ts
res.status(201).json({
  id: analysisRecord!.id,
  property: { ... },
  strategy: body.strategy,
  dscrRatio: result.dscrRatio,
  verdict: result.verdict,
  breakdown: result.breakdown,
  flipMetrics: result.flipMetrics,
  createdAt: analysisRecord!.createdAt.toISOString(),
});
```

Same for `/analyze/manual` (around line 285-304).

- [ ] **Step 2: Run integration tests**

Run: `npx vitest run server/src/routes/`
Expected: All PASS (3 manual + 1 URL integration = 4 tests)

- [ ] **Step 3: Run full server test suite**

Run: `npm run test`
Expected: All 12 PASS

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/analyze.routes.ts
git commit -m "feat: route handlers dispatch via strategy registry"
```

---

### Task 7: Update Server Zod Schemas for Strategy-Specific Inputs

**Files:**
- Modify: `server/src/routes/analyze.routes.ts`

- [ ] **Step 1: Add strategy-specific fields to manual property schema**

```ts
const manualPropertySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  price: z.number().positive('Price must be positive'),
  bedrooms: z.number().int().min(0).default(0),
  bathrooms: z.number().min(0).default(0),
  sqft: z.number().int().min(0).default(0),
  propertyType: propertyTypeSchema.default('single_family'),
  yearBuilt: z.number().int().min(1800).max(2100).default(0),
  estimatedRent: z.number().min(0, 'Estimated rent must be non-negative'),
  hoa: z.number().min(0).default(0),
  // Strategy-specific fields
  afterRepairValue: z.number().positive().optional(),
  rehabCosts: z.number().positive().optional(),
  holdingPeriodMonths: z.number().int().min(1).max(36).optional(),
  sellingCostsPercent: z.number().min(0).max(15).optional(),
  peakMonthlyRent: z.number().positive().optional(),
  offPeakMonthlyRent: z.number().positive().optional(),
  peakMonths: z.number().int().min(1).max(12).optional(),
  bookingFeePercent: z.number().min(0).max(30).optional(),
  cleaningCostPerBooking: z.number().positive().optional(),
  monthlyUtilities: z.number().positive().optional(),
});
```

- [ ] **Step 2: Pass strategy-specific fields into DSCRInput**

In the `/analyze/manual` handler, after building `dscrInput`:

```ts
const dscrInput = {
  price: p.price,
  downPaymentPercent: body.params.downPaymentPercent,
  interestRate: body.params.interestRate,
  loanTermYears: body.params.loanTermYears,
  monthlyGrossRent: p.estimatedRent,
  monthlyHoa: p.hoa,
  annualPropertyTaxRate: taxRate,
  annualInsuranceRate: insuranceRate,
  vacancyRate: 5,
  operatingExpenseRate: 10,
  propertyManagementRate: 6,
  repairsRate: 5,
  capexRate: 3,
  afterRepairValue: p.afterRepairValue,
  rehabCosts: p.rehabCosts,
  holdingPeriodMonths: p.holdingPeriodMonths,
  sellingCostsPercent: p.sellingCostsPercent,
  peakMonthlyRent: p.peakMonthlyRent,
  offPeakMonthlyRent: p.offPeakMonthlyRent,
  peakMonths: p.peakMonths,
  bookingFeePercent: p.bookingFeePercent,
  cleaningCostPerBooking: p.cleaningCostPerBooking,
  monthlyUtilities: p.monthlyUtilities,
};
```

Same for the `/analyze` route — scrape overrides now include strategy-specific fields (or they come from the request body).

Wait, for the `/analyze` route, the strategy-specific fields come from the request body since we passed them. Let me check the current URL analyze schema... it doesn't have strategy-specific fields. Should I add them? Yes, for consistency.

Actually, for URL scraping, the user might not fill in all these extra fields since they're relying on the scrape data. But if they choose BRRRR or STR strategy with a URL, they'd still need ARV or seasonal rent inputs. So I should add them to the URL schema too.

Let me add them to the URL analyze request schema's overrides or as top-level property overrides.

Actually, to keep it simpler: the existing `overrides` object in the URL schema handles `price`, `estimatedRent`, `hoa`. I could add strategy-specific fields there too.

Or I could create a separate optional block. Let me just add them to `overrides` for now.

- [ ] **Step 3: Add strategy-specific override fields to URL schema**

```ts
const analyzeSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  strategy: z.enum([...]).default(DEFAULT_STRATEGY),
  params: z.object({ ... }),
  overrides: z.object({
    price: z.number().nullable().optional(),
    estimatedRent: z.number().nullable().optional(),
    hoa: z.number().nullable().optional(),
    afterRepairValue: z.number().nullable().optional(),
    rehabCosts: z.number().nullable().optional(),
    holdingPeriodMonths: z.number().nullable().optional(),
    sellingCostsPercent: z.number().nullable().optional(),
    peakMonthlyRent: z.number().nullable().optional(),
    offPeakMonthlyRent: z.number().nullable().optional(),
    peakMonths: z.number().nullable().optional(),
    bookingFeePercent: z.number().nullable().optional(),
    cleaningCostPerBooking: z.number().nullable().optional(),
    monthlyUtilities: z.number().nullable().optional(),
  }).optional(),
});
```

And in the handler, pass them through after applying overrides:

```ts
const dscrInput = {
  // ... existing fields ...
  afterRepairValue: body.overrides?.afterRepairValue ?? undefined,
  rehabCosts: body.overrides?.rehabCosts ?? undefined,
  // etc.
};
```

- [ ] **Step 4: Update integration test for URL route**

The existing URL test uses `strategy: 'buy_and_hold'` — should still pass since no strategy-specific fields needed.

- [ ] **Step 5: Run full test suite**

Run: `npm run test`
Expected: All PASS

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/analyze.routes.ts
git commit -m "feat: add strategy-specific fields to Zod schemas and route handlers"
```

---

### Task 8: Client — Strategy-Conditional Input Fields

**Files:**
- Modify: `client/src/pages/AnalyzePage.tsx`

- [ ] **Step 1: Add strategy-specific input fields state**

Add these to the `ManualProperty` interface:

```ts
interface ManualProperty {
  // ... existing ...
  afterRepairValue: string;
  rehabCosts: string;
  holdingPeriodMonths: string;
  sellingCostsPercent: string;
  peakMonthlyRent: string;
  offPeakMonthlyRent: string;
  peakMonths: string;
  bookingFeePercent: string;
  cleaningCostPerBooking: string;
  monthlyUtilities: string;
}
```

Add defaults in `defaultProperty`:

```ts
const defaultProperty: ManualProperty = {
  // ... existing ...
  afterRepairValue: '',
  rehabCosts: '',
  holdingPeriodMonths: '6',
  sellingCostsPercent: '8',
  peakMonthlyRent: '',
  offPeakMonthlyRent: '',
  peakMonths: '6',
  bookingFeePercent: '15',
  cleaningCostPerBooking: '',
  monthlyUtilities: '',
};
```

- [ ] **Step 2: Add conditional rendering in the manual form**

After the HOA input (before `<hr />`), add strategy-specific sections:

```tsx
{/* BRRRR — After-Repair Value */}
{strategy === 'brrrr' && (
  <Input
    id="afterRepairValue"
    label="After-Repair Value ($)"
    type="number"
    value={manual.afterRepairValue}
    onChange={(e) => updateManual('afterRepairValue', e.target.value)}
    placeholder="280000"
    required
  />
)}

{/* Fix & Flip fields */}
{strategy === 'fix_and_flip' && (
  <>
    <Input
      id="afterRepairValue"
      label="After-Repair Value ($)"
      type="number"
      value={manual.afterRepairValue}
      onChange={(e) => updateManual('afterRepairValue', e.target.value)}
      placeholder="280000"
      required
    />
    <div className="grid grid-cols-3 gap-4">
      <Input
        id="rehabCosts"
        label="Rehab Costs ($)"
        type="number"
        value={manual.rehabCosts}
        onChange={(e) => updateManual('rehabCosts', e.target.value)}
        placeholder="40000"
        required
      />
      <Input
        id="holdingPeriod"
        label="Holding Period (mo)"
        type="number"
        value={manual.holdingPeriodMonths}
        onChange={(e) => updateManual('holdingPeriodMonths', e.target.value)}
        required
      />
      <Input
        id="sellingCosts"
        label="Selling Costs (%)"
        type="number"
        step="0.1"
        value={manual.sellingCostsPercent}
        onChange={(e) => updateManual('sellingCostsPercent', e.target.value)}
        required
      />
    </div>
  </>
)}

{/* STR fields */}
{strategy === 'str' && (
  <>
    <div className="grid grid-cols-2 gap-4">
      <Input
        id="peakRent"
        label="Peak Monthly Rent ($)"
        type="number"
        value={manual.peakMonthlyRent}
        onChange={(e) => updateManual('peakMonthlyRent', e.target.value)}
        placeholder="6000"
        required
      />
      <Input
        id="offPeakRent"
        label="Off-Peak Monthly Rent ($)"
        type="number"
        value={manual.offPeakMonthlyRent}
        onChange={(e) => updateManual('offPeakMonthlyRent', e.target.value)}
        placeholder="3000"
        required
      />
    </div>
    <Input
      id="peakMonths"
      label="Peak Season (months/year)"
      type="number"
      value={manual.peakMonths}
      onChange={(e) => updateManual('peakMonths', e.target.value)}
      required
    />
    <div className="grid grid-cols-3 gap-4">
      <Input
        id="bookingFee"
        label="Booking Fee (%)"
        type="number"
        step="0.1"
        value={manual.bookingFeePercent}
        onChange={(e) => updateManual('bookingFeePercent', e.target.value)}
        required
      />
      <Input
        id="cleaningCost"
        label="Cleaning Cost ($)"
        type="number"
        value={manual.cleaningCostPerBooking}
        onChange={(e) => updateManual('cleaningCostPerBooking', e.target.value)}
        placeholder="150"
        required
      />
      <Input
        id="utilities"
        label="Monthly Utilities ($)"
        type="number"
        value={manual.monthlyUtilities}
        onChange={(e) => updateManual('monthlyUtilities', e.target.value)}
        placeholder="350"
        required
      />
    </div>
  </>
)}
```

- [ ] **Step 3: Pass strategy-specific fields in manual submit**

Update the `handleManualSubmit` body:

```ts
const data = await api.post<AnalysisResult>('/analyze/manual', {
  property: {
    address: manual.address,
    price: Number(manual.price),
    bedrooms: Number(manual.bedrooms) || 0,
    bathrooms: Number(manual.bathrooms) || 0,
    sqft: Number(manual.sqft) || 0,
    propertyType: manual.propertyType,
    yearBuilt: Number(manual.yearBuilt) || 0,
    estimatedRent: Number(manual.estimatedRent),
    hoa: Number(manual.hoa) || 0,
    afterRepairValue: manual.afterRepairValue ? Number(manual.afterRepairValue) : undefined,
    rehabCosts: manual.rehabCosts ? Number(manual.rehabCosts) : undefined,
    holdingPeriodMonths: manual.holdingPeriodMonths ? Number(manual.holdingPeriodMonths) : undefined,
    sellingCostsPercent: manual.sellingCostsPercent ? Number(manual.sellingCostsPercent) : undefined,
    peakMonthlyRent: manual.peakMonthlyRent ? Number(manual.peakMonthlyRent) : undefined,
    offPeakMonthlyRent: manual.offPeakMonthlyRent ? Number(manual.offPeakMonthlyRent) : undefined,
    peakMonths: manual.peakMonths ? Number(manual.peakMonths) : undefined,
    bookingFeePercent: manual.bookingFeePercent ? Number(manual.bookingFeePercent) : undefined,
    cleaningCostPerBooking: manual.cleaningCostPerBooking ? Number(manual.cleaningCostPerBooking) : undefined,
    monthlyUtilities: manual.monthlyUtilities ? Number(manual.monthlyUtilities) : undefined,
  },
  strategy,
  params: { ... },
});
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/AnalyzePage.tsx
git commit -m "feat: strategy-conditional input fields on AnalyzePage"
```

---

### Task 9: Client — Show Flip Metrics in Results

**Files:**
- Modify: `client/src/pages/AnalysisDetailPage.tsx` (or `client/src/pages/AnalyzePage.tsx` for the quick-result section)

Both the inline result on AnalyzePage and the full AnalysisDetailPage need updates.

**AnalyzePage result section (around line 385-421):**

After the verdict hero panel, add flip metrics if present:

```tsx
{result.flipMetrics && (
  <Card>
    <CardContent className="pt-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Flip Profit Analysis
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Total Investment</span>
          <p className="font-medium tabular-nums">${result.flipMetrics.totalInvestment.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Net Proceeds</span>
          <p className="font-medium tabular-nums">${result.flipMetrics.netProceeds.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Gross Profit</span>
          <p className={`font-medium tabular-nums ${result.flipMetrics.grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>
            {result.flipMetrics.grossProfit >= 0 ? '+' : ''}${result.flipMetrics.grossProfit.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Annualized ROI</span>
          <p className={`font-medium tabular-nums ${result.flipMetrics.annualizedRoi >= 0 ? 'text-success' : 'text-danger'}`}>
            {result.flipMetrics.annualizedRoi.toFixed(1)}%
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

Also add `flipMetrics` to the `AnalysisResult` interface:

```ts
interface AnalysisResult {
  // ...
  flipMetrics?: {
    totalInvestment: number;
    netProceeds: number;
    grossProfit: number;
    roi: number;
    annualizedRoi: number;
  };
}
```

- [ ] **Step 1: Update AnalysisResult interface on AnalyzePage**

- [ ] **Step 2: Add flip metrics card to the result section**

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/AnalyzePage.tsx
git commit -m "feat: display flip profit metrics on result card"
```

---

### Task 10: Integration Test Updates

**Files:**
- Modify: `server/src/routes/manual-analyze.test.ts`
- Modify: `server/src/routes/analyze.integration.test.ts`

- [ ] **Step 1: Add a test for fix_and_flip strategy response shape**

Add to `manual-analyze.test.ts`:

```ts
it('returns flipMetrics for fix_and_flip strategy', async () => {
  const res = await request(app)
    .post('/api/analyze/manual')
    .send({
      property: {
        address: '555 Flip St, Austin, TX 78701',
        price: 200000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1200,
        propertyType: 'single_family',
        yearBuilt: 2000,
        estimatedRent: 2000,
        hoa: 0,
        afterRepairValue: 280000,
        rehabCosts: 40000,
        holdingPeriodMonths: 6,
        sellingCostsPercent: 8,
      },
      strategy: 'fix_and_flip',
      params: {
        downPaymentPercent: 20,
        interestRate: 6.5,
        loanTermYears: 30,
      },
    })
    .expect(201);

  expect(res.body.strategy).toBe('fix_and_flip');
  expect(res.body.flipMetrics).toBeDefined();
  expect(res.body.flipMetrics.grossProfit).toBeGreaterThan(0);
  expect(res.body.flipMetrics.roi).toBeGreaterThan(0);
});

it('returns BRRRR response with DSCR verdict', async () => {
  const res = await request(app)
    .post('/api/analyze/manual')
    .send({
      property: {
        address: '666 Brrrr Ln, Dallas, TX 75201',
        price: 200000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1300,
        propertyType: 'single_family',
        yearBuilt: 2010,
        estimatedRent: 2200,
        hoa: 0,
        afterRepairValue: 260000,
      },
      strategy: 'brrrr',
      params: {
        downPaymentPercent: 20,
        interestRate: 6.5,
        loanTermYears: 30,
      },
    })
    .expect(201);

  expect(res.body.strategy).toBe('brrrr');
  expect(res.body.dscrRatio).toBeGreaterThan(0);
  expect(res.body.verdict).toMatch(/^(pass|caution|fail)$/);
});
```

- [ ] **Step 2: Run integration tests**

Run: `npx vitest run server/src/routes/`
Expected: All PASS

- [ ] **Step 3: Run full test suite**

Run: `npm run test`
Expected: All PASS

- [ ] **Step 4: Run full typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/manual-analyze.test.ts
git commit -m "test: integration tests for brrrr and fix_and_flip strategies"
```
