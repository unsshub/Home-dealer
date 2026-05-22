# Navy & Gold Visual Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Intercom/SaaS-cream visual language with a Navy & Gold "annual report" aesthetic. CSS-only surface change — no feature impact.

**Architecture:** CSS token swap in `index.css` (light-only, removes dark mode), then targeted component updates to Header, Card, Badge, Button, Input, and AnalyzePage/AnalysisDetailPage. Most pages auto-update via Tailwind CSS variables.

**Tech Stack:** Tailwind v4 (CSS-first config via `@theme inline`), React components

---

### Task 1: Rebuild CSS Theme Tokens (index.css)

**Files:**
- Modify: `client/src/index.css` (entire file)
- Modify: `client/index.html` (remove `class="dark"`, update font links)

- [ ] **Step 1: Update `client/index.html`**

Remove `class="dark"` from `<html>` tag. Remove Inter font preconnect/link (replaced by Georgia). Remove the Inter font import but keep the preconnect for Google Fonts if needed for system-ui fallback.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DSCR Verdict — Instant Rental Property Analysis</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Georgia&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-background text-foreground">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Note: Georgia is a system font on most platforms and doesn't need a Google Fonts import. Remove the font link entirely — just reference it in the `@theme` block as a `ui-serif, Georgia` stack.

- [ ] **Step 2: Write new `client/src/index.css`**

Replace the entire file. Remove the dark/`.light` class toggle system. Set `:root` with the Navy & Gold palette directly. Update `@theme inline` to match the new color tokens and font stack.

```css
@import 'tailwindcss';

@layer base {
  :root {
    --navy: #1a2332;
    --navy-mid: #2c3e5c;
    --gold: #d4a843;
    --paper: #f5f3ef;
    --surface: #ffffff;
    --ink: #1c1c1e;
    --ink-muted: #6b7280;
    --ink-subtle: #9ca3af;
    --border: #e0dcd5;
    --border-strong: #d4d0c8;
    --positive: #16a34a;
    --negative: #dc2626;
    --caution: #eab308;
    --positive-bg: #dcfce7;
    --negative-bg: #fee2e2;
    --caution-bg: #fef9c3;

    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
  }
}

@theme inline {
  --color-background: var(--paper);
  --color-foreground: var(--ink);
  --color-card: var(--surface);
  --color-card-foreground: var(--ink);
  --color-popover: var(--surface);
  --color-popover-foreground: var(--ink);
  --color-primary: var(--navy);
  --color-primary-foreground: #ffffff;
  --color-secondary: var(--navy-mid);
  --color-secondary-foreground: #ffffff;
  --color-muted: oklch(0.87 0.01 85);
  --color-muted-foreground: var(--ink-muted);
  --color-accent: var(--gold);
  --color-accent-foreground: var(--navy);
  --color-destructive: var(--negative);
  --color-destructive-foreground: #ffffff;
  --color-border: var(--border);
  --color-input: var(--border-strong);
  --color-ring: var(--gold);
  --color-success: var(--positive);
  --color-warning: var(--caution);
  --color-danger: var(--negative);
  --color-success-bg: var(--positive-bg);
  --color-warning-bg: var(--caution-bg);
  --color-danger-bg: var(--negative-bg);
  --radius: var(--radius-lg);
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --font-serif: Georgia, ui-serif, serif;
}

body {
  font-family: var(--font-sans);
  background: var(--color-background);
  color: var(--color-foreground);
  -webkit-font-smoothing: antialiased;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 3: Verify build succeeds**

Run: `npm run build --workspace=client -- --logLevel error`
Expected: Build completes with 0 errors

- [ ] **Step 4: Commit**

```bash
git add client/index.html client/src/index.css
git commit -m "feat(navy-gold): replace CSS theme with Navy & Gold palette, remove dark mode"
```

---

### Task 2: Update Header Component

**Files:**
- Modify: `client/src/components/layout/Header.tsx`
- Delete: `client/src/components/layout/ThemeToggle.tsx`

- [ ] **Step 1: Rewrite Header.tsx**

Navy background, gold brand mark, gold bottom border. Remove `ThemeToggle` import and usage. Replace backdrop blur with solid navy bar.

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-primary border-b-2 border-accent">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-serif text-lg font-bold text-accent tracking-tight">
          DSCR Verdict
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            to="/pricing"
            className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            Pricing
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link to="/analyze">
                <Button size="sm" variant="primary">New Analysis</Button>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Login
              </Link>
              <Link to="/register">
                <Button size="sm" variant="primary">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Delete ThemeToggle.tsx**

```bash
rm client/src/components/layout/ThemeToggle.tsx
```

- [ ] **Step 3: Verify build**

Run: `npm run build --workspace=client -- --logLevel error`
Expected: Build completes with 0 errors

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/Header.tsx client/src/components/layout/ThemeToggle.tsx
git commit -m "feat(navy-gold): update Header with navy bg, gold brand, remove theme toggle"
```

