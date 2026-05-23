-- Migration v8: Community resource submissions
-- Run in Supabase SQL Editor after v1–v7.

CREATE TABLE IF NOT EXISTS resource_submissions (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_name    TEXT        NOT NULL,
  resource_url     TEXT        NOT NULL,
  description      TEXT,
  category         TEXT,        -- one of the 10 directory categories, or 'Other'
  special_tags     TEXT[]      DEFAULT '{}',  -- e.g. ['Disabled Voice', 'Deaf-Centered', 'Open Access']
  submitter_name   TEXT,
  submitter_email  TEXT,
  submitter_user_id uuid       REFERENCES auth.users(id) ON DELETE SET NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  admin_notes      TEXT,
  created_at       timestamptz DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE resource_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (including public) can submit a resource suggestion
CREATE POLICY "Anyone can submit a resource"
  ON resource_submissions FOR INSERT
  WITH CHECK (true);

-- Anyone can read submissions (counts, etc.)
CREATE POLICY "Anyone can read resource submissions"
  ON resource_submissions FOR SELECT
  USING (true);

-- Admins can update status, add notes
CREATE POLICY "Admins can update resource submissions"
  ON resource_submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

COMMENT ON TABLE resource_submissions IS
  'Community-submitted resource suggestions. Status: pending | approved | rejected. Approved submissions should be manually added to the resources page code.';
COMMENT ON COLUMN resource_submissions.status IS
  'pending | approved | rejected';
