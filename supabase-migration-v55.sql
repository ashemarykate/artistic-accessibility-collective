-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v55 · Let an invited person actually claim their own show
-- Run in Supabase SQL Editor after v54.
--
-- THE BUG, in order:
--
--   v42 added claim_production_invites(). After sign in, the app calls it and
--   it fills in user_id on any production_team row held for your confirmed
--   email address. That is the whole self-serve path onto a show.
--
--   v40 added the production_team_guard trigger. It refuses any UPDATE that
--   changes team_role, production_id or user_id unless you are a producer of
--   that production. Right for the API, and it is what stops a performer
--   promoting themselves.
--
--   The two collide. Emma is a creator on "2006", not a producer, so when her
--   claim tries to write user_id the trigger raises:
--
--     ERROR: Only a producer of this production can change role or assignment.
--
--   claim_production_invites() has no exception handler, so the whole RPC
--   fails. lib/backstage.ts throws the error away and returns 0. She sees
--   "You are not on a show yet" and there is nothing anywhere that says why.
--
--   v52 only exempted auth.uid() IS NULL, which unblocked the SQL editor and
--   left every real person still refused.
--
-- Observed 2026-08-11: Emma signed in at 18:31 with johnson.emma007@gmail.com,
-- the exact address on her invite, and her row still has user_id NULL. So does
-- Yongwoo's. Jen and Alec are attached only because the seed happened to run
-- after they made accounts.
--
-- THE FIX, in three parts:
--
--   1. The guard learns to recognise a claim, and permits exactly that one
--      transition: an unattached row, held for YOUR confirmed address, taking
--      YOUR user id, with role and production untouched. Everything else it
--      refused before, it still refuses.
--
--   2. Matching ignores the ways one Gmail mailbox can be spelled, so an
--      invite sent to johnson.emma007@ still finds someone who signs in as
--      johnsonemma007@ or johnson.emma007+aac@. Only gmail.com and
--      googlemail.com, because only there are dots and plus tags meaningless.
--
--   3. A catch up pass attaches everyone whose invite already matches a
--      confirmed account, so Emma and Yongwoo are fixed the moment this runs
--      rather than on their next visit.
--
-- WHY PART 1 IS SAFE, since it loosens a security control:
--
--   The exemption needs all of: OLD.user_id IS NULL, NEW.user_id = auth.uid(),
--   team_role unchanged, production_id unchanged, and OLD.invited_email equal
--   to the caller's CONFIRMED address in auth.users. You cannot name the user
--   id (it is compared against auth.uid()), cannot pick the role (a producer
--   set it), and cannot claim a row that was not addressed to you.
--
--   It is also unreachable from the API except through the v42 function. A
--   non-producer has no RLS policy that matches an unclaimed row: "Team
--   members update their own row" requires user_id = auth.uid(), and user_id
--   is NULL. So RLS refuses the UPDATE long before the trigger sees it. This
--   trigger change only affects code running inside SECURITY DEFINER, which is
--   claim_production_invites() and nothing else.
--
--   For someone who signed up with a genuinely different address, see the
--   producer note at the bottom. That one needs a human decision and should.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. One mailbox, many spellings ────────────────────────────────────────────
-- Gmail ignores dots in the local part and everything from a + onwards, so
-- johnson.emma007@gmail.com and johnsonemma007+aac@googlemail.com are the same
-- inbox. Nowhere else is that true, so nothing else is touched: for every other
-- domain this is lower() and trim() and no more.

