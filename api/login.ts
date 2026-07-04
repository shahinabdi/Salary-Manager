import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { createAuthToken, setAuthCookie } from './_lib/auth.js';
import { db } from './_lib/db.js';

interface LoginBody {
  email?: string;
  password?: string;
}

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  password_hash: string;
}

type ApiErrorCode =
  | 'MISSING_DB_URL'
  | 'MISSING_JWT_SECRET'
  | 'MISSING_USERS_TABLE'
  | 'INVALID_DB_CREDENTIALS'
  | 'INVALID_DB_NAME'
  | 'DB_NETWORK_ERROR'
  | 'DB_SSL_ERROR'
  | 'DB_CONNECTION_ERROR'
  | 'INTERNAL_SERVER_ERROR';

function classifyLoginError(error: unknown): { code: ApiErrorCode; status: number; message: string } {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('Missing database connection string')) {
    return {
      code: 'MISSING_DB_URL',
      status: 500,
      message: 'Authentication service is misconfigured.',
    };
  }

  if (message.includes('Missing JWT_SECRET')) {
    return {
      code: 'MISSING_JWT_SECRET',
      status: 500,
      message: 'Authentication service is misconfigured.',
    };
  }

  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  if (errorCode === '42P01') {
    return {
      code: 'MISSING_USERS_TABLE',
      status: 500,
      message: 'Database schema is not initialized.',
    };
  }

  if (errorCode === '28P01') {
    return {
      code: 'INVALID_DB_CREDENTIALS',
      status: 500,
      message: 'Database credentials are invalid.',
    };
  }

  if (errorCode === '3D000') {
    return {
      code: 'INVALID_DB_NAME',
      status: 500,
      message: 'Database does not exist or is not accessible.',
    };
  }

  if (['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'].includes(errorCode)) {
    return {
      code: 'DB_NETWORK_ERROR',
      status: 500,
      message: 'Database host is unreachable from the server environment.',
    };
  }

  if (
    ['SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(
      errorCode
    ) ||
    /ssl|tls|certificate/i.test(message)
  ) {
    return {
      code: 'DB_SSL_ERROR',
      status: 500,
      message: 'Database SSL/TLS negotiation failed.',
    };
  }

  if (errorCode) {
    return {
      code: 'DB_CONNECTION_ERROR',
      status: 500,
      message: 'Database connection failed.',
    };
  }

  return {
    code: 'INTERNAL_SERVER_ERROR',
    status: 500,
    message: 'Internal server error',
  };
}

function parseBody(req: VercelRequest): LoginBody {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as LoginBody;
    } catch {
      return {};
    }
  }

  if (typeof req.body === 'object') {
    return req.body as LoginBody;
  }

  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = parseBody(req);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query<UserRow>(
      'SELECT id, email, name, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email.trim()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createAuthToken({
      id: user.id,
      email: user.email,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    const classified = classifyLoginError(error);

    console.error('Login API error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: classified.code,
    });

    return res.status(classified.status).json({
      error: classified.message,
      code: classified.code,
    });
  }
}
