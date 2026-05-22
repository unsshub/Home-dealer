import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';

export class UsersService {
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return user ?? null;
  }

  async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  }

  async findByGoogleId(googleId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);
    return user ?? null;
  }

  async create(email: string, password: string, name?: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name: name ?? null,
      })
      .returning();
    return user!;
  }

  async createOrLinkGoogle(googleId: string, email: string, name: string) {
    const existing = await this.findByEmail(email);
    if (existing) {
      if (existing.googleId !== googleId) {
        const [updated] = await db
          .update(users)
          .set({ googleId })
          .where(eq(users.id, existing.id))
          .returning();
        return updated!;
      }
      return existing;
    }
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash: null,
        googleId,
        name: name || null,
      })
      .returning();
    return user!;
  }

  async verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}

export const usersService = new UsersService();
