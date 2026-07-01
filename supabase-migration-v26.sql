-- Migration v26: Profile personalization fields
-- Run in Supabase SQL Editor after v25.
--
-- Adds the fields for the new "Your Story", "What You're Great At", and
-- "Always Growing" sections on the profile edit form.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS passionate_about TEXT,
  ADD COLUMN IF NOT EXISTS strengths        TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS not_great_at     TEXT,
  ADD COLUMN IF NOT EXISTS learning_now     TEXT,
  ADD COLUMN IF NOT EXISTS want_to_learn    TEXT;

COMMENT ON COLUMN profiles.passionate_about IS
  'Freeform: what this member is passionate about in their work.';
COMMENT ON COLUMN profiles.strengths IS
  'Tag list: what this member is really good at, e.g. Production Management, Schedule Building, Grip & Lighting Setups, Technical Skills.';
COMMENT ON COLUMN profiles.not_great_at IS
  'Freeform: things this member is upfront about not being great at yet.';
COMMENT ON COLUMN profiles.learning_now IS
  'Freeform: skills or topics this member is actively learning right now.';
COMMENT ON COLUMN profiles.want_to_learn IS
  'Freeform: skills or topics this member wants to learn in the future. Distinct from new_to_roles (specific job roles).';