---

### Task 3: Update UI Components (Card, Badge, Input, Button)

**Files:**
- Modify: `client/src/components/ui/card.tsx`
- Modify: `client/src/components/ui/badge.tsx`
- Modify: `client/src/components/ui/input.tsx`
- Modify: `client/src/components/ui/button.tsx`

- [ ] **Step 1: Update Card.tsx**

Change radius from `rounded-xl` to `rounded-lg`. Keep border and bg tokens (they now map to new palette).

```tsx
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card text-card-foreground', className)}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Update Badge.tsx**

Change `rounded-full` to `rounded-sm`. Keep the same semantic variant classes (they map to new CSS variables like `--color-success-bg`).

```tsx
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-success-bg text-success border-success/30',
    warning: 'bg-warning-bg text-warning border-warning/30',
    danger: 'bg-danger-bg text-danger border-danger/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
```

Note: Adds `uppercase tracking-wider` for the "financial report" label feel.

- [ ] **Step 3: Update Input.tsx**

Change label from `text-sm font-medium` to the spec's label style: uppercase, smaller, tracked.

```tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
```

Key change: `bg-background` → `bg-card` (white surface instead of paper background), `focus-visible:ring-ring` now maps to gold.

- [ ] **Step 4: Verify Button.tsx is compatible**

Read the current Button.tsx. The `primary` variant uses `bg-primary text-primary-foreground` which now maps to navy bg + white text. The `secondary` variant uses `bg-secondary` which maps to navy-mid. No code changes needed — confirm the tokens work.

Run: `npm run build --workspace=client -- --logLevel error`
Expected: Build completes with 0 errors

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ui/card.tsx client/src/components/ui/badge.tsx client/src/components/ui/input.tsx
git commit -m "feat(navy-gold): update Card, Badge, Input components for Navy & Gold tokens"
```

---

### Task 4: Update AnalyzePage

**Files:**
- Modify: `client/src/pages/AnalyzePage.tsx`

- [ ] **Step 1: Update SegmentControl styling**

Change the segment control to use the spec's style: border-based instead of bg-secondary, active tab has white bg and shadow.

```tsx
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
```

- [ ] **Step 2: Update VerdictHero component**

Use Georgia serif font for the DSCR ratio. Add gold bottom border. Update badge usage (already uses Badge component, which now renders as uppercase).

```tsx
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
        <p className="font-serif text-5xl font-bold tabular-nums tracking-tight text-foreground border-b-[3px] border-accent inline-block pb-1">
          {ratio.toFixed(2)}x
        </p>
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
```

Key changes: `text-5xl font-bold` → `font-serif text-5xl font-bold`, added `border-b-3 border-accent inline-block pb-1` for gold underline.

- [ ] **Step 3: Update result metric grid and breakdown styling**

Add `font-serif` to the DSCR ratio in the breakdown panel. Use `bg-card`/`border` consistently (auto-mapped from CSS).

```tsx
// In the breakdown card, update the DSCR display line:
<p className={`font-serif text-xl font-bold tabular-nums mt-0.5 ${...}`}>
  {result.dscrRatio.toFixed(2)}x
</p>
```

