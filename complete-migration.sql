-- Pro Parenting App - Initial Database Schema
-- Supabase PostgreSQL Migration
-- Run this in Supabase SQL Editor or via migrations

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE task_type AS ENUM ('chore', 'exercise', 'personal_care');
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'skipped');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE theme_type AS ENUM ('dark', 'light', 'system');
CREATE TYPE user_role AS ENUM ('parent', 'admin', 'superadmin');

-- ============================================
-- TABLES
-- ============================================

-- Parents table (linked to Supabase Auth)
CREATE TABLE parents (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    role user_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Children table
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    picture TEXT,
    avatar TEXT,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 18),
    class TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type task_type NOT NULL DEFAULT 'chore',
    category TEXT NOT NULL DEFAULT 'chore',
    points INTEGER NOT NULL DEFAULT 0,
    negative_points INTEGER NOT NULL DEFAULT 0,
    status task_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Rewards table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    points_required INTEGER NOT NULL DEFAULT 0,
    redeemed BOOLEAN NOT NULL DEFAULT FALSE,
    redeemed_by_child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    date_earned TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    redeemed_at TIMESTAMPTZ
);

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    points_per_question INTEGER NOT NULL DEFAULT 1,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    marked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    rewards_redeemed INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(child_id, date)
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID UNIQUE NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    theme theme_type NOT NULL DEFAULT 'dark',
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    reminders BOOLEAN NOT NULL DEFAULT TRUE,
    points_to_money_rate DECIMAL(10,2) NOT NULL DEFAULT 0.01,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offline sync queue table
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

-- Parents indexes
CREATE INDEX idx_parents_email ON parents(email);
CREATE INDEX idx_parents_role ON parents(role);

-- Children indexes
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_children_name ON children(name);

-- Tasks indexes
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Rewards indexes
CREATE INDEX idx_rewards_child_id ON rewards(child_id);
CREATE INDEX idx_rewards_redeemed ON rewards(redeemed);
CREATE INDEX idx_rewards_points_required ON rewards(points_required);

-- Exercises indexes
CREATE INDEX idx_exercises_child_id ON exercises(child_id);
CREATE INDEX idx_exercises_completed ON exercises(completed);
CREATE INDEX idx_exercises_subject ON exercises(subject);

-- Reports indexes
CREATE INDEX idx_reports_child_id ON reports(child_id);
CREATE INDEX idx_reports_date ON reports(date);

-- Settings indexes
CREATE INDEX idx_settings_parent_id ON settings(parent_id);

-- Sync queue indexes
CREATE INDEX idx_sync_queue_parent_id ON sync_queue(parent_id);
CREATE INDEX idx_sync_queue_synced ON sync_queue(synced);
CREATE INDEX idx_sync_queue_created_at ON sync_queue(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_parents_updated_at
    BEFORE UPDATE ON parents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
    BEFORE UPDATE ON children
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get child statistics
CREATE OR REPLACE FUNCTION get_child_stats(child_uuid UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    total_points INTEGER,
    rewards_redeemed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM tasks WHERE child_id = child_uuid) AS total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE child_id = child_uuid AND status = 'completed') AS completed_tasks,
        (SELECT COALESCE(points, 0) FROM children WHERE id = child_uuid) AS total_points,
        (SELECT COUNT(*) FROM rewards WHERE redeemed_by_child_id = child_uuid AND redeemed = TRUE) AS rewards_redeemed;
END;
$$ LANGUAGE plpgsql;

-- Function to get parent analytics
CREATE OR REPLACE FUNCTION get_parent_analytics(parent_uuid UUID)
RETURNS TABLE (
    total_children BIGINT,
    total_tasks_completed BIGINT,
    total_points_earned BIGINT,
    total_rewards_redeemed BIGINT,
    completion_rate DECIMAL
) AS $$
DECLARE
    child_ids UUID[];
    total_tasks BIGINT;
    completed BIGINT;
BEGIN
    -- Get all child IDs for this parent
    SELECT ARRAY_AGG(id) INTO child_ids FROM children WHERE parent_id = parent_uuid;
    
    -- Calculate totals
    SELECT COUNT(*) INTO total_tasks FROM tasks WHERE child_id = ANY(child_ids);
    SELECT COUNT(*) INTO completed FROM tasks WHERE child_id = ANY(child_ids) AND status = 'completed';
    
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM children WHERE parent_id = parent_uuid) AS total_children,
        completed AS total_tasks_completed,
        (SELECT COALESCE(SUM(points), 0) FROM children WHERE parent_id = parent_uuid) AS total_points_earned,
        (SELECT COUNT(*) FROM rewards WHERE redeemed_by_child_id = ANY(child_ids) AND redeemed = TRUE) AS total_rewards_redeemed,
        CASE WHEN total_tasks > 0 THEN (completed::DECIMAL / total_tasks::DECIMAL * 100) ELSE 0 END AS completion_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to update child points on task completion
CREATE OR REPLACE FUNCTION update_child_points_on_task()
RETURNS TRIGGER AS $$
BEGIN
    -- If task was completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE children
        SET points = points + NEW.points
        WHERE id = NEW.child_id;
    END IF;
    
    -- If task was uncompleted (reverted)
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        UPDATE children
        SET points = points - OLD.points
        WHERE id = NEW.child_id;
    END IF;
    
    -- If task was skipped, apply negative points
    IF NEW.status = 'skipped' AND OLD.status = 'pending' THEN
        UPDATE children
        SET points = GREATEST(0, points - NEW.negative_points)
        WHERE id = NEW.child_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_child_points
    AFTER UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_child_points_on_task();

