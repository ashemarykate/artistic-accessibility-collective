-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v34 · Member referral system + credential fields + photo gallery
-- Run in Supabase SQL Editor after v33.
--
-- Background: a `recommendations` table, two RPC functions
-- (get_available_recommendations, refresh_monthly_recommendations), and
-- several `profiles` columns (colleges, company_event_link,
-- professional_certifications, profile_types, trainings_completed,
-- recommendations_available, last_recommendation_refresh) already exist on
-- the live database, added by hand at some point and never captured in a
-- migration file. This migration:
--   1. Documents that existing schema here (IF NOT EXISTS everywhere, so this
--      is a no-op against the columns/table that already exist live, but
--      creates them correctly on a fresh/local database).
--   2. Adds the two genuinely new columns needed for this feature
--      (gallery_photos, recommendation_code_used).
--   3. Applies RLS + functions UNCONDITIONALLY (not guarded by IF NOT
--      EXISTS), since those are what actually need to take effect on the
--      live, already-existing `recommendations` table.
--
-- Referral rules: Collective members (member_type = 'collective') get 3
-- referral slots per month, lazily refreshed on read (no cron required).
-- Access Card members get none. An accepted referral lands in the normal
-- Pending queue for admin review, same as an admin-issued invite code.
-- ─────────────────────────────────────────────────────────────────────────────

-- ============================================
-- 1. PROFILES COLUMNS
-- ============================================
-- Most of these already exist live (documented here for parity with a fresh
-- DB). Only gallery_photos and recommendation_code_used are genuinely new.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS colleges                     TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_event_link            TEXT,
  ADD COLUMN IF NOT EXISTS professional_certifications   TEXT,
  ADD COLUMN IF NOT EXISTS profile_types                 TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trainings_completed            TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommendations_available      INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_recommendation_refresh     TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS gallery_photos                 TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommendation_code_used        TEXT;

COMMENT ON COLUMN profiles.colleges IS
  'Colleges/institutions the member wants to shout out';
COMMENT ON COLUMN profiles.company_event_link IS
  'Website link for event/company profiles';
COMMENT ON COLUMN profiles.professional_certifications IS
  'Professional certifications for service providers';
COMMENT ON COLUMN profiles.profile_types IS
  'Array of profile types: service_provider, artist, event_company';
COMMENT ON COLUMN profiles.trainings_completed IS
  'List of training IDs or names completed';
COMMENT ON COLUMN profiles.gallery_photos IS
  'Public Storage URLs for additional photos beyond the profile picture, capped at 6 in the app';
COMMENT ON COLUMN profiles.recommendation_code_used IS
  'invitation_code from recommendations, set when a profile was created by redeeming a member referral (parallel to invite_code_used for admin-issued codes)';

-- ============================================
-- 2. RECOMMENDATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS recommendations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID REFERENCES profiles(id),        -- set once the referral is redeemed
  recommender_id    UUID NOT NULL REFERENCES profiles(id),
  recommended_name  TEXT,
  recommended_email TEXT NOT NULL,
  invitation_code   TEXT NOT NULL,
  personal_message  TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  sent_at           TIMESTAMPTZ DEFAULT NOW(),
  accepted_at       TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_invitation_code ON recommendations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommender     ON recommendations(recommender_id);

-- Add a UNIQUE constraint on invitation_code defensively: CREATE TABLE IF NOT
-- EXISTS is a no-op against the already-existing live table, so this can't be
-- assumed to already be there.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recommendations_invitation_code_key'
  ) THEN
    ALTER TABLE recommendations ADD CONSTRAINT recommendations_invitation_code_key UNIQUE (invitation_code);
  END IF;
END $$;

DROP TRIGGER IF EXISTS recommendations_updated_at ON recommendations;
CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. RLS ON RECOMMENDATIONS (unconditional — this table already exists live)
-- ============================================

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Anyone can look up a code to validate it (same exposure level invite_codes
-- already has, needed for the unauthenticated redemption check in /submit).
DROP POLICY IF EXISTS "Anyone can validate a recommendation by invitation code" ON recommendations;
CREATE POLICY "Anyone can validate a recommendation by invitation code"
  ON recommendations FOR SELECT
  USING (true);

-- A member can insert their own recommendation. Quota arithmetic (check
-- available > 0, then decrement) is NOT expressible safely here without a
-- race condition, so it lives in send_recommendation() below instead; this
-- policy just enforces identity + tier.
DROP POLICY IF EXISTS "Members can insert their own recommendations" ON recommendations;
CREATE POLICY "Members can insert their own recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = recommender_id
        AND user_id = auth.uid()
        AND member_type = 'collective'
    )
  );

