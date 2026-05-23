-- Migration v4: Vanity usernames for profile URLs
-- Run in Supabase SQL Editor after v1, v2, v3 migrations.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Enforce URL-safe format: 3–30 chars, lowercase letters/numbers/hyphens/underscores,
-- must start with a letter or number (not a symbol).
ALTER TABLE profiles
  ADD CONSTRAINT username_format CHECK (
    username IS NULL
    OR username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'
  );

-- Case-insensitive uniqueness index (prevents "MaryKate" and "marykate" both existing)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON profiles (lower(username))
  WHERE username IS NOT NULL;
