import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';
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
  address: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  sqft: '',
  propertyType: 'single_family',
  yearBuilt: '',
  estimatedRent: '',
  hoa: '0',
  afterRepairValue: '',
  rehabCosts: '',
  holdingPeriodMonths: '6',
  sellingCostsPercent: '8',
  peakMonthlyRent: '',
  offPeakMonthlyRent: '',
  peakMonths: '6',
  bookingFeePercent: '15',
  cleaningCostPerBooking: '',
  monthlyUtilities: '',
};

const defaultParams: FinancialParams = {
  downPaymentPercent: '20',
  interestRate: '6.5',
  loanTermYears: '30',
};

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

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post<AnalysisResult>('/analyze', {
        url,
        strategy,
        params: {
          downPaymentPercent: Number(params.downPaymentPercent),
          interestRate: Number(params.interestRate),
          loanTermYears: Number(params.loanTermYears),
        },
      });
      setResult(data);
    } catch (err: any) {
      if (err.body?.details) {
        const messages = Object.entries(err.body.details)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`);
        setError(messages.join('\n'));
      } else {
        setError(err.message ?? 'Analysis failed');
      }
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
      if (err.body?.details) {
        const messages = Object.entries(err.body.details)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`);
        setError(messages.join('\n'));
      } else {
        setError(err.message ?? 'Analysis failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const verdictConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger'; border: string; bg: string }> = {
    pass:    { label: 'PASS',    variant: 'success', border: 'border-success/40', bg: 'bg-success/5' },
    caution: { label: 'CAUTION', variant: 'warning', border: 'border-warning/40', bg: 'bg-warning/5' },
    fail:    { label: 'FAIL',    variant: 'danger',  border: 'border-danger/40',  bg: 'bg-danger/5' },
  };

  return (
    <div className="mx-auto mt-10 max-w-2xl px-4 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'url'
            ? 'Paste a US listing URL to get an instant DSCR verdict'
            : 'Enter property details manually for a DSCR verdict'}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => { setMode('url'); setResult(null); setError(''); setStrategy('buy_and_hold'); }}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          URL Input
        </button>
        <button
          type="button"
          onClick={() => { setMode('manual'); setResult(null); setError(''); }}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Manual Input
        </button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {mode === 'url' ? (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <Input
                id="url"
                label="Property Listing URL"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.zillow.com/homedetails/..."
                required
              />
              <div className="space-y-1.5">
                <label htmlFor="strategy-url" className="text-sm font-medium text-foreground">
                  Investment Strategy
                </label>
                <select
                  id="strategy-url"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as Strategy)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STRATEGIES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              {error && <ErrorAlert message={error} />}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Analyzing...' : 'Analyze Property'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Input
                id="address"
                label="Property Address"
                value={manual.address}
                onChange={(e) => updateManual('address', e.target.value)}
                placeholder="123 Main St, Austin, TX 78701"
                required
              />

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <Input
                  id="bedrooms"
                  label="Bedrooms"
                  type="number"
                  value={manual.bedrooms}
                  onChange={(e) => updateManual('bedrooms', e.target.value)}
                  placeholder="3"
                />
                <Input
                  id="bathrooms"
                  label="Bathrooms"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="propertyType" className="text-sm font-medium text-foreground">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    value={manual.propertyType}
                    onChange={(e) => updateManual('propertyType', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  id="yearBuilt"
                  label="Year Built"
                  type="number"
                  value={manual.yearBuilt}
                  onChange={(e) => updateManual('yearBuilt', e.target.value)}
                  placeholder="2015"
                />
              </div>

              <Input
                id="hoa"
                label="Monthly HOA ($)"
                type="number"
                value={manual.hoa}
                onChange={(e) => updateManual('hoa', e.target.value)}
                placeholder="0"
              />

              {/* BRRRR — After-Repair Value */}
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

              {/* Fix & Flip fields */}
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
                  <div className="grid grid-cols-3 gap-4">
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
                      label="Holding Period (mo)"
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

              {/* STR fields */}
              {strategy === 'str' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
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
                  <Input
                    id="peakMonths"
                    label="Peak Season (months/year)"
                    type="number"
                    value={manual.peakMonths}
                    onChange={(e) => updateManual('peakMonths', e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-3 gap-4">
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
                    <Input
                      id="utilities"
                      label="Monthly Utilities ($)"
                      type="number"
                      value={manual.monthlyUtilities}
                      onChange={(e) => updateManual('monthlyUtilities', e.target.value)}
                      placeholder="350"
                      required
                    />
                  </div>
                </>
              )}

              <hr className="border-border" />

              <div className="space-y-1.5">
                <label htmlFor="strategy" className="text-sm font-medium text-foreground">
                  Investment Strategy
                </label>
                <select
                  id="strategy"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as Strategy)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STRATEGIES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  id="downPayment"
                  label="Down Payment (%)"
                  type="number"
                  step="0.1"
                  value={params.downPaymentPercent}
                  onChange={(e) => updateParams('downPaymentPercent', e.target.value)}
                  required
                />
                <Input
                  id="interestRate"
                  label="Interest Rate (%)"
                  type="number"
                  step="0.1"
                  value={params.interestRate}
                  onChange={(e) => updateParams('interestRate', e.target.value)}
                  required
                />
                <Input
                  id="loanTerm"
                  label="Loan Term (yrs)"
                  type="number"
                  value={params.loanTermYears}
                  onChange={(e) => updateParams('loanTermYears', e.target.value)}
                  required
                />
              </div>

              {error && <ErrorAlert message={error} />}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Analyzing...' : 'Analyze Property'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="mt-8">
          <LoadingSpinner size="md" label="Calculating DSCR..." />
        </div>
      )}

      {result && (() => {
        const vc = verdictConfig[result.verdict] ?? verdictConfig.fail;
        return (
          <div className="mt-8 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="font-medium">{result.property.address}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ${result.property.price.toLocaleString()} &middot; {result.property.bedrooms}bd{' '}
                  {result.property.bathrooms}ba &middot; {result.property.sqft.toLocaleString()} sqft
                </p>
                <p className="text-sm text-muted-foreground">
                  Est. Rent: ${result.property.estimatedRent.toLocaleString()}/mo &middot; HOA: ${result.property.hoa}/mo
                </p>
              </CardContent>
            </Card>

            <div className={`rounded-xl border-2 p-6 text-center ${vc.border} ${vc.bg}`}>
              <p className="text-5xl font-bold tabular-nums">{result.dscrRatio.toFixed(2)}x</p>
              <div className="mt-2">
                <Badge variant={vc.variant}>{vc.label}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                DSCR &ge; 1.25 Pass &middot; 1.0&ndash;1.25 Caution &middot; &lt;1.0 Fail
              </p>
            </div>

            {result.flipMetrics && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Flip Profit Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Investment</span>
                      <p className="font-medium tabular-nums">
                        ${result.flipMetrics.totalInvestment.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Net Proceeds</span>
                      <p className="font-medium tabular-nums">
                        ${result.flipMetrics.netProceeds.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gross Profit</span>
                      <p className={`font-medium tabular-nums ${result.flipMetrics.grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {result.flipMetrics.grossProfit >= 0 ? '+' : ''}
                        ${Math.abs(result.flipMetrics.grossProfit).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total ROI</span>
                      <p className={`font-medium tabular-nums ${result.flipMetrics.roi >= 0 ? 'text-success' : 'text-danger'}`}>
                        {result.flipMetrics.roi.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Annualized ROI</span>
                      <p className={`font-medium tabular-nums ${result.flipMetrics.annualizedRoi >= 0 ? 'text-success' : 'text-danger'}`}>
                        {result.flipMetrics.annualizedRoi.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate(`/analysis/${result.id}`)}
            >
              View Full Breakdown
            </Button>
          </div>
        );
      })()}
    </div>
  );
}
