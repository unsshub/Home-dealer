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
}

export interface AnalysisParams {
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate?: number | null;
  insuranceRate?: number | null;
}
