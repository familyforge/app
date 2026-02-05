-- FamilyForge: Data Export Requests Table
-- This table stores user requests for data export (GDPR compliance)
-- Admins can view and process these requests

-- Create the data_export_requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_requested_at ON data_export_requests(requested_at DESC);

-- Enable Row Level Security
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own export requests
CREATE POLICY "Users can view own export requests"
  ON data_export_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own export requests
CREATE POLICY "Users can create own export requests"
  ON data_export_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all export requests
CREATE POLICY "Admins can view all export requests"
  ON data_export_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parents
      WHERE parents.id = auth.uid()
      AND parents.role = 'admin'
    )
  );

-- Policy: Admins can update export requests
CREATE POLICY "Admins can update export requests"
  ON data_export_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM parents
      WHERE parents.id = auth.uid()
      AND parents.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_data_export_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_export_requests_timestamp
  BEFORE UPDATE ON data_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_data_export_requests_updated_at();

-- Add comment to table
COMMENT ON TABLE data_export_requests IS 'Stores user data export requests for GDPR compliance. Admins process these requests and provide download links.';
