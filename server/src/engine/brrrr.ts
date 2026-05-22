import { buyAndHoldCalculate } from './buy-and-hold';
import type { DSCRInput, DSCRResult } from '@dscr/shared';

export function brrrrCalculate(input: DSCRInput): DSCRResult {
  const brrrrInput: DSCRInput = {
    ...input,
    price: input.afterRepairValue ?? input.price,
  };
  return buyAndHoldCalculate(brrrrInput);
}
