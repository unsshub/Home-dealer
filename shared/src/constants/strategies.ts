import type { Strategy } from '../types/analysis';

export const STRATEGIES: Record<Strategy, { label: string; description: string }> = {
  buy_and_hold: {
    label: 'Buy & Hold',
    description: 'Purchase and rent for long-term cash flow and appreciation.',
  },
  brrrr: {
    label: 'BRRRR',
    description: 'Buy, Rehab, Rent, Refinance, Repeat — uses after-repair value.',
  },
  fix_and_flip: {
    label: 'Fix & Flip',
    description: 'Purchase, renovate, and resell quickly for profit.',
  },
  str: {
    label: 'Short-Term Rental',
    description: 'Rent furnished on Airbnb/VRBO for higher nightly income.',
  },
} as const;

export const DEFAULT_STRATEGY: Strategy = 'buy_and_hold';
