-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v21 · Fix infinite recursion on admin_users RLS
-- Run in Supabase SQL Editor after v20
--
-- Problem: the policies on admin_users check admin_users to see if the
-- current user is an admin. Any time another policy (profiles, events, etc.)
-- also checks admin_users, Postgres recurses forever:
--   profiles policy → query admin_users → admin_users policy → query admin_users → …
--
-- Fix: replace the self-referential admin_users policies with SECURITY DEFINER
-- functions that query admin_users bypassing RLS entirely.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. SECURITY DEFINER helpers ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER   -- bypasses RLS, no recursion
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin()       TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated, anon;

-- ── 2. Rebuild admin_users policies (no more self-reference) ──────────────────

DROP POLICY IF EXISTS "Admins can view admin users"    ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admin_users;

-- Admins can see who else is an admin (uses function → no recursion)
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (is_admin());

-- Only super-admins can add / remove admins
CREATE POLICY "Super admins can manage admins"
  ON admin_users FOR ALL
  USING (is_super_admin());