-- Mirrors invite_codes' v31 "Anonymous can mark their own invite code used"
-- policy: lets the anonymous /submit flow flip status -> accepted and attach
-- the freshly-created pending profile.
DROP POLICY IF EXISTS "Anonymous can accept their own recommendation" ON recommendations;
CREATE POLICY "Anonymous can accept their own recommendation"
  ON recommendations FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (
    status = 'accepted'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id
        AND user_id IS NULL
        AND status = 'pending'
    )
  );

DROP POLICY IF EXISTS "Admins manage all recommendations" ON recommendations;
CREATE POLICY "Admins manage all recommendations"
  ON recommendations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ============================================
-- 4. FUNCTIONS
-- ============================================
-- get_available_recommendations and refresh_monthly_recommendations already
-- exist live with unknown bodies (added by hand, never migrated). These
-- CREATE OR REPLACE statements match their known argument signatures exactly
-- (confirmed via PostgREST introspection), so this is a safe, intentional
-- replace, not a guess at new signatures.

-- Lazy-refresh read: called from the dashboard to display quota. Resets to 3
-- if more than a month has passed since last_recommendation_refresh, so this
-- is correct without needing a cron job.
--
-- DROP first: the live function already exists with an unknown, possibly
-- different return type, and CREATE OR REPLACE cannot change a function's
-- return type in place.
DROP FUNCTION IF EXISTS get_available_recommendations(uuid);
CREATE OR REPLACE FUNCTION get_available_recommendations(user_profile_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_type text;
  v_last_refresh timestamptz;
  v_available int;
BEGIN
  SELECT member_type, last_recommendation_refresh, recommendations_available
    INTO v_member_type, v_last_refresh, v_available
  FROM profiles
  WHERE id = user_profile_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_member_type <> 'collective' THEN
    RETURN 0;
  END IF;

  IF v_last_refresh IS NULL OR v_last_refresh < (now() - interval '1 month') THEN
    UPDATE profiles
      SET recommendations_available = 3, last_recommendation_refresh = now()
      WHERE id = user_profile_id;
    RETURN 3;
  END IF;

  -- Self-heal any stale/dirty value left over from before this function
  -- existed (e.g. this column already had rows sitting above 3 on the live
  -- database prior to this migration) rather than trusting it forever.
  IF COALESCE(v_available, 0) > 3 THEN
    UPDATE profiles SET recommendations_available = 3 WHERE id = user_profile_id;
    RETURN 3;
  END IF;

  RETURN COALESCE(v_available, 0);
END;
$$;

-- Admin-gated batch reset, for a possible future scheduled job. Not relied
-- on as the primary mechanism — the lazy refresh above is what makes the
-- quota correct without a cron job existing.
--
-- DROP first: this is the function that errored on plain CREATE OR REPLACE
-- ("cannot change return type of existing function") — the live version
-- returns something other than int.
DROP FUNCTION IF EXISTS refresh_monthly_recommendations();
CREATE OR REPLACE FUNCTION refresh_monthly_recommendations()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
    SET recommendations_available = 3, last_recommendation_refresh = now()
    WHERE member_type = 'collective'
      AND (last_recommendation_refresh IS NULL OR last_recommendation_refresh < now() - interval '1 month');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- New function: checks quota, generates a unique invitation_code, inserts
-- the recommendation row, and decrements the quota, all in one transaction
-- so a client can't send more than its available slots via a check-then-act
-- race.
CREATE OR REPLACE FUNCTION send_recommendation(
  user_profile_id uuid,
  p_recommended_name text,
  p_recommended_email text,
  p_personal_message text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available int;
  v_code text;
  v_attempts int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_profile_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_available := get_available_recommendations(user_profile_id);
  IF v_available <= 0 THEN
    RAISE EXCEPTION 'No referrals available this month';
  END IF;

  LOOP
    v_code := upper(substring(md5(random()::text) from 1 for 4) || '-' || substring(md5(random()::text) from 1 for 4));
    BEGIN
      INSERT INTO recommendations (recommender_id, recommended_name, recommended_email, invitation_code, personal_message, status, sent_at, expires_at)
      VALUES (user_profile_id, p_recommended_name, p_recommended_email, v_code, p_personal_message, 'pending', now(), now() + interval '90 days');
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts > 5 THEN
        RAISE EXCEPTION 'Could not generate a unique referral code, please try again';
      END IF;
    END;
  END LOOP;

  UPDATE profiles SET recommendations_available = recommendations_available - 1 WHERE id = user_profile_id;
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION get_available_recommendations(uuid)                    TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_monthly_recommendations()                     TO authenticated;
GRANT EXECUTE ON FUNCTION send_recommendation(uuid, text, text, text)           TO authenticated;
