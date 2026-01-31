# Database Schema - Artistic Accessibility Collective

Supabase project supporting:
- Professional Registry (directory)
- Learning Resources (training materials)

---

## Tables

### `profiles`
Professional registry members

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Supabase auth link
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  
  -- Visibility
  public_visible BOOLEAN DEFAULT false, -- Show on public directory
  
  -- Profile data
  full_name TEXT NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Professional info
  specialties TEXT[], -- ['ASL interpreter', 'Captioner', 'Event accessibility']
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'US',
  willing_to_travel BOOLEAN DEFAULT false,
  
  -- Social
  linkedin_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  
  -- Metadata
  submission_notes TEXT, -- What they wrote when applying
  admin_notes TEXT -- Internal notes
);

CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_public_visible ON profiles(public_visible);
CREATE INDEX idx_profiles_specialties ON profiles USING GIN(specialties);
```

---

### `endorsements`
Peer vouches - "I worked with them and it was great"

```sql
CREATE TABLE endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  endorser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endorsed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Optional context
  note TEXT, -- "Worked together on XYZ event, great communicator"
  
  UNIQUE(endorser_id, endorsed_id),
  CHECK (endorser_id != endorsed_id) -- Can't endorse yourself
);

CREATE INDEX idx_endorsements_endorsed ON endorsements(endorsed_id);
```

---

### `resources`
Training materials, videos, custom workshops

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  
  -- Visibility
  visibility TEXT DEFAULT 'public', -- public | members_only | custom
  custom_access_list UUID[], -- For custom trainings - array of profile IDs
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT, -- Could be YouTube, Vimeo, S3, etc.
  duration_minutes INTEGER,
  
  -- Organization
  tags TEXT[], -- ['ASL basics', 'Event planning', 'Audio description']
  category TEXT, -- 'Video tutorial' | 'Workshop recording' | 'Guide'
  
  -- Metadata
  difficulty TEXT, -- beginner | intermediate | advanced
  admin_notes TEXT
);

CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_visibility ON resources(visibility);
CREATE INDEX idx_resources_tags ON resources USING GIN(tags);
```

---

### `resource_creators`
Many-to-many: Resources can have multiple creators, creators can have multiple resources

```sql
CREATE TABLE resource_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT, -- 'Instructor' | 'Guest speaker' | 'Producer'
  
  UNIQUE(resource_id, profile_id)
);

CREATE INDEX idx_resource_creators_resource ON resource_creators(resource_id);
CREATE INDEX idx_resource_creators_profile ON resource_creators(profile_id);
```

---

## Row-Level Security (RLS) Policies

### Profiles

**Public can see:**
```sql
-- Only approved profiles marked as public_visible
CREATE POLICY "Public profiles readable"
  ON profiles FOR SELECT
  USING (status = 'approved' AND public_visible = true);
```

**Registry members can see:**
```sql
-- All approved profiles (public + private)
CREATE POLICY "Members see all approved"
  ON profiles FOR SELECT
  USING (
    status = 'approved' 
    AND auth.uid() IN (SELECT user_id FROM profiles WHERE status = 'approved')
  );
```

**Admins can see:**
```sql
-- Everything (including pending/rejected)
CREATE POLICY "Admins see all"
  ON profiles FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );
```

### Resources

**Public can see:**
```sql
CREATE POLICY "Public resources readable"
  ON resources FOR SELECT
  USING (status = 'approved' AND visibility = 'public');
```

**Members can see:**
```sql
CREATE POLICY "Members see approved resources"
  ON resources FOR SELECT
  USING (
    status = 'approved' 
    AND (
      visibility IN ('public', 'members_only')
      OR auth.uid() = ANY(custom_access_list) -- Custom access
    )
    AND auth.uid() IN (SELECT user_id FROM profiles WHERE status = 'approved')
  );
```

---

## Admin Table

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES admin_users(id),
  role TEXT DEFAULT 'admin' -- Future: 'super_admin', 'moderator', etc.
);
```

---

## Functions & Triggers

### Auto-update `updated_at`

```sql
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
```

### Endorsement count helper

```sql
CREATE OR REPLACE FUNCTION get_endorsement_count(profile_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM endorsements 
  WHERE endorsed_id = profile_uuid;
$$ LANGUAGE SQL STABLE;
```

---

## Views (Optional - for convenience)

### Public Directory View

```sql
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
```

### Member Directory View

```sql
CREATE VIEW member_directory AS
SELECT 
  p.id,
  p.full_name,
  p.display_name,
  p.email, -- Members can see email
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
```

---

## Next Steps

1. **Set up Supabase project** (use existing credentials from `~/keys.txt`)
2. **Run these SQL migrations** in the Supabase SQL editor
3. **Configure Auth** (email/password + magic link?)
4. **Storage buckets** for avatars and video thumbnails
5. **Build admin panel** (approve/reject workflow)
6. **Build public submission form**

---

## Notes

- **Endorsements display:** Fetch endorsed profile's avatar_url and show as icons
- **Custom trainings:** Use `custom_access_list` to grant specific members access
- **Search:** Add full-text search on profiles.bio, profiles.specialties, resources.title later
- **Analytics:** Track view counts? Popular resources? (add later)

This schema is flexible enough to grow with the project.
