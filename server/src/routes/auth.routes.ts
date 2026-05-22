import { Router } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { usersService } from '../services/users.service.js';
import { requireAuth } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export const authRoutes = Router();

authRoutes.post('/auth/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await usersService.findByEmail(body.email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
      return;
    }

    const user = await usersService.create(body.email, body.password, body.name);

    req.login({ id: user.id, email: user.email }, (err) => {
      if (err) return next(err);
      res.status(201).json({ id: user.id, email: user.email, name: user.name });
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.flatten().fieldErrors });
      return;
    }
    next(err);
  }
});

authRoutes.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
    if (err) return next(err);
    if (!user) {
      res.status(401).json({ error: info?.message ?? 'Authentication failed', code: 'INVALID_CREDENTIALS' });
      return;
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({ id: user.id, email: user.email });
    });
  })(req, res, next);
});

authRoutes.post('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Logged out' });
  });
});

authRoutes.get('/auth/me', requireAuth, (req, res) => {
  res.json({ id: req.user!.id, email: req.user!.email });
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5175';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  authRoutes.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
  }));

  authRoutes.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: `${CLIENT_URL}/dashboard`,
      failureRedirect: `${CLIENT_URL}/login?error=google_auth_failed`,
    })
  );
}
