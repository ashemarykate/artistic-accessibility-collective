-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v49 · Put 2006 on the public site
-- Run in Supabase SQL Editor after v48.
--
-- Three small changes, but the first one is the one to read twice.
--
-- 1. status draft -> published. This is what makes the show visible to people
--    who are not signed in. Until now every public policy written since v40
--    has been checking for exactly this, so a lot switches on at once:
--
--      the show appears in the Projects folder and on /projects
--      the company credits become readable by anybody
--      published posts and visible playlists go live
--
--    Nothing that is a draft leaks: unpublished posts, hidden playlists and
--    unapproved graveyard entries all stay private, because those have their
--    own flags. But everything already ticked as ready is public the moment
--    this runs.
--
--    To take it back down: set status back to 'draft'. Nothing is lost.
--
-- 2. The Projects folder icon becomes the pixel CD.
-- 3. The title becomes "2006 The Show: Online".
--    NOTE this is the production's title everywhere, not only in the folder:
--    the /projects listing and the show's own page use the same field. If you
--    wanted the longer name only in the folder, say so and it becomes a
--    separate column instead.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE productions
SET status        = 'published',
    title         = '2006 The Show: Online',
    desktop_icon  = '2006cd',
    microsite_url = COALESCE(microsite_url, '/2006')
WHERE slug = '2006';


-- ── Check ─────────────────────────────────────────────────────────────────────
-- Expect one row: published, the new title, 2006cd, /2006.

SELECT slug, status, title, desktop_icon, microsite_url
FROM productions
WHERE slug = '2006';
