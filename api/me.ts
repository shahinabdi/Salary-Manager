import type { VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { type AuthenticatedRequest, withAuth } from './_lib/withAuth';

interface UserRow {
  id: number;
  email: string;
  name: string | null;
}

async function meHandler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const result = await db.query<UserRow>(
      'SELECT id, email, name FROM users WHERE id = $1 LIMIT 1',
      [req.auth.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Me API error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(meHandler);
