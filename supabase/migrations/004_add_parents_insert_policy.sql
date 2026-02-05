-- Allow authenticated users to insert their own parent profile
-- Fixes: new row violates row-level security policy for table "parents"

CREATE POLICY "Users can insert own profile" ON parents
  FOR INSERT
  WITH CHECK (auth.uid() = id);
