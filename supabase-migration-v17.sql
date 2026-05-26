-- ============================================================
-- Migration v17: Access Card member tier
-- Run this in the Supabase SQL Editor after v16 is applied.
-- ============================================================

-- 1. Add member_type to profiles
--    'collective' = existing full members (default, backwards-compatible)
--    'access_card' = public open-signup tier
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS member_type text NOT NULL DEFAULT 'collective'
    CHECK (member_type IN ('collective', 'access_card'));

-- Backfill all existing rows as 'collective'
UPDATE profiles SET member_type = 'collective' WHERE member_type IS NULL;

-- 2. saved_resources table
--    Bookmarked resources for Access Card and Collective members.
CREATE TABLE IF NOT EXISTS saved_resources (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_title text        NOT NULL,
  resource_url   text        NOT NULL,
  resource_type  text,       -- 'article', 'video', 'tool', 'event', etc. (optional)
  saved_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_url)
);

ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved resources
CREATE POLICY "saved_resources: select own"
  ON saved_resources FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save resources
CREATE POLICY "saved_resources: insert own"
  ON saved_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave (delete) their own resources
CREATE POLICY "saved_resources: delete own"
  ON saved_resources FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can read all saved resources (for analytics)
CREATE POLICY "saved_resources: admin read all"
  ON saved_resources FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
