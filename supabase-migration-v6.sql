-- Migration v6: Professional detail fields + student flag
-- Run in Supabase SQL Editor after v1–v5.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS work_category       TEXT,
  ADD COLUMN IF NOT EXISTS event_sizes         TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_status TEXT     DEFAULT 'By Inquiry',
  ADD COLUMN IF NOT EXISTS timezone            TEXT,
  ADD COLUMN IF NOT EXISTS communication_style TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_samples_url    TEXT,
  ADD COLUMN IF NOT EXISTS new_to_roles        TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education           TEXT,
  ADD COLUMN IF NOT EXISTS rate_info           TEXT,
  ADD COLUMN IF NOT EXISTS career_highlights   TEXT,
  ADD COLUMN IF NOT EXISTS fun_fact            TEXT,
  ADD COLUMN IF NOT EXISTS favorite_event      TEXT,
  ADD COLUMN IF NOT EXISTS software_skills     TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_contact   TEXT     DEFAULT 'Email',
  ADD COLUMN IF NOT EXISTS experience_level    TEXT     DEFAULT 'entry',
  ADD COLUMN IF NOT EXISTS is_student          BOOLEAN  DEFAULT false;

-- Valid experience levels:  'student' | 'entry' | 'mid' | 'seasoned'
-- Valid availability_status: 'Available Now' | 'Booking Out 1 Month' |
--   'Booking Out 3 Months' | 'Booking Out 6 Months' | 'By Inquiry' | 'Not Available'

-- Set existing approved members to 'seasoned' as a sensible default.
-- Admins / members can correct this via profile edit.
UPDATE profiles
SET experience_level = 'seasoned'
WHERE status = 'approved' AND experience_level = 'entry';

COMMENT ON COLUMN profiles.is_student IS
  'True for student/emerging-professional members — shows a Student badge on profile and directory cards.';
COMMENT ON COLUMN profiles.experience_level IS
  'student | entry | mid | seasoned';
COMMENT ON COLUMN profiles.availability_status IS
  'Available Now | Booking Out 1 Month | Booking Out 3 Months | Booking Out 6 Months | By Inquiry | Not Available';
