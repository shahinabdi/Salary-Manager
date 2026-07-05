import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db.js';

function getDbEnvSource() {
  const candidates = [
    'POSTGRES_URL',
    'DATABASE_URL',
    'POSTGRES_URL_NON_POOLING',
    'salarymanagement_POSTGRES_PRISMA_URL',
    'salarymanagement_POSTGRES_URL',
    'salarymanagement_POSTGRES_URL_NON_POOLING',
  ] as const;

  const found = candidates.find((name) => Boolean(process.env[name]));
  return found ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing DB connection...');
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'MISSING');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
    console.log(
      'salarymanagement_POSTGRES_PRISMA_URL:',
      process.env.salarymanagement_POSTGRES_PRISMA_URL ? 'SET' : 'MISSING'
    );
    console.log('salarymanagement_POSTGRES_URL:', process.env.salarymanagement_POSTGRES_URL ? 'SET' : 'MISSING');
    console.log(
      'salarymanagement_POSTGRES_URL_NON_POOLING:',
      process.env.salarymanagement_POSTGRES_URL_NON_POOLING ? 'SET' : 'MISSING'
    );
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const result = await db.query('SELECT NOW()');
    return res.status(200).json({
      success: true,
      timestamp: result.rows[0],
      envSource: getDbEnvSource(),
    });
  } catch (error) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';

    console.error('DB Connection Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: errorCode || undefined,
      errno: typeof error === 'object' && error !== null && 'errno' in error
        ? (error as { errno?: unknown }).errno
        : undefined,
    });

    const responseMessage =
      errorCode === '28P01'
        ? 'Database credentials are invalid.'
        : ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'].includes(errorCode)
          ? 'Database host is unreachable from the server environment.'
          : /ssl|tls|certificate/i.test(error instanceof Error ? error.message : '')
            ? 'Database SSL/TLS negotiation failed.'
            : error instanceof Error
              ? error.message
              : 'Unknown error';

    return res.status(500).json({
      error: responseMessage,
      code: errorCode || 'UNKNOWN',
      envSource: getDbEnvSource(),
    });
  }
}
