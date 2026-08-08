-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v39 · Fix profile photo uploads (storage overwrite permissions)
-- Run in Supabase SQL Editor. (v38 is reserved by work in progress in
-- another branch; numbering skips ahead to avoid a collision.)
--
-- Why: profile photo uploads have failed since the July 2026 security pass.
-- Both photo uploaders call upload(..., { upsert: true }), and the storage
-- API requires UPDATE permission on storage.objects for any upsert request,
-- even one creating a brand-new file. The profile-photos bucket has an
-- INSERT policy but no UPDATE (or DELETE) policy for members, so every
-- avatar upload 403s with "new row violates row-level security policy".
-- Gallery uploads kept working because they insert unique filenames with no
-- upsert flag.
--
-- Fix: members may update and delete files inside their own folder
-- ({auth user id}/...) in profile-photos. The app code is also updated so
-- all avatar uploads target that folder.
-- ─────────────────────────────────────────────────────────────────────────────

-- Members can read files in their own folder. The v36 security pass dropped
-- all SELECT policies on this bucket to stop public listing, but the
-- overwrite and delete flows check the existing file first, so members need
-- read access to their own folder. Public listing stays locked down; public
-- display works by direct URL against the public bucket, no policy needed.
DROP POLICY IF EXISTS "Members read own profile photos" ON storage.objects;
CREATE POLICY "Members read own profile photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members update own profile photos" ON storage.objects;
CREATE POLICY "Members update own profile photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members delete own profile photos" ON storage.objects;
CREATE POLICY "Members delete own profile photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
