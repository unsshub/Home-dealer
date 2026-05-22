import type { DSCRInput, DSCRResult, Strategy } from '@dscr/shared';
import { buyAndHoldCalculate } from './buy-and-hold';
import { brrrrCalculate } from './brrrr';

export type DSCRCalculator = (input: DSCRInput) => DSCRResult;

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: brrrrCalculate,
  fix_and_flip: buyAndHoldCalculate, // TODO: replace with fixAndFlipCalculate in Task 4
  str: buyAndHoldCalculate,          // TODO: replace with strCalculate in Task 5
};
