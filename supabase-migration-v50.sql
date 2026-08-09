-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v50 · Let people on a show request a login link
-- Run in Supabase SQL Editor after v49.
--
-- The bug this fixes: /login refuses to email a link unless
-- is_approved_email() finds an approved row in `profiles`. That is right for
-- the Collective, but Backstage was built on the opposite promise, that being
-- on a production needs no Collective membership at all. So the Backstage
-- button led to a door that turns half the company away:
--
--   "We don't have an approved account for that email address."
--
-- Emma and Yongwoo have no profiles row, only a production_team row waiting on
-- their invited_email. They would never have got in.
--
-- can_request_login_link() is the union: an approved member, OR somebody a
-- producer has put on a show. It does not grant anything by itself. All it
-- decides is whether we are willing to send an email, and Supabase still has
-- to recognise the address for that email to go anywhere.
--
-- Enumeration note: this tells an anonymous caller whether an address is known
-- to us, which is-exactly what is_approved_email already did since v19. No new
-- exposure, same shape, and the alternative (send nothing, say nothing) makes
-- a real person's failure indistinguishable from a typo.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION can_request_login_link(lookup_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    -- An approved Collective member. Unchanged behaviour from v19.
    is_approved_email(lookup_email)
    -- Or invited to a production and not yet signed up.
    OR EXISTS (
      SELECT 1 FROM production_team pt
      WHERE lower(trim(pt.invited_email)) = lower(trim(lookup_email))
    )
    -- Or already on a production under an account that exists.
    OR EXISTS (
      SELECT 1
      FROM production_team pt
      JOIN auth.users u ON u.id = pt.user_id
      WHERE lower(trim(u.email)) = lower(trim(lookup_email))
    );
$$;

GRANT EXECUTE ON FUNCTION can_request_login_link(text) TO anon, authenticated;

COMMENT ON FUNCTION can_request_login_link(text) IS
  'Whether we will email a sign in link to this address: an approved Collective
   member, or anybody on a production team. Grants nothing on its own.';


-- ── Check ─────────────────────────────────────────────────────────────────────
-- Every one of these should come back true. Emma and Yongwoo are the point:
-- they have no Collective profile, only an invitation.

SELECT
  can_request_login_link('mk@artisticaccessibility.com')  AS mk,
  can_request_login_link('mavriklewis90@gmail.com')       AS lip,
  can_request_login_link('allman.jenn@gmail.com')         AS jen,
  can_request_login_link('aleccunningham96@gmail.com')    AS alec,
  can_request_login_link('johnson.emma007@gmail.com')     AS emma,
  can_request_login_link('bhak.yongwoo@gmail.com')        AS yongwoo,
  can_request_login_link('nobody@example.com')            AS should_be_false;
