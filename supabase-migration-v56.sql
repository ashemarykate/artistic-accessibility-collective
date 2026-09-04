-- ============================================================================
-- Migration v56: two small safety fixes from the September 2026 site pass
-- ============================================================================
-- Run this in the Supabase SQL Editor. Safe to run more than once.
--
--  1. can_request_login_link() is SECURITY DEFINER and callable by anon, but
--     unlike its sibling functions in v55 it never pinned search_path. Pinning
--     it closes the door on search-path tricks. Behaviour is unchanged.
--
--  2. One approved profile per person, enforced by the database. The app
--     assumes it (every profile lookup uses maybeSingle on user_id +
--     status = 'approved') and a duplicate signs the member out at login.
--     A partial unique index makes the assumption true. Checked live on
--     2026-09-04: no duplicates exist, so this creates cleanly.
-- ============================================================================

-- ── 1. Pin search_path on the login-link check ───────────────────────────────

CREATE OR REPLACE FUNCTION can_request_login_link(lookup_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT
    is_approved_email(lookup_email)
    OR EXISTS (
      SELECT 1 FROM production_team pt
      WHERE normalize_login_email(pt.invited_email)
          = normalize_login_email(lookup_email)
    )
    OR EXISTS (
      SELECT 1
      FROM production_team pt
      JOIN auth.users u ON u.id = pt.user_id
      WHERE normalize_login_email(u.email)
          = normalize_login_email(lookup_email)
    );
$$;

GRANT EXECUTE ON FUNCTION can_request_login_link(text) TO anon, authenticated;

-- ── 2. One approved profile per user ─────────────────────────────────────────
-- If this errors with "could not create unique index", there are duplicates.
-- Find them with:
--   SELECT user_id, count(*) FROM profiles
--   WHERE status = 'approved' AND user_id IS NOT NULL
--   GROUP BY user_id HAVING count(*) > 1;
-- and set the extras to status = 'rejected' before re-running.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_one_approved_per_user
  ON profiles (user_id)
  WHERE status = 'approved' AND user_id IS NOT NULL;
