-- Artistic Accessibility Collective - Migration v2
-- Run this in Supabase SQL Editor AFTER the original migration

-- ============================================
-- ADD COLUMNS TO PROFILES
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS has_captioning BOOLEAN,
  ADD COLUMN IF NOT EXISTS profile_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS invite_code_used TEXT,
  ADD COLUMN IF NOT EXISTS email_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS travel_distance TEXT,
  ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS accessibility_features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services_provided TEXT;

-- ============================================
-- INVITE CODES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  assigned_to_name TEXT,
  assigned_to_email TEXT,
  notes TEXT,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by_profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_used ON invite_codes(used);

-- RLS for invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read a code to validate it (but only code + used status needed)
CREATE POLICY "Anyone can validate invite codes"
  ON invite_codes FOR SELECT
  USING (true);

CREATE POLICY "Admins manage invite codes"
  ON invite_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TESTER FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tester_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tester_round INTEGER DEFAULT 1,

  -- "What would make this more useful" angle
  most_useful_feature TEXT,
  missing_profile_info TEXT,
  work_use_case TEXT,
  recommend_reason TEXT,
  confusing_aspects TEXT,
  resources_wanted TEXT,
  community_feature_wish TEXT,
  additional_feedback TEXT,

  UNIQUE(profile_id, tester_round)
);

CREATE TRIGGER tester_feedback_updated_at BEFORE UPDATE ON tester_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE tester_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can submit their own feedback"
  ON tester_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

CREATE POLICY "Members can update their own feedback"
  ON tester_feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can read their own feedback"
  ON tester_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all feedback"
  ON tester_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTION: GENERATE INVITE CODES
-- Call this from admin to batch-create codes:
--   SELECT generate_invite_codes(50);
-- ============================================

CREATE OR REPLACE FUNCTION generate_invite_codes(count INTEGER)
RETURNS TABLE(generated_code TEXT) AS $$
DECLARE
  new_code TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..count LOOP
    new_code := upper(
      substring(md5(random()::text) from 1 for 4) || '-' ||
      substring(md5(random()::text) from 1 for 4)
    );
    INSERT INTO invite_codes(code) VALUES (new_code)
    ON CONFLICT (code) DO NOTHING;
    RETURN QUERY SELECT new_code;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
