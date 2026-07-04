-- Migration v30: Make first-login profile linking actually work
--
-- Two bugs in the v22 version of link_profile_to_auth_user():
--
--   1. It was declared STABLE, which tells Postgres the function never
--      writes data. Its whole job is an UPDATE, so Postgres rejected the
--      write and the function errored every single time it found a profile
--      to link. Callers ignore the error, so it failed silently: testers
--      could log in but their login was never connected to their profile,
--      and /dashboard signed them right back out.
--
--   2. The email match was case-sensitive. Auth emails are stored lowercase,
--      but profiles.email is stored exactly as typed on the join form, so
--      "Jane@Gmail.com" never matched "jane@gmail.com".
--
-- Fix: recreate the function without STABLE (default VOLATILE, writes
-- allowed) and compare emails case-insensitively. Also re-applies the
-- profiles UPDATE policy with the same case-insensitive match (idempotent).

-- ── 1. UPDATE policy: case-insensitive email match for unlinked rows ────────
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    (user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ── 2. Recreate the linking function, now allowed to write ──────────────────
-- Called from /auth/callback and /dashboard via
-- supabase.rpc('link_profile_to_auth_user').
-- Returns TRUE if a profile was found and linked, FALSE if nothing to do.

CREATE OR REPLACE FUNCTION link_profile_to_auth_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE lower(email) = lower(auth.jwt() ->> 'email')
    AND user_id IS NULL
    AND status = 'approved'
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE profiles
    SET user_id = auth.uid()
  WHERE id = v_profile_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION link_profile_to_auth_user() TO authenticated;
