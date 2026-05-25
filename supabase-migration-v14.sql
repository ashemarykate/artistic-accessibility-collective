-- Migration v14: Fix profile-claiming RLS policy for magic-link sign-ins
--
-- Problem: When a tester signs in via magic link for the first time, Supabase
-- creates a new auth user for them. The callback page then tries to link their
-- existing profiles row (which has user_id = NULL) to the new auth user.
-- But the existing UPDATE policy only allows updates where user_id = auth.uid(),
-- so updating a row where user_id IS NULL is blocked silently.
--
-- Fix: Extend the UPDATE policy to also allow a user to "claim" an unlinked
-- profile whose email matches their auth account email, as long as the result
-- sets user_id to their own ID. This is safe because:
--   - You can only claim a profile whose email matches yours (auth.jwt()->>'email')
--   - The WITH CHECK clause ensures the result always sets user_id to auth.uid()
--   - After claiming, the row is yours and the original USING clause covers
--     all future updates

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (
    -- Already linked to this user
    user_id = auth.uid()
    OR
    -- Unlinked profile (first magic-link sign-in) whose email matches the auth user
    (user_id IS NULL AND email = auth.jwt()->>'email')
  )
  WITH CHECK (
    -- After any update, the row must be owned by the current user
    user_id = auth.uid()
  );
