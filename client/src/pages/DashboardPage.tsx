import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorAlert } from '../components/ui/error-alert';
import { EmptyState } from '../components/ui/empty-state';

interface AnalysisRow {
  id: string;
  strategy: string;
  dscrRatio: string | null;
  verdict: string | null;
  noi: string | null;
  createdAt: string;
  property: { id: string; address: string; price: string };
}

function VerdictBadge({ verdict }: { verdict: string | null }) {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    pass: 'success', caution: 'warning', fail: 'danger',
  };
  return <Badge variant={map[verdict ?? ''] ?? 'default'}>{verdict ?? 'N/A'}</Badge>;
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery<AnalysisRow[]>({
    queryKey: ['analyses'],
    queryFn: () => api.get('/analyses'),
  });

  if (isLoading) return <LoadingSpinner size="lg" label="Loading analyses..." className="mt-32" />;

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-4xl px-4">
        <ErrorAlert message="Failed to load analyses" />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-4xl px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Analyses</h1>
          <p className="text-sm text-muted-foreground mt-1">Your saved property verdicts</p>
        </div>
        <Link to="/analyze">
          <Button>New Analysis</Button>
        </Link>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          icon={<span className="text-3xl">🏠</span>}
          title="No analyses yet"
          description="Paste a Zillow URL to get your first DSCR verdict."
          action={
            <Link to="/analyze">
              <Button>Analyze a Property</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <Link key={a.id} to={`/analysis/${a.id}`} className="block">
              <Card className="p-4 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{a.property.address}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      ${Number(a.property.price).toLocaleString()} &middot;{' '}
                      {a.strategy.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold">
                      {a.dscrRatio ? Number(a.dscrRatio).toFixed(2) : '\u2014'}x
                    </p>
                    <div className="mt-0.5">
                      <VerdictBadge verdict={a.verdict} />
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
