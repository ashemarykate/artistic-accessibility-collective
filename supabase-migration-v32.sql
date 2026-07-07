-- ============================================================
-- Migration v32: Back of House notes board
-- Run AFTER v31.
--
-- Creates the back_of_house_notes table: a private corkboard on the
-- admin dashboard where admins leave each other sticky notes and
-- stickers. Admin-only in every direction. Members and the public
-- can never read or write these.
-- ============================================================

CREATE TABLE IF NOT EXISTS back_of_house_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name    TEXT,                          -- display name snapshot so notes survive account changes
  body           TEXT NOT NULL DEFAULT '',
  color          TEXT NOT NULL DEFAULT 'yellow', -- 'yellow' | 'pink' | 'blue' | 'green'
  stickers       TEXT[] NOT NULL DEFAULT '{}',   -- emoji stickers stuck on the note
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boh_notes_created
  ON back_of_house_notes(created_at DESC);

ALTER TABLE back_of_house_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can see the board
CREATE POLICY "Admins can read back of house notes"
  ON back_of_house_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Only admins can pin a note, and only as themselves
CREATE POLICY "Admins can add back of house notes"
  ON back_of_house_notes FOR INSERT
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Admins can add stickers to any note on the board
CREATE POLICY "Admins can update back of house notes"
  ON back_of_house_notes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Any admin can take a note down (shared board, shared cleanup)
CREATE POLICY "Admins can remove back of house notes"
  ON back_of_house_notes FOR DELETE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
