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
    console.error('Login API error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}
