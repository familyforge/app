-- Email System Extension - Additive Migration
-- This migration adds tables for the advanced email system without altering existing structures

-- Email template versions (for version history and rollback)
CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  html_content TEXT,
  plain_text TEXT,
  subject TEXT NOT NULL,
  editor_email TEXT NOT NULL,
  editor_name TEXT,
  changelog TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_template_versions_template ON email_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_email_template_versions_active ON email_template_versions(template_id, is_active) WHERE is_active = true;

-- Email schedules (for scheduled sending)
CREATE TABLE IF NOT EXISTS email_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'cancelled', 'failed')),
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  segment_filters JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_schedules_status ON email_schedules(status);
CREATE INDEX IF NOT EXISTS idx_email_schedules_scheduled ON email_schedules(scheduled_at) WHERE status = 'scheduled';

-- Audience segments (for segmentation)
CREATE TABLE IF NOT EXISTS email_audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  estimated_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email delivery records (for analytics and tracking)
CREATE TABLE IF NOT EXISTS email_delivery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  template_version INTEGER DEFAULT 1,
  schedule_id UUID REFERENCES email_schedules(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_template ON email_delivery_records(template_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_recipient ON email_delivery_records(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_delivery_status ON email_delivery_records(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_sent ON email_delivery_records(sent_at);

-- Email system configuration (singleton table)
CREATE TABLE IF NOT EXISTS email_system_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  global_kill_switch BOOLEAN DEFAULT false,
  kill_switch_enabled_at TIMESTAMPTZ,
  kill_switch_enabled_by TEXT,
  default_from_name TEXT DEFAULT 'FamilyForge',
  default_from_email TEXT DEFAULT 'hello@familyforge.app',
  default_reply_to TEXT DEFAULT 'support@familyforge.app',
  quiet_hours JSONB DEFAULT '{"enabled": false, "startHour": 22, "endHour": 7, "timezone": "UTC", "daysOfWeek": [0,1,2,3,4,5,6]}',
  throttle JSONB DEFAULT '{"enabled": false, "maxPerMinute": 100, "maxPerHour": 1000, "maxPerDay": 10000, "batchSize": 50, "batchDelayMs": 1000}',
  retry_config JSONB DEFAULT '{"maxRetries": 3, "retryDelayMs": 60000, "exponentialBackoff": true}',
  unsubscribe_url TEXT DEFAULT 'https://familyforge.app/unsubscribe',
  company_address TEXT DEFAULT 'FamilyForge, Inc.',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- Insert default config if not exists
INSERT INTO email_system_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- Compliance records (GDPR, unsubscribes)
CREATE TABLE IF NOT EXISTS email_compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('unsubscribe', 'data_export', 'data_deletion', 'consent_update')),
  user_email TEXT NOT NULL,
  user_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  metadata JSONB DEFAULT '{}',
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_compliance_user ON email_compliance_records(user_email);
CREATE INDEX IF NOT EXISTS idx_email_compliance_status ON email_compliance_records(status);

-- Reusable email blocks
CREATE TABLE IF NOT EXISTS email_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('header', 'cta', 'quote', 'steps', 'footer', 'divider', 'feature_card', 'testimonial')),
  html_template TEXT NOT NULL,
  preview_image TEXT,
  variables TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dry-run results (for simulation mode)
CREATE TABLE IF NOT EXISTS email_dry_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  template_name TEXT,
  executed_by TEXT NOT NULL,
  segment_filters JSONB,
  total_recipients INTEGER DEFAULT 0,
  recipients JSONB DEFAULT '[]',
  estimated_send_time TEXT,
  warnings TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email unsubscribe list (for compliance)
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID,
  reason TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'user_request'
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);

-- Daily analytics aggregation (for performance)
CREATE TABLE IF NOT EXISTS email_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2) DEFAULT 0,
  click_rate NUMERIC(5,2) DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  UNIQUE(template_id, date)
);

CREATE INDEX IF NOT EXISTS idx_email_analytics_template_date ON email_analytics_daily(template_id, date);

-- Function to update analytics on delivery record changes
CREATE OR REPLACE FUNCTION update_email_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- This function would aggregate daily stats
  -- Implementation depends on specific requirements
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for security
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_dry_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (adjust based on your auth setup)
CREATE POLICY "Admin full access to email_template_versions" ON email_template_versions FOR ALL USING (true);
CREATE POLICY "Admin full access to email_schedules" ON email_schedules FOR ALL USING (true);
CREATE POLICY "Admin full access to email_audience_segments" ON email_audience_segments FOR ALL USING (true);
CREATE POLICY "Admin full access to email_delivery_records" ON email_delivery_records FOR ALL USING (true);
CREATE POLICY "Admin full access to email_system_config" ON email_system_config FOR ALL USING (true);
CREATE POLICY "Admin full access to email_compliance_records" ON email_compliance_records FOR ALL USING (true);
CREATE POLICY "Admin full access to email_blocks" ON email_blocks FOR ALL USING (true);
CREATE POLICY "Admin full access to email_dry_runs" ON email_dry_runs FOR ALL USING (true);
CREATE POLICY "Admin full access to email_unsubscribes" ON email_unsubscribes FOR ALL USING (true);
CREATE POLICY "Admin full access to email_analytics_daily" ON email_analytics_daily FOR ALL USING (true);
