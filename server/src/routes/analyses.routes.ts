import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { analyses } from '../db/schema/analyses.js';
import { properties } from '../db/schema/properties.js';
import { requireAuth } from '../middleware/auth.js';

export const analysesRoutes = Router();

analysesRoutes.get('/analyses', requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: analyses.id,
        strategy: analyses.strategy,
        dscrRatio: analyses.dscrRatio,
        verdict: analyses.verdict,
        noi: analyses.noi,
        totalDebtService: analyses.totalDebtService,
        createdAt: analyses.createdAt,
        property: {
          id: properties.id,
          address: properties.address,
          price: properties.price,
        },
      })
      .from(analyses)
      .innerJoin(properties, eq(analyses.propertyId, properties.id))
      .where(eq(analyses.userId, req.user!.id))
      .orderBy(desc(analyses.createdAt))
      .limit(50);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

analysesRoutes.get('/analyses/:id', requireAuth, async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(analyses)
      .innerJoin(properties, eq(analyses.propertyId, properties.id))
      .where(eq(analyses.id, req.params.id as string))
      .limit(1);

    if (!row || row.analyses.userId !== req.user!.id) {
      res.status(404).json({ error: 'Analysis not found', code: 'NOT_FOUND' });
      return;
    }

    const a = row.analyses;
    const p = row.properties;

    res.json({
      id: a.id,
      strategy: a.strategy,
      dscrRatio: Number(a.dscrRatio),
      verdict: a.verdict,
      breakdown: {
        grossRent: Number(a.monthlyIncome),
        vacancy: -Number(a.vacancy),
        effectiveIncome: Number(a.monthlyIncome) - Number(a.vacancy),
        operatingExpenses: -Number(a.operatingExpenses),
        propertyManagement: -Number(a.propertyManagement),
        repairs: -Number(a.repairs),
        capex: -Number(a.capex),
        noi: Number(a.noi),
        principalInterest: -Number(a.principalInterest),
        propertyTax: -Number(a.taxes),
        insurance: -Number(a.insurance),
        hoaExpense: -Number(a.hoaExpense),
        totalDebtService: Number(a.totalDebtService),
      },
      property: {
        id: p.id,
        address: p.address,
        price: Number(p.price),
        bedrooms: p.beds,
        bathrooms: Number(p.baths),
        sqft: p.sqft,
        propertyType: p.propertyType,
        yearBuilt: p.yearBuilt,
        estimatedRent: Number(p.estimatedRent),
        hoa: Number(p.hoa),
      },
      createdAt: a.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

analysesRoutes.delete('/analyses/:id', requireAuth, async (req, res, next) => {
  try {
    const [row] = await db
      .delete(analyses)
      .where(eq(analyses.id, req.params.id as string))
      .returning();

    if (!row) {
      res.status(404).json({ error: 'Analysis not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
