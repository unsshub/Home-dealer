import { buyAndHoldCalculate } from './buy-and-hold';
import type { DSCRInput, DSCRResult } from '@dscr/shared';

export function fixAndFlipCalculate(input: DSCRInput): DSCRResult {
  const dscrResult = buyAndHoldCalculate(input);

  const totalInvestment = input.price + (input.rehabCosts ?? 0);
  const netProceeds = (input.afterRepairValue ?? 0) * (1 - (input.sellingCostsPercent ?? 8) / 100);
  const grossProfit = netProceeds - totalInvestment;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  const holdingPeriod = input.holdingPeriodMonths ?? 6;
  const annualizedRoi = holdingPeriod > 0 && roi > -100
    ? (Math.pow(1 + roi / 100, 12 / holdingPeriod) - 1) * 100
    : roi > -100 ? roi : -100;

  return {
    ...dscrResult,
    flipMetrics: {
      totalInvestment: Math.round(totalInvestment * 100) / 100,
      netProceeds: Math.round(netProceeds * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      annualizedRoi: Math.round(annualizedRoi * 100) / 100,
    },
  };
}
