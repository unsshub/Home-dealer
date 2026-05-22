import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { analyses } from '../db/schema/analyses.js';
import { properties } from '../db/schema/properties.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

export const sharesRoutes = Router();

sharesRoutes.post('/analyses/:id/share', requireAuth, async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, req.params.id as string))
      .limit(1);

    if (!row || row.userId !== req.user!.id) {
      res.status(404).json({ error: 'Analysis not found', code: 'NOT_FOUND' });
      return;
    }

    const token = row.shareToken ?? crypto.randomUUID();

    if (!row.shareToken) {
      await db
        .update(analyses)
        .set({ shareToken: token })
        .where(eq(analyses.id, row.id));
    }

    res.json({ token, url: `/share/${token}` });
  } catch (err) {
    next(err);
  }
});

sharesRoutes.get('/shares/:token', async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(analyses)
      .innerJoin(properties, eq(analyses.propertyId, properties.id))
      .where(eq(analyses.shareToken, req.params.token as string))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: 'Shared analysis not found', code: 'NOT_FOUND' });
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
        address: p.address,
        price: Number(p.price),
        bedrooms: p.beds,
        bathrooms: Number(p.baths),
        sqft: p.sqft,
        estimatedRent: Number(p.estimatedRent),
        hoa: Number(p.hoa),
      },
      createdAt: a.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
