-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v59 · The 2006 site gets one story: the show, the countdown, the vote
-- Run in Supabase SQL Editor after v58.
--
-- What this does, in order:
--   1. The countdown becomes cast-editable. production_videos grows a year and
--      an "ours" flag, and is seeded with the twelve videos the page has been
--      carrying in a hardcoded array. From here on the page reads the table.
--   2. Real votes get a device tag for the cooldown, and a view that computes
--      the live standings the way TRL did: each screen name's most recent vote
--      counts, everything older is forgotten.
--   3. The audience can write a blog entry. production_posts learns the
--      difference between a cast post and an audience one.
--   4. The three October shows go into production_dates, and the microsite row
--      gets the two links the front door needs.
--
-- Nothing here opens voting. That is the voting_open switch, which the cast
-- flips the day before the first show and off again the day after the last.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. The countdown, cast-editable ──────────────────────────────────────────

ALTER TABLE production_videos
  ADD COLUMN IF NOT EXISTS year  TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ours  BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN production_videos.ours IS
  'Our own version: a homemade video, or the last-minute swap. Leave it off
   until the night. The page shows a small "our version" tag when it is on,
   and until then the row looks exactly like the original it replaces.';

-- The id is the slot. A practice or real vote is stored against the id, never
-- against the youtube id or the title, so pointing a row at our own version
-- of Fergalicious and renaming it keeps every vote it had.
INSERT INTO production_videos
  (production_id, title, artist, year, youtube_id, approved, is_inspo, sort_order, submitted_by)
SELECT p.id, v.title, v.artist, v.year, v.yt, true, false, v.ord, NULL
FROM productions p,
  (VALUES
    ('Fergalicious',                     'Fergie',                                  '2006', '5T0utQ-XWGY',  1),
    ('Here It Goes Again',               'OK Go',                                   '2006', 'dTAAsCNK7RA',  2),
    ('I Write Sins Not Tragedies',       'Panic! At The Disco',                     '2006', 'vc6vs-l5dkc',  3),
    ('You''re Beautiful',                'James Blunt',                             '2005', 'oofSnsGkops',  4),
    ('Bad Day',                          'Daniel Powter',                           '2006', 'gH476CxJxfg',  5),
    ('Ms. New Booty',                    'Bubba Sparxxx ft. Ying Yang Twins',       '2006', 'znUS2KqPYCw',  6),
    ('Over My Head (Cable Car)',         'The Fray',                                '2006', 'fFRkpvvop3I',  7),
    ('Black Horse And The Cherry Tree',  'KT Tunstall',                             '2005', 'PQmDUEv939A',  8),
    ('Cupid''s Chokehold',               'Gym Class Heroes ft. Patrick Stump',      '2006', 'eiiU-Fky18s',  9),
    ('Hate Me',                          'Blue October',                            '2006', 'dDxgSvJINlU', 10),
    ('Here In Your Arms',                'hellogoodbye',                            '2006', '6-KQ1tp_qOQ', 11),
    ('D*** in a Box',                    'The Lonely Island ft. Justin Timberlake', '2006', 'Rt0spqQtMKg', 12)
  ) AS v(title, artist, year, yt, ord)
WHERE p.slug = '2006'
  AND NOT EXISTS (
    SELECT 1 FROM production_videos x WHERE x.production_id = p.id AND x.approved
  );


-- ── 2. Real votes, and the standings ─────────────────────────────────────────

ALTER TABLE production_votes
  ADD COLUMN IF NOT EXISTS device_tag TEXT;

CREATE INDEX IF NOT EXISTS production_votes_device_idx
  ON production_votes (device_tag, created_at DESC);

-- The audience holds no INSERT here any more. v40 let anon insert directly,
-- which made sense before the anon key was printed in a public page. Votes now
-- go through /api/2006/vote with the service role, where they can be counted
-- and cooled down like everything else on the site.
DROP POLICY IF EXISTS "Anyone may vote" ON production_votes;

