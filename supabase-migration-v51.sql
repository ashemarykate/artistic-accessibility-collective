-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v51 · Stop the public reading the company's email addresses
-- Run in Supabase SQL Editor after v50, and BEFORE re-running the 2006 seed.
--
-- What went wrong: v40 made the visible team of a published production public,
-- which is correct, credits are meant to be read. But RLS is row level, not
-- column level, so "you may read this row" meant "you may read every column of
-- this row", including invited_email and user_id.
--
-- Verified with the anon key against the live database: an anonymous request
-- to /rest/v1/production_team returns both columns for all seven rows. They
-- are currently NULL, which is the only reason nothing has leaked. Re-running
-- the seed fills invited_email with six real personal addresses, and they
-- would be one unauthenticated GET away from anybody.
--
-- The fix is column level GRANTs, which apply on top of RLS rather than
-- replacing it. The row policies from v40 are untouched: they still decide
-- WHICH rows you see. These decide which COLUMNS come back.
--
-- Note this locks the columns for `authenticated` too, not only `anon`. A
-- signed in stranger is no more entitled to the company's addresses than a
-- signed out one, and nothing in the app reads them from the client today.
-- When the company page is built, a producer reads them through a
-- SECURITY DEFINER function, the same pattern as is_admin().
-- ─────────────────────────────────────────────────────────────────────────────

-- Postgres has no "revoke one column" verb: revoke the table, grant back the
-- columns that are safe. Anything added to this table later is private by
-- default, which is the right way round.
REVOKE SELECT ON production_team FROM anon, authenticated;

-- The public gets the credits and nothing else.
GRANT SELECT (
  id, production_id, team_role, display_name, credit,
  sort_order, is_visible,
  persona,          -- screen name, away message, colours: all audience facing
  created_at, updated_at
) ON production_team TO anon;

-- Signed in users additionally get user_id, because Postgres requires SELECT
-- on any column named in a WHERE clause and the portal looks up your own row
-- with `.eq('user_id', me)`. A user id is an opaque uuid, not contact details.
GRANT SELECT (
  id, production_id, team_role, display_name, credit,
  sort_order, is_visible, persona, created_at, updated_at,
  user_id
) ON production_team TO authenticated;

-- invited_email is granted to NOBODY. It is the one genuinely private column:
-- six people's personal addresses. claim_production_invites() (v42) and
-- can_request_login_link() (v50) both read it from inside SECURITY DEFINER
-- functions, which bypass this entirely, so nothing that needs it breaks.

-- Writes are unchanged and still fully governed by the v40 policies.
GRANT INSERT, UPDATE, DELETE ON production_team TO authenticated;


-- ── Check ─────────────────────────────────────────────────────────────────────
-- anon should NOT list invited_email or user_id.
-- authenticated should list user_id but NOT invited_email.

SELECT grantee, string_agg(column_name, ', ' ORDER BY column_name) AS readable_columns
FROM information_schema.column_privileges
WHERE table_name = 'production_team'
  AND privilege_type = 'SELECT'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee;
