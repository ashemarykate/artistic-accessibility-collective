-- ============================================================
-- Migration v19: Fix magic-link login for non-public profiles
-- Run in Supabase SQL Editor after v18.
-- ============================================================
-- Problem: the login page checks for an approved profile by email
-- before the user is authenticated. The anon RLS policy on profiles
-- requires public_visible = true, so members with public_visible = false
-- (including all Access Card members) can never receive a magic link.
--
-- Fix: a SECURITY DEFINER function that bypasses RLS for this single
-- narrow check — "does an approved profile exist for this email?"
-- It returns only a boolean, exposing no profile data.
-- ============================================================

CREATE OR REPLACE FUNCTION is_approved_email(lookup_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE lower(trim(email)) = lower(trim(lookup_email))
      AND status = 'approved'
  );
$$;

-- Allow the anon role to call this function
GRANT EXECUTE ON FUNCTION is_approved_email(text) TO anon;
GRANT EXECUTE ON FUNCTION is_approved_email(text) TO authenticated;
