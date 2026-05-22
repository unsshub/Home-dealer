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
    operatingExpenseRate: 15,
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
  it('blends seasonal income correctly', () => {
    const result = strCalculate(makeInput());
    // blended = (6000*6 + 3000*6) / 12 = 4500
    expect(result.breakdown.grossRent).toBe(4500);
  });

  it('returns standard DSCR result with verdict and breakdown', () => {
    const result = strCalculate(makeInput());
    expect(result.dscrRatio).toBeGreaterThan(0);
    expect(result.verdict).toMatch(/^(pass|caution|fail)$/);
    expect(result.breakdown).toHaveProperty('noi');
    expect(result.breakdown).toHaveProperty('totalDebtService');
  });

  it('falls back to monthlyGrossRent when seasonal fields are missing', () => {
    const result = strCalculate(makeInput({
      peakMonthlyRent: undefined,
      offPeakMonthlyRent: undefined,
      peakMonths: undefined,
    }));
    // Falls back to monthlyGrossRent = 3000
    expect(result.breakdown.grossRent).toBe(3000);
  });

  it('reports operating expenses including booking-based costs', () => {
    const result = strCalculate(makeInput());
    // operatingExpenses includes bookingFees + cleaning + utilities
    const opEx = Math.abs(result.breakdown.operatingExpenses);
    // With these inputs, opEx should be significantly higher than
    // 10% percentage-based (which would be 450)
    expect(opEx).toBeGreaterThan(1000);
  });
});
