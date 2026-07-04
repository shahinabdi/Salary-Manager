import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var salaryManagerPgPool: Pool | undefined;
}

let pool = globalThis.salaryManagerPgPool;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing database connection string. Set POSTGRES_URL or DATABASE_URL.');
  }

  const ssl = connectionString.includes('localhost')
    ? false
    : {
        rejectUnauthorized: false,
      };

  pool = new Pool({
    connectionString,
    ssl,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.salaryManagerPgPool = pool;
  }

  return pool;
}

export const db = {
  query<T = unknown>(text: string, params?: unknown[]) {
    return getPool().query<T>(text, params);
  },
};
