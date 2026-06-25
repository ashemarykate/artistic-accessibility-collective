-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v23 · Manage admins from the Admin panel
-- Run in Supabase SQL Editor after v22.
--
-- Adds three SECURITY DEFINER RPCs so a super-admin can list, add, and remove
-- admins by email directly from the new "Admins" tab in /admin, instead of
-- hand-editing the admin_users table in SQL. Each function enforces its own
-- permission check, so it is safe to expose to authenticated users.
--
-- Relies on is_admin() and is_super_admin() from v21.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── list_admins() — any admin may view the roster ────────────────────────────
CREATE OR REPLACE FUNCTION list_admins()
RETURNS TABLE (user_id uuid, email text, role text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT au.user_id,
           u.email::text,
           COALESCE(au.role, 'admin') AS role,
           p.full_name
    FROM admin_users au
    LEFT JOIN auth.users u ON u.id = au.user_id
    LEFT JOIN profiles  p ON p.user_id = au.user_id
    ORDER BY (COALESCE(au.role, 'admin') = 'super_admin') DESC, u.email;
END;
$$;

-- ── add_admin_by_email(email, role) — super-admins only ──────────────────────
-- Returns a short status string: 'added' | 'already_admin' | 'no_account'.
-- The person must already have an auth account (i.e. have signed in once via
-- the email link) before they can be made an admin.
CREATE OR REPLACE FUNCTION add_admin_by_email(target_email text, target_role text DEFAULT 'admin')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  safe_role text;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super-admins can add admins';
  END IF;

  safe_role := CASE WHEN target_role = 'super_admin' THEN 'super_admin' ELSE 'admin' END;

  SELECT id INTO target_id
  FROM auth.users
  WHERE lower(email) = lower(trim(target_email))
  LIMIT 1;

  IF target_id IS NULL THEN
    RETURN 'no_account';
  END IF;

  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = target_id) THEN
    UPDATE admin_users SET role = safe_role WHERE user_id = target_id;
    RETURN 'already_admin';
  END IF;

  INSERT INTO admin_users (user_id, role) VALUES (target_id, safe_role);
  RETURN 'added';
END;
$$;

-- ── remove_admin(user_id) — super-admins only ────────────────────────────────
-- Guards against removing yourself or the last remaining super-admin.
-- Returns: 'removed' | 'cannot_remove_self' | 'last_super_admin' | 'not_admin'.
CREATE OR REPLACE FUNCTION remove_admin(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role text;
  super_count int;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super-admins can remove admins';
  END IF;

  IF target_user_id = auth.uid() THEN
    RETURN 'cannot_remove_self';
  END IF;

  SELECT role INTO target_role FROM admin_users WHERE user_id = target_user_id;
  IF target_role IS NULL THEN
    RETURN 'not_admin';
  END IF;

  IF target_role = 'super_admin' THEN
    SELECT count(*) INTO super_count FROM admin_users WHERE role = 'super_admin';
    IF super_count <= 1 THEN
      RETURN 'last_super_admin';
    END IF;
  END IF;

  DELETE FROM admin_users WHERE user_id = target_user_id;
  RETURN 'removed';
END;
$$;

GRANT EXECUTE ON FUNCTION list_admins()                  TO authenticated;
GRANT EXECUTE ON FUNCTION add_admin_by_email(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin(uuid)             TO authenticated;
