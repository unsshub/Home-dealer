import { useAuth } from '../hooks/use-auth';
import { useSubscription } from '../hooks/use-subscription';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const PLANS = [
  { slug: 'free', name: 'Free', price: '$0', features: ['3 analyses per month', 'Buy & Hold strategy', 'Basic breakdown'] },
  { slug: 'starter', name: 'Starter', price: '$19', period: '/mo', popular: true, features: ['50 analyses per month', 'All 4 strategies', 'Full breakdown export', 'PDF reports'] },
  { slug: 'pro', name: 'Pro', price: '$49', period: '/mo', features: ['Unlimited analyses', 'Priority AI scraping', 'Share links', 'Team access (up to 5)'] },
];

export function PricingPage() {
  const { user } = useAuth();
  const { isFree, checkoutMutation } = useSubscription();
  const navigate = useNavigate();

  const handleClick = (slug: string) => {
    if (!user) { navigate('/register'); return; }
    if (slug === 'free') { navigate('/dashboard'); return; }
    checkoutMutation.mutate(slug);
  };

  return (
    <div className="mx-auto mt-16 max-w-4xl px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-2 text-muted-foreground">Choose the plan that fits your deal flow.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 items-start">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary ring-1 ring-primary' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default">Most Popular</Badge>
              </div>
            )}
            <CardContent className={`pt-6 flex flex-col ${plan.popular ? 'mt-3' : ''}`}>
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </p>
              <ul className="mt-6 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-muted-foreground">
                    <span className="text-primary mr-2">&check;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? 'primary' : 'secondary'}
                className="mt-6 w-full"
                onClick={() => handleClick(plan.slug)}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? 'Redirecting...' : isFree && plan.slug === 'free' ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
