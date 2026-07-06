import type { VercelResponse } from '@vercel/node';
import { db } from './_lib/db.js';
import { type AuthenticatedRequest, withAuth } from './_lib/withAuth.js';

type EntryCategory = 'salary' | 'bonus' | 'overtime' | 'benefits';

interface DataEntry {
  id: string;
  year: number;
  month: number;
  category: EntryCategory;
  amount: number;
  salaryNet?: number;
  swilePayment?: number;
  transportPaid?: boolean;
  worked?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EntryRow {
  entry_id: string;
  year: number;
  month: number;
  category: EntryCategory;
  amount: number;
  salary_net: number | null;
  swile_payment: number | null;
  transport_paid: boolean | null;
  worked: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

let salaryEntriesTableEnsured = false;

async function ensureSalaryEntriesTable() {
  if (salaryEntriesTableEnsured) {
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS salary_entries (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id TEXT NOT NULL,
      year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      category TEXT NOT NULL CHECK (category IN ('salary', 'bonus', 'overtime', 'benefits')),
      amount NUMERIC(12, 2) NOT NULL,
      salary_net NUMERIC(12, 2),
      swile_payment NUMERIC(12, 2),
      transport_paid BOOLEAN,
      worked BOOLEAN,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, entry_id)
    );

    CREATE INDEX IF NOT EXISTS salary_entries_user_year_month_idx
      ON salary_entries (user_id, year, month);
  `);

  salaryEntriesTableEnsured = true;
}

function parseBody(req: AuthenticatedRequest): unknown {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as unknown;
    } catch {
      return {};
    }
  }

  if (typeof req.body === 'object') {
    return req.body;
  }

  return {};
}

function isCategory(value: unknown): value is EntryCategory {
  return ['salary', 'bonus', 'overtime', 'benefits'].includes(String(value));
}

function normalizeEntry(input: unknown): Omit<DataEntry, 'createdAt' | 'updatedAt'> {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid entry payload');
  }

  const raw = input as Record<string, unknown>;

  const id = String(raw.id || '').trim();
  const year = Number(raw.year);
  const month = Number(raw.month);
  const category = raw.category;
  const notes = typeof raw.notes === 'string' ? raw.notes : '';

  if (!id) {
    throw new Error('Entry id is required');
  }

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error('Invalid year');
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Invalid month');
  }

  if (!isCategory(category)) {
    throw new Error('Invalid category');
  }

  if (category === 'salary') {
    const salaryNet = Number(raw.salaryNet ?? raw.amount ?? 0);
    const swilePayment = Number(raw.swilePayment ?? 0);
    const transportPaid = Boolean(raw.transportPaid);
    const worked = Boolean(raw.worked ?? true);

    if (salaryNet < 0 || swilePayment < 0) {
      throw new Error('Salary values cannot be negative');
    }

    return {
      id,
      year,
      month,
      category,
      amount: salaryNet,
      salaryNet,
      swilePayment,
      transportPaid,
      worked,
      notes,
    };
  }

  const amount = Number(raw.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return {
    id,
    year,
    month,
    category,
    amount,
    notes,
  };
}

function mapRowToEntry(row: EntryRow): DataEntry {
  return {
    id: row.entry_id,
    year: Number(row.year),
    month: Number(row.month),
    category: row.category,
    amount: Number(row.amount),
    salaryNet: row.salary_net === null ? undefined : Number(row.salary_net),
    swilePayment: row.swile_payment === null ? undefined : Number(row.swile_payment),
    transportPaid: row.transport_paid === null ? undefined : Boolean(row.transport_paid),
    worked: row.worked === null ? undefined : Boolean(row.worked),
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isPgMissingTableError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  return code === '42P01';
}

async function getUserEntries(userId: number) {
  const result = await db.query<EntryRow>(
    `SELECT
      entry_id,
      year,
      month,
      category,
      amount::float8 AS amount,
      salary_net::float8 AS salary_net,
      swile_payment::float8 AS swile_payment,
      transport_paid,
      worked,
      notes,
      created_at,
      updated_at
    FROM salary_entries
    WHERE user_id = $1
    ORDER BY year DESC, month DESC, created_at DESC`,
    [userId]
  );

  return result.rows.map(mapRowToEntry);
}

async function dataHandler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    const userId = req.auth.userId;

    await ensureSalaryEntriesTable();

    if (req.method === 'GET') {
      const entries = await getUserEntries(userId);
      return res.status(200).json({ entries });
    }

    const body = parseBody(req);

    if (req.method === 'POST') {
      const payload = body as { entry?: unknown; entries?: unknown[] };

      if (Array.isArray(payload.entries)) {
        const normalizedEntries = payload.entries.map(normalizeEntry);
        const importedIds: string[] = [];
        const skippedIds: string[] = [];

        for (const entry of normalizedEntries) {
          const result = await db.query<{ entry_id: string }>(
            `INSERT INTO salary_entries (
              user_id,
              entry_id,
              year,
              month,
              category,
              amount,
              salary_net,
              swile_payment,
              transport_paid,
              worked,
              notes
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT (user_id, entry_id) DO NOTHING
            RETURNING entry_id`,
            [
              userId,
              entry.id,
              entry.year,
              entry.month,
              entry.category,
              entry.amount,
              entry.category === 'salary' ? entry.salaryNet ?? entry.amount : null,
              entry.category === 'salary' ? entry.swilePayment ?? 0 : null,
              entry.category === 'salary' ? entry.transportPaid ?? false : null,
              entry.category === 'salary' ? entry.worked ?? true : null,
              entry.notes ?? '',
            ]
          );

          if (result.rowCount && result.rowCount > 0) {
            importedIds.push(entry.id);
          } else {
            skippedIds.push(entry.id);
          }
        }

        return res.status(200).json({
          importedCount: importedIds.length,
          skippedCount: skippedIds.length,
          importedIds,
          skippedIds,
        });
      }

      if (!payload.entry) {
        return res.status(400).json({ error: 'Entry payload is required' });
      }

      const entry = normalizeEntry(payload.entry);
      const result = await db.query<EntryRow>(
        `INSERT INTO salary_entries (
          user_id,
          entry_id,
          year,
          month,
          category,
          amount,
          salary_net,
          swile_payment,
          transport_paid,
          worked,
          notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING
          entry_id,
          year,
          month,
          category,
          amount::float8 AS amount,
          salary_net::float8 AS salary_net,
          swile_payment::float8 AS swile_payment,
          transport_paid,
          worked,
          notes,
          created_at,
          updated_at`,
        [
          userId,
          entry.id,
          entry.year,
          entry.month,
          entry.category,
          entry.amount,
          entry.category === 'salary' ? entry.salaryNet ?? entry.amount : null,
          entry.category === 'salary' ? entry.swilePayment ?? 0 : null,
          entry.category === 'salary' ? entry.transportPaid ?? false : null,
          entry.category === 'salary' ? entry.worked ?? true : null,
          entry.notes ?? '',
        ]
      );

      return res.status(201).json({ entry: mapRowToEntry(result.rows[0]) });
    }

    if (req.method === 'PUT') {
      const payload = body as { id?: string; updates?: unknown };
      if (!payload.id || !payload.updates) {
        return res.status(400).json({ error: 'id and updates are required' });
      }

      const existingResult = await db.query<EntryRow>(
        `SELECT
          entry_id,
          year,
          month,
          category,
          amount::float8 AS amount,
          salary_net::float8 AS salary_net,
          swile_payment::float8 AS swile_payment,
          transport_paid,
          worked,
          notes,
          created_at,
          updated_at
        FROM salary_entries
        WHERE user_id = $1 AND entry_id = $2
        LIMIT 1`,
        [userId, payload.id]
      );

      const existing = existingResult.rows[0];
      if (!existing) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      const merged = {
        ...mapRowToEntry(existing),
        ...(payload.updates as Record<string, unknown>),
        id: payload.id,
      };

      const entry = normalizeEntry(merged);

      const result = await db.query<EntryRow>(
        `UPDATE salary_entries
        SET
          year = $3,
          month = $4,
          category = $5,
          amount = $6,
          salary_net = $7,
          swile_payment = $8,
          transport_paid = $9,
          worked = $10,
          notes = $11,
          updated_at = NOW()
        WHERE user_id = $1 AND entry_id = $2
        RETURNING
          entry_id,
          year,
          month,
          category,
          amount::float8 AS amount,
          salary_net::float8 AS salary_net,
          swile_payment::float8 AS swile_payment,
          transport_paid,
          worked,
          notes,
          created_at,
          updated_at`,
        [
          userId,
          payload.id,
          entry.year,
          entry.month,
          entry.category,
          entry.amount,
          entry.category === 'salary' ? entry.salaryNet ?? entry.amount : null,
          entry.category === 'salary' ? entry.swilePayment ?? 0 : null,
          entry.category === 'salary' ? entry.transportPaid ?? false : null,
          entry.category === 'salary' ? entry.worked ?? true : null,
          entry.notes ?? '',
        ]
      );

      return res.status(200).json({ entry: mapRowToEntry(result.rows[0]) });
    }

    if (req.method === 'DELETE') {
      const payload = body as { id?: string; all?: boolean };

      if (payload.all) {
        await db.query('DELETE FROM salary_entries WHERE user_id = $1', [userId]);
        return res.status(200).json({ success: true, deletedAll: true });
      }

      if (!payload.id) {
        return res.status(400).json({ error: 'id is required' });
      }

      await db.query('DELETE FROM salary_entries WHERE user_id = $1 AND entry_id = $2', [userId, payload.id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Data API error', { message });

    if (isPgMissingTableError(error)) {
      return res.status(500).json({
        error: 'Database schema is not initialized. Run database/schema.sql to create salary_entries table.',
      });
    }

    if (message.includes('Invalid') || message.includes('required') || message.includes('greater than')) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(dataHandler);