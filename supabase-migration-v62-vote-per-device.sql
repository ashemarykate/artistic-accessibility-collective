-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v62 (vote per device) · One vote per person, not one per screen name
-- Run in the Supabase SQL Editor. Safe to run more than once, and in any order
-- relative to the other pending migrations: it touches only this one view.
--
-- THE BUG THIS FIXES, because it would have been invisible until show night:
--
-- The standings view kept the most recent vote per SCREEN NAME. "Continue as
-- Anon" hands out one of sixteen names, and two strangers pressing it routinely
-- get the same one. So the second xXbrokenheartXx to vote silently erased the
-- first xXbrokenheartXx's vote, and at most sixteen anonymous votes could ever
-- count no matter how many people voted. Anyone who typed a common name by hand
-- was in the same trap. Every one of them was told their vote counted.
--
-- Proven against this database on 2026-09-11: two votes inserted under the same
-- screen name from two different devices, standings counted one.
--
-- The fix is to count per device tag instead. That is the random per-browser
-- string the vote handler already stores, so nothing about the page or the way
-- people vote has to change. Changing your mind still replaces your own vote,
-- because it is still the most recent row for that device.
--
-- What this does NOT claim to be: a way to stop one determined person voting
-- from several browsers. It never was. It stops strangers deleting each other,
-- which is the thing that would have quietly ruined the count.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW production_countdown_standings
WITH (security_invoker = true) AS
WITH latest AS (
  -- One row per device: the most recent vote that browser cast.
  SELECT DISTINCT ON (v.production_id, v.device_tag)
         v.production_id, v.device_tag, v.video_id
    FROM production_votes v
   WHERE v.device_tag IS NOT NULL
   ORDER BY v.production_id, v.device_tag, v.created_at DESC
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
  'Live countdown standings, counted one per browser (device_tag), not one per
   screen name: sixteen shared anon names meant strangers were overwriting each
   other. Rows with no device_tag are pre-v59 and are excluded rather than all
   collapsing into a single null bucket. security_invoker means it reads through
   the RLS of whoever asks.';


-- ── Check it worked ───────────────────────────────────────────────────────────
-- Two votes, same name, different browsers, should now count as two:
--   select * from production_countdown_standings
--     where production_id = (select id from productions where slug='2006')
--     order by votes desc limit 5;
