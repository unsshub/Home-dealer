import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ErrorAlert } from '../components/ui/error-alert';
import type { Strategy } from '@dscr/shared';

type InputMode = 'url' | 'manual';

interface ManualProperty {
  address: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  propertyType: string;
  yearBuilt: string;
  estimatedRent: string;
  hoa: string;
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

interface FinancialParams {
  downPaymentPercent: string;
  interestRate: string;
  loanTermYears: string;
}

interface AnalysisResult {
  id: string;
  dscrRatio: number;
  verdict: string;
  breakdown: {
    grossRent: number; noi: number; totalDebtService: number;
    [key: string]: number;
  };
  property: {
    address: string; price: number; bedrooms: number;
    bathrooms: number; sqft: number; estimatedRent: number; hoa: number;
  };
  flipMetrics?: {
    totalInvestment: number;
    netProceeds: number;
    grossProfit: number;
    roi: number;
    annualizedRoi: number;
  };
}

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'fourplex', label: 'Fourplex' },
];

const STRATEGIES: { value: Strategy; label: string }[] = [
  { value: 'buy_and_hold', label: 'Buy & Hold' },
  { value: 'brrrr', label: 'BRRRR' },
  { value: 'fix_and_flip', label: 'Fix & Flip' },
  { value: 'str', label: 'Short-Term Rental' },
];

const defaultProperty: ManualProperty = {
  address: '', price: '', bedrooms: '', bathrooms: '', sqft: '',
  propertyType: 'single_family', yearBuilt: '', estimatedRent: '', hoa: '0',
  afterRepairValue: '', rehabCosts: '', holdingPeriodMonths: '6', sellingCostsPercent: '8',
  peakMonthlyRent: '', offPeakMonthlyRent: '', peakMonths: '6', bookingFeePercent: '15',
  cleaningCostPerBooking: '', monthlyUtilities: '',
};

const defaultParams: FinancialParams = {
  downPaymentPercent: '20', interestRate: '6.5', loanTermYears: '30',
};

