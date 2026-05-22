import type { DSCRInput, DSCRResult, Strategy } from '@dscr/shared';
import { buyAndHoldCalculate } from './buy-and-hold';

export type DSCRCalculator = (input: DSCRInput) => DSCRResult;

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: buyAndHoldCalculate,
  fix_and_flip: buyAndHoldCalculate,
  str: buyAndHoldCalculate,
};
