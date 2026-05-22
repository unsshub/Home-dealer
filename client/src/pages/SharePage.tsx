import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorAlert } from '../components/ui/error-alert';

interface SharedAnalysis {
  dscrRatio: number; verdict: string; strategy: string; createdAt: string;
  breakdown: Record<string, number>;
  property: { address: string; price: number; bedrooms: number | null; bathrooms: number | null; sqft: number | null; estimatedRent: number; hoa: number };
}

export function SharePage() {
  const { token } = useParams();

  const { data, isLoading, error } = useQuery<SharedAnalysis>({
    queryKey: ['share', token],
    queryFn: () => api.get(`/shares/${token}`),
  });

  if (isLoading) return <LoadingSpinner size="lg" label="Loading shared analysis..." className="mt-32" />;
  if (error || !data) {
    return (
      <div className="mx-auto mt-10 max-w-2xl px-4">
        <ErrorAlert message="Shared analysis not found or link expired" />
      </div>
    );
  }

  const verdictConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
    pass: { label: 'PASS', variant: 'success' },
    caution: { label: 'CAUTION', variant: 'warning' },
    fail: { label: 'FAIL', variant: 'danger' },
  };
  const vc = verdictConfig[data.verdict] ?? verdictConfig.fail;

  return (
    <div className="mx-auto mt-10 max-w-2xl px-4 pb-20">
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-muted-foreground">Shared Analysis</p>
        <h1 className="text-xl font-bold mt-1">DSCR Verdict</h1>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="font-medium">{data.property.address}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            ${data.property.price.toLocaleString()} &middot; {data.property.bedrooms ?? '?'}bd{' '}
            {data.property.bathrooms ?? '?'}ba &middot; {data.strategy.replace(/_/g, ' ')}
          </p>
        </CardContent>
      </Card>

      <div className={cn('rounded-xl border-2 p-6 text-center mb-6', vc.variant === 'success' && 'border-success/40 bg-success/5', vc.variant === 'warning' && 'border-warning/40 bg-warning/5', vc.variant === 'danger' && 'border-danger/40 bg-danger/5')}>
        <p className="text-5xl font-bold tabular-nums">{data.dscrRatio.toFixed(2)}x</p>
        <div className="mt-2">
          <Badge variant={vc.variant}>{vc.label}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Created {new Date(data.createdAt).toLocaleDateString()}
        </CardContent>
      </Card>
    </div>
  );
}
