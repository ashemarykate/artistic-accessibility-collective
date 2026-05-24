-- Seed: Mary Kate Ashe's member profile
-- Run in Supabase SQL Editor.
--
-- Uses insert-if-new + always-update pattern because profiles.email
-- has no unique constraint (ON CONFLICT (email) would fail).
--
-- Replace 'mk@artisticaccessibility.com' if her auth account uses
-- a different email address.

-- ── 1. Insert profile only if one doesn't already exist for this email ────────

INSERT INTO profiles (
  full_name, display_name, pronouns, username, email,
  location_city, location_state, location_country,
  specialties, languages, certifications,
  years_of_experience, profile_type, status, public_visible,
  email_public, user_id
)
SELECT
  'Mary Kate Ashe', 'Mary Kate Ashe', 'she/her', 'mkashe',
  'mk@artisticaccessibility.com',
  'Chicago', 'IL', 'US',
  ARRAY['Educator','Creative Accessibility Designer','Theatrical Caption Designer',
        'Post-Production Film Accessibility','Accessibility Consultant','Event Coordinator'],
  ARRAY['English', 'American Sign Language (ASL)'],
  ARRAY[]::TEXT[],
  12, 'individual', 'approved', false, false,
  (SELECT id FROM auth.users WHERE email = 'mk@artisticaccessibility.com')
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'mk@artisticaccessibility.com'
);

-- ── 2. Update the profile (whether just inserted or already existed) ──────────

UPDATE profiles SET
  display_name        = 'Mary Kate Ashe',
  pronouns            = 'she/her',
  username            = 'mkashe',
  location_city       = 'Chicago',
  location_state      = 'IL',
  location_country    = 'US',
  specialties         = ARRAY['Educator','Creative Accessibility Designer','Theatrical Caption Designer',
                               'Post-Production Film Accessibility','Accessibility Consultant','Event Coordinator'],
  languages           = ARRAY['English', 'American Sign Language (ASL)'],
  years_of_experience = 12,
  status              = 'approved',
  user_id             = (SELECT id FROM auth.users WHERE email = 'mk@artisticaccessibility.com')
WHERE email = 'mk@artisticaccessibility.com';

-- ── 3. Set approved_at if not already set ─────────────────────────────────────

UPDATE profiles SET approved_at = now()
WHERE email = 'mk@artisticaccessibility.com' AND approved_at IS NULL;

-- ── 4. Ensure she is in admin_users ──────────────────────────────────────────

INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'mk@artisticaccessibility.com'
ON CONFLICT DO NOTHING;
