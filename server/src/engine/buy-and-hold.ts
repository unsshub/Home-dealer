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

  return {
    dscrRatio,
    verdict: getVerdict(dscrRatio),
    breakdown,
    input,
  };
}
