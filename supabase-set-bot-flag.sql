-- Flip AAC-Bot's is_bot flag so its 🤖 badge shows up.
-- Run in Supabase SQL Editor AFTER supabase-migration-v25.sql, and after
-- AAC-Bot's profile has been submitted through /submit and approved
-- (it was: real invite code D86F-B83C, submitted and approved 2026-07-01).

UPDATE profiles SET is_bot = true
WHERE email = 'bot@artisticaccessibility.com';
