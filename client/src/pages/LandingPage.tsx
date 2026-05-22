import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const FEATURES = [
  { title: 'AI-Powered', body: 'Paste any listing URL. AI extracts all property data instantly.' },
  { title: 'Multi-Strategy', body: 'Buy & Hold, BRRRR, Fix & Flip, or Short-Term Rental analysis.' },
  { title: 'Lender Grade', body: 'Uses the same DSCR math lenders use to qualify deals.' },
];

export function LandingPage() {
  return (
    <div className="mx-auto mt-24 max-w-3xl px-4 text-center">
      <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary mb-6">
        For US Property Investors
      </div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Instant DSCR Verdict<br />
        <span className="text-primary">for Any Rental Property</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
        Paste a Zillow URL and get a lender-grade Pass / Caution / Fail verdict in seconds.
        No spreadsheets. No waiting.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link to="/analyze">
          <Button size="lg">Try It Free</Button>
        </Link>
        <Link to="/pricing">
          <Button variant="ghost" size="lg">See Pricing</Button>
        </Link>
      </div>

      <div className="mt-24 grid gap-6 sm:grid-cols-3 text-left">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
