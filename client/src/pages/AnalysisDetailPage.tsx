import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorAlert } from '../components/ui/error-alert';

interface AnalysisDetail {
  id: string; strategy: string; dscrRatio: number; verdict: string; createdAt: string;
  breakdown: Record<string, number>;
  property: { address: string; price: number; bedrooms: number | null; bathrooms: number | null; sqft: number | null; estimatedRent: number; hoa: number };
}

interface LineItemProps {
  label: string; value: string; bold?: boolean; total?: boolean; indent?: boolean;
}

function LineItem({ label, value, bold, total, indent }: LineItemProps) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${total ? 'border-t border-border pt-2 mt-1' : ''} ${indent ? 'pl-4' : ''}`}>
      <span className={bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

const VERDICT_STYLES: Record<string, { label: string; bg: string; border: string; text: string; badgeVariant: 'success' | 'warning' | 'danger' }> = {
  pass:    { label: 'PASS', bg: 'bg-success/8', border: 'border-success/25', text: 'text-success', badgeVariant: 'success' },
  caution: { label: 'CAUTION', bg: 'bg-warning/8', border: 'border-warning/25', text: 'text-warning', badgeVariant: 'warning' },
  fail:    { label: 'FAIL', bg: 'bg-danger/8', border: 'border-danger/25', text: 'text-danger', badgeVariant: 'danger' },
};

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
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
      <div className="mx-auto mt-10 max-w-3xl px-4">
        <ErrorAlert message="Analysis not found" />
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const b = data.breakdown;
  const vc = VERDICT_STYLES[data.verdict] ?? VERDICT_STYLES.fail;
  const formattedDate = new Date(data.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="mx-auto mt-8 max-w-3xl px-4 pb-24">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <span aria-hidden="true">&larr;</span> Dashboard
      </Link>

      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <p className="font-serif text-5xl font-bold tabular-nums tracking-tight text-foreground border-b-[3px] border-accent inline-block pb-1">
              {data.dscrRatio.toFixed(2)}<span className="text-2xl font-normal opacity-60">x</span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={vc.badgeVariant}>{vc.label}</Badge>
            </div>
          </div>
          <div className="hidden sm:block text-right text-xs text-muted-foreground leading-relaxed">
            <p>Pass ≥ 1.25</p>
            <p>Caution 1.0–1.25</p>
            <p>Fail &lt; 1.0</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground max-w-md leading-relaxed">
          {data.verdict === 'pass'
            ? 'Strong lender-grade coverage. This property cash-flows with room to spare.'
            : data.verdict === 'caution'
            ? 'Breaks even but the margin is thin. Verify assumptions with your lender.'
            : 'Does not cash-flow under these assumptions. Review your inputs or adjust terms.'}
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{data.property.address}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{formattedDate} &middot; {data.strategy.replace(/_/g, ' ')}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => shareMutation.mutate()}
                disabled={shareMutation.isPending}
              >
                {shareUrl ? 'Copied!' : shareMutation.isPending ? '...' : 'Share'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                Print
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border pt-4">
            <MetricBox label="Purchase Price" value={`$${data.property.price.toLocaleString()}`} />
            <MetricBox label="Property" value={`${data.property.bedrooms ?? '?'}bd ${data.property.bathrooms ?? '?'}ba`} />
            <MetricBox label="Square Feet" value={data.property.sqft ? `${data.property.sqft.toLocaleString()}` : '—'} />
            <MetricBox label="Est. Rent /mo" value={`$${data.property.estimatedRent.toLocaleString()}`} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <MetricBox label="Monthly HOA" value={`$${data.property.hoa.toLocaleString()}`} />
            <MetricBox label="Analysis ID" value={data.id.slice(0, 8)} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</p>
            <LineItem label="Gross Rental Income" value={`+ $${b.grossRent.toLocaleString()}`} />
            <LineItem label="Vacancy Allowance (5%)" value={`− $${Math.abs(b.vacancy).toLocaleString()}`} indent />
            <LineItem label="Effective Gross Income" value={`$${b.effectiveIncome.toLocaleString()}`} bold total />
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Expenses</p>
            <LineItem label="Operating Expenses (10%)" value={`− $${Math.abs(b.operatingExpenses).toLocaleString()}`} />
            <LineItem label="Property Management (6%)" value={`− $${Math.abs(b.propertyManagement).toLocaleString()}`} indent />
            <LineItem label="Repairs &amp; Maintenance (5%)" value={`− $${Math.abs(b.repairs).toLocaleString()}`} indent />
            <LineItem label="CapEx Reserve (3%)" value={`− $${Math.abs(b.capex).toLocaleString()}`} indent />
            <LineItem label="Net Operating Income" value={`$${b.noi.toLocaleString()}`} bold total />
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Debt Service</p>
            <LineItem label="Principal &amp; Interest" value={`− $${Math.abs(b.principalInterest).toLocaleString()}`} />
            <LineItem label="Property Taxes" value={`− $${Math.abs(b.propertyTax).toLocaleString()}`} indent />
            <LineItem label="Insurance" value={`− $${Math.abs(b.insurance).toLocaleString()}`} indent />
            <LineItem label="HOA" value={`− $${Math.abs(b.hoaExpense).toLocaleString()}`} indent />
            <LineItem label="Total Debt Service" value={`$${b.totalDebtService.toLocaleString()}`} bold total />
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Debt Service Coverage Ratio</p>
                <p className="text-xs text-muted-foreground mt-0.5">Net operating income &divide; total debt service</p>
              </div>
              <p className={`font-serif text-2xl font-bold tabular-nums text-foreground`}>
                {data.dscrRatio.toFixed(3)}x
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
