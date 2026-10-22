CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  key TEXT NOT NULL,
  tempo INTEGER NOT NULL CHECK (tempo BETWEEN 30 AND 300),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  genre TEXT NOT NULL,
  chart TEXT NOT NULL,
  license_info TEXT NOT NULL,
  chord_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  downloadable BOOLEAN NOT NULL DEFAULT FALSE,
  sections JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified_at TIMESTAMPTZ,
  verification_code_hash TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_code_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_code_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  completed_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  learned_chords JSONB NOT NULL DEFAULT '[]'::jsonb,
  practiced_songs JSONB NOT NULL DEFAULT '[]'::jsonb,
  practice_time_minutes INTEGER NOT NULL DEFAULT 0 CHECK (practice_time_minutes >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  last_practice_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS songs_search_idx
  ON songs USING GIN (to_tsvector('simple', title || ' ' || artist || ' ' || genre));
CREATE INDEX IF NOT EXISTS songs_difficulty_idx ON songs (difficulty);
CREATE INDEX IF NOT EXISTS songs_updated_at_idx ON songs (updated_at DESC);
