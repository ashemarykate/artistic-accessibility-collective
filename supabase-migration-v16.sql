-- Migration v16: Volunteering availability on profiles
--
-- Adds two new columns to profiles:
--   volunteer_status  TEXT  — 'yes' | 'no' | NULL
--                             NULL means the member skipped the question (hidden on profile)
--   volunteer_notes   TEXT  — free-text examples, only shown when volunteer_status = 'yes'

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS volunteer_status TEXT;
  -- 'yes'  → open to volunteering for the right gig, shown on profile
  -- 'no'   → not open right now, hidden on profile
  -- NULL   → question not answered, hidden on profile

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS volunteer_notes TEXT;
  -- e.g. "I've interpreted for the Chicago Community Arts Fund and local theater nonprofits"
  -- Only displayed when volunteer_status = 'yes'

CREATE INDEX IF NOT EXISTS idx_profiles_volunteer_status
  ON profiles(volunteer_status);