-- Function to deduct points on reward redemption
CREATE OR REPLACE FUNCTION deduct_points_on_reward_redemption()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.redeemed = TRUE AND OLD.redeemed = FALSE AND NEW.redeemed_by_child_id IS NOT NULL THEN
        UPDATE children
        SET points = points - NEW.points_required
        WHERE id = NEW.redeemed_by_child_id AND points >= NEW.points_required;
        
        -- Check if deduction was successful
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient points for reward redemption';
        END IF;
        
        NEW.redeemed_at = NOW();
        NEW.date_earned = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_points_on_redemption
    BEFORE UPDATE OF redeemed ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION deduct_points_on_reward_redemption();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Parents policies
CREATE POLICY "Users can view own profile" ON parents
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON parents
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all parents" ON parents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Children policies
CREATE POLICY "Parents can view own children" ON children
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own children" ON children
    FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children" ON children
    FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children" ON children
    FOR DELETE USING (parent_id = auth.uid());

CREATE POLICY "Admins can view all children" ON children
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Tasks policies
CREATE POLICY "Parents can manage tasks for own children" ON tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM children WHERE children.id = tasks.child_id AND children.parent_id = auth.uid())
    );

CREATE POLICY "Admins can view all tasks" ON tasks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Rewards policies
CREATE POLICY "Parents can manage rewards for own children" ON rewards
    FOR ALL USING (
        child_id IS NULL OR
        EXISTS (SELECT 1 FROM children WHERE children.id = rewards.child_id AND children.parent_id = auth.uid())
    );

CREATE POLICY "Admins can manage all rewards" ON rewards
    FOR ALL USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Exercises policies
CREATE POLICY "Parents can manage exercises for own children" ON exercises
    FOR ALL USING (
        EXISTS (SELECT 1 FROM children WHERE children.id = exercises.child_id AND children.parent_id = auth.uid())
    );

-- Reports policies
CREATE POLICY "Parents can view reports for own children" ON reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM children WHERE children.id = reports.child_id AND children.parent_id = auth.uid())
    );

CREATE POLICY "Parents can insert reports for own children" ON reports
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM children WHERE children.id = reports.child_id AND children.parent_id = auth.uid())
    );

-- Settings policies
CREATE POLICY "Users can manage own settings" ON settings
    FOR ALL USING (parent_id = auth.uid());

-- Sync queue policies
CREATE POLICY "Users can manage own sync queue" ON sync_queue
    FOR ALL USING (parent_id = auth.uid());

-- ============================================
-- INITIAL DATA (Optional - for testing)
-- ============================================

-- Note: Run these manually in Supabase SQL Editor for testing
-- INSERT INTO parents (id, email, name, password_hash, role)
-- VALUES ('your-auth-user-id', 'admin@proparenting.com', 'Admin User', '', 'admin');
-- Add school field to children profiles
ALTER TABLE children
ADD COLUMN IF NOT EXISTS school TEXT;

-- Optional index for school lookups
CREATE INDEX IF NOT EXISTS idx_children_school ON children(school);
-- Add profile, routines, and goals tables for parent control center

create table if not exists public.parent_profiles (
  parent_id uuid primary key references public.parents(id) on delete cascade,
  name text,
  avatar_url text,
  timezone text,
  language text,
  role text,
  tone text,
  goal text,
  preferences jsonb,
  notifications jsonb,
  privacy jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.parent_routines (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade,
  type text not null,
  title text not null,
  steps text[] default '{}',
  reminder_time text,
  reminder_enabled boolean default true,
  streak integer default 0,
  last_completed_date date,
  updated_at timestamptz default now()
);

create table if not exists public.parent_goals (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade,
  title text not null,
  description text,
  target_days integer default 14,
  current_streak integer default 0,
  updated_at timestamptz default now()
);

-- Extend children table with profile details
alter table public.children
  add column if not exists nickname text,
  add column if not exists birthday date,
  add column if not exists school_schedule text,
  add column if not exists interests text[],
  add column if not exists learning_style text,
  add column if not exists special_needs text,
  add column if not exists archived boolean default false;

create index if not exists parent_profiles_parent_id_idx on public.parent_profiles(parent_id);
create index if not exists parent_routines_parent_id_idx on public.parent_routines(parent_id);
create index if not exists parent_goals_parent_id_idx on public.parent_goals(parent_id);
create index if not exists children_archived_idx on public.children(archived);
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
-- FamilyForge: Global app settings for subscription pricing

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  plan_prices jsonb NOT NULL DEFAULT '{
    "free": { "monthly": 0, "yearly": 0 },
    "pro": { "monthly": 6.99, "yearly": 5.24 },
    "forge": { "monthly": 9.99, "yearly": 7.49 }
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE PROCEDURE update_app_settings_updated_at();

INSERT INTO app_settings (key)
VALUES ('subscription_prices')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
-- FamilyForge: Admin users with hashed passwords

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE PROCEDURE update_admin_users_updated_at();

ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
-- FamilyForge: add plan_code to parents table

ALTER TABLE parents
ADD COLUMN IF NOT EXISTS plan_code text DEFAULT 'free';
