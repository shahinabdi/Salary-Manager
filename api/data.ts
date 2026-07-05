import { db } from './_lib/db.js';
import { withAuth } from './_lib/withAuth.js';

type EntryCategory = 'salary' | 'bonus' | 'overtime' | 'benefits' | 'bill';
type BillingFrequency = 'monthly' | 'one-time';

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}

interface DataEntry {
  id: string;
  year: number;
  month: number;
  category: EntryCategory;
  amount: number;
  title?: string;
  billingFrequency?: BillingFrequency;
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
  title: string | null;
  billing_frequency: BillingFrequency | null;
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
      category TEXT NOT NULL CHECK (category IN ('salary', 'bonus', 'overtime', 'benefits', 'bill')),
      amount NUMERIC(12, 2) NOT NULL,
      title TEXT,
      billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'one-time')),
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

  await db.query(`
    ALTER TABLE salary_entries
      ADD COLUMN IF NOT EXISTS title TEXT;

    ALTER TABLE salary_entries
      ADD COLUMN IF NOT EXISTS billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'one-time'));
  `);

  salaryEntriesTableEnsured = true;
}

let billsEntriesTableEnsured = false;

async function ensureBillsEntriesTable() {
  if (billsEntriesTableEnsured) {
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS bills_entries (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id TEXT NOT NULL,
      year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      category TEXT NOT NULL DEFAULT 'bill' CHECK (category = 'bill'),
      amount NUMERIC(12, 2) NOT NULL,
      title TEXT NOT NULL,
      billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'one-time')),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, entry_id)
    );

    CREATE INDEX IF NOT EXISTS bills_entries_user_year_month_idx
      ON bills_entries (user_id, year, month);
  `);

  billsEntriesTableEnsured = true;
}

function parseBody(req: any): unknown {
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

function normalizeBillTitle(title: unknown) {
  return String(title ?? '').trim().toLowerCase();
}

async function hasDuplicateBillEntry(userId: number, year: number, month: number, title: string, excludeEntryId?: string) {
  const query = excludeEntryId
    ? `SELECT entry_id
      FROM bills_entries
      WHERE user_id = $1
        AND year = $2
        AND month = $3
        AND LOWER(TRIM(title)) = $4
        AND entry_id <> $5
      LIMIT 1`
    : `SELECT entry_id
      FROM bills_entries
      WHERE user_id = $1
        AND year = $2
        AND month = $3
        AND LOWER(TRIM(title)) = $4
      LIMIT 1`;

  const params = excludeEntryId ? [userId, year, month, title, excludeEntryId] : [userId, year, month, title];
  const duplicateResult = await db.query<{ entry_id: string }>(query, params);

  return duplicateResult.rowCount > 0;
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

  if (category === 'bill') {
    const title = String(raw.title ?? '').trim();
    const billingFrequency = raw.billingFrequency === 'monthly' ? 'monthly' : 'one-time';

    if (!title) {
      throw new Error('Bill name is required');
    }

    return {
      id,
      year,
      month,
      category,
      amount,
      title,
      billingFrequency,
      notes,
    };
  }

  return {
    id,
    year,
    month,
    category,
    amount,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : undefined,
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
    title: row.title ?? undefined,
    billingFrequency: row.billing_frequency ?? undefined,
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
  const salaryResult = await db.query<EntryRow>(
    `SELECT
      entry_id,
      year,
      month,
      category,
      amount::float8 AS amount,
      title,
      billing_frequency,
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

  const billResult = await db.query<EntryRow>(
    `SELECT
      entry_id,
      year,
      month,
      category,
      amount::float8 AS amount,
      title,
      billing_frequency,
      NULL::float8 AS salary_net,
      NULL::float8 AS swile_payment,
      NULL::boolean AS transport_paid,
      NULL::boolean AS worked,
      notes,
      created_at,
      updated_at
    FROM bills_entries
    WHERE user_id = $1
    ORDER BY year DESC, month DESC, created_at DESC`,
    [userId]
  );

  return [...salaryResult.rows.map(mapRowToEntry), ...billResult.rows.map(mapRowToEntry)]
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.month !== b.month) return b.month - a.month;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

