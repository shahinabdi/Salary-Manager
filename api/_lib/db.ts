import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing database connection string. Set POSTGRES_URL or DATABASE_URL.');
}

declare global {
  // eslint-disable-next-line no-var
  var salaryManagerPgPool: Pool | undefined;
}

const ssl = connectionString.includes('localhost')
  ? false
  : {
      rejectUnauthorized: false,
    };

export const db =
  globalThis.salaryManagerPgPool ||
  new Pool({
    connectionString,
    ssl,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.salaryManagerPgPool = db;
}
