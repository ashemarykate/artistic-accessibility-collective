-- ============================================================
-- Migration v10 — Community Library & Cinema interactions
-- Run AFTER supabase-migration-v9.sql (or v9-fix.sql)
--
-- Adds:
--   item_reactions  — thumbs_up, thumbs_down, heart per user per item
--   item_comments   — free-text comments per user per item
--
-- "heart" reactions save an item to a member's profile
-- so they can find it again. Used by /members (Saved Items tab).
-- ============================================================


-- ── item_reactions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS item_reactions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_slug    TEXT        NOT NULL,
  item_type    TEXT        NOT NULL CHECK (item_type IN ('library', 'cinema')),
  reaction     TEXT        NOT NULL CHECK (reaction IN ('thumbs_up', 'thumbs_down', 'heart')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_slug, item_type, reaction)
);

ALTER TABLE item_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_reactions_select_all"
  ON item_reactions FOR SELECT
  USING (true);

CREATE POLICY "item_reactions_insert_own"
  ON item_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "item_reactions_delete_own"
  ON item_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ── item_comments ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS item_comments (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT        NOT NULL DEFAULT '',
  item_slug    TEXT        NOT NULL,
  item_type    TEXT        NOT NULL CHECK (item_type IN ('library', 'cinema')),
  body         TEXT        NOT NULL CHECK (char_length(TRIM(body)) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_comments_select_all"
  ON item_comments FOR SELECT
  USING (true);

CREATE POLICY "item_comments_insert_own"
  ON item_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "item_comments_delete_own"
  ON item_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ── Indexes ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_item_reactions_slug_type
  ON item_reactions (item_slug, item_type);

CREATE INDEX IF NOT EXISTS idx_item_reactions_user
  ON item_reactions (user_id);

CREATE INDEX IF NOT EXISTS idx_item_reactions_user_heart
  ON item_reactions (user_id, reaction)
  WHERE reaction = 'heart';

CREATE INDEX IF NOT EXISTS idx_item_comments_slug_type
  ON item_comments (item_slug, item_type, created_at DESC);
