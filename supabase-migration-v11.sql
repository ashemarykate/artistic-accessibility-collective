-- ──────────────────────────────────────────────────────────────────────────────
-- Migration v11: item_ratings — 1–5 star ratings for cinema and library items
-- Run after v10 (item_reactions, item_comments)
-- ──────────────────────────────────────────────────────────────────────────────

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

-- Anyone can read ratings (for displaying averages publicly)
CREATE POLICY "Public can read item ratings"
  ON item_ratings FOR SELECT
  USING (true);

-- Authenticated users can insert their own rating
CREATE POLICY "Users can insert own ratings"
  ON item_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own rating
CREATE POLICY "Users can update own ratings"
  ON item_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own rating
CREATE POLICY "Users can delete own ratings"
  ON item_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS item_ratings_slug_type_idx ON item_ratings (item_slug, item_type);
CREATE INDEX IF NOT EXISTS item_ratings_user_idx       ON item_ratings (user_id);
