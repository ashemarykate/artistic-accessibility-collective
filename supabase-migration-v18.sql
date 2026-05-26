-- ============================================================
-- Migration v18: ACC badge on comments + admin diagnostic
-- Run in Supabase SQL Editor after v17.
-- ============================================================

-- 1. Add is_acc to item_comments
--    Stamped at post time: true for Collective members and admins.
--    Access Card members can comment too — they just won't have the badge.
ALTER TABLE item_comments
  ADD COLUMN IF NOT EXISTS is_acc boolean NOT NULL DEFAULT false;

-- 2. Expand item_type to include resource and event pages
--    (existing 'library' and 'cinema' rows are unaffected)
ALTER TABLE item_comments
  DROP CONSTRAINT IF EXISTS item_comments_item_type_check;

ALTER TABLE item_comments
  ADD CONSTRAINT item_comments_item_type_check
    CHECK (item_type IN ('library', 'cinema', 'resource', 'event'));

-- 3. Allow Access Card members to comment
--    The existing insert policy requires auth.uid() = user_id which is fine —
--    Access Card users are authenticated. No policy change needed.


-- ============================================================
-- ADMIN DIAGNOSTIC
-- ============================================================
-- If two users you added as admin aren't showing the ✦ Admin badge,
-- the most common cause is that the wrong UUID was inserted.
-- admin_users needs the Supabase AUTH user_id, not the profile's id.
-- These two UUIDs are different for every member.
--
-- Step 1 — run this to see what's in admin_users vs what it should be:
--
-- SELECT
--   au.user_id              AS "in admin_users",
--   p.id                    AS "profile.id",
--   p.user_id               AS "profile.user_id (correct one)",
--   p.full_name,
--   p.email,
--   CASE
--     WHEN au.user_id = p.user_id THEN '✓ correct'
--     WHEN au.user_id = p.id      THEN '✗ WRONG — profile.id was used'
--     ELSE '? no matching profile'
--   END AS status
-- FROM admin_users au
-- LEFT JOIN profiles p
--   ON p.user_id = au.user_id OR p.id::text = au.user_id::text;
--
--
-- Step 2 — if status shows "WRONG", fix it by email address:
--    Replace 'their@email.com' with the actual email of each admin.
--
-- BEGIN;
--   -- Remove bad rows
--   DELETE FROM admin_users;
--
--   -- Re-insert using the correct auth user_id (looked up via their email on the profile)
--   INSERT INTO admin_users (user_id)
--   SELECT p.user_id
--   FROM profiles p
--   WHERE p.email IN (
--     'admin1@example.com',
--     'admin2@example.com',
--     'your-own-email@example.com'
--   )
--   AND p.user_id IS NOT NULL
--   ON CONFLICT DO NOTHING;
-- COMMIT;
--
-- Step 3 — verify the fix:
-- SELECT au.user_id, p.full_name, p.email
-- FROM admin_users au
-- JOIN profiles p ON p.user_id = au.user_id;
