-- ============================================================
-- Migration v12: Resource content management
-- Run AFTER v11.
--
-- 1. Adds section column to resource_submissions so Library
--    and Cinema suggestions are tagged by where they came from.
--
-- 2. Adds content-management columns to the resources table
--    so Library, Cinema, and Accessibility Resources items can
--    be created and edited via the admin portal.
-- ============================================================


-- ── 1. resource_submissions: add section + make url nullable ─────────────────

ALTER TABLE resource_submissions
  ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'accessibility';
  -- 'library' | 'cinema' | 'accessibility' | 'general'

-- resource_url was NOT NULL in v8 — make it nullable so Library
-- suggestions (which may not have a URL) can be saved.
ALTER TABLE resource_submissions
  ALTER COLUMN resource_url DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resource_submissions_section
  ON resource_submissions(section);


-- ── 2. resources table: new content management columns ──────────────────────

-- Which page/section this resource belongs to
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS section       TEXT;
  -- 'library' | 'cinema' | 'accessibility'

-- URL slug for detail pages (/library/[slug], /cinema/[slug])
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS slug          TEXT;

-- Shared fields
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS author        TEXT;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS year          INTEGER;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS url           TEXT;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS item_type     TEXT;
  -- Library:  book | essay | article | journal | zine | workbook |
  --           anthology | standard | blog | toolkit
  -- Cinema:   documentary | film | short-film | podcast | series |
  --           talk | video-essay | performance-recording
  -- Access:   standard | tool | guide | org | media | course
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS is_free       BOOLEAN DEFAULT false;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS how_to_access TEXT;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS is_essential  BOOLEAN DEFAULT false;

-- Library-specific
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS format_list   TEXT[];
  -- e.g. '{PDF,Web,Audiobook}'

-- Cinema-specific
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS director      TEXT;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS creator       TEXT;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS platform_list TEXT[];
  -- e.g. '{Netflix,YouTube}'
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS has_ad        BOOLEAN DEFAULT false;
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS has_captions  BOOLEAN DEFAULT false;
  -- duration_minutes already exists from the v1 migration

-- Accessibility Resources-specific
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS location_note TEXT;
  -- e.g. 'United States' (jurisdiction-specific badge)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_section
  ON resources(section);
CREATE INDEX IF NOT EXISTS idx_resources_slug
  ON resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_section_status
  ON resources(section, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_section_slug
  ON resources(section, slug)
  WHERE slug IS NOT NULL;


-- ── Notes ────────────────────────────────────────────────────────────────────
--
-- After running this migration:
--
-- • Library / Cinema suggestion forms now save to resource_submissions
--   with section='library' or section='cinema'. Check the admin portal
--   Suggestions tab to review them.
--
-- • To add new content to Library, Cinema, or Accessibility Resources:
--   go to /admin → Content tab → choose a section → click Add New Item.
--
-- • Items you add via admin appear alongside the existing hardcoded
--   content on the pages. If you add a DB item with the same slug as
--   a hardcoded item, the DB version takes precedence — this is how
--   you edit existing items without changing code.
--
-- • status = 'approved'  → visible on the page
--   status = 'pending'   → invisible to public, visible in admin
--   status = 'rejected'  → hidden everywhere (use to remove hardcoded items)
--
