import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var salaryManagerPgPool: Pool | undefined;
}

let pool = globalThis.salaryManagerPgPool;

function shouldUseSsl(connectionString: string) {
  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname.toLowerCase();
    const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase();

    if (sslMode === 'disable') {
      return false;
    }

    if (host === 'localhost' || host === '127.0.0.1') {
      return false;
    }
  } catch {
    if (connectionString.includes('localhost')) {
      return false;
    }
  }

  return {
    rejectUnauthorized: false,
  };
}

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing database connection string. Set POSTGRES_URL or DATABASE_URL.');
  }

  const ssl = shouldUseSsl(connectionString);

  pool = new Pool({
    connectionString,
    ssl,
    connectionTimeoutMillis: 10_000,
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
