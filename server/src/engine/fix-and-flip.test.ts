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
  it('returns flipMetrics with correct profit and ROI', () => {
    const result = fixAndFlipCalculate(makeInput());
    expect(result.flipMetrics).toBeDefined();
    // totalInvestment = 200000 + 40000 = 240000
    // netProceeds = 280000 * (1 - 0.08) = 257600
    // grossProfit = 257600 - 240000 = 17600
    // roi = 17600 / 240000 * 100 ≈ 7.33
    expect(result.flipMetrics!.totalInvestment).toBe(240000);
    expect(result.flipMetrics!.netProceeds).toBeCloseTo(257600, 0);
    expect(result.flipMetrics!.grossProfit).toBeCloseTo(17600, 0);
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
    expect(result.flipMetrics!.grossProfit).toBeLessThan(0);
    expect(result.flipMetrics!.roi).toBeLessThan(0);
  });

  it('handles zero or missing strategy-specific fields', () => {
    const result = fixAndFlipCalculate(makeInput({
      afterRepairValue: undefined,
      rehabCosts: undefined,
      holdingPeriodMonths: undefined,
      sellingCostsPercent: undefined,
    }));
    expect(result.flipMetrics).toBeDefined();
    expect(result.flipMetrics!.totalInvestment).toBe(200000); // price + 0
    expect(result.flipMetrics!.netProceeds).toBe(0); // 0 * (1 - 0.08)
    expect(result.flipMetrics!.grossProfit).toBe(-200000);
  });
});
