-- Migration v5: Fun profile fields + member since display
-- Run in Supabase SQL Editor after v1–v4.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS member_since_display  TEXT    DEFAULT 'Summer 2026',
  ADD COLUMN IF NOT EXISTS fav_books             TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fav_movies            TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fav_music             TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fav_tv                TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mood                  TEXT,
  ADD COLUMN IF NOT EXISTS community_interests   TEXT[]  DEFAULT '{}';

-- Back-fill all existing approved profiles with the founding season.
UPDATE profiles
SET member_since_display = 'Summer 2026'
WHERE member_since_display IS NULL;
