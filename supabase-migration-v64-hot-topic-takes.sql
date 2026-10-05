-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v64 · Hot Topics: the "What do you think?" takes
-- Run in the Supabase SQL Editor after v63. NOT APPLIED YET.
--
-- WHAT THIS DOES, IN PLAIN WORDS
--
--   Anyone, signed in or not, can share a take on a Hot Topics page. A take
--   stays hidden until Mary Kate approves it in Admin, then Takes. This file
--   makes the two tables that hold takes and decides who may read them.
--
--   It is safe to run once. It is also safe to run again: every statement
--   checks first, so nothing is duplicated and nothing is lost.
--
--   It makes three tables: the takes, their private details, and a tiny one
--   that makes sure the "a take is waiting" email goes out once per half hour
--   however many takes arrive at the same moment.
--
-- WHY THERE ARE TWO TABLES FOR THE TAKES
--
--   Row level security works on whole rows. If one table held both the words
--   of a take and private details (the browser tag used for rate limits, the
--   signed-in user's id, the spam flag), then letting the public read approved
--   rows would hand out the private columns too, because the public API can
--   ask for any column of a row it is allowed to see.
--
--   So the split is by safety, not by topic:
--
--     topic_takes      only things that are fine to show the public.
--     topic_take_meta  everything private. Admins can read it, nobody else.
--
-- WHO CAN DO WHAT
--
--   Read approved takes ........ anyone (anon and signed in)
--   Read every take ............ admins only (is_admin())
--   Approve, reject, delete .... admins only (is_admin())
--   Read the private meta ...... admins only
--   WRITE A NEW TAKE ........... nobody through the public API. There is no
--                                insert policy on either table, on purpose.
--                                New takes are written only by our own server
--                                route (/api/hot-topics/takes) with the
--                                service role key, which is the one place that
--                                can count, rate limit, check the honeypot and
--                                say no. The anon key is printed in every
--                                page's source, so a rule in the page would be
--                                a suggestion.
--
-- THE ADMIN POLICIES use the is_admin() helper (v21), never an inline lookup
-- on admin_users, and they are written TO authenticated. A policy written TO
-- public is evaluated for signed-out visitors too, which is wasted work and
-- the wrong audience for an admin rule.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. The takes people can see ──────────────────────────────────────────────
-- Only columns that are safe to show. Nothing private goes in this table.

CREATE TABLE IF NOT EXISTS public.topic_takes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The topic's slug from lib/hot-topics-data.ts. Not a foreign key: topics
  -- live in code, not in the database.
  topic_slug    TEXT        NOT NULL CHECK (char_length(topic_slug) BETWEEN 1 AND 80),

  body          TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 600),

  -- Exactly what the person typed, or null for "no name given". Plain text.
  -- It is escaped everywhere it is shown.
  display_name  TEXT        CHECK (display_name IS NULL OR char_length(display_name) <= 60),

  -- True only when the server saw a valid signed-in session on the request.
  -- The browser cannot set this: inserts happen only in the server route.
  from_member   BOOLEAN     NOT NULL DEFAULT false,

  -- Everything starts pending. Only an admin can change it.
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

-- The page asks: this topic, approved only, newest first.
CREATE INDEX IF NOT EXISTS topic_takes_topic_status_created_idx
  ON public.topic_takes (topic_slug, status, created_at DESC);

-- Admin asks: what is pending, oldest first. The route also counts pending
-- takes to keep the queue from being flooded.
CREATE INDEX IF NOT EXISTS topic_takes_status_created_idx
  ON public.topic_takes (status, created_at);

COMMENT ON TABLE public.topic_takes IS
  'Visitor takes on Hot Topics pages. Public-safe columns only. Approved rows
   are readable by anyone; admins see and manage all. No insert policy: new
   takes are written by /api/hot-topics/takes with the service role.';


-- ── 2. The private side of each take ─────────────────────────────────────────
-- One row per take. Admins can read it. Nobody else has any access at all.

