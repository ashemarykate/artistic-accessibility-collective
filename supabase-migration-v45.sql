-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v45 · Point a production at its interactive version
-- Run in Supabase SQL Editor. Needs the productions table (v38); order against
-- v40 to v44 does not matter. One nullable column, safe to re-run.
--
-- Why: a project is getting two front doors on purpose, for two kinds of
-- visitor.
--
--   The plain door   /projects and /projects/<slug>. Dates, venue, tickets,
--                    access, presenters, laid out to be read fast or
--                    screenshotted. Also the archive of past events.
--
--   The playful door the production's own microsite: a self contained
--                    interactive page with its own look, like /2006. A web toy
--                    that happens to carry the information.
--
-- The pink Projects folder on the home page sends people through the playful
-- door, and the overview page links across to it for anyone who arrived by the
-- plain one. Neither is a lesser version of the other.
--
-- This column is what connects the two. It has to be stored rather than
-- derived, because a microsite is not a route: /2006 is a hand made static page
-- in public/2006 plus a rewrite in next.config.ts. There is no rule that turns
-- a slug into a microsite address, and there should not be, since each show
-- gets to decide what its own site is called.
--
-- NULL is the normal case and nothing breaks: with no interactive version, the
-- folder icon opens the plain page instead and no cross-link is rendered.
--
-- Accepts a site-relative path ('/2006') or a full address
-- ('https://example.com/show'). The app refuses anything else at render time
-- rather than trusting the column, so a javascript: URL typed in here can
-- never reach a page.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE productions
  ADD COLUMN IF NOT EXISTS microsite_url TEXT;

COMMENT ON COLUMN productions.microsite_url IS
  'Where this production''s interactive microsite lives. A site-relative path
   like "/2006", or a full https:// address. NULL means there is no interactive
   version, in which case the home page Projects folder opens the plain
   /projects/<slug> page instead. Validated at render time (see
   micrositeHref in lib/productions.ts), so an unsafe value is dropped rather
   than trusted.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. The existing productions policies already cover this column: they grant
-- access per row, not per column, so a published production exposes it to anon
-- exactly as it does the title.
-- ─────────────────────────────────────────────────────────────────────────────
