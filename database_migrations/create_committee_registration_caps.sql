-- Create committee_registration_caps table
-- This table tracks registration counts for each committee
-- It will be updated when delegates are verified

CREATE TABLE IF NOT EXISTS public.committee_registration_caps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  committee_name text NOT NULL,
  max_capacity integer NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT committee_registration_caps_pkey PRIMARY KEY (id),
  CONSTRAINT committee_registration_caps_committee_name_key UNIQUE (committee_name),
  CONSTRAINT committee_registration_caps_max_capacity_check CHECK (max_capacity > 0),
  CONSTRAINT committee_registration_caps_current_count_check CHECK (current_count >= 0)
) TABLESPACE pg_default;

-- Create trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_committee_caps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists (in case of re-running migration)
DROP TRIGGER IF EXISTS update_committee_registration_caps_updated_at ON committee_registration_caps;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_committee_registration_caps_updated_at 
  BEFORE UPDATE ON committee_registration_caps 
  FOR EACH ROW 
  EXECUTE FUNCTION update_committee_caps_updated_at();

-- Insert initial data for committee registration caps
INSERT INTO committee_registration_caps (committee_name, max_capacity, current_count) VALUES
('Pakistan National Assembly', 50, 0),
('Special Crisis Committee', 40, 0),
('United Nations Security Council', 45, 0),
('United Nations Human Rights Council', 50, 0),
('Disarmament and International Security Committee', 45, 0),
('Commission on the Status of Women', 40, 0),
('Organization of Islamic Cooperation', 45, 0)
ON CONFLICT (committee_name) DO UPDATE SET
  max_capacity = EXCLUDED.max_capacity,
  current_count = EXCLUDED.current_count,
  updated_at = NOW();

-- Create index for better performance on committee_name lookups
CREATE INDEX IF NOT EXISTS idx_committee_registration_caps_committee_name ON committee_registration_caps(committee_name);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON committee_registration_caps TO authenticated;
-- GRANT ALL ON committee_registration_caps TO service_role;

COMMENT ON TABLE committee_registration_caps IS 'Stores registration capacity limits and current counts for each committee';
COMMENT ON COLUMN committee_registration_caps.committee_name IS 'Name of the committee';
COMMENT ON COLUMN committee_registration_caps.max_capacity IS 'Maximum number of delegates allowed for this committee';
COMMENT ON COLUMN committee_registration_caps.current_count IS 'Current number of verified delegates in this committee';