And add `text-xs font-semibold uppercase tracking-wider text-muted-foreground` to section titles (they already match this pattern from the previous impeccable pass).

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=client -- --logLevel error`
Expected: Build completes with 0 errors

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/AnalyzePage.tsx
git commit -m "feat(navy-gold): update AnalyzePage — SegmentControl, VerdictHero gold underline, serif ratio"
```

---

### Task 5: Update AnalysisDetailPage

**Files:**
- Modify: `client/src/pages/AnalysisDetailPage.tsx`

- [ ] **Step 1: Update verdict hero panel**

Replace the `rounded-2xl border-2 p-8 text-center` verdict panel with a layout matching the AnalyzePage's VerdictHero style. Use serif font for the ratio, gold underline accent.

```tsx
// Replace the current <div className={`mt-6 rounded-2xl border-2 p-8 text-center ${vc.bg} ${vc.border}`}>
// with:
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
```

- [ ] **Step 2: Update the DSCR ratio capstone panel at the bottom**

Replace the `rounded-xl border-2 p-5` panel to use the same card styling.

```tsx
<div className="mt-8 rounded-lg border border-border bg-card p-5">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-foreground">Debt Service Coverage Ratio</p>
      <p className="text-xs text-muted-foreground mt-0.5">Net operating income ÷ total debt service</p>
    </div>
    <p className={`font-serif text-2xl font-bold tabular-nums ${vc.text}`}>
      {data.dscrRatio.toFixed(3)}x
    </p>
  </div>
</div>
```

- [ ] **Step 3: Update LineItem labels to use uppercase spec style**

The section headers already use `text-xs font-semibold uppercase tracking-wider text-muted-foreground` — keep these. The metric labels in `MetricBox` should stay as `text-xs text-muted-foreground`.

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=client -- --logLevel error`
Expected: Build completes with 0 errors

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/AnalysisDetailPage.tsx
git commit -m "feat(navy-gold): update AnalysisDetailPage — serif ratio, gold underline, card-based panels"
```

---

### Task 6: Audit Remaining Pages & Final Verify

**Files:**
- Audit: `client/src/pages/LandingPage.tsx`
- Audit: `client/src/pages/LoginPage.tsx`
- Audit: `client/src/pages/RegisterPage.tsx`
- Audit: `client/src/pages/DashboardPage.tsx`
- Audit: `client/src/pages/PricingPage.tsx`
- Audit: `client/src/pages/SharePage.tsx`

- [ ] **Step 1: Quick scan each page for hardcoded tokens**

Open each file and check for:
- `bg-background/80 backdrop-blur-sm` → should be fine (maps to paper bg)
- `text-primary` → maps to navy, good
- `bg-primary` → maps to navy, good
- `border-border` → maps to border color, good
- `rounded-xl` on cards → should be `rounded-lg` (update if found)
- Any dark-mode-specific logic or classes

If any `rounded-xl` is found on a card element outside Card.tsx, change it to `rounded-lg`.

Run: `grep -rn "rounded-xl" client/src/pages/`
Expected: No results (or only on non-card elements like decorative containers)

Run: `grep -rn "dark:" client/src/pages/`
Expected: No results (no dark mode overrides)

- [ ] **Step 2: Full build and verify**

```bash
npm run build --workspace=client -- --logLevel error
npm run build --workspace=server -- --logLevel error
```

Expected: Both build with 0 errors

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -20
```

Expected: All tests pass

- [ ] **Step 4: Final typecheck**

```bash
npx tsc --noEmit -p client/tsconfig.json
npx tsc --noEmit -p server/tsconfig.json
```

Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(navy-gold): audit remaining pages, ensure token compatibility"
```

---

### Task 7: Verify All 5 Commits History

- [ ] **Step 1: Check log**

```bash
git log --oneline -6
```

Expected: 5 new commits for the Navy & Gold redesign, showing the progression:
1. CSS theme tokens
2. Header + remove theme toggle
3. UI components (Card, Badge, Input)
4. AnalyzePage
5. AnalysisDetailPage + audit + final verify
