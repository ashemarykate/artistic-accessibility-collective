-- Migration v9: In-app messaging
-- Run in Supabase SQL Editor after v1–v8.
--
-- Design:
--   One conversation row per pair of members.
--   The pair is normalised so the lexicographically smaller profile UUID
--   is always stored in profile_a_id — enforced by the CHECK below.
--   All message rows belong to a conversation.

-- ── Conversations ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_a_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_b_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),

  -- Prevent self-messaging
  CONSTRAINT no_self_message CHECK (profile_a_id <> profile_b_id),

  -- Enforce lexicographic ordering so each pair has exactly one row
  CONSTRAINT ordered_pair    CHECK (profile_a_id::text < profile_b_id::text),

  -- One row per ordered pair
  UNIQUE (profile_a_id, profile_b_id)
);

-- ── Messages ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id   uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body              TEXT        NOT NULL CHECK (length(trim(body)) > 0),
  sent_at           timestamptz DEFAULT now(),
  read_at           timestamptz,           -- NULL = unread by recipient
  sender_deleted    BOOLEAN     DEFAULT false,
  recipient_deleted BOOLEAN     DEFAULT false
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user a participant?
-- We look up via profiles.user_id since auth.uid() is the auth user,
-- not the profile id.

CREATE POLICY "Participants can read their conversations"
  ON conversations FOR SELECT
  USING (
    profile_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    profile_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can start conversations they are part of"
  ON conversations FOR INSERT
  WITH CHECK (
    profile_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    profile_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Participants can update conversation timestamps"
  ON conversations FOR UPDATE
  USING (
    profile_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    profile_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Messages: only participants can see messages in their conversations
CREATE POLICY "Participants can read messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE profile_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR profile_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Only the sender can insert a message
CREATE POLICY "Members can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE profile_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR profile_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Recipients can mark messages as read (update read_at)
-- Senders can soft-delete their sent messages (update sender_deleted)
-- Recipients can soft-delete received messages (update recipient_deleted)
CREATE POLICY "Participants can update message status"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE profile_a_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR profile_b_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ── Performance indexes ───────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_conv_profile_a       ON conversations (profile_a_id);
CREATE INDEX IF NOT EXISTS idx_conv_profile_b       ON conversations (profile_b_id);
CREATE INDEX IF NOT EXISTS idx_conv_last_msg        ON conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_conversation     ON messages (conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_msg_unread           ON messages (conversation_id, read_at)
  WHERE read_at IS NULL;

-- ── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE conversations IS
  'One row per pair of members. profile_a_id is always the lexicographically smaller UUID.';
COMMENT ON TABLE messages IS
  'Individual messages belonging to a conversation. read_at NULL means unread by recipient. Soft-deletion via sender_deleted / recipient_deleted.';
COMMENT ON COLUMN messages.read_at IS
  'Timestamp when the recipient first viewed this message. NULL = unread.';
