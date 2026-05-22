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
}

export function AnalyzePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post<AnalysisResult>('/analyze', {
        url,
        strategy: 'buy_and_hold' as Strategy,
        params: { downPaymentPercent: 20, interestRate: 6.5, loanTermYears: 30 },
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Analysis failed');
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
        <p className="text-sm text-muted-foreground mt-1">Paste a US listing URL to get an instant DSCR verdict</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="url"
              label="Property Listing URL"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.zillow.com/homedetails/..."
              required
            />
            {error && <ErrorAlert message={error} />}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Analyzing...' : 'Analyze Property'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="mt-8">
          <LoadingSpinner size="md" label="Scraping property data and calculating DSCR..." />
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
