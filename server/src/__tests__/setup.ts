import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';

const TEST_EMAIL = 'test@dscr.test';

export async function createTestUser() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [user] = await db
    .insert(users)
    .values({
      email: TEST_EMAIL,
      passwordHash: '$2b$10$test',
      name: 'Test User',
    })
    .returning();
  return user!;
}
