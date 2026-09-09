-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v60 · Email notifications, and the switches to turn them off
-- Run in the Supabase SQL Editor after v59. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Until now the site emailed two things: a login link, and the contact form.
-- So a member only discovered a message, or an endorsement, by happening to log
-- in. Mary Kate chose to add four: a new message, a profile approval, a new
-- endorsement, and a reminder the day before something you said you would
-- attend.
--
-- Two things this migration adds.
--
--  1. Three switches on each profile. They default to on, because an email
--     nobody asked for is better than a message nobody ever sees, but every
--     one of them can be turned off from Edit Profile. There is deliberately
--     no switch for the approval email: that email carries the login link, so
--     it is how somebody gets in rather than something they subscribe to.
--
--  2. A log of what has already been sent. This is what stops the same
--     reminder going out every night the cron runs, and it is enforced by a
--     unique constraint rather than by the code remembering to check.
--
-- Nobody reads this table through the site. Only the service role writes to it,
-- from the API routes, so RLS is on with no policies at all: members get an
-- empty result rather than each other's notification history.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. The switches ──────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_messages        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_endorsements    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_event_reminders BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.notify_messages IS
  'Email me when another member sends me a message. One email per conversation
   until I have read it, so a fast back and forth does not become ten emails.';
COMMENT ON COLUMN profiles.notify_endorsements IS
  'Email me when somebody endorses me.';
COMMENT ON COLUMN profiles.notify_event_reminders IS
  'Email me the day before something I said I am attending.';

-- ── 2. What has already been sent ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 'endorsement' | 'event_reminder'. Messages are not logged here: whether to
  -- send one is decided by looking at the recipient's unread messages, which is
  -- self correcting in a way a log is not.
  kind        TEXT        NOT NULL,

  -- Whatever makes this notification unique. The endorsement row's id, or the
  -- production date's id. Text rather than uuid so a future kind can key on
  -- something that is not a uuid without another migration.
  ref_id      TEXT        NOT NULL,

  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- The whole point of the table. A second attempt to send the same thing hits
  -- this and stops, even if two crons overlap.
  UNIQUE (profile_id, kind, ref_id)
);

CREATE INDEX IF NOT EXISTS notification_log_lookup
  ON notification_log (kind, ref_id);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies. The service role bypasses RLS and is the only
-- thing that touches this table. Anyone else reading it gets nothing back.

COMMENT ON TABLE notification_log IS
  'One row per notification actually sent. Exists to stop duplicates; the unique
   constraint is the mechanism, not the code. Service role only.';

-- ── Check it worked ──────────────────────────────────────────────────────────
--   select notify_messages, notify_endorsements, notify_event_reminders
--     from profiles limit 1;                      -- three trues
--   select count(*) from notification_log;        -- 0 to start with
