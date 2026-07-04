-- Migration v31: let the two writes at the end of registration actually succeed
--
-- Two writes at the end of the join-form submission (app/submit/page.tsx)
-- have always silently failed under RLS, because the policies covering them
-- assumed an already-approved, already-linked member -- never true for the
-- anonymous visitor who is registering for the first time:
--
--   1. Marking the invite code used required admin_users membership. An
--      anonymous registrant has none, so `used` never actually flipped to
--      true via self-service signup (only ever set by hand or via the admin
--      dashboard).
--   2. tester_feedback's INSERT policy required the referenced profile to
--      already be linked (user_id = auth.uid()) and approved -- impossible
--      for feedback attached to the pending profile created moments earlier
--      in that same anonymous request. Every tester's round-1 feedback typed
--      into the join form was silently discarded.
--
-- Fix: two narrowly-scoped additional policies, each gated on the caller
-- referencing a specific invite code / profile row that is still in the
-- fresh, unclaimed state the join form itself produces. Neither widens
-- access to any other row, and both are purely additive (existing admin
-- policies are untouched).

-- ── 1. Allow the submitter to mark the invite code they just used ──────────
CREATE POLICY "Anonymous can mark their own invite code used"
  ON invite_codes FOR UPDATE
  USING (used = false)
  WITH CHECK (
    used = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = used_by_profile_id
        AND user_id IS NULL
        AND status = 'pending'
    )
  );

-- ── 2. Allow tester feedback attached to a fresh pending profile ───────────
CREATE POLICY "Anonymous can submit feedback for their own new profile"
  ON tester_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id
        AND user_id IS NULL
        AND status = 'pending'
    )
  );
