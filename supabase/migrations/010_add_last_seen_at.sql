-- Add last_seen_at column to parents table for presence tracking
ALTER TABLE parents ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Create index for efficient "who's online" queries
CREATE INDEX IF NOT EXISTS idx_parents_last_seen_at ON parents(last_seen_at DESC NULLS LAST);

-- Allow parents to update their own last_seen_at
CREATE POLICY "Parents can update own last_seen_at"
  ON parents FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
