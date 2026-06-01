import { Pool } from 'pg';

// Reuse pool across serverless function warm instances
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    ssl: process.env.DATABASE_URL?.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : false,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

export default pool;
