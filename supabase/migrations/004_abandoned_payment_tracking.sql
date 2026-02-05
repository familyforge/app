-- Migration: Add abandoned payment tracking and email scheduling
-- This tracks payment sessions and schedules follow-up emails

-- Table to track abandoned payment sessions
CREATE TABLE IF NOT EXISTS abandoned_payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  parent_name TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Pro',
  stripe_session_id TEXT,
  abandoned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE, -- NULL if still abandoned
  unsubscribed_at TIMESTAMP WITH TIME ZONE, -- NULL if still receiving emails
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to track which reminder emails have been sent
CREATE TABLE IF NOT EXISTS abandoned_payment_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES abandoned_payment_sessions(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- '1hr', '24hr', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resend_email_id TEXT, -- ID from Resend API
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to track free plan users for weekly nudge emails
CREATE TABLE IF NOT EXISTS free_plan_email_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  parent_name TEXT,
  last_nudge_sent_at TIMESTAMP WITH TIME ZONE,
  nudge_count INTEGER NOT NULL DEFAULT 0,
  unsubscribed_at TIMESTAMP WITH TIME ZONE, -- NULL if still receiving emails
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_abandoned_sessions_user ON abandoned_payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_sessions_abandoned_at ON abandoned_payment_sessions(abandoned_at) 
  WHERE completed_at IS NULL AND unsubscribed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_abandoned_emails_session ON abandoned_payment_emails(session_id);
CREATE INDEX IF NOT EXISTS idx_free_plan_schedule_user ON free_plan_email_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_free_plan_schedule_last_sent ON free_plan_email_schedule(last_nudge_sent_at)
  WHERE unsubscribed_at IS NULL;

-- Row Level Security
ALTER TABLE abandoned_payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_payment_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_plan_email_schedule ENABLE ROW LEVEL SECURITY;

-- Policies: Only service role can manage these (backend only)
CREATE POLICY "Service role full access to abandoned_payment_sessions" 
  ON abandoned_payment_sessions FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to abandoned_payment_emails" 
  ON abandoned_payment_emails FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to free_plan_email_schedule" 
  ON free_plan_email_schedule FOR ALL 
  USING (auth.role() = 'service_role');

-- Users can view their own records
CREATE POLICY "Users can view own abandoned_payment_sessions" 
  ON abandoned_payment_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own free_plan_email_schedule" 
  ON free_plan_email_schedule FOR SELECT 
  USING (auth.uid() = user_id);

-- Function to track abandoned payment
CREATE OR REPLACE FUNCTION track_abandoned_payment(
  p_user_id UUID,
  p_email TEXT,
  p_parent_name TEXT,
  p_plan_name TEXT DEFAULT 'Pro',
  p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO abandoned_payment_sessions (
    user_id, email, parent_name, plan_name, stripe_session_id
  ) VALUES (
    p_user_id, p_email, p_parent_name, p_plan_name, p_stripe_session_id
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

-- Function to mark payment as completed (stops follow-up emails)
CREATE OR REPLACE FUNCTION complete_payment_session(
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE abandoned_payment_sessions
  SET completed_at = NOW(), updated_at = NOW()
  WHERE id = p_session_id AND completed_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to unsubscribe from abandoned payment emails
CREATE OR REPLACE FUNCTION unsubscribe_abandoned_emails(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE abandoned_payment_sessions
  SET unsubscribed_at = NOW(), updated_at = NOW()
  WHERE user_id = p_user_id AND unsubscribed_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to get sessions needing reminder emails
CREATE OR REPLACE FUNCTION get_pending_abandoned_emails()
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  email TEXT,
  parent_name TEXT,
  plan_name TEXT,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  hours_since_abandoned INTEGER,
  emails_sent TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    s.user_id,
    s.email,
    s.parent_name,
    s.plan_name,
    s.abandoned_at,
    EXTRACT(EPOCH FROM (NOW() - s.abandoned_at)) / 3600 as hours_since_abandoned,
    ARRAY_AGG(DISTINCT e.email_type) FILTER (WHERE e.email_type IS NOT NULL) as emails_sent
  FROM abandoned_payment_sessions s
  LEFT JOIN abandoned_payment_emails e ON s.id = e.session_id
  WHERE s.completed_at IS NULL 
    AND s.unsubscribed_at IS NULL
    AND s.abandoned_at > NOW() - INTERVAL '8 days' -- Stop after 7 days
  GROUP BY s.id, s.user_id, s.email, s.parent_name, s.plan_name, s.abandoned_at;
END;
$$;

-- Function to record sent email
CREATE OR REPLACE FUNCTION record_abandoned_email_sent(
  p_session_id UUID,
  p_email_type TEXT,
  p_resend_email_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_id UUID;
BEGIN
  INSERT INTO abandoned_payment_emails (session_id, email_type, resend_email_id)
  VALUES (p_session_id, p_email_type, p_resend_email_id)
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;

-- Function to register free plan user for weekly emails
CREATE OR REPLACE FUNCTION register_free_plan_user(
  p_user_id UUID,
  p_email TEXT,
  p_parent_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO free_plan_email_schedule (user_id, email, parent_name)
  VALUES (p_user_id, p_email, p_parent_name)
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      parent_name = COALESCE(EXCLUDED.parent_name, free_plan_email_schedule.parent_name),
      updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Function to get free plan users needing weekly email
CREATE OR REPLACE FUNCTION get_free_plan_users_for_weekly_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  parent_name TEXT,
  nudge_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.user_id,
    f.email,
    f.parent_name,
    f.nudge_count
  FROM free_plan_email_schedule f
  WHERE f.unsubscribed_at IS NULL
    AND (f.last_nudge_sent_at IS NULL OR f.last_nudge_sent_at < NOW() - INTERVAL '7 days');
END;
$$;

-- Function to mark free plan email as sent
CREATE OR REPLACE FUNCTION mark_free_plan_email_sent(
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE free_plan_email_schedule
  SET last_nudge_sent_at = NOW(),
      nudge_count = nudge_count + 1,
      updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Function to unsubscribe from free plan emails
CREATE OR REPLACE FUNCTION unsubscribe_free_plan_emails(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE free_plan_email_schedule
  SET unsubscribed_at = NOW(), updated_at = NOW()
  WHERE user_id = p_user_id AND unsubscribed_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to remove user from free plan schedule (when they upgrade)
CREATE OR REPLACE FUNCTION remove_from_free_plan_schedule(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM free_plan_email_schedule
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;
