-- FamilyForge Admin Analytics & Tracking Schema
-- Migration 009: Comprehensive analytics infrastructure

-- ============================================
-- ACTIVITY & EVENT TRACKING
-- ============================================

-- User activity log for audit trail
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'general',
  event_data JSONB DEFAULT '{}',
  device_type TEXT,
  platform TEXT,
  os_version TEXT,
  app_version TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding events tracking
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_index INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  device_type TEXT,
  platform TEXT,
  country TEXT,
  acquisition_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  device_type TEXT,
  platform TEXT,
  os_version TEXT,
  app_version TEXT,
  screens_visited TEXT[] DEFAULT '{}',
  actions_count INTEGER DEFAULT 0
);

-- ============================================
-- SUBSCRIPTION & REVENUE TRACKING
-- ============================================

-- Subscription events log
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'trial_started', 'converted', 'renewed', 'cancelled', 'failed_payment', 'reactivated'
  plan_code TEXT,
  billing_cycle TEXT, -- 'monthly', 'yearly'
  platform TEXT, -- 'ios', 'android', 'web'
  amount_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  previous_plan TEXT,
  trial_days_remaining INTEGER,
  grace_period_days INTEGER,
  failure_reason TEXT,
  external_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue snapshots (daily aggregation)
CREATE TABLE IF NOT EXISTS revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE UNIQUE NOT NULL,
  mrr_cents INTEGER DEFAULT 0,
  arr_cents INTEGER DEFAULT 0,
  new_mrr_cents INTEGER DEFAULT 0,
  churned_mrr_cents INTEGER DEFAULT 0,
  expansion_mrr_cents INTEGER DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  churned_subscribers INTEGER DEFAULT 0,
  trial_users INTEGER DEFAULT 0,
  trial_conversions INTEGER DEFAULT 0,
  free_users INTEGER DEFAULT 0,
  forge_plan_users INTEGER DEFAULT 0,
  pro_plan_users INTEGER DEFAULT 0,
  ios_subscribers INTEGER DEFAULT 0,
  android_subscribers INTEGER DEFAULT 0,
  web_subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APP HEALTH & ERROR TRACKING
-- ============================================

-- App crashes and errors
CREATE TABLE IF NOT EXISTS app_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL, -- 'crash', 'exception', 'network_error', 'validation_error'
  error_message TEXT,
  error_stack TEXT,
  component TEXT,
  screen TEXT,
  device_type TEXT,
  platform TEXT,
  os_version TEXT,
  app_version TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  device_type TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_date DATE DEFAULT CURRENT_DATE
);

-- Unique constraint on feature usage per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_usage_daily_unique 
ON feature_usage(feature_name, parent_id, usage_date);

-- Trigger to auto-set usage_date from created_at
CREATE OR REPLACE FUNCTION set_feature_usage_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.usage_date := (NEW.created_at AT TIME ZONE 'UTC')::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_feature_usage_date
  BEFORE INSERT ON feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION set_feature_usage_date();

-- ============================================
-- ENGAGEMENT METRICS
-- ============================================

-- Daily active user snapshots
CREATE TABLE IF NOT EXISTS engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  dau INTEGER DEFAULT 0, -- Daily Active Users
  wau INTEGER DEFAULT 0, -- Weekly Active Users  
  mau INTEGER DEFAULT 0, -- Monthly Active Users
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  rewards_created INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  avg_sessions_per_user DECIMAL(5,2) DEFAULT 0,
  retention_d1 DECIMAL(5,2) DEFAULT 0,
  retention_d7 DECIMAL(5,2) DEFAULT 0,
  retention_d30 DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- User streaks and habits
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL, -- 'daily_login', 'task_completion', 'learning', 'routine'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, streak_type)
);

-- ============================================
-- ADMIN AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'view', 'edit', 'delete', 'flag', 'reset', 'export'
  target_type TEXT, -- 'user', 'subscription', 'task', 'report'
  target_id UUID,
  action_data JSONB DEFAULT '{}',
  ip_address TEXT,
  reversible BOOLEAN DEFAULT TRUE,
  reversed_at TIMESTAMPTZ,
  reversed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User support notes
