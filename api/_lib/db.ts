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

    // For remote hosts (Supabase, etc.), use SSL with relaxed cert validation
    // This is safe for serverless because the connection is over the internet and
    // we rely on password auth; self-signed certs are common in managed services
    return {
      rejectUnauthorized: false,
    };
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
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.salarymanagement_POSTGRES_URL ||
    process.env.salarymanagement_POSTGRES_URL_NON_POOLING;

  const connectionString = rawConnectionString
    ? normalizeConnectionString(rawConnectionString)
    : undefined;

  if (!connectionString) {
    throw new Error(
      'Missing database connection string. Set POSTGRES_URL, DATABASE_URL, POSTGRES_URL_NON_POOLING, or use Vercel-Supabase integration.'
    );
  }

  // Force sslmode=require for remote databases (especially Supabase pooler on port 6543)
  let finalConnectionString = connectionString;
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
      finalConnectionString = url.toString();
    }
  } catch {
    // Not a valid URL, use as-is
  }

  const ssl = shouldUseSsl(finalConnectionString);

  // Force SSL off if ?sslmode=disable, otherwise use config
  const sslConfig = finalConnectionString.includes('sslmode=disable') ? false : ssl;

  pool = new Pool({
    connectionString: finalConnectionString,
    ssl: sslConfig,
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
