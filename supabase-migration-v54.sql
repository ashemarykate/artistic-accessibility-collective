-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v54 · "Tell me the moment this opens"
-- Run in Supabase SQL Editor. Needs productions (v38). Safe to re-run.
--
-- Why: a production can be announced weeks before registration opens. All
-- Access went up with its date, price and venue, but registration does not open
-- until August 19. Everyone who reads the announcement in between is someone who
-- wanted a seat and had nowhere to say so.
--
-- This is deliberately NOT the RSVP table (v38). RSVPs are signed in only,
-- because "I'm attending" belongs on your card. This is the opposite case: it
-- has to work for a stranger arriving from Instagram with no account, which
-- makes it a public write endpoint holding email addresses. That shapes every
-- decision below.
--
-- ⚠ READ THE SECURITY NOTES IN SECTION 2 BEFORE CHANGING ANY POLICY HERE.
-- ─────────────────────────────────────────────────────────────────────────────

-- ============================================
-- 1. THE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS production_notify_requests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID        NOT NULL REFERENCES productions(id) ON DELETE CASCADE,

  email         TEXT        NOT NULL
    CONSTRAINT production_notify_email_shape
    -- Deliberately loose. A strict pattern rejects real addresses, and the only
    -- real test of an address is whether mail to it arrives.
    CHECK (position('@' in email) > 1 AND length(email) BETWEEN 6 AND 320),

  /** Optional. Asked for so the eventual email can open with a name. */
  name          TEXT,

  /** Set when the "we are open" email goes out, so nobody is mailed twice. */
  notified_at   TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE production_notify_requests IS
  'People who asked to be told when a production opens for registration. Written
   by anonymous visitors, readable only by admins. Not a mailing list: consent
   here covers one email about one production.';
COMMENT ON COLUMN production_notify_requests.notified_at IS
  'Stamp this when you send the announcement, so a second send can skip anyone
   already told.';

-- One request per address per production. Case and whitespace insensitive,
-- because Someone@Example.com and someone@example.com are one person.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notify_unique_email_per_production
  ON production_notify_requests (production_id, lower(btrim(email)));

CREATE INDEX IF NOT EXISTS idx_notify_by_production
  ON production_notify_requests (production_id, created_at DESC);

-- Finding who still needs telling, which is the query that actually gets run.
CREATE INDEX IF NOT EXISTS idx_notify_pending
  ON production_notify_requests (production_id)
  WHERE notified_at IS NULL;

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================
-- The important part. This table holds email addresses given by members of the
-- public, so:
--
--   INSERT  anon and authenticated may add a row. They have to be able to, or
--           the box does not work for the people it exists for.
--
--   SELECT  NOBODY except admins. Not anon, not authenticated, not even the
--           person who signed up. There is no policy granting it, and no policy
--           means no access.
--
--           This is the rule to not "helpfully" relax later. A SELECT policy of
--           USING (true), the pattern used on content_favorites so public like
--           counts work, would publish every address in this table to anyone who
--           can reach the API. If a count is ever needed on the page, add a
--           SECURITY DEFINER function that returns only a number.
--
--   UPDATE  admins only, and the only intended use is stamping notified_at.
--   DELETE  admins only, so a request can be honoured when someone asks to be
--           removed.

ALTER TABLE production_notify_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone may ask to be notified"   ON production_notify_requests;
DROP POLICY IF EXISTS "Admins read notify requests"     ON production_notify_requests;
DROP POLICY IF EXISTS "Admins update notify requests"   ON production_notify_requests;
DROP POLICY IF EXISTS "Admins delete notify requests"   ON production_notify_requests;

-- Anyone can add themselves, but only to a production that is actually
-- published and actually accepting these. Without that EXISTS check the table
-- would accept rows pointing at drafts, which leaks that a draft exists.
CREATE POLICY "Anyone may ask to be notified"
  ON production_notify_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    notified_at IS NULL
    AND EXISTS (
      SELECT 1 FROM productions p
      WHERE p.id = production_notify_requests.production_id
        AND p.status = 'published'
        AND p.notify_enabled = true
    )
  );

CREATE POLICY "Admins read notify requests"
  ON production_notify_requests FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins update notify requests"
  ON production_notify_requests FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins delete notify requests"
  ON production_notify_requests FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================
-- 3. THE SWITCH ON THE PRODUCTION
-- ============================================
-- Default true so the box appears on its own for anything announced early.
-- The page hides it anyway once a real registration link exists, so in practice
-- this is only for turning it off deliberately.

ALTER TABLE productions
  ADD COLUMN IF NOT EXISTS notify_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN productions.notify_enabled IS
  'Whether to offer the "tell me when this opens" box. The page only shows it
   when there is no ticket link anywhere on the production, so this exists to
   suppress it, not to summon it.';

-- ============================================
-- 4. GRANTS
-- ============================================
-- No SELECT for anon, on purpose. See section 2.

GRANT INSERT                 ON production_notify_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON production_notify_requests TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- To check the permissions did what they should, from a signed-out client:
--   INSERT should succeed. SELECT should come back empty rather than erroring,
--   which is RLS filtering every row out. If a SELECT ever returns addresses to
--   a signed-out caller, something above has been undone.
-- ─────────────────────────────────────────────────────────────────────────────