CREATE TABLE IF NOT EXISTS user_support_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- 'general', 'issue', 'resolution', 'escalation'
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User flags
CREATE TABLE IF NOT EXISTS user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL, -- 'at_risk', 'churned', 'vip', 'support_needed', 'abuse_suspected'
  flag_reason TEXT,
  flagged_by TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_activity_log_parent_id ON user_activity_log(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON user_activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON user_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_onboarding_parent_id ON onboarding_events(parent_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_name ON onboarding_events(step_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON onboarding_events(completed);

CREATE INDEX IF NOT EXISTS idx_sessions_parent_id ON user_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON user_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_subscription_events_parent_id ON subscription_events(parent_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_app_errors_type ON app_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_app_errors_occurred_at ON app_errors(occurred_at);

CREATE INDEX IF NOT EXISTS idx_feature_usage_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_created_at ON feature_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_engagement_date ON engagement_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_streaks_parent_id ON user_streaks(parent_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_support_notes_parent_id ON user_support_notes(parent_id);

CREATE INDEX IF NOT EXISTS idx_user_flags_parent_id ON user_flags(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_type ON user_flags(flag_type);

-- ============================================
-- VIEWS FOR ANALYTICS QUERIES
-- ============================================

-- User lifecycle view
CREATE OR REPLACE VIEW user_lifecycle_view AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.subscription_tier,
  p.created_at AS signed_up_at,
  COALESCE(
    (SELECT MAX(completed_at) FROM onboarding_events WHERE parent_id = p.id AND completed = true),
    NULL
  ) AS onboarding_completed_at,
  COALESCE(
    (SELECT COUNT(*) FROM onboarding_events WHERE parent_id = p.id AND completed = true),
    0
  ) AS onboarding_steps_completed,
  COALESCE(
    (SELECT MAX(created_at) FROM user_activity_log WHERE parent_id = p.id),
    p.created_at
  ) AS last_activity_at,
  CASE 
    WHEN (SELECT MAX(created_at) FROM user_activity_log WHERE parent_id = p.id) > NOW() - INTERVAL '7 days' THEN 'active'
    WHEN (SELECT MAX(created_at) FROM user_activity_log WHERE parent_id = p.id) > NOW() - INTERVAL '30 days' THEN 'inactive'
    WHEN (SELECT MAX(created_at) FROM user_activity_log WHERE parent_id = p.id) IS NOT NULL THEN 'churned'
    ELSE 'signed_up'
  END AS lifecycle_state,
  (SELECT COUNT(*) FROM children WHERE parent_id = p.id) AS children_count,
  (SELECT COUNT(*) FROM tasks t JOIN children c ON t.child_id = c.id WHERE c.parent_id = p.id AND t.status = 'completed') AS tasks_completed,
  (SELECT device_type FROM user_sessions WHERE parent_id = p.id ORDER BY started_at DESC LIMIT 1) AS last_device_type,
  (SELECT platform FROM user_sessions WHERE parent_id = p.id ORDER BY started_at DESC LIMIT 1) AS last_platform
FROM parents p;

-- Onboarding funnel view
CREATE OR REPLACE VIEW onboarding_funnel_view AS
SELECT 
  step_name,
  step_index,
  COUNT(DISTINCT parent_id) AS users_started,
  COUNT(DISTINCT CASE WHEN completed = true THEN parent_id END) AS users_completed,
  COUNT(DISTINCT CASE WHEN skipped = true THEN parent_id END) AS users_skipped,
  AVG(time_spent_seconds) AS avg_time_seconds,
  ROUND(
    COUNT(DISTINCT CASE WHEN completed = true THEN parent_id END)::DECIMAL / 
    NULLIF(COUNT(DISTINCT parent_id), 0) * 100, 
    2
  ) AS completion_rate
FROM onboarding_events
GROUP BY step_name, step_index
ORDER BY step_index;

-- Subscription overview view
CREATE OR REPLACE VIEW subscription_overview_view AS
SELECT 
  DATE(created_at) AS date,
  COUNT(CASE WHEN event_type = 'trial_started' THEN 1 END) AS trials_started,
  COUNT(CASE WHEN event_type = 'converted' THEN 1 END) AS conversions,
  COUNT(CASE WHEN event_type = 'cancelled' THEN 1 END) AS cancellations,
  COUNT(CASE WHEN event_type = 'failed_payment' THEN 1 END) AS failed_payments,
  SUM(CASE WHEN event_type = 'converted' THEN amount_cents ELSE 0 END) AS revenue_cents
FROM subscription_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Feature adoption view
CREATE OR REPLACE VIEW feature_adoption_view AS
SELECT 
  feature_name,
  COUNT(DISTINCT parent_id) AS unique_users,
  SUM(usage_count) AS total_uses,
  MAX(last_used_at) AS last_used,
  COUNT(DISTINCT device_type) AS device_types,
  COUNT(DISTINCT platform) AS platforms
FROM feature_usage
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY feature_name
ORDER BY unique_users DESC;

-- Disable RLS on analytics tables for admin access
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_errors DISABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_support_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_flags DISABLE ROW LEVEL SECURITY;
