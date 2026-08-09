-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v44 · Let each production choose its own desktop icon
-- Run in Supabase SQL Editor after v43.
--
-- One column, no policy changes, no data moved. Safe to re-run.
--
-- Why: "Current Projects & Events" on the home page is now a pink folder that
-- opens like a real folder, with one icon per project inside it. Which icon a
-- project wears is an editorial choice (a workshop about photography might
-- want the camera, not the generic notepad), so it belongs to the person
-- writing the production rather than to a rule in the code.
--
-- Leaving this NULL is completely fine and is the normal case: the folder falls
-- back to a sensible icon chosen from the production's kind, so a project added
-- without touching the picker still looks right.
--
-- The value is a key from PROJECT_ICONS in lib/project-icons.ts, not a URL or a
-- file path. Keeping it a key means the icon set can be renamed, resized or
-- re-drawn without rewriting rows, and an unknown key degrades to the same
-- by-kind fallback instead of a broken image.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE productions
  ADD COLUMN IF NOT EXISTS desktop_icon TEXT;

COMMENT ON COLUMN productions.desktop_icon IS
  'Which icon this project shows as in the home page Projects folder. A key
   from PROJECT_ICONS in lib/project-icons.ts (for example "cal" or "50"), NOT
   a URL. NULL means "pick one for me from the kind", which is the default and
   is fine to leave alone. An unrecognised key falls back the same way.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Nothing else to do: the existing productions policies already cover
-- this column, since they grant access per row rather than per column.
-- ─────────────────────────────────────────────────────────────────────────────
