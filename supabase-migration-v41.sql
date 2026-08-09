-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v41 · Collective Projects on member profiles
-- Run in Supabase SQL Editor after v40.
--
-- Goal: a member profile shows the productions that person has worked on,
-- grouped into past, current, and future, each linking to its project page.
--
-- A production team member does NOT need to be a Collective member. The link
-- runs the other way: if a production_team row happens to carry a user_id that
-- also has a profiles row, that member's profile picks up the credit. People
-- with no Collective account simply never appear on a profile page, which is
-- the correct behaviour rather than a gap.
--
-- ⚠ ONE VISIBILITY CHANGE, PLEASE READ.
-- v38 made only 'published' productions public. Archived ones are invisible to
-- everyone except admins today. Linking to a past project's page requires that
-- page to be readable, so this migration makes ARCHIVED PRODUCTIONS PUBLIC too.
--
-- This is done by ADDING policies, never by editing v38's. Postgres OR's
-- permissive policies together, so v38's rules stay exactly as written and
-- keep working; these widen the door rather than moving it. If you would
-- rather archived shows stay hidden, drop the three policies in section 1 and
-- the credits view will simply stop returning archived work. Nothing else
-- breaks.
--
-- 'draft' remains private in every case. Nothing here exposes a draft.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Archived productions become publicly readable ──────────────────────────

DROP POLICY IF EXISTS "Archived productions are public" ON productions;
CREATE POLICY "Archived productions are public"
  ON productions FOR SELECT TO anon, authenticated
  USING (status = 'archived');

DROP POLICY IF EXISTS "Dates of archived productions are public" ON production_dates;
CREATE POLICY "Dates of archived productions are public"
  ON production_dates FOR SELECT TO anon, authenticated
  USING (
    is_visible
    AND EXISTS (
      SELECT 1 FROM productions p
      WHERE p.id = production_dates.production_id
        AND p.status = 'archived'
    )
  );

DROP POLICY IF EXISTS "Visible team of archived productions is public" ON production_team;
CREATE POLICY "Visible team of archived productions is public"
  ON production_team FOR SELECT TO anon, authenticated
  USING (
    is_visible
    AND EXISTS (
      SELECT 1 FROM productions p
      WHERE p.id = production_team.production_id
        AND p.status = 'archived'
    )
  );


-- ── 2. Credits view ───────────────────────────────────────────────────────────
-- One row per person per production they are credited on, with the production
-- already sorted into past, current, or future.
--
-- security_invoker: the caller's own RLS decides what comes back. A signed-out
-- visitor sees published and archived work only; a producer browsing their own
-- profile also sees the draft they are working on, which is what you want when
-- checking a page before it goes live.

DROP VIEW IF EXISTS member_production_credits;
CREATE VIEW member_production_credits
WITH (security_invoker = true) AS
  WITH run AS (
    SELECT
      production_id,
      MIN(start_at)                       AS first_start,
      MAX(COALESCE(end_at, start_at))     AS last_end
    FROM production_dates
    WHERE is_visible
    GROUP BY production_id
  )
  SELECT
    pt.user_id,
    p.id            AS production_id,
    p.slug,
    p.title,
    p.tagline,
    p.kind,
    p.status,
    p.hero_photo_url,
    pt.credit,
    pt.team_role,
    pt.display_name,
    r.first_start,
    r.last_end,
    CASE
      -- An archived show is history regardless of what its dates say.
      WHEN p.status = 'archived'            THEN 'past'
      -- Every performance has finished.
      WHEN r.last_end    < now()            THEN 'past'
      -- Announced, first performance still ahead.
      WHEN r.first_start > now()            THEN 'future'
      -- Mid-run, or in production with no dates announced yet.
      ELSE 'current'
    END AS timeframe
  FROM production_team pt
  JOIN productions p ON p.id = pt.production_id
  LEFT JOIN run r    ON r.production_id = p.id
  WHERE pt.user_id IS NOT NULL
    AND pt.is_visible;

COMMENT ON VIEW member_production_credits IS
  'Productions a person is credited on, grouped into past, current, future.
   Powers the Collective Projects section of a member profile. Respects the
   caller''s RLS, so drafts never leak. A production team member with no
   Collective account simply has no rows here, which is expected.';

GRANT SELECT ON member_production_credits TO anon, authenticated;
