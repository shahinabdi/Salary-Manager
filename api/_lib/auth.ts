import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parse, serialize } from 'cookie';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const AUTH_COOKIE_NAME = 'salary_manager_auth';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

interface AppJwtPayload extends JwtPayload {
  sub: string;
  email: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable.');
  }

  return secret;
}

export function createAuthToken(user: { id: number; email: string }) {
  return jwt.sign({ email: user.email }, getJwtSecret(), {
    subject: String(user.id),
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyAuthToken(token: string): AppJwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AppJwtPayload;

    if (!decoded.sub || !decoded.email) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: VercelResponse, token: string) {
  const serialized = serialize(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });

  res.setHeader('Set-Cookie', serialized);
}

export function clearAuthCookie(res: VercelResponse) {
  const serialized = serialize(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  res.setHeader('Set-Cookie', serialized);
}

export function extractAuthToken(req: VercelRequest): string | null {
  const raw = req.headers.cookie;

  if (!raw) {
    return null;
  }

  const cookies = parse(raw);
  return cookies[AUTH_COOKIE_NAME] || null;
}
