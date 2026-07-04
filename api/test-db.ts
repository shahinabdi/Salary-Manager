import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Testing DB connection...');
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'MISSING');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const result = await db.query('SELECT NOW()');
    return res.status(200).json({
      success: true,
      timestamp: result.rows[0],
    });
  } catch (error) {
    console.error('DB Connection Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined,
      errno: typeof error === 'object' && error !== null && 'errno' in error
        ? (error as { errno?: unknown }).errno
        : undefined,
    });

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name,
    });
  }
}
