import type { Verdict } from '../types/analysis';

export const DSCR_THRESHOLDS = {
  PASS_MIN: 1.25,
  CAUTION_MIN: 1.0,
} as const;

export function getVerdict(dscrRatio: number): Verdict {
  if (dscrRatio >= DSCR_THRESHOLDS.PASS_MIN) return 'pass';
  if (dscrRatio >= DSCR_THRESHOLDS.CAUTION_MIN) return 'caution';
  return 'fail';
}

export const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; description: string }> = {
  pass: {
    label: 'Pass',
    color: 'green',
    description: 'Deal cash-flows with strong lender-grade coverage.',
  },
  caution: {
    label: 'Caution',
    color: 'amber',
    description: 'Deal breaks even but has thin margin — verify with lender.',
  },
  fail: {
    label: 'Fail',
    color: 'red',
    description: 'Deal does not cash-flow under these assumptions.',
  },
} as const;
