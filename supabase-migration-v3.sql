-- Migration v3: Myspace-style profile enhancements
-- Run this in Supabase SQL Editor after v1 and v2 migrations.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS highlights        TEXT,
  ADD COLUMN IF NOT EXISTS video_links       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS activities        TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_bg_color  TEXT    DEFAULT '#263590',
  ADD COLUMN IF NOT EXISTS top_8_ids         UUID[]  DEFAULT '{}';

-- messages table for in-app DMs (30-day expiry)
CREATE TABLE IF NOT EXISTS messages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body          TEXT        NOT NULL CHECK (char_length(body) <= 2000),
  read          BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Index for fast inbox queries
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx    ON messages (sender_id,    created_at DESC);
-- Index for the expiry cleanup job
CREATE INDEX IF NOT EXISTS messages_expires_idx   ON messages (expires_at);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Sender and recipient can read the message
CREATE POLICY "Message parties can read"
  ON messages FOR SELECT
  USING (
    sender_id    = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    OR
    recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- Only the sender can insert
CREATE POLICY "Sender can insert"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- Recipient can mark as read; sender can do nothing else
CREATE POLICY "Recipient can update read flag"
  ON messages FOR UPDATE
  USING (
    recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- Either party can delete their own messages
CREATE POLICY "Message parties can delete"
  ON messages FOR DELETE
  USING (
    sender_id    = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    OR
    recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- Scheduled cleanup: delete expired messages.
-- Run this as a daily cron in Supabase (Dashboard → Database → Cron Jobs):
--   SELECT delete_expired_messages();
-- Or enable pg_cron and schedule:
--   SELECT cron.schedule('delete-expired-messages', '0 3 * * *', 'SELECT delete_expired_messages();');

CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM messages WHERE expires_at < now();
$$;
