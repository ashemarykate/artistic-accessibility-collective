-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v59 · Somewhere to keep photo descriptions
-- Run in the Supabase SQL Editor after v58. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Profile gallery photos were stored as a bare list of URLs, so there was
-- nowhere to put a description even if somebody wrote one. The page invented
-- "Gallery photo 2 for Jane" instead, which tells a screen reader user the
-- position of a photo and nothing about it.
--
-- From September 2026 every gallery photo needs a real description before it
-- can be added. This column is where those descriptions live.
--
-- It is index-aligned with `gallery_photos`: the description for
-- gallery_photos[3] is gallery_photo_alts[3]. Both arrays are only ever written
-- together, by components/GalleryUploader.tsx, which is what keeps them lined
-- up. Photos added before this migration have no description yet; they can be
-- described from Edit Profile, and until they are, the profile page falls back
-- to the old generated text.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gallery_photo_alts TEXT[] DEFAULT '{}';

COMMENT ON COLUMN profiles.gallery_photo_alts IS
  'Alt text for gallery_photos, index-aligned. Written only alongside gallery_photos. Required for photos added after 2026-09.';
