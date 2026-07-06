import type { VercelResponse } from '@vercel/node';
import { db } from './_lib/db.js';
import { type AuthenticatedRequest, withAuth } from './_lib/withAuth.js';

type SalaryCategory = 'salary' | 'bonus' | 'overtime' | 'benefits';
type EntryCategory = SalaryCategory | 'bill';

// ─── Salary entries ───────────────────────────────────────────────────────────

interface SalaryDataEntry {
  id: string;
  year: number;
  month: number;
  category: SalaryCategory;
  amount: number;
  salaryNet?: number;
  swilePayment?: number;
  transportPaid?: boolean;
  worked?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SalaryEntryRow {
  entry_id: string;
  year: number;
  month: number;
  category: SalaryCategory;
  amount: number;
  salary_net: number | null;
  swile_payment: number | null;
  transport_paid: boolean | null;
  worked: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Bill entries ─────────────────────────────────────────────────────────────

interface BillDataEntry {
  id: string;
  year: number;
  month: number;
  category: 'bill';
  title: string;
  billingFrequency: 'monthly' | 'one-time';
  repeatAllYear: boolean;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BillEntryRow {
  entry_id: string;
  year: number;
  month: number;
  title: string;
  billing_frequency: 'monthly' | 'one-time';
  repeat_all_year: boolean;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type DataEntry = SalaryDataEntry | BillDataEntry;

let salaryTableEnsured = false;
let billsTableEnsured = false;

async function ensureSalaryEntriesTable() {
  if (salaryTableEnsured) return;
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
  salaryTableEnsured = true;
}

async function ensureBillsEntriesTable() {
  if (billsTableEnsured) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS bills_entries (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id TEXT NOT NULL,
      year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      title TEXT NOT NULL,
      billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'one-time')),
      repeat_all_year BOOLEAN NOT NULL DEFAULT FALSE,
      amount NUMERIC(12, 2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, entry_id),
      UNIQUE (user_id, title, year, month)
    );
    CREATE INDEX IF NOT EXISTS bills_entries_user_year_month_idx
      ON bills_entries (user_id, year, month);
  `);
  billsTableEnsured = true;
}

async function ensureAllTables() {
  await ensureSalaryEntriesTable();
  await ensureBillsEntriesTable();
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
  return ['salary', 'bonus', 'overtime', 'benefits', 'bill'].includes(String(value));
}

function normalizeEntry(input: unknown): Omit<DataEntry, 'createdAt' | 'updatedAt'> {
  if (!input || typeof input !== 'object') throw new Error('Invalid entry payload');

  const raw = input as Record<string, unknown>;
  const id = String(raw.id || '').trim();
  const year = Number(raw.year);
  const month = Number(raw.month);
  const category = raw.category;
  const notes = typeof raw.notes === 'string' ? raw.notes : '';

  if (!id) throw new Error('Entry id is required');
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error('Invalid year');
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Invalid month');
  if (!isCategory(category)) throw new Error('Invalid category');

  if (category === 'bill') {
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) throw new Error('Bill title is required');
    const billingFrequency = raw.billingFrequency === 'one-time' ? 'one-time' as const : 'monthly' as const;
    const repeatAllYear = Boolean(raw.repeatAllYear);
    const amount = Number(raw.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than 0');
    return { id, year, month, category: 'bill' as const, title, billingFrequency, repeatAllYear, amount, notes };
  }

  if (category === 'salary') {
    const salaryNet = Number(raw.salaryNet ?? raw.amount ?? 0);
    const swilePayment = Number(raw.swilePayment ?? 0);
    const transportPaid = Boolean(raw.transportPaid);
    const worked = Boolean(raw.worked ?? true);
    if (salaryNet < 0 || swilePayment < 0) throw new Error('Salary values cannot be negative');
    return { id, year, month, category: 'salary' as const, amount: salaryNet, salaryNet, swilePayment, transportPaid, worked, notes };
  }

  const amount = Number(raw.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than 0');
  return { id, year, month, category: category as SalaryCategory, amount, notes };
}

function mapSalaryRow(row: SalaryEntryRow): SalaryDataEntry {
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

function mapBillRow(row: BillEntryRow): BillDataEntry {
  return {
    id: row.entry_id,
    year: Number(row.year),
    month: Number(row.month),
    category: 'bill',
    title: row.title,
    billingFrequency: row.billing_frequency,
    repeatAllYear: Boolean(row.repeat_all_year),
    amount: Number(row.amount),
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

function isPgUniqueViolation(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  return code === '23505';
}

async function getUserSalaryEntries(userId: number): Promise<SalaryDataEntry[]> {
  const result = await db.query<SalaryEntryRow>(
    `SELECT entry_id, year, month, category,
       amount::float8 AS amount,
       salary_net::float8 AS salary_net,
       swile_payment::float8 AS swile_payment,
       transport_paid, worked, notes, created_at, updated_at
     FROM salary_entries
     WHERE user_id = $1
     ORDER BY year DESC, month DESC, created_at DESC`,
    [userId]
  );
  return result.rows.map(mapSalaryRow);
}

async function getUserBillEntries(userId: number): Promise<BillDataEntry[]> {
  const result = await db.query<BillEntryRow>(
    `SELECT entry_id, year, month, title, billing_frequency, repeat_all_year,
       amount::float8 AS amount, notes, created_at, updated_at
     FROM bills_entries
     WHERE user_id = $1
     ORDER BY year DESC, month DESC, created_at DESC`,
    [userId]
  );
  return result.rows.map(mapBillRow);
}

async function insertSalaryEntry(userId: number, entry: Omit<SalaryDataEntry, 'createdAt' | 'updatedAt'>): Promise<SalaryDataEntry> {
  const result = await db.query<SalaryEntryRow>(
    `INSERT INTO salary_entries (
       user_id, entry_id, year, month, category, amount,
       salary_net, swile_payment, transport_paid, worked, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING entry_id, year, month, category,
       amount::float8 AS amount, salary_net::float8 AS salary_net,
       swile_payment::float8 AS swile_payment, transport_paid, worked,
       notes, created_at, updated_at`,
    [
      userId, entry.id, entry.year, entry.month, entry.category, entry.amount,
      entry.category === 'salary' ? (entry.salaryNet ?? entry.amount) : null,
      entry.category === 'salary' ? (entry.swilePayment ?? 0) : null,
      entry.category === 'salary' ? (entry.transportPaid ?? false) : null,
      entry.category === 'salary' ? (entry.worked ?? true) : null,
      entry.notes ?? '',
    ]
  );
  return mapSalaryRow(result.rows[0]);
}

async function insertBillEntry(userId: number, entry: Omit<BillDataEntry, 'createdAt' | 'updatedAt'>): Promise<BillDataEntry> {
  const result = await db.query<BillEntryRow>(
    `INSERT INTO bills_entries (
       user_id, entry_id, year, month, title, billing_frequency, repeat_all_year, amount, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING entry_id, year, month, title, billing_frequency, repeat_all_year,
       amount::float8 AS amount, notes, created_at, updated_at`,
    [
      userId, entry.id, entry.year, entry.month,
      entry.title, entry.billingFrequency, entry.repeatAllYear,
      entry.amount, entry.notes ?? '',
    ]
  );
  return mapBillRow(result.rows[0]);
}

async function dataHandler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    const userId = req.auth.userId;

    await ensureAllTables();

    // GET
    if (req.method === 'GET') {
      const [salaryEntries, billEntries] = await Promise.all([
        getUserSalaryEntries(userId),
        getUserBillEntries(userId),
      ]);
      const entries: DataEntry[] = [...salaryEntries, ...billEntries];
      return res.status(200).json({ entries });
    }

    const body = parseBody(req);

    // POST
    if (req.method === 'POST') {
      const payload = body as { entry?: unknown; entries?: unknown[] };

      // Bulk import
      if (Array.isArray(payload.entries)) {
        const importedIds: string[] = [];
        const skippedIds: string[] = [];

        for (const raw of payload.entries) {
          try {
            const entry = normalizeEntry(raw);

            if (entry.category === 'bill') {
              const billEntry = entry as Omit<BillDataEntry, 'createdAt' | 'updatedAt'>;
              const result = await db.query<{ entry_id: string }>(
                `INSERT INTO bills_entries (
                   user_id, entry_id, year, month, title, billing_frequency, repeat_all_year, amount, notes
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (user_id, entry_id) DO NOTHING
                 RETURNING entry_id`,
                [userId, billEntry.id, billEntry.year, billEntry.month,
                 billEntry.title, billEntry.billingFrequency, billEntry.repeatAllYear,
                 billEntry.amount, billEntry.notes ?? '']
              );
              if (result.rowCount && result.rowCount > 0) {
                importedIds.push(billEntry.id);
              } else {
                skippedIds.push(billEntry.id);
              }
            } else {
              const salEntry = entry as Omit<SalaryDataEntry, 'createdAt' | 'updatedAt'>;
              const result = await db.query<{ entry_id: string }>(
                `INSERT INTO salary_entries (
                   user_id, entry_id, year, month, category, amount,
                   salary_net, swile_payment, transport_paid, worked, notes
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                 ON CONFLICT (user_id, entry_id) DO NOTHING
                 RETURNING entry_id`,
                [
                  userId, salEntry.id, salEntry.year, salEntry.month, salEntry.category, salEntry.amount,
                  salEntry.category === 'salary' ? (salEntry.salaryNet ?? salEntry.amount) : null,
                  salEntry.category === 'salary' ? (salEntry.swilePayment ?? 0) : null,
                  salEntry.category === 'salary' ? (salEntry.transportPaid ?? false) : null,
                  salEntry.category === 'salary' ? (salEntry.worked ?? true) : null,
                  salEntry.notes ?? '',
                ]
              );
              if (result.rowCount && result.rowCount > 0) {
                importedIds.push(salEntry.id);
              } else {
                skippedIds.push(salEntry.id);
              }
            }
          } catch {
            const rawId = typeof raw === 'object' && raw !== null && 'id' in raw
              ? String((raw as Record<string, unknown>).id)
              : '';
            if (rawId) skippedIds.push(rawId);
          }
        }

        return res.status(200).json({
          importedCount: importedIds.length,
          skippedCount: skippedIds.length,
          importedIds,
          skippedIds,
        });
      }

      // Single create
      if (!payload.entry) {
        return res.status(400).json({ error: 'Entry payload is required' });
      }

      const entry = normalizeEntry(payload.entry);

      if (entry.category === 'bill') {
        const billEntry = entry as Omit<BillDataEntry, 'createdAt' | 'updatedAt'>;
        // Duplicate monthly bill protection
        const existing = await db.query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM bills_entries
           WHERE user_id = $1 AND title = $2 AND year = $3 AND month = $4`,
          [userId, billEntry.title, billEntry.year, billEntry.month]
        );
        if (Number(existing.rows[0]?.count ?? 0) > 0) {
          return res.status(409).json({
            error: `A bill named "${billEntry.title}" already exists for ${billEntry.month}/${billEntry.year}.`,
          });
        }
        const created = await insertBillEntry(userId, billEntry);
        return res.status(201).json({ entry: created });
      }

      const salEntry = entry as Omit<SalaryDataEntry, 'createdAt' | 'updatedAt'>;
      const created = await insertSalaryEntry(userId, salEntry);
      return res.status(201).json({ entry: created });
    }

    // PUT
    if (req.method === 'PUT') {
      const payload = body as { id?: string; updates?: unknown };
      if (!payload.id || !payload.updates) {
        return res.status(400).json({ error: 'id and updates are required' });
      }

      const updatesRaw = payload.updates as Record<string, unknown>;

      if (updatesRaw.category === 'bill') {
        const existingResult = await db.query<BillEntryRow>(
          `SELECT entry_id, year, month, title, billing_frequency, repeat_all_year,
             amount::float8 AS amount, notes, created_at, updated_at
           FROM bills_entries WHERE user_id = $1 AND entry_id = $2 LIMIT 1`,
          [userId, payload.id]
        );
        if (!existingResult.rows[0]) return res.status(404).json({ error: 'Bill entry not found' });
        const existing = mapBillRow(existingResult.rows[0]);
        const merged = { ...existing, ...updatesRaw, id: payload.id };
        const e = normalizeEntry(merged) as Omit<BillDataEntry, 'createdAt' | 'updatedAt'>;
        const result = await db.query<BillEntryRow>(
          `UPDATE bills_entries
           SET year=$3, month=$4, title=$5, billing_frequency=$6,
               repeat_all_year=$7, amount=$8, notes=$9, updated_at=NOW()
           WHERE user_id=$1 AND entry_id=$2
           RETURNING entry_id, year, month, title, billing_frequency, repeat_all_year,
             amount::float8 AS amount, notes, created_at, updated_at`,
          [userId, payload.id, e.year, e.month, e.title, e.billingFrequency, e.repeatAllYear, e.amount, e.notes ?? '']
        );
        return res.status(200).json({ entry: mapBillRow(result.rows[0]) });
      }

      const existingResult = await db.query<SalaryEntryRow>(
        `SELECT entry_id, year, month, category,
           amount::float8 AS amount, salary_net::float8 AS salary_net,
           swile_payment::float8 AS swile_payment, transport_paid, worked,
           notes, created_at, updated_at
         FROM salary_entries WHERE user_id = $1 AND entry_id = $2 LIMIT 1`,
        [userId, payload.id]
      );
      if (!existingResult.rows[0]) return res.status(404).json({ error: 'Entry not found' });
      const existing = mapSalaryRow(existingResult.rows[0]);
      const merged = { ...existing, ...updatesRaw, id: payload.id };
      const e = normalizeEntry(merged) as Omit<SalaryDataEntry, 'createdAt' | 'updatedAt'>;
      const result = await db.query<SalaryEntryRow>(
        `UPDATE salary_entries
         SET year=$3, month=$4, category=$5, amount=$6,
             salary_net=$7, swile_payment=$8, transport_paid=$9, worked=$10, notes=$11, updated_at=NOW()
         WHERE user_id=$1 AND entry_id=$2
         RETURNING entry_id, year, month, category,
           amount::float8 AS amount, salary_net::float8 AS salary_net,
           swile_payment::float8 AS swile_payment, transport_paid, worked,
           notes, created_at, updated_at`,
        [
          userId, payload.id, e.year, e.month, e.category, e.amount,
          e.category === 'salary' ? (e.salaryNet ?? e.amount) : null,
          e.category === 'salary' ? (e.swilePayment ?? 0) : null,
          e.category === 'salary' ? (e.transportPaid ?? false) : null,
          e.category === 'salary' ? (e.worked ?? true) : null,
          e.notes ?? '',
        ]
      );
      return res.status(200).json({ entry: mapSalaryRow(result.rows[0]) });
    }

    // DELETE
    if (req.method === 'DELETE') {
      const payload = body as { id?: string; all?: boolean; category?: string };

      if (payload.all) {
        await Promise.all([
          db.query('DELETE FROM salary_entries WHERE user_id = $1', [userId]),
          db.query('DELETE FROM bills_entries WHERE user_id = $1', [userId]),
        ]);
        return res.status(200).json({ success: true, deletedAll: true });
      }

      if (!payload.id) return res.status(400).json({ error: 'id is required' });

      if (payload.category === 'bill') {
        await db.query('DELETE FROM bills_entries WHERE user_id = $1 AND entry_id = $2', [userId, payload.id]);
      } else if (payload.category) {
        await db.query('DELETE FROM salary_entries WHERE user_id = $1 AND entry_id = $2', [userId, payload.id]);
      } else {
        await Promise.all([
          db.query('DELETE FROM salary_entries WHERE user_id = $1 AND entry_id = $2', [userId, payload.id]),
          db.query('DELETE FROM bills_entries WHERE user_id = $1 AND entry_id = $2', [userId, payload.id]),
        ]);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Data API error', { message, stack: error instanceof Error ? error.stack : undefined });

    if (isPgMissingTableError(error)) {
      return res.status(500).json({
        error: 'Database schema is not initialized. Run database/schema.sql.',
        detail: message,
      });
    }

    if (isPgUniqueViolation(error)) {
      return res.status(409).json({ error: 'Duplicate entry', detail: message });
    }

    if (message.includes('Invalid') || message.includes('required') || message.includes('greater than')) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: 'Internal server error', detail: message });
  }
}

export default withAuth(dataHandler);
