-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v35 · Security fix: drop unused directory views
-- Run in Supabase SQL Editor after v34.
--
-- Background: public_directory and member_directory were created in the
-- original supabase-migration.sql, before the app was built out. Nothing in
-- the app queries them anymore (verified 2026-07-21 by searching app/, lib/,
-- and components/). Because plain views run with the view owner's
-- permissions, they bypass RLS on profiles, and member_directory exposed
-- member email and phone to anyone holding the public anon key. Supabase's
-- Security Advisor flags both as "Security Definer View" errors.
--
-- Fix: drop both views. This closes the exposure completely with no effect
-- on the running site. If a public directory view is ever wanted again,
-- recreate it WITH (security_invoker = true) and without email/phone.
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public_directory;
DROP VIEW IF EXISTS member_directory;
