-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v52 · Let the SQL editor run the seed
-- Run in Supabase SQL Editor after v51, and BEFORE re-running the 2006 seed.
--
-- The bug: guard_production_team_fields() (v40) stops anyone who is not a
-- producer from changing team_role, production_id or user_id. That is right
-- for requests coming through the API, and it is the control that stops a
-- performer promoting themselves.
--
-- But it also fires in the SQL editor, where there is no signed in user at
-- all. auth.uid() is NULL, so can_manage_production() is false, and the guard
-- refuses your own seed file:
--
--   ERROR: Only a producer of this production can change role or assignment.
--
-- It only showed up on the SECOND run. First time through, step 2 INSERTed and
-- step 3c had nothing to link, so no UPDATE ever reached the trigger. Re-run
-- it and both become UPDATEs, and both are refused.
--
-- The fix: skip the guard when there is no authenticated user.
--
-- Why that is safe, and it is worth being precise because this is a security
-- control: auth.uid() is NULL in exactly two situations. Either the statement
-- is running server side (the SQL editor, a migration, the service role), in
-- which case it is already trusted and can bypass RLS entirely anyway, or the
-- request came from `anon`. And anon cannot reach this trigger at all: every
-- write policy on production_team is TO authenticated, so an anonymous UPDATE
-- is refused by RLS long before a trigger runs. Loosening this does not widen
-- what any API caller can do.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION guard_production_team_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- No signed in user means this is not an API request. See the header: anon
  -- never gets this far, so the only callers here are trusted server side ones
  -- running the seed or a migration.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Producers and Collective admins may change anything.
  IF can_manage_production(NEW.production_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.team_role     IS DISTINCT FROM OLD.team_role
  OR NEW.production_id IS DISTINCT FROM OLD.production_id
  OR NEW.user_id       IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION
      'Only a producer of this production can change role or assignment.';
  END IF;

  RETURN NEW;
END $$;


-- ── Check ─────────────────────────────────────────────────────────────────────
-- Proves the guard still bites for a real signed in non-producer. This sets
-- auth.uid() to a random uuid, which is nobody, then tries to promote Alec.
-- It must RAISE. If this returns without an error, do not deploy: the guard
-- has been switched off rather than narrowed.

DO $$
DECLARE
  target UUID;
BEGIN
  SELECT pt.id INTO target
  FROM production_team pt JOIN productions p ON p.id = pt.production_id
  WHERE p.slug = '2006' AND pt.display_name = 'Alec';

  IF target IS NULL THEN
    RAISE NOTICE 'Alec not found, skipping the guard test.';
    RETURN;
  END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE production_team SET team_role = 'producer' WHERE id = target;
    RAISE EXCEPTION 'GUARD IS BROKEN: a stranger just promoted Alec.';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'GUARD IS BROKEN%' THEN RAISE; END IF;
    RAISE NOTICE 'Guard still works: %', SQLERRM;
  END;

  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;
