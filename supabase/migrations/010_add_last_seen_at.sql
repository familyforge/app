-- Add last_seen_at column to parents table for presence tracking
ALTER TABLE parents ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Create index for efficient "who's online" queries
CREATE INDEX IF NOT EXISTS idx_parents_last_seen_at ON parents(last_seen_at DESC NULLS LAST);

-- Allow parents to update their own last_seen_at
CREATE POLICY "Parents can update own last_seen_at"
  ON parents FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Add last_seen_at column to children table for child presence tracking
ALTER TABLE children ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Create index for efficient "who's online" queries on children
CREATE INDEX IF NOT EXISTS idx_children_last_seen_at ON children(last_seen_at DESC NULLS LAST);

-- Allow parents to update last_seen_at for their own children
CREATE POLICY "Parents can update child last_seen_at"
  ON children FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());
