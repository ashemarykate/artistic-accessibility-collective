-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v28 · item_reactions + item_ratings (the "like" system)
-- Run in Supabase SQL Editor after v27.
--
-- Same root cause as v27's item_comments fix: the ItemReactions component is
-- already live on both library and cinema item pages (thumbs up/down + heart
-- on library items; 1-5 star ratings + heart on cinema items), but its two
-- backing tables, item_reactions and item_ratings, were never actually
-- created in the live database. This has made every "like"/react/rate button
-- on those pages silently fail since they shipped.
--
-- Written the same safe way as v27: IF NOT EXISTS / IF EXISTS everywhere, so
-- it's safe to run regardless of what's already in your database.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── item_reactions — thumbs_up / thumbs_down / heart per user per item ────────

CREATE TABLE IF NOT EXISTS item_reactions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_slug    TEXT        NOT NULL,
  item_type    TEXT        NOT NULL,
  reaction     TEXT        NOT NULL CHECK (reaction IN ('thumbs_up', 'thumbs_down', 'heart')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_slug, item_type, reaction)
);

ALTER TABLE item_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "item_reactions_select_all" ON item_reactions;
CREATE POLICY "item_reactions_select_all"
  ON item_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "item_reactions_insert_own" ON item_reactions;
CREATE POLICY "item_reactions_insert_own"
  ON item_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "item_reactions_delete_own" ON item_reactions;
CREATE POLICY "item_reactions_delete_own"
  ON item_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE item_reactions
  DROP CONSTRAINT IF EXISTS item_reactions_item_type_check;
ALTER TABLE item_reactions
  ADD CONSTRAINT item_reactions_item_type_check
    CHECK (item_type IN ('library', 'cinema'));

CREATE INDEX IF NOT EXISTS idx_item_reactions_slug_type
  ON item_reactions (item_slug, item_type);

CREATE INDEX IF NOT EXISTS idx_item_reactions_user
  ON item_reactions (user_id);

CREATE INDEX IF NOT EXISTS idx_item_reactions_user_heart
  ON item_reactions (user_id, reaction)
  WHERE reaction = 'heart';


-- ── item_ratings — 1-5 star ratings (cinema only right now) ───────────────────

CREATE TABLE IF NOT EXISTS item_ratings (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_slug   TEXT        NOT NULL,
  item_type   TEXT        NOT NULL CHECK (item_type IN ('library', 'cinema')),
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_slug, item_type)
);

ALTER TABLE item_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read item ratings" ON item_ratings;
CREATE POLICY "Public can read item ratings"
  ON item_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own ratings" ON item_ratings;
CREATE POLICY "Users can insert own ratings"
  ON item_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON item_ratings;
CREATE POLICY "Users can update own ratings"
  ON item_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own ratings" ON item_ratings;
CREATE POLICY "Users can delete own ratings"
  ON item_ratings FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS item_ratings_slug_type_idx ON item_ratings (item_slug, item_type);
CREATE INDEX IF NOT EXISTS item_ratings_user_idx       ON item_ratings (user_id);
