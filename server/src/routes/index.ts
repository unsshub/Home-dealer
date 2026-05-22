import { Router } from 'express';
import { analyzeRoutes } from './analyze.routes.js';
import { authRoutes } from './auth.routes.js';
import { analysesRoutes } from './analyses.routes.js';
import { sharesRoutes } from './shares.routes.js';
import { stripeRoutes } from './stripe.routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

routes.use(analyzeRoutes);
routes.use(authRoutes);
routes.use(analysesRoutes);
routes.use(sharesRoutes);
routes.use(stripeRoutes);
