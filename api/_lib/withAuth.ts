import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractAuthToken, verifyAuthToken } from './auth';

export interface AuthenticatedRequest extends VercelRequest {
  auth: {
    userId: number;
    email: string;
  };
}

type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: VercelResponse
) => Promise<void> | void;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const token = extractAuthToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = verifyAuthToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.auth = {
      userId,
      email: payload.email,
    };

    return handler(authenticatedReq, res);
  };
}
