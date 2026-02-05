-- Add school field to children profiles
ALTER TABLE children
ADD COLUMN IF NOT EXISTS school TEXT;

-- Optional index for school lookups
CREATE INDEX IF NOT EXISTS idx_children_school ON children(school);
