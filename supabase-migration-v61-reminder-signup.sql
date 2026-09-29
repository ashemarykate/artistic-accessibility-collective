-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v61 (reminder signup) · A link for the people watching from home
-- Run in the Supabase SQL Editor. Safe to run more than once.
--
-- NUMBERING NOTE: this filename carries its subject because two sessions have
-- worked in this folder and collided at v58, v59 and v60. See
-- SITE-PASS-2026-09.md.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- The Show: Live already has one button, `reserve_url`, and it is for the
-- studio: a free seat in the room, limited, physical. Most of the audience is
-- not in the room. The show is online, and until now there was nowhere for
-- somebody watching from home to say "send me the link when it starts".
--
-- So a second link, kept separate rather than folded into the first, because
-- they are two different asks with two different answers. Reserving a seat is
-- about a room that fills up. Asking for the link is about not missing it.
-- One form each, and one button each, so nobody has to read carefully to work
-- out which one applies to them.
--
-- Both are edited from Backstage like every other switch, so a link can change
-- on a Tuesday without anybody touching code.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE production_microsite
  ADD COLUMN IF NOT EXISTS remind_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN production_microsite.remind_url IS
  'Where somebody watching from home signs up for an email reminder and the
   link to the stream. Asks which performance. Separate from reserve_url,
   which is a physical seat in the studio. Empty hides the button.';

UPDATE production_microsite pm
   SET remind_url = 'https://forms.gle/Cb12QmGo6S6LdxzH9'
  FROM productions p
 WHERE p.id = pm.production_id
   AND p.slug = '2006'
   AND pm.remind_url = '';

-- ── Check it worked ──────────────────────────────────────────────────────────
--   select pm.reserve_url, pm.remind_url
--     from production_microsite pm
--     join productions p on p.id = pm.production_id
--    where p.slug = '2006';
