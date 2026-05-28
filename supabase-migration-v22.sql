-- Migration v22: Fix magic-link profile linking
--
-- Problem: The /auth/callback page tries to link a profile to an auth user in
-- two steps:
--   1. SELECT the profile where email matches and user_id IS NULL
--   2. UPDATE it to set user_id = auth.uid()
--
-- Step 1 fails silently because no SELECT policy covers an unlinked profile.
-- The "Public profiles readable" policy requires public_visible = true, and
-- "Members see all approved profiles" requires is_approved_member() which
-- itself checks user_id = auth.uid() — impossible before linking.
--
-- Fix: A SECURITY DEFINER function that does SELECT + UPDATE in one call,
-- bypassing RLS. It is safe because it only touches profiles whose email
-- matches the caller's JWT, and only allows updating rows where user_id IS NULL.
--
-- Also re-applies the v14 UPDATE policy fix (idempotent) in case v14 was
-- never run.

-- ── 1. Re-apply v14 UPDATE policy fix (idempotent) ─────────────────────────
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    (user_id IS NULL AND email = auth.jwt() ->> 'email')
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ── 2. SECURITY DEFINER function to link profile on first magic-link sign-in ─
-- Called from /auth/callback via supabase.rpc('link_profile_to_auth_user').
-- Returns TRUE if a profile was found and linked, FALSE if nothing to do.

CREATE OR REPLACE FUNCTION link_profile_to_auth_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE email = (auth.jwt() ->> 'email')
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
