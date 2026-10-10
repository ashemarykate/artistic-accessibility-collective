-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v65 · Practice votes get collected
-- Run in Supabase SQL Editor after v64.
--
-- Until now the practice vote only lived in the voter's own browser, so the
-- company could not see how the audience was leaning during a test run. From
-- here the page also sends each practice vote to our server, marked as
-- practice, and Backstage shows both tallies side by side.
--
-- Practice votes never touch the real standings: the view the public page and
-- the show night order read from ignores them.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE production_votes
  ADD COLUMN IF NOT EXISTS practice BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN production_votes.practice IS
  'Cast while voting was closed (a practice vote). Excluded from the real
   standings. Shown to the company in Backstage as its own count.';

-- Same view as v62 (one vote per browser, newest wins), now split in two.
-- votes is the real count and keeps its name and place so nothing that reads
-- it changes. practice_votes is new and goes at the end.
CREATE OR REPLACE VIEW production_countdown_standings
WITH (security_invoker = true) AS
WITH latest AS (
  SELECT DISTINCT ON (v.production_id, v.device_tag, v.practice)
         v.production_id, v.device_tag, v.video_id, v.practice
    FROM production_votes v
   WHERE v.device_tag IS NOT NULL
   ORDER BY v.production_id, v.device_tag, v.practice, v.created_at DESC
)
SELECT pv.production_id,
       pv.id                                              AS video_id,
       count(l.video_id) FILTER (WHERE NOT l.practice)::int AS votes,
       count(l.video_id) FILTER (WHERE l.practice)::int     AS practice_votes
  FROM production_videos pv
  LEFT JOIN latest l ON l.video_id = pv.id
 WHERE pv.approved AND NOT pv.is_inspo
 GROUP BY pv.production_id, pv.id;

GRANT SELECT ON production_countdown_standings TO anon, authenticated;

-- ── Check it worked ───────────────────────────────────────────────────────────
--   select title, votes, practice_votes
--     from production_countdown_standings s join production_videos v on v.id = s.video_id
--    where s.production_id = (select id from productions where slug='2006');