function SegmentControl({ mode, onChange }: { mode: InputMode; onChange: (m: InputMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted p-0.5" role="tablist">
      {(['url', 'manual'] as const).map((opt) => (
        <button
          key={opt}
          role="tab"
          aria-selected={mode === opt}
          onClick={() => onChange(opt)}
          className={`rounded px-3.5 py-1.5 text-sm font-medium transition-all ${
            mode === opt
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt === 'url' ? 'URL' : 'Manual'}
        </button>
      ))}
    </div>
  );
}

function VerdictHero({ ratio, verdict }: { ratio: number; verdict: string }) {
  const config: Record<string, { label: string; variant: 'success' | 'warning' | 'danger'; threshold: string }> = {
    pass:    { label: 'PASS',    variant: 'success', threshold: 'DSCR ≥ 1.25' },
    caution: { label: 'CAUTION', variant: 'warning', threshold: 'DSCR 1.0–1.25' },
    fail:    { label: 'FAIL',    variant: 'danger',  threshold: 'DSCR < 1.0' },
  };
  const c = config[verdict] ?? config.fail;

  return (
    <div className="flex items-center gap-6">
      <div className="flex-1">
        <p className="font-serif text-5xl font-bold tabular-nums tracking-tight text-foreground border-b-[3px] border-accent inline-block pb-1">{ratio.toFixed(2)}x</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={c.variant}>{c.label}</Badge>
          <span className="text-xs text-muted-foreground">{c.threshold}</span>
        </div>
      </div>
      <div className="hidden sm:block text-right text-xs text-muted-foreground leading-relaxed">
        <p>Pass ≥ 1.25</p>
        <p>Caution 1.0–1.25</p>
        <p>Fail &lt; 1.0</p>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-lg bg-secondary/50" />
      <div className="h-32 rounded-lg bg-secondary/30" />
      <div className="h-24 rounded-lg bg-secondary/30" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground">Enter property details</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
        Fill in the property information and your financing parameters, then run the analysis to get your DSCR verdict.
      </p>
    </div>
  );
}

export function AnalyzePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode>('url');
  const [url, setUrl] = useState('');
  const [manual, setManual] = useState<ManualProperty>(defaultProperty);
  const [params, setParams] = useState<FinancialParams>(defaultParams);
  const [strategy, setStrategy] = useState<Strategy>('buy_and_hold');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const updateManual = (field: keyof ManualProperty, value: string) => {
    setManual((prev) => ({ ...prev, [field]: value }));
  };

  const updateParams = (field: keyof FinancialParams, value: string) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleError = (err: any) => {
    if (err.body?.details) {
      const messages = Object.entries(err.body.details)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`);
      setError(messages.join('\n'));
    } else {
      setError(err.message ?? 'Analysis failed');
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post<AnalysisResult>('/analyze', {
        url, strategy,
        params: {
          downPaymentPercent: Number(params.downPaymentPercent),
          interestRate: Number(params.interestRate),
          loanTermYears: Number(params.loanTermYears),
        },
      });
      setResult(data);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
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
        params: {
          downPaymentPercent: Number(params.downPaymentPercent),
          interestRate: Number(params.interestRate),
          loanTermYears: Number(params.loanTermYears),
        },
      });
      setResult(data);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const newAnalysis = () => {
    setResult(null);
    setError('');
    setUrl('');
    setManual(defaultProperty);
    setParams(defaultParams);
    setStrategy('buy_and_hold');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Get a lender-grade DSCR verdict for any US rental property
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SegmentControl mode={mode} onChange={(m) => { setMode(m); setResult(null); setError(''); if (m === 'url') setStrategy('buy_and_hold'); }} />
          <div className="relative">
            <select
              aria-label="Investment strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as Strategy)}
              className="flex h-9 rounded-lg border border-input bg-background px-3 pr-8 py-1.5 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </header>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={mode === 'url' ? handleUrlSubmit : handleManualSubmit}>
            {mode === 'url' ? (
              <div className="space-y-4">
                <Input
                  id="url"
                  label="Property Listing URL"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.zillow.com/homedetails/..."
                  required
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  id="address"
                  label="Property Address"
                  value={manual.address}
                  onChange={(e) => updateManual('address', e.target.value)}
                  placeholder="123 Main St, Austin, TX 78701"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="price"
                    label="Purchase Price ($)"
                    type="number"
                    value={manual.price}
                    onChange={(e) => updateManual('price', e.target.value)}
                    placeholder="300000"
                    required
                  />
                  <Input
                    id="estimatedRent"
                    label="Monthly Rent ($)"
                    type="number"
                    value={manual.estimatedRent}
                    onChange={(e) => updateManual('estimatedRent', e.target.value)}
                    placeholder="2500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input
                    id="bedrooms"
                    label="Beds"
                    type="number"
                    value={manual.bedrooms}
                    onChange={(e) => updateManual('bedrooms', e.target.value)}
                    placeholder="3"
                  />
                  <Input
                    id="bathrooms"
                    label="Baths"
                    type="number"
                    step="0.5"
                    value={manual.bathrooms}
                    onChange={(e) => updateManual('bathrooms', e.target.value)}
                    placeholder="2"
                  />
                  <Input
                    id="sqft"
                    label="Sq Ft"
                    type="number"
                    value={manual.sqft}
                    onChange={(e) => updateManual('sqft', e.target.value)}
                    placeholder="1400"
                  />
                  <div className="space-y-1.5">
                    <label htmlFor="propertyType" className="text-sm font-medium text-foreground">Type</label>
                    <select
                      id="propertyType"
                      value={manual.propertyType}
                      onChange={(e) => updateManual('propertyType', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="yearBuilt"
                    label="Year Built"
                    type="number"
                    value={manual.yearBuilt}
                    onChange={(e) => updateManual('yearBuilt', e.target.value)}
                    placeholder="2015"
                  />
                  <Input
                    id="hoa"
                    label="Monthly HOA ($)"
                    type="number"
                    value={manual.hoa}
                    onChange={(e) => updateManual('hoa', e.target.value)}
                    placeholder="0"
                  />
                </div>

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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        label="Holding (mo)"
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

                {strategy === 'str' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        id="peakMonths"
                        label="Peak Season (mo/yr)"
                        type="number"
                        value={manual.peakMonths}
                        onChange={(e) => updateManual('peakMonths', e.target.value)}
                        required
                      />
                      <Input
                        id="monthlyUtilities"
                        label="Monthly Utilities ($)"
                        type="number"
                        value={manual.monthlyUtilities}
                        onChange={(e) => updateManual('monthlyUtilities', e.target.value)}
                        placeholder="350"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>
                  </>
                )}
              </div>
            )}

            <hr className="my-4 border-border" />

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 grid grid-cols-3 gap-3 min-w-0">
                <Input
                  id="downPayment"
                  label="Down Payment"
                  type="number"
                  step="0.1"
                  value={params.downPaymentPercent}
                  onChange={(e) => updateParams('downPaymentPercent', e.target.value)}
                  required
                />
                <Input
                  id="interestRate"
                  label="Interest Rate"
                  type="number"
                  step="0.1"
                  value={params.interestRate}
                  onChange={(e) => updateParams('interestRate', e.target.value)}
                  required
                />
                <Input
                  id="loanTerm"
                  label="Loan Term"
                  type="number"
                  value={params.loanTermYears}
                  onChange={(e) => updateParams('loanTermYears', e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="shrink-0"
              >
                {loading ? 'Analyzing...' : result ? 'Re-analyze' : 'Analyze'}
              </Button>
            </div>

            {error && <ErrorAlert message={error} className="mt-4" />}
          </form>
        </CardContent>
      </Card>

      <div className="mt-6">
        {loading && <ResultSkeleton />}

        {!loading && error && !result && (
          <div className="pt-2">
            <EmptyState />
          </div>
        )}

        {!loading && !result && !error && <EmptyState />}

        {result && !loading && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{result.property.address}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      <span className="tabular-nums">${result.property.price.toLocaleString()}</span>
                      {result.property.bedrooms > 0 && <span>{result.property.bedrooms}bd</span>}
                      {result.property.bathrooms > 0 && <span>{result.property.bathrooms}ba</span>}
                      {result.property.sqft > 0 && <span className="tabular-nums">{result.property.sqft.toLocaleString()} sqft</span>}
                      <span className="tabular-nums">${result.property.estimatedRent.toLocaleString()}/mo rent</span>
                      {result.property.hoa > 0 && <span className="tabular-nums">HOA ${result.property.hoa}/mo</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={newAnalysis}
                  >
                    New
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <VerdictHero ratio={result.dscrRatio} verdict={result.verdict} />
              </CardContent>
            </Card>

            {result.flipMetrics && (
              <Card>
                <CardContent className="p-5 sm:p-6 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Flip Profit Analysis
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Total Investment</span>
                      <p className="font-medium tabular-nums mt-0.5">
                        ${result.flipMetrics.totalInvestment.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Net Proceeds</span>
                      <p className="font-medium tabular-nums mt-0.5">
                        ${result.flipMetrics.netProceeds.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Gross Profit</span>
                      <p className={`font-medium tabular-nums mt-0.5 ${result.flipMetrics.grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {result.flipMetrics.grossProfit >= 0 ? '+' : ''}
                        ${Math.abs(result.flipMetrics.grossProfit).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Total ROI</span>
                      <p className={`font-medium tabular-nums mt-0.5 ${result.flipMetrics.roi >= 0 ? 'text-success' : 'text-danger'}`}>
                        {result.flipMetrics.roi.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Annualized ROI</span>
                      <p className={`font-medium tabular-nums mt-0.5 ${result.flipMetrics.annualizedRoi >= 0 ? 'text-success' : 'text-danger'}`}>
                        {result.flipMetrics.annualizedRoi.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-5 sm:p-6 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Income & Expenses
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Gross Rent</span>
                    <p className="font-medium tabular-nums mt-0.5">${Math.round(result.breakdown.grossRent).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Vacancy</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.vacancy)).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Operating Expenses</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.operatingExpenses)).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Property Mgmt</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.propertyManagement)).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Repairs</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.repairs)).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">CapEx</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.capex)).toLocaleString()}</p>
                  </div>
                </div>
                <hr className="border-border" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Net Operating Income</span>
                    <p className="font-semibold tabular-nums mt-0.5">${Math.round(result.breakdown.noi).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">P&I</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.principalInterest)).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Taxes</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.propertyTax)).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Insurance</span>
                    <p className="font-medium tabular-nums mt-0.5 text-danger">-${Math.round(Math.abs(result.breakdown.insurance)).toLocaleString()}</p>
                  </div>
                </div>
                <hr className="border-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Debt Service</span>
                    <p className="font-semibold tabular-nums mt-0.5">
                      ${Math.round(result.breakdown.totalDebtService).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">DSCR</span>
                    <p className={`font-serif text-xl font-bold tabular-nums mt-0.5 ${result.verdict === 'pass' ? 'text-success' : result.verdict === 'caution' ? 'text-warning' : 'text-danger'}`}>
                      {result.dscrRatio.toFixed(2)}x
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate(`/analysis/${result.id}`)}
            >
              View Full Breakdown
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
