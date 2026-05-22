# Design Spec: Navy & Gold Visual Redesign

## Goal

Replace the current Intercom/SaaS-cream visual language with a grounded, professional "financial annual report" aesthetic using a Navy & Gold palette. This is a surface-level CSS theme change — no new features, no structural HTML changes.

## Register

Product (app UI). Real estate investors evaluating properties at their desk, daylight environment.

## Scene Sentence

An investor at their desk, comparing 4-5 property analyses side by side in browser tabs. They want trustworthy numbers they can read quickly and confidently. The tool should feel like a printed financial report — authoritative, structured, precise.

## Color Strategy

**Restrained + Committed hybrid.** Navy carries ~40% of the surface area (header, primary buttons, key accents). Gold is a single accent (≤5%). Paper/warm white is the content ground. This is not a generic SaaS palette — it draws from investment banking annual reports and high-end brokerage statements.

### Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--navy` | #1a2332 | #0f172a | Header bg, primary buttons, section titles |
| `--navy-mid` | #2c3e5c | #1e293b | Secondary surfaces, hover states |
| `--gold` | #d4a843 | #d4a843 | Brand mark, accent underline, focus rings, hover highlights |
| `--paper` | #f5f3ef | — | Page background (warm off-white, not pure white) |
| `--surface` | #ffffff | — | Card/surface background |
| `--ink` | #1c1c1e | — | Primary text |
| `--ink-muted` | #6b7280 | — | Secondary text |
| `--ink-subtle` | #9ca3af | — | Tertiary text |
| `--border` | #e0dcd5 | — | Card borders, hairline rules |
| `--border-strong` | #d4d0c8 | — | Input borders, stronger separators |
| `--positive` | #16a34a | — | DSCR pass, positive financials |
| `--negative` | #dc2626 | — | DSCR fail, negative financials |
| `--caution` | #eab308 | — | DSCR caution |
| `--positive-bg` | #dcfce7 | — | Badge background (pass) |
| `--negative-bg` | #fee2e2 | — | Badge background (fail) |
| `--caution-bg` | #fef9c3 | — | Badge background (caution) |

### Application

- **Page background**: Paper (#f5f3ef) — warm, like a printed annual report page
- **Header/nav**: Solid navy (#1a2332) with 2px gold bottom border
- **Cards**: White (#ffffff) with thin border (#e0dcd5), no shadow
- **Primary button**: Navy bg, white text, gold focus ring
- **Secondary button**: Transparent, ink border
- **Form inputs**: White bg, border-strong, gold focus ring
- **Links and brand marks**: Gold
- **Semantic colors**: Green/red/amber as above — use subtle background tints for badges

## Typography

### Fonts

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Headings / display | Georgia | 700 | serif |
| Body / UI | system-ui | 400 / 500 | ui-sans-serif |
| Financial figures | Courier New (or tabular) | 600 | ui-monospace |

Georgia brings the annual report feel without requiring a paid font license. system-ui stays crisp for UI elements. Monospace Courier gives financial numbers the "printed statement" look.

### Hierarchy (light mode)

| Element | Font | Size | Weight | Letter-spacing |
|---------|------|------|--------|---------------|
| Page title | Georgia | 24px | 700 | -0.3px |
| Card title / section head | Georgia | 18px | 700 | 0 |
| Body text | system-ui | 14px | 400 | 0 |
| Small / label | system-ui | 12px | 600 | +0.5px (uppercase) |
| Financial value | Courier New | 18px | 600 | 0 (tabular) |
| Verdict ratio | Georgia | 42px | 700 | -0.5px |
| Metric label | system-ui | 11px | 600 | +0.4px (uppercase) |

## Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, small tags |
| `--radius-md` | 6px | Buttons, form inputs |
| `--radius-lg` | 8px | Cards, larger containers |

No pill radii except for avatars (none in this app). Cards use subtle 8px max.

## Components (AnalysisPage)

### Header / Top Nav
- Full-width navy bar (#1a2332), 2px gold bottom border
- Brand mark "DSCR Verdict" in gold Georgia
- Nav links in white/cream, active state in gold
- Height: 48px

### SegmentControl (URL / Manual)
- Replaces current pill-tab design
- Container: border (#d4d0c8), 6px radius, light gray bg (#e8e4dc)
- Active tab: white bg, ink text, subtle shadow
- Inactive tab: transparent bg, muted text

### Strategy Dropdown
- Matches input styling: white bg, border, 6px radius
- Custom chevron in muted ink

### Form Card
- White bg (#ffffff), 8px radius, border (#e0dcd5)
- No shadow — depth via border-on-paper contrast
- Form labels: 12px uppercase, 600 weight, +0.5px tracking
- Inputs: 14px body, border-strong, gold ring on focus
- Params bar separated by thin rule

### Verdict Hero
- DSCR ratio: 42px Georgia bold, gold bottom border (3px)
- Badge: uppercase text, tinted bg, 4px radius
- Threshold legend: right-aligned, 11px tertiary text

### Result Metrics
- Metric label: 11px uppercase, muted
- Value: 18px Courier New, color-coded (green/red)
- Grid layout: 3-col for key metrics, 2-col for breakdown

### Flip Metrics Card
- Same card structure
- 5-col grid for flip metrics (total investment, net proceeds, gross profit, ROI, annualized ROI)
- Positive values green, negative red

## Theme

**Light-only.** This app serves daylight-desk investors. No dark mode. The HTML `class="dark"` is removed; the `.light` class becomes the default root. In practice this means `:root` gets the light palette directly and the `.light` / `.dark` class selectors are removed from the CSS.

## Implementation Plan

1. **CSS theme tokens** — Update `index.css` with the new palette, remove dark mode. Replace all current OKLCH variables.
2. **Typography** — Add Georgia to font stack. Update `index.css` font tokens. Remove Inter from the `@theme inline` block.
3. **Component updates** — Audit and update these components for new tokens:
   - `Header.tsx` — navy bg, gold brand, gold border
   - `Button.tsx` — navy primary, gold focus ring
   - `Input.tsx` — paper bg, gold focus
   - `Badge.tsx` — tinted bg, uppercase
   - `Card.tsx` — white bg, thin border
   - `SegmentControl` (inline in AnalyzePage) — new styling
   - `VerdictHero` (inline in AnalyzePage) — serif ratio, gold underline
4. **AnalyzePage** — Apply new component tokens, update metric grid styling
5. **Other pages** — Audit all existing pages for token compatibility:
   - LandingPage, LoginPage, RegisterPage, DashboardPage, AnalysisDetailPage, PricingPage, SharePage
6. **Build & verify** — Typecheck, build, test

## What Stays the Same

- All component logic, routing, API calls, data flow — untouched
- All tests — should still pass (CSS-only change)
- Layout structure — same grid and spacing system
