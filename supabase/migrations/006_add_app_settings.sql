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
