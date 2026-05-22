import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { scrapingService } from '../services/scraping.service.js';
import { calculateDSCR } from '../engine/dscr.engine.js';
import { requireAuth } from '../middleware/auth.js';
import { checkAnalysisLimit } from '../middleware/plan-gate.js';
import { properties } from '../db/schema/properties.js';
import { analyses } from '../db/schema/analyses.js';
import {
  STATE_DEFAULTS,
  getStateDefaults,
  getVerdict,
  DEFAULT_STRATEGY,
  type Strategy,
} from '@dscr/shared';

const analyzeSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  strategy: z
    .enum(['buy_and_hold', 'brrrr', 'fix_and_flip', 'str'])
    .default(DEFAULT_STRATEGY),
  params: z.object({
    downPaymentPercent: z.number().min(0).max(100),
    interestRate: z.number().min(0).max(30),
    loanTermYears: z.number().int().min(1).max(40),
    propertyTaxRate: z.number().nullable().optional(),
    insuranceRate: z.number().nullable().optional(),
  }),
  overrides: z
    .object({
      price: z.number().nullable().optional(),
      estimatedRent: z.number().nullable().optional(),
      hoa: z.number().nullable().optional(),
    })
    .optional(),
});

export const analyzeRoutes = Router();

analyzeRoutes.post('/analyze', requireAuth, checkAnalysisLimit, async (req, res, next) => {
  try {
    const body = analyzeSchema.parse(req.body);

    const scrapeResult = await scrapingService.scrape(body.url);
    const p = scrapeResult.property;

    const stateCode = scrapingService.extractStateFromAddress(p.address);
    const stateDefaults = stateCode ? getStateDefaults(stateCode) : null;

    if (body.overrides?.price != null) p.price = body.overrides.price;
    if (body.overrides?.estimatedRent != null) p.estimatedRent = body.overrides.estimatedRent;
    if (body.overrides?.hoa != null) p.hoa = body.overrides.hoa;

    const taxRate = body.params.propertyTaxRate ?? stateDefaults?.propertyTaxRate ?? 1.0;
    const insuranceRate = body.params.insuranceRate ?? stateDefaults?.insuranceRate ?? 0.3;

    const dscrInput = {
      price: p.price,
      downPaymentPercent: body.params.downPaymentPercent,
      interestRate: body.params.interestRate,
      loanTermYears: body.params.loanTermYears,
      monthlyGrossRent: p.estimatedRent,
      monthlyHoa: p.hoa,
      annualPropertyTaxRate: taxRate,
      annualInsuranceRate: insuranceRate,
      vacancyRate: 5,
      operatingExpenseRate: 10,
      propertyManagementRate: 6,
      repairsRate: 5,
      capexRate: 3,
    };

    const result = calculateDSCR(dscrInput);

    let propertyRecord;
    try {
      [propertyRecord] = await db
        .insert(properties)
        .values({
          userId: req.user!.id,
          url: body.url,
          address: p.address,
          price: String(p.price),
          beds: p.bedrooms || null,
          baths: p.bathrooms ? String(p.bathrooms) : null,
          sqft: p.sqft || null,
          propertyType: p.propertyType,
          yearBuilt: p.yearBuilt || null,
          estimatedRent: String(p.estimatedRent),
          hoa: String(p.hoa),
          propertyTaxRate: String(taxRate),
          insuranceRate: String(insuranceRate),
          scrapeRaw: scrapeResult.raw,
        })
        .returning();
    } catch {
      return next(new Error('Failed to save property'));
    }

    let analysisRecord;
    try {
      [analysisRecord] = await db
        .insert(analyses)
        .values({
          userId: req.user!.id,
          propertyId: propertyRecord!.id,
          strategy: body.strategy,
          dscrRatio: String(result.dscrRatio),
          verdict: result.verdict,
          monthlyIncome: String(result.breakdown.grossRent),
          vacancy: String(Math.abs(result.breakdown.vacancy)),
          operatingExpenses: String(Math.abs(result.breakdown.operatingExpenses)),
          propertyManagement: String(Math.abs(result.breakdown.propertyManagement)),
          repairs: String(Math.abs(result.breakdown.repairs)),
          capex: String(Math.abs(result.breakdown.capex)),
          noi: String(result.breakdown.noi),
          principalInterest: String(Math.abs(result.breakdown.principalInterest)),
          taxes: String(Math.abs(result.breakdown.propertyTax)),
          insurance: String(Math.abs(result.breakdown.insurance)),
          hoaExpense: String(Math.abs(result.breakdown.hoaExpense)),
          totalDebtService: String(result.breakdown.totalDebtService),
          downPaymentPct: String(body.params.downPaymentPercent),
          interestRate: String(body.params.interestRate),
          loanTermYears: body.params.loanTermYears,
        })
        .returning();
    } catch {
      return next(new Error('Failed to save analysis'));
    }

    res.status(201).json({
      id: analysisRecord!.id,
      property: {
        id: propertyRecord!.id,
        address: p.address,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        sqft: p.sqft,
        propertyType: p.propertyType,
        yearBuilt: p.yearBuilt,
        estimatedRent: p.estimatedRent,
        hoa: p.hoa,
      },
      strategy: body.strategy,
      dscrRatio: result.dscrRatio,
      verdict: result.verdict,
      breakdown: result.breakdown,
      createdAt: analysisRecord!.createdAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors,
      });
      return;
    }
    next(err);
  }
});
