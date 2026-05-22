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

export interface DSCRResult {
  dscrRatio: number;
  verdict: Verdict;
  breakdown: DSCRBreakdown;
  input: DSCRInput;
  flipMetrics?: FlipMetrics;
}

export interface FlipMetrics {
  totalInvestment: number;
  netProceeds: number;
  grossProfit: number;
  roi: number;
  annualizedRoi: number;
}

export interface AnalysisParams {
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate?: number | null;
  insuranceRate?: number | null;
}
