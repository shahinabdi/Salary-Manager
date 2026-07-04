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

-- Example manual insert:
-- 1) Generate bcrypt hash locally:
--    node -e "const b=require('bcryptjs'); b.hash('YourStrongPassword123!', 12).then(console.log)"
-- 2) Insert user with generated hash:
--    INSERT INTO users (email, password_hash, name)
--    VALUES ('admin@example.com', '$2b$12$....', 'Admin');
