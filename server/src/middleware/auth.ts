import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
}
