-- Create registration_settings table
CREATE TABLE IF NOT EXISTS registration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on setting_key for faster lookups
CREATE INDEX idx_registration_settings_key ON registration_settings(setting_key);

-- Insert default alumni registration setting
INSERT INTO registration_settings (setting_key, setting_value, description)
VALUES ('alumni_registration_active', false, 'Controls whether alumni registration is open or closed')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_registration_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_registration_settings_updated_at
  BEFORE UPDATE ON registration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_registration_settings_updated_at();

-- Enable RLS
ALTER TABLE registration_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read settings (needed for frontend)
CREATE POLICY "Allow public read access to registration_settings"
  ON registration_settings
  FOR SELECT
  USING (true);

-- Allow service role to manage settings (for admin)
CREATE POLICY "Allow service role full access to registration_settings"
  ON registration_settings
  FOR ALL
  USING (true);

-- Grant permissions
GRANT SELECT ON registration_settings TO anon, authenticated;
GRANT ALL ON registration_settings TO service_role;

COMMENT ON TABLE registration_settings IS 'Stores dynamic registration settings that can be controlled from admin portal';
COMMENT ON COLUMN registration_settings.setting_key IS 'Unique key identifier for the setting';
COMMENT ON COLUMN registration_settings.setting_value IS 'Boolean value indicating if setting is active/enabled';
COMMENT ON COLUMN registration_settings.description IS 'Human-readable description of what this setting controls';
COMMENT ON COLUMN registration_settings.updated_by IS 'Email or identifier of the admin who last updated this setting';

