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

  async verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}

export const usersService = new UsersService();
