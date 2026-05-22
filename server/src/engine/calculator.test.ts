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