-- The live standings. Each screen name's most recent vote is the one that
-- counts, so changing your mind is one press and stuffing needs many names,
-- which is visible in the data. Only approved, votable rows appear, and a video
-- with no votes still appears with a zero so the page can draw the whole list.
CREATE OR REPLACE VIEW production_countdown_standings
WITH (security_invoker = true) AS
WITH latest AS (
  SELECT DISTINCT ON (v.production_id, v.screen_name)
         v.production_id, v.screen_name, v.video_id
    FROM production_votes v
   ORDER BY v.production_id, v.screen_name, v.created_at DESC
)
SELECT pv.production_id,
       pv.id                     AS video_id,
       count(l.video_id)::int    AS votes
  FROM production_videos pv
  LEFT JOIN latest l ON l.video_id = pv.id
 WHERE pv.approved AND NOT pv.is_inspo
 GROUP BY pv.production_id, pv.id;

GRANT SELECT ON production_countdown_standings TO anon, authenticated;

COMMENT ON VIEW production_countdown_standings IS
  'Live countdown standings. security_invoker means it reads through the RLS of
   the person asking: the public sees approved videos and public vote rows, and
   nothing else.';


-- ── 3. The audience writes on the blog ───────────────────────────────────────

ALTER TABLE production_posts
  ADD COLUMN IF NOT EXISTS is_audience BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS device_tag  TEXT,
  ADD COLUMN IF NOT EXISTS flagged     BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN production_posts.is_audience IS
  'Written by a member of the audience on the public site, under a screen
   name, during the show. Published on the spot like the wall. A cast post has
   this off and created_by set.';

-- Same shape as the wall: no anon INSERT anywhere, the handler is the door.
-- The existing "Published posts are public" SELECT policy already covers these
-- because they are published on insert.


-- ── 4. The three October shows, and the two links the front door needs ───────

ALTER TABLE production_microsite
  ADD COLUMN IF NOT EXISTS reserve_url      TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS submit_form_url  TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN production_microsite.reserve_url IS
  'Where the audience reserves a free seat in the studio. One form with a
   dropdown for which show, so it is one link everywhere.';
COMMENT ON COLUMN production_microsite.submit_form_url IS
  'The public video submission form. Distinct from submissions_url, which is
   the drive folder the cast keeps the files in.';

UPDATE production_microsite pm
   SET submit_form_url = 'https://forms.gle/874dScLaJXzJEkB97'
  FROM productions p
 WHERE p.id = pm.production_id AND p.slug = '2006' AND pm.submit_form_url = '';

-- Chicago, which is CDT in October: 7pm CT is 00:00 UTC the next day, 2pm CT
-- is 19:00 UTC. Hybrid, because it is live online with limited seats in the
-- room. ticket_url stays empty here and is filled from the reserve link on the
-- page, so there is one place to change it.
INSERT INTO production_dates
  (production_id, start_at, end_at, location_type, venue_name, label, is_visible)
SELECT p.id, d.start_at::timestamptz, d.end_at::timestamptz, 'hybrid', 'our studio', d.label, true
FROM productions p,
  (VALUES
    ('2026-10-10 00:00:00+00', '2026-10-10 01:30:00+00', 'Friday night'),
    ('2026-10-10 19:00:00+00', '2026-10-10 20:30:00+00', 'Saturday matinee'),
    ('2026-10-12 00:00:00+00', '2026-10-12 01:30:00+00', 'Sunday night')
  ) AS d(start_at, end_at, label)
WHERE p.slug = '2006'
  AND NOT EXISTS (SELECT 1 FROM production_dates x WHERE x.production_id = p.id);


-- ── Check it worked ───────────────────────────────────────────────────────────
--   select title, artist, year, youtube_id, ours from production_videos
--     where approved order by sort_order;                           -- 12 rows
--   select * from production_countdown_standings;                  -- 12 rows, all 0
--   select label, start_at at time zone 'America/Chicago' from production_dates
--     join productions on productions.id = production_id
--    where slug = '2006' order by start_at;                          -- 3 rows
