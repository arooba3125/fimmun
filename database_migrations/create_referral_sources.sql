-- Create referral_sources table to track how users found out about the event
CREATE TABLE IF NOT EXISTS referral_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_referral_sources_active ON referral_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_sources_count ON referral_sources(count DESC);

-- Insert default referral sources
INSERT INTO referral_sources (name, count) VALUES
  ('Instagram', 0),
  ('Facebook', 0),
  ('Ambassador/Friend', 0),
  ('Previous Participant', 0),
  ('School/Institution', 0),
  ('WhatsApp', 0),
  ('Other', 0)
ON CONFLICT (name) DO NOTHING;

-- Disable RLS for referral_sources table (since we're using admin client)
-- This allows the API to bypass RLS and handle access control at the API level
ALTER TABLE referral_sources DISABLE ROW LEVEL SECURITY;

-- Add referral_source_id column to existing registration tables
ALTER TABLE delegations ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES referral_sources(id);
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES referral_sources(id);
ALTER TABLE observers ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES referral_sources(id);
ALTER TABLE private_delegates ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES referral_sources(id);
ALTER TABLE delegation_members ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES referral_sources(id);

-- Create function to increment referral source count
CREATE OR REPLACE FUNCTION increment_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_source_id IS NOT NULL THEN
    UPDATE referral_sources 
    SET count = count + 1, updated_at = NOW()
    WHERE id = NEW.referral_source_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist before creating new ones
DROP TRIGGER IF EXISTS increment_referral_on_delegation_insert ON delegations;
DROP TRIGGER IF EXISTS increment_referral_on_alumni_insert ON alumni;
DROP TRIGGER IF EXISTS increment_referral_on_observer_insert ON observers;
DROP TRIGGER IF EXISTS increment_referral_on_private_delegate_insert ON private_delegates;
DROP TRIGGER IF EXISTS increment_referral_on_delegation_member_insert ON delegation_members;

-- Create triggers for each registration table
CREATE TRIGGER increment_referral_on_delegation_insert
  AFTER INSERT ON delegations
  FOR EACH ROW
  EXECUTE FUNCTION increment_referral_count();

CREATE TRIGGER increment_referral_on_alumni_insert
  AFTER INSERT ON alumni
  FOR EACH ROW
  EXECUTE FUNCTION increment_referral_count();

CREATE TRIGGER increment_referral_on_observer_insert
  AFTER INSERT ON observers
  FOR EACH ROW
  EXECUTE FUNCTION increment_referral_count();

CREATE TRIGGER increment_referral_on_private_delegate_insert
  AFTER INSERT ON private_delegates
  FOR EACH ROW
  EXECUTE FUNCTION increment_referral_count();

CREATE TRIGGER increment_referral_on_delegation_member_insert
  AFTER INSERT ON delegation_members
  FOR EACH ROW
  EXECUTE FUNCTION increment_referral_count();

