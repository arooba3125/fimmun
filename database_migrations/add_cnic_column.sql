-- Add CNIC column to all registration tables
-- Migration: add_cnic_column.sql
-- Description: Adds CNIC (Computerized National Identity Card) field to all registration tables

-- Add CNIC to observers table
ALTER TABLE public.observers 
ADD COLUMN IF NOT EXISTS cnic TEXT NULL;

-- Add CNIC to private_delegates table
ALTER TABLE public.private_delegates 
ADD COLUMN IF NOT EXISTS cnic TEXT NULL;

-- Add CNIC to delegations table
ALTER TABLE public.delegations 
ADD COLUMN IF NOT EXISTS cnic TEXT NULL;

-- Add CNIC to alumni table
ALTER TABLE public.alumni 
ADD COLUMN IF NOT EXISTS cnic TEXT NULL;

-- Add CNIC to delegation_members table
ALTER TABLE public.delegation_members 
ADD COLUMN IF NOT EXISTS cnic TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.observers.cnic IS 'National Identity Card Number';
COMMENT ON COLUMN public.private_delegates.cnic IS 'National Identity Card Number';
COMMENT ON COLUMN public.delegations.cnic IS 'Head Delegate National Identity Card Number';
COMMENT ON COLUMN public.alumni.cnic IS 'National Identity Card Number';
COMMENT ON COLUMN public.delegation_members.cnic IS 'National Identity Card Number';