CREATE TABLE IF NOT EXISTS public.topic_take_meta (
  take_id     UUID        PRIMARY KEY REFERENCES public.topic_takes(id) ON DELETE CASCADE,

  -- Not identity. A random tag the browser keeps so the server can rate limit
  -- per browser instead of per internet address (a school or office shares
  -- one address). Clearing browser data resets it, and it proves nothing
  -- about anybody.
  device_tag  TEXT        NOT NULL,

  -- The signed-in user, when there was one. Kept private. If the account is
  -- ever deleted this goes to null and the take stays.
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Hit the word list or looked like spam. The take is still held for review
  -- like every other take. This only helps the reviewer see it first.
  flagged     BOOLEAN     NOT NULL DEFAULT false,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The rate limiter asks: how many takes has this browser tag made lately?
CREATE INDEX IF NOT EXISTS topic_take_meta_device_created_idx
  ON public.topic_take_meta (device_tag, created_at);

COMMENT ON TABLE public.topic_take_meta IS
  'Private details for each take: browser tag, user id, spam flag. Admins read
   only. Kept apart from topic_takes so the public API cannot reach it.';


-- ── 3. The alert email slots ─────────────────────────────────────────────────
-- When a take arrives, the server tries to write the number of the current half
-- hour here. The number is the primary key, so if ten takes arrive together
-- only one insert works, and only that one sends the "a take is waiting"
-- email. The database decides, not a count in the code. A row is tiny and there
-- are at most 48 a day. Service role only: no policy, no grant.

CREATE TABLE IF NOT EXISTS public.topic_take_alert_claims (
  bucket      BIGINT      PRIMARY KEY,
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.topic_take_alert_claims IS
  'One row per half hour in which the take alert email was sent. The primary key
   is what stops duplicates. Service role only.';


-- ── 4. Row level security ────────────────────────────────────────────────────

ALTER TABLE public.topic_takes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_take_meta         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_take_alert_claims ENABLE ROW LEVEL SECURITY;

-- topic_takes ------------------------------------------------------------------

DROP POLICY IF EXISTS "Approved takes are public" ON public.topic_takes;
CREATE POLICY "Approved takes are public"
  ON public.topic_takes FOR SELECT TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins read all takes" ON public.topic_takes;
CREATE POLICY "Admins read all takes"
  ON public.topic_takes FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins update takes" ON public.topic_takes;
CREATE POLICY "Admins update takes"
  ON public.topic_takes FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins delete takes" ON public.topic_takes;
CREATE POLICY "Admins delete takes"
  ON public.topic_takes FOR DELETE TO authenticated
  USING (is_admin());

-- topic_take_meta ----------------------------------------------------------------
-- Admins can read. There is deliberately no other policy: with RLS on and no
-- policy, everyone else gets nothing back.

DROP POLICY IF EXISTS "Admins read take meta" ON public.topic_take_meta;
CREATE POLICY "Admins read take meta"
  ON public.topic_take_meta FOR SELECT TO authenticated
  USING (is_admin());

-- topic_take_alert_claims ----------------------------------------------------------
-- No policy at all. Only the service role (our server route) touches it.

-- NO INSERT POLICY on either take table. See the header. The service role (our
-- server route) bypasses RLS, which is the only way a take is ever written.


-- ── 5. Belt and braces on the grants ─────────────────────────────────────────
-- RLS already refuses these. Taking the privileges away as well means a future
-- mistake in a policy cannot quietly open a door. The service role is not
-- touched by any of this.

REVOKE ALL ON public.topic_takes FROM anon;
GRANT SELECT ON public.topic_takes TO anon;
REVOKE INSERT, TRUNCATE, REFERENCES, TRIGGER ON public.topic_takes FROM authenticated;

REVOKE ALL ON public.topic_take_meta FROM anon;
REVOKE ALL ON public.topic_take_meta FROM authenticated;
GRANT SELECT ON public.topic_take_meta TO authenticated;

REVOKE ALL ON public.topic_take_alert_claims FROM anon;
REVOKE ALL ON public.topic_take_alert_claims FROM authenticated;


-- ── Check it worked ──────────────────────────────────────────────────────────
-- Run these after the migration. None of them change anything.
--
--   select count(*) from public.topic_takes;        -- 0 to start with
--   select count(*) from public.topic_take_meta;    -- 0 to start with
--   select count(*) from public.topic_take_alert_claims;  -- 0 to start with
--
--   select tablename, policyname, cmd, roles
--     from pg_policies
--    where tablename in ('topic_takes', 'topic_take_meta')
--    order by tablename, policyname;
--   -- expect 4 rows on topic_takes (public read of approved, admin read,
--   -- admin update, admin delete) and 1 row on topic_take_meta (admin read).
--   -- No INSERT policy anywhere, and none at all on topic_take_alert_claims.
