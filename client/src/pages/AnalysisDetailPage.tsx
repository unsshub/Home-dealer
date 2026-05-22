import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorAlert } from '../components/ui/error-alert';

interface AnalysisDetail {
  id: string; strategy: string; dscrRatio: number; verdict: string; createdAt: string;
  breakdown: Record<string, number>;
  property: { address: string; price: number; bedrooms: number | null; bathrooms: number | null; sqft: number | null; estimatedRent: number; hoa: number };
}

function LineItem({ label, value, isBold }: { label: string; value: string; isBold?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className={isBold ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
      <span className={isBold ? 'font-medium tabular-nums' : 'tabular-nums'}>{value}</span>
    </div>
  );
}

export function AnalysisDetailPage() {
  const { id } = useParams();
  const [shareUrl, setShareUrl] = useState('');

  const { data, isLoading, error } = useQuery<AnalysisDetail>({
    queryKey: ['analysis', id],
    queryFn: () => api.get(`/analyses/${id}`),
  });

  const shareMutation = useMutation({
    mutationFn: () => api.post<{ token: string; url: string }>(`/analyses/${id}/share`),
    onSuccess: (d) => {
      const url = `${window.location.origin}${d.url}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url);
    },
  });

  if (isLoading) return <LoadingSpinner size="lg" label="Loading analysis..." className="mt-32" />;
  if (error || !data) {
    return (
      <div className="mx-auto mt-10 max-w-2xl px-4">
        <ErrorAlert message="Analysis not found" />
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const b = data.breakdown;
  const verdictConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
    pass: { label: 'PASS', variant: 'success' },
    caution: { label: 'CAUTION', variant: 'warning' },
    fail: { label: 'FAIL', variant: 'danger' },
  };
  const vc = verdictConfig[data.verdict] ?? verdictConfig.fail;

  return (
    <div className="mx-auto mt-10 max-w-2xl px-4 pb-20">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        &larr; Back to Dashboard
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-xl font-bold">{data.property.address}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ${data.property.price.toLocaleString()} &middot; {data.property.bedrooms ?? '?'}bd{' '}
          {data.property.bathrooms ?? '?'}ba &middot; {data.property.sqft?.toLocaleString() ?? '?'} sqft &middot;{' '}
          {data.strategy.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{new Date(data.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => shareMutation.mutate()}
          disabled={shareMutation.isPending}
        >
          {shareUrl ? 'Link Copied!' : shareMutation.isPending ? 'Creating...' : 'Share Link'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => window.print()}>
          Print / PDF
        </Button>
      </div>

      <div className={cn('rounded-xl border-2 p-6 text-center mb-8', vc.variant === 'success' && 'border-success/40 bg-success/5', vc.variant === 'warning' && 'border-warning/40 bg-warning/5', vc.variant === 'danger' && 'border-danger/40 bg-danger/5')}>
        <p className="text-5xl font-bold tabular-nums">{data.dscrRatio.toFixed(2)}x</p>
        <div className="mt-2">
          <Badge variant={vc.variant}>{vc.label}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-0">
          <p className="text-sm font-semibold mb-2">Income</p>
          <LineItem label="Gross Rental Income" value={`+ $${b.grossRent.toLocaleString()}`} />
          <LineItem label="Vacancy (5%)" value={`- $${Math.abs(b.vacancy).toLocaleString()}`} />
          <div className="border-t border-border mt-1 pt-1">
            <LineItem label="Effective Gross Income" value={`+ $${b.effectiveIncome.toLocaleString()}`} isBold />
          </div>

          <p className="text-sm font-semibold mt-4 mb-2">Operating Expenses</p>
          <LineItem label="Operating Expenses (10%)" value={`- $${Math.abs(b.operatingExpenses).toLocaleString()}`} />
          <LineItem label="Property Management (6%)" value={`- $${Math.abs(b.propertyManagement).toLocaleString()}`} />
          <LineItem label="Repairs & Maintenance (5%)" value={`- $${Math.abs(b.repairs).toLocaleString()}`} />
          <LineItem label="CapEx Reserve (3%)" value={`- $${Math.abs(b.capex).toLocaleString()}`} />
          <div className="border-t border-border mt-1 pt-1">
            <LineItem label="Net Operating Income" value={`+ $${b.noi.toLocaleString()}`} isBold />
          </div>

          <p className="text-sm font-semibold mt-4 mb-2">Debt Service</p>
          <LineItem label="Principal & Interest" value={`- $${Math.abs(b.principalInterest).toLocaleString()}`} />
          <LineItem label="Property Taxes" value={`- $${Math.abs(b.propertyTax).toLocaleString()}`} />
          <LineItem label="Insurance" value={`- $${Math.abs(b.insurance).toLocaleString()}`} />
          <LineItem label="HOA" value={`- $${Math.abs(b.hoaExpense).toLocaleString()}`} />
          <div className="border-t border-border mt-1 pt-1">
            <LineItem label="Total Debt Service" value={`- $${b.totalDebtService.toLocaleString()}`} isBold />
          </div>

          <div className="border-t-2 border-border mt-3 pt-3">
            <LineItem
              label="Debt Service Coverage Ratio"
              value={`${data.dscrRatio.toFixed(3)}x`}
              isBold
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