CREATE OR REPLACE FUNCTION normalize_login_email(raw TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN raw IS NULL OR position('@' in raw) = 0 THEN lower(trim(raw))
    WHEN lower(split_part(trim(raw), '@', 2)) IN ('gmail.com', 'googlemail.com')
      THEN replace(split_part(lower(split_part(trim(raw), '@', 1)), '+', 1), '.', '')
           || '@gmail.com'
    ELSE lower(trim(raw))
  END;
$$;

COMMENT ON FUNCTION normalize_login_email(TEXT) IS
  'One spelling per mailbox, for matching invitations to accounts. Folds Gmail
   dots and plus tags, which are meaningless there. Every other domain is only
   lowercased and trimmed. Never store the result: it is for comparison.';


-- ── 2. The caller's own verified address ──────────────────────────────────────
-- SECURITY DEFINER because `authenticated` cannot read auth.users, and the
-- guard trigger runs as whoever made the request. It answers about auth.uid()
-- and nothing else, so it cannot be used to look anybody up.

CREATE OR REPLACE FUNCTION caller_confirmed_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT normalize_login_email(u.email)
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION caller_confirmed_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION caller_confirmed_email() TO authenticated;

COMMENT ON FUNCTION caller_confirmed_email() IS
  'The signed in caller''s own confirmed email, normalized. NULL if there is no
   session or the address was never confirmed. Reads auth.uid() only, so it
   cannot answer questions about anyone else.';


-- ── 3. The guard, taught to recognise a claim ─────────────────────────────────

-- Left as SECURITY INVOKER, exactly as v40 and v52 had it. It needs no rights
-- of its own: the one privileged lookup it makes is caller_confirmed_email(),
-- which is SECURITY DEFINER and granted to authenticated.

CREATE OR REPLACE FUNCTION guard_production_team_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- No signed in user means this is not an API request: the SQL editor, a
  -- migration, or the service role. Unchanged from v52, and see that file for
  -- why anon can never reach this point.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Producers and Collective admins may change anything.
  IF can_manage_production(NEW.production_id) THEN
    RETURN NEW;
  END IF;

  -- Claiming your own invitation. The one transition a non-producer may make,
  -- and only exactly this one. See the header for why each clause is here.
  IF OLD.user_id IS NULL
     AND NEW.user_id = auth.uid()
     AND NEW.team_role     IS NOT DISTINCT FROM OLD.team_role
     AND NEW.production_id IS NOT DISTINCT FROM OLD.production_id
     AND NEW.invited_email IS NOT DISTINCT FROM OLD.invited_email
     AND OLD.invited_email IS NOT NULL
     AND normalize_login_email(OLD.invited_email) = caller_confirmed_email()
  THEN
    RETURN NEW;
  END IF;

  -- invited_email is on this list as of v55. It decides who a row is waiting
  -- for, so it belongs to the producer, not to whoever currently sits in it.
  IF NEW.team_role     IS DISTINCT FROM OLD.team_role
  OR NEW.production_id IS DISTINCT FROM OLD.production_id
  OR NEW.user_id       IS DISTINCT FROM OLD.user_id
  OR NEW.invited_email IS DISTINCT FROM OLD.invited_email THEN
    RAISE EXCEPTION
      'Only a producer of this production can change role or assignment.';
  END IF;

  RETURN NEW;
END $$;


-- ── 4. The claim itself, matching on the normalized address ───────────────────
-- Same shape and the same five security notes as v42. Two changes: the
-- comparison goes through normalize_login_email() on both sides, and the
-- caller's address comes from caller_confirmed_email(), which already refuses
-- an unconfirmed one.

CREATE OR REPLACE FUNCTION claim_production_invites()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_email TEXT;
  linked       INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  caller_email := caller_confirmed_email();

  -- No verified address, no claim. Otherwise somebody could sign up as an
  -- address they do not control, never confirm it, and take what was waiting
  -- for the real person.
  IF caller_email IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE production_team pt
  SET user_id = auth.uid()
  WHERE pt.user_id IS NULL
    AND pt.invited_email IS NOT NULL
    AND normalize_login_email(pt.invited_email) = caller_email
    AND NOT EXISTS (
      SELECT 1 FROM production_team other
      WHERE other.production_id = pt.production_id
        AND other.user_id = auth.uid()
    );

  GET DIAGNOSTICS linked = ROW_COUNT;
  RETURN linked;
END $$;

GRANT EXECUTE ON FUNCTION claim_production_invites() TO authenticated;


-- ── 5. The login door, same spelling rules ────────────────────────────────────
-- Otherwise we would refuse to email a link to an address the claim would have
-- happily accepted. Behaviour is unchanged from v50 apart from the folding.

CREATE OR REPLACE FUNCTION can_request_login_link(lookup_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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


-- ── 6. Catch up ───────────────────────────────────────────────────────────────
-- Everyone whose invitation already matches a confirmed account, attached now.
-- This is the seed's step 3c, made general and no longer specific to "2006".
-- auth.uid() is NULL here, so the guard steps aside for it.
--
-- Safe to run more than once: it only fills empty rows, and it skips anyone
-- already sitting somewhere else on the same production.

UPDATE production_team pt
SET user_id = u.id
FROM auth.users u
WHERE pt.user_id IS NULL
  AND pt.invited_email IS NOT NULL
  AND u.email_confirmed_at IS NOT NULL
  AND normalize_login_email(u.email) = normalize_login_email(pt.invited_email)
  AND NOT EXISTS (
    SELECT 1 FROM production_team other
    WHERE other.production_id = pt.production_id
      AND other.user_id = u.id
  );


-- ── 7. Who is stuck, and why ──────────────────────────────────────────────────
-- Every production, not only "2006". Run this on its own any time somebody says
-- they cannot get in, and it will tell you which of the four situations they
-- are in without anybody having to describe an error message.
--
--   in            they are attached and Backstage will open
--   ready         attached by this migration just now
--   not signed up nobody has ever made an account with that address
--   unconfirmed   an account exists but the magic link was never followed
--   no email      nothing to match on, a producer needs to add one
--
-- "unconfirmed" is the one that looks like a bug and is not. Following the
-- link once fixes it, and until they do we cannot safely hand them the row.

SELECT
  p.slug,
  pt.sort_order,
  pt.display_name,
  pt.team_role,
  pt.persona->>'screen_name' AS screen_name,
  CASE
    WHEN pt.user_id IS NOT NULL       THEN 'in'
    WHEN pt.invited_email IS NULL     THEN 'no email'
    WHEN u.id IS NULL                 THEN 'not signed up'
    WHEN u.email_confirmed_at IS NULL THEN 'unconfirmed'
    ELSE                                   'stuck, tell Claude'
  END AS state,
  pt.invited_email
FROM production_team pt
JOIN productions p ON p.id = pt.production_id
LEFT JOIN auth.users u
  ON normalize_login_email(u.email) = normalize_login_email(pt.invited_email)
ORDER BY p.slug, pt.sort_order;


-- ── 7b. Two accounts, one person ──────────────────────────────────────────────
-- The other way somebody gets stranded: they joined the Collective under one
-- address and were invited to the show under another. Nothing is broken, but
-- their credit lands on the account they do not use, so their profile shows no
-- show and the show shows no profile.
--
-- Nicholas Yongwoo Park is in exactly this position as of 2026-08-11: the
-- Collective profile is on neokimchi@gmail.com, the "2006" invitation is on
-- bhak.yongwoo@gmail.com. This lists anyone in that position so it can be
-- settled deliberately rather than discovered later. See section 9.

-- Matching on names is guesswork and will occasionally pair up two people who
-- happen to share one. That is acceptable here and nowhere else: this is a list
-- for a human to read, it grants nothing, and every real membership decision in
-- this file is made on a verified email address. Expect a little noise.

SELECT
  pt.display_name        AS on_the_show_as,
  pt.invited_email       AS show_address,
  pr.full_name           AS collective_profile,
  pr.email               AS profile_address
FROM production_team pt
JOIN profiles pr
  ON length(trim(pt.display_name)) >= 3
 AND lower(trim(pr.full_name)) LIKE '%' || lower(trim(pt.display_name)) || '%'
WHERE pt.invited_email IS NOT NULL
  AND normalize_login_email(pr.email) <> normalize_login_email(pt.invited_email);


-- ── 8. Prove the guard still bites ────────────────────────────────────────────
-- Three attempts by a signed in stranger, all of which must be refused. If any
-- of them succeeds, do not deploy: the guard has been switched off rather than
-- narrowed. Nothing here leaves a change behind.

DO $$
DECLARE
  alec  UUID;
  robot UUID;
  nobody UUID := gen_random_uuid();
  failures TEXT := '';
BEGIN
  SELECT pt.id INTO alec
  FROM production_team pt JOIN productions p ON p.id = pt.production_id
  WHERE p.slug = '2006' AND pt.display_name = 'Alec';

  SELECT pt.id INTO robot
  FROM production_team pt JOIN productions p ON p.id = pt.production_id
  WHERE p.slug = '2006' AND pt.display_name = 'SmarterChild';

  IF alec IS NULL OR robot IS NULL THEN
    RAISE NOTICE 'The 2006 company is not seeded here, skipping the guard test.';
    RETURN;
  END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', nobody::text, 'role', 'authenticated')::text, true);

  -- a. Promoting somebody else.
  BEGIN
    UPDATE production_team SET team_role = 'producer' WHERE id = alec;
    failures := failures || ' [promoted Alec]';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- b. Sitting down in an unclaimed row that was never addressed to you.
  --    This is the exact hole the v55 exemption could have opened.
  BEGIN
    UPDATE production_team SET user_id = nobody WHERE id = robot;
    failures := failures || ' [took SmarterChild''s row]';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- c. Re-pointing an invitation at an address you control.
  BEGIN
    UPDATE production_team SET invited_email = 'attacker@example.com' WHERE id = alec;
    failures := failures || ' [re-pointed Alec''s invite]';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  PERFORM set_config('request.jwt.claims', NULL, true);

  IF failures <> '' THEN
    RAISE EXCEPTION 'GUARD IS BROKEN, a stranger just did:%', failures;
  END IF;

  RAISE NOTICE 'Guard still refuses all three. Good.';
END $$;


-- ── 9. When somebody signed up with a different address ───────────────────────
-- The one case this cannot fix by itself, because it takes a person to decide
-- that two addresses are the same human. Ask them which address they want to
-- keep, then point the invitation at it. Clearing user_id at the same time
-- matters: the claim only ever fills an empty one, so without that they stay
-- attached to the old account and nothing appears to happen.
--
--   UPDATE production_team pt
--   SET invited_email = 'the-address-they-really-use@example.com',
--       user_id       = NULL
--   FROM productions p
--   WHERE p.id = pt.production_id
--     AND p.slug = '2006'
--     AND pt.display_name = 'Yongwoo';
--
-- Then re-run section 6, which attaches them if that account is confirmed, or
-- section 7, which will say "unconfirmed" and mean "ask them to follow the
-- magic link once". Their persona, credit and role are untouched throughout:
-- this moves which door they come in by, not their place in the company.
