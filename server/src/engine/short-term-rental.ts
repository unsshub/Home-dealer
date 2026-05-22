import type { DSCRInput, DSCRResult, DSCRBreakdown } from '@dscr/shared';
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

  // Percentage-based line items (using STR-specific default rates)
  const mgmt = effectiveIncome * ((input.propertyManagementRate ?? 10) / 100);
  const repairs = effectiveIncome * ((input.repairsRate ?? 8) / 100);
  const capex = effectiveIncome * ((input.capexRate ?? 5) / 100);

  const noi = effectiveIncome - totalOperatingCosts - mgmt - repairs - capex;

  const dscrRatio = totalDebtService > 0 ? Math.round((noi / totalDebtService) * 1000) / 1000 : 0;

  const breakdown: DSCRBreakdown = {
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
