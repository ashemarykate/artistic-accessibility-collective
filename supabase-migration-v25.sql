-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v25 · Bot/demo account flag
-- Run in Supabase SQL Editor after v24.
--
-- Adds an is_bot flag so AAC-Bot (the friendly demo mascot member) can show a
-- 🤖 badge on its profile and be told apart from real members. AAC-Bot is a
-- showcase: a fully filled-out profile testers can look at to see what a great
-- profile looks like. Seeded by supabase-seed-bot.sql.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;
