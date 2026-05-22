import { describe, it, expect, afterAll } from 'vitest';
import { usersService } from './users.service.js';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';

describe('UsersService', () => {
  afterAll(async () => {
    await db.delete(users).where(eq(users.email, 'google-new@example.com'));
    await db.delete(users).where(eq(users.email, 'google-link@example.com'));
  });

  describe('createOrLinkGoogle', () => {
    it('creates a new user when email does not exist', async () => {
      const user = await usersService.createOrLinkGoogle(
        'google-id-new',
        'google-new@example.com',
        'New Google User'
      );

      expect(user).toBeDefined();
      expect(user.email).toBe('google-new@example.com');
      expect(user.googleId).toBe('google-id-new');
      expect(user.name).toBe('New Google User');
      expect(user.passwordHash).toBeNull();
    });

    it('links googleId to existing user with matching email', async () => {
      const existing = await usersService.create(
        'google-link@example.com',
        'password123',
        'Existing User'
      );

      expect(existing.passwordHash).toBeDefined();
      expect(existing.googleId).toBeNull();

      const linked = await usersService.createOrLinkGoogle(
        'google-id-link',
        'google-link@example.com',
        'Existing User'
      );

      expect(linked.id).toBe(existing.id);
      expect(linked.googleId).toBe('google-id-link');
    });
  });
});