async function dataHandler(req: any, res: VercelResponse) {
  try {
    const userId = req.auth.userId;

    await ensureSalaryEntriesTable();
    await ensureBillsEntriesTable();

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
          try {
            const result = await saveEntry(userId, entry);

            if (result.rowCount && result.rowCount > 0) {
              importedIds.push(entry.id);
            } else {
              skippedIds.push(entry.id);
            }
          } catch (entryError) {
            const message = entryError instanceof Error ? entryError.message : '';

            if (message.includes('already exists for this month')) {
              skippedIds.push(entry.id);
              continue;
            }

            throw entryError;
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
      const result = await saveEntry(userId, entry);

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
          title,
          billing_frequency,
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

      let entryTable: 'salary_entries' | 'bills_entries' | null = existingResult.rows[0] ? 'salary_entries' : null;
      let existing = existingResult.rows[0];

      if (!existing) {
        const billResult = await db.query<EntryRow>(
          `SELECT
            entry_id,
            year,
            month,
            category,
            amount::float8 AS amount,
            title,
            billing_frequency,
            NULL::float8 AS salary_net,
            NULL::float8 AS swile_payment,
            NULL::boolean AS transport_paid,
            NULL::boolean AS worked,
            notes,
            created_at,
            updated_at
          FROM bills_entries
          WHERE user_id = $1 AND entry_id = $2
          LIMIT 1`,
          [userId, payload.id]
        );

        existing = billResult.rows[0];
        entryTable = existing ? 'bills_entries' : null;
      }

      if (!existing) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      const merged = {
        ...mapRowToEntry(existing),
        ...(payload.updates as Record<string, unknown>),
        id: payload.id,
      };

      const entry = normalizeEntry(merged);
      if (entry.category === 'bill') {
        const duplicateBill = await hasDuplicateBillEntry(userId, entry.year, entry.month, normalizeBillTitle(entry.title), payload.id);

        if (duplicateBill) {
          return res.status(409).json({ error: 'A bill with this name already exists for this month' });
        }
      }
      const result = await updateEntryRow(userId, entryTable!, payload.id, entry);

      return res.status(200).json({ entry: mapRowToEntry(result.rows[0]) });
    }

    if (req.method === 'DELETE') {
      const payload = body as { id?: string; all?: boolean };

      if (payload.all) {
        await db.query('DELETE FROM salary_entries WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM bills_entries WHERE user_id = $1', [userId]);
        return res.status(200).json({ success: true, deletedAll: true });
      }

      if (!payload.id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const deletedSalary = await db.query('DELETE FROM salary_entries WHERE user_id = $1 AND entry_id = $2', [userId, payload.id]);
      if (deletedSalary.rowCount && deletedSalary.rowCount > 0) {
        return res.status(200).json({ success: true });
      }

      await db.query('DELETE FROM bills_entries WHERE user_id = $1 AND entry_id = $2', [userId, payload.id]);
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

async function saveEntry(userId: number, entry: Omit<DataEntry, 'createdAt' | 'updatedAt'>) {
  if (entry.category === 'bill') {
    const duplicateBill = await hasDuplicateBillEntry(userId, entry.year, entry.month, normalizeBillTitle(entry.title));
    if (duplicateBill) {
      throw new Error('A bill with this name already exists for this month');
    }

    return db.query<EntryRow>(
      `INSERT INTO bills_entries (
        user_id,
        entry_id,
        year,
        month,
        category,
        amount,
        title,
        billing_frequency,
        notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (user_id, entry_id) DO NOTHING
      RETURNING
        entry_id,
        year,
        month,
        category,
        amount::float8 AS amount,
        title,
        billing_frequency,
        NULL::float8 AS salary_net,
        NULL::float8 AS swile_payment,
        NULL::boolean AS transport_paid,
        NULL::boolean AS worked,
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
        entry.title ?? '',
        entry.billingFrequency ?? 'one-time',
        entry.notes ?? '',
      ]
    );
  }

  return db.query<EntryRow>(
    `INSERT INTO salary_entries (
      user_id,
      entry_id,
      year,
      month,
      category,
      amount,
      title,
      billing_frequency,
      salary_net,
      swile_payment,
      transport_paid,
      worked,
      notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (user_id, entry_id) DO NOTHING
    RETURNING
      entry_id,
      year,
      month,
      category,
      amount::float8 AS amount,
      title,
      billing_frequency,
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
      null,
      null,
      entry.category === 'salary' ? entry.salaryNet ?? entry.amount : null,
      entry.category === 'salary' ? entry.swilePayment ?? 0 : null,
      entry.category === 'salary' ? entry.transportPaid ?? false : null,
      entry.category === 'salary' ? entry.worked ?? true : null,
      entry.notes ?? '',
    ]
  );
}

async function updateEntryRow(userId: number, table: 'salary_entries' | 'bills_entries', entryId: string, entry: Omit<DataEntry, 'createdAt' | 'updatedAt'>) {
  if (table === 'bills_entries') {
    return db.query<EntryRow>(
      `UPDATE bills_entries
      SET
        year = $3,
        month = $4,
        amount = $5,
        title = $6,
        billing_frequency = $7,
        notes = $8,
        updated_at = NOW()
      WHERE user_id = $1 AND entry_id = $2
      RETURNING
        entry_id,
        year,
        month,
        category,
        amount::float8 AS amount,
        title,
        billing_frequency,
        NULL::float8 AS salary_net,
        NULL::float8 AS swile_payment,
        NULL::boolean AS transport_paid,
        NULL::boolean AS worked,
        notes,
        created_at,
        updated_at`,
      [userId, entryId, entry.year, entry.month, entry.amount, entry.title ?? '', entry.billingFrequency ?? 'one-time', entry.notes ?? '']
    );
  }

  return db.query<EntryRow>(
    `UPDATE salary_entries
    SET
      year = $3,
      month = $4,
      category = $5,
      amount = $6,
      title = $7,
      billing_frequency = $8,
      salary_net = $9,
      swile_payment = $10,
      transport_paid = $11,
      worked = $12,
      notes = $13,
      updated_at = NOW()
    WHERE user_id = $1 AND entry_id = $2
    RETURNING
      entry_id,
      year,
      month,
      category,
      amount::float8 AS amount,
      title,
      billing_frequency,
      salary_net::float8 AS salary_net,
      swile_payment::float8 AS swile_payment,
      transport_paid,
      worked,
      notes,
      created_at,
      updated_at`,
    [
      userId,
      entryId,
      entry.year,
      entry.month,
      entry.category,
      entry.amount,
      null,
      null,
      entry.salaryNet ?? entry.amount,
      entry.swilePayment ?? 0,
      entry.transportPaid ?? false,
      entry.worked ?? true,
      entry.notes ?? '',
    ]
  );
}

export default withAuth(dataHandler as any);
