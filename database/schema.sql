-- Run this in Neon Postgres / Supabase SQL editor.
-- You will insert users manually; no public registration endpoint is required.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (LOWER(email));

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

-- Example manual insert:
-- 1) Generate bcrypt hash locally:
--    node -e "const b=require('bcryptjs'); b.hash('YourStrongPassword123!', 12).then(console.log)"
-- 2) Insert user with generated hash:
--    INSERT INTO users (email, password_hash, name)
--    VALUES ('admin@example.com', '$2b$12$....', 'Admin');
