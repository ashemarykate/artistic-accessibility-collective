-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v58 · Fix the public calendar for logged-out visitors
-- Run in the Supabase SQL Editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- THE BUG, found 2026-09-09 by querying the live database as a logged-out
-- visitor: opening /calendar without an account returned
--
--     42501: permission denied for table admin_users
--
-- so the public calendar showed a red error box instead of the events. Signed-in
-- members were fine, which is why it went unnoticed: every browser used for
-- testing was already logged in (the local dev auto-login signs you in too).
--
-- WHY it happened. When Postgres runs a SELECT it evaluates *every* permissive
-- SELECT policy on the table and ORs the results together, so even a policy
-- written for admins runs for an anonymous visitor. The admin policies on
-- `events` and `ics_sources` in the live database still ask the question the
-- old way:
--
--     EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
--
-- The `anon` role has no rights on `admin_users`, so that inline lookup does not
-- return false, it raises an error, and the error takes the whole query down.
--
-- Migration v37 already rewrote these two policies to call `is_admin()`, which
-- is SECURITY DEFINER and therefore answers safely for anybody. The live
-- database has drifted since (most likely a hand edit in the dashboard while
-- setting up calendar sources), so this migration puts it back and makes the
-- drift harder to reintroduce.
--
-- THE FIX, in two parts:
--   1. Drop every policy on these two tables that still names `admin_users`,
--      whatever it happens to be called. Naming them one by one would miss a
--      hand-made policy under a different name, which is exactly the case here.
--   2. Recreate the admin policies using `is_admin()` AND scope them
--      `TO authenticated`, so an anonymous visitor never evaluates them at all.
--      Either half alone fixes the bug; both together mean a future drift has
--      to get past two doors.
--
-- The public read policy (`events_public_read`, visible events only) is left
-- exactly as it is. This migration does not widen what anyone can see: an
-- anonymous visitor still reads only `is_visible = true` events, and still sees
-- no calendar sources at all.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Remove the policies that ask about admin_users directly ───────────────

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('events', 'ics_sources')
      AND (COALESCE(qual, '') LIKE '%admin_users%'
        OR COALESCE(with_check, '') LIKE '%admin_users%')
  LOOP
    RAISE NOTICE 'Dropping policy % on % (it queries admin_users directly)',
      pol.policyname, pol.tablename;
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ── 2. Recreate them the safe way ────────────────────────────────────────────
-- is_admin() is SECURITY DEFINER (v21), so it answers "false" for a logged-out
-- visitor instead of raising. TO authenticated means they do not even ask.

DROP POLICY IF EXISTS "events_admin_all" ON events;
CREATE POLICY "events_admin_all"
  ON events
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "ics_sources_admin_all" ON ics_sources;
CREATE POLICY "ics_sources_admin_all"
  ON ics_sources
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── 3. Check it worked ───────────────────────────────────────────────────────
-- Both of these should come back with a count and no error. The first is the
-- query the public calendar makes; before this migration it raised 42501.

-- SET ROLE anon;
--   SELECT count(*) FROM events WHERE is_visible = true;
--   SELECT count(*) FROM ics_sources;   -- expect 0 rows, no error
-- RESET ROLE;
