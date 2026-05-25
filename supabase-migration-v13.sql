-- ── Migration v13: content_favorites ─────────────────────────────────────────
-- Run this in the Supabase SQL Editor AFTER supabase-migration-v12.sql.
--
-- Creates the content_favorites table, which stores Library and Cinema items
-- that members have "hearted" — used to populate My Library and My Cinema
-- on the collective hub page.

CREATE TABLE IF NOT EXISTS content_favorites (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  section    text        NOT NULL CHECK (section IN ('library', 'cinema')),
  item_slug  text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, section, item_slug)
);

ALTER TABLE content_favorites ENABLE ROW LEVEL SECURITY;

-- Anyone can SELECT (public counts are visible without logging in)
CREATE POLICY "content_favorites_select_public"
  ON content_favorites FOR SELECT
  USING (true);

-- Authenticated users can insert their own rows only
CREATE POLICY "content_favorites_insert_own"
  ON content_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own rows only
CREATE POLICY "content_favorites_delete_own"
  ON content_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast per-user lookups on the hub page
CREATE INDEX IF NOT EXISTS idx_content_favorites_user
  ON content_favorites(user_id);

-- Index for per-item count queries
CREATE INDEX IF NOT EXISTS idx_content_favorites_section_slug
  ON content_favorites(section, item_slug);
