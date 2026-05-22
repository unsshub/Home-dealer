import type { DSCRInput, DSCRResult, Strategy } from '@dscr/shared';
import { buyAndHoldCalculate } from './buy-and-hold';

export type DSCRCalculator = (input: DSCRInput) => DSCRResult;

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: buyAndHoldCalculate,       // TODO: replace with brrrrCalculate in Task 3
  fix_and_flip: buyAndHoldCalculate, // TODO: replace with fixAndFlipCalculate in Task 4
  str: buyAndHoldCalculate,          // TODO: replace with strCalculate in Task 5
};
