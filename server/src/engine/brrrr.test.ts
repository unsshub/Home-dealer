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
  it('uses ARV for loan amount resulting in lower DSCR than buy-and-hold', () => {
    const result = brrrrCalculate(makeInput());
    const bhResult = buyAndHoldCalculate(makeInput({ afterRepairValue: undefined }));
    // BRRRR: loan = 280000 * 0.8 = 224000
    // Buy&Hold: loan = 200000 * 0.8 = 160000
    // Higher loan -> higher debt service -> lower DSCR
    expect(result.dscrRatio).toBeLessThan(bhResult.dscrRatio);
  });

  it('returns standard DSCR result shape with verdict and breakdown', () => {
    const result = brrrrCalculate(makeInput());
    expect(result.verdict).toMatch(/^(pass|caution|fail)$/);
    expect(result.breakdown).toHaveProperty('noi');
    expect(result.breakdown).toHaveProperty('totalDebtService');
    expect(result.flipMetrics).toBeUndefined();
  });

  it('falls back to purchase price when ARV is not provided', () => {
    const result = brrrrCalculate(makeInput({ afterRepairValue: undefined }));
    const bhResult = buyAndHoldCalculate(makeInput({ afterRepairValue: undefined }));
    expect(result.dscrRatio).toBe(bhResult.dscrRatio);
  });
});
