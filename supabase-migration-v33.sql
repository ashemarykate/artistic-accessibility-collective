-- ============================================================
-- Migration v33: fix a silently broken suggestion form + add
-- The Printer's own suggestion form
-- Run AFTER v32.
--
-- 1. The Library suggestion form (app/library/page.tsx) has been
--    inserting a `submitter_notes` value into resource_submissions
--    since it was built, but that column was never actually created
--    in any migration. Every Library suggestion has been silently
--    failing with a "column not found" error — visitors saw a
--    generic error message and nothing was ever saved. This adds
--    the missing column so the form actually works.
--
-- 2. Adds 'printer' as a valid `section` value (already a free-text
--    column, just documenting it here) for the new Printer
--    suggestion form.
-- ============================================================

ALTER TABLE resource_submissions
  ADD COLUMN IF NOT EXISTS submitter_notes TEXT;
  -- Library uses this for "author / creator"; free-text elsewhere.

-- section now also takes 'printer' in addition to
-- 'library' | 'cinema' | 'accessibility' | 'general'
