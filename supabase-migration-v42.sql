-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v42 · Let people claim their own production invites
-- Run in Supabase SQL Editor after v41.
--
-- Why: a producer adds someone to a show before that person has a Collective
-- account, leaving a production_team row with an invited_email and no user_id.
-- Today the only way to connect the two is a producer running SQL by hand
-- after the person signs up. That does not scale past one show and it means
-- somebody is always waiting on Mary Kate.
--
-- This adds one function the app calls after sign in. It attaches the caller
-- to any team row that was set aside for their email address. It works for
-- every production, so nothing here is specific to 2006.
--
-- SECURITY NOTES, because this function connects an identity to a permission:
--
--   1. It only ever writes auth.uid(). A caller cannot name a different user.
--   2. It reads the caller's email from auth.users, never from an argument,
--      so a caller cannot claim someone else's invitation by passing their
--      address in.
--   3. It requires a CONFIRMED email. Without that check, somebody could sign
--      up with an address they do not control, leave it unverified, and claim
--      whatever was waiting for the real person. Magic link sign in confirms
--      on first use, so this costs a normal user nothing.
--   4. It never touches team_role. Whatever the producer set is what you get,
--      so claiming an invite cannot be an escalation.
--   5. It refuses to attach you twice to one production.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION claim_production_invites()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email TEXT;
  confirmed    TIMESTAMPTZ;
  linked       INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  SELECT lower(u.email), u.email_confirmed_at
    INTO caller_email, confirmed
  FROM auth.users u
  WHERE u.id = auth.uid();

  -- No verified address, no claim. See note 3 above.
  IF caller_email IS NULL OR confirmed IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE production_team pt
  SET user_id = auth.uid()
  WHERE pt.user_id IS NULL
    AND pt.invited_email IS NOT NULL
    AND lower(pt.invited_email) = caller_email
    AND NOT EXISTS (
      SELECT 1 FROM production_team other
      WHERE other.production_id = pt.production_id
        AND other.user_id = auth.uid()
    );

  GET DIAGNOSTICS linked = ROW_COUNT;
  RETURN linked;
END $$;

GRANT EXECUTE ON FUNCTION claim_production_invites() TO authenticated;

COMMENT ON FUNCTION claim_production_invites() IS
  'Attaches the signed in user to any production_team row held for their
   confirmed email address. Returns how many rows were linked. Safe to call on
   every sign in: it does nothing when there is nothing waiting.';
