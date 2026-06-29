-- Fix: duplicate approved profiles broke login
--
-- Background: three of MK's accounts (mk@, mk-member@, mk-admin@) each had more
-- than one approved profile row from being seeded twice on 2026-05-23. The app
-- loads a member's profile with .maybeSingle() (expects exactly one approved
-- row), so duplicates caused an error that signed the user out at login.
--
-- On 2026-06-29 the extra approved rows were demoted to 'rejected' so each
-- account has exactly one approved profile. This file (1) deletes those leftover
-- duplicate rows for a clean table, and (2) adds a constraint so it can't recur.
--
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).

-- ── 1. Delete the leftover duplicate rows for MK's three accounts ─────────────
-- These are the rejected duplicates only. The single approved profile that each
-- account keeps is NOT touched. Safe to run; affects only these test/owner rows.

DELETE FROM profiles
WHERE email IN (
  'mk@artisticaccessibility.com',
  'mk-member@artisticaccessibility.com',
  'mk-admin@artisticaccessibility.com'
)
AND status = 'rejected';

-- ── 2. Prevent recurrence: one approved profile per user ─────────────────────
-- A partial unique index so the same auth user can never have two approved
-- profiles again. (Unlinked rows with user_id NULL are unaffected.)

CREATE UNIQUE INDEX IF NOT EXISTS one_approved_profile_per_user
  ON profiles (user_id)
  WHERE status = 'approved' AND user_id IS NOT NULL;

-- ── 3. Verify (optional): each account should now show exactly 1 row ──────────
-- SELECT email, count(*) FROM profiles
-- WHERE email LIKE 'mk%@artisticaccessibility.com'
-- GROUP BY email;
