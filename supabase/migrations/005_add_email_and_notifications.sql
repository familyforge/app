-- FamilyForge: Email Preferences and Notification Settings
-- This migration adds email preferences for users and notification tracking

-- Add notification_settings column to parents table if not exists
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "routineReminders": true,
  "taskReminders": true,
  "urgentAlerts": true,
  "achievementAlerts": true,
  "motivationalNudges": true,
  "weeklyReports": true,
  "quietHoursEnabled": false,
  "quietHoursStart": "21:00",
  "quietHoursEnd": "07:00"
}'::jsonb;

-- Add sync_settings column to parents table if not exists
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS sync_settings JSONB DEFAULT '{
  "cloudSyncEnabled": true,
  "enabled": true,
  "autoSync": true,
  "lastSyncAt": null
}'::jsonb;

-- Add privacy_settings column to parents table if not exists
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "syncChildData": true,
  "syncAnalytics": false,
  "childDataProtection": true,
  "showPointsToChildren": true,
  "hidePersonalInReports": false,
  "allowAnalytics": true
}'::jsonb;

-- Add push_token column for push notifications
ALTER TABLE parents
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create email_preferences table for detailed email control
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_reminders BOOLEAN DEFAULT true,
  achievement_alerts BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  family_invites BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create family_members table for co-parents and guardians
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'guardian', 'caregiver')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invite_code TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  notification_settings JSONB DEFAULT '{
    "taskReminders": true,
    "achievementAlerts": true,
    "weeklyReports": false
  }'::jsonb,
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add email and notification settings to children table
ALTER TABLE children
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "taskReminders": true,
  "achievementAlerts": true,
  "weeklyReports": false
}'::jsonb;

-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);
CREATE INDEX IF NOT EXISTS idx_family_members_invite_code ON family_members(invite_code);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template);

-- Enable RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_preferences
CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for family_members
CREATE POLICY "Parents can view family members"
  ON family_members FOR SELECT
  USING (
    auth.uid() = family_id OR
    auth.uid() = user_id
  );

CREATE POLICY "Parents can manage family members"
  ON family_members FOR ALL
  USING (auth.uid() = family_id);

-- RLS Policies for email_logs (admin only)
CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parents
      WHERE parents.id = auth.uid()
      AND parents.role = 'admin'
    )
  );

-- Create trigger for updated_at on email_preferences
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_preferences_timestamp
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Create trigger for updated_at on family_members
CREATE TRIGGER update_family_members_timestamp
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Function to get child's country rank
CREATE OR REPLACE FUNCTION get_child_country_rank(child_id UUID, country TEXT)
RETURNS INT AS $$
DECLARE
  rank_position INT;
BEGIN
  SELECT position INTO rank_position
  FROM (
    SELECT 
      c.id,
      ROW_NUMBER() OVER (ORDER BY c.points DESC) as position
    FROM children c
    JOIN parents p ON c.parent_id = p.id
    WHERE p.country = get_child_country_rank.country
  ) ranked
  WHERE ranked.id = child_id;
  
  RETURN rank_position;
END;
$$ LANGUAGE plpgsql;

-- Function to get child's worldwide rank
CREATE OR REPLACE FUNCTION get_child_world_rank(child_id UUID)
RETURNS INT AS $$
DECLARE
  rank_position INT;
BEGIN
  SELECT position INTO rank_position
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY points DESC) as position
    FROM children
  ) ranked
  WHERE ranked.id = child_id;
  
  RETURN rank_position;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE email_preferences IS 'User email notification preferences';
COMMENT ON TABLE family_members IS 'Co-parents and guardians linked to a family';
COMMENT ON TABLE email_logs IS 'Log of all sent emails for debugging and compliance';
