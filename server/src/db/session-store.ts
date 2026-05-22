import PgSession from 'connect-pg-simple';
import session from 'express-session';
import pg from 'pg';

const PgStore = PgSession(session);

export function createPgSessionStore() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for Postgres session store');
  }
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  return new PgStore({ pool, createTableIfMissing: true });
}
