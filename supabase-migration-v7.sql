-- Migration v7: Resource favorites
-- Run in Supabase SQL Editor after v1–v6.

CREATE TABLE IF NOT EXISTS resource_favorites (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_slug TEXT        NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, resource_slug)
);

ALTER TABLE resource_favorites ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can read favorite counts
CREATE POLICY "Anyone can read resource favorites"
  ON resource_favorites FOR SELECT
  USING (true);

-- Logged-in users can add their own favorites
CREATE POLICY "Users can insert their own favorites"
  ON resource_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Logged-in users can remove their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON resource_favorites FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE resource_favorites IS
  'One row per user per favorited resource. resource_slug is the resource URL (unique per resource). Used to show popularity counts on the public resources directory.';
