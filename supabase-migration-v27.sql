-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v27 · Image Description as Art submissions
-- Run in Supabase SQL Editor after v26.
--
-- IMPORTANT — while wiring up real submissions for the Image Description as
-- Art page, testing turned up something unrelated to this feature: the
-- item_comments table (used for comments on library/cinema/resources/events
-- pages too) does not exist in the live database yet, even though the app
-- code has expected it since migration v10. That means comments have been
-- silently broken everywhere on the live site until now, not just here.
--
-- This migration is written to be safe to run no matter what state your
-- database is actually in — it uses IF NOT EXISTS / IF EXISTS everywhere, so
-- re-running it (or running it for the first time) won't error or duplicate
-- anything. It brings item_comments fully up to date (original table + the
-- v18 is_acc column) and then adds the new 'image-description' item type.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS item_comments (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT        NOT NULL DEFAULT '',
  item_slug    TEXT        NOT NULL,
  item_type    TEXT        NOT NULL,
  body         TEXT        NOT NULL CHECK (char_length(TRIM(body)) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "item_comments_select_all" ON item_comments;
CREATE POLICY "item_comments_select_all"
  ON item_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "item_comments_insert_own" ON item_comments;
CREATE POLICY "item_comments_insert_own"
  ON item_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "item_comments_delete_own" ON item_comments;
CREATE POLICY "item_comments_delete_own"
  ON item_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_item_comments_slug_type
  ON item_comments (item_slug, item_type, created_at DESC);

-- v18's is_acc badge column
ALTER TABLE item_comments
  ADD COLUMN IF NOT EXISTS is_acc boolean NOT NULL DEFAULT false;

-- Widen item_type to also cover the Image Description as Art page
ALTER TABLE item_comments
  DROP CONSTRAINT IF EXISTS item_comments_item_type_check;

ALTER TABLE item_comments
  ADD CONSTRAINT item_comments_item_type_check
    CHECK (item_type IN ('library', 'cinema', 'resource', 'event', 'image-description'));


-- ============================================================
-- RELATED, BUT NOT FIXED BY THIS MIGRATION
-- ============================================================
-- item_reactions (the heart/favorite/thumbs-up table used alongside comments
-- on library and cinema pages) is ALSO missing from the live database for the
-- same reason. It's left alone here since it's outside the scope of this
-- feature, but it means the heart/favorite buttons on library and cinema
-- items are silently non-functional too. If you'd like that fixed, the
-- original definition is in supabase-migration-v10.sql.
