-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v36 · Security Advisor warning cleanup, round one
-- Run in Supabase SQL Editor after v35.
--
-- Addresses three groups of Security Advisor warnings:
--   1. "Function Search Path Mutable" on 11 older functions: pins
--      search_path = public on each, matching what v34's functions already
--      do. No behavior change, just hardening against search-path tricks.
--   2. "Public Bucket Allows Listing" on profile-photos: drops the broad
--      SELECT policy on storage.objects so visitors can't list every
--      filename. Photos keep working: a public bucket serves files by URL
--      without needing that policy.
--   3. "Public Can See Object in GraphQL Schema" on back_of_house_notes:
--      revokes anon access so signed-out visitors can't even see the table
--      exists. RLS already blocked reading the data; this hides the table
--      name too. Signed-in access is unchanged.
--
-- NOT addressed here (needs its own careful pass):
--   - The same GraphQL warning on admin_users. Many RLS policies across the
--     database check admin_users directly with an inline EXISTS, and those
--     run with the querying user's own permissions. Revoking anon SELECT on
--     admin_users would make every anon query against tables carrying such
--     a policy (profiles, recommendations, etc.) fail with permission
--     denied, breaking the public directory and /submit. Fix is to first
--     rewrite those policies to use the SECURITY DEFINER is_admin()
--     function (already granted to anon in v21), then revoke.
--   - The two "RLS Policy Always True" warnings on profiles and
--     resource_submissions, since the anonymous /submit flow depends on
--     some of those policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- ============================================
-- 1. PIN search_path ON OLDER FUNCTIONS
-- ============================================
-- Loops over every overload of each named function in the public schema and
-- pins its search_path. Done by name via pg_proc (rather than hand-written
-- ALTER FUNCTION signatures) because generate_invitation_code was created by
-- hand on the live database and its exact argument list isn't in any
-- migration file.

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'generate_invitation_code',
        'delete_expired_messages',
        'is_approved_email',
        'is_admin',
        'is_super_admin',
        'generate_invite_codes',
        'update_updated_at',
        'get_endorsement_count',
        'is_approved_member',
        'set_updated_at',
        'link_profile_to_auth_user'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.sig);
  END LOOP;
END $$;

-- ============================================
-- 2. STOP PUBLIC LISTING OF profile-photos
-- ============================================
-- Drops any SELECT policy on storage.objects scoped to the profile-photos
-- bucket. The bucket is public, so individual photos are still served by
-- their URL; this only removes the ability to enumerate all filenames
-- through the storage API.

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (qual LIKE '%profile-photos%' OR qual LIKE '%profile_photos%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- ============================================
-- 3. HIDE back_of_house_notes FROM SIGNED-OUT VISITORS
-- ============================================
-- admin_users deliberately NOT revoked here; see header note.

REVOKE ALL ON public.back_of_house_notes FROM anon;
