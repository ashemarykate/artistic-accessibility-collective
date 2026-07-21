-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v37 · Security Advisor cleanup, final careful pass
-- Run in Supabase SQL Editor after v36.
--
-- Three things, in order:
--   1. Rewrites every RLS policy that checks admin_users with an inline
--      EXISTS to use the SECURITY DEFINER is_admin() helper (v21) instead.
--      Same behavior, but policy checks no longer need the querying user to
--      have direct access to admin_users.
--   2. With that dependency gone, revokes anon access to admin_users so
--      signed-out visitors can't see the table exists. The app tolerates
--      this: public pages that probe admin_users (profile admin badge)
--      ignore a failed lookup, and signed-in access is unchanged.
--   3. Tightens the two "RLS Policy Always True" policies:
--      - profiles: anonymous/self INSERT must be status 'pending' (which is
--        what /submit always sends); admins are unaffected via their ALL
--        policy.
--      - resource_submissions: INSERT must be status 'pending' (the column
--        default; no app insert sets it). SELECT narrows from "anyone can
--        read everything" (which leaked submitter emails on pending rows)
--        to approved rows or admins. The public resources page only reads
--        approved rows, and the admin dashboard passes is_admin().
--
-- Residual, deliberate: submitter_name/email on APPROVED resource
-- submissions remain technically readable through the API. Consider
-- clearing those columns on approval in the admin flow later.
-- ─────────────────────────────────────────────────────────────────────────────

-- ============================================
-- 1. ADMIN POLICIES -> is_admin()
-- ============================================

DROP POLICY IF EXISTS "Admins manage resource creators" ON resource_creators;
CREATE POLICY "Admins manage resource creators"
  ON resource_creators FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage resources" ON resources;
CREATE POLICY "Admins manage resources"
  ON resources FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "saved_resources: admin read all" ON saved_resources;
CREATE POLICY "saved_resources: admin read all"
  ON saved_resources FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update resource submissions" ON resource_submissions;
CREATE POLICY "Admins can update resource submissions"
  ON resource_submissions FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all recommendations" ON recommendations;
CREATE POLICY "Admins manage all recommendations"
  ON recommendations FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can do everything with profiles" ON profiles;
CREATE POLICY "Admins can do everything with profiles"
  ON profiles FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage invite codes" ON invite_codes;
CREATE POLICY "Admins manage invite codes"
  ON invite_codes FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins manage all feedback" ON tester_feedback;
CREATE POLICY "Admins manage all feedback"
  ON tester_feedback FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "events_admin_all" ON events;
CREATE POLICY "events_admin_all"
  ON events FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "ics_sources_admin_all" ON ics_sources;
CREATE POLICY "ics_sources_admin_all"
  ON ics_sources FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can add back of house notes" ON back_of_house_notes;
CREATE POLICY "Admins can add back of house notes"
  ON back_of_house_notes FOR INSERT
  WITH CHECK (author_user_id = auth.uid() AND is_admin());

DROP POLICY IF EXISTS "Admins can read back of house notes" ON back_of_house_notes;
CREATE POLICY "Admins can read back of house notes"
  ON back_of_house_notes FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can remove back of house notes" ON back_of_house_notes;
CREATE POLICY "Admins can remove back of house notes"
  ON back_of_house_notes FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "Admins can update back of house notes" ON back_of_house_notes;
CREATE POLICY "Admins can update back of house notes"
  ON back_of_house_notes FOR UPDATE
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- 2. HIDE admin_users FROM SIGNED-OUT VISITORS
-- ============================================

REVOKE ALL ON public.admin_users FROM anon;

-- ============================================
-- 3. TIGHTEN THE ALWAYS-TRUE POLICIES
-- ============================================

-- profiles: collapse the two permissive INSERT policies into one that
-- requires new rows to be pending and either anonymous or owned by the
-- inserting user. /submit always sends status 'pending' and no user_id.
DROP POLICY IF EXISTS "Anyone can submit profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "New profiles are pending and self-owned or anonymous"
  ON profiles FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- resource_submissions: inserts must be pending (the default; no app code
-- sets status on insert).
DROP POLICY IF EXISTS "Anyone can submit a resource" ON resource_submissions;
CREATE POLICY "Anyone can submit a resource"
  ON resource_submissions FOR INSERT
  WITH CHECK (status = 'pending');

-- resource_submissions: public can read approved rows only; admins read all.
-- Closes the leak where pending submitters' emails were publicly readable.
DROP POLICY IF EXISTS "Anyone can read resource submissions" ON resource_submissions;
CREATE POLICY "Approved submissions are public, admins read all"
  ON resource_submissions FOR SELECT
  USING (status = 'approved' OR is_admin());
