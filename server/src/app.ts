import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import type { Express } from 'express';
import { createPgSessionStore } from './db/session-store.js';
import './services/auth.service.js';

export interface AppOptions {
  authenticatedUserId?: string;
  authenticatedUserEmail?: string;
}

export function createApp(options?: AppOptions): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json());

  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET;
  if (isProduction && !sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }

  app.use(
    session({
      secret: sessionSecret || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      store: isProduction ? createPgSessionStore() : undefined,
      cookie: { secure: isProduction },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  if (options?.authenticatedUserId) {
    app.use((req, _res, next) => {
      req.user = {
        id: options.authenticatedUserId!,
        email: options.authenticatedUserEmail ?? 'test@dscr.test',
      };
      next();
    });
  }

  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}
