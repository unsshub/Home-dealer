import type { DSCRInput, DSCRResult, Strategy } from '@dscr/shared';
import { buyAndHoldCalculate } from './buy-and-hold';
import { brrrrCalculate } from './brrrr';
import { fixAndFlipCalculate } from './fix-and-flip';
import { strCalculate } from './short-term-rental';

export type DSCRCalculator = (input: DSCRInput) => DSCRResult;

export const registry: Record<Strategy, DSCRCalculator> = {
  buy_and_hold: buyAndHoldCalculate,
  brrrr: brrrrCalculate,
  fix_and_flip: fixAndFlipCalculate,
  str: strCalculate,
};
