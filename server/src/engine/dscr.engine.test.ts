import { describe, it, expect } from 'vitest';
import { calculateDSCR } from './dscr.engine';
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

describe('calculateDSCR', () => {
  it('returns FAIL (red) verdict when DSCR < 1.0', () => {
    const result = calculateDSCR(makeInput());
    expect(result.dscrRatio).toBeLessThan(1.0);
    expect(result.verdict).toBe('fail');
  });

  it('returns PASS (green) verdict when DSCR >= 1.25', () => {
    const result = calculateDSCR(
      makeInput({
        price: 200000,
        monthlyGrossRent: 3500,
        interestRate: 5,
        downPaymentPercent: 30,
        monthlyHoa: 0,
      })
    );
    expect(result.dscrRatio).toBeGreaterThanOrEqual(1.25);
    expect(result.verdict).toBe('pass');
  });

  it('returns CAUTION (amber) verdict when DSCR between 1.0 and 1.25', () => {
    const result = calculateDSCR(
      makeInput({
        price: 200000,
        monthlyGrossRent: 1900,
        monthlyHoa: 50,
        downPaymentPercent: 15,
        interestRate: 5,
      })
    );
    expect(result.dscrRatio).toBeGreaterThanOrEqual(1.0);
    expect(result.dscrRatio).toBeLessThan(1.25);
    expect(result.verdict).toBe('caution');
  });

  it('returns PASS at exactly 1.25 threshold', () => {
    const result = calculateDSCR(
      makeInput({
        price: 200000,
        monthlyGrossRent: 4000,
        interestRate: 5,
        downPaymentPercent: 25,
        annualPropertyTaxRate: 0.5,
        annualInsuranceRate: 0.2,
        monthlyHoa: 0,
        vacancyRate: 0,
        operatingExpenseRate: 0,
        propertyManagementRate: 0,
        repairsRate: 0,
        capexRate: 0,
      })
    );

    expect(result.dscrRatio).toBeGreaterThanOrEqual(1.25);
    expect(result.verdict).toBe('pass');
  });

  it('handles zero debt service gracefully', () => {
    const result = calculateDSCR(
      makeInput({
        price: 0,
        downPaymentPercent: 0,
        interestRate: 0,
        loanTermYears: 0,
        monthlyHoa: 0,
        annualPropertyTaxRate: 0,
        annualInsuranceRate: 0,
      })
    );
    expect(result.dscrRatio).toBe(0);
    expect(result.verdict).toBe('fail');
  });

  it('returns itemized breakdown with all fields', () => {
    const result = calculateDSCR(makeInput());
    const b = result.breakdown;
    expect(b.grossRent).toBe(2800);
    expect(b.vacancy).toBe(-140);
    expect(b.effectiveIncome).toBe(2660);
    expect(b.operatingExpenses).toBe(-280);
    expect(b.propertyManagement).toBe(-168);
    expect(b.repairs).toBe(-140);
    expect(b.capex).toBe(-84);
    expect(b.noi).toBeGreaterThan(0);
    expect(b.principalInterest).toBeLessThan(0);
    expect(b.propertyTax).toBeLessThan(0);
    expect(b.insurance).toBeLessThan(0);
    expect(b.hoaExpense).toBe(-50);
    expect(b.totalDebtService).toBeGreaterThan(0);
  });
});
