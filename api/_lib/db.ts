import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var salaryManagerPgPool: Pool | undefined;
}

let pool = globalThis.salaryManagerPgPool;

function normalizeConnectionString(raw: string) {
  const trimmed = raw.trim();

  // Guard against accidentally quoted env vars in hosting dashboards.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

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

  const rawConnectionString =
    process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

  const connectionString = rawConnectionString
    ? normalizeConnectionString(rawConnectionString)
    : undefined;

  if (!connectionString) {
    throw new Error(
      'Missing database connection string. Set POSTGRES_URL, DATABASE_URL, or POSTGRES_URL_NON_POOLING.'
    );
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
