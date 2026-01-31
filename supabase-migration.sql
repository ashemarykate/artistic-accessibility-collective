-- Artistic Accessibility Collective - Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  
  -- Visibility
  public_visible BOOLEAN DEFAULT false,
  
  -- Profile data
  full_name TEXT NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Professional info
  specialties TEXT[],
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'US',
  willing_to_travel BOOLEAN DEFAULT false,
  
  -- Social
  linkedin_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  
  -- Metadata
  submission_notes TEXT,
  admin_notes TEXT
);

CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_public_visible ON profiles(public_visible);
CREATE INDEX idx_profiles_specialties ON profiles USING GIN(specialties);

-- Endorsements Table
CREATE TABLE endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  endorser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endorsed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  note TEXT,
  
  UNIQUE(endorser_id, endorsed_id),
  CHECK (endorser_id != endorsed_id)
);

CREATE INDEX idx_endorsements_endorsed ON endorsements(endorsed_id);

-- Resources Table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  
  -- Visibility
  visibility TEXT DEFAULT 'public',
  custom_access_list UUID[],
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  
  -- Organization
  tags TEXT[],
  category TEXT,
  
  -- Metadata
  difficulty TEXT,
  admin_notes TEXT
);

CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_visibility ON resources(visibility);
CREATE INDEX idx_resources_tags ON resources USING GIN(tags);

-- Resource Creators Table
CREATE TABLE resource_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  
  UNIQUE(resource_id, profile_id)
);

CREATE INDEX idx_resource_creators_resource ON resource_creators(resource_id);
CREATE INDEX idx_resource_creators_profile ON resource_creators(profile_id);

-- Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES admin_users(id),
  role TEXT DEFAULT 'admin'
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Endorsement count helper
CREATE OR REPLACE FUNCTION get_endorsement_count(profile_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM endorsements 
  WHERE endorsed_id = profile_uuid;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- VIEWS
-- ============================================

-- Public Directory View
CREATE VIEW public_directory AS
SELECT 
  p.id,
  p.full_name,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.specialties,
  p.location_city,
  p.location_state,
  p.willing_to_travel,
  get_endorsement_count(p.id) as endorsement_count
FROM profiles p
WHERE p.status = 'approved' AND p.public_visible = true;

-- Member Directory View
CREATE VIEW member_directory AS
SELECT 
  p.id,
  p.full_name,
  p.display_name,
  p.email,
  p.phone,
  p.bio,
  p.avatar_url,
  p.specialties,
  p.location_city,
  p.location_state,
  p.willing_to_travel,
  p.website,
  p.linkedin_url,
  get_endorsement_count(p.id) as endorsement_count
FROM profiles p
WHERE p.status = 'approved';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles readable"
  ON profiles FOR SELECT
  USING (status = 'approved' AND public_visible = true);

CREATE POLICY "Members see all approved profiles"
  ON profiles FOR SELECT
  USING (
    status = 'approved' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND status = 'approved'
    )
  );

CREATE POLICY "Admins can do everything with profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Endorsements Policies
CREATE POLICY "Endorsements visible to all"
  ON endorsements FOR SELECT
  USING (true);

CREATE POLICY "Approved members can create endorsements"
  ON endorsements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = endorser_id 
      AND user_id = auth.uid() 
      AND status = 'approved'
    )
  );

CREATE POLICY "Users can delete their own endorsements"
  ON endorsements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = endorser_id 
      AND user_id = auth.uid()
    )
  );

-- Resources Policies
CREATE POLICY "Public resources readable by all"
  ON resources FOR SELECT
  USING (status = 'approved' AND visibility = 'public');

CREATE POLICY "Members see member resources"
  ON resources FOR SELECT
  USING (
    status = 'approved' 
    AND visibility = 'members_only'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND status = 'approved'
    )
  );

CREATE POLICY "Custom access resources readable"
  ON resources FOR SELECT
  USING (
    status = 'approved' 
    AND visibility = 'custom'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND id = ANY(custom_access_list)
    )
  );

CREATE POLICY "Admins manage resources"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Resource Creators Policies
CREATE POLICY "Resource creators readable by all"
  ON resource_creators FOR SELECT
  USING (true);

CREATE POLICY "Admins manage resource creators"
  ON resource_creators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Admin Users Policies
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage admins"
  ON admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- ============================================
-- INITIAL DATA
-- ============================================

-- Note: After running this migration, manually create your first admin user:
-- INSERT INTO admin_users (user_id, role) 
-- VALUES ('your-auth-user-id-here', 'super_admin');
